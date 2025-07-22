import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import SecureStorageService from '../services/secureStorage';

interface LLMInsight {
  id: string;
  type: 'pattern' | 'trend' | 'recommendation' | 'anomaly';
  title: string;
  description: string;
  confidence: number;
  timestamp: Date;
  category?: string;
  actionable?: boolean;
}

interface LLMAnalyticsState {
  llmInsights: LLMInsight[] | null;
  llmWeeklyInsights: LLMInsight[] | null;
  llmRecommendations: LLMInsight[] | null;
  isGeneratingInsights: boolean;
  isGeneratingWeekly: boolean;
  isGeneratingRecommendations: boolean;
  insightsError: string | null;
  weeklyError: string | null;
  recommendationsError: string | null;
}

// Generate user-specific cache keys
const getCacheKeys = (userId: string) => ({
  insights: `@llm_insights_${userId}`,
  weekly: `@llm_weekly_${userId}`,
  recommendations: `@llm_recommendations_${userId}`,
});

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const useLLMAnalytics = () => {
  const [state, setState] = useState<LLMAnalyticsState>({
    llmInsights: null,
    llmWeeklyInsights: null,
    llmRecommendations: null,
    isGeneratingInsights: false,
    isGeneratingWeekly: false,
    isGeneratingRecommendations: false,
    insightsError: null,
    weeklyError: null,
    recommendationsError: null,
  });

  // Load cached data on mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      const userId = await SecureStorageService.getCurrentUserId();
      if (!userId) {
        console.log('No user ID found for LLM cache - user may not be logged in');
        return;
      }
      
      const cacheKeys = getCacheKeys(userId);
      const [insights, weekly, recommendations] = await Promise.all([
        AsyncStorage.getItem(cacheKeys.insights),
        AsyncStorage.getItem(cacheKeys.weekly),
        AsyncStorage.getItem(cacheKeys.recommendations),
      ]);

      setState(prev => ({
        ...prev,
        llmInsights: insights ? JSON.parse(insights).data : null,
        llmWeeklyInsights: weekly ? JSON.parse(weekly).data : null,
        llmRecommendations: recommendations ? JSON.parse(recommendations).data : null,
      }));
    } catch (error) {
      console.error('Error loading cached LLM data:', error);
    }
  };

  const cacheData = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching LLM data:', error);
    }
  };

  const generateMockInsights = (type: 'general' | 'pattern' | 'weekly' | 'recommendations'): LLMInsight[] => {
    const baseInsights: { [key: string]: LLMInsight[] } = {
      general: [
        {
          id: '1',
          type: 'pattern',
          title: 'Morning Mindfulness Peak',
          description: 'Your emotional well-being consistently improves after morning meditation sessions. Consider making this a daily habit.',
          confidence: 0.92,
          timestamp: new Date(),
          category: 'Wellness Patterns',
          actionable: true,
        },
        {
          id: '2',
          type: 'trend',
          title: 'Stress Reduction Trend',
          description: 'Your stress levels have decreased by 23% over the past two weeks. The breathing exercises seem particularly effective.',
          confidence: 0.87,
          timestamp: new Date(),
          category: 'Progress Tracking',
        },
        {
          id: '3',
          type: 'anomaly',
          title: 'Unusual Evening Activity',
          description: 'Detected increased anxiety levels on Tuesday evenings. This might be related to work deadlines or specific commitments.',
          confidence: 0.76,
          timestamp: new Date(),
          category: 'Attention Areas',
        },
      ],
      pattern: [
        {
          id: '4',
          type: 'pattern',
          title: 'Social Connection Boost',
          description: 'Your mood improves significantly after social interactions. Weekend gatherings show the strongest positive impact.',
          confidence: 0.89,
          timestamp: new Date(),
          category: 'Social Wellness',
          actionable: true,
        },
        {
          id: '5',
          type: 'pattern',
          title: 'Sleep Quality Correlation',
          description: 'Better sleep quality directly correlates with improved emotional resilience the following day.',
          confidence: 0.94,
          timestamp: new Date(),
          category: 'Sleep & Recovery',
        },
      ],
      weekly: [
        {
          id: '6',
          type: 'trend',
          title: 'Weekly Wellness Summary',
          description: 'This week showed a 15% improvement in overall emotional balance. Key contributors: consistent meditation and better sleep.',
          confidence: 0.91,
          timestamp: new Date(),
          category: 'Weekly Report',
        },
        {
          id: '7',
          type: 'recommendation',
          title: 'Focus Area: Evening Routine',
          description: 'Based on this week\'s data, establishing a calming evening routine could significantly improve your sleep quality.',
          confidence: 0.88,
          timestamp: new Date(),
          category: 'Weekly Insights',
          actionable: true,
        },
      ],
      recommendations: [
        {
          id: '8',
          type: 'recommendation',
          title: 'Try Progressive Muscle Relaxation',
          description: 'Based on your stress patterns, PMR exercises before bed could help reduce physical tension.',
          confidence: 0.85,
          timestamp: new Date(),
          category: 'Personalized Tips',
          actionable: true,
        },
        {
          id: '9',
          type: 'recommendation',
          title: 'Schedule Worry Time',
          description: 'Set aside 15 minutes daily for addressing concerns. This can help prevent anxiety from spreading throughout your day.',
          confidence: 0.83,
          timestamp: new Date(),
          category: 'Anxiety Management',
          actionable: true,
        },
        {
          id: '10',
          type: 'recommendation',
          title: 'Nature Connection',
          description: 'Your data suggests outdoor activities boost your mood. Try a 20-minute nature walk 3 times this week.',
          confidence: 0.90,
          timestamp: new Date(),
          category: 'Lifestyle',
          actionable: true,
        },
      ],
    };

    return baseInsights[type] || baseInsights.general;
  };

  const generateInsights = useCallback(async (options: { days?: number; focus?: string } = {}) => {
    setState(prev => ({ ...prev, isGeneratingInsights: true, insightsError: null }));

    try {
      const response = await ApiService.generateLLMInsights(options);
      
      if (response.success && response.data?.insights) {
        const insights = response.data.insights;
        setState(prev => ({ 
          ...prev, 
          llmInsights: insights,
          isGeneratingInsights: false 
        }));
        
        const userId = await SecureStorageService.getCurrentUserId();
        if (userId) {
          const cacheKeys = getCacheKeys(userId);
          await cacheData(cacheKeys.insights, insights);
        }
      } else {
        // Set error state for unsuccessful API response
        setState(prev => ({ 
          ...prev, 
          llmInsights: null,
          isGeneratingInsights: false,
          insightsError: 'API request was unsuccessful'
        }));
      }
    } catch (error: any) {
      // Set error state instead of mock data
      setState(prev => ({ 
        ...prev, 
        llmInsights: null,
        isGeneratingInsights: false,
        insightsError: error.message || 'Failed to generate insights'
      }));
    }
  }, []);

  const generateWeeklyInsights = useCallback(async () => {
    setState(prev => ({ ...prev, isGeneratingWeekly: true, weeklyError: null }));

    try {
      const response = await ApiService.generateWeeklyDigest();
      
      if (response.success && response.data?.insights) {
        const insights = response.data.insights;
        setState(prev => ({ 
          ...prev, 
          llmWeeklyInsights: insights,
          isGeneratingWeekly: false 
        }));
        
        const userId = await SecureStorageService.getCurrentUserId();
        if (userId) {
          const cacheKeys = getCacheKeys(userId);
          await cacheData(cacheKeys.weekly, insights);
        }
      } else {
        // Set error state for unsuccessful API response
        setState(prev => ({ 
          ...prev, 
          llmWeeklyInsights: null,
          isGeneratingWeekly: false,
          weeklyError: 'API request was unsuccessful'
        }));
      }
    } catch (error: any) {
      // Set error state instead of mock data
      setState(prev => ({ 
        ...prev, 
        llmWeeklyInsights: null,
        isGeneratingWeekly: false,
        weeklyError: error.message || 'Failed to generate weekly insights'
      }));
    }
  }, []);

  const generateRecommendations = useCallback(async (options: {} = {}, forceRefresh = false) => {
    setState(prev => ({ ...prev, isGeneratingRecommendations: true, recommendationsError: null }));

    try {
      const response = await ApiService.generateRecommendations();
      
      if (response.success && response.data?.recommendations) {
        const recommendations = response.data.recommendations;
        setState(prev => ({ 
          ...prev, 
          llmRecommendations: recommendations,
          isGeneratingRecommendations: false 
        }));
        
        const userId = await SecureStorageService.getCurrentUserId();
        if (userId) {
          const cacheKeys = getCacheKeys(userId);
          await cacheData(cacheKeys.recommendations, recommendations);
        }
      } else {
        // Set error state for unsuccessful API response
        setState(prev => ({ 
          ...prev, 
          llmRecommendations: null,
          isGeneratingRecommendations: false,
          recommendationsError: 'API request was unsuccessful'
        }));
      }
    } catch (error: any) {
      // Set error state instead of mock data
      setState(prev => ({ 
        ...prev, 
        llmRecommendations: null,
        isGeneratingRecommendations: false,
        recommendationsError: error.message || 'Failed to generate recommendations'
      }));
    }
  }, []);

  const getPatternInsights = useCallback(async () => {
    setState(prev => ({ ...prev, isGeneratingInsights: true, insightsError: null }));

    try {
      const response = await ApiService.getPatternAnalysis();
      
      if (response.success && response.data?.patterns) {
        const insights = response.data.patterns;
        setState(prev => ({ 
          ...prev, 
          llmInsights: insights,
          isGeneratingInsights: false 
        }));
      } else {
        // Set error state for unsuccessful API response
        setState(prev => ({ 
          ...prev, 
          llmInsights: null,
          isGeneratingInsights: false,
          insightsError: 'Pattern analysis API request was unsuccessful'
        }));
      }
    } catch (error: any) {
      // Set error state instead of mock data
      setState(prev => ({ 
        ...prev, 
        llmInsights: null,
        isGeneratingInsights: false,
        insightsError: error.message || 'Failed to get pattern insights'
      }));
    }
  }, []);

  const getRecommendationInsights = useCallback(async () => {
    return generateRecommendations();
  }, [generateRecommendations]);

  const getTrendInsights = useCallback(async () => {
    return generateInsights({ focus: 'trends' });
  }, [generateInsights]);

  const hasCachedInsights = state.llmInsights !== null;
  const hasCachedWeekly = state.llmWeeklyInsights !== null;
  const hasCachedRecommendations = state.llmRecommendations !== null;

  return {
    ...state,
    generateInsights,
    generateWeeklyInsights,
    generateRecommendations,
    getPatternInsights,
    getRecommendationInsights,
    getTrendInsights,
    hasCachedInsights,
    hasCachedWeekly,
    hasCachedRecommendations,
  };
};