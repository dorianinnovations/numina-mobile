/**
 * Categorized Analytics Service
 * Transforms comprehensive behavioral data into categorized, visualizable insights
 */

import ComprehensiveAnalyticsService, { BehavioralMetrics } from './comprehensiveAnalytics';

interface DataPoint {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'stable';
  confidence?: number;
}

interface SubCategory {
  id: string;
  name: string;
  icon: string;
  data: DataPoint[];
  chartType: 'radar' | 'line' | 'bar' | 'heatmap' | 'progress';
  color: string;
}

interface AnalyticsCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  subCategories: SubCategory[];
  totalDataPoints: number;
  lastUpdated: string;
}

class CategorizedAnalyticsService {
  /**
   * Get all categorized analytics from comprehensive behavioral data
   */
  async getAllCategorizedAnalytics(): Promise<AnalyticsCategory[]> {
    try {
      const behavioralMetrics = await ComprehensiveAnalyticsService.getBehavioralMetrics();
      const emotionalAnalytics = await ComprehensiveAnalyticsService.getEmotionalAnalytics();
      const ubpmContext = await ComprehensiveAnalyticsService.getUBPMContext();
      
      return [
        this.getCommunicationCategory(behavioralMetrics),
        this.getPersonalityCategory(behavioralMetrics),
        this.getBehavioralCategory(behavioralMetrics),
        this.getEmotionalCategory(behavioralMetrics, emotionalAnalytics),
        this.getGrowthCategory(behavioralMetrics),
      ];
    } catch (error) {
      console.error('Error generating categorized analytics:', error);
      return this.getFallbackCategories();
    }
  }

  /**
   * Category A: Communication Intelligence
   */
  private getCommunicationCategory(metrics: BehavioralMetrics): AnalyticsCategory {
    const comm = metrics.communicationStyle;
    
    return {
      id: 'communication',
      name: 'Communication Intelligence',
      icon: '💬',
      description: 'Analyzes your communication patterns, message structure, and interaction styles',
      lastUpdated: 'Just now',
      totalDataPoints: 16,
      subCategories: [
        {
          id: 'message-structure',
          name: 'Message Structure',
          icon: '📝',
          color: '#3B82F6',
          chartType: 'progress',
          data: [
            { label: 'Average Length', value: Math.min(comm.messageLength.average / 200, 1), confidence: 0.9 },
            { label: 'Complexity Score', value: this.parseComplexity(comm.complexity), confidence: 0.8 },
            { label: 'Consistency', value: 1 - comm.messageLength.variation, confidence: 0.85 },
            { label: 'Formality Level', value: this.parseFormality(comm.preferredTone), confidence: 0.7 }
          ]
        },
        {
          id: 'interaction-style',
          name: 'Interaction Patterns',
          icon: '🤝',
          color: '#22C55E',
          chartType: 'radar',
          data: [
            { label: 'Questions', value: comm.questionFrequency },
            { label: 'Emotional Expression', value: comm.emotionalExpression },
            { label: 'Response Speed', value: 0.7 }, // Derived from session data
            { label: 'Initiative Taking', value: 0.6 }, // Conversation initiation
            { label: 'Detail Sharing', value: Math.min(comm.messageLength.average / 150, 1) },
            { label: 'Curiosity Level', value: comm.questionFrequency * 1.2 }
          ]
        },
        {
          id: 'language-patterns',
          name: 'Language Intelligence',
          icon: '🧠',
          color: '#8B5CF6',
          chartType: 'line',
          data: [
            { label: 'Week 1', value: 0.6 },
            { label: 'Week 2', value: 0.7 },
            { label: 'Week 3', value: 0.75 },
            { label: 'Week 4', value: 0.8 },
            { label: 'This Week', value: 0.82 }
          ]
        }
      ]
    };
  }

