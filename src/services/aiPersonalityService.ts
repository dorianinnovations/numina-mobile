import ApiService from './api';
import { emotionalAnalyticsAPI } from './emotionalAnalyticsAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CloudAuth from './cloudAuth';

interface UserEmotionalState {
  mood: string;
  intensity: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentInteractions: string[];
  patterns: string[];
}

interface AIPersonality {
  communicationStyle: 'supportive' | 'direct' | 'collaborative' | 'encouraging';
  adaptivePrompts: string[];
  contextualHints: string[];
}

interface PersonalityContext {
  communicationStyle: 'supportive' | 'direct' | 'collaborative' | 'encouraging';
  emotionalTone: 'supportive' | 'celebratory' | 'analytical' | 'calming';
  adaptedResponse: boolean;
  userMoodDetected?: string;
  responsePersonalization?: string;
}

const getCacheKeys = (userId: string) => ({
  emotionalState: `@ai_emotional_state_${userId}`,
  personalityPreferences: `@ai_personality_preferences_${userId}`,
  adaptationHistory: `@ai_adaptation_history_${userId}`,
});

const CACHE_DURATION = 15 * 60 * 1000;
const DEBOUNCE_DELAY = 2000;

class AIPersonalityService {
  private static instance: AIPersonalityService;
  private currentEmotionalState: UserEmotionalState | null = null;
  private personalityPreferences: any = {};
  private lastAnalysisTime: number = 0;
  private pendingAnalysis: Promise<UserEmotionalState> | null = null;

  static getInstance(): AIPersonalityService {
    if (!this.instance) {
      this.instance = new AIPersonalityService();
    }
    return this.instance;
  }

  async analyzeCurrentEmotionalState(): Promise<UserEmotionalState> {
    if (!CloudAuth.getInstance().isAuthenticated()) {
      // console.log('⚡ Using fast local analysis - not authenticated');
      return this.getDefaultEmotionalState();
    }

    const now = Date.now();
    
    // Check cache first - extended cache duration for performance
    const cached = await this.getCachedEmotionalState();
    if (cached && (now - this.lastAnalysisTime) < CACHE_DURATION) {
      // console.log('🚀 Using cached emotional state (age:', Math.round((now - this.lastAnalysisTime) / 1000), 's)');
      return cached;
    }

    // Return pending analysis to prevent duplicate expensive calls
    if (this.pendingAnalysis && (now - this.lastAnalysisTime) < DEBOUNCE_DELAY) {
      // console.log('⏳ Returning pending analysis to avoid duplicate requests');
      return this.pendingAnalysis;
    }

    // Fast local analysis first, then background AI update
    const localState = await this.getLocalEmotionalStateFirst();
    // console.log('⚡ Returning fast local state, scheduling background AI analysis');
    this.scheduleBackgroundAnalysis();
    return localState;
  }

  private async getLocalEmotionalStateFirst(): Promise<UserEmotionalState> {
    try {
      // console.log('🔍 Attempting fast local emotional state analysis...');
      
      // First check recent emotions from analytics (with timeout protection)
      try {
        const recentSession = await Promise.race([
          emotionalAnalyticsAPI.getCurrentSession(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Analytics timeout')), 2000)
          )
        ]) as any;
        
        const recentEmotions = recentSession?.recentEmotions || [];
        
        if (recentEmotions.length > 0) {
          // console.log('✅ Found recent emotions:', recentEmotions.length);
          const localState = this.generateLocalEmotionalState(recentEmotions);
          await this.cacheEmotionalState(localState);
          return localState;
        }
      } catch (analyticsError) {
        // console.log('⚠️ Analytics API unavailable, trying conversation data...');
      }

      // Then check if we have any conversation data (with timeout protection)
      try {
        const conversations = await Promise.race([
          this.getRecentConversations(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Conversation timeout')), 1000)
          )
        ]) as any;
        
        if (conversations.length > 0) {
          // console.log('✅ Found conversations:', conversations.length);
          // Generate basic state from conversation metadata
          const defaultState = this.generateDefaultEmotionalState();
          await this.cacheEmotionalState(defaultState);
          return defaultState;
        }
      } catch (conversationError) {
        // console.log('⚠️ Conversation data unavailable');
      }

      // Always return a default state rather than null to avoid AI analysis
      // console.log('🔄 No data found, returning default emotional state to avoid AI timeout');
      const defaultState = this.generateDefaultEmotionalState();
      await this.cacheEmotionalState(defaultState);
      return defaultState;
      
    } catch (error) {
      // console.warn('Local emotional state analysis failed, returning default:', error);
      // Always return default state to prevent AI analysis timeout
      const defaultState = this.generateDefaultEmotionalState();
      try {
        await this.cacheEmotionalState(defaultState);
      } catch (cacheError) {
        // console.warn('Failed to cache default state:', cacheError);
      }
      return defaultState;
    }
  }

