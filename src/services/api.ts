import NetInfo from '@react-native-community/netinfo';
import AuthManager from './authManager';

/**
 * API Service for React Native
 * Matches web app API implementation exactly
 * Handles authentication, token management, chat completion, and data sync
 */

import ENV, { SECURITY_HEADERS, validateEnvironment } from '../config/environment';

// Validate environment on import
if (!validateEnvironment()) {
  throw new Error('Invalid environment configuration');
}

// API Configuration
export const API_BASE_URL = ENV.API_BASE_URL;

// Chat API configuration
export const CHAT_API_CONFIG = {
  PRODUCTION_URL: `${ENV.API_BASE_URL}/completion`,
  REQUEST_DEFAULTS: {
    stream: true,
    temperature: 0.8,
    n_predict: 1024,
    stop: ['<|im_end|>', '\n<|im_start|>']
  }
};

// Request timeout configuration
const REQUEST_TIMEOUT = 10000; // 10 seconds

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
}

interface EmotionData {
  emotion: string;
  intensity: number;
  description?: string;
  timestamp: string;
  userId: string;
}

// AI Personality and Cloud Matching Interfaces
interface PersonalityContext {
  communicationStyle: 'supportive' | 'direct' | 'collaborative' | 'encouraging';
  emotionalTone: 'supportive' | 'celebratory' | 'analytical' | 'calming';
  adaptedResponse: boolean;
  userMoodDetected?: string;
  responsePersonalization?: string;
}

interface UserEmotionalState {
  mood: string;
  intensity: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentInteractions: string[];
  patterns: string[];
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

// NEW: Mobile-optimized interfaces
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

