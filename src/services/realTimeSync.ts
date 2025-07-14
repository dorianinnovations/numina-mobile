import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

// React Native compatible EventEmitter
class SimpleEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(...args));
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

// Define event types for real-time sync
export interface SyncEvent {
  id: string;
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'user_joined' | 'user_left' | 'comment_added';
  data: any;
  timestamp: number;
  userId?: string;
}

export interface RealTimeEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  location?: string;
  maxParticipants: number;
  currentParticipants: number;
  participants: string[];
  hostId: string;
  hostName: string;
  photos?: string[];
  isPrivate?: boolean;
  requiresApproval?: boolean;
  skillLevel?: string;
  tags?: string[];
  cost?: number;
  currency?: string;
  virtualOption?: boolean;
  meetingLink?: string;
  // Real-time fields
  lastUpdated: number;
  version: number;
  isDeleted?: boolean;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'failed';
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: number;
  reactions: { emoji: string; count: number; users: string[] }[];
}

class RealTimeSyncService extends SimpleEventEmitter {
  private static instance: RealTimeSyncService;
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: any = null;
  private isConnected = false;
  private pendingEvents: SyncEvent[] = [];
  private eventCache: Map<string, RealTimeEvent> = new Map();
  private commentsCache: Map<string, EventComment[]> = new Map();
  private userId: string | null = null;

  private constructor() {
    super();
    this.loadPendingEvents();
    this.loadUserId();
  }

  static getInstance(): RealTimeSyncService {
    if (!this.instance) {
      this.instance = new RealTimeSyncService();
    }
    return this.instance;
  }

  // Initialize connection
  async initialize(userId: string) {
    this.userId = userId;
    await this.saveUserId(userId);
    this.connect();
  }

  // Simulate WebSocket connection for demo purposes
  private simulateWebSocketConnection() {
    console.log('Simulating WebSocket connection...');
    
    // Simulate connection delay
    setTimeout(() => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processPendingEvents();
      this.emit('connected');
      console.log('Simulated WebSocket connected');
    }, 1000);
  }

  // Connect to WebSocket
  private connect() {
    if (this.isConnected) {
      return;
    }

    try {
      // In a real app, this would be your WebSocket server URL
      // For now, we'll simulate the connection for demo purposes
      const wsUrl = 'ws://localhost:8080/ws'; // This would be your actual WebSocket URL
      
      // Since we don't have a real WebSocket server, we'll simulate it
      this.simulateWebSocketConnection();
      return;
      
      // Uncomment below for real WebSocket connection:
      /*
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.authenticate();
        this.processPendingEvents();
        this.emit('connected');
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        this.scheduleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
      */
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  // Disconnect
  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.stopHeartbeat();
    this.isConnected = false;
  }

  // Handle incoming messages
  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'event_created':
          this.handleEventCreated(message.data);
          break;
        case 'event_updated':
          this.handleEventUpdated(message.data);
          break;
        case 'event_deleted':
          this.handleEventDeleted(message.data);
          break;
        case 'user_joined':
          this.handleUserJoined(message.data);
          break;
        case 'user_left':
          this.handleUserLeft(message.data);
          break;
        case 'comment_added':
          this.handleCommentAdded(message.data);
          break;
        case 'sync_response':
          this.handleSyncResponse(message.data);
          break;
        case 'heartbeat':
          this.handleHeartbeat();
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  // Event handlers
  private handleEventCreated(event: RealTimeEvent) {
    this.eventCache.set(event.id, event);
    this.emit('eventCreated', event);
  }

  private handleEventUpdated(event: RealTimeEvent) {
    const existingEvent = this.eventCache.get(event.id);
    if (existingEvent && existingEvent.version < event.version) {
      this.eventCache.set(event.id, event);
      this.emit('eventUpdated', event);
    }
  }

  private handleEventDeleted(data: { eventId: string; version: number }) {
    const event = this.eventCache.get(data.eventId);
    if (event) {
      event.isDeleted = true;
      event.version = data.version;
      this.eventCache.set(data.eventId, event);
      this.emit('eventDeleted', data.eventId);
    }
  }

  private handleUserJoined(data: { eventId: string; userId: string; userName: string }) {
    const event = this.eventCache.get(data.eventId);
    if (event && !event.participants.includes(data.userId)) {
      event.participants.push(data.userId);
      event.currentParticipants++;
      this.eventCache.set(data.eventId, event);
      this.emit('userJoined', data);
    }
  }

  private handleUserLeft(data: { eventId: string; userId: string }) {
    const event = this.eventCache.get(data.eventId);
    if (event) {
      event.participants = event.participants.filter(id => id !== data.userId);
      event.currentParticipants = Math.max(0, event.currentParticipants - 1);
      this.eventCache.set(data.eventId, event);
      this.emit('userLeft', data);
    }
  }

  private handleCommentAdded(comment: EventComment) {
    const comments = this.commentsCache.get(comment.eventId) || [];
    comments.push(comment);
    this.commentsCache.set(comment.eventId, comments);
    this.emit('commentAdded', comment);
  }

  private handleSyncResponse(data: { success: boolean; eventId: string; error?: string }) {
    const event = this.eventCache.get(data.eventId);
    if (event) {
      event.syncStatus = data.success ? 'synced' : 'failed';
      this.eventCache.set(data.eventId, event);
      this.emit('syncResponse', data);
    }
  }

  private handleHeartbeat() {
    // Respond to heartbeat
    this.sendMessage({ type: 'heartbeat_response' });
  }

  // Public API methods
  async createEvent(eventData: any): Promise<RealTimeEvent> {
    const event: RealTimeEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...eventData,
      participants: [this.userId!],
      currentParticipants: 1,
      lastUpdated: Date.now(),
      version: 1,
      syncStatus: 'pending',
    };

    this.eventCache.set(event.id, event);
    
    // Try to sync immediately
    const syncEvent: SyncEvent = {
      id: event.id,
      type: 'event_created',
      data: event,
      timestamp: Date.now(),
      userId: this.userId!,
    };

    if (this.isConnected) {
      this.sendMessage(syncEvent);
    } else {
      this.addPendingEvent(syncEvent);
    }

    return event;
  }

  async updateEvent(eventId: string, updates: Partial<RealTimeEvent>): Promise<RealTimeEvent | null> {
    const event = this.eventCache.get(eventId);
    if (!event) return null;

    const updatedEvent = {
      ...event,
      ...updates,
      lastUpdated: Date.now(),
      version: event.version + 1,
      syncStatus: 'pending' as const,
    };

    this.eventCache.set(eventId, updatedEvent);

    const syncEvent: SyncEvent = {
      id: eventId,
      type: 'event_updated',
      data: updatedEvent,
      timestamp: Date.now(),
      userId: this.userId!,
    };

    if (this.isConnected) {
      this.sendMessage(syncEvent);
    } else {
      this.addPendingEvent(syncEvent);
    }

    return updatedEvent;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    const event = this.eventCache.get(eventId);
    if (!event) return false;

    const syncEvent: SyncEvent = {
      id: eventId,
      type: 'event_deleted',
      data: { eventId, version: event.version + 1 },
      timestamp: Date.now(),
      userId: this.userId!,
    };

    if (this.isConnected) {
      this.sendMessage(syncEvent);
    } else {
      this.addPendingEvent(syncEvent);
    }

    return true;
  }

  async joinEvent(eventId: string): Promise<boolean> {
    const event = this.eventCache.get(eventId);
    if (!event || event.participants.includes(this.userId!)) return false;

    const syncEvent: SyncEvent = {
      id: eventId,
      type: 'user_joined',
      data: { eventId, userId: this.userId!, userName: 'Current User' },
      timestamp: Date.now(),
      userId: this.userId!,
    };

    if (this.isConnected) {
      this.sendMessage(syncEvent);
    } else {
      this.addPendingEvent(syncEvent);
    }

    return true;
  }

  async leaveEvent(eventId: string): Promise<boolean> {
    const event = this.eventCache.get(eventId);
    if (!event || !event.participants.includes(this.userId!)) return false;

    const syncEvent: SyncEvent = {
      id: eventId,
      type: 'user_left',
      data: { eventId, userId: this.userId! },
      timestamp: Date.now(),
      userId: this.userId!,
    };

    if (this.isConnected) {
      this.sendMessage(syncEvent);
    } else {
      this.addPendingEvent(syncEvent);
    }

    return true;
  }

  async addComment(eventId: string, message: string): Promise<EventComment> {
    const comment: EventComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      eventId,
      userId: this.userId!,
      userName: 'Current User',
      message,
      timestamp: Date.now(),
      reactions: [],
    };

    const syncEvent: SyncEvent = {
      id: comment.id,
      type: 'comment_added',
      data: comment,
      timestamp: Date.now(),
      userId: this.userId!,
    };

    if (this.isConnected) {
      this.sendMessage(syncEvent);
    } else {
      this.addPendingEvent(syncEvent);
    }

    return comment;
  }

  // Get cached data
  getEvent(eventId: string): RealTimeEvent | null {
    return this.eventCache.get(eventId) || null;
  }

  getAllEvents(): RealTimeEvent[] {
    return Array.from(this.eventCache.values()).filter(event => !event.isDeleted);
  }

  getEventComments(eventId: string): EventComment[] {
    return this.commentsCache.get(eventId) || [];
  }

  // Connection status
  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  // Private helper methods
  private sendMessage(message: any) {
    if (this.isConnected) {
      // For simulation, we'll just log the message
      console.log('Sending message:', JSON.stringify(message));
      
      // In a real WebSocket implementation, this would be:
      // if (this.websocket?.readyState === WebSocket.OPEN) {
      //   this.websocket.send(JSON.stringify(message));
      // }
      
      // For demo purposes, simulate immediate response for some message types
      if (message.type === 'event_created' || message.type === 'event_updated') {
        setTimeout(() => {
          this.handleSyncResponse({
            success: true,
            eventId: message.id,
          });
        }, 100);
      }
    }
  }

  private authenticate() {
    if (this.userId) {
      this.sendMessage({
        type: 'auth',
        data: { userId: this.userId },
      });
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: 'heartbeat' });
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  private async addPendingEvent(event: SyncEvent) {
    this.pendingEvents.push(event);
    await this.savePendingEvents();
  }

  private async processPendingEvents() {
    for (const event of this.pendingEvents) {
      this.sendMessage(event);
    }
    this.pendingEvents = [];
    await this.savePendingEvents();
  }

  // Storage methods
  private async savePendingEvents() {
    try {
      await AsyncStorage.setItem('@pending_sync_events', JSON.stringify(this.pendingEvents));
    } catch (error) {
      console.error('Error saving pending events:', error);
    }
  }

  private async loadPendingEvents() {
    try {
      const stored = await AsyncStorage.getItem('@pending_sync_events');
      if (stored) {
        this.pendingEvents = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading pending events:', error);
    }
  }

  private async saveUserId(userId: string) {
    try {
      await AsyncStorage.setItem('@user_id', userId);
    } catch (error) {
      console.error('Error saving user ID:', error);
    }
  }

  private async loadUserId() {
    try {
      const stored = await AsyncStorage.getItem('@user_id');
      if (stored) {
        this.userId = stored;
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  }
}

export default RealTimeSyncService;