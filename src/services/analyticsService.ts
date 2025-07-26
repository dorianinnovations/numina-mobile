import ApiService from './api';

/**
 * Streamlined Analytics Service
 * Lightweight wrapper for server UBPM and analytics endpoints
 * Removes client-side duplication and leverages server AI capabilities
 */

export interface UBPMAnalysis {
  behavioralInsights: string[];
  recommendations: string[];
  vectorSpace: {
    curiosity: number;
    technical_depth: number;
    interaction_complexity: number;
    emotional_variance: number;
  };
  confidenceFactors: Array<{
    factor: string;
    score: number;
    description: string;
  }>;
  patterns: Array<{
    type: string;
    pattern: string;
    frequency: number;
    confidence: number;
  }>;
}

export interface LLMInsight {
  category: 'communication' | 'personality' | 'behavioral' | 'emotional' | 'growth';
  insight: string;
  confidence: number;
  evidence: string[];
  timestamp: string;
}

export interface PersonalGrowthSummary {
  insights: string[];
  growthAreas: string[];
  achievements: string[];
  nextSteps: string[];
  overallProgress: number;
}

export interface AnalyticsData {
  ubpm: UBPMAnalysis | null;
  llmInsights: LLMInsight[];
  growthSummary: PersonalGrowthSummary | null;
  lastUpdated: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  static getInstance(): AnalyticsService {
    if (!this.instance) {
      this.instance = new AnalyticsService();
    }
    return this.instance;
  }

  /**
   * Get comprehensive analytics data from server
   */
  async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      // Use Promise.allSettled to get data from multiple endpoints
      const [ubmpResult, llmResult, growthResult] = await Promise.allSettled([
        this.getUBPMAnalysis(),
        this.getLLMInsights(),
        this.getGrowthSummary()
      ]);

