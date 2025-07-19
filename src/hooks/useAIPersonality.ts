import { useState, useEffect, useCallback, useRef } from 'react';
import AIPersonalityService from '../services/aiPersonalityService';

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

interface UseAIPersonalityReturn {
  emotionalState: UserEmotionalState | null;
  aiPersonality: AIPersonality | null;
  isAnalyzing: boolean;
  analyzeEmotionalState: () => Promise<UserEmotionalState>;
  getPersonalityRecommendations: () => Promise<AIPersonality>;
  sendAdaptiveChatMessage: (prompt: string, onChunk: (chunk: string, context?: PersonalityContext) => void, attachments?: any[]) => Promise<{ content: string; personalityContext: PersonalityContext }>;
  submitFeedback: (messageId: string, feedback: 'helpful' | 'not_helpful' | 'love_it', style: string) => Promise<void>;
  getContextualSuggestions: () => string[];
  getAdaptivePlaceholder: () => string;
  error: string | null;
  retryAnalysis: () => Promise<void>;
}

export const useAIPersonality = (): UseAIPersonalityReturn => {
  const [emotionalState, setEmotionalState] = useState<UserEmotionalState | null>(null);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Performance optimization: Track last analysis time to avoid unnecessary calls
  const lastAnalysisRef = useRef<number>(0);
  const analysisDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add cleanup refs to prevent memory leaks
  const isMountedRef = useRef<boolean>(true);
  const pendingAnalysisRef = useRef<Promise<UserEmotionalState> | null>(null);

  const aiPersonalityService = AIPersonalityService.getInstance();

  // Proper cleanup function
  const cleanupResources = useCallback(() => {
    if (analysisDebounceRef.current) {
      clearTimeout(analysisDebounceRef.current);
      analysisDebounceRef.current = null;
    }
  }, []);

  const analyzeEmotionalState = useCallback(async (): Promise<UserEmotionalState> => {
    const now = Date.now();
    
    // Debounce rapid calls (within 5 seconds)
    if (now - lastAnalysisRef.current < 5000) {
      console.log('⏳ Debouncing emotional state analysis (last:', Math.round((now - lastAnalysisRef.current) / 1000), 's ago)');
      return emotionalState || aiPersonalityService.getDefaultEmotionalState();
    }
    
    // Clear any pending debounce
    if (analysisDebounceRef.current) {
      clearTimeout(analysisDebounceRef.current);
      analysisDebounceRef.current = null;
    }
    
    // Check if component is still mounted
    if (!isMountedRef.current) {
      console.log('⏳ Component unmounted, skipping analysis');
      return emotionalState || aiPersonalityService.getDefaultEmotionalState();
    }
    
    setIsAnalyzing(true);
    setError(null);
    lastAnalysisRef.current = now;
    
    try {
      const state = await aiPersonalityService.analyzeCurrentEmotionalState();
      
      // Check if component is still mounted before updating state
      if (isMountedRef.current) {
        setEmotionalState(state);
      }
      
      return state;
    } catch (err: any) {
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        setError(err.message || 'Failed to analyze emotional state');
      }
      throw err;
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setIsAnalyzing(false);
      }
    }
  }, [emotionalState]);

  const getPersonalityRecommendations = useCallback(async (): Promise<AIPersonality> => {
    try {
      const personality = await aiPersonalityService.getPersonalityRecommendations(emotionalState || undefined);
      
      // Check if component is still mounted before updating state
      if (isMountedRef.current) {
        setAiPersonality(personality);
      }
      
      return personality;
    } catch (err: any) {
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        setError(err.message || 'Failed to get personality recommendations');
      }
      throw err;
    }
  }, [emotionalState]);

  const sendAdaptiveChatMessage = useCallback(async (
    prompt: string,
    onChunk: (chunk: string, context?: PersonalityContext) => void,
    attachments?: any[]
  ): Promise<{ content: string; personalityContext: PersonalityContext }> => {
    try {
      return await aiPersonalityService.sendAdaptiveChatMessage(prompt, onChunk, attachments);
    } catch (err: any) {
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        setError(err.message || 'Failed to send adaptive chat message');
      }
      throw err;
    }
  }, []);

  const submitFeedback = useCallback(async (
    messageId: string,
    feedback: 'helpful' | 'not_helpful' | 'love_it',
    style: string
  ): Promise<void> => {
    try {
      await aiPersonalityService.submitPersonalityFeedback(messageId, feedback, style);
    } catch (err: any) {
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        setError(err.message || 'Failed to submit feedback');
      }
      throw err;
    }
  }, []);

  const getContextualSuggestions = useCallback((): string[] => {
    if (!emotionalState) return [];
    return aiPersonalityService.getContextualSuggestions(emotionalState);
  }, [emotionalState]);

  const getAdaptivePlaceholder = useCallback((): string => {
    if (!emotionalState || !aiPersonality) return 'Share your thoughts...';
    return aiPersonalityService.getAdaptivePlaceholder(emotionalState, aiPersonality);
  }, [emotionalState, aiPersonality]);

  const retryAnalysis = useCallback(async (): Promise<void> => {
    // Reset analysis time to force fresh analysis
    lastAnalysisRef.current = 0;
    await analyzeEmotionalState();
    await getPersonalityRecommendations();
  }, [analyzeEmotionalState, getPersonalityRecommendations]);

  // Initialize on mount with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    const initialize = async () => {
      try {
        // Debounce the initial analysis to avoid blocking the UI
        analysisDebounceRef.current = setTimeout(async () => {
          // Check if component is still mounted before proceeding
          if (!isMountedRef.current) {
            console.log('⏳ Component unmounted during initialization, skipping');
            return;
          }
          
          try {
            await analyzeEmotionalState();
            await getPersonalityRecommendations();
          } catch (err) {
            // Silently handle initialization errors
            console.warn('Failed to initialize AI personality:', err);
          }
        }, 1000); // 1 second delay for initial load
      } catch (err) {
        // Silently handle initialization errors
        console.warn('Failed to initialize AI personality:', err);
      }
    };

    initialize();
    
    // Comprehensive cleanup on unmount
    return () => {
      console.log('🧹 useAIPersonality: Cleaning up resources');
      isMountedRef.current = false;
      
      // Clear any pending timeouts
      if (analysisDebounceRef.current) {
        clearTimeout(analysisDebounceRef.current);
        analysisDebounceRef.current = null;
      }
      
      // Cancel any pending analysis
      if (pendingAnalysisRef.current) {
        pendingAnalysisRef.current = null;
      }
    };
  }, []);

  return {
    emotionalState,
    aiPersonality,
    isAnalyzing,
    analyzeEmotionalState,
    getPersonalityRecommendations,
    sendAdaptiveChatMessage,
    submitFeedback,
    getContextualSuggestions,
    getAdaptivePlaceholder,
    error,
    retryAnalysis,
  };
};