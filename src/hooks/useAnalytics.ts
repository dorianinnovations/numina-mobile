import { useState, useEffect, useCallback } from 'react';
import { analyticsService, AnalyticsData, UBPMAnalysis, LLMInsight, PersonalGrowthSummary } from '../services/analyticsService';

interface UseAnalyticsReturn {
  // Data
  analytics: AnalyticsData | null;
  ubmpAnalysis: UBPMAnalysis | null;
  llmInsights: LLMInsight[];
  growthSummary: PersonalGrowthSummary | null;
  recommendations: string[];
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  refresh: () => Promise<void>;
  refreshUBMP: () => Promise<void>;
  refreshInsights: (category?: string) => Promise<void>;
  refreshGrowth: () => Promise<void>;
  lastUpdated: string | null;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial analytics data
  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Load main analytics data
      const analyticsData = await analyticsService.getAnalyticsData();
      setAnalytics(analyticsData);

      // Load recommendations separately (they can be cached longer)
      try {
        const recs = await analyticsService.getRecommendations();
        setRecommendations(recs);
      } catch (recError) {
        console.warn('Failed to load recommendations:', recError);
      }

    } catch (err) {
      console.error('Analytics loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh all analytics data
  const refresh = useCallback(async () => {
    analyticsService.clearCache(); // Clear cache to force fresh data
    await loadAnalytics(true);
  }, [loadAnalytics]);

  // Refresh specific UBMP analysis
  const refreshUBMP = useCallback(async () => {
    try {
      setRefreshing(true);
      const ubmpData = await analyticsService.getUBPMAnalysis();
      
      setAnalytics(prev => prev ? {
        ...prev,
        ubmp: ubmpData,
        lastUpdated: new Date().toISOString()
      } : null);
    } catch (err) {
      console.error('UBMP refresh error:', err);
      setError('Failed to refresh behavioral analysis');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh LLM insights
  const refreshInsights = useCallback(async (category?: string) => {
    try {
      setRefreshing(true);
      const insights = await analyticsService.getLLMInsights(category);
      
      setAnalytics(prev => prev ? {
        ...prev,
        llmInsights: insights,
        lastUpdated: new Date().toISOString()
      } : null);
    } catch (err) {
      console.error('Insights refresh error:', err);
      setError('Failed to refresh insights');
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh growth summary
  const refreshGrowth = useCallback(async () => {
    try {
      setRefreshing(true);
      const growthData = await analyticsService.getGrowthSummary();
      
      setAnalytics(prev => prev ? {
        ...prev,
        growthSummary: growthData,
        lastUpdated: new Date().toISOString()
      } : null);
    } catch (err) {
      console.error('Growth refresh error:', err);
      setError('Failed to refresh growth summary');
    } finally {
      setRefreshing(false);
    }
  }, []);


  // Load analytics on mount
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    // Data
    analytics,
    ubmpAnalysis: analytics?.ubmp || null,
    llmInsights: analytics?.llmInsights || [],
    growthSummary: analytics?.growthSummary || null,
    recommendations,
    
    // Loading states
    loading,
    refreshing,
    
    // Error handling
    error,
    
    // Actions
    refresh,
    refreshUBMP,
    refreshInsights,
    refreshGrowth,
    lastUpdated: analytics?.lastUpdated || null
  };
};