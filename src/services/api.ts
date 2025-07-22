import NetInfo from '@react-native-community/netinfo';
import CloudAuth from './cloudAuth';
import ToolExecutionService from './toolExecutionService';
import LocationContextService from './locationContextService';
import { log } from '../utils/logger';

import ENV, { SECURITY_HEADERS, validateEnvironment } from '../config/environment';

let environmentValidated = false;

const ensureEnvironmentValid = () => {
  if (!environmentValidated) {
    if (!validateEnvironment()) {
      throw new Error('Invalid environment configuration');
    }
    environmentValidated = true;
  }
};

export const API_BASE_URL = ENV.API_BASE_URL;

export const CHAT_API_CONFIG = {
  PRODUCTION_URL: `${ENV.API_BASE_URL}/ai/adaptive-chat`,
  LEGACY_URL: `${ENV.API_BASE_URL}/completion`,
  REQUEST_DEFAULTS: {
    stream: true,
    temperature: 0.8,
    n_predict: 1024,
    stop: ['<|im_end|>', '\n<|im_start|>']
  }
};

const REQUEST_TIMEOUT = 15000; // Reduced to 15 seconds for mobile optimization

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

interface UserData {
  id: string;
  email: string;
  profile?: any;
  createdAt: string;
  isPremium?: boolean;
  settings?: any;
}

interface ChatMessage {
  prompt: string;
  stream?: boolean;
  temperature?: number;
  n_predict?: number;
  stop?: string[];
  files?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  extractedText?: string;
}

interface EmotionData {
  emotion: string;
  intensity: number;
  description?: string;
  timestamp: string;
  userId: string;
}



interface CloudEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  location?: string;
  maxParticipants: number;
  currentParticipants: number;
  hostId: string;
  hostName: string;
  aiMatchScore?: number;
  emotionalCompatibility?: 'high' | 'medium' | 'low';
  personalizedReason?: string;
  moodBoostPotential?: number;
  communityVibe?: string;
  suggestedConnections?: string[];
}

interface CompatibilityAnalysis {
  score: number;
  reasoning: string;
  sharedInterests: string[];
  complementaryTraits: string[];
  potentialChallenges: string[];
}

interface BatchRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
}

interface BatchResponse {
  success: boolean;
  batchId: string;
  results: Array<{
    endpoint: string;
    method: string;
    success: boolean;
    data?: any;
    error?: string;
    timestamp: string;
  }>;
  timestamp: string;
}

interface SyncData {
  timestamp: string;
  lastSync: string;
  data: {
    profile?: {
      updated: boolean;
      data?: any;
    };
    emotions?: {
      updated: boolean;
      data?: any[];
      count?: number;
    };
    conversations?: {
      updated: boolean;
      data?: any[];
    };
    analytics?: {
      updated: boolean;
      data?: any;
      cached?: boolean;
    };
  };
}

interface OfflineQueueItem {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

interface AppConfig {
  features: {
    realTimeChat: boolean;
    offlineMode: boolean;
    pushNotifications: boolean;
    analyticsLLM: boolean;
    cloudEvents: boolean;
    emotionalTracking: boolean;
    adaptivePersonality: boolean;
  };
  limits: {
    batchRequestLimit: number;
    offlineQueueLimit: number;
    messageLengthLimit: number;
    fileUploadLimit: number;
  };
  endpoints: {
    websocket: string;
    api: string;
    cdn?: string;
  };
  user: {
    preferences: any;
    settings: any;
  };
  version: string;
  timestamp: string;
}


class ApiService {
  private static baseURL = API_BASE_URL;