  // CRITICAL FIX: Add network state validation
  private static async validateNetworkState(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.warn('🌐 API: No network connection available');
        return false;
      }
      return true;
    } catch (error) {
      console.error('🌐 API: Failed to check network state:', error);
      return false;
    }
  }

  // CRITICAL FIX: Enhanced error logging
  private static logError(context: string, error: any, endpoint?: string): void {
    const errorInfo = {
      context,
      endpoint,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    
    console.error('❌ API Error:', errorInfo);
    
    // In production, you might want to send this to a logging service
    if (__DEV__) {
      console.group('🔍 Detailed Error Info');
      console.log('Context:', context);
      console.log('Endpoint:', endpoint);
      console.log('Error:', error);
      console.groupEnd();
    }
  }

  // Generic API request method with retry logic and exponential backoff
  static async apiRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    retryAttempts: number = 3
  ): Promise<ApiResponse<T>> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // CRITICAL FIX: Validate network state before attempting request
    const isNetworkAvailable = await this.validateNetworkState();
    if (!isNetworkAvailable) {
      return {
        success: false,
        error: 'No network connection available. Please check your internet connection and try again.',
      };
    }
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Get token from AuthManager (single source of truth)
        const token = await AuthManager.getInstance().getCurrentToken();
        
        // Default headers with security headers
        const defaultHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...SECURITY_HEADERS,
        };

        // Add authorization header if token exists
        if (token) {
          defaultHeaders.Authorization = `Bearer ${token}`;
        }

        // Merge headers
        const headers = {
          ...defaultHeaders,
          ...(options.headers as Record<string, string>),
        };

        // Create request configuration with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const config: RequestInit = {
          ...options,
          headers,
          signal: controller.signal,
        };

        const url = `${this.baseURL}${endpoint}`;
        // API request to server
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        // API response received
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Network error' }));
          
          // Handle authentication errors - but don't clear auth on these endpoints
          if (response.status === 401 && 
              !endpoint.includes('/login') && 
              !endpoint.includes('/signup') &&
              !endpoint.includes('/sentiment-data') &&  // Don't logout on sentiment data errors
              !endpoint.includes('/analytics/llm')) {    // Don't logout on LLM errors
            // Use AuthManager for consistent auth clearing
            await AuthManager.getInstance().logout();
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

        const data = await response.json();
        
        return {
          success: true,
          data,
        };
      } catch (error: any) {
        // CRITICAL FIX: Enhanced error logging
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
                // CRITICAL FIX: Proper error handling instead of silent failure
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
              // CRITICAL FIX: Proper error handling instead of silent failure
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

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: 'Max retry attempts exceeded',
    };
  }

  // Authentication endpoints - exactly matching web app
  static async login(credentials: LoginCredentials): Promise<ApiResponse<{
    token: string;
    data: { user: UserData };
  }>> {
    return this.apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async signUp(credentials: SignUpCredentials): Promise<ApiResponse<{
    token: string;
    data: { user: UserData };
  }>> {
    return this.apiRequest('/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // User profile endpoint
  static async getUserProfile(): Promise<ApiResponse<UserData>> {
    return this.apiRequest('/profile');
  }

  // Chat completion endpoint - with proper XMLHttpRequest streaming
  static async sendChatMessageStreaming(
    message: ChatMessage, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const token = await AuthManager.getInstance().getCurrentToken();
    
    // Always use production URL
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
      
      // Real-time streaming using onreadystatechange
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const currentLength = xhr.responseText.length;
          const newText = xhr.responseText.slice(lastProcessedIndex);
          
          
          if (newText) {
            lastProcessedIndex = currentLength;
            
            // Process new chunks in real-time
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
                    // Handle non-JSON content
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

  // Fallback for compatibility - redirects to streaming method
  static async sendChatMessage(message: ChatMessage): Promise<Response> {
    // This method is kept for compatibility but won't be used for streaming
    const result = await this.sendChatMessageStreaming(message, () => {});
    return new Response(result, {
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
    });
  }

  // Emotion data endpoints - backend only has POST /emotions for submitting
  static async getEmotions(): Promise<ApiResponse<any[]>> {
    // Backend doesn't have GET /emotions endpoint, return empty array
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
    // Backend likely doesn't have emotion history endpoint, return empty array
    return {
      success: true,
      data: []
    };
  }

  // Analytics LLM service - matching web app backend proxy
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

  // Sentiment data endpoints
  static async getSentimentInsights(): Promise<ApiResponse<any>> {
    console.log('🔍 API: Checking sentiment insights endpoint...');
    try {
      const response = await this.apiRequest('/sentiment-data/insights');
      console.log('✅ API: Sentiment insights response:', response);
      return response;
    } catch (error: any) {
      console.log('❌ API: Sentiment insights error:', error);
      // If endpoint doesn't exist yet, return empty data instead of failing
      if (error.message?.includes('404') || error.message?.includes('Cannot GET')) {
        return {
          success: false,
          error: 'No data available yet'
        };
      }
      throw error;
    }
  }

  static async getAggregatedEmotionalData(options?: {
    timeRange?: string;
    groupBy?: string;
    includeIntensity?: boolean;
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (options?.timeRange) params.append('timeRange', options.timeRange);
    if (options?.groupBy) params.append('groupBy', options.groupBy);
    if (options?.includeIntensity !== undefined) params.append('includeIntensity', String(options.includeIntensity));
    
    return this.apiRequest(`/sentiment-data/aggregated?${params.toString()}`);
  }

  static async getDemographicPatterns(): Promise<ApiResponse<any>> {
    return this.apiRequest('/sentiment-data/demographics');
  }

  static async getRealTimeInsights(): Promise<ApiResponse<any>> {
    return this.apiRequest('/sentiment-data/realtime');
  }

  // Sentiment snapshots - matching web app
  static async getSentimentSnapshots(timeRange: string = '10m'): Promise<ApiResponse<any>> {
    return this.apiRequest(`/sentiment-snapshots?timeRange=${timeRange}`);
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
    const token = await AuthManager.getInstance().getCurrentToken();
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

  // AI Personality & Adaptive Chat Features
  static async analyzeUserEmotionalState(options: {
    recentEmotions?: any[];
    conversationHistory?: any[];
    timeContext?: string;
  } = {}): Promise<ApiResponse<UserEmotionalState>> {
    return this.apiRequest('/ai/emotional-state', {
      method: 'POST',
      body: JSON.stringify({
        recentEmotions: options.recentEmotions || [],
        conversationHistory: options.conversationHistory || [],
        timeContext: options.timeContext || new Date().toISOString(),
        model: 'openai/gpt-4o-mini',
        maxTokens: 800,
        temperature: 0.3
      }),
    });
  }

  static async getPersonalityRecommendations(emotionalState: UserEmotionalState): Promise<ApiResponse<{
    communicationStyle: string;
    suggestedPrompts: string[];
    contextualHints: string[];
  }>> {
    return this.apiRequest('/ai/personality-recommendations', {
      method: 'POST',
      body: JSON.stringify({
        emotionalState,
        model: 'openai/gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.4
      }),
    });
  }

  static async sendAdaptiveChatMessage(
    message: ChatMessage & {
      emotionalContext?: UserEmotionalState;
      personalityStyle?: string;
    },
    onChunk: (chunk: string, context?: PersonalityContext) => void
  ): Promise<{ content: string; personalityContext: PersonalityContext }> {
    const token = await AuthManager.getInstance().getCurrentToken();
    const chatUrl = `${this.baseURL}/ai/adaptive-chat`;

    console.log('🔄 ADAPTIVE_CHAT: Starting request to:', chatUrl);
    console.log('🔄 ADAPTIVE_CHAT: Message payload:', {
      message: message.message || message.prompt,
      hasEmotionalContext: !!message.emotionalContext,
      personalityStyle: message.personalityStyle,
      stream: message.stream
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProcessedIndex = 0;
      let fullContent = '';
      let personalityContext: PersonalityContext | null = null;
      
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
              // Response chunk received
              
              lastProcessedIndex = currentLength;
              const lines = newText.split('\n');
              
              for (const line of lines) {
                if (line && line.trim() && line.startsWith('data: ')) {
                  const content = line.substring(6).trim();
                  // Processing SSE line
                  
                  if (content && content !== '[DONE]') {
                    try {
                      const parsed = JSON.parse(content);
                      // JSON parsed successfully
                      
                      if (parsed && parsed.content) {
                        fullContent += parsed.content;
                        onChunk(fullContent, personalityContext || undefined);
                      }
                      if (parsed && parsed.personalityContext) {
                        personalityContext = parsed.personalityContext;
                      }
                    } catch (parseError) {
                      console.error('🔄 ADAPTIVE_CHAT_DEBUG: JSON parse failed', { 
                        error: parseError.message, 
                        content: content.substring(0, 200) 
                      });
                      if (content) {
                        fullContent += content;
                        onChunk(fullContent, personalityContext || undefined);
                      }
                    }
                  } else if (content === '[DONE]') {
                    console.log('🔄 CHAT: Stream completed, content length:', fullContent.length);
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
            // Check if we got streaming content first
            if (fullContent) {
              console.log('🔄 ADAPTIVE_CHAT: Success with content length:', fullContent.length);
              resolve({
                content: fullContent,
                personalityContext: personalityContext || {
                  communicationStyle: 'supportive',
                  emotionalTone: 'supportive',
                  adaptedResponse: false
                }
              });
            } else {
              console.log('🔄 ADAPTIVE_CHAT: No streaming content received');
              console.log('🔄 ADAPTIVE_CHAT: Raw response:', xhr.responseText.substring(0, 500));
              // Handle JSON response format
              try {
                const jsonResponse = JSON.parse(xhr.responseText);
                console.log('🔄 ADAPTIVE_CHAT: Parsed JSON response:', jsonResponse);
                
                if (jsonResponse.success && jsonResponse.data && jsonResponse.data.response) {
                  resolve({
                    content: jsonResponse.data.response,
                    personalityContext: {
                      communicationStyle: jsonResponse.data.tone || 'supportive',
                      emotionalTone: jsonResponse.data.tone || 'supportive',
                      adaptedResponse: true
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
          } else {
            console.error('🔄 CHAT: HTTP error', xhr.status);
            reject(new Error(`Adaptive chat request failed: ${xhr.status}`));
          }
        } catch (error) {
          console.error('🔄 CHAT: Unexpected error', error);
          reject(error);
        }
      };
      
      // Set timeout before sending
      xhr.timeout = 30000; // 30 seconds
      
      const requestPayload = {
        ...CHAT_API_CONFIG.REQUEST_DEFAULTS,
        ...message,
        adaptiveFeatures: true,
        stream: true
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

  static async submitPersonalityFeedback(feedback: {
    messageId: string;
    feedbackType: 'helpful' | 'not_helpful' | 'love_it';
    personalityStyle: string;
    userEmotionalState: UserEmotionalState;
  }): Promise<ApiResponse<any>> {
    return this.apiRequest('/ai/personality-feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
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
    userEmotionalState?: UserEmotionalState;
    includeMatching?: boolean;
  } = {}): Promise<ApiResponse<CloudEvent[]>> {
    try {
      const params = new URLSearchParams();
      if (options.filter) params.append('filter', options.filter);
      if (options.includeMatching) params.append('includeMatching', 'true');
      
      const response = await this.apiRequest(`/cloud/events?${params.toString()}`, {
        method: options.userEmotionalState ? 'POST' : 'GET',
        ...(options.userEmotionalState && {
          body: JSON.stringify({
            emotionalState: options.userEmotionalState,
            model: 'openai/gpt-4o-mini',
            maxTokens: 2000,
            temperature: 0.6
          })
        })
      });
      
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

  static async analyzeEventCompatibility(eventId: string, userEmotionalState: UserEmotionalState): Promise<ApiResponse<{
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
    emotionalState: UserEmotionalState;
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
    emotionalState?: UserEmotionalState;
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
    const token = await AuthManager.getInstance().getCurrentToken();
    
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

  // ========== CASCADING RECOMMENDATIONS METHODS ==========
  
  // Generate cascading recommendations with reasoning trees
  static async generateCascadingRecommendations(options: {
    depth?: number;
    focusArea?: string;
    includeReasoningTree?: boolean;
  } = {}): Promise<ApiResponse<any>> {
    return this.apiRequest('/cascading-recommendations/generate', {
      method: 'POST',
      body: JSON.stringify({
        depth: options.depth || 3,
        focusArea: options.focusArea || 'general',
        includeReasoningTree: options.includeReasoningTree !== false,
        stream: false, // Use static version by default
      }),
    });
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
    const token = await AuthManager.getInstance().getCurrentToken();
    const url = `${this.baseURL}/cascading-recommendations/generate`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let lastProcessedIndex = 0;
      let finalContent: any = null;
      
      xhr.open('POST', url, true);
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
            
            // Process new chunks in real-time
            const lines = newText.split('\n');
            
            for (const line of lines) {
              if (line.trim() && line.startsWith('data: ')) {
                const content = line.substring(6).trim();
                if (content !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(content);
                    onChunk(parsed);
                    
                    // Store final complete data
                    if (parsed.type === 'complete') {
                      finalContent = parsed.data;
                    }
                  } catch {
                    // Handle non-JSON content
                    if (content) {
                      onChunk({ type: 'text', content });
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
          resolve({ content: finalContent, complete: true });
        } else {
          reject(new Error(`Streaming request failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error'));
      };
      
      xhr.send(JSON.stringify({
        depth: options.depth || 3,
        focusArea: options.focusArea || 'general',
        includeReasoningTree: options.includeReasoningTree !== false,
        stream: true, // Enable streaming
      }));
    });
  }

  // Get user context for cascading recommendations
  static async getCascadingContext(): Promise<ApiResponse<any>> {
    return this.apiRequest('/cascading-recommendations/context');
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
  static async executeToolWithPayment(toolName: string, args: any = {}): Promise<ApiResponse<any>> {
    try {
      return await this.apiRequest('/tools/execute', {
        method: 'POST',
        body: JSON.stringify({ toolName, arguments: args }),
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
  PersonalityContext,
  UserEmotionalState,
  CloudEvent,
  CompatibilityAnalysis
};