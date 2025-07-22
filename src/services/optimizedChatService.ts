import ApiService from './api';
import CloudAuth from './cloudAuth';
import { CHAT_API_CONFIG } from './api';
import ToolExecutionService from './toolExecutionService';
import { log } from '../utils/logger';

/**
 * Optimized Chat Service - High Performance Version
 * Bypasses unnecessary validation and processing for better performance
 */
export class OptimizedChatService {
  private static instance: OptimizedChatService;
  
  static getInstance(): OptimizedChatService {
    if (!OptimizedChatService.instance) {
      OptimizedChatService.instance = new OptimizedChatService();
    }
    return OptimizedChatService.instance;
  }

  /**
   * HIGH PERFORMANCE: Direct streaming chat without overhead
   * PREMIUM SPEED: Enhanced with fallback support and error handling
   */
  async sendOptimizedMessage(
    message: string,
    onStreamingUpdate?: (partial: string) => void,
    options?: {
      temperature?: number;
      n_predict?: number;
      skipValidation?: boolean;
    },
    attachments?: any[]
  ): Promise<string> {
    const { temperature = 0.8, n_predict = 1024, skipValidation = false } = options || {};
    
    try {
      if (!skipValidation) {
        const token = CloudAuth.getInstance().getToken();
        if (!token) {
          throw new Error('Authentication required');
        }
      }

      if (onStreamingUpdate) {
        return await this.streamingRequest(message, onStreamingUpdate, { temperature, n_predict }, attachments);
      } else {
        return await this.directRequest(message, { temperature, n_predict }, attachments);
      }
    } catch (error: any) {
      log.warn('Primary endpoint failed, attempting fallback', error, 'PREMIUM_SPEED');
      
      try {
        return await this.legacyFallback(message, onStreamingUpdate, { temperature, n_predict }, attachments);
      } catch (fallbackError: any) {
        log.error('Both endpoints failed', fallbackError, 'PREMIUM_SPEED');
        throw new Error(error.message || 'Failed to send message');
      }
    }
  }

