import ApiService, { BatchRequest, BatchResponse, ApiResponse } from './api';


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

  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

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

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    const currentQueue = [...this.queue];
    this.queue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const allRequests: BatchRequest[] = [];
    const requestToQueueMap: number[] = [];

    currentQueue.forEach((batch, queueIndex) => {
      batch.requests.forEach((request) => {
        allRequests.push(request);
        requestToQueueMap.push(queueIndex);
      });
    });

    const batches = this.splitIntoBatches(allRequests, this.maxBatchSize);
    
    try {
      for (const batch of batches) {
        const response = await ApiService.batchRequest(batch);
        
        this.updateStats(batch.length);
        
        if (response.success && response.data?.results) {
          let resultIndex = 0;
          
          for (let i = 0; i < batch.length; i++) {
            const queueIndex = requestToQueueMap[resultIndex];
            const originalQueue = currentQueue[queueIndex];
            
            if (originalQueue && response.data.results[i]) {
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
          currentQueue.forEach(queueItem => {
            queueItem.callback({
              success: false,
              error: response.error || 'Batch processing failed'
            });
          });
        }
      }
    } catch (error) {
      currentQueue.forEach(queueItem => {
        queueItem.callback({
          success: false,
          error: error instanceof Error ? error.message : 'Batch processing error'
        });
      });
    }
  }

  private splitIntoBatches(requests: BatchRequest[], maxSize: number): BatchRequest[][] {
    const batches: BatchRequest[][] = [];
    
    for (let i = 0; i < requests.length; i += maxSize) {
      batches.push(requests.slice(i, i + maxSize));
    }
    
    return batches;
  }

  private updateStats(batchSize: number): void {
    this.stats.totalRequests += batchSize;
    this.stats.batchedRequests += batchSize;
    
    const totalBatches = Math.ceil(this.stats.batchedRequests / this.maxBatchSize);
    this.stats.averageBatchSize = this.stats.batchedRequests / totalBatches;
    
    const requestsSaved = this.stats.batchedRequests - totalBatches;
    this.stats.efficiencyGain = (requestsSaved / this.stats.totalRequests) * 100;
  }

  
  async getUserProfile(): Promise<any> {
    return this.addToBatch({
      endpoint: '/profile',
      method: 'GET'
    });
  }

  async getEmotions(): Promise<any> {
    return this.addToBatch({
      endpoint: '/emotions',
      method: 'GET'
    });
  }

  async getAnalyticsInsights(timeRange: string = '7d'): Promise<any> {
    return this.addToBatch({
      endpoint: '/analytics/insights',
      method: 'POST',
      data: { timeRange }
    });
  }

  async getCloudEvents(): Promise<any> {
    return this.addToBatch({
      endpoint: '/cloud/events',
      method: 'GET'
    });
  }

  async getConversationHistory(): Promise<any> {
    return this.addToBatch({
      endpoint: '/chat/history',
      method: 'GET'
    });
  }

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

  async flushBatch(): Promise<void> {
    if (this.queue.length > 0) {
      await this.processBatch();
    }
  }

  clearBatch(): void {
    this.queue = [];
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  getStats(): BatchStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      batchedRequests: 0,
      individualRequests: 0,
      averageBatchSize: 0,
      efficiencyGain: 0
    };
  }

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

let instance: BatchApiService | null = null;

export const getBatchApiService = (): BatchApiService => {
  if (!instance) {
    instance = new BatchApiService();
  }
  return instance;
};

export default getBatchApiService;
export type { BatchStats };