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
  private readonly UPDATE_THROTTLE_MS = 16; // ~60fps updates
  private readonly CONNECTION_TIMEOUT_MS = 25000; // Reduced from 30s
  
  static getInstance(): OptimizedStreamingService {
    if (!OptimizedStreamingService.instance) {
      OptimizedStreamingService.instance = new OptimizedStreamingService();
    }
    return OptimizedStreamingService.instance;
  }

  /**
   * ULTRA-FAST STREAMING: Optimized for minimal latency
   * - Connection pooling for faster response times
   * - Reduced buffer processing overhead
   * - Throttled UI updates for smooth streaming
   * - Immediate fallback on connection issues
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

    return new Promise((resolve, reject) => {
      const connectionId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get or create XHR connection
      const xhr = this.getOptimizedXHRConnection();
      this.activeConnections.set(connectionId, xhr);
      
      let fullContent = '';
      let buffer = '';
      let lastUpdateTime = 0;
      let isComplete = false;
      
      // Performance tracking
      let firstByteTime = 0;
      let totalChunks = 0;

      const cleanup = () => {
        this.activeConnections.delete(connectionId);
        this.returnXHRToPool(xhr);
        
        // Log performance metrics
        const totalTime = Date.now() - startTime;
        const ttfb = firstByteTime - startTime;
        log.debug('🚀 Streaming completed', { 
          totalTime, 
          ttfb, 
          totalChunks,
          avgLatency: totalTime / Math.max(totalChunks, 1),
          contentLength: fullContent.length 
        }, 'OptimizedStreaming');
      };

      const safeResolve = (content: string) => {
        if (!isComplete) {
          isComplete = true;
          cleanup();
          onComplete?.({ content, personalityContext: null });
          resolve(content);
        }
      };

      const safeReject = (error: Error) => {
        if (!isComplete) {
          isComplete = true;
          cleanup();
          onError?.(error);
          reject(error);
        }
      };

      // Optimized chunk processor with batching
      const processBuffer = () => {
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        let hasNewContent = false;
        let chunkContent = '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            
            if (data === '[DONE]') {
              if (chunkContent) {
                fullContent += chunkContent;
                onChunk(fullContent);
              }
              safeResolve(fullContent);
              return;
            }
            
            if (data && !data.includes('keepAlive')) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  chunkContent += parsed.content;
                  hasNewContent = true;
                }
              } catch {
                // Handle raw text data - filter out malformed JSON objects
                if (data !== '[DONE]' && !data.match(/^\s*[{]/)) {
                  chunkContent += data;
                  hasNewContent = true;
                }
              }
            }
          }
        }
        
        // Throttled UI updates for better performance
        if (hasNewContent) {
          fullContent += chunkContent;
          totalChunks++;
          
          const now = Date.now();
          if (now - lastUpdateTime >= this.UPDATE_THROTTLE_MS) {
            onChunk(fullContent);
            lastUpdateTime = now;
          }
        }
      };

      // Configure optimized XHR
      xhr.open('POST', PRODUCTION_API_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.setRequestHeader('Connection', 'keep-alive');
      xhr.timeout = this.CONNECTION_TIMEOUT_MS;
      
      // Optimized state change handler
      xhr.onreadystatechange = () => {
        if (isComplete) return;

        if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED && !firstByteTime) {
          firstByteTime = Date.now();
          log.debug('🚀 First byte received', { ttfb: firstByteTime - startTime }, 'OptimizedStreaming');
        }
        
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const newData = xhr.responseText.substring(buffer.length);
          if (newData) {
            buffer += newData;
            
            // Process in chunks to avoid blocking UI thread
            if (buffer.length > this.CHUNK_BUFFER_SIZE) {
              // Use requestAnimationFrame for non-blocking processing
              requestAnimationFrame(() => processBuffer());
            }
          }
          
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (buffer.length > 0) {
              processBuffer();
            }
            if (xhr.status === 200 && !isComplete) {
              safeResolve(fullContent);
            } else if (!isComplete) {
              safeReject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          }
        }
      };

      // Error handlers with automatic fallback
      xhr.onerror = () => {
        log.warn('🚀 Primary streaming failed, attempting fallback', null, 'OptimizedStreaming');
        this.fallbackToLegacy(message, onChunk)
          .then(safeResolve)
          .catch(safeReject);
      };
      
      xhr.ontimeout = () => {
        log.warn('🚀 Streaming timeout, attempting fallback', null, 'OptimizedStreaming');
        this.fallbackToLegacy(message, onChunk)
          .then(safeResolve)
          .catch(safeReject);
      };

      // Send optimized payload
      const payload = {
        message: message.message.trim(),
        stream: true,
        temperature: message.temperature || 0.7,
        n_predict: message.n_predict || 1024,
        stop: ['<|im_end|>', '\n<|im_start|>'],
        ...(message.attachments && message.attachments.length > 0 && {
          attachments: message.attachments
        })
      };

      try {
        xhr.send(JSON.stringify(payload));
        log.debug('🚀 Streaming request sent', { payloadSize: JSON.stringify(payload).length }, 'OptimizedStreaming');
      } catch (error) {
        safeReject(new Error(`Failed to send request: ${error}`));
      }
    });
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