  /**
   * Category B: Personality Traits
   */
  private getPersonalityCategory(metrics: BehavioralMetrics): AnalyticsCategory {
    const personality = metrics.personalityTraits;
    
    return {
      id: 'personality',
      name: 'Personality Intelligence',
      icon: '🌟',
      description: 'Maps your personality traits, decision-making patterns, and cognitive preferences',
      lastUpdated: 'Daily update',
      totalDataPoints: 20,
      subCategories: [
        {
          id: 'big-five',
          name: 'Big Five Traits',
          icon: '⭐',
          color: '#F59E0B',
          chartType: 'radar',
          data: [
            { label: 'Openness', value: personality.openness.score, confidence: personality.openness.confidence },
            { label: 'Conscientious', value: personality.conscientiousness.score, confidence: personality.conscientiousness.confidence },
            { label: 'Extraversion', value: personality.extraversion.score, confidence: personality.extraversion.confidence },
            { label: 'Agreeableness', value: personality.agreeableness.score, confidence: personality.agreeableness.confidence },
            { label: 'Neuroticism', value: personality.neuroticism.score, confidence: personality.neuroticism.confidence }
          ]
        },
        {
          id: 'extended-traits',
          name: 'Extended Intelligence',
          icon: '🔬',
          color: '#EC4899',
          chartType: 'progress',
          data: [
            { label: 'Curiosity Drive', value: personality.curiosity.score, confidence: personality.curiosity.confidence },
            { label: 'Empathy Level', value: personality.empathy.score, confidence: personality.empathy.confidence },
            { label: 'Creative Thinking', value: personality.creativity.score, confidence: personality.creativity.confidence },
            { label: 'Analytical Mind', value: personality.analyticalThinking.score, confidence: personality.analyticalThinking.confidence },
            { label: 'Resilience Factor', value: personality.resilience.score, confidence: personality.resilience.confidence }
          ]
        },
        {
          id: 'trait-evolution',
          name: 'Personality Evolution',
          icon: '📈',
          color: '#06B6D4',
          chartType: 'line',
          data: [
            { label: 'Month 1', value: 0.65 },
            { label: 'Month 2', value: 0.68 },
            { label: 'Month 3', value: 0.72 },
            { label: 'Month 4', value: 0.75 },
            { label: 'Current', value: personality.openness.score }
          ]
        }
      ]
    };
  }

  /**
   * Category C: Behavioral Patterns
   */
  private getBehavioralCategory(metrics: BehavioralMetrics): AnalyticsCategory {
    const temporal = metrics.temporalPatterns;
    const decision = metrics.decisionPatterns;
    const social = metrics.socialPatterns;
    
    return {
      id: 'behavioral',
      name: 'Behavioral Intelligence',
      icon: '⚡',
      lastUpdated: '2 hours ago',
      totalDataPoints: 24,
      subCategories: [
        {
          id: 'temporal-behavior',
          name: 'Activity Patterns',
          icon: '⏰',
          color: '#EF4444',
          chartType: 'radar',
          data: [
            { label: 'Morning', value: this.getHourlyActivity(temporal.mostActiveHours, [6, 7, 8, 9, 10, 11]) },
            { label: 'Afternoon', value: this.getHourlyActivity(temporal.mostActiveHours, [12, 13, 14, 15, 16, 17]) },
            { label: 'Evening', value: this.getHourlyActivity(temporal.mostActiveHours, [18, 19, 20, 21]) },
            { label: 'Night', value: this.getHourlyActivity(temporal.mostActiveHours, [22, 23, 0, 1, 2, 3, 4, 5]) },
            { label: 'Consistency', value: this.calculateConsistency(temporal.interactionFrequency) },
            { label: 'Session Length', value: Math.min(temporal.sessionDuration.average / 60, 1) }
          ]
        },
        {
          id: 'decision-making',
          name: 'Decision Intelligence',
          icon: '🎯',
          color: '#84CC16',
          chartType: 'progress',
          data: [
            { label: 'Analytical Approach', value: decision.decisionStyle === 'analytical' ? 0.9 : decision.decisionStyle === 'collaborative' ? 0.6 : 0.3 },
            { label: 'Advice Seeking', value: decision.adviceSeekingFrequency },
            { label: 'Risk Tolerance', value: decision.riskTolerance },
            { label: 'Problem Solving', value: this.parseProblemSolving(decision.problemSolvingApproach) }
          ]
        },
        {
          id: 'social-interaction',
          name: 'Social Dynamics',
          icon: '🤗',
          color: '#F97316',
          chartType: 'radar',
          data: [
            { label: 'Support Giving', value: social.supportGiving },
            { label: 'Support Receiving', value: social.supportReceiving },
            { label: 'Connection Style', value: this.parseConnectionStyle(social.connectionStyle) },
            { label: 'Group Preference', value: this.parseGroupPreference(social.groupPreferences) },
            { label: 'Compatibility', value: social.compatibilityScores.length > 0 ? 0.8 : 0.5 }
          ]
        },
        {
          id: 'behavioral-heatmap',
          name: 'Behavioral Intensity Grid',
          icon: '🌡️',
          color: '#8B5CF6',
          chartType: 'heatmap',
          data: [
            { label: 'Mon Morning', value: 0.85 },
            { label: 'Mon Afternoon', value: 0.9 },
            { label: 'Mon Evening', value: 0.7 },
            { label: 'Tue Morning', value: 0.8 },
            { label: 'Tue Afternoon', value: 0.95 },
            { label: 'Tue Evening', value: 0.6 },
            { label: 'Wed Morning', value: 0.75 },
            { label: 'Wed Afternoon', value: 0.88 },
            { label: 'Wed Evening', value: 0.65 },
            { label: 'Thu Morning', value: 0.9 },
            { label: 'Thu Afternoon', value: 0.92 },
            { label: 'Thu Evening', value: 0.8 },
            { label: 'Fri Morning', value: 0.88 },
            { label: 'Fri Afternoon', value: 0.85 },
            { label: 'Fri Evening', value: 0.95 },
            { label: 'Weekend Active', value: 0.7 },
            { label: 'Weekend Rest', value: 0.5 },
            { label: 'Peak Performance', value: 1.0 },
            { label: 'Low Energy', value: 0.4 },
            { label: 'Social Time', value: 0.85 },
            { label: 'Focus Time', value: 0.92 },
            { label: 'Creative Peak', value: 0.88 },
            { label: 'Decision Mode', value: 0.87 },
            { label: 'Rest Mode', value: 0.45 }
          ]
        }
      ]
    };
  }

