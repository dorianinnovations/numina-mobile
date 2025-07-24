import { PersonalGrowthInsights, BehavioralMetrics, CollectiveInsights } from './comprehensiveAnalytics';

// Transform backend personality traits array to frontend object format
export const transformPersonalityTraits = (backendTraits: any[] | any): Record<string, { score: number; confidence: number }> => {
  if (!backendTraits) return {};
  
  // If already in object format, return as-is
  if (!Array.isArray(backendTraits)) {
    return backendTraits;
  }
  
  // Transform array format to object format
  return backendTraits.reduce((acc, trait) => {
    if (trait.trait && typeof trait.score === 'number') {
      acc[trait.trait] = {
        score: trait.score,
        confidence: trait.confidence || 0.5
      };
    }
    return acc;
  }, {});
};

// Safe data access with fallbacks
export const safeDataAccess = <T>(data: any, path: string, fallback: T): T => {
  try {
    return path.split('.').reduce((obj, key) => obj?.[key], data) ?? fallback;
  } catch {
    return fallback;
  }
};

// Transform backend analytics response to frontend format
export const transformAnalyticsResponse = (response: any) => {
  if (!response) return null;
  
  // Handle different response formats
  if (response.success && response.data) {
    return response.data;
  }
  
  if (response.status === 'success' && response.data) {
    return response.data;
  }
  
  // If response has insight field (LLM endpoints)
  if (response.success && response.insight) {
    return {
      insight: response.insight,
      confidence: response.confidence,
      category: response.category,
      processingTime: response.processingTime,
      timestamp: response.timestamp
    };
  }
  
  return response;
};

// Transform backend behavioral patterns to chart data
export const transformBehavioralPatternsToChartData = (temporalPatterns: any) => {
  if (!temporalPatterns?.mostActiveHours) {
    return [];
  }
  
  return temporalPatterns.mostActiveHours.map((hour: number, index: number) => ({
    value: Math.random() * 10 + 5, // Simulated activity level
    label: `${hour}:00`,
    frontColor: '#10B981',
    gradientColor: '#34D399',
  }));
};

// Transform personality traits to radar chart data
export const transformPersonalityToRadarData = (personalityTraits: any) => {
  if (!personalityTraits) return [];
  
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'];
  
  return Object.entries(personalityTraits)
    .filter(([_, trait]) => (trait as any)?.score > 0.4)
    .map(([name, trait], index) => ({
      trait: name.charAt(0).toUpperCase() + name.slice(1),
      score: Math.round((trait as any).score * 10),
      color: colors[index % colors.length]
    }));
};

// Transform emotional data to line chart format
export const transformEmotionalToLineData = (emotionalData: any) => {
  if (!emotionalData) {
    return Array.from({ length: 7 }, (_, i) => ({
      value: Math.random() * 10 + 1,
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    }));
  }
  
  // Generate sample week data based on baseline and average
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(1, 
      (emotionalData.intensityPattern?.average || 5) + 
      (Math.random() - 0.5) * (emotionalData.emotionalRange || 3) * 10
    ),
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));
};

// Transform growth data to pie chart format
export const transformGrowthToPieData = (growthData: any, milestones: any[] = []) => {
  if (!growthData) return [];
  
  // Ensure milestones is always an array
  const safeMilestones = Array.isArray(milestones) ? milestones : [];
  
  return [
    {
      value: Math.round((growthData.emotionalPatterns?.positivityRatio || 0.5) * 100),
      color: '#10B981',
      text: 'Positivity',
      label: 'Positivity Ratio'
    },
    {
      value: Math.round((growthData.engagementMetrics?.dailyEngagementScore || 5) * 10),
      color: '#3B82F6',
      text: 'Engagement',
      label: 'Engagement Score'
    },
    {
      value: safeMilestones.filter(m => m && m.achieved).length * 10,
      color: '#F59E0B',
      text: 'Milestones',
      label: 'Achievements'
    }
  ];
};

// Transform social data to bar chart format
export const transformSocialToBarData = (socialData: any) => {
  if (!socialData) return [];
  
  return [
    {
      value: Math.round((socialData.supportGiving || 0.5) * 10),
      label: 'Giving',
      frontColor: '#8B5CF6',
      gradientColor: '#A78BFA',
    },
    {
      value: Math.round((socialData.supportReceiving || 0.5) * 10),
      label: 'Receiving',
      frontColor: '#EC4899',
      gradientColor: '#F472B6',
    }
  ];
};

// Transform weekly insights to chart data
export const transformWeeklyInsightsToChartData = (weeklyData: any) => {
  if (!weeklyData) return [];
  
  return [
    {
      value: weeklyData.totalDataPoints || 0,
      label: 'Data Points',
      frontColor: '#06B6D4',
      gradientColor: '#67E8F9',
    },
    {
      value: weeklyData.completenessScore || 0,
      label: 'Completeness',
      frontColor: '#84CC16',
      gradientColor: '#A3E635',
    },
    {
      value: (weeklyData.keyInsights?.length || 0) * 20,
      label: 'Insights',
      frontColor: '#F97316',
      gradientColor: '#FB923C',
    }
  ];
};

// Validate and clean chart data
export const validateChartData = (data: any[], minValue: number = 0, maxValue?: number) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    ...item,
    value: Math.max(minValue, Math.min(maxValue || item.value, item.value || 0))
  })).filter(item => typeof item.value === 'number' && !isNaN(item.value));
};

// Create mock data for empty states
export const createMockChartData = (type: 'bar' | 'line' | 'pie', count: number = 5) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  switch (type) {
    case 'bar':
      return Array.from({ length: count }, (_, i) => ({
        value: Math.floor(Math.random() * 10) + 1,
        label: `Item ${i + 1}`,
        frontColor: colors[i % colors.length],
        gradientColor: `${colors[i % colors.length]}80`
      }));
      
    case 'line':
      return Array.from({ length: count }, (_, i) => ({
        value: Math.floor(Math.random() * 10) + 1,
        label: `Point ${i + 1}`
      }));
      
    case 'pie':
      return Array.from({ length: count }, (_, i) => ({
        value: Math.floor(Math.random() * 30) + 10,
        color: colors[i % colors.length],
        text: `Section ${i + 1}`,
        label: `Section ${i + 1}`
      }));
      
    default:
      return [];
  }
};

// Create mock bar data with proper typing
export const createMockBarData = (count: number = 5) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  return Array.from({ length: count }, (_, i) => ({
    value: Math.floor(Math.random() * 10) + 1,
    label: `Item ${i + 1}`,
    frontColor: colors[i % colors.length],
    gradientColor: `${colors[i % colors.length]}80`
  }));
};

// Create mock pie data with proper typing
export const createMockPieData = (count: number = 3) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B'];
  return Array.from({ length: count }, (_, i) => ({
    value: Math.floor(Math.random() * 30) + 10,
    color: colors[i % colors.length],
    text: `Section ${i + 1}`,
    label: `Section ${i + 1}`
  }));
};

// Error boundary for chart data transformation
export const safeTransform = <T>(transformFn: () => T, fallback: T): T => {
  try {
    const result = transformFn();
    return result ?? fallback;
  } catch (error) {
    // Silent fallback to prevent rendering errors
    return fallback;
  }
};