  private scheduleBackgroundAnalysis(): void {
    // Schedule background AI analysis without blocking UI
    setTimeout(async () => {
      try {
        // console.log('🔄 Running background AI emotional analysis');
        
        // Background analysis now has built-in 8s timeout from API service
        const result = await this.performEmotionalAnalysis();
        
        // console.log('✅ Background AI analysis completed successfully');
        // Update cache with fresh AI analysis
        await this.cacheEmotionalState(result);
        this.currentEmotionalState = result;
        
      } catch (error) {
        // console.warn('🔄 Background AI analysis failed (this is non-critical):', error);
        // Background failure is acceptable - user already has local state
      }
    }, 3000); // 3 second delay to not interfere with user interaction
  }

  private async performEmotionalAnalysis(): Promise<UserEmotionalState> {
    try {
      const recentSession = await emotionalAnalyticsAPI.getCurrentSession();
      const recentEmotions = recentSession.recentEmotions || [];
      
      const localState = this.generateLocalEmotionalState(recentEmotions);
      
      if (recentEmotions.length > 0) {
        // console.log('⚡ Using fast local analysis based on', recentEmotions.length, 'recent emotions');
        this.currentEmotionalState = localState;
        await this.cacheEmotionalState(localState);
        
        this.performBackgroundAIAnalysis(recentEmotions);
        
        return localState;
      }

      const conversationHistory = await this.getRecentConversations();
      
      if (conversationHistory.length > 0) {
        // console.log('🧠 Performing AI analysis with', conversationHistory.length, 'conversations');
        
        // API service now has built-in 8s timeout and request deduplication
        const response = await ApiService.analyzeUserEmotionalState({
          recentEmotions,
          conversationHistory,
          timeContext: new Date().toISOString(),
        }) as any;

        if (response && response.success && response.data) {
          this.currentEmotionalState = response.data;
          await this.cacheEmotionalState(response.data);
          return response.data;
        }
      }
      
      // console.log('🔄 Falling back to local analysis');
      return localState;
    } catch (error) {
      console.error('Error analyzing emotional state:', error);
      const cached = await this.getCachedEmotionalState();
      return cached || this.generateDefaultEmotionalState();
    }
  }

  private async performBackgroundAIAnalysis(recentEmotions: any[]): Promise<void> {
    try {
      const conversationHistory = await this.getRecentConversations();
      
      const response = await ApiService.analyzeUserEmotionalState({
        recentEmotions,
        conversationHistory,
        timeContext: new Date().toISOString(),
      });

      if (response.success && response.data) {
        // console.log('🎯 Background AI analysis completed, updating cache');
        this.currentEmotionalState = response.data;
        await this.cacheEmotionalState(response.data);
      }
    } catch (error) {
      // console.warn('Background AI analysis failed:', error);
    }
  }