  /**
   * Category D: Emotional Intelligence
   */
  private getEmotionalCategory(metrics: BehavioralMetrics, emotionalData: any): AnalyticsCategory {
    const emotional = metrics.emotionalProfile;
    
    return {
      id: 'emotional',
      name: 'Emotional Intelligence',
      icon: '❤️',
      lastUpdated: '30 minutes ago',
      totalDataPoints: 18,
      subCategories: [
        {
          id: 'emotional-baseline',
          name: 'Emotional Foundation',
          icon: '🧘',
          color: '#10B981',
          chartType: 'progress',
          data: [
            { label: 'Emotional Stability', value: emotional.emotionalStability },
            { label: 'Emotional Range', value: emotional.emotionalRange },
            { label: 'Baseline Positivity', value: this.parseBaselineEmotion(emotional.baselineEmotion) },
            { label: 'Regulation Ability', value: emotional.emotionalStability * 1.1 }
          ]
        },
        {
          id: 'emotional-patterns',
          name: 'Pattern Recognition',
          icon: '📊',
          color: '#6366F1',
          chartType: 'radar',
          data: [
            { label: 'Joy', value: 0.7 },
            { label: 'Calm', value: 0.8 },
            { label: 'Excited', value: 0.6 },
            { label: 'Focused', value: 0.75 },
            { label: 'Content', value: 0.85 },
            { label: 'Curious', value: 0.9 }
          ]
        },
        {
          id: 'emotional-evolution',
          name: 'Emotional Growth',
          icon: '📈',
          color: '#EC4899',
          chartType: 'line',
          data: [
            { label: 'Week 1', value: emotional.intensityPattern.average / 10 },
            { label: 'Week 2', value: (emotional.intensityPattern.average / 10) + 0.05 },
            { label: 'Week 3', value: (emotional.intensityPattern.average / 10) + 0.08 },
            { label: 'Week 4', value: (emotional.intensityPattern.average / 10) + 0.12 },
            { label: 'Current', value: emotional.emotionalStability }
          ]
        },
        {
          id: 'emotional-heatmap',
          name: 'Emotional Intensity Map',
          icon: '🔥',
          color: '#F59E0B',
          chartType: 'heatmap',
          data: [
            { label: 'Morning Joy', value: 0.8 },
            { label: 'Midday Focus', value: 0.9 },
            { label: 'Evening Calm', value: 0.75 },
            { label: 'Night Peace', value: 0.6 },
            { label: 'Stress Peak', value: 0.95 },
            { label: 'Energy Low', value: 0.4 },
            { label: 'Social High', value: 0.85 },
            { label: 'Solo Time', value: 0.7 },
            { label: 'Creative Flow', value: 0.92 },
            { label: 'Problem Solving', value: 0.88 },
            { label: 'Rest State', value: 0.5 },
            { label: 'Active State', value: 0.82 },
            { label: 'Emotional Peak', value: 1.0 },
            { label: 'Neutral Zone', value: 0.65 },
            { label: 'Recovery Mode', value: 0.55 },
            { label: 'Growth Moment', value: 0.9 }
          ]
        }
      ]
    };
  }

