import SecureStorageService from './secureStorage';

/**
 * API Service for React Native
 * Matches web app API implementation exactly
 * Handles authentication, token management, chat completion, and data sync
 */

// API Configuration - always use production server
const getApiBaseUrl = () => {
  // Always use production server for simplicity
  return 'https://server-a7od.onrender.com';
};

// Chat API configuration
export const CHAT_API_CONFIG = {
  PRODUCTION_URL: 'https://server-a7od.onrender.com/completion',
  REQUEST_DEFAULTS: {
    stream: true,
    temperature: 0.8,
    n_predict: 1024,
    stop: ['<|im_end|>', '\n<|im_start|>']
  }
};

const API_BASE_URL = getApiBaseUrl();

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
  communicationStyle: 'empathetic' | 'direct' | 'collaborative' | 'encouraging';
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


class ApiService {
  private static baseURL = API_BASE_URL;

  // Generic API request method with retry logic and exponential backoff
  static async apiRequest<T = any>(
    endpoint: string, 
    options: RequestInit = {},
    retryAttempts: number = 3
  ): Promise<ApiResponse<T>> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        // Get token from secure storage
        const token = await SecureStorageService.getToken();
        
        // Default headers - exactly matching web app
        const defaultHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add authorization header if token exists - exactly like web app
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
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Network error' }));
          
          // Handle authentication errors - but don't clear auth on these endpoints
          if (response.status === 401 && 
              !endpoint.includes('/login') && 
              !endpoint.includes('/signup') &&
              !endpoint.includes('/collective-data') &&  // Don't logout on collective data errors
              !endpoint.includes('/analytics/llm')) {    // Don't logout on LLM errors
            // Import dynamically to avoid circular dependency
            const { default: SecureStorageService } = await import('./secureStorage');
            await SecureStorageService.clearUserData();
            // The auth context will handle the state change
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
                // Queue error handling
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
              // Queue error handling
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
    return this.apiRequest('/user/profile');
  }

  // Chat completion endpoint - with proper XMLHttpRequest streaming
  static async sendChatMessageStreaming(
    message: ChatMessage, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const token = await SecureStorageService.getToken();
    
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

  // Emotion data endpoints - matching web app patterns
  static async getEmotions(): Promise<ApiResponse<any[]>> {
    return this.apiRequest('/emotions');
  }

  static async saveEmotion(emotion: EmotionData): Promise<ApiResponse<any>> {
    return this.apiRequest('/emotions', {
      method: 'POST',
      body: JSON.stringify(emotion),
    });
  }

  static async getEmotionHistory(timeRange?: string): Promise<ApiResponse<any[]>> {
    const endpoint = timeRange 
      ? `/emotion-history?timeRange=${timeRange}` 
      : '/emotion-history';
    return this.apiRequest(endpoint);
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

  // Collective data endpoints
  static async getCollectiveInsights(): Promise<ApiResponse<any>> {
    try {
      return await this.apiRequest('/collective-data/insights');
    } catch (error: any) {
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
    
    return this.apiRequest(`/collective-data/aggregated?${params.toString()}`);
  }

  static async getDemographicPatterns(): Promise<ApiResponse<any>> {
    return this.apiRequest('/collective-data/demographics');
  }

  static async getRealTimeInsights(): Promise<ApiResponse<any>> {
    return this.apiRequest('/collective-data/realtime');
  }

  // Collective snapshots - matching web app
  static async getCollectiveSnapshots(timeRange: string = '10m'): Promise<ApiResponse<any>> {
    return this.apiRequest(`/collective-snapshots?timeRange=${timeRange}`);
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
    const token = await SecureStorageService.getToken();
    const chatUrl = `${this.baseURL}/ai/adaptive-chat`;

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
                      onChunk(fullContent, personalityContext || undefined);
                    }
                    if (parsed.personalityContext) {
                      personalityContext = parsed.personalityContext;
                    }
                  } catch {
                    if (content) {
                      fullContent += content;
                      onChunk(fullContent, personalityContext || undefined);
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
          resolve({
            content: fullContent,
            personalityContext: personalityContext || {
              communicationStyle: 'empathetic',
              emotionalTone: 'supportive',
              adaptedResponse: false
            }
          });
        } else {
          reject(new Error(`Adaptive chat request failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      
      xhr.send(JSON.stringify({
        ...CHAT_API_CONFIG.REQUEST_DEFAULTS,
        ...message,
        adaptiveFeatures: true
      }));
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
    const params = new URLSearchParams();
    if (options.filter) params.append('filter', options.filter);
    if (options.includeMatching) params.append('includeMatching', 'true');
    
    return this.apiRequest(`/cloud/events?${params.toString()}`, {
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
    const token = await SecureStorageService.getToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No token found',
      };
    }

    // Try to get user profile with current token
    return this.getUserProfile();
  }
}

// Export API service and types
export default ApiService;
export type { 
  ApiResponse, 
  LoginCredentials, 
  SignUpCredentials, 
  UserData 
};