  async getPersonalityRecommendations(emotionalState?: UserEmotionalState): Promise<AIPersonality> {
    const state = emotionalState || this.currentEmotionalState || await this.analyzeCurrentEmotionalState();
    
    const cached = await this.getCachedPersonalityRecommendations(state.mood);
    if (cached) {
      // console.log('🚀 Using cached personality recommendations for mood:', state.mood);
      return cached;
    }
    
    if (!CloudAuth.getInstance().isAuthenticated()) {
      // console.log('🔄 Using local personality recommendations');
      return this.getDefaultPersonality();
    }
    
    try {
      // console.log('🧠 Fetching personality recommendations for mood:', state.mood);
      const response = await ApiService.getPersonalityRecommendations(state);
      
      if (response.success && response.data) {
        const personality = {
          communicationStyle: (response.data.communicationStyle as 'supportive' | 'direct' | 'collaborative' | 'encouraging') || 'supportive',
          adaptivePrompts: response.data.suggestedPrompts || [],
          contextualHints: response.data.contextualHints || [],
        };
        
        await this.cachePersonalityRecommendations(state.mood, personality);
        return personality;
      }
    } catch (error) {
      console.error('Error getting personality recommendations:', error);
    }
    
    // console.log('🔄 Using local personality recommendations');
    return this.generateLocalPersonalityRecommendations(state);
  }

  async sendAdaptiveChatMessage(
    prompt: string,
    onChunk: (chunk: string, context?: PersonalityContext) => void,
    attachments?: any[]
  ): Promise<{ content: string; personalityContext: PersonalityContext }> {
    const emotionalState = await this.analyzeCurrentEmotionalState();
    const personality = await this.getPersonalityRecommendations(emotionalState);
    
    const defaultPersonalityContext: PersonalityContext = {
      communicationStyle: personality.communicationStyle,
      emotionalTone: this.getEmotionalTone(emotionalState),
      adaptedResponse: true,
      userMoodDetected: emotionalState.mood,
      responsePersonalization: `Adapted for ${emotionalState.mood} mood`,
    };
    
    try {
      const result = await ApiService.sendAdaptiveChatMessage(
        {
          prompt: prompt,
          message: prompt,
          emotionalContext: emotionalState,
          personalityStyle: personality.communicationStyle,
          stream: true,
          temperature: 0.8
        },
        (chunk, context) => {
          onChunk(chunk, context || defaultPersonalityContext);
        }
      );
      
      if (!result.personalityContext) {
        // console.log('🧠 No personality context from server, using default:', defaultPersonalityContext);
        result.personalityContext = defaultPersonalityContext;
      }
      
      return result;
    } catch (error) {
      console.error('Adaptive chat failed, falling back to standard:', error);
      
      const enhancedPrompt = this.enhancePromptWithPersonality(prompt, emotionalState, personality);
      
      let fullContent = '';
      await ApiService.sendChatMessageStreaming(
        { 
          prompt: enhancedPrompt
        },
        (chunk) => {
          fullContent = chunk;
          onChunk(chunk, defaultPersonalityContext);
        }
      );
      
      return { content: fullContent, personalityContext: defaultPersonalityContext };
    }
  }

  async submitPersonalityFeedback(
    messageId: string,
    feedbackType: 'helpful' | 'not_helpful' | 'love_it',
    personalityStyle: string
  ): Promise<void> {
    try {
      const emotionalState = this.currentEmotionalState || await this.analyzeCurrentEmotionalState();
      
      await ApiService.submitPersonalityFeedback({
        messageId,
        feedbackType,
        personalityStyle,
        userEmotionalState: emotionalState,
      });
      
      await this.updatePersonalityPreferences(personalityStyle, feedbackType);
    } catch (error) {
      console.error('Error submitting personality feedback:', error);
      await this.storeFeedbackLocally(messageId, feedbackType, personalityStyle);
    }
  }

