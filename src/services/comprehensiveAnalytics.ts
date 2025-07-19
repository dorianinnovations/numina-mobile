import CloudAuth from './cloudAuth';
import NetInfo from '@react-native-community/netinfo';



const getBaseApiUrl = () => {
  // Use production server for now to test with real data and auth
  return 'https://server-a7od.onrender.com';
};

const createAuthHeaders = async () => {
  const token = CloudAuth.getInstance().getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };
};

export interface BehavioralMetrics {
  // UBPM Core Metrics (15+ metrics)
  communicationStyle: {
    preferredTone: string;
    responseLength: string;
    complexity: string;
    messageLength: {
      average: number;
      variation: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    questionFrequency: number;
    emotionalExpression: number;
  };
  
  // Personality Analysis (Big Five + Extended)
  personalityTraits: {
    openness: { score: number; confidence: number };
    conscientiousness: { score: number; confidence: number };
    extraversion: { score: number; confidence: number };
    agreeableness: { score: number; confidence: number };
    neuroticism: { score: number; confidence: number };
    curiosity: { score: number; confidence: number };
    empathy: { score: number; confidence: number };
    resilience: { score: number; confidence: number };
    creativity: { score: number; confidence: number };
    analyticalThinking: { score: number; confidence: number };
  };
  
  // Temporal Behavior Patterns
  temporalPatterns: {
    mostActiveHours: number[];
    mostActiveDays: string[];
    sessionDuration: {
      average: number;
      distribution: number[];
    };
    interactionFrequency: 'high' | 'medium' | 'low';
    cyclicalPatterns: {
      weekly: any[];
      seasonal: any[];
      lunar: any[];
    };
  };
  
  // Emotional Intelligence Metrics
  emotionalProfile: {
    baselineEmotion: string;
    emotionalRange: number;
    emotionalStability: number;
    intensityPattern: {
      average: number;
      variance: number;
      trend: string;
    };
    triggers: Array<{
      trigger: string;
      emotion: string;
      intensity: number;
      frequency: number;
    }>;
    recoveryPatterns: string[];
  };
  
  // Social & Connection Metrics
  socialPatterns: {
    connectionStyle: string;
    groupPreferences: string[];
    supportGiving: number;
    supportReceiving: number;
    compatibilityScores: any[];
  };
  
  // Goals & Aspirations
  growthMetrics: {
    currentLifecycleStage: string;
    stageConfidence: number;
    shortTermGoals: any[];
    longTermGoals: any[];
    progressMetrics: any[];
    values: string[];
    motivations: string[];
  };
  
  // Decision Making & Problem Solving
  decisionPatterns: {
    decisionStyle: 'collaborative' | 'independent' | 'analytical';
    adviceSeekingFrequency: number;
    problemSolvingApproach: string;
    riskTolerance: number;
  };
  
  // Engagement & Usage Patterns
  engagementMetrics: {
    dailyEngagementScore: number;
    conversationCount: number;
    toolUsageFrequency: Record<string, number>;
    featureAdoption: Record<string, boolean>;
    retentionScore: number;
  };
}

export interface CollectiveInsights {
  emotionalTrends: {
    dominantEmotion: string;
    averageIntensity: number;
    distribution: Record<string, number>;
    temporalPatterns: any[];
  };
  behavioralComparisons: {
    personalityNorms: Record<string, number>;
    communicationStyles: Record<string, number>;
    engagementBenchmarks: Record<string, number>;
  };
  insights: Array<{
    title: string;
    description: string;
    category: string;
    confidence: number;
  }>;
}

export interface PersonalGrowthInsights {
  growthSummary: {
    timeframe: string;
    emotionalPatterns: {
      frequency: Record<string, number>;
      intensity: {
        average: number;
        trend: 'increasing' | 'decreasing' | 'stable';
      };
      positivityRatio: number;
    };
    engagementMetrics: {
      conversationCount: number;
      dailyEngagementScore: number;
      consistencyScore: number;
    };
    insights: string[];
    recommendations: string[];
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    achieved: boolean;
    progress: number;
    achievedAt?: string;
  }>;
}

export interface UBPMContextData {
  behavioralContext: {
    patterns: any[];
    significance: Record<string, number>;
    insights: string[];
  };
  personalityContext: {
    adaptedResponse: boolean;
    communicationStyle: string;
    emotionalTone: string;
    personalizedReason: string;
  };
  temporalContext: {
    currentTimeContext: string;
    historicalPatterns: any[];
    seasonalContext: string;
  };
}

class ComprehensiveAnalyticsService {
  private baseURL: string;