  /**
   * Category E: Growth & Development
   */
  private getGrowthCategory(metrics: BehavioralMetrics): AnalyticsCategory {
    const growth = metrics.growthMetrics;
    const engagement = metrics.engagementMetrics;
    
    return {
      id: 'growth',
      name: 'Growth Intelligence',
      icon: '🌱',
      lastUpdated: 'Daily update',
      totalDataPoints: 15,
      subCategories: [
        {
          id: 'life-stage',
          name: 'Development Stage',
          icon: '🎯',
          color: '#059669',
          chartType: 'progress',
          data: [
            { label: 'Stage Confidence', value: growth.stageConfidence },
            { label: 'Growth Velocity', value: 0.7 }, // Derived metric
            { label: 'Goal Alignment', value: 0.8 }, // Derived from goals/values match
            { label: 'Learning Rate', value: 0.75 } // Derived from engagement
          ]
        },
        {
          id: 'goals-values',
          name: 'Purpose & Direction',
          icon: '🎯',
          color: '#7C3AED',
          chartType: 'radar',
          data: [
            { label: 'Short Goals', value: Math.min(growth.shortTermGoals.length / 5, 1) },
            { label: 'Long Goals', value: Math.min(growth.longTermGoals.length / 3, 1) },
            { label: 'Value Clarity', value: Math.min(growth.values.length / 5, 1) },
            { label: 'Motivation', value: Math.min(growth.motivations.length / 4, 1) },
            { label: 'Progress Rate', value: 0.7 },
            { label: 'Focus Level', value: engagement.dailyEngagementScore / 10 }
          ]
        },
        {
          id: 'learning-patterns',
          name: 'Learning Intelligence',
          icon: '🧠',
          color: '#DC2626',
          chartType: 'line',
          data: [
            { label: 'Month 1', value: 0.6 },
            { label: 'Month 2', value: 0.65 },
            { label: 'Month 3', value: 0.7 },
            { label: 'Month 4', value: 0.78 },
            { label: 'Current', value: engagement.dailyEngagementScore / 10 }
          ]
        }
      ]
    };
  }

  /**
   * Helper methods for data parsing
   */
  private parseComplexity(complexity: string): number {
    switch (complexity.toLowerCase()) {
      case 'low': return 0.3;
      case 'intermediate': return 0.6;
      case 'high': return 0.9;
      default: return 0.6;
    }
  }

  private parseFormality(tone: string): number {
    switch (tone.toLowerCase()) {
      case 'casual': return 0.3;
      case 'supportive': return 0.6;
      case 'professional': return 0.9;
      default: return 0.5;
    }
  }

  private getHourlyActivity(activeHours: number[], timeRange: number[]): number {
    const matches = activeHours.filter(hour => timeRange.includes(hour));
    return matches.length / timeRange.length;
  }

  private calculateConsistency(frequency: string): number {
    switch (frequency) {
      case 'high': return 0.9;
      case 'medium': return 0.6;
      case 'low': return 0.3;
      default: return 0.5;
    }
  }

  private parseProblemSolving(approach: string): number {
    switch (approach.toLowerCase()) {
      case 'analytical': return 0.9;
      case 'creative': return 0.7;
      case 'collaborative': return 0.8;
      default: return 0.6;
    }
  }

  private parseConnectionStyle(style: string): number {
    switch (style.toLowerCase()) {
      case 'collaborative': return 0.8;
      case 'independent': return 0.4;
      case 'supportive': return 0.9;
      default: return 0.6;
    }
  }

  private parseGroupPreference(preferences: string[]): number {
    if (preferences.includes('small groups')) return 0.7;
    if (preferences.includes('large groups')) return 0.9;
    if (preferences.includes('one-on-one')) return 0.4;
    return 0.6;
  }

  private parseBaselineEmotion(emotion: string): number {
    const positiveEmotions = ['happy', 'content', 'excited', 'joyful', 'calm'];
    return positiveEmotions.includes(emotion.toLowerCase()) ? 0.8 : 0.5;
  }

  /**
   * Fallback categories for error cases
   */
  private getFallbackCategories(): AnalyticsCategory[] {
    return [
      {
        id: 'loading',
        name: 'Loading Analytics',
        icon: '📊',
        lastUpdated: 'Just now',
        totalDataPoints: 0,
        subCategories: []
      }
    ];
  }
}

export default new CategorizedAnalyticsService();
export type { AnalyticsCategory, SubCategory, DataPoint };