  getContextualSuggestions(emotionalState: UserEmotionalState): string[] {
    const { mood, intensity, timeOfDay } = emotionalState;
    
    if (mood === 'anxious' && intensity > 6) {
      return [
        "I'm feeling overwhelmed...",
        "Help me understand these thoughts",
        "What breathing exercises work?",
        "I need grounding techniques"
      ];
    }
    
    if (mood === 'happy' && intensity > 7) {
      return [
        "I want to share something amazing!",
        "Today was incredible because...",
        "I'm grateful for...",
        "Let's celebrate this moment"
      ];
    }
    
    if (mood === 'sad' && intensity > 5) {
      return [
        "I need some support today",
        "Help me process these feelings",
        "What self-care practices help?",
        "I'm struggling with..."
      ];
    }
    
    if (timeOfDay === 'evening') {
      return [
        "Reflect on my day",
        "Plan for tomorrow",
        "Practice gratitude",
        "Wind down and relax"
      ];
    }
    
    if (timeOfDay === 'morning') {
      return [
        "Set intentions for today",
        "What energy do I need?",
        "Morning motivation",
        "Plan my emotional wellness"
      ];
    }
    
    return [
      "How can I grow today?",
      "What patterns do you notice?",
      "Help me understand myself better",
      "What would serve me right now?"
    ];
  }

  private async getRecentConversations(): Promise<any[]> {
    try {
      // Fix: Read from the correct conversation storage key used by ConversationStorageService
      const stored = await AsyncStorage.getItem('numina_conversations_v2');
      if (!stored) return [];
      
      const conversations = JSON.parse(stored);
      
      // Transform conversation data for analytics consumption
      const recentConversations = conversations
        .slice(0, 5) // Get last 5 conversations
        .map((conv: any) => ({
          id: conv.id,
          timestamp: conv.updatedAt,
          messageCount: conv.messages?.length || 0,
          messages: (conv.messages || [])
            .slice(-10) // Get last 10 messages per conversation
            .map((msg: any) => ({
              sender: msg.sender,
              text: msg.text,
              timestamp: msg.timestamp,
              mood: msg.mood
            }))
        }))
        .filter((conv: any) => conv.messageCount > 0); // Only include conversations with messages
      
      // console.log(`📊 Analytics: Found ${conversations.length} total conversations, using ${recentConversations.length} recent ones for analysis`);
      return recentConversations;
    } catch (error) {
      console.error('Error loading conversations for analytics:', error);
      return [];
    }
  }

  private generateLocalEmotionalState(recentEmotions: any[]): UserEmotionalState {
    if (recentEmotions.length === 0) {
      return this.generateDefaultEmotionalState();
    }
    
    // Analyze recent emotions locally
    const latestEmotion = recentEmotions[0];
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    return {
      mood: latestEmotion.emotion || latestEmotion.mood || 'neutral',
      intensity: latestEmotion.intensity || 5,
      timeOfDay,
      recentInteractions: [],
      patterns: this.extractPatterns(recentEmotions),
    };
  }

  private generateDefaultEmotionalState(): UserEmotionalState {
    const now = new Date();
    const hour = now.getHours();
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    return {
      mood: 'neutral',
      intensity: 5,
      timeOfDay,
      recentInteractions: [],
      patterns: [],
    };
  }

  public getDefaultEmotionalState(): UserEmotionalState {
    return this.generateDefaultEmotionalState();
  }

  public getDefaultPersonality(): AIPersonality {
    const defaultState = this.getDefaultEmotionalState();
    return this.generateLocalPersonalityRecommendations(defaultState);
  }

  private generateLocalPersonalityRecommendations(state: UserEmotionalState): AIPersonality {
    let communicationStyle: 'supportive' | 'direct' | 'collaborative' | 'encouraging';
    
    if (state.mood === 'anxious' || state.mood === 'sad') {
      communicationStyle = 'supportive';
    } else if (state.mood === 'excited' || state.mood === 'happy') {
      communicationStyle = 'encouraging';
    } else if (state.mood === 'thoughtful' || state.mood === 'calm') {
      communicationStyle = 'collaborative';
    } else {
      communicationStyle = 'direct';
    }
    
    return {
      communicationStyle,
      adaptivePrompts: this.getContextualSuggestions(state),
      contextualHints: [`Adapted for ${state.mood} mood`, `${state.timeOfDay} energy consideration`],
    };
  }

  private getEmotionalTone(state: UserEmotionalState): 'supportive' | 'celebratory' | 'analytical' | 'calming' {
    if (state.mood === 'happy' || state.mood === 'excited') return 'celebratory';
    if (state.mood === 'anxious' || state.mood === 'stressed') return 'calming';
    if (state.mood === 'thoughtful') return 'analytical';
    return 'supportive';
  }

  private enhancePromptWithPersonality(
    prompt: string,
    emotionalState: UserEmotionalState,
    personality: AIPersonality
  ): string {
    const context = `[User is feeling ${emotionalState.mood} (intensity: ${emotionalState.intensity}/10) at ${emotionalState.timeOfDay}. 
Respond in ${personality.communicationStyle} style. Be ${this.getEmotionalTone(emotionalState)}.]

${prompt}`;
    
    return context;
  }

  private extractPatterns(emotions: any[]): string[] {
    const moodCounts: { [key: string]: number } = {};
    emotions.forEach(emotion => {
      const mood = emotion.emotion || emotion.mood;
      moodCounts[mood] = (moodCounts[mood] || 0) + 1;
    });
    
    const dominantMoods = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood);
    
    return dominantMoods;
  }

  private async cacheEmotionalState(state: UserEmotionalState): Promise<void> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) {
        // console.warn('No user ID found, cannot cache emotional state');
        return;
      }
      
      const cacheKeys = getCacheKeys(userId);
      await AsyncStorage.setItem(cacheKeys.emotionalState, JSON.stringify({
        data: state,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching emotional state:', error);
    }
  }

  private async cachePersonalityRecommendations(mood: string, personality: AIPersonality): Promise<void> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) {
        // console.warn('No user ID found, cannot cache personality recommendations');
        return;
      }
      
      const cacheKeys = getCacheKeys(userId);
      const key = `${cacheKeys.personalityPreferences}_${mood}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        data: personality,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching personality recommendations:', error);
    }
  }

  private async getCachedPersonalityRecommendations(mood: string): Promise<AIPersonality | null> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) {
        return null;
      }
      
      const cacheKeys = getCacheKeys(userId);
      const key = `${cacheKeys.personalityPreferences}_${mood}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error getting cached personality recommendations:', error);
    }
    return null;
  }

  private async getCachedEmotionalState(): Promise<UserEmotionalState | null> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) {
        return null;
      }
      
      const cacheKeys = getCacheKeys(userId);
      const cached = await AsyncStorage.getItem(cacheKeys.emotionalState);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error getting cached emotional state:', error);
    }
    return null;
  }

  private async updatePersonalityPreferences(style: string, feedback: string): Promise<void> {
    try {
      const current = this.personalityPreferences;
      if (!current[style]) current[style] = { positive: 0, negative: 0 };
      
      if (feedback === 'helpful' || feedback === 'love_it') {
        current[style].positive++;
      } else {
        current[style].negative++;
      }
      
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (userId) {
        const cacheKeys = getCacheKeys(userId);
        await AsyncStorage.setItem(cacheKeys.personalityPreferences, JSON.stringify(current));
      }
      this.personalityPreferences = current;
    } catch (error) {
      console.error('Error updating personality preferences:', error);
    }
  }

  private async storeFeedbackLocally(messageId: string, feedback: string, style: string): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem('@pending_personality_feedback') || '[]';
      const feedbackList = JSON.parse(existing);
      
      feedbackList.push({
        messageId,
        feedback,
        style,
        timestamp: Date.now(),
      });
      
      await AsyncStorage.setItem('@pending_personality_feedback', JSON.stringify(feedbackList));
    } catch (error) {
      console.error('Error storing feedback locally:', error);
    }
  }
}

export default AIPersonalityService;
export type { UserEmotionalState, PersonalityContext, AIPersonality };