  constructor() {
    this.baseURL = getBaseApiUrl();
  }

  private async canMakeRequest(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    const token = CloudAuth.getInstance().getToken();
    console.log('🔐 Auth check:', { connected: netInfo.isConnected, hasToken: !!token });
    return (netInfo.isConnected ?? false) && !!token;
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!(await this.canMakeRequest())) {
      throw new Error('No network connection or authentication');
    }

    const url = `${this.baseURL}${endpoint}`;
    console.log('📡 API Request:', { url, method: options.method || 'GET' });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...(await createAuthHeaders()),
        ...options.headers,
      },
    });

    console.log('📡 API Response:', { url, status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('📡 API Error:', { url, status: response.status, error: errorText });
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  async getPersonalGrowthInsights(timeframe: 'week' | 'month' | 'quarter' = 'week'): Promise<PersonalGrowthInsights> {
    const [growthSummary, milestones] = await Promise.all([
      this.apiRequest<any>(`/personal-insights/growth-summary?timeframe=${timeframe}`),
      this.apiRequest<any>('/personal-insights/milestones')
    ]);

    return {
      growthSummary,
      milestones
    };
  }

  async getBehavioralMetrics(): Promise<BehavioralMetrics> {
    const [userProfile, ubpmContext, emotionalSession] = await Promise.all([
      this.apiRequest<any>('/profile'),
      this.apiRequest<any>('/test-ubpm/context'),
      this.apiRequest<any>('/emotional-analytics/current-session').catch(() => ({ dailyEngagementScore: 7.5, conversationCount: 3 }))
    ]);

    const behaviorProfile = userProfile?.behaviorProfile || {};
    const personalityData = behaviorProfile.personality || {};
    const temporalData = behaviorProfile.temporalPatterns || {};
    const emotionalData = behaviorProfile.emotionalProfile || {};

    return {
      communicationStyle: {
        preferredTone: behaviorProfile.communicationStyle?.preferredTone || 'supportive',
        responseLength: behaviorProfile.communicationStyle?.responseLength || 'moderate',
        complexity: behaviorProfile.communicationStyle?.complexity || 'intermediate',
        messageLength: {
          average: ubpmContext.messageLength?.average || 50,
          variation: ubpmContext.messageLength?.variation || 0.2,
          trend: ubpmContext.messageLength?.trend || 'stable'
        },
        questionFrequency: ubpmContext.questionFrequency || 0.3,
        emotionalExpression: ubpmContext.emotionalExpression || 0.6
      },
      personalityTraits: {
        openness: personalityData.openness || { score: 0.7, confidence: 0.6 },
        conscientiousness: personalityData.conscientiousness || { score: 0.6, confidence: 0.6 },
        extraversion: personalityData.extraversion || { score: 0.5, confidence: 0.6 },
        agreeableness: personalityData.agreeableness || { score: 0.8, confidence: 0.6 },
        neuroticism: personalityData.neuroticism || { score: 0.4, confidence: 0.6 },
        curiosity: personalityData.curiosity || { score: 0.8, confidence: 0.7 },
        empathy: personalityData.empathy || { score: 0.7, confidence: 0.6 },
        resilience: personalityData.resilience || { score: 0.6, confidence: 0.5 },
        creativity: personalityData.creativity || { score: 0.7, confidence: 0.6 },
        analyticalThinking: personalityData.analyticalThinking || { score: 0.6, confidence: 0.6 }
      },
      temporalPatterns: {
        mostActiveHours: temporalData.mostActiveHours || [9, 14, 20],
        mostActiveDays: temporalData.mostActiveDays || ['Monday', 'Wednesday', 'Friday'],
        sessionDuration: {
          average: temporalData.sessionDuration?.average || 15,
          distribution: temporalData.sessionDuration?.distribution || [5, 10, 15, 20, 30]
        },
        interactionFrequency: temporalData.interactionFrequency || 'medium',
        cyclicalPatterns: {
          weekly: temporalData.cyclicalPatterns?.weekly || [],
          seasonal: temporalData.cyclicalPatterns?.seasonal || [],
          lunar: temporalData.cyclicalPatterns?.lunar || []
        }
      },
      emotionalProfile: {
        baselineEmotion: emotionalData.baselineEmotion || 'content',
        emotionalRange: emotionalData.emotionalRange || 0.7,
        emotionalStability: emotionalData.emotionalStability || 0.6,
        intensityPattern: {
          average: emotionalData.intensityPattern?.average || 6.5,
          variance: emotionalData.intensityPattern?.variance || 2.1,
          trend: emotionalData.intensityPattern?.trend || 'stable'
        },
        triggers: emotionalData.triggers || [],
        recoveryPatterns: emotionalData.recoveryPatterns || ['mindfulness', 'social support']
      },
      socialPatterns: {
        connectionStyle: behaviorProfile.socialPreferences?.connectionStyle || 'collaborative',
        groupPreferences: behaviorProfile.socialPreferences?.groupPreferences || ['small groups'],
        supportGiving: behaviorProfile.socialPreferences?.supportGiving || 0.7,
        supportReceiving: behaviorProfile.socialPreferences?.supportReceiving || 0.6,
        compatibilityScores: []
      },
      growthMetrics: {
        currentLifecycleStage: behaviorProfile.lifecycleAnalysis?.currentStage || 'growth',
        stageConfidence: behaviorProfile.lifecycleAnalysis?.confidence || 0.7,
        shortTermGoals: behaviorProfile.goalsAndAspirations?.shortTerm || [],
        longTermGoals: behaviorProfile.goalsAndAspirations?.longTerm || [],
        progressMetrics: [],
        values: behaviorProfile.goalsAndAspirations?.values || ['growth', 'connection', 'creativity'],
        motivations: behaviorProfile.goalsAndAspirations?.motivations || ['self-improvement', 'helping others']
      },
      decisionPatterns: {
        decisionStyle: ubpmContext.decisionStyle || 'collaborative',
        adviceSeekingFrequency: ubpmContext.adviceSeekingFrequency || 0.4,
        problemSolvingApproach: ubpmContext.problemSolvingApproach || 'analytical',
        riskTolerance: ubpmContext.riskTolerance || 0.5
      },
      engagementMetrics: {
        dailyEngagementScore: emotionalSession.dailyEngagementScore || 7.5,
        conversationCount: emotionalSession.conversationCount || 3,
        toolUsageFrequency: {},
        featureAdoption: {},
        retentionScore: 0.8
      }
    };
  }

  async getCollectiveInsights(timeRange: string = '30d'): Promise<CollectiveInsights> {
    const [emotionData, insights, demographics] = await Promise.all([
      this.apiRequest<any>(`/collective-data/emotions?timeRange=${timeRange}&includeIntensity=true`),
      this.apiRequest<any>('/collective-data/insights'),
      this.apiRequest<any>('/collective-data/demographics?includeActivityPatterns=true')
    ]);

    return {
      emotionalTrends: {
        dominantEmotion: emotionData.dominantEmotion || 'content',
        averageIntensity: emotionData.averageIntensity || 6.2,
        distribution: emotionData.distribution || {},
        temporalPatterns: emotionData.temporalPatterns || []
      },
      behavioralComparisons: {
        personalityNorms: demographics.personalityNorms || {},
        communicationStyles: demographics.communicationStyles || {},
        engagementBenchmarks: demographics.engagementBenchmarks || {}
      },
      insights: insights.insights || []
    };
  }

  async getEmotionalAnalytics(): Promise<any> {
    let currentSession = null;
    let weeklyReport = null;
    let history = [];
    let stats = null;

    try {
      currentSession = await this.apiRequest<any>('/emotional-analytics/current-session?refresh=true');
    } catch (error) {
      console.log('Current session not available:', error);
    }

    try {
      weeklyReport = await this.apiRequest<any>('/emotional-analytics/weekly-report');
    } catch (error) {
      console.log('Weekly report not available:', error);
    }

    try {
      history = await this.apiRequest<any>('/emotion-history/?limit=100');
    } catch (error) {
      console.log('Emotion history not available:', error);
    }

    try {
      stats = await this.apiRequest<any>('/emotion-history/stats?days=30');
    } catch (error) {
      console.log('Emotion stats not available:', error);
    }

    return {
      currentSession,
      weeklyReport,
      history: history || [],
      stats
    };
  }

  async getUBPMContext(): Promise<UBPMContextData> {
    const context = await this.apiRequest<any>('/test-ubpm/context');
    
    return {
      behavioralContext: {
        patterns: context.patterns || [],
        significance: context.significance || {},
        insights: context.insights || []
      },
      personalityContext: {
        adaptedResponse: context.adaptedResponse || false,
        communicationStyle: context.communicationStyle || 'supportive',
        emotionalTone: context.emotionalTone || 'supportive',
        personalizedReason: context.personalizedReason || ''
      },
      temporalContext: {
        currentTimeContext: context.currentTimeContext || '',
        historicalPatterns: context.historicalPatterns || [],
        seasonalContext: context.seasonalContext || ''
      }
    };
  }

  async getCascadingRecommendations(focusArea: string = 'general', depth: number = 3): Promise<any> {
    return this.apiRequest<any>('/cascading-recommendations/generate', {
      method: 'POST',
      body: JSON.stringify({
        depth,
        focusArea,
        includeReasoningTree: true,
        contextWindow: 30
      })
    });
  }

  async triggerUBPMAnalysis(): Promise<any> {
    return this.apiRequest<any>('/test-ubpm/trigger', {
      method: 'POST',
      body: JSON.stringify({
        triggerType: 'analytics_dashboard'
      })
    });
  }

  async getAllAnalytics(): Promise<{
    personalGrowth: PersonalGrowthInsights | null;
    behavioralMetrics: BehavioralMetrics | null;
    collectiveInsights: CollectiveInsights | null;
    emotionalAnalytics: any | null;
    ubpmContext: UBPMContextData | null;
    recommendations: any | null;
  }> {
    let personalGrowth = null;
    let behavioralMetrics = null;
    let collectiveInsights = null;
    let emotionalAnalytics = null;
    let ubpmContext = null;
    let recommendations = null;

    try {
      personalGrowth = await this.getPersonalGrowthInsights('week');
    } catch (error) {
      console.log('Personal growth insights not available:', error);
    }

    try {
      behavioralMetrics = await this.getBehavioralMetrics();
    } catch (error) {
      console.log('Behavioral metrics not available:', error);
    }

    try {
      collectiveInsights = await this.getCollectiveInsights('30d');
    } catch (error) {
      console.log('Collective insights not available:', error);
    }

    try {
      emotionalAnalytics = await this.getEmotionalAnalytics();
    } catch (error) {
      console.log('Emotional analytics not available:', error);
    }

    try {
      ubpmContext = await this.getUBPMContext();
    } catch (error) {
      console.log('UBPM context not available:', error);
    }

    try {
      recommendations = await this.getCascadingRecommendations('growth', 3);
    } catch (error) {
      console.log('Recommendations not available:', error);
    }

    return {
      personalGrowth,
      behavioralMetrics,
      collectiveInsights,
      emotionalAnalytics,
      ubpmContext,
      recommendations
    };
  }
}

export default new ComprehensiveAnalyticsService();