import { useState, useEffect, useCallback } from 'react';
import comprehensiveAnalyticsService, { 
  BehavioralMetrics, 
  CollectiveInsights, 
  PersonalGrowthInsights, 
  UBPMContextData 
} from '../services/comprehensiveAnalytics';

interface ComprehensiveAnalyticsState {
  personalGrowth: PersonalGrowthInsights | null;
  behavioralMetrics: BehavioralMetrics | null;
  collectiveInsights: CollectiveInsights | null;
  emotionalAnalytics: any | null;
  ubpmContext: UBPMContextData | null;
  recommendations: any | null;
  
  isLoading: boolean;
  isLoadingPersonalGrowth: boolean;
  isLoadingBehavioral: boolean;
  isLoadingCollective: boolean;
  isLoadingEmotional: boolean;
  isLoadingUBPM: boolean;
  isLoadingRecommendations: boolean;
  
  error: string | null;
  errors: {
    personalGrowth?: string;
    behavioral?: string;
    collective?: string;
    emotional?: string;
    ubpm?: string;
    recommendations?: string;
  };
  
  summary: {
    totalDataPoints: number;
    completenessScore: number;
    lastUpdated: string;
    keyInsights: string[];
  };
}

export const useComprehensiveAnalytics = () => {
  const [state, setState] = useState<ComprehensiveAnalyticsState>({
    personalGrowth: null,
    behavioralMetrics: null,
    collectiveInsights: null,
    emotionalAnalytics: null,
    ubpmContext: null,
    recommendations: null,
    isLoading: false,
    isLoadingPersonalGrowth: false,
    isLoadingBehavioral: false,
    isLoadingCollective: false,
    isLoadingEmotional: false,
    isLoadingUBPM: false,
    isLoadingRecommendations: false,
    error: null,
    errors: {},
    summary: {
      totalDataPoints: 0,
      completenessScore: 0,
      lastUpdated: '',
      keyInsights: []
    }
  });

  const calculateSummary = useCallback((data: Partial<ComprehensiveAnalyticsState>) => {
    let totalDataPoints = 0;
    let completenessScore = 0;
    const keyInsights: string[] = [];
    
    if (data.personalGrowth) {
      totalDataPoints += 10;
      completenessScore += 1;
      
      if (data.personalGrowth.growthSummary?.positivityRatio > 0.7) {
        keyInsights.push(`High positivity ratio: ${Math.round(data.personalGrowth.growthSummary.positivityRatio * 100)}%`);
      }
      
      if (data.personalGrowth.milestones && Array.isArray(data.personalGrowth.milestones)) {
        const achievedMilestones = data.personalGrowth?.milestones?.filter(m => m.achieved) || [];
        if (achievedMilestones.length > 0) {
          keyInsights.push(`${achievedMilestones.length} milestones achieved`);
        }
      }
    }
    
    if (data.behavioralMetrics) {
      totalDataPoints += 50;
      completenessScore += 1;
      
      const personality = data.behavioralMetrics.personalityTraits;
      if (personality && typeof personality === 'object') {
        const topTraits = Object.entries(personality)
          .filter(([_, value]: [string, any]) => value && value.score > 0.7)
          .map(([trait]) => trait);
        
        if (topTraits.length > 0) {
          keyInsights.push(`Strong traits: ${topTraits.slice(0, 2).join(', ')}`);
        }
      }
      
      const activeHours = data.behavioralMetrics.temporalPatterns?.mostActiveHours;
      if (activeHours && Array.isArray(activeHours) && activeHours.length > 0) {
        keyInsights.push(`Most active: ${activeHours[0]}:00-${activeHours[activeHours.length - 1]}:00`);
      }
    }
    
    if (data.emotionalAnalytics) {
      totalDataPoints += 15;
      completenessScore += 1;
      
      if (data.emotionalAnalytics.stats?.averageIntensity) {
        const avgIntensity = data.emotionalAnalytics.stats.averageIntensity;
        keyInsights.push(`Avg emotional intensity: ${avgIntensity.toFixed(1)}/10`);
      }
    }
    
    if (data.collectiveInsights) {
      totalDataPoints += 8;
      completenessScore += 1;
      
      if (data.collectiveInsights.emotionalTrends?.dominantEmotion) {
        keyInsights.push(`Community emotion: ${data.collectiveInsights.emotionalTrends.dominantEmotion}`);
      }
    }
    
    if (data.ubpmContext) {
      totalDataPoints += 12;
      completenessScore += 1;
      
      if (data.ubpmContext.personalityContext?.communicationStyle) {
        keyInsights.push(`Communication style: ${data.ubpmContext.personalityContext.communicationStyle}`);
      }
    }
    
    if (data.recommendations) {
      totalDataPoints += 5;
      completenessScore += 1;
    }
    
    return {
      totalDataPoints,
      completenessScore: Math.round((completenessScore / 6) * 100),
      lastUpdated: new Date().toISOString(),
      keyInsights: keyInsights.slice(0, 4)
    };
  }, []);

  const fetchAllAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null, errors: {} }));
    
    try {
      const allData = await comprehensiveAnalyticsService.getAllAnalytics();
      
      const newState = {
        ...allData,
        isLoading: false,
        isLoadingPersonalGrowth: false,
        isLoadingBehavioral: false,
        isLoadingCollective: false,
        isLoadingEmotional: false,
        isLoadingUBPM: false,
        isLoadingRecommendations: false,
        error: null,
        errors: {}
      };
      
      const summary = calculateSummary(newState);
      
      setState(prev => ({
        ...prev,
        ...newState,
        summary
      }));
      
      console.log('📊 Comprehensive Analytics loaded:', {
        dataPoints: summary.totalDataPoints,
        completeness: summary.completenessScore,
        insights: summary.keyInsights
      });
      
    } catch (error) {
      console.error('Failed to fetch comprehensive analytics:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load analytics'
      }));
    }
  }, [calculateSummary]);

  const fetchPersonalGrowth = useCallback(async (timeframe: 'week' | 'month' | 'quarter' = 'week') => {
    setState(prev => ({ ...prev, isLoadingPersonalGrowth: true }));
    
    try {
      const personalGrowth = await comprehensiveAnalyticsService.getPersonalGrowthInsights(timeframe);
      setState(prev => {
        const newState = { ...prev, personalGrowth, isLoadingPersonalGrowth: false };
        return {
          ...newState,
          summary: calculateSummary(newState)
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingPersonalGrowth: false,
        errors: { ...prev.errors, personalGrowth: error instanceof Error ? error.message : 'Failed to load personal growth data' }
      }));
    }
  }, [calculateSummary]);

  const fetchBehavioralMetrics = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingBehavioral: true }));
    
    try {
      const behavioralMetrics = await comprehensiveAnalyticsService.getBehavioralMetrics();
      setState(prev => {
        const newState = { ...prev, behavioralMetrics, isLoadingBehavioral: false };
        return {
          ...newState,
          summary: calculateSummary(newState)
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingBehavioral: false,
        errors: { ...prev.errors, behavioral: error instanceof Error ? error.message : 'Failed to load behavioral metrics' }
      }));
    }
  }, [calculateSummary]);

  const fetchCollectiveInsights = useCallback(async (timeRange: string = '30d') => {
    setState(prev => ({ ...prev, isLoadingCollective: true }));
    
    try {
      const collectiveInsights = await comprehensiveAnalyticsService.getCollectiveInsights(timeRange);
      setState(prev => {
        const newState = { ...prev, collectiveInsights, isLoadingCollective: false };
        return {
          ...newState,
          summary: calculateSummary(newState)
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingCollective: false,
        errors: { ...prev.errors, collective: error instanceof Error ? error.message : 'Failed to load collective insights' }
      }));
    }
  }, [calculateSummary]);

  const fetchUBPMContext = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingUBPM: true }));
    
    try {
      const ubpmContext = await comprehensiveAnalyticsService.getUBPMContext();
      setState(prev => {
        const newState = { ...prev, ubpmContext, isLoadingUBPM: false };
        return {
          ...newState,
          summary: calculateSummary(newState)
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingUBPM: false,
        errors: { ...prev.errors, ubpm: error instanceof Error ? error.message : 'Failed to load UBPM context' }
      }));
    }
  }, [calculateSummary]);

  const triggerUBPMAnalysis = useCallback(async () => {
    try {
      await comprehensiveAnalyticsService.triggerUBPMAnalysis();
      // Refresh UBPM data after triggering analysis
      await fetchUBPMContext();
      console.log('🧠 UBPM analysis triggered and data refreshed');
    } catch (error) {
      console.error('Failed to trigger UBPM analysis:', error);
    }
  }, [fetchUBPMContext]);

  // Clear all data
  const clearAnalytics = useCallback(() => {
    setState({
      personalGrowth: null,
      behavioralMetrics: null,
      collectiveInsights: null,
      emotionalAnalytics: null,
      ubpmContext: null,
      recommendations: null,
      isLoading: false,
      isLoadingPersonalGrowth: false,
      isLoadingBehavioral: false,
      isLoadingCollective: false,
      isLoadingEmotional: false,
      isLoadingUBPM: false,
      isLoadingRecommendations: false,
      error: null,
      errors: {},
      summary: {
        totalDataPoints: 0,
        completenessScore: 0,
        lastUpdated: '',
        keyInsights: []
      }
    });
  }, []);

  // Auto-load data on mount
  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  return {
    // Data
    personalGrowth: state.personalGrowth,
    behavioralMetrics: state.behavioralMetrics,
    collectiveInsights: state.collectiveInsights,
    emotionalAnalytics: state.emotionalAnalytics,
    ubpmContext: state.ubpmContext,
    recommendations: state.recommendations,
    
    // Loading states
    isLoading: state.isLoading,
    isLoadingPersonalGrowth: state.isLoadingPersonalGrowth,
    isLoadingBehavioral: state.isLoadingBehavioral,
    isLoadingCollective: state.isLoadingCollective,
    isLoadingEmotional: state.isLoadingEmotional,
    isLoadingUBPM: state.isLoadingUBPM,
    isLoadingRecommendations: state.isLoadingRecommendations,
    
    // Errors
    error: state.error,
    errors: state.errors,
    
    // Summary metrics
    summary: state.summary,
    
    // Actions
    fetchAllAnalytics,
    fetchPersonalGrowth,
    fetchBehavioralMetrics,
    fetchCollectiveInsights,
    fetchUBPMContext,
    triggerUBPMAnalysis,
    clearAnalytics,
    
    // Computed values
    hasData: !!(state.personalGrowth || state.behavioralMetrics || state.emotionalAnalytics),
    isFullyLoaded: state.summary.completenessScore > 80,
    dataQuality: state.summary.completenessScore > 60 ? 'high' : state.summary.completenessScore > 30 ? 'medium' : 'low'
  };
};