  private static async validateNetworkState(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        log.warn('No network connection available', undefined, 'API');
        return false;
      }
      return true;
    } catch (error) {
      log.error('Failed to check network state', error, 'API');
      return false;
    }
  }

  private static logError(context: string, error: any, endpoint?: string): void {
    const errorInfo = {
      context,
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    
    log.error('API Error', errorInfo, 'API');
    
    if (__DEV__) {
      log.debug('Detailed Error Info', { context, endpoint, error }, 'API');
    }
  }

  // Safe JSON parsing helper
  private static async parseJsonSafely(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.warn('🚨 API: Server returned non-JSON response:', text.substring(0, 200));
      
      // Try to extract error message from HTML if it's an error page
      if (text.includes('<title>') && text.includes('Error')) {
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        const errorMsg = titleMatch ? titleMatch[1] : 'Server returned HTML error page';
        throw new Error(errorMsg);
      }
      
      throw new Error('Server returned non-JSON response');
    }
    
    try {
      return await response.json();
    } catch (error) {
      console.error('🚨 API: JSON parse error:', error);
      throw new Error('Invalid JSON response from server');
    }
  }

  static async apiRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    retryAttempts: number = 3
  ): Promise<ApiResponse<T>> {
    ensureEnvironmentValid();
    
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    log.debug('Making request', { url: `${this.baseURL}${endpoint}`, baseURL: this.baseURL }, 'API');
    
    const isNetworkAvailable = await this.validateNetworkState();
    if (!isNetworkAvailable) {
      return {
        success: false,
        error: 'No network connection available. Please check your internet connection and try again.',
      };
    }
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        let token: string | null = null;
        try {
          if (!endpoint.includes('/login') && !endpoint.includes('/signup')) {
            token = CloudAuth.getInstance().getToken();
          }
        } catch (error) {
          console.warn('Could not get token for API request:', endpoint);
        }
        
        const defaultHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...SECURITY_HEADERS,
        };

        if (token) {
          defaultHeaders.Authorization = `Bearer ${token}`;
        }

        const headers = {
          ...defaultHeaders,
          ...(options.headers as Record<string, string>),
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const config: RequestInit = {
          ...options,
          headers,
          signal: controller.signal,
        };

        const url = `${this.baseURL}${endpoint}`;
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await this.parseJsonSafely(response).catch(() => ({ message: 'Network error' }));
          
          if (response.status === 401 && 
              !endpoint.includes('/login') && 
              !endpoint.includes('/signup') &&
              !endpoint.includes('/analytics/llm') &&
              !endpoint.includes('/ai/personality-recommendations') &&
              !endpoint.includes('/ai/emotional-state') &&
              !endpoint.includes('/cloud/events') &&
              !endpoint.includes('/numina-personality/start-rapid-updates')) {
            CloudAuth.getInstance().logout();
            throw new Error('Authentication expired');
          }
          
          if (response.status >= 400 && response.status < 500) {
            throw new Error(errorData.message || `HTTP ${response.status}`);
          }
          
          if (attempt < retryAttempts) {
            const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await delay(backoffDelay);
            continue;
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await this.parseJsonSafely(response);
        
        return {
          success: true,
          data,
        };
      } catch (error: any) {
        this.logError('API Request', error, endpoint);
        
        const isNetworkError = error.name === 'TypeError' || 
                              error.message?.includes('fetch') ||
                              error.message?.includes('Failed to fetch') ||
                              error.message?.includes('Network request failed') ||
                              error.message?.includes('timeout') ||
                              error.name === 'AbortError';

        if (error.name === 'AbortError' || 
            error.message?.includes('401') ||
            error.message?.includes('Incorrect email') ||
            error.message?.includes('Email already in use') ||
            error.message?.includes('not logged in') ||
            !isNetworkError) {
          
          if (attempt === retryAttempts && isNetworkError) {
            const shouldQueue = !endpoint.includes('/login') && 
                               !endpoint.includes('/signup') && 
                               !endpoint.includes('/health') &&
                               (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH');
            
            if (shouldQueue) {
              const priority = endpoint.includes('/emotions') ? 'high' : 'normal';
              try {
                const { default: OfflineQueueService } = await import('./offlineQueue');
                await OfflineQueueService.enqueueRequest(endpoint, options, priority);
              } catch (queueError) {
                this.logError('Offline Queue Enqueue', queueError, endpoint);
                console.error('Failed to enqueue request for offline processing:', {
                  endpoint,
                  error: queueError,
                  priority
                });
              }
            }
          }
          
          return {
            success: false,
            error: error.name === 'AbortError' ? 'Request timeout' : error.message || 'Network error occurred',
          };
        }
        
        if (attempt === retryAttempts) {
          const shouldQueue = !endpoint.includes('/login') && 
                             !endpoint.includes('/signup') && 
                             !endpoint.includes('/health') &&
                             (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH');
          
          if (shouldQueue && isNetworkError) {
            const priority = endpoint.includes('/emotions') ? 'high' : 'normal';
            try {
              const { default: OfflineQueueService } = await import('./offlineQueue');
              await OfflineQueueService.enqueueRequest(endpoint, options, priority);
            } catch (queueError) {
              this.logError('Offline Queue Enqueue', queueError, endpoint);
              console.error('Failed to enqueue request for offline processing:', {
                endpoint,
                error: queueError,
                priority
              });
            }
          }
          
          return {
            success: false,
            error: error.message || 'Network error occurred',
          };
        }
        
        if (isNetworkError) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await delay(backoffDelay);
        } else {
          return {
            success: false,
            error: error.message || 'API error occurred',
          };
        }
      }
    }

    return {
      success: false,
      error: 'Max retry attempts exceeded',
    };
  }

  static async login(credentials: LoginCredentials): Promise<ApiResponse<{
    token: string;
    data: { user: UserData };
  }>> {
    return this.apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async signup(credentials: SignUpCredentials): Promise<ApiResponse<{
    token: string;
    data: { user: UserData };
  }>> {
    return this.apiRequest('/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async logout(): Promise<ApiResponse> {
    return this.apiRequest('/logout', {
      method: 'POST',
    });
  }

  static async deleteAccount(userId?: string): Promise<ApiResponse<any>> {
    const endpoint = userId ? `/user/delete/${userId}` : '/user/delete';
    return this.apiRequest(endpoint, {
      method: 'DELETE',
    });
  }

  static async getUserProfile(): Promise<ApiResponse<UserData>> {
    return this.apiRequest('/profile');
  }

  static async sendChatMessageStreaming(
    message: ChatMessage, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const token = CloudAuth.getInstance().getToken();
    
    const chatUrl = CHAT_API_CONFIG.PRODUCTION_URL;


    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProcessedIndex = 0;
      let fullContent = '';
      
      xhr.open('POST', chatUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const currentLength = xhr.responseText.length;
          const newText = xhr.responseText.slice(lastProcessedIndex);
          
          
          if (newText) {
            lastProcessedIndex = currentLength;
            
            const lines = newText.split('\n');
            
            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                const content = line.substring(6).trim();
                if (content !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(content);
                    if (parsed.content) {
                      fullContent += parsed.content;
                      onChunk(fullContent);
                    }
                  } catch {
                    if (content) {
                      fullContent += content;
                      onChunk(fullContent);
                    }
                  }
                }
              }
            }
          }
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(fullContent);
        } else {
          reject(new Error(`Chat API request failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error'));
      };
      
      xhr.send(JSON.stringify({
        ...CHAT_API_CONFIG.REQUEST_DEFAULTS,
        ...message,
      }));
    });
  }

  static async sendChatMessage(message: ChatMessage): Promise<Response> {
    const result = await this.sendChatMessageStreaming(message, () => {});
    return new Response(result, {
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
    });
  }

  static async getEmotions(): Promise<ApiResponse<any[]>> {
    return {
      success: true,
      data: []
    };
  }

  static async saveEmotion(emotion: EmotionData): Promise<ApiResponse<any>> {
    return this.apiRequest('/emotions', {
      method: 'POST',
      body: JSON.stringify(emotion),
    });
  }

  static async getEmotionHistory(timeRange?: string): Promise<ApiResponse<any[]>> {
    return {
      success: true,
      data: []
    };
  }

  static async callAnalyticsLLM(prompt: string): Promise<ApiResponse<{ content: string }>> {
    return this.apiRequest('/analytics/llm', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        model: 'openai/gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.3
      }),
    });
  }


  // Growth Insights Dashboard endpoints
  static async getPersonalGrowthSummary(timeframe: string = 'week'): Promise<ApiResponse<{
    metrics: {
      positivityRatio: number;
      engagementScore: number;
      topEmotions: Array<{ emotion: string; count: number }>;
    };
    aiInsights: string;
  }>> {
    console.log(`🔍 API: Requesting growth summary for timeframe: ${timeframe}`);
    try {
      const response = await this.apiRequest(`/personal-insights/growth-summary?timeframe=${timeframe}`);
      console.log('✅ API: Growth summary response:', response);
      return response;
    } catch (error: any) {
      // Return proper error without mock data fallback
      throw new Error(`Growth insights API unavailable: ${error.message || error}`);
    }
  }

  // Generate personal growth summary with streaming
  static async getPersonalGrowthSummaryStreaming(
    timeframe: string = 'week',
    onChunk: (chunk: any) => void
  ): Promise<{ content: any; complete: boolean }> {
    const token = CloudAuth.getInstance().getToken();
    const url = `${this.baseURL}/personal-insights/growth-summary?timeframe=${timeframe}&stream=true`;
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProcessedIndex = 0;
      let finalContent: any = null;
      
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const currentLength = xhr.responseText.length;
          const newText = xhr.responseText.slice(lastProcessedIndex);
          
          if (newText) {
            lastProcessedIndex = currentLength;
            
            // Process new chunks in real-time
            const lines = newText.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                
                if (data === '[DONE]') {
                  console.log('🏁 Growth insights streaming completed');
                  resolve({ content: finalContent, complete: true });
                  return;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  onChunk(parsed);
                  
                  if (parsed.type === 'complete') {
                    finalContent = parsed.data;
                  }
                } catch (e) {
                  console.warn('Error parsing growth insights chunk:', e);
                }
              }
            }
          }
        }
        
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            resolve({ content: finalContent, complete: true });
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during growth insights streaming'));
      };
      
      xhr.ontimeout = () => {
        reject(new Error('Growth insights streaming request timed out'));
      };
      
      xhr.timeout = 30000; // 30 seconds timeout
      xhr.send();
    });
  }

  static async getMilestones(): Promise<ApiResponse<{
    milestones: Array<{
      id: string;
      title: string;
      description: string;
      achieved: boolean;
      progress: number;
      category: string;
      celebratedAt?: string;
    }>;
  }>> {
    console.log('🔍 API: Requesting milestones...');
    try {
      const response = await this.apiRequest('/personal-insights/milestones');
      console.log('✅ API: Milestones response:', response);
      return response;
    } catch (error: any) {
      // Return proper error without mock data fallback
      throw new Error(`Milestones API unavailable: ${error.message || error}`);
    }
  }

  static async celebrateMilestone(milestoneId: string): Promise<ApiResponse<any>> {
    return this.apiRequest(`/personal-insights/milestones/${milestoneId}/celebrate`, {
      method: 'POST',
    });
  }

  static async shareEmotionalState(targetUserId: string, emotion: string, intensity: number): Promise<ApiResponse<any>> {
    return this.apiRequest('/social/share-emotion', {
      method: 'POST',
      body: JSON.stringify({
        targetUserId,
        emotion,
        intensity,
        shareType: 'check_in'
      }),
    });
  }

  static async requestSupport(intensity: number, context: string, anonymous: boolean = true): Promise<ApiResponse<any>> {
    return this.apiRequest('/social/request-support', {
      method: 'POST',
      body: JSON.stringify({
        intensity,
        context,
        anonymous
      }),
    });
  }

  // LLM Analytics endpoints
  static async generateLLMInsights(options: {
    days?: number;
    focus?: string;
  } = {}): Promise<ApiResponse<any>> {
    try {
      return await this.apiRequest('/analytics/llm/insights', {
        method: 'POST',
        body: JSON.stringify({
          timeRange: `${options.days || 30}d`,
          focus: options.focus || 'general',
          model: 'openai/gpt-4o-mini',
          maxTokens: 1500,
          temperature: 0.7
        }),
      });
    } catch (error: any) {
      // If endpoint doesn't exist yet, return empty data instead of failing
      if (error.message?.includes('404') || error.message?.includes('Cannot POST')) {
        return {
          success: false,
          error: 'LLM analytics not available yet'
        };
      }
      throw error;
    }
  }



  static async sendAdaptiveChatMessage(
    message: ChatMessage & {
      message?: string;
      emotionalContext?: any;
      personalityStyle?: string;
    },
    onChunk: (chunk: string, context?: any) => void
  ): Promise<{ content: string; personalityContext: any }> {
    const token = CloudAuth.getInstance().getToken();
    const chatUrl = `${this.baseURL}/ai/adaptive-chat`;

    // Validate message content - allow image-only messages for GPT-4o vision
    const messageText = message.message || message.prompt || '';
    const hasAttachments = message.attachments && message.attachments.length > 0;
    
    if (!messageText.trim() && !hasAttachments) {
      console.error('🔄 ADAPTIVE_CHAT: Empty message detected with no attachments, rejecting request');
      throw new Error('Cannot send empty message without attachments to adaptive chat');
    }
    
    if (!messageText.trim() && hasAttachments) {
      console.log('🖼️ ADAPTIVE_CHAT: Image-only message detected for GPT-4o vision');
    }

    // Create personality context from the personalityStyle that was already determined
    const defaultPersonalityContext: any = {
      communicationStyle: (message.personalityStyle as 'supportive' | 'direct' | 'collaborative' | 'encouraging') || 'supportive',
      emotionalTone: message.emotionalContext?.mood === 'happy' || message.emotionalContext?.mood === 'excited' ? 'celebratory' : 
                    message.emotionalContext?.mood === 'anxious' || message.emotionalContext?.mood === 'stressed' ? 'calming' :
                    message.emotionalContext?.mood === 'thoughtful' ? 'analytical' : 'supportive',
      adaptedResponse: true,
      userMoodDetected: message.emotionalContext?.mood,
      responsePersonalization: `Adapted for ${message.emotionalContext?.mood || 'current'} mood`,
    };

    console.log('Chat Request Started');
    console.log('🔄 ADAPTIVE_CHAT: Message payload:', {
      message: messageText,
      hasEmotionalContext: !!message.emotionalContext,
      personalityStyle: message.personalityStyle,
      stream: message.stream,
      messageLength: messageText.length,
      endpoint: chatUrl
    });
    console.log('🧠 ADAPTIVE_CHAT: Using personality context:', defaultPersonalityContext);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProcessedIndex = 0;
      let fullContent = '';
      let personalityContext: any = defaultPersonalityContext;
      let chunkCounter = 0;
      
      xhr.open('POST', chatUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      
      xhr.onreadystatechange = () => {
        try {
          
          if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
            const responseText = xhr.responseText || '';
            const currentLength = responseText.length;
            const newText = responseText.slice(lastProcessedIndex);
            
            
            if (newText) {
              lastProcessedIndex = currentLength;
              const lines = newText.split('\n');
              
              for (const line of lines) {
                if (line && line.trim() && line.startsWith('data: ')) {
                  const content = line.substring(6).trim();
                  
                  if (content && content !== '[DONE]') {
                    try {
                      const parsed = JSON.parse(content);
                      
                      if (parsed && parsed.content) {
                        const newContent = parsed.content;
                        fullContent += newContent;
                        chunkCounter++;
                        
                        // Log content chunks to understand server response
                        console.log(`🔄 ADAPTIVE_CHAT: Chunk ${chunkCounter}:`, newContent.substring(0, 100), '...');
                        
                        // Detect tool execution patterns from server response
                        this.detectAndTriggerToolExecution(newContent);
                        
                        // Send only accumulated content, not just the chunk
                        onChunk(fullContent, personalityContext || undefined);
                      }
                      if (parsed && parsed.personalityContext) {
                        personalityContext = parsed.personalityContext;
                        console.log('🧠 PERSONALITY: Found context in stream:', personalityContext);
                      }
                    } catch (parseError) {
                      console.error('🔄 ADAPTIVE_CHAT: JSON parse failed', { 
                        error: (parseError as Error).message, 
                        content: content.substring(0, 200) 
                      });
                      // For non-JSON content (like plain text streaming), add directly
                      if (content && content.length > 0) {
                        const newContent = content;
                        fullContent += newContent;
                        chunkCounter++;
                        
                        console.log(`🔄 ADAPTIVE_CHAT: Raw chunk ${chunkCounter}:`, newContent.substring(0, 100), '...');
                        
                        // Detect tool execution patterns from server response
                        this.detectAndTriggerToolExecution(newContent);
                        
                        onChunk(fullContent, personalityContext || undefined);
                      }
                    }
                  } else if (content === '[DONE]') {
                    console.log('Chat Stream Complete');
                    // DON'T close connection here - wait for onload to handle completion
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('🔄 CHAT: Stream error:', error);
        }
      };
      
      xhr.onerror = () => {
        console.error('🔄 ADAPTIVE_CHAT: Network error');
        reject(new Error('Network error during adaptive chat'));
      };
      
      xhr.ontimeout = () => {
        console.error('🔄 ADAPTIVE_CHAT: Request timeout');
        reject(new Error('Adaptive chat request timed out'));
      };

      xhr.onload = () => {
        try {
          console.log('🔄 ADAPTIVE_CHAT: Request completed with status:', xhr.status);
          console.log('🔄 ADAPTIVE_CHAT: Response headers:', xhr.getAllResponseHeaders());
          
          if (xhr.status >= 200 && xhr.status < 300) {
            // Check for streaming content first
            if (fullContent) {
              console.log('Chat Response Complete:', fullContent.length, 'chars');
              resolve({
                content: fullContent,
                personalityContext: personalityContext || defaultPersonalityContext
              });
            } else {
              console.log('🔄 ADAPTIVE_CHAT: No streaming content received');
              console.log('🔄 ADAPTIVE_CHAT: Raw response:', xhr.responseText);
              console.log('🔄 ADAPTIVE_CHAT: Full response length:', xhr.responseText.length);
              // Handle JSON response format
              try {
                const jsonResponse = JSON.parse(xhr.responseText);
                console.log('🔄 ADAPTIVE_CHAT: Parsed JSON response:', jsonResponse);
                
                if (jsonResponse.success && jsonResponse.data && jsonResponse.data.response) {
                  resolve({
                    content: jsonResponse.data.response,
                    personalityContext: {
                      communicationStyle: jsonResponse.data.tone || defaultPersonalityContext.communicationStyle,
                      emotionalTone: jsonResponse.data.tone || defaultPersonalityContext.emotionalTone,
                      adaptedResponse: true,
                      userMoodDetected: message.emotionalContext?.mood,
                      responsePersonalization: `Adapted for ${message.emotionalContext?.mood || 'current'} mood`
                    }
                  });
                } else {
                  console.error('🔄 CHAT: Server returned [DONE] with no content - tools not executing');
                  reject(new Error('Invalid response format from adaptive chat service'));
                }
              } catch (parseError) {
                console.error('🔄 CHAT: Failed to parse server response');
                reject(new Error('Failed to parse adaptive chat response'));
              }
            }
          } else if (xhr.status === 429) {
            console.error('🔄 CHAT: Rate limit reached (429)', xhr.status);
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              const rateLimitError = new Error(errorResponse.message || 'Rate limit exceeded');
              (rateLimitError as any).status = 429;
              (rateLimitError as any).tier = errorResponse.tier;
              (rateLimitError as any).upgradeOptions = errorResponse.upgradeOptions;
              (rateLimitError as any).isRateLimit = true;
              reject(rateLimitError);
            } catch (parseError) {
              const rateLimitError = new Error('Rate limit exceeded');
              (rateLimitError as any).status = 429;
              (rateLimitError as any).isRateLimit = true;
              reject(rateLimitError);
            }
          } else {
            console.error('🔄 CHAT: HTTP error', xhr.status);
            reject(new Error(`Adaptive chat request failed: ${xhr.status}`));
          }
        } catch (error) {
          console.error('🔄 CHAT: Unexpected error', error);
          reject(error);
        }
      };
      
      // Set aggressive timeout for mobile UX - tools should be fast
      xhr.timeout = 30000; // 30 seconds max for mobile chat (reduced from 2 minutes)
      
      // Get location context for AI tools
      const locationContext = LocationContextService.getInstance().getCurrentLocationContext();
      
      const requestPayload = {
        ...message,
        stream: true,
        userContext: locationContext
      };
      
      console.log('🔄 ADAPTIVE_CHAT: Sending payload:', requestPayload);
      
      console.log('🔄 CHAT: Sending message:', message.message?.substring(0, 50));
      console.log('🔄 CHAT: Request payload:', { 
        hasMessage: !!message.message, 
        messageLength: message.message?.length,
        hasPrompt: !!requestPayload.prompt,
        adaptiveFeatures: requestPayload.adaptiveFeatures 
      });
      
      xhr.send(JSON.stringify(requestPayload));
    });
  }


  static async generateWeeklyDigest(): Promise<ApiResponse<any>> {
    return this.apiRequest('/analytics/llm/weekly-digest', {
      method: 'POST',
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.7
      }),
    });
  }

  static async generateRecommendations(): Promise<ApiResponse<any>> {
    return this.apiRequest('/analytics/llm/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        maxTokens: 1500,
        temperature: 0.8,
        personalized: true
      }),
    });
  }

  static async getPatternAnalysis(): Promise<ApiResponse<any>> {
    return this.apiRequest('/analytics/llm/patterns', {
      method: 'POST',
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        maxTokens: 1500,
        temperature: 0.6,
        depth: 'detailed'
      }),
    });
  }

  // Cloud Events & Social Matching
  static async getCloudEvents(options: {
    filter?: string;
    userEmotionalState?: any;
    includeMatching?: boolean;
  } = {}): Promise<ApiResponse<CloudEvent[]>> {
    try {
      const params = new URLSearchParams();
      if (options.filter) params.append('filter', options.filter);
      if (options.includeMatching) params.append('includeMatching', 'true');
      
      // Use different endpoints based on whether AI matching is requested
      const endpoint = options.userEmotionalState ? '/cloud/events/match' : '/cloud/events';
      const method = options.userEmotionalState ? 'POST' : 'GET';
      
      const response = await this.apiRequest(
        options.userEmotionalState ? endpoint : `${endpoint}?${params.toString()}`,
        {
          method,
          ...(options.userEmotionalState && {
            body: JSON.stringify({
              emotionalState: options.userEmotionalState,
              filters: { filter: options.filter },
              model: 'openai/gpt-4o-mini',
              maxTokens: 2000,
              temperature: 0.6
            })
          })
        }
      );
      
      // If endpoint doesn't exist or returns empty data, return empty array instead of error
      if (!response.success && response.error?.includes('404')) {
        return {
          success: true,
          data: [] // Return empty array for missing endpoints
        };
      }
      
      return response;
    } catch (error: any) {
      // Graceful fallback for missing endpoints
      if (error.message?.includes('404') || error.message?.includes('Cannot GET')) {
        return {
          success: true,
          data: []
        };
      }
      throw error;
    }
  }

  static async analyzeEventCompatibility(eventId: string, userEmotionalState: any): Promise<ApiResponse<{
    aiMatchScore: number;
    emotionalCompatibility: 'high' | 'medium' | 'low';
    personalizedReason: string;
    moodBoostPotential: number;
    suggestedConnections: string[];
    communityVibe: string;
    aiInsights: string;
    growthOpportunity: string;
  }>> {
    return this.apiRequest(`/cloud/events/${eventId}/compatibility`, {
      method: 'POST',
      body: JSON.stringify({
        emotionalState: userEmotionalState,
        model: 'openai/gpt-4o-mini',
        maxTokens: 1500,
        temperature: 0.5
      }),
    });
  }

  static async findCompatibleUsers(options: {
    eventId?: string;
    emotionalState: any;
    interests: string[];
    maxResults?: number;
  }): Promise<ApiResponse<{
    users: Array<{
      id: string;
      name: string;
      compatibilityScore: number;
      sharedInterests: string[];
      emotionalCompatibility: string;
      connectionReason: string;
    }>;
  }>> {
    return this.apiRequest('/cloud/compatibility/users', {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        model: 'openai/gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.4
      }),
    });
  }

  static async createCloudEvent(eventData: {
    title: string;
    description: string;
    type: string;
    date: string;
    time: string;
    location?: string;
    maxParticipants: number;
    duration?: string;
  }): Promise<ApiResponse<CloudEvent>> {
    return this.apiRequest('/cloud/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  static async joinEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.apiRequest(`/cloud/events/${eventId}/join`, {
      method: 'POST',
    });
  }

  static async leaveEvent(eventId: string): Promise<ApiResponse<any>> {
    return this.apiRequest(`/cloud/events/${eventId}/leave`, {
      method: 'POST',
    });
  }

  // Real-time Insights & Pattern Analysis
  static async getPersonalizedInsights(options: {
    timeRange?: string;
    emotionalState?: any;
    includeCloudRecommendations?: boolean;
  } = {}): Promise<ApiResponse<{
    insights: any[];
    cloudRecommendations: CloudEvent[];
    personalityAdaptations: any[];
  }>> {
    return this.apiRequest('/ai/personalized-insights', {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        model: 'openai/gpt-4o-mini',
        maxTokens: 2500,
        temperature: 0.6
      }),
    });
  }

  static async updateUserEmotionalProfile(updates: {
    recentMoods: string[];
    interactionPreferences: any;
    personalityFeedback: any[];
  }): Promise<ApiResponse<any>> {
    return this.apiRequest('/user/emotional-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Network status check
  static async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Validate token on app startup
  static async validateToken(): Promise<ApiResponse<UserData>> {
    const token = CloudAuth.getInstance().getToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No token found',
      };
    }

    // Try to get user profile with current token
    return this.getUserProfile();
  }

  // NEW: Mobile-optimized batch processing
  static async batchRequest(requests: BatchRequest[]): Promise<ApiResponse<BatchResponse>> {
    return this.apiRequest('/mobile/batch', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  // NEW: Incremental sync for mobile
  static async getMobileSync(lastSync: string, dataTypes: string[] = ['profile', 'emotions', 'conversations', 'analytics']): Promise<ApiResponse<SyncData>> {
    const params = new URLSearchParams();
    params.append('lastSync', lastSync);
    params.append('dataTypes', dataTypes.join(','));
    
    return this.apiRequest(`/mobile/sync?${params.toString()}`);
  }

  // NEW: Process offline queue
  static async processOfflineQueue(items: OfflineQueueItem[]): Promise<ApiResponse<any>> {
    return this.apiRequest('/mobile/offline-queue', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // NEW: Get mobile app configuration
  static async getAppConfig(): Promise<ApiResponse<AppConfig>> {
    return this.apiRequest('/mobile/app-config');
  }

  // NEW: Register push notification token
  static async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<ApiResponse<any>> {
    return this.apiRequest('/mobile/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  // NEW: Get real-time connection status
  static async getRealtimeStatus(): Promise<ApiResponse<any>> {
    return this.apiRequest('/mobile/realtime-status');
  }

  // NEW: Process complete sync request
  static async processSync(syncData: any): Promise<ApiResponse<any>> {
    return this.apiRequest('/sync/process', {
      method: 'POST',
      body: JSON.stringify({ syncData }),
    });
  }

  // NEW: Get incremental sync data
  static async getIncrementalSync(lastSync: string, dataTypes: string[] = ['profile', 'emotions', 'conversations', 'settings']): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    params.append('lastSync', lastSync);
    params.append('dataTypes', dataTypes.join(','));
    
    return this.apiRequest(`/sync/incremental?${params.toString()}`);
  }

  // NEW: Get API documentation
  static async getApiDocs(): Promise<ApiResponse<any>> {
    return this.apiRequest('/api/docs');
  }

  // NEW: Get server statistics
  static async getServerStats(): Promise<ApiResponse<any>> {
    return this.apiRequest('/api/stats');
  }

  // NEW: Test API connectivity
  static async testAPI(): Promise<ApiResponse<any>> {
    return this.apiRequest('/api/test');
  }

  // ========== CASCADING RECOMMENDATIONS METHODS (DEPRECATED) ==========
  
  // Generate cascading recommendations with reasoning trees
  static async generateCascadingRecommendations(options: {
    depth?: number;
    focusArea?: string;
    includeReasoningTree?: boolean;
  } = {}): Promise<ApiResponse<any>> {
    return {
      success: true,
      data: {
        recommendations: [],
        reasoning: {},
        cascadeDepth: 0
      }
    };
  }

  // Generate cascading recommendations with streaming
  static async generateCascadingRecommendationsStreaming(
    options: {
      depth?: number;
      focusArea?: string;
      includeReasoningTree?: boolean;
    } = {},
    onChunk: (chunk: any) => void
  ): Promise<{ content: any; complete: boolean }> {
    // Return empty data silently
    onChunk({
      type: 'complete',
      data: {
        recommendations: [],
        reasoning: {},
        cascadeDepth: 0
      }
    });
    
    return {
      content: {
        recommendations: [],
        reasoning: {},
        cascadeDepth: 0
      },
      complete: true
    };
  }

  // Get user context for cascading recommendations
  static async getCascadingContext(): Promise<ApiResponse<any>> {
    return {
      success: true,
      data: {
        context: {},
        userProfile: {},
        behavioralData: {}
      }
    };
  }

  // ========== NUMINA PERSONALITY METHODS ==========
  
  // Get Numina's current emotional state
  static async getNuminaCurrentState(): Promise<ApiResponse<any>> {
    return this.apiRequest('/numina-personality/current-state');
  }

  // Start continuous Numina updates (8 second intervals)
  static async startNuminaUpdates(interval: number = 8000): Promise<ApiResponse<any>> {
    return this.apiRequest('/numina-personality/continuous-updates', {
      method: 'POST',
      body: JSON.stringify({ interval }),
    });
  }

  // Start rapid Numina updates (5 second intervals for active chat)
  static async startRapidNuminaUpdates(): Promise<ApiResponse<any>> {
    return this.apiRequest('/numina-personality/start-rapid-updates', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // React to user interaction
  static async numinaReactToInteraction(userMessage: string, userEmotion?: string, context?: string): Promise<ApiResponse<any>> {
    return this.apiRequest('/numina-personality/react-to-interaction', {
      method: 'POST',
      body: JSON.stringify({ userMessage, userEmotion, context }),
    });
  }

  // ========== WALLET & CREDIT POOL METHODS ==========

  // Execute tool with payment
  static async executeToolWithPayment(toolName: string, args: any = {}, userContext: any = {}): Promise<ApiResponse<any>> {
    try {
      return await this.apiRequest('/tools/execute', {
        method: 'POST',
        body: JSON.stringify({ 
          toolName, 
          arguments: args,
          userContext 
        }),
      });
    } catch (error: any) {
      // Graceful fallback for missing wallet endpoints
      if (error.message?.includes('404') || error.message?.includes('Network error')) {
        return {
          success: false,
          error: 'Wallet features are not available yet. Please try again later.',
        };
      }
      throw error;
    }
  }

  // Credit Management Methods
  static async checkBalance(): Promise<ApiResponse<{
    balance: number;
    currency: string;
    todaySpent: number;
    remainingDailyLimit: number;
    isActive: boolean;
    isVerified: boolean;
    autoRechargeEnabled: boolean;
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: { action: 'check_balance' }
      }),
    });
  }

  static async addFundsStripe(amount: number, paymentMethodId: string): Promise<ApiResponse<{
    success: boolean;
    newBalance: number;
    transactionId: string;
    message: string;
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: {
          action: 'add_funds_stripe',
          amount,
          paymentMethodId
        }
      }),
    });
  }

  static async setupStripeCustomer(): Promise<ApiResponse<{
    success: boolean;
    customerId: string;
    message: string;
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: { action: 'setup_stripe_customer' }
      }),
    });
  }

  static async createPaymentIntent(amount: number): Promise<ApiResponse<{
    success: boolean;
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: {
          action: 'create_payment_intent',
          amount
        }
      }),
    });
  }

  static async getTransactionHistory(): Promise<ApiResponse<{
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      description: string;
      status: string;
      timestamp: string;
      toolName?: string;
    }>;
    totalCount: number;
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: { action: 'get_transactions' }
      }),
    });
  }

  static async verifyAccount(): Promise<ApiResponse<{
    success: boolean;
    message: string;
    isVerified: boolean;
    isActive: boolean;
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: { action: 'verify_account' }
      }),
    });
  }

  static async setSpendingLimit(limit: number, limitType: 'daily' | 'weekly' | 'monthly' | 'perTransaction'): Promise<ApiResponse<{
    success: boolean;
    limitType: string;
    newLimit: number;
    message: string;
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: {
          action: 'set_limit',
          spendingLimit: limit,
          limitType
        }
      }),
    });
  }

  static async checkSpending(amount: number): Promise<ApiResponse<{
    success: boolean;
    canSpend: boolean;
    currentBalance: number;
    requestedAmount: number;
    remainingAfterSpend?: number;
    reasons?: string[];
  }>> {
    return this.apiRequest('/tools/execute', {
      method: 'POST',
      body: JSON.stringify({
        toolName: 'credit_management',
        arguments: {
          action: 'check_spending',
          amount
        }
      }),
    });
  }

  // Tool Management Methods
  static async getAvailableTools(): Promise<ApiResponse<{
    tools: Array<{
      name: string;
      description: string;
      category: string;
      costPerExecution: number;
      requiresPayment: boolean;
      enabled: boolean;
    }>;
  }>> {
    try {
      return await this.apiRequest('/tools/registry');
    } catch (error: any) {
      // Graceful fallback for missing wallet endpoints
      if (error.message?.includes('404') || error.message?.includes('Network error')) {
        return {
          success: true,
          data: { tools: [] }, // Return empty tools array
        };
      }
      throw error;
    }
  }

  static async getToolStats(): Promise<ApiResponse<{
    total: number;
    enabled: number;
    disabled: number;
    categories: Record<string, number>;
    totalExecutions: number;
    averageSuccessRate: number;
  }>> {
    return this.apiRequest('/tools/stats');
  }

  // ========== SUBSCRIPTION MANAGEMENT METHODS ==========

  // Get subscription status
  static async getSubscriptionStatus(): Promise<ApiResponse<{
    numinaTrace: {
      isActive: boolean;
      plan: string | null;
      startDate: string;
      endDate: string;
      autoRenew: boolean;
      nextBillingDate: string;
      hasActiveSubscription: boolean;
    };
  }>> {
    return this.apiRequest('/subscription/status');
  }

  // Get subscription pricing plans
  static async getSubscriptionPricing(): Promise<ApiResponse<{
    plans: Array<{
      name: string;
      displayName: string;
      price: number;
      currency: string;
      duration: string;
      savings?: string;
      features: string[];
    }>;
  }>> {
    return this.apiRequest('/subscription/pricing');
  }

  // Subscribe to Numina Trace
  static async subscribeToNuminaTrace(plan: string, paymentMethodId: string): Promise<ApiResponse<{
    message: string;
    subscription: any;
    creditPoolActivated: boolean;
  }>> {
    return this.apiRequest('/subscription/numina-trace/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan, paymentMethodId }),
    });
  }

  // Cancel Numina Trace subscription
  static async cancelSubscription(): Promise<ApiResponse<{
    message: string;
    activeUntil: string;
  }>> {
    return this.apiRequest('/subscription/numina-trace/cancel', {
      method: 'POST',
    });
  }

  // Check if user has active subscription (utility method)
  static async hasActiveSubscription(): Promise<boolean> {
    try {
      const response = await this.getSubscriptionStatus();
      return response.success && response.data?.numinaTrace?.hasActiveSubscription === true;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // ========== SPOTIFY INTEGRATION METHODS ==========

  // Connect Spotify account
  static async connectSpotifyAccount(spotifyData: {
    accessToken: string;
    refreshToken?: string;
    spotifyUserId: string;
    spotifyEmail: string;
    spotifyDisplayName: string;
    expiresIn: number;
  }): Promise<ApiResponse<{
    message: string;
    spotifyConnected: boolean;
    profileUpdated: boolean;
  }>> {
    return this.apiRequest('/auth/spotify/connect', {
      method: 'POST',
      body: JSON.stringify(spotifyData),
    });
  }

  // Disconnect Spotify account
  static async disconnectSpotifyAccount(): Promise<ApiResponse<{
    message: string;
    spotifyDisconnected: boolean;
  }>> {
    return this.apiRequest('/auth/spotify/disconnect', {
      method: 'POST',
    });
  }

  // Get Spotify connection status
  static async getSpotifyStatus(): Promise<ApiResponse<{
    isConnected: boolean;
    spotifyUserId?: string;
    spotifyDisplayName?: string;
    spotifyEmail?: string;
    connectedAt?: string;
  }>> {
    return this.apiRequest('/integration/spotify/status');
  }

  // Refresh Spotify tokens
  static async refreshSpotifyTokens(refreshToken: string): Promise<ApiResponse<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }>> {
    return this.apiRequest('/integration/spotify/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Convenience methods for common HTTP operations
  static async get(endpoint: string): Promise<ApiResponse<any>> {
    return this.apiRequest(endpoint, { method: 'GET' });
  }

  static async post(endpoint: string, data: any = {}): Promise<ApiResponse<any>> {
    return this.apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Pre-compiled regex patterns for performance
  private static toolPatterns = [
      // Music & Entertainment - Match server's exact patterns
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
      
      // Search Variants - Match server's exact output patterns
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
      
      // Quick Utilities - Match exact server patterns
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
      
      // Financial Tools - Match exact server patterns  
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
      
      // Creative & Professional - Match exact server patterns
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
      
      // Health & Wellness - Match exact server patterns
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
      
      // Lifestyle Tools - Match exact server patterns
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
      
      // Quick Generators - Match exact server patterns
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

  // Debounce tool detection to improve performance during heavy streaming
  private static toolDetectionLastRun = 0;
  private static toolDetectionDebounceMs = 100; // Run at most every 100ms

  // Detect tool execution patterns from server streaming responses (optimized)
  private static detectAndTriggerToolExecution(content: string): void {
    if (!content) return;
    
    // Performance optimization: Early return if no emoji patterns found
    if (!content.match(/[🔍🎵📰🌐🎧🐦🎓🔢🌡️💰💱📧🏃‍♂️🖼️📍🎼🏨📊📈⏰🌍🔒]/)) {
      return;
    }
    
    // Debounce tool detection for performance
    const now = Date.now();
    if (now - this.toolDetectionLastRun < this.toolDetectionDebounceMs) {
      return;
    }
    this.toolDetectionLastRun = now;
    
    // Debug log (only when relevant patterns found)
    if (content.includes('🔍') || content.includes('🎵') || content.includes('📰') || content.includes('🌐')) {
      log.debug('Checking content for tool patterns', { preview: content.substring(0, 200) }, 'ApiService');
    }

    const toolExecutionService = ToolExecutionService.getInstance();

    for (const pattern of this.toolPatterns) {
      if (pattern.regex.test(content)) {
        log.info('Detected tool execution from server response', { tool: pattern.tool, preview: content.substring(0, 100) }, 'ApiService');
        
        // Check for existing active execution for this tool
        const activeExecutions = toolExecutionService.getCurrentExecutions();
        const existingExecution = activeExecutions.find(exec => 
          exec.toolName === pattern.tool && exec.status !== 'completed' && exec.status !== 'error'
        );
        
        // Handle completion patterns differently
        if ((pattern as any).isCompletion && existingExecution) {
          log.info('Completing tool execution', { tool: pattern.tool, executionId: existingExecution.id }, 'ApiService');
          toolExecutionService.completeExecution(existingExecution.id, { 
            success: true,
            serverResponse: content.trim()
          });
        } else if (!existingExecution && !(pattern as any).isCompletion) {
          // Start new tool execution tracking
          const executionId = toolExecutionService.startExecution(pattern.tool, { 
            detectedFromServer: true,
            serverMessage: content.trim()
          });
          log.info('Started tracking tool execution', { tool: pattern.tool, executionId }, 'ApiService');
          
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
          }, 1500);  // Reduced from 3 seconds to 1.5 seconds
          
        } else {
          // Update existing execution
          console.log(`🔧 API: Updating existing ${pattern.tool} execution`);
          toolExecutionService.updateProgress(existingExecution.id, 75, { 
            serverUpdate: content.trim()
          });
        }
        
        // Only trigger for the first match to avoid duplicates
        break;
      }
    }
  }

  // Secure Cloud Upload API (NEW - uses server-side AWS proxy)
  static async uploadSecureImage(
    file: FormData, 
    imageType: 'profile' | 'banner' | 'general' = 'general'
  ): Promise<ApiResponse<{ url: string; key: string; size: number; originalSize: number }>> {
    try {
      // Add image type to form data
      file.append('imageType', imageType);
      
      const response = await this.apiRequest('/api/cloud/upload-image', {
        method: 'POST',
        body: file,
        // Don't set Content-Type for FormData - let the browser handle it
      });

      if (response.success && response.data) {
        console.log('✅ Secure image upload successful:', response.data);
        return response;
      } else {
        console.error('❌ Secure image upload failed:', response.error);
        return {
          success: false,
          error: response.error || 'Secure image upload failed'
        };
      }
    } catch (error) {
      this.logError('uploadSecureImage', error, '/api/cloud/upload-image');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Secure image upload failed'
      };
    }
  }

  // Secure Profile Image Upload (with multiple sizes)
  static async uploadProfileImage(file: FormData): Promise<ApiResponse<{ 
    images: Array<{ size: string; url: string; key: string }>; 
    userId: string; 
  }>> {
    try {
      const response = await this.apiRequest('/api/cloud/upload-profile-image', {
        method: 'POST',
        body: file,
      });

      if (response.success && response.data) {
        console.log('✅ Secure profile image upload successful:', response.data);
        return response;
      } else {
        console.error('❌ Secure profile image upload failed:', response.error);
        return {
          success: false,
          error: response.error || 'Profile image upload failed'
        };
      }
    } catch (error) {
      this.logError('uploadProfileImage', error, '/api/cloud/upload-profile-image');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile image upload failed'
      };
    }
  }

  // Delete Secure Image
  static async deleteSecureImage(key: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.apiRequest('/api/cloud/delete-image', {
        method: 'DELETE',
        body: JSON.stringify({ key }),
      });

      if (response.success) {
        console.log('✅ Secure image deletion successful');
        return response;
      } else {
        console.error('❌ Secure image deletion failed:', response.error);
        return {
          success: false,
          error: response.error || 'Image deletion failed'
        };
      }
    } catch (error) {
      this.logError('deleteSecureImage', error, '/api/cloud/delete-image');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image deletion failed'
      };
    }
  }

  // Get Secure Image URL (with optional optimization params)
  static async getSecureImageUrl(
    key: string, 
    options?: { width?: number; height?: number; quality?: number; format?: string }
  ): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
    try {
      const params = new URLSearchParams({ key });
      if (options?.width) params.append('width', options.width.toString());
      if (options?.height) params.append('height', options.height.toString());
      if (options?.quality) params.append('quality', options.quality.toString());
      if (options?.format) params.append('format', options.format);

      const response = await this.apiRequest(`/api/cloud/signed-url?${params.toString()}`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        console.log('✅ Secure image URL generated');
        return response;
      } else {
        console.error('❌ Secure image URL generation failed:', response.error);
        return {
          success: false,
          error: response.error || 'Failed to generate image URL'
        };
      }
    } catch (error) {
      this.logError('getSecureImageUrl', error, '/api/cloud/signed-url');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image URL'
      };
    }
  }

  // Legacy File Upload API (for backward compatibility)
  static async uploadFile(file: FormData): Promise<ApiResponse<{ url: string; extractedText?: string }>> {
    try {
      // Get token from AuthManager
      const token = CloudAuth.getInstance().getToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Authentication required for file upload'
        };
      }

      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData, let the browser set it with boundary
        },
        body: file,
      });

      if (!response.ok) {
        const errorData = await this.parseJsonSafely(response).catch(() => ({ message: 'Upload failed' }));
        return {
          success: false,
          error: errorData.message || `Upload failed with status ${response.status}`
        };
      }

      const data = await this.parseJsonSafely(response);
      return {
        success: true,
        data: {
          url: data.url,
          extractedText: data.extractedText
        }
      };
    } catch (error) {
      this.logError('uploadFile', error, '/upload');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

      // Chat message with file support
  static async sendChatMessageWithFiles(
    message: ChatMessage & { files?: FileAttachment[] },
    onChunk?: (chunk: string) => void
  ): Promise<void> {
    try {
      const token = CloudAuth.getInstance().getToken();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Build the request body with file context
      const requestBody = {
        ...message,
        prompt: this.buildPromptWithFileContext(message.prompt, message.files),
        stream: true,
      };

      // Remove files from request body as they're now embedded in prompt
      delete requestBody.files;

      const response = await fetch(CHAT_API_CONFIG.PRODUCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...SECURITY_HEADERS,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`);
      }

      // Handle streaming response
      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  onChunk?.(parsed.choices[0].delta.content);
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      }
    } catch (error) {
      this.logError('sendChatMessageWithFiles', error, '/completion');
      throw error;
    }
  }

  // Build prompt with file context
  private static buildPromptWithFileContext(prompt: string, files?: FileAttachment[]): string {
    if (!files || files.length === 0) {
      return prompt;
    }

    let contextualPrompt = prompt;
    
    // Add file context at the beginning
    const fileContext = files.map(file => {
      let context = `[File: ${file.name} (${file.type}, ${this.formatFileSize(file.size)})]`;
      
      if (file.extractedText) {
        context += `\nContent: ${file.extractedText.slice(0, 2000)}${file.extractedText.length > 2000 ? '...' : ''}`;
      }
      
      return context;
    }).join('\n\n');

    contextualPrompt = `${fileContext}\n\nUser Query: ${prompt}`;
    
    return contextualPrompt;
  }

  // Helper to format file size
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ========== UBPM & EMOTIONAL ANALYTICS ENDPOINTS ==========
  
  // Get UBPM context data
  static async getUBPMContext(): Promise<ApiResponse<any>> {
    return await this.apiRequest('/test-ubpm/context');
  }

  // Get current emotional session analytics
  static async getCurrentSessionAnalytics(): Promise<ApiResponse<any>> {
    return await this.apiRequest('/emotional-analytics/current-session');
  }

  // Trigger UBPM analysis (for real-time behavioral updates)
  static async triggerUBPMAnalysis(): Promise<ApiResponse<any>> {
    return await this.apiRequest('/test-ubpm/trigger-analysis', {
      method: 'POST',
      body: JSON.stringify({
        analysisType: 'comprehensive',
        includePersonality: true,
        includeBehavioral: true
      }),
    });
  }

  // ========== TIER SYSTEM ENDPOINTS ==========
  
  // Get user tier information
  static async getUserTierInfo(): Promise<ApiResponse<any>> {
    return await this.apiRequest('/tier-test/info');
  }

  // Get upgrade message
  static async getUpgradeMessage(): Promise<ApiResponse<any>> {
    return await this.apiRequest('/ai/upgrade-message', {
      method: 'POST',
    });
  }
}

// Export API service and types
export default ApiService;
export type { 
  ApiResponse, 
  LoginCredentials, 
  SignUpCredentials, 
  UserData,
  BatchRequest,
  BatchResponse,
  SyncData,
  OfflineQueueItem,
  AppConfig,
  CloudEvent,
  CompatibilityAnalysis
};