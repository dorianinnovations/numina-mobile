import { io, Socket } from 'socket.io-client';
import CloudAuth from './cloudAuth';
import ENV from '../config/environment';
import { log } from '../utils/logger';



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
  lastWarningTime?: number;
  backoffDelay: number;
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
    
    // Keep HTTP/HTTPS - Socket.io handles protocol switching internally
    
    log.info('WebSocket will connect to', { wsUrl }, 'WebSocketService');
    
    this.config = {
      serverUrl: wsUrl,
      reconnectionDelay: 5000,
      maxReconnectionAttempts: 5,
      timeout: 30000
    };

    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      backoffDelay: 5000
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
        return false;
      }
      
      log.debug('WebSocket auth token configured', { length: token.length }, 'WebSocketService');

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
        rememberUpgrade: false,
        withCredentials: true,
        autoConnect: true
      });

      this.setupEventHandlers();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          // Only log timeout warning every 30 seconds to reduce spam
          const now = Date.now();
          if (!this.connectionStatus.lastWarningTime || (now - this.connectionStatus.lastWarningTime) > 30000) {
            // console.warn('WebSocket connection timeout');
            this.connectionStatus.lastWarningTime = now;
          }
          this.connectionStatus.isConnecting = false;
          resolve(false);
        }, this.config.timeout);

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          this.connectionStatus.lastConnected = new Date();
          resolve(true);
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          this.connectionStatus.isConnecting = false;
          resolve(false);
        });
      });

    } catch (error) {
      this.connectionStatus.isConnecting = false;
      return false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.connectionStatus.isConnected = true;
      this.connectionStatus.isConnecting = false;
      this.connectionStatus.reconnectAttempts = 0;
      this.emitToHandlers('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionStatus.isConnected = false;
      this.emitToHandlers('connection_status', { connected: false, reason });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.connectionStatus.reconnectAttempts = 0;
      this.emitToHandlers('reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.connectionStatus.reconnectAttempts = attemptNumber;
      this.emitToHandlers('reconnect_attempt', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      this.emitToHandlers('reconnect_error', { error });
    });

    this.socket.on('reconnect_failed', () => {
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
      this.emitToHandlers('ubpm_notification', data);
    });

    this.socket.on('ubpm_insight', (data: any) => {
      this.emitToHandlers('ubpm_insight', data);
    });

    // Tool execution events for beautiful status indicators
    this.socket.on('tool_execution_start', (data: any) => {
      this.emitToHandlers('tool_execution_start', data);
    });

    this.socket.on('tool_execution_complete', (data: any) => {
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
    // Debug logging disabled
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
    // Connection test results available via getConnectionStatus()
  }

  /**
   * Comprehensive cleanup method to prevent memory leaks
   */
  cleanup(): void {
    log.info('Starting WebSocket cleanup', null, 'WebSocketService');
    
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
      log.debug('Cleared reconnection timer', null, 'WebSocketService');
    }
    
    // Remove all event handlers
    if (this.eventHandlers.size > 0) {
      log.debug('Clearing event handlers', { count: this.eventHandlers.size }, 'WebSocketService');
      this.eventHandlers.clear();
    }
    
    // Clear rooms
    if (this.currentRooms.size > 0) {
      log.debug('Clearing current rooms', { count: this.currentRooms.size }, 'WebSocketService');
      this.currentRooms.clear();
    }
    
    // Reset connection status
    this.connectionStatus = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      backoffDelay: 5000
    };
    
    // Properly disconnect socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      log.debug('Socket disconnected and cleaned up', null, 'WebSocketService');
    }
    
    log.info('WebSocket cleanup completed', null, 'WebSocketService');
  }

  /**
   * Destroy instance and cleanup all resources
   */
  destroy(): void {
    this.cleanup();
    // Additional destroy logic if needed in the future
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

export const destroyWebSocketService = (): void => {
  if (instance) {
    instance.destroy();
    instance = null;
    log.info('WebSocket service instance destroyed', null, 'WebSocketService');
  }
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