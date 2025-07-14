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
  communicationStyle: 'empathetic' | 'direct' | 'collaborative' | 'encouraging';
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
  sendAdaptiveChatMessage: (prompt: string, onChunk: (chunk: string, context?: PersonalityContext) => void) => Promise<{ content: string; personalityContext: PersonalityContext }>;
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

  const aiPersonalityService = AIPersonalityService.getInstance();

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
    }
    
    setIsAnalyzing(true);
    setError(null);
    lastAnalysisRef.current = now;
    
    try {
      const state = await aiPersonalityService.analyzeCurrentEmotionalState();
      setEmotionalState(state);
      return state;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze emotional state');
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [emotionalState]);

  const getPersonalityRecommendations = useCallback(async (): Promise<AIPersonality> => {
    try {
      const personality = await aiPersonalityService.getPersonalityRecommendations(emotionalState || undefined);
      setAiPersonality(personality);
      return personality;
    } catch (err: any) {
      setError(err.message || 'Failed to get personality recommendations');
      throw err;
    }
  }, [emotionalState]);

  const sendAdaptiveChatMessage = useCallback(async (
    prompt: string,
    onChunk: (chunk: string, context?: PersonalityContext) => void
  ): Promise<{ content: string; personalityContext: PersonalityContext }> => {
    try {
      return await aiPersonalityService.sendAdaptiveChatMessage(prompt, onChunk);
    } catch (err: any) {
      setError(err.message || 'Failed to send adaptive chat message');
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
      setError(err.message || 'Failed to submit feedback');
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

  // Initialize on mount with debounced analysis
  useEffect(() => {
    const initialize = async () => {
      try {
        // Debounce the initial analysis to avoid blocking the UI
        analysisDebounceRef.current = setTimeout(async () => {
          await analyzeEmotionalState();
          await getPersonalityRecommendations();
        }, 1000); // 1 second delay for initial load
      } catch (err) {
        // Silently handle initialization errors
        console.warn('Failed to initialize AI personality:', err);
      }
    };

    initialize();
    
    // Cleanup on unmount
    return () => {
      if (analysisDebounceRef.current) {
        clearTimeout(analysisDebounceRef.current);
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