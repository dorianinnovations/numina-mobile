import { io, Socket } from 'socket.io-client';
import CloudAuth from './cloudAuth';
import ENV from '../config/environment';
import { log } from '../utils/logger';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';

interface WebSocketConfig {
  serverUrl: string;
  reconnectionDelay: number;
  maxReconnectionAttempts: number;
  timeout: number;
  authRetryAttempts: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  userId?: string;
  lastError?: string;
}

interface AuthenticatedUserData {
  id: string;
  email: string;
  username?: string;
  tierInfo?: {
    tier: string;
    dailyUsage: number;
    dailyLimit: number;
  };
}

type EventHandler = (data: any) => void;

class EnhancedWebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private connectionStatus: ConnectionStatus;
  private eventHandlers: Map<string, EventHandler[]>;
  private currentRooms: Set<string>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private networkSubscription: any = null;
  private isNetworkAvailable: boolean = true;
  private authRetryTimer: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<boolean> | null = null;

  constructor() {
    // Properly format WebSocket URL
    let wsUrl = ENV.API_BASE_URL;
    
    // Remove /api suffix if present
    if (wsUrl.endsWith('/api')) {
      wsUrl = wsUrl.slice(0, -4);
    }
    
    // Convert HTTP to WebSocket protocol
    wsUrl = wsUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    log.info('Enhanced WebSocket will connect to', { wsUrl }, 'EnhancedWebSocketService');
    
    this.config = {
      serverUrl: wsUrl,
      reconnectionDelay: 3000,
      maxReconnectionAttempts: 5,
      timeout: 20000,
      authRetryAttempts: 3
    };

    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    };

    this.eventHandlers = new Map();
    this.currentRooms = new Set();
    
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring(): void {
    this.networkSubscription = NetInfo.addEventListener(state => {
      const wasNetworkAvailable = this.isNetworkAvailable;
      this.isNetworkAvailable = state.isConnected === true && state.isInternetReachable === true;
      
      if (!wasNetworkAvailable && this.isNetworkAvailable) {
        log.info('Network restored, attempting WebSocket reconnection', null, 'EnhancedWebSocketService');
        this.attemptReconnection();
      } else if (wasNetworkAvailable && !this.isNetworkAvailable) {
        log.warn('Network lost, WebSocket will disconnect', null, 'EnhancedWebSocketService');
      }
    });
  }

  async initialize(): Promise<boolean> {
    // Return existing promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performInitialization();
    return this.connectionPromise;
  }

  private async performInitialization(): Promise<boolean> {
    try {
      // Check network availability first
      if (!this.isNetworkAvailable) {
        log.warn('No network available for WebSocket connection', null, 'EnhancedWebSocketService');
        return false;
      }

      // Clean up existing connection
      if (this.socket) {
        this.cleanupSocket();
      }

      // Get authentication token with validation
      const authData = await this.getValidAuthData();
      if (!authData) {
        log.warn('No valid authentication data for WebSocket', null, 'EnhancedWebSocketService');
        return false;
      }

      log.debug('WebSocket auth data validated', { 
        userId: authData.id, 
        tokenLength: authData.token.length,
        email: authData.email 
      }, 'EnhancedWebSocketService');

      this.connectionStatus.isConnecting = true;
      this.connectionStatus.lastError = undefined;

      // Create socket with enhanced configuration
      this.socket = io(this.config.serverUrl, {
        auth: {
          token: authData.token,
          userId: authData.id,
          email: authData.email,
          userAgent: 'NuminaApp/Mobile'
        },
        transports: ['polling', 'websocket'],
        timeout: this.config.timeout,
        reconnection: false, // We handle reconnection manually
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false,
        autoConnect: true,
        query: {
          platform: 'mobile',
          version: '1.0.0'
        }
      });

      this.setupSocketEventHandlers();

      // Wait for connection with timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          log.warn('WebSocket connection timeout', null, 'EnhancedWebSocketService');
          this.connectionStatus.isConnecting = false;
          this.connectionStatus.lastError = 'Connection timeout';
          this.connectionPromise = null;
          resolve(false);
        }, this.config.timeout);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          this.connectionStatus.isConnected = true;
          this.connectionStatus.isConnecting = false;
          this.connectionStatus.lastConnected = new Date();
          this.connectionStatus.reconnectAttempts = 0;
          this.connectionStatus.userId = authData.id;
          this.connectionPromise = null;
          
          log.info('WebSocket connected successfully', { 
            userId: authData.id,
            socketId: this.socket?.id 
          }, 'EnhancedWebSocketService');
          
          this.emitToHandlers('connection_status', { connected: true });
          resolve(true);
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          this.connectionStatus.isConnecting = false;
          this.connectionStatus.lastError = error.message;
          this.connectionPromise = null;
          
          this.handleConnectionError(error);
          resolve(false);
        });

        this.socket?.once('disconnect', (reason) => {
          clearTimeout(timeout);
          this.handleDisconnection(reason);
        });
      });

    } catch (error) {
      log.error('WebSocket initialization failed', error, 'EnhancedWebSocketService');
      this.connectionStatus.isConnecting = false;
      this.connectionStatus.lastError = error instanceof Error ? error.message : 'Unknown error';
      this.connectionPromise = null;
      return false;
    }
  }

  private async getValidAuthData(): Promise<{ id: string; email: string; token: string } | null> {
    try {
      // First try to get from CloudAuth service
      const cloudAuth = CloudAuth.getInstance();
      const authState = cloudAuth.getState();
      
      if (authState.isAuthenticated && authState.token && authState.user) {
        return {
          id: authState.user.id,
          email: authState.user.email,
          token: authState.token
        };
      }

      // Fallback: try to get from SecureStore
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('userData');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        return {
          id: userData.id,
          email: userData.email,
          token: storedToken
        };
      }

      return null;
    } catch (error) {
      log.error('Failed to get auth data', error, 'EnhancedWebSocketService');
      return null;
    }
  }

  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      log.debug('Socket connected event triggered', { socketId: this.socket?.id }, 'EnhancedWebSocketService');
    });

    this.socket.on('disconnect', (reason) => {
      this.handleDisconnection(reason);
    });

    // Authentication events
    this.socket.on('auth_success', (data) => {
      log.info('WebSocket authentication successful', data, 'EnhancedWebSocketService');
      this.emitToHandlers('auth_success', data);
    });

    this.socket.on('auth_error', (error) => {
      log.error('WebSocket authentication failed', error, 'EnhancedWebSocketService');
      this.connectionStatus.lastError = 'Authentication failed';
      this.emitToHandlers('auth_error', error);
      this.scheduleAuthRetry();
    });

    // Error events
    this.socket.on('error', (error) => {
      log.error('WebSocket error', error, 'EnhancedWebSocketService');
      this.connectionStatus.lastError = error.message || 'Socket error';
      this.emitToHandlers('socket_error', error);
    });

    // Chat and real-time events
    this.setupApplicationEventHandlers();
  }

  private setupApplicationEventHandlers(): void {
    if (!this.socket) return;

    // Chat events
    this.socket.on('new_message', (data) => this.emitToHandlers('new_message', data));
    this.socket.on('user_joined', (data) => this.emitToHandlers('user_joined', data));
    this.socket.on('user_left', (data) => this.emitToHandlers('user_left', data));
    this.socket.on('user_typing', (data) => this.emitToHandlers('user_typing', data));
    this.socket.on('user_stopped_typing', (data) => this.emitToHandlers('user_stopped_typing', data));

    // Analytics and insights
    this.socket.on('live_analytics', (data) => this.emitToHandlers('live_analytics', data));
    this.socket.on('ubpm_notification', (data) => this.emitToHandlers('ubpm_notification', data));
    this.socket.on('ubpm_insight', (data) => this.emitToHandlers('ubpm_insight', data));

    // Tool execution
    this.socket.on('tool_execution_start', (data) => this.emitToHandlers('tool_execution_start', data));
    this.socket.on('tool_execution_complete', (data) => this.emitToHandlers('tool_execution_complete', data));

    // Emotional and social events
    this.socket.on('emotion_updated', (data) => this.emitToHandlers('emotion_updated', data));
    this.socket.on('milestone_achieved', (data) => this.emitToHandlers('milestone_achieved', data));
    this.socket.on('support_request_received', (data) => this.emitToHandlers('support_request_received', data));
  }

  private handleConnectionError(error: any): void {
    log.warn('WebSocket connection failed - app will continue in offline mode', { 
      error: error.message,
      type: error.type,
      description: error.description 
    }, 'EnhancedWebSocketService');

    // Categorize errors for better user experience
    if (error.message?.includes('User not found') || error.message?.includes('auth')) {
      log.warn('🔐 User authentication issue with WebSocket server', null, 'EnhancedWebSocketService');
      this.scheduleAuthRetry();
    } else if (error.message?.includes('timeout')) {
      log.warn('🔌 WebSocket connection timeout - server may be slow', null, 'EnhancedWebSocketService');
      this.scheduleReconnection();
    } else if (error.message?.includes('502') || error.message?.includes('503')) {
      log.warn('🔌 WebSocket server temporarily unavailable', null, 'EnhancedWebSocketService');
      this.scheduleReconnection();
    } else {
      log.warn('🔌 WebSocket connection failed - unknown error', { error: error.message }, 'EnhancedWebSocketService');
      this.scheduleReconnection();
    }

    this.emitToHandlers('connection_error', { error, willRetry: true });
  }

  private handleDisconnection(reason: string): void {
    log.info('WebSocket disconnected', { reason }, 'EnhancedWebSocketService');
    
    this.connectionStatus.isConnected = false;
    this.connectionStatus.isConnecting = false;
    
    this.emitToHandlers('connection_status', { connected: false, reason });

    // Auto-reconnect for certain disconnection reasons
    if (reason === 'io server disconnect') {
      log.info('Server initiated disconnect - will attempt reconnection', null, 'EnhancedWebSocketService');
      this.scheduleReconnection();
    } else if (reason === 'transport close' || reason === 'transport error') {
      log.info('Transport issue - will attempt reconnection', null, 'EnhancedWebSocketService');
      this.scheduleReconnection();
    }
  }

  private scheduleReconnection(): void {
    if (this.reconnectTimer || this.connectionStatus.reconnectAttempts >= this.config.maxReconnectionAttempts) {
      return;
    }

    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(1.5, this.connectionStatus.reconnectAttempts),
      30000
    );

    log.debug('Scheduling WebSocket reconnection', { 
      attempt: this.connectionStatus.reconnectAttempts + 1,
      delay 
    }, 'EnhancedWebSocketService');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectionStatus.reconnectAttempts++;
      this.initialize();
    }, delay);
  }

  private scheduleAuthRetry(): void {
    if (this.authRetryTimer) {
      clearTimeout(this.authRetryTimer);
    }

    // Wait longer for auth retries
    this.authRetryTimer = setTimeout(() => {
      this.authRetryTimer = null;
      log.debug('Retrying WebSocket connection after auth failure', null, 'EnhancedWebSocketService');
      this.initialize();
    }, 10000);
  }

  private attemptReconnection(): void {
    if (this.connectionStatus.isConnecting || this.connectionStatus.isConnected) {
      return;
    }

    log.info('Attempting WebSocket reconnection', null, 'EnhancedWebSocketService');
    this.connectionStatus.reconnectAttempts = 0; // Reset on manual reconnection
    this.initialize();
  }

  private emitToHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          log.error(`Error in WebSocket event handler for ${event}`, error, 'EnhancedWebSocketService');
        }
      });
    }
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Public API methods
  addEventListener(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  removeEventListener(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit(event, data);
    } else {
      log.warn('Cannot emit WebSocket event - not connected', { event }, 'EnhancedWebSocketService');
    }
  }

  joinRoom(roomId: string, roomType: string = 'general'): void {
    this.emit('join_room', { roomId, roomType });
    this.currentRooms.add(roomId);
  }

  leaveRoom(roomId: string): void {
    this.emit('leave_room', { roomId });
    this.currentRooms.delete(roomId);
  }

  sendMessage(roomId: string, message: string, messageType: string = 'text'): void {
    this.emit('send_message', { roomId, message, messageType });
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  isConnected(): boolean {
    return this.connectionStatus.isConnected && this.socket?.connected === true;
  }

  testConnection(): void {
    log.info('🧪 Enhanced WebSocket Connection Test', {
      serverUrl: this.config.serverUrl,
      isConnected: this.connectionStatus.isConnected,
      isConnecting: this.connectionStatus.isConnecting,
      lastConnected: this.connectionStatus.lastConnected,
      reconnectAttempts: this.connectionStatus.reconnectAttempts,
      lastError: this.connectionStatus.lastError,
      currentRooms: Array.from(this.currentRooms),
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
      networkAvailable: this.isNetworkAvailable
    }, 'EnhancedWebSocketService');
  }

  cleanup(): void {
    log.info('Starting enhanced WebSocket cleanup', null, 'EnhancedWebSocketService');
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.authRetryTimer) {
      clearTimeout(this.authRetryTimer);
      this.authRetryTimer = null;
    }

    // Cleanup network monitoring
    if (this.networkSubscription) {
      this.networkSubscription();
      this.networkSubscription = null;
    }
    
    // Cleanup socket
    this.cleanupSocket();
    
    // Clear state
    this.eventHandlers.clear();
    this.currentRooms.clear();
    this.connectionPromise = null;
    
    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    };
    
    log.info('Enhanced WebSocket cleanup completed', null, 'EnhancedWebSocketService');
  }

  destroy(): void {
    this.cleanup();
  }
}

// Export singleton instance
let instance: EnhancedWebSocketService | null = null;

export const getEnhancedWebSocketService = (): EnhancedWebSocketService => {
  if (!instance) {
    instance = new EnhancedWebSocketService();
  }
  return instance;
};

export const destroyEnhancedWebSocketService = (): void => {
  if (instance) {
    instance.destroy();
    instance = null;
    log.info('Enhanced WebSocket service instance destroyed', null, 'EnhancedWebSocketService');
  }
};

export default getEnhancedWebSocketService;