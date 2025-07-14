import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import ApiService, { OfflineQueueItem } from './api';

/**
 * Offline Request Queue Service
 * Handles storing failed API requests and retrying them when network is restored
 */

interface QueuedRequest {
  id: string;
  endpoint: string;
  options: RequestInit;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
}

interface QueueStats {
  totalRequests: number;
  pendingRequests: number;
  failedRequests: number;
  lastProcessed: number;
}

class OfflineQueueService {
  private static readonly QUEUE_KEY = 'offline_request_queue';
  private static readonly STATS_KEY = 'offline_queue_stats';
  private static readonly MAX_QUEUE_SIZE = 100;
  private static readonly MAX_REQUEST_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  private static isProcessing = false;
  private static netInfoUnsubscribe: (() => void) | null = null;

  /**
   * Initialize the offline queue service
   * Sets up network monitoring and starts processing queue when online
   */
  static async initialize(): Promise<void> {
    
    // Clean up old requests on initialization
    await this.cleanupOldRequests();
    
    // Set up network monitoring
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isProcessing) {
        this.processQueue();
      }
    });
    
    // Process queue if we're already online
    const netState = await NetInfo.fetch();
    if (netState.isConnected && !this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Clean up the service and remove network listeners
   */
  static cleanup(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
  }

  /**
   * Add a failed request to the offline queue
   */
  static async enqueueRequest(
    endpoint: string,
    options: RequestInit = {},
    priority: 'high' | 'normal' | 'low' = 'normal',
    maxRetries: number = 3
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      
      // Check queue size limit
      if (queue.length >= this.MAX_QUEUE_SIZE) {
        // Remove oldest low priority request to make room
        const lowPriorityIndex = queue.findIndex(req => req.priority === 'low');
        if (lowPriorityIndex !== -1) {
          queue.splice(lowPriorityIndex, 1);
        } else {
          // If no low priority requests, remove oldest normal priority
          const normalPriorityIndex = queue.findIndex(req => req.priority === 'normal');
          if (normalPriorityIndex !== -1) {
            queue.splice(normalPriorityIndex, 1);
          } else {
            // Queue is full of high priority requests, don't add
            console.warn('Offline queue is full, cannot add request');
            return;
          }
        }
      }

      const request: QueuedRequest = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        endpoint,
        options: {
          ...options,
          // Remove signal as it can't be serialized
          signal: undefined,
        },
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries,
        priority,
      };

      queue.push(request);
      
      // Sort by priority (high -> normal -> low) and timestamp
      queue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.timestamp - b.timestamp;
      });

      await this.saveQueue(queue);
      await this.updateStats({ totalRequests: 1, pendingRequests: 1 });
      
    } catch (error) {
      console.error('Failed to enqueue request:', error);
    }
  }

  /**
   * Process all queued requests using server-side batch processing
   */
  static async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    
    try {
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        return;
      }

      // Try server-side batch processing first
      const serverProcessed = await this.processQueueOnServer(queue);
      
      if (serverProcessed) {
        console.log('Queue processed successfully on server');
        return;
      }

      // Fallback to individual processing
      console.log('Falling back to individual queue processing');
      await this.processQueueIndividually(queue);
      
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process queue using server-side batch processing
   */
  private static async processQueueOnServer(queue: QueuedRequest[]): Promise<boolean> {
    try {
      // Convert queue to server format
      const serverQueueItems: OfflineQueueItem[] = queue.map(request => ({
        id: request.id,
        endpoint: request.endpoint,
        method: (request.options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE',
        data: request.options.body ? JSON.parse(request.options.body as string) : undefined,
        timestamp: new Date(request.timestamp).toISOString(),
        priority: request.priority as 'high' | 'medium' | 'low'
      }));

      // Send to server for processing
      const response = await ApiService.processOfflineQueue(serverQueueItems);
      
      if (response.success) {
        const { processed, failed } = response.data.results;
        
        // Remove processed items from queue
        const processedIds = processed.map((p: any) => p.id);
        const updatedQueue = queue.filter(req => !processedIds.includes(req.id));
        
        await this.saveQueue(updatedQueue);
        await this.updateStats({ 
          pendingRequests: -processed.length,
          failedRequests: failed.length,
          lastProcessed: Date.now()
        });
        
        console.log(`Server processed ${processed.length} items, ${failed.length} failed`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Server-side queue processing failed:', error);
      return false;
    }
  }

  /**
   * Process queue individually (fallback method)
   */
  private static async processQueueIndividually(queue: QueuedRequest[]): Promise<void> {
    const successfulRequests: string[] = [];
    const failedRequests: string[] = [];

    for (const request of queue) {
      try {
        // Check if request is too old
        if (Date.now() - request.timestamp > this.MAX_REQUEST_AGE) {
          successfulRequests.push(request.id);
          continue;
        }

        // Attempt to replay the request
        const response = await ApiService.apiRequest(request.endpoint, request.options, 1);
        
        if (response.success) {
          successfulRequests.push(request.id);
        } else {
          request.retryCount++;
          
          if (request.retryCount >= request.maxRetries) {
            failedRequests.push(request.id);
          }
        }
      } catch (error) {
        request.retryCount++;
        
        if (request.retryCount >= request.maxRetries) {
          console.error(`Queued request failed permanently: ${request.endpoint}`, error);
          failedRequests.push(request.id);
        }
      }
    }

    // Remove successful and permanently failed requests from queue
    const updatedQueue = queue.filter(req => 
      !successfulRequests.includes(req.id) && !failedRequests.includes(req.id)
    );

    await this.saveQueue(updatedQueue);
    await this.updateStats({ 
      pendingRequests: -successfulRequests.length,
      failedRequests: failedRequests.length,
      lastProcessed: Date.now()
    });
  }

  /**
   * Get current queue statistics
   */
  static async getQueueStats(): Promise<QueueStats> {
    try {
      const statsJson = await AsyncStorage.getItem(this.STATS_KEY);
      const queue = await this.getQueue();
      
      const defaultStats: QueueStats = {
        totalRequests: 0,
        pendingRequests: queue.length,
        failedRequests: 0,
        lastProcessed: 0,
      };

      if (!statsJson) {
        return defaultStats;
      }

      const stats = JSON.parse(statsJson);
      return {
        ...defaultStats,
        ...stats,
        pendingRequests: queue.length, // Always get live count
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        failedRequests: 0,
        lastProcessed: 0,
      };
    }
  }

  /**
   * Clear the entire queue
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.QUEUE_KEY);
      await AsyncStorage.removeItem(this.STATS_KEY);
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  }

  /**
   * Get the current queue
   */
  private static async getQueue(): Promise<QueuedRequest[]> {
    try {
      const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Save the queue to storage
   */
  private static async saveQueue(queue: QueuedRequest[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }

  /**
   * Update queue statistics
   */
  private static async updateStats(changes: Partial<QueueStats>): Promise<void> {
    try {
      const currentStats = await this.getQueueStats();
      const updatedStats = {
        ...currentStats,
        totalRequests: Math.max(0, currentStats.totalRequests + (changes.totalRequests || 0)),
        pendingRequests: Math.max(0, currentStats.pendingRequests + (changes.pendingRequests || 0)),
        failedRequests: Math.max(0, currentStats.failedRequests + (changes.failedRequests || 0)),
        lastProcessed: changes.lastProcessed || currentStats.lastProcessed,
      };

      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(updatedStats));
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  /**
   * Clean up old requests from the queue
   */
  private static async cleanupOldRequests(): Promise<void> {
    try {
      const queue = await this.getQueue();
      const now = Date.now();
      
      const cleanQueue = queue.filter(request => 
        now - request.timestamp <= this.MAX_REQUEST_AGE
      );

      if (cleanQueue.length !== queue.length) {
        await this.saveQueue(cleanQueue);
      }
    } catch (error) {
      console.error('Failed to cleanup old requests:', error);
    }
  }
}

export default OfflineQueueService;
export type { QueuedRequest, QueueStats };