  private async legacyFallback(
    message: string,
    onStreamingUpdate?: (partial: string) => void,
    options?: { temperature: number; n_predict: number },
    attachments?: any[]
  ): Promise<string> {
    log.info('Using legacy /completion endpoint', undefined, 'FALLBACK');
    
    const token = CloudAuth.getInstance().getToken();
    const { temperature = 0.8, n_predict = 1024 } = options || {};
    
    const response = await fetch(CHAT_API_CONFIG.LEGACY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: message.trim(),
        stream: false,
        temperature,
        n_predict,
        stop: CHAT_API_CONFIG.REQUEST_DEFAULTS.stop,
        ...(attachments && attachments.length > 0 && { attachments })
      })
    });

    if (!response.ok) {
      throw new Error(`Legacy API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content || data.message || 'No response received';
    
    return content;
  }

  private async directRequest(
    message: string,
    options: { temperature: number; n_predict: number },
    attachments?: any[]
  ): Promise<string> {
    const token = CloudAuth.getInstance().getToken();
    
    const response = await fetch(CHAT_API_CONFIG.PRODUCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: message.trim(),
        prompt: message.trim(),
        stream: false,
        temperature: options.temperature,
        n_predict: options.n_predict,
        stop: CHAT_API_CONFIG.REQUEST_DEFAULTS.stop,
        ...(attachments && attachments.length > 0 && { attachments })
      })
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    const content = data.success && data.data 
      ? data.data.response 
      : data.content || data.message || 'No response received';
    
    this.detectAndTriggerToolExecution(content);
    
    return content;
  }

  private async streamingRequest(
    message: string,
    onUpdate: (partial: string) => void,
    options: { temperature: number; n_predict: number },
    attachments?: any[]
  ): Promise<string> {
    const token = CloudAuth.getInstance().getToken();
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let fullContent = '';
      let buffer = '';
      let hasReceivedToolResult = false;
      let initialResponseLength = 0;
      let isResolved = false;
      
      // Cleanup function to prevent memory leaks
      const cleanup = () => {
        if (xhr.readyState !== XMLHttpRequest.DONE) {
          xhr.abort();
        }
        xhr.onreadystatechange = null;
        xhr.onerror = null;
        xhr.ontimeout = null;
        xhr.onabort = null;
      };
      
      const safeResolve = (value: string) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve(value);
        }
      };
      
      const safeReject = (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          reject(error);
        }
      };
      
      xhr.open('POST', CHAT_API_CONFIG.PRODUCTION_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.timeout = 30000; // 30 second timeout
      
      xhr.onreadystatechange = () => {
        if (isResolved) return;
        
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const chunk = xhr.responseText.substring(buffer.length);
          buffer = xhr.responseText;
          
          if (chunk) {
            this.processStreamChunk(chunk, (content) => {
              if (isResolved) return;
              
              if (content.includes('🔧 **') && !hasReceivedToolResult) {
                hasReceivedToolResult = true;
                initialResponseLength = fullContent.length;
                log.debug('Tool result detected, tracking for deduplication', undefined, 'TOOL_TRACKING');
              }
              
              const shouldUpdate = this.shouldUpdateUI(content, fullContent.length);
              
              if (shouldUpdate) {
                fullContent += content;
                
                this.detectAndTriggerToolExecution(content);
                
                onUpdate(fullContent); // Pass accumulated content to UI
              }
            });
          }
          
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
              safeResolve(fullContent);
            } else {
              safeReject(new Error(`Stream error: ${xhr.status}`));
            }
          }
        }
      };
      
      xhr.onerror = () => safeReject(new Error('Network error'));
      xhr.ontimeout = () => safeReject(new Error('Request timeout'));
      xhr.onabort = () => safeReject(new Error('Request aborted'));
      
      const payload: any = {
        message: message.trim(),
        prompt: message.trim(),
        stream: true,
        temperature: options.temperature,
        n_predict: options.n_predict,
        stop: CHAT_API_CONFIG.REQUEST_DEFAULTS.stop
      };
      
      if (attachments && attachments.length > 0) {
        payload.attachments = attachments;
      }
      
      try {
        xhr.send(JSON.stringify(payload));
      } catch (error) {
        safeReject(new Error(`Send failed: ${error}`));
      }
    });
  }

  private shouldUpdateUI(newContent: string, currentLength: number): boolean {
    // Reduced frequency to prevent info overload
    if (currentLength < 50) return true;
    
    // For long messages, reduce update frequency significantly  
    if (currentLength > 500 && newContent.length < 15) {
      return Math.random() < 0.1; // Much lower frequency
    }
    
    // Only update for meaningful chunks
    if (newContent.length > 30 || newContent.includes('\n\n')) return true;
    
    // Always update for tool indicators
    if (newContent.includes('🔧') || newContent.includes('**')) return true;
    
    // Default to less frequent updates
    return newContent.length > 15;
  }

  private processStreamChunk(
    chunk: string,
    onContentReceived: (content: string) => void
  ): void {
    const lines = chunk.split('\n');
    let accumulatedContent = '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6).trim();
        
        if (data === '[DONE]') {
          if (accumulatedContent) {
            onContentReceived(accumulatedContent);
          }
          return;
        }
        
        if (data.includes('keepAlive')) {
          continue;
        }
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) {
            accumulatedContent += parsed.content;
          } else if (parsed.data && parsed.data.response) {
            accumulatedContent += parsed.data.response;
          }
        } catch {
          if (data && data !== '[DONE]' && !data.includes('keepAlive')) {
            accumulatedContent += data;
          }
        }
      }
    }
    
    // Send accumulated content in batches to reduce update frequency
    if (accumulatedContent) {
      onContentReceived(accumulatedContent);
    }
  }

  /**
   * BATCH UBPM QUERIES - Optimized for behavioral analysis
   */
  async sendUBPMQuery(
    query: string,
    onStreamingUpdate?: (partial: string) => void,
    attachments?: any[]
  ): Promise<string> {
    // Optimize for UBPM queries
    const ubpmKeywords = [
      'ubpm', 'my ubpm', 'whats my ubpm', "what's my ubpm",
      'user behavior profile', 'behavioral profile', 'my behavior profile',
      'my patterns', 'behavioral patterns', 'my behavioral patterns',
      'tell me about myself', 'analyze me', 'what do you know about me',
      'my personality', 'my communication style', 'how do i behave',
      'my habits', 'my preferences', 'my tendencies'
    ];

    const isUBPMQuery = ubpmKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    if (isUBPMQuery) {
      log.debug('UBPM Query Detected', undefined, 'UBPM');
      
      // Use higher temperature for more creative UBPM analysis
      return await this.sendOptimizedMessage(query, onStreamingUpdate, {
        temperature: 0.9,
        n_predict: 1500, // More tokens for comprehensive analysis
        skipValidation: false
      }, attachments);
    }

    return await this.sendOptimizedMessage(query, onStreamingUpdate, undefined, attachments);
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendOptimizedMessage('ping', undefined, {
        temperature: 0.1,
        n_predict: 50,
        skipValidation: false
      });
      
      return response.length > 0;
    } catch (error) {
      console.error('Connection Test Failed:', error);
      return false;
    }
  }

  private detectAndTriggerToolExecution(content: string): void {
    if (!content) return;
    
    // Check for any web search related content 
    if (content.includes('🔍') || content.includes('🎵') || content.includes('📰') || content.includes('🌐') || 
        content.toLowerCase().includes('search') || content.toLowerCase().includes('found') || 
        content.toLowerCase().includes('results') || content.toLowerCase().includes('web')) {
      console.log('🔧 OptimizedChat: Checking content for tool patterns:', content.substring(0, 200));
      
      // Debug: Log any 🌐 patterns we find
      if (content.includes('🌐')) {
        console.log('🔧 OptimizedChat: Found 🌐 in content:', content.substring(0, 300));
      }
      
      // Debug: Check for any search completion indicators
      if (content.toLowerCase().includes('found') && content.toLowerCase().includes('result')) {
        console.log('🔧 OptimizedChat: Found potential search completion:', content.substring(0, 300));
      }
    }
    
    const toolExecutionService = ToolExecutionService.getInstance();
    
    const toolPatterns = [
      { 
        regex: /🔍\s*(Searching the web for:|Searching web for:|Web search for:)/i, 
        tool: 'web_search', 
        action: 'Searching the web' 
      },
      { 
        regex: /🔍.*\*\*Found \d+ search results:\*\*/i, 
        tool: 'web_search', 
        action: 'Found search results',
        isCompletion: true
      },
      { 
        regex: /📰\s*(Searching latest news:|News search for:|Finding latest news)/i, 
        tool: 'news_search', 
        action: 'Searching latest news' 
      },
      { 
        regex: /🐦\s*(Searching (twitter|reddit|social media):|Social search for:)/i, 
        tool: 'social_search', 
        action: 'Searching social media' 
      },
      { 
        regex: /🎓\s*(Searching academic papers:|Academic search for:|Research search)/i, 
        tool: 'academic_search', 
        action: 'Searching academic content' 
      },
      { 
        regex: /🖼️\s*(Finding images:|Image search for:|Searching for images)/i, 
        tool: 'image_search', 
        action: 'Searching for images' 
      },
      
      { 
        regex: /🎵\s*(Finding music recommendations|Getting music recommendations)/i, 
        tool: 'music_recommendations', 
        action: 'Finding music recommendations' 
      },
      { 
        regex: /🎧\s*(Creating Spotify playlist|Creating playlist)/i, 
        tool: 'spotify_playlist', 
        action: 'Creating Spotify playlist' 
      },
      
      { 
        regex: /🌤️\s*(Checking weather for:|Getting weather for:)/i, 
        tool: 'weather_check', 
        action: 'Checking weather' 
      },
      { 
        regex: /🕐\s*(Converting time:|Time conversion:)/i, 
        tool: 'timezone_converter', 
        action: 'Converting time zones' 
      },
      { 
        regex: /🧮\s*(Calculating:|Performing calculation:)/i, 
        tool: 'calculator', 
        action: 'Performing calculation' 
      },
      { 
        regex: /🌐\s*(Translating to |Translation to )/i, 
        tool: 'translation', 
        action: 'Translating text' 
      },
      
      { 
        regex: /📈\s*(Getting [A-Z]+ stock data|Stock lookup for:)/i, 
        tool: 'stock_lookup', 
        action: 'Looking up stock data' 
      },
      { 
        regex: /₿\s*(Getting [A-Z]+ crypto price|Crypto lookup for:)/i, 
        tool: 'crypto_lookup', 
        action: 'Looking up crypto prices' 
      },
      { 
        regex: /💱\s*(Converting \d+.*?→|Currency conversion:)/i, 
        tool: 'currency_converter', 
        action: 'Converting currency' 
      },
      
      { 
        regex: /✍️\s*(Generating \w+ content:|Creating \w+ content:)/i, 
        tool: 'text_generator', 
        action: 'Generating text content' 
      },
      { 
        regex: /💻\s*(Writing \w+ code:|Generating code:)/i, 
        tool: 'code_generator', 
        action: 'Generating code' 
      },
      { 
        regex: /💼\s*(Creating LinkedIn \w+:|LinkedIn helper:)/i, 
        tool: 'linkedin_helper', 
        action: 'Creating LinkedIn content' 
      },
      { 
        regex: /📧\s*(Drafting email:|Processing email:)/i, 
        tool: 'email_assistant', 
        action: 'Assisting with email' 
      },
      
      { 
        regex: /💪\s*(Logging fitness:|Tracking fitness:)/i, 
        tool: 'fitness_tracker', 
        action: 'Tracking fitness' 
      },
      { 
        regex: /🥗\s*(Analyzing nutrition for:|Nutrition lookup for:)/i, 
        tool: 'nutrition_lookup', 
        action: 'Looking up nutrition info' 
      },
      
      { 
        regex: /🍽️\s*(Booking at |Booking reservation at)/i, 
        tool: 'reservation_booking', 
        action: 'Booking restaurant' 
      },
      { 
        regex: /✈️\s*(Planning \d+-day trip|Travel planning for:)/i, 
        tool: 'itinerary_generator', 
        action: 'Planning travel' 
      },
      { 
        regex: /💳\s*(Checking credits|Managing credits)/i, 
        tool: 'credit_management', 
        action: 'Managing credits' 
      },
      
      { 
        regex: /📱\s*(Generating QR code for |Creating QR code)/i, 
        tool: 'qr_generator', 
        action: 'Generating QR code' 
      },
      { 
        regex: /🔒\s*(Generating secure password|Creating password)/i, 
        tool: 'password_generator', 
        action: 'Generating password' 
      },
    ];
    
    for (const pattern of toolPatterns) {
      if (pattern.regex.test(content)) {
        console.log(`🔧 OptimizedChat: Detected ${pattern.tool} execution from server response:`, content.substring(0, 100));
        
        const activeExecutions = toolExecutionService.getCurrentExecutions();
        const existingExecution = activeExecutions.find(exec => 
          exec.toolName === pattern.tool && exec.status !== 'completed' && exec.status !== 'error'
        );
        
        // Handle completion patterns differently
        if ((pattern as any).isCompletion && existingExecution) {
          console.log(`🔧 OptimizedChat: Completing ${pattern.tool} execution (${existingExecution.id})`);
          toolExecutionService.completeExecution(existingExecution.id, { 
            success: true,
            serverResponse: content.trim()
          });
        } else if (!existingExecution && !(pattern as any).isCompletion) {
          const executionId = toolExecutionService.startExecution(pattern.tool, { 
            detectedFromServer: true,
            serverMessage: content.trim()
          });
          console.log(`🔧 OptimizedChat: Started tracking ${pattern.tool} execution (${executionId})`);
          
          // Update progress to show it's executing
          setTimeout(() => {
            toolExecutionService.updateProgress(executionId, 50, { 
              action: pattern.action,
              serverResponse: content.trim()
            });
          }, 100);
          
          // Auto-complete faster for better UX
          setTimeout(() => {
            const execution = toolExecutionService.getAllExecutions().find(e => e.id === executionId);
            if (execution && execution.status === 'executing') {
              toolExecutionService.completeExecution(executionId, { 
                success: true,
                serverResponse: content.trim()
              });
            }
          }, 1500);  // 1.5 seconds for completion
          
        } else {
          // Update existing execution
          console.log(`🔧 OptimizedChat: Updating existing ${pattern.tool} execution`);
          toolExecutionService.updateProgress(existingExecution.id, 75, { 
            serverUpdate: content.trim()
          });
        }
        
        // Only trigger for the first match to avoid duplicates
        break;
      }
    }
  }
}

// Lazy instantiation for better app startup performance
export const getOptimizedChatService = () => OptimizedChatService.getInstance();