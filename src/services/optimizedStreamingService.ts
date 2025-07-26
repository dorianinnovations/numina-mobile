import CloudAuth from './cloudAuth';
import NetInfo from '@react-native-community/netinfo';
import { log } from '../utils/logger';

const PRODUCTION_API_URL = 'https://server-a7od.onrender.com/ai/adaptive-chat';
const LEGACY_API_URL = 'https://server-a7od.onrender.com/completion';

interface StreamingMessage {
  message: string;
  attachments?: any[];
  temperature?: number;
  n_predict?: number;
}

interface StreamingResponse {
  content: string;
  personalityContext?: any;
}

export class OptimizedStreamingService {
  private static instance: OptimizedStreamingService;
  
  // Performance optimization: reuse connection pool
  private activeConnections = new Map<string, XMLHttpRequest>();
  private connectionPool: XMLHttpRequest[] = [];
  private maxPoolSize = 3;
  
  // Streaming optimization settings
  private readonly CHUNK_BUFFER_SIZE = 1024; // Process chunks in 1KB batches
  private readonly UPDATE_THROTTLE_MS = 8; // ~120fps updates for ProMotion displays
  private readonly CONNECTION_TIMEOUT_MS = 25000; // Reduced from 30s
  
  static getInstance(): OptimizedStreamingService {
    if (!OptimizedStreamingService.instance) {
      OptimizedStreamingService.instance = new OptimizedStreamingService();
    }
    return OptimizedStreamingService.instance;
  }

  /**
   * ULTRA-FAST STREAMING: Now uses unified API service for React Native compatibility
   * Delegates to api.sendAdaptiveChatMessage for consistent streaming
   */
  async sendStreamingMessage(
    message: StreamingMessage,
    onChunk: (chunk: string) => void,
    onComplete?: (response: StreamingResponse) => void,
    onError?: (error: Error) => void
  ): Promise<string> {
    const startTime = Date.now();
    log.debug('🚀 Starting optimized streaming request', { messageLength: message.message.length }, 'OptimizedStreaming');
    
    // Quick network check
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      const error = new Error('No network connection');
      onError?.(error);
      throw error;
    }

    const token = CloudAuth.getInstance().getToken();
    if (!token) {
      const error = new Error('No authentication token');
      onError?.(error);
      throw error;
    }

    try {
      // Use unified API service for React Native compatibility
      const { sendAdaptiveChatMessage } = await import('./api');
      
      const result = await sendAdaptiveChatMessage(
        message.message,
        onChunk,
        message.attachments || []
      );
      
      // Performance tracking
      const totalTime = Date.now() - startTime;
      log.debug('🚀 Streaming completed', { 
        totalTime, 
        contentLength: result.length 
      }, 'OptimizedStreaming');
      
      onComplete?.({ content: result, personalityContext: null });
      return result;
      
    } catch (error: any) {
      log.warn('🚀 Primary streaming failed, attempting fallback', error, 'OptimizedStreaming');
      
      try {
        const fallbackResult = await this.fallbackToLegacy(message, onChunk);
        onComplete?.({ content: fallbackResult, personalityContext: null });
        return fallbackResult;
      } catch (fallbackError: any) {
        const finalError = new Error(`Streaming failed: ${error.message}`);
        onError?.(finalError);
        throw finalError;
      }
    }
  }

  /**
   * Get or create an optimized XHR connection
   */
  private getOptimizedXHRConnection(): XMLHttpRequest {
    // Try to reuse a pooled connection
    const pooled = this.connectionPool.pop();
    if (pooled) {
      // Reset the connection for reuse
      pooled.onreadystatechange = null;
      pooled.onerror = null;
      pooled.ontimeout = null;
      pooled.onabort = null;
      return pooled;
    }
    
    // Create new optimized connection
    const xhr = new XMLHttpRequest();
    
    // Performance optimizations
    if ('responseType' in xhr) {
      // Use more efficient response handling where available
      xhr.responseType = 'text';
    }
    
    return xhr;
  }

  /**
   * Return XHR to pool for reuse
   */
  private returnXHRToPool(xhr: XMLHttpRequest) {
    if (this.connectionPool.length < this.maxPoolSize) {
      // Clean up event handlers
      xhr.onreadystatechange = null;
      xhr.onerror = null;
      xhr.ontimeout = null;
      xhr.onabort = null;
      
      this.connectionPool.push(xhr);
    } else {
      // Abort if pool is full
      xhr.abort();
    }
  }

  /**
   * Fast fallback to legacy endpoint
   */
  private async fallbackToLegacy(
    message: StreamingMessage,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    log.info('🔄 Using legacy fallback endpoint', null, 'OptimizedStreaming');
    
    const token = CloudAuth.getInstance().getToken();
    
    try {
      const response = await fetch(LEGACY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: message.message.trim(),
          stream: false,
          temperature: message.temperature || 0.7,
          n_predict: message.n_predict || 1024,
          stop: ['<|im_end|>', '\n<|im_start|>'],
          ...(message.attachments && message.attachments.length > 0 && {
            attachments: message.attachments
          })
        })
      });

      if (!response.ok) {
        throw new Error(`Legacy API error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content || data.message || 'No response received';
      
      // Simulate streaming for consistent UX
      onChunk(content);
      
      return content;
    } catch (error) {
      log.error('🔄 Legacy fallback also failed', error, 'OptimizedStreaming');
      throw new Error(`Both streaming and fallback failed: ${error}`);
    }
  }

  /**
   * Cleanup all active connections
   */
  cleanup() {
    // Abort all active connections
    for (const [id, xhr] of this.activeConnections) {
      xhr.abort();
      log.debug('🧹 Aborted active connection', { connectionId: id }, 'OptimizedStreaming');
    }
    this.activeConnections.clear();
    
    // Clear connection pool
    for (const xhr of this.connectionPool) {
      xhr.abort();
    }
    this.connectionPool.length = 0;
    
    log.debug('🧹 Cleanup completed', null, 'OptimizedStreaming');
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      activeConnections: this.activeConnections.size,
      pooledConnections: this.connectionPool.length,
      maxPoolSize: this.maxPoolSize,
      updateThrottleMs: this.UPDATE_THROTTLE_MS,
      chunkBufferSize: this.CHUNK_BUFFER_SIZE,
      connectionTimeoutMs: this.CONNECTION_TIMEOUT_MS
    };
  }
}

export default OptimizedStreamingService.getInstance();