      return {
        ubpm: ubmpResult.status === 'fulfilled' ? ubmpResult.value : null,
        llmInsights: llmResult.status === 'fulfilled' ? llmResult.value : [],
        growthSummary: growthResult.status === 'fulfilled' ? growthResult.value : null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Analytics Service: Failed to get analytics data:', error);
      throw error;
    }
  }

  /**
   * Get UBPM analysis from server
   */
  async getUBPMAnalysis(): Promise<UBPMAnalysis> {
    const cacheKey = 'ubmp_analysis';
    const cached = this.getCachedData(cacheKey, 15 * 60 * 1000); // 15 min cache
    if (cached) return cached;

    try {
      // Use the UBPM analysis tool via server
      const response = await ApiService.executeToolRequest({
        tool: 'ubpm_analysis',
        parameters: {
          include_recommendations: true,
          detail_level: 'comprehensive'
        },
        credits: 1 // UBPM analysis costs 1 credit
      });

      if (response.success && response.result) {
        const ubmpData = this.parseUBPMResponse(response.result);
        this.setCachedData(cacheKey, ubmpData, 15 * 60 * 1000);
        return ubmpData;
      }

      throw new Error('UBPM analysis failed');
    } catch (error) {
      console.error('Analytics Service: UBPM analysis error:', error);
      // Return basic structure instead of throwing
      return this.getEmptyUBPMAnalysis();
    }
  }

  /**
   * Get LLM-powered insights from server
   */
  async getLLMInsights(category?: string): Promise<LLMInsight[]> {
    const cacheKey = `llm_insights_${category || 'all'}`;
    const cached = this.getCachedData(cacheKey, 10 * 60 * 1000); // 10 min cache
    if (cached) return cached;

    try {
      const endpoint = category 
        ? '/analytics/llm/insights'
        : '/analytics/llm';

      const payload = category 
        ? { category, days: 30 }
        : { days: 30, categories: ['communication', 'personality', 'behavioral', 'emotional', 'growth'] };

      const response = await ApiService.post(endpoint, payload);
      
      if (response.success) {
        const insights = this.formatLLMInsights(response.data || response.insights);
        this.setCachedData(cacheKey, insights, 10 * 60 * 1000);
        return insights;
      }

      return [];
    } catch (error) {
      console.error('Analytics Service: LLM insights error:', error);
      return [];
    }
  }

  /**
   * Get personal growth summary from server
   */
  async getGrowthSummary(): Promise<PersonalGrowthSummary> {
    const cacheKey = 'growth_summary';
    const cached = this.getCachedData(cacheKey, 20 * 60 * 1000); // 20 min cache
    if (cached) return cached;

    try {
      const response = await ApiService.get('/personal-insights/growth-summary');
      
      if (response.success && response.data) {
        const summary = this.formatGrowthSummary(response.data);
        this.setCachedData(cacheKey, summary, 20 * 60 * 1000);
        return summary;
      }

      return this.getEmptyGrowthSummary();
    } catch (error) {
      console.error('Analytics Service: Growth summary error:', error);
      return this.getEmptyGrowthSummary();
    }
  }


  /**
   * Get behavioral recommendations from server
   */
  async getRecommendations(): Promise<string[]> {
    try {
      const response = await ApiService.post('/analytics/llm/recommendations', {
        focus_areas: ['communication', 'growth', 'behavioral']
      });

      if (response.success && response.recommendations) {
        return Array.isArray(response.recommendations) 
          ? response.recommendations 
          : [response.recommendations];
      }

      return [];
    } catch (error) {
      console.error('Analytics Service: Recommendations error:', error);
      return [];
    }
  }


  // Private helper methods

  private parseUBPMResponse(result: any): UBPMAnalysis {
    try {
      // Parse the UBPM analysis result from server
      const lines = result.split('\n');
      const insights: string[] = [];
      const recommendations: string[] = [];
      let vectorSpace = { curiosity: 0, technical_depth: 0, interaction_complexity: 0, emotional_variance: 0 };
      let confidenceFactors: Array<{ factor: string; score: number; description: string }> = [];
      let patterns: Array<{ type: string; pattern: string; frequency: number; confidence: number }> = [];

      // Parse insights section
      let currentSection = '';
      for (const line of lines) {
        if (line.includes('## 🧠 UBPM Behavioral Analysis')) {
          currentSection = 'insights';
        } else if (line.includes('## 📊 Behavioral Vector Analysis')) {
          currentSection = 'vectors';
        } else if (line.includes('## 🎯 Personalized Recommendations')) {
          currentSection = 'recommendations';
        } else if (line.includes('## 📈 Confidence Factors')) {
          currentSection = 'confidence';
        } else if (line.trim() && line.startsWith('- ')) {
          const content = line.substring(2).trim();
          if (currentSection === 'insights') {
            insights.push(content);
          } else if (currentSection === 'recommendations') {
            recommendations.push(content);
          }
        } else if (line.includes(':') && currentSection === 'vectors') {
          const [key, value] = line.split(':');
          const numValue = parseFloat(value?.replace(/[^\d.]/g, '')) || 0;
          if (key.toLowerCase().includes('curiosity')) vectorSpace.curiosity = numValue;
          if (key.toLowerCase().includes('technical')) vectorSpace.technical_depth = numValue;
          if (key.toLowerCase().includes('interaction')) vectorSpace.interaction_complexity = numValue;
          if (key.toLowerCase().includes('emotional')) vectorSpace.emotional_variance = numValue;
        }
      }

      return {
        behavioralInsights: insights,
        recommendations,
        vectorSpace,
        confidenceFactors,
        patterns
      };
    } catch (error) {
      console.error('Failed to parse UBPM response:', error);
      return this.getEmptyUBPMAnalysis();
    }
  }

  private formatLLMInsights(data: any): LLMInsight[] {
    if (!data) return [];
    
    try {
      if (Array.isArray(data)) {
        return data.map(insight => ({
          category: insight.category || 'behavioral',
          insight: insight.insight || insight.text || '',
          confidence: insight.confidence || 0.5,
          evidence: insight.evidence || [],
          timestamp: insight.timestamp || new Date().toISOString()
        }));
      }

      if (typeof data === 'object' && data.insight) {
        return [{
          category: data.category || 'behavioral',
          insight: data.insight,
          confidence: data.confidence || 0.5,
          evidence: data.evidence || [],
          timestamp: data.timestamp || new Date().toISOString()
        }];
      }

      return [];
    } catch (error) {
      console.error('Failed to format LLM insights:', error);
      return [];
    }
  }

  private formatGrowthSummary(data: any): PersonalGrowthSummary {
    return {
      insights: data.insights || [],
      growthAreas: data.growthAreas || data.growth_areas || [],
      achievements: data.achievements || [],
      nextSteps: data.nextSteps || data.next_steps || [],
      overallProgress: data.overallProgress || data.overall_progress || 0
    };
  }

  private getEmptyUBPMAnalysis(): UBPMAnalysis {
    return {
      behavioralInsights: [],
      recommendations: [],
      vectorSpace: { curiosity: 0, technical_depth: 0, interaction_complexity: 0, emotional_variance: 0 },
      confidenceFactors: [],
      patterns: []
    };
  }

  private getEmptyGrowthSummary(): PersonalGrowthSummary {
    return {
      insights: [],
      growthAreas: [],
      achievements: [],
      nextSteps: [],
      overallProgress: 0
    };
  }

  // Cache management
  private getCachedData(key: string, ttl: number): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const analyticsService = AnalyticsService.getInstance();
export default analyticsService;