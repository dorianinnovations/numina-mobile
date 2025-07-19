import { io, Socket } from 'socket.io-client';
import CloudAuth from './cloudAuth';
import ENV from '../config/environment';



interface WebSocketConfig {
  serverUrl: string;
  reconnectionDelay: number;
  maxReconnectionAttempts: number;
  timeout: number;
}

interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  userId?: string;
}

interface RoomInfo {
  id: string;
  name: string;
  type: string;
  userCount: number;
  users: Array<{
    id: string;
    email: string;
    username: string;
  }>;
}

interface ChatMessage {
  id: string;
  userId: string;
  userData: {
    id: string;
    email: string;
    username: string;
  };
  message: string;
  messageType: string;
  timestamp: Date;
  roomId: string;
}

interface EmotionUpdate {
  userId: string;
  emotion: string;
  intensity: number;
  context?: string;
  timestamp: Date;
}

interface UserPresence {
  userId: string;
  userData: {
    id: string;
    email: string;
    username: string;
  };
  status: string;
  customMessage?: string;
  lastActivity: Date;
}

type EventHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private connectionStatus: ConnectionStatus;
  private eventHandlers: Map<string, EventHandler[]>;
  private currentRooms: Set<string>;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor() {
    let wsUrl = ENV.API_BASE_URL;
    
    if (wsUrl.endsWith('/api')) {
      wsUrl = wsUrl.slice(0, -4);
    }
    
    wsUrl = wsUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    console.log('🔌 WebSocket will connect to:', wsUrl);
    
    this.config = {
      serverUrl: wsUrl,
      reconnectionDelay: 5000,
      maxReconnectionAttempts: 5,
      timeout: 30000
    };

    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0
    };

    this.eventHandlers = new Map();
    this.currentRooms = new Set();
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.socket) {
        this.disconnect();
      }

      const token = CloudAuth.getInstance().getToken();
      if (!token) {
        console.warn('No auth token found for WebSocket connection');
        return false;
      }
      
      console.log('🔐 WebSocket auth token length:', token.length, 'chars');
      console.log('🔐 WebSocket auth token prefix:', token.substring(0, 20) + '...');

      this.connectionStatus.isConnecting = true;

      this.socket = io(this.config.serverUrl, {
        auth: {
          token: token
        },
        transports: ['polling', 'websocket'],
        timeout: this.config.timeout,
        reconnection: false,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false
      });

      this.setupEventHandlers();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('WebSocket connection timeout');
          this.connectionStatus.isConnecting = false;
          resolve(false);
        }, this.config.timeout);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          this.connectionStatus.lastConnected = new Date();
          console.log('WebSocket connected successfully');
          resolve(true);
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          console.log('🔌 WebSocket connection failed - operating in offline mode');
          
          if (error.message?.includes('User not found')) {
            console.warn('🔐 User not found on WebSocket server, continuing without WebSocket');
          } else if (error.message?.includes('timeout')) {
            console.warn('🔌 WebSocket connection timeout - server may be slow');
          } else if (error.message?.includes('502')) {
            console.warn('🔌 WebSocket server unavailable (502) - app will work without real-time features');
          } else if (error.message?.includes('bad response code')) {
            console.warn('🔌 WebSocket server configuration issue - continuing without WebSocket');
          } else {
            console.warn('🔌 WebSocket error:', error.message);
          }
          
          this.connectionStatus.isConnecting = false;
          resolve(false);
        });
      });

    } catch (error) {
      console.error('WebSocket initialization error:', error);
      this.connectionStatus.isConnecting = false;
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected via event handler');
      this.connectionStatus.isConnected = true;
      this.connectionStatus.isConnecting = false;
      this.connectionStatus.reconnectAttempts = 0;
      this.emitToHandlers('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected - operating in offline mode');
      this.connectionStatus.isConnected = false;
      this.emitToHandlers('connection_status', { connected: false, reason });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.connectionStatus.reconnectAttempts = 0;
      this.emitToHandlers('reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('WebSocket reconnection attempt:', attemptNumber);
      this.connectionStatus.reconnectAttempts = attemptNumber;
      this.emitToHandlers('reconnect_attempt', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.emitToHandlers('reconnect_error', { error });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.emitToHandlers('reconnect_failed', {});
    });

    // Chat events
    this.socket.on('new_message', (data: ChatMessage) => {
      this.emitToHandlers('new_message', data);
    });

    this.socket.on('user_joined', (data: UserPresence) => {
      this.emitToHandlers('user_joined', data);
    });

    this.socket.on('user_left', (data: UserPresence) => {
      this.emitToHandlers('user_left', data);
    });

    this.socket.on('user_typing', (data: UserPresence) => {
      this.emitToHandlers('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data: UserPresence) => {
      this.emitToHandlers('user_stopped_typing', data);
    });

    // Emotion events
    this.socket.on('emotion_updated', (data: EmotionUpdate) => {
      this.emitToHandlers('emotion_updated', data);
    });

    this.socket.on('user_emotion_update', (data: EmotionUpdate) => {
      this.emitToHandlers('user_emotion_update', data);
    });

    // Presence events
    this.socket.on('user_status_update', (data: UserPresence) => {
      this.emitToHandlers('user_status_update', data);
    });

    this.socket.on('user_disconnected', (data: UserPresence) => {
      this.emitToHandlers('user_disconnected', data);
    });

    this.socket.on('online_users', (data: UserPresence[]) => {
      this.emitToHandlers('online_users', data);
    });

    // Room events
    this.socket.on('room_created', (data: RoomInfo) => {
      this.emitToHandlers('room_created', data);
    });

    this.socket.on('room_info', (data: RoomInfo) => {
      this.emitToHandlers('room_info', data);
    });

    this.socket.on('room_not_found', (data: { roomId: string }) => {
      this.emitToHandlers('room_not_found', data);
    });

    // Sync events
    this.socket.on('sync_completed', (data: any) => {
      this.emitToHandlers('sync_completed', data);
    });

    // Analytics events
    this.socket.on('live_analytics', (data: any) => {
      this.emitToHandlers('live_analytics', data);
    });

    // Growth Insights and Milestone events
    this.socket.on('milestone_achieved', (data: any) => {
      this.emitToHandlers('milestone_achieved', data);
    });

    this.socket.on('milestone_celebrated', (data: any) => {
      this.emitToHandlers('milestone_celebrated', data);
    });

    this.socket.on('emotional_share_received', (data: any) => {
      this.emitToHandlers('emotional_share_received', data);
    });

    this.socket.on('support_request_received', (data: any) => {
      this.emitToHandlers('support_request_received', data);
    });

    this.socket.on('growth_insights_updated', (data: any) => {
      this.emitToHandlers('growth_insights_updated', data);
    });

    // Dynamic Numina Senses
    this.socket.on('numina_senses_updated', (data: any) => {
      this.emitToHandlers('numina_senses_updated', data);
    });

    // UBPM Events - User Behavior Profile Model insights
    this.socket.on('ubpm_notification', (data: any) => {
      this.debug('🧠 UBPM notification received:', data);
      this.emitToHandlers('ubpm_notification', data);
    });

    this.socket.on('ubpm_insight', (data: any) => {
      this.debug('🧠 UBPM insight received:', data);
      this.emitToHandlers('ubmp_insight', data);
    });

    // Tool execution events for beautiful status indicators
    this.socket.on('tool_execution_start', (data: any) => {
      this.debug('🔧 Tool execution started:', data);
      this.emitToHandlers('tool_execution_start', data);
    });

    this.socket.on('tool_execution_complete', (data: any) => {
      this.debug('✅ Tool execution completed:', data);
      this.emitToHandlers('tool_execution_complete', data);
    });
  }

  /**
   * Emit event to registered handlers
   */
  private emitToHandlers(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.connectionStatus.reconnectAttempts),
      30000
    );

    this.reconnectTimer = setTimeout(() => {
      this.initialize();
    }, delay);
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Join a chat room
   */
  joinRoom(roomId: string, roomType: string = 'general'): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('join_chat', { roomId, roomType });
      this.currentRooms.add(roomId);
    }
  }

  /**
   * Leave a chat room
   */
  leaveRoom(roomId: string): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('leave_chat', { roomId });
      this.currentRooms.delete(roomId);
    }
  }

  /**
   * Send chat message
   */
  sendMessage(roomId: string, message: string, messageType: string = 'text'): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('chat_message', { roomId, message, messageType });
    }
  }

  /**
   * Send typing indicator
   */
  startTyping(roomId: string): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('typing_start', { roomId });
    }
  }

  /**
   * Stop typing indicator
   */
  stopTyping(roomId: string): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('typing_stop', { roomId });
    }
  }

  /**
   * Update user status
   */
  updateStatus(status: string, customMessage?: string): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('update_status', { status, customMessage });
    }
  }

  /**
   * Send emotion update
   */
  sendEmotionUpdate(emotion: string, intensity: number, context?: string): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('emotion_update', { emotion, intensity, context });
    }
  }

  /**
   * Create a new room
   */
  createRoom(roomName: string, roomType: string = 'public', maxUsers: number = 50): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('create_room', { roomName, roomType, maxUsers });
    }
  }

  /**
   * Get room information
   */
  getRoomInfo(roomId: string): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('get_room_info', { roomId });
    }
  }

  /**
   * Get online users
   */
  getOnlineUsers(): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('get_online_users');
    }
  }

  /**
   * Request live analytics
   */
  requestLiveAnalytics(): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('request_live_analytics');
    }
  }

  /**
   * Share emotional state with friend
   */
  shareEmotionalState(targetUserId: string, emotion: string, intensity: number): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('share_emotional_state', {
        targetUserId,
        emotion,
        intensity,
        shareType: 'check_in'
      });
    }
  }

  /**
   * Celebrate milestone achievement
   */
  celebrateMilestone(milestoneId: string, title: string, shareWithCommunity: boolean = true): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('celebrate_milestone', {
        milestoneId,
        title,
        shareWithCommunity
      });
    }
  }

  /**
   * Request community support
   */
  requestSupport(intensity: number, context: string, anonymous: boolean = true): void {
    if (this.socket && this.connectionStatus.isConnected) {
      this.socket.emit('request_support', {
        intensity,
        context,
        anonymous
      });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus.isConnected;
  }

  /**
   * Get current rooms
   */
  getCurrentRooms(): string[] {
    return Array.from(this.currentRooms);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatus.isConnected = false;
    this.connectionStatus.isConnecting = false;
    this.currentRooms.clear();
    this.eventHandlers.clear();
  }

  /**
   * Update server URL
   */
  updateServerUrl(url: string): void {
    this.config.serverUrl = url;
  }

  /**
   * Debug logging helper
   */
  private debug(message: string, data?: any): void {
    if (__DEV__) {
      console.log(message, data || '');
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Test WebSocket connection - for debugging
   */
  testConnection(): void {
    console.log('🧪 WebSocket Connection Test:');
    console.log('🔌 Server URL:', this.config.serverUrl);
    console.log('🔗 Is Connected:', this.connectionStatus.isConnected);
    console.log('🔄 Is Connecting:', this.connectionStatus.isConnecting);
    console.log('🕐 Last Connected:', this.connectionStatus.lastConnected);
    console.log('🔁 Reconnect Attempts:', this.connectionStatus.reconnectAttempts);
    console.log('👥 Current Rooms:', Array.from(this.currentRooms));
    
    if (this.socket) {
      console.log('⚡ Socket Status:', this.socket.connected ? 'CONNECTED' : 'DISCONNECTED');
      console.log('🆔 Socket ID:', this.socket.id || 'No ID');
    } else {
      console.log('❌ No Socket Instance');
    }
  }
}

// Export singleton instance
// Lazy instantiation to improve app startup performance
let instance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!instance) {
    instance = new WebSocketService();
  }
  return instance;
};

export default getWebSocketService;
export type { 
  WebSocketConfig, 
  ConnectionStatus, 
  RoomInfo, 
  ChatMessage, 
  EmotionUpdate, 
  UserPresence 
};