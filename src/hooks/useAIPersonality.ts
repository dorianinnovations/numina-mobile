import { useState, useEffect, useCallback } from 'react';
import AIPersonalityService, { UserEmotionalState, PersonalityContext, AIPersonality } from '../services/aiPersonalityService';

interface UseAIPersonalityReturn {
  // State
  emotionalState: UserEmotionalState | null;
  aiPersonality: AIPersonality | null;
  isAnalyzing: boolean;
  
  // Methods
  analyzeEmotionalState: () => Promise<UserEmotionalState>;
  getPersonalityRecommendations: () => Promise<AIPersonality>;
  sendAdaptiveChatMessage: (
    prompt: string, 
    onChunk: (chunk: string, context?: PersonalityContext) => void
  ) => Promise<{ content: string; personalityContext: PersonalityContext }>;
  submitFeedback: (messageId: string, feedback: 'helpful' | 'not_helpful' | 'love_it', style: string) => Promise<void>;
  getContextualSuggestions: () => string[];
  getAdaptivePlaceholder: () => string;
  
  // Error handling
  error: string | null;
  retryAnalysis: () => Promise<void>;
}

export const useAIPersonality = (): UseAIPersonalityReturn => {
  const [emotionalState, setEmotionalState] = useState<UserEmotionalState | null>(null);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aiPersonalityService = AIPersonalityService.getInstance();

  const analyzeEmotionalState = useCallback(async (): Promise<UserEmotionalState> => {
    setIsAnalyzing(true);
    setError(null);
    
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
  }, []);

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
    await analyzeEmotionalState();
    await getPersonalityRecommendations();
  }, [analyzeEmotionalState, getPersonalityRecommendations]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await analyzeEmotionalState();
        await getPersonalityRecommendations();
      } catch (err) {
        // Silently handle initialization errors
        console.warn('Failed to initialize AI personality:', err);
      }
    };

    initialize();
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