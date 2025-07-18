import ApiService, { BatchRequest, BatchResponse, ApiResponse } from './api';

/**
 * Batch API Service
 * Optimizes API calls by batching multiple requests into single calls
 * Reduces network overhead and improves performance
 */

interface BatchQueue {
  requests: BatchRequest[];
  callback: (response: ApiResponse<BatchResponse>) => void;
  timestamp: number;
}

interface BatchStats {
  totalRequests: number;
  batchedRequests: number;
  individualRequests: number;
  averageBatchSize: number;
  efficiencyGain: number;
}

class BatchApiService {
  private queue: BatchQueue[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly batchDelay: number = 100; // 100ms delay before sending batch
  private readonly maxBatchSize: number = 10;
  private readonly maxWaitTime: number = 500; // Maximum wait time before forcing batch send
  private stats: BatchStats = {
    totalRequests: 0,
    batchedRequests: 0,
    individualRequests: 0,
    averageBatchSize: 0,
    efficiencyGain: 0
  };

  /**
   * Add request to batch queue
   */
  async addToBatch(request: BatchRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const batchQueue: BatchQueue = {
        requests: [request],
        callback: (response) => {
          if (response.success && response.data?.results) {
            const result = response.data.results[0];
            if (result.success) {
              resolve(result.data);
            } else {
              reject(new Error(result.error || 'Request failed'));
            }
          } else {
            reject(new Error(response.error || 'Batch request failed'));
          }
        },
        timestamp: Date.now()
      };

      this.queue.push(batchQueue);
      this.scheduleBatch();
    });
  }

  /**
   * Add multiple requests to batch
   */
  async addMultipleToBatch(requests: BatchRequest[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const batchQueue: BatchQueue = {
        requests,
        callback: (response) => {
          if (response.success && response.data?.results) {
            const results = response.data.results.map(result => {
              if (result.success) {
                return result.data;
              } else {
                throw new Error(result.error || 'Request failed');
              }
            });
            resolve(results);
          } else {
            reject(new Error(response.error || 'Batch request failed'));
          }
        },
        timestamp: Date.now()
      };

      this.queue.push(batchQueue);
      this.scheduleBatch();
    });
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Check if we should send immediately
    const totalRequests = this.queue.reduce((sum, batch) => sum + batch.requests.length, 0);
    const oldestBatch = this.queue.length > 0 ? this.queue[0] : null;
    const waitTime = oldestBatch ? Date.now() - oldestBatch.timestamp : 0;

    if (totalRequests >= this.maxBatchSize || waitTime >= this.maxWaitTime) {
      this.processBatch();
    } else {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }

  /**
   * Process current batch queue
   */
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    const currentQueue = [...this.queue];
    this.queue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Flatten all requests from queue
    const allRequests: BatchRequest[] = [];
    const requestToQueueMap: number[] = [];

    currentQueue.forEach((batch, queueIndex) => {
      batch.requests.forEach((request) => {
        allRequests.push(request);
        requestToQueueMap.push(queueIndex);
      });
    });

    // Split into batches if too large
    const batches = this.splitIntoBatches(allRequests, this.maxBatchSize);
    
    try {
      for (const batch of batches) {
        const response = await ApiService.batchRequest(batch);
        
        // Update stats
        this.updateStats(batch.length);
        
        if (response.success && response.data?.results) {
          // Map results back to original queue items
          let resultIndex = 0;
          
          for (let i = 0; i < batch.length; i++) {
            const queueIndex = requestToQueueMap[resultIndex];
            const originalQueue = currentQueue[queueIndex];
            
            if (originalQueue && response.data.results[i]) {
              // Create a response for this specific queue item
              const queueResponse: ApiResponse<BatchResponse> = {
                success: true,
                data: {
                  success: true,
                  batchId: response.data.batchId,
                  results: [response.data.results[i]],
                  timestamp: response.data.timestamp
                }
              };
              
              originalQueue.callback(queueResponse);
            }
            
            resultIndex++;
          }
        } else {
          // Handle batch failure
          currentQueue.forEach(queueItem => {
            queueItem.callback({
              success: false,
              error: response.error || 'Batch processing failed'
            });
          });
        }
      }
    } catch (error) {
      // Handle error for all queue items
      currentQueue.forEach(queueItem => {
        queueItem.callback({
          success: false,
          error: error instanceof Error ? error.message : 'Batch processing error'
        });
      });
    }
  }

  /**
   * Split requests into smaller batches
   */
  private splitIntoBatches(requests: BatchRequest[], maxSize: number): BatchRequest[][] {
    const batches: BatchRequest[][] = [];
    
    for (let i = 0; i < requests.length; i += maxSize) {
      batches.push(requests.slice(i, i + maxSize));
    }
    
    return batches;
  }

  /**
   * Update batch statistics
   */
  private updateStats(batchSize: number): void {
    this.stats.totalRequests += batchSize;
    this.stats.batchedRequests += batchSize;
    
    // Calculate average batch size
    const totalBatches = Math.ceil(this.stats.batchedRequests / this.maxBatchSize);
    this.stats.averageBatchSize = this.stats.batchedRequests / totalBatches;
    
    // Calculate efficiency gain (requests saved by batching)
    const requestsSaved = this.stats.batchedRequests - totalBatches;
    this.stats.efficiencyGain = (requestsSaved / this.stats.totalRequests) * 100;
  }

  /**
   * Optimized API methods that use batching
   */
  
  // Get user profile (batched)
  async getUserProfile(): Promise<any> {
    return this.addToBatch({
      endpoint: '/profile',
      method: 'GET'
    });
  }

  // Get emotions (batched)
  async getEmotions(): Promise<any> {
    return this.addToBatch({
      endpoint: '/emotions',
      method: 'GET'
    });
  }

  // Get analytics insights (batched)
  async getAnalyticsInsights(timeRange: string = '7d'): Promise<any> {
    return this.addToBatch({
      endpoint: '/analytics/insights',
      method: 'POST',
      data: { timeRange }
    });
  }

  // Get cloud events (batched)
  async getCloudEvents(): Promise<any> {
    return this.addToBatch({
      endpoint: '/cloud/events',
      method: 'GET'
    });
  }

  // Get conversation history (batched)
  async getConversationHistory(): Promise<any> {
    return this.addToBatch({
      endpoint: '/chat/history',
      method: 'GET'
    });
  }

  // Batch multiple common requests
  async getInitialData(): Promise<{
    profile: any;
    emotions: any;
    analytics: any;
    cloudEvents: any;
  }> {
    const requests: BatchRequest[] = [
      { endpoint: '/profile', method: 'GET' },
      { endpoint: '/emotions', method: 'GET' },
      { endpoint: '/analytics/insights', method: 'POST', data: { timeRange: '7d' } },
      { endpoint: '/cloud/events', method: 'GET' }
    ];

    const results = await this.addMultipleToBatch(requests);
    
    return {
      profile: results[0],
      emotions: results[1],
      analytics: results[2],
      cloudEvents: results[3]
    };
  }

  // Batch emotion and analytics data
  async getEmotionalData(): Promise<{
    emotions: any;
    analytics: any;
    weeklyDigest: any;
  }> {
    const requests: BatchRequest[] = [
      { endpoint: '/emotions', method: 'GET' },
      { endpoint: '/analytics/insights', method: 'POST', data: { timeRange: '30d' } },
      { endpoint: '/analytics/llm/weekly-digest', method: 'POST', data: {} }
    ];

    const results = await this.addMultipleToBatch(requests);
    
    return {
      emotions: results[0],
      analytics: results[1],
      weeklyDigest: results[2]
    };
  }

  // Batch user-related data
  async getUserData(): Promise<{
    profile: any;
    settings: any;
    preferences: any;
  }> {
    const requests: BatchRequest[] = [
      { endpoint: '/profile', method: 'GET' },
      { endpoint: '/user/settings', method: 'GET' },
      { endpoint: '/user/preferences', method: 'GET' }
    ];

    const results = await this.addMultipleToBatch(requests);
    
    return {
      profile: results[0],
      settings: results[1],
      preferences: results[2]
    };
  }

  /**
   * Force process current batch (useful for app state changes)
   */
  async flushBatch(): Promise<void> {
    if (this.queue.length > 0) {
      await this.processBatch();
    }
  }

  /**
   * Clear current batch queue
   */
  clearBatch(): void {
    this.queue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Get batch statistics
   */
  getStats(): BatchStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      batchedRequests: 0,
      individualRequests: 0,
      averageBatchSize: 0,
      efficiencyGain: 0
    };
  }

  /**
   * Enable/disable batching (fallback to individual requests)
   */
  private batchingEnabled: boolean = true;

  setBatchingEnabled(enabled: boolean): void {
    this.batchingEnabled = enabled;
    if (!enabled) {
      this.clearBatch();
    }
  }

  isBatchingEnabled(): boolean {
    return this.batchingEnabled;
  }
}

// Lazy instantiation for better app startup performance
let instance: BatchApiService | null = null;

export const getBatchApiService = (): BatchApiService => {
  if (!instance) {
    instance = new BatchApiService();
  }
  return instance;
};

export default getBatchApiService;
export type { BatchStats };