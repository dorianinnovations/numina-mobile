import ApiService from './api';
import { emotionalAnalyticsAPI } from './emotionalAnalyticsAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorageService from './secureStorage';

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
  communicationStyle: string;
  emotionalTone: 'supportive' | 'celebratory' | 'analytical' | 'calming';
  adaptedResponse: boolean;
  userMoodDetected?: string;
  responsePersonalization?: string;
}

// Generate user-specific cache keys
const getCacheKeys = (userId: string) => ({
  emotionalState: `@ai_emotional_state_${userId}`,
  personalityPreferences: `@ai_personality_preferences_${userId}`,
  adaptationHistory: `@ai_adaptation_history_${userId}`,
});

// Performance optimization: Cache duration reduced for faster updates
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes instead of 1 hour
const DEBOUNCE_DELAY = 2000; // 2 seconds debounce for API calls

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

  // Optimized emotional state analysis with better caching and debouncing
  async analyzeCurrentEmotionalState(): Promise<UserEmotionalState> {
    const now = Date.now();
    
    // Check if we have a recent cached state (within 15 minutes)
    const cached = await this.getCachedEmotionalState();
    if (cached && (now - this.lastAnalysisTime) < CACHE_DURATION) {
      console.log('🚀 Using cached emotional state (age:', Math.round((now - this.lastAnalysisTime) / 1000), 's)');
      return cached;
    }

    // Debounce rapid requests
    if (this.pendingAnalysis && (now - this.lastAnalysisTime) < DEBOUNCE_DELAY) {
      console.log('⏳ Returning pending analysis to avoid duplicate requests');
      return this.pendingAnalysis;
    }

    // Start new analysis
    this.pendingAnalysis = this.performEmotionalAnalysis();
    this.lastAnalysisTime = now;
    
    try {
      const result = await this.pendingAnalysis;
      this.pendingAnalysis = null;
      return result;
    } catch (error) {
      this.pendingAnalysis = null;
      throw error;
    }
  }

  private async performEmotionalAnalysis(): Promise<UserEmotionalState> {
    try {
      // Get recent emotions from local storage (fast)
      const recentSession = await emotionalAnalyticsAPI.getCurrentSession();
      const recentEmotions = recentSession.recentEmotions || [];
      
      // Quick local analysis first for immediate response
      const localState = this.generateLocalEmotionalState(recentEmotions);
      
      // If we have recent emotions, use local analysis immediately
      if (recentEmotions.length > 0) {
        console.log('⚡ Using fast local analysis based on', recentEmotions.length, 'recent emotions');
        this.currentEmotionalState = localState;
        await this.cacheEmotionalState(localState);
        
        // Start background AI analysis for better accuracy
        this.performBackgroundAIAnalysis(recentEmotions);
        
        return localState;
      }

      // Only call AI if we have conversation history or no recent emotions
      const conversationHistory = await this.getRecentConversations();
      
      if (conversationHistory.length > 0) {
        console.log('🧠 Performing AI analysis with', conversationHistory.length, 'conversations');
        
        // Call AI analysis endpoint with timeout
        const response = await Promise.race([
          ApiService.analyzeUserEmotionalState({
            recentEmotions,
            conversationHistory,
            timeContext: new Date().toISOString(),
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI analysis timeout')), 8000)
          )
        ]);

        if (response.success && response.data) {
          this.currentEmotionalState = response.data;
          await this.cacheEmotionalState(response.data);
          return response.data;
        }
      }
      
      // Fallback to local analysis
      console.log('🔄 Falling back to local analysis');
      return localState;
    } catch (error) {
      console.error('Error analyzing emotional state:', error);
      // Return cached state or generate basic state
      const cached = await this.getCachedEmotionalState();
      return cached || this.generateDefaultEmotionalState();
    }
  }

  // Background AI analysis that doesn't block the UI
  private async performBackgroundAIAnalysis(recentEmotions: any[]): Promise<void> {
    try {
      const conversationHistory = await this.getRecentConversations();
      
      const response = await ApiService.analyzeUserEmotionalState({
        recentEmotions,
        conversationHistory,
        timeContext: new Date().toISOString(),
      });

      if (response.success && response.data) {
        console.log('🎯 Background AI analysis completed, updating cache');
        this.currentEmotionalState = response.data;
        await this.cacheEmotionalState(response.data);
      }
    } catch (error) {
      console.warn('Background AI analysis failed:', error);
    }
  }

  // Generate personality recommendations based on emotional state
  async getPersonalityRecommendations(emotionalState?: UserEmotionalState): Promise<AIPersonality> {
    const state = emotionalState || this.currentEmotionalState || await this.analyzeCurrentEmotionalState();
    
    // Check for cached personality recommendations
    const cached = await this.getCachedPersonalityRecommendations(state.mood);
    if (cached) {
      console.log('🚀 Using cached personality recommendations for mood:', state.mood);
      return cached;
    }
    
    try {
      console.log('🧠 Fetching personality recommendations for mood:', state.mood);
      const response = await ApiService.getPersonalityRecommendations(state);
      
      if (response.success && response.data) {
        const personality = {
          communicationStyle: response.data.communicationStyle,
          adaptivePrompts: response.data.suggestedPrompts || [],
          contextualHints: response.data.contextualHints || [],
        };
        
        // Cache the personality recommendations
        await this.cachePersonalityRecommendations(state.mood, personality);
        return personality;
      }
    } catch (error) {
      console.error('Error getting personality recommendations:', error);
    }
    
    // Fallback to local personality analysis
    console.log('🔄 Using local personality recommendations');
    return this.generateLocalPersonalityRecommendations(state);
  }

  // Send adaptive chat message with personality context
  async sendAdaptiveChatMessage(
    prompt: string,
    onChunk: (chunk: string, context?: PersonalityContext) => void
  ): Promise<{ content: string; personalityContext: PersonalityContext }> {
    const emotionalState = await this.analyzeCurrentEmotionalState();
    const personality = await this.getPersonalityRecommendations(emotionalState);
    
    try {
      // Try adaptive chat endpoint first
      return await ApiService.sendAdaptiveChatMessage(
        {
          message: prompt,
          emotionalContext: emotionalState,
          personalityStyle: personality.communicationStyle,
          stream: true,
          temperature: 0.8,
        },
        onChunk
      );
    } catch (error) {
      console.error('Adaptive chat failed, falling back to standard:', error);
      
      // Fallback to standard chat with personality context
      const personalityContext: PersonalityContext = {
        communicationStyle: personality.communicationStyle,
        emotionalTone: this.getEmotionalTone(emotionalState),
        adaptedResponse: true,
        userMoodDetected: emotionalState.mood,
        responsePersonalization: `Adapted for ${emotionalState.mood} mood`,
      };
      
      // Enhanced prompt with personality context
      const enhancedPrompt = this.enhancePromptWithPersonality(prompt, emotionalState, personality);
      
      let fullContent = '';
      await ApiService.sendChatMessageStreaming(
        { prompt: enhancedPrompt },
        (chunk) => {
          fullContent = chunk;
          onChunk(chunk, personalityContext);
        }
      );
      
      return { content: fullContent, personalityContext };
    }
  }

  // Submit feedback on AI personality adaptation
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
      
      // Update local preferences
      await this.updatePersonalityPreferences(personalityStyle, feedbackType);
    } catch (error) {
      console.error('Error submitting personality feedback:', error);
      // Store feedback locally for later sync
      await this.storeFeedbackLocally(messageId, feedbackType, personalityStyle);
    }
  }

  // Generate contextual suggestions based on emotional state
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

  // Get adaptive placeholder text
  getAdaptivePlaceholder(emotionalState: UserEmotionalState, personality: AIPersonality): string {
    const { mood, intensity, timeOfDay } = emotionalState;
    const { communicationStyle } = personality;
    
    if (mood === 'anxious' && intensity > 7) {
      return communicationStyle === 'supportive' 
        ? "I'm here to listen... what's on your mind? 💙"
        : "Let's work through this together...";
    }
    
    if (mood === 'happy' && intensity > 8) {
      return "Share your joy! What's making you feel amazing? ✨";
    }
    
    if (mood === 'stressed' && timeOfDay === 'evening') {
      return "End-of-day check-in... how can I help you unwind? 🌙";
    }
    
    if (timeOfDay === 'morning') {
      return "Good morning! How are you feeling today? ☀️";
    }
    
    switch (communicationStyle) {
      case 'supportive':
        return "I'm here for you... what's in your heart? 💫";
      case 'collaborative':
        return "Let's explore this together... what's happening?";
      case 'encouraging':
        return "You've got this! What's on your mind? 🌟";
      case 'direct':
        return "What would you like to talk about?";
      default:
        return "Share your thoughts with me...";
    }
  }

  // Private helper methods
  private async getRecentConversations(): Promise<any[]> {
    // This would get recent chat history - simplified for now
    try {
      const stored = await AsyncStorage.getItem('@recent_conversations');
      return stored ? JSON.parse(stored) : [];
    } catch {
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

  // Public method for generating default emotional state
  public getDefaultEmotionalState(): UserEmotionalState {
    return this.generateDefaultEmotionalState();
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
    // Simple pattern extraction - could be enhanced with ML
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
      const userId = await SecureStorageService.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, cannot cache emotional state');
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
      const userId = await SecureStorageService.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, cannot cache personality recommendations');
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
      const userId = await SecureStorageService.getCurrentUserId();
      if (!userId) {
        return null;
      }
      
      const cacheKeys = getCacheKeys(userId);
      const key = `${cacheKeys.personalityPreferences}_${mood}`;
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cached data if less than 30 minutes old
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
      const userId = await SecureStorageService.getCurrentUserId();
      if (!userId) {
        return null;
      }
      
      const cacheKeys = getCacheKeys(userId);
      const cached = await AsyncStorage.getItem(cacheKeys.emotionalState);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cached data if less than 15 minutes old (reduced from 1 hour)
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
      
      const userId = await SecureStorageService.getCurrentUserId();
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