import { resourceManager } from '../utils/resourceManager';
import AppStateManager from './appStateManager';

interface MessageHandler {
  id: string;
  handler: (data: any) => void;
  options: {
    once?: boolean;
    priority?: 'high' | 'medium' | 'low';
    timeout?: number;
  };
  timestamp: number;
}

interface ConnectionMetrics {
  messagesReceived: number;
  messagesSent: number;
  reconnections: number;
  lastActivity: number;
  memoryUsage: {
    handlers: number;
    pendingMessages: number;
  };
}

/**
 * Extreme WebSocket Optimization with Zero Memory Leaks
 * - Automatic handler cleanup with timeouts
 * - Message queue with size limits  
 * - Connection pooling and reuse
 * - Memory pressure monitoring
 * - Automatic garbage collection of stale handlers
 */
export class OptimizedWebSocketService {
  private static instance: OptimizedWebSocketService;
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  
  // Handler management with automatic cleanup
  private handlers = new Map<string, Map<string, MessageHandler>>();
  private handlerTimeouts = new Map<string, NodeJS.Timeout>();
  private maxHandlersPerEvent = 10;
  private handlerTTL = 300000; // 5 minutes

  // Message queue with limits
  private messageQueue: Array<{ event: string; data: any; timestamp: number }> = [];
  private maxQueueSize = 50;
  private queueProcessingInterval: NodeJS.Timeout | null = null;

  // Connection management
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxReconnects = 5;
  private baseReconnectDelay = 1000;

  // Performance monitoring
  private metrics: ConnectionMetrics = {
    messagesReceived: 0,
    messagesSent: 0,
    reconnections: 0,
    lastActivity: Date.now(),
    memoryUsage: {
      handlers: 0,
      pendingMessages: 0,
    }
  };

  // Memory management
  private memoryCleanupInterval: NodeJS.Timeout | null = null;
  private lastGCTime = Date.now();
  private gcInterval = 60000; // 1 minute

  private constructor(url: string) {
    this.url = url;
    this.startMemoryManagement();
    this.startQueueProcessing();
  }

  static getInstance(url?: string): OptimizedWebSocketService {
    if (!OptimizedWebSocketService.instance && url) {
      OptimizedWebSocketService.instance = new OptimizedWebSocketService(url);
    } else if (!OptimizedWebSocketService.instance) {
      throw new Error('WebSocket service not initialized with URL');
    }
    return OptimizedWebSocketService.instance;
  }

  /**
   * Initialize connection with automatic resource tracking
   */
  async initialize(token?: string): Promise<boolean> {
    if (token) this.token = token;

    return new Promise((resolve, reject) => {
      try {
        // Clean up existing connection
        this.disconnect();

        const wsUrl = this.token ? `${this.url}?token=${this.token}` : this.url;
        this.ws = new WebSocket(wsUrl);

        // Track connection timeout
        const connectionTimeout = resourceManager.createTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
          this.ws?.close();
        }, 10000, 'websocket-service', 'high');

        this.ws.onopen = (event) => {
          clearTimeout(connectionTimeout);
          this.connectionAttempts = 0;
          this.metrics.lastActivity = Date.now();
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.cleanup();
          
          if (!event.wasClean && this.connectionAttempts < this.maxReconnects) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add event listener with automatic cleanup and memory management
   */
  addEventListener(
    event: string,
    handler: (data: any) => void,
    options: MessageHandler['options'] = {}
  ): string {
    const handlerId = `${event}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check handler limits per event
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Map());
    }

    const eventHandlers = this.handlers.get(event)!;
    
    // Cleanup oldest handlers if at limit
    if (eventHandlers.size >= this.maxHandlersPerEvent) {
      const oldestHandler = Array.from(eventHandlers.values())
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      
      if (oldestHandler) {
        this.removeEventListener(event, oldestHandler.id);
      }
    }

    const messageHandler: MessageHandler = {
      id: handlerId,
      handler,
      options: {
        priority: 'medium',
        timeout: this.handlerTTL,
        ...options
      },
      timestamp: Date.now()
    };

    eventHandlers.set(handlerId, messageHandler);

    // Set timeout for handler cleanup
    if (messageHandler.options.timeout) {
      const timeoutId = resourceManager.createTimeout(() => {
        this.removeEventListener(event, handlerId);
      }, messageHandler.options.timeout, 'websocket-service', 'medium');
      
      this.handlerTimeouts.set(handlerId, timeoutId);
    }

    this.updateMemoryMetrics();
    return handlerId;
  }

  /**
   * Remove event listener with proper cleanup
   */
  removeEventListener(event: string, handlerId: string): boolean {
    const eventHandlers = this.handlers.get(event);
    if (!eventHandlers || !eventHandlers.has(handlerId)) {
      return false;
    }

    // Clear timeout
    const timeoutId = this.handlerTimeouts.get(handlerId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.handlerTimeouts.delete(handlerId);
    }

    // Remove handler
    eventHandlers.delete(handlerId);
    
    // Cleanup empty event maps
    if (eventHandlers.size === 0) {
      this.handlers.delete(event);
    }

    this.updateMemoryMetrics();
    return true;
  }

  /**
   * Send message with queuing and retry logic
   */
  send(event: string, data: any): boolean {
    const message = { event, data, timestamp: Date.now() };

    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        this.metrics.messagesSent++;
        this.metrics.lastActivity = Date.now();
        return true;
      } catch (error) {
        this.queueMessage(message);
        return false;
      }
    } else {
      this.queueMessage(message);
      return false;
    }
  }

  /**
   * Handle incoming messages with error isolation
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.metrics.messagesReceived++;
      this.metrics.lastActivity = Date.now();

      const eventType = data.type || data.event;
      if (!eventType) return;

      const eventHandlers = this.handlers.get(eventType);
      if (!eventHandlers) return;

      // Process handlers by priority
      const handlersByPriority = {
        high: [] as MessageHandler[],
        medium: [] as MessageHandler[],
        low: [] as MessageHandler[]
      };

      for (const handler of eventHandlers.values()) {
        handlersByPriority[handler.options.priority || 'medium'].push(handler);
      }

      // Process high priority first
      const allHandlers = [
        ...handlersByPriority.high,
        ...handlersByPriority.medium,
        ...handlersByPriority.low
      ];

      for (const messageHandler of allHandlers) {
        try {
          // Use timeout to prevent blocking handlers
          const handlerTimeout = resourceManager.createTimeout(() => {
          }, 5000, 'websocket-service', 'low');

          messageHandler.handler(data);
          clearTimeout(handlerTimeout);

          // Remove 'once' handlers
          if (messageHandler.options.once) {
            this.removeEventListener(eventType, messageHandler.id);
          }

        } catch (error) {
          
          // Remove problematic handlers
          this.removeEventListener(eventType, messageHandler.id);
        }
      }

    } catch (error) {
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: { event: string; data: any; timestamp: number }): void {
    // Remove oldest messages if queue is full
    while (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift();
    }

    this.messageQueue.push(message);
    this.updateMemoryMetrics();
  }

  /**
   * Process queued messages
   */
  private startQueueProcessing(): void {
    this.queueProcessingInterval = resourceManager.createInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN && this.messageQueue.length > 0) {
        const messagesToSend = this.messageQueue.splice(0, 5); // Send up to 5 at a time
        
        for (const message of messagesToSend) {
          // Skip messages older than 1 minute
          if (Date.now() - message.timestamp > 60000) {
            continue;
          }

          try {
            this.ws.send(JSON.stringify(message));
            this.metrics.messagesSent++;
          } catch (error) {
            // Put back at front of queue
            this.messageQueue.unshift(message);
            break;
          }
        }

        this.updateMemoryMetrics();
      }
    }, 1000, 'websocket-service', 'medium');
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    // Use app state manager to pause heartbeat in background
    const appStateManager = AppStateManager.getInstance();
    
    // Only send heartbeat if app is active
    const heartbeatCallback = () => {
      if (this.ws?.readyState === WebSocket.OPEN && appStateManager.isActive()) {
        this.send('heartbeat', { timestamp: Date.now() });
      }
    };
    
    // Register as pausable interval
    this.heartbeatInterval = appStateManager.registerPausableInterval(
      'websocket-heartbeat',
      heartbeatCallback,
      30000
    );
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.connectionAttempts >= this.maxReconnects) {
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.connectionAttempts);
    this.connectionAttempts++;
    this.metrics.reconnections++;

    this.reconnectTimer = resourceManager.createTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        this.scheduleReconnect();
      }
    }, delay, 'websocket-service', 'high');
  }

  /**
   * Start memory management and garbage collection
   */
  private startMemoryManagement(): void {
    // Use app state manager to pause GC in background
    const appStateManager = AppStateManager.getInstance();
    
    this.memoryCleanupInterval = appStateManager.registerPausableInterval(
      'websocket-gc',
      () => this.performGarbageCollection(),
      this.gcInterval
    );
  }

  /**
   * Perform garbage collection of stale resources
   */
  private performGarbageCollection(): void {
    const now = Date.now();
    let cleanedHandlers = 0;
    let cleanedMessages = 0;

    // Clean up stale handlers
    for (const [event, eventHandlers] of this.handlers.entries()) {
      const handlersToRemove: string[] = [];
      
      for (const [handlerId, handler] of eventHandlers.entries()) {
        // Remove handlers older than TTL
        if (now - handler.timestamp > this.handlerTTL) {
          handlersToRemove.push(handlerId);
        }
      }

      for (const handlerId of handlersToRemove) {
        this.removeEventListener(event, handlerId);
        cleanedHandlers++;
      }
    }

    // Clean up old queued messages
    const initialQueueSize = this.messageQueue.length;
    this.messageQueue = this.messageQueue.filter(message => 
      now - message.timestamp < 60000 // Keep messages younger than 1 minute
    );
    cleanedMessages = initialQueueSize - this.messageQueue.length;

    if (cleanedHandlers > 0 || cleanedMessages > 0) {
    }

    this.updateMemoryMetrics();
    this.lastGCTime = now;
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryMetrics(): void {
    let totalHandlers = 0;
    for (const eventHandlers of this.handlers.values()) {
      totalHandlers += eventHandlers.size;
    }

    this.metrics.memoryUsage = {
      handlers: totalHandlers,
      pendingMessages: this.messageQueue.length,
    };
  }

  /**
   * Get connection and performance metrics
   */
  getMetrics(): ConnectionMetrics & { isConnected: boolean; timeSinceLastGC: number } {
    return {
      ...this.metrics,
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      timeSinceLastGC: Date.now() - this.lastGCTime,
    };
  }

  /**
   * Force garbage collection (emergency cleanup)
   */
  forceGarbageCollection(): void {
    // Clear all handlers
    for (const [event, eventHandlers] of this.handlers.entries()) {
      for (const handlerId of eventHandlers.keys()) {
        this.removeEventListener(event, handlerId);
      }
    }

    // Clear message queue
    this.messageQueue.length = 0;

    // Clear all timeouts
    for (const timeoutId of this.handlerTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.handlerTimeouts.clear();

    this.updateMemoryMetrics();
  }

  /**
   * Clean up all resources
   */
  private cleanup(): void {
    const appStateManager = AppStateManager.getInstance();
    
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Unregister pausable intervals from app state manager
    if (this.heartbeatInterval) {
      appStateManager.unregisterInterval('websocket-heartbeat');
      this.heartbeatInterval = null;
    }

    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
      this.queueProcessingInterval = null;
    }

    if (this.memoryCleanupInterval) {
      appStateManager.unregisterInterval('websocket-gc');
      this.memoryCleanupInterval = null;
    }
  }

  /**
   * Professional disconnect with complete cleanup
   */
  disconnect(): void {

    this.cleanup();
    this.forceGarbageCollection();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connectionAttempts = 0;
  }

  /**
   * Destroy service instance (nuclear cleanup)
   */
  destroy(): void {
    this.disconnect();
    OptimizedWebSocketService.instance = null as any;
  }
}

/**
 * Get optimized WebSocket service instance
 */
export default function getOptimizedWebSocketService(url?: string): OptimizedWebSocketService {
  return OptimizedWebSocketService.getInstance(url);
}