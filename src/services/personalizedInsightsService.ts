/**
 * Personalized Insights Service
 * Transforms raw behavioral data into meaningful, specific insights
 */

import ComprehensiveAnalyticsService, { BehavioralMetrics } from './comprehensiveAnalytics';

interface PersonalInsight {
  id: string;
  type: 'personality' | 'behavioral' | 'emotional' | 'communication' | 'growth';
  title: string;
  insight: string;
  confidence: number;
  evidence: string[];
  icon: string;
  timeframe: string;
}

class PersonalizedInsightsService {
  /**
   * Generate personalized insights from behavioral metrics
   */
  async generatePersonalizedInsights(): Promise<PersonalInsight[]> {
    try {
      const behavioralMetrics = await ComprehensiveAnalyticsService.getBehavioralMetrics();
      const insights: PersonalInsight[] = [];

      // Communication Style Insights
      insights.push(...this.generateCommunicationInsights(behavioralMetrics));
      
      // Personality Insights
      insights.push(...this.generatePersonalityInsights(behavioralMetrics));
      
      // Behavioral Pattern Insights
      insights.push(...this.generateBehavioralInsights(behavioralMetrics));
      
      // Emotional Intelligence Insights
      insights.push(...this.generateEmotionalInsights(behavioralMetrics));
      
      // Growth and Development Insights
      insights.push(...this.generateGrowthInsights(behavioralMetrics));

      // Sort by confidence and limit to top insights
      return insights
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8); // Show top 8 insights
        
    } catch (error) {
      console.error('Error generating personalized insights:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Generate communication style insights
   */
  private generateCommunicationInsights(metrics: BehavioralMetrics): PersonalInsight[] {
    const insights: PersonalInsight[] = [];
    const comm = metrics.communicationStyle;

    // Message length analysis
    if (comm.messageLength.average > 80) {
      insights.push({
        id: 'comm-detailed',
        type: 'communication',
        title: 'Detailed Communicator',
        insight: `You consistently write thorough messages averaging ${Math.round(comm.messageLength.average)} characters. This suggests you value clarity and prefer to provide complete context rather than brief exchanges.`,
        confidence: 0.85,
        evidence: [
          `Average message length: ${Math.round(comm.messageLength.average)} characters`,
          `Message variation: ${Math.round(comm.messageLength.variation * 100)}% consistency`,
          `Trend: ${comm.messageLength.trend} over time`
        ],
        icon: '📝',
        timeframe: 'Last 2 weeks'
      });
    }

    // Question frequency analysis
    if (comm.questionFrequency > 0.4) {
      insights.push({
        id: 'comm-curious',
        type: 'communication',
        title: 'Naturally Curious',
        insight: `${Math.round(comm.questionFrequency * 100)}% of your messages contain questions. You have a strong drive to understand and explore topics deeply, showing intellectual curiosity.`,
        confidence: 0.78,
        evidence: [
          `${Math.round(comm.questionFrequency * 100)}% of messages contain questions`,
          'Consistent inquiry patterns across conversations',
          'Questions range from practical to philosophical'
        ],
        icon: '❓',
        timeframe: 'Last 2 weeks'
      });
    }

    return insights;
  }

  /**
   * Generate personality insights
   */
  private generatePersonalityInsights(metrics: BehavioralMetrics): PersonalInsight[] {
    const insights: PersonalInsight[] = [];
    const personality = metrics.personalityTraits;

    // Openness insight
    if (personality.openness.score > 0.7 && personality.openness.confidence > 0.6) {
      insights.push({
        id: 'personality-openness',
        type: 'personality',
        title: 'Highly Open to Experience',
        insight: `Your openness score of ${Math.round(personality.openness.score * 100)}% indicates you're naturally drawn to new ideas, experiences, and creative thinking. You likely enjoy exploring unconventional solutions.`,
        confidence: personality.openness.confidence,
        evidence: [
          `Openness score: ${Math.round(personality.openness.score * 100)}%`,
          `Confidence level: ${Math.round(personality.openness.confidence * 100)}%`,
          'Consistent pattern across interactions',
          'Shows interest in diverse topics'
        ],
        icon: '🌟',
        timeframe: 'Based on all interactions'
      });
    }

    // Curiosity insight
    if (personality.curiosity.score > 0.75) {
      insights.push({
        id: 'personality-curiosity',
        type: 'personality',
        title: 'Intellectually Driven',
        insight: `Your curiosity score of ${Math.round(personality.curiosity.score * 100)}% shows you're motivated by learning and understanding. You likely find satisfaction in figuring out how things work.`,
        confidence: personality.curiosity.confidence,
        evidence: [
          `Curiosity score: ${Math.round(personality.curiosity.score * 100)}%`,
          'Asks follow-up questions frequently',
          'Explores topics in depth',
          'Seeks understanding over simple answers'
        ],
        icon: '🧠',
        timeframe: 'Based on all interactions'
      });
    }

    return insights;
  }

  /**
   * Generate behavioral pattern insights
   */
  private generateBehavioralInsights(metrics: BehavioralMetrics): PersonalInsight[] {
    const insights: PersonalInsight[] = [];
    const temporal = metrics.temporalPatterns;
    const decision = metrics.decisionPatterns;

    // Temporal pattern insight
    if (temporal.mostActiveHours.length > 0) {
      const peakHour = temporal.mostActiveHours[0];
      const timeOfDay = peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : 'evening';
      
      insights.push({
        id: 'behavioral-timing',
        type: 'behavioral',
        title: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Person`,
        insight: `You're most active around ${peakHour}:00, showing a consistent ${timeOfDay} energy pattern. This suggests your cognitive peak aligns with ${timeOfDay} hours.`,
        confidence: 0.72,
        evidence: [
          `Peak activity: ${peakHour}:00`,
          `Active days: ${temporal.mostActiveDays.join(', ')}`,
          `Average session: ${temporal.sessionDuration.average} minutes`,
          `Interaction frequency: ${temporal.interactionFrequency}`
        ],
        icon: timeOfDay === 'morning' ? '🌅' : timeOfDay === 'afternoon' ? '☀️' : '🌙',
        timeframe: 'Last month'
      });
    }

    // Decision-making insight
    if (decision.decisionStyle === 'analytical') {
      insights.push({
        id: 'behavioral-analytical',
        type: 'behavioral',
        title: 'Analytical Decision Maker',
        insight: `You prefer to gather information and analyze options before making decisions. This methodical approach likely serves you well in complex situations.`,
        confidence: 0.68,
        evidence: [
          'Asks clarifying questions before deciding',
          'Considers multiple perspectives',
          'Seeks detailed information',
          `Risk tolerance: ${Math.round(decision.riskTolerance * 100)}%`
        ],
        icon: '🎯',
        timeframe: 'Based on interaction patterns'
      });
    }

    return insights;
  }

  /**
   * Generate emotional intelligence insights
   */
  private generateEmotionalInsights(metrics: BehavioralMetrics): PersonalInsight[] {
    const insights: PersonalInsight[] = [];
    const emotional = metrics.emotionalProfile;

    if (emotional.emotionalStability > 0.6) {
      insights.push({
        id: 'emotional-stability',
        type: 'emotional',
        title: 'Emotionally Steady',
        insight: `Your emotional stability score of ${Math.round(emotional.emotionalStability * 100)}% indicates you maintain consistent emotional responses. Your baseline emotion is "${emotional.baselineEmotion}".`,
        confidence: 0.75,
        evidence: [
          `Emotional stability: ${Math.round(emotional.emotionalStability * 100)}%`,
          `Baseline emotion: ${emotional.baselineEmotion}`,
          `Emotional range: ${Math.round(emotional.emotionalRange * 100)}%`,
          `Recovery patterns: ${emotional.recoveryPatterns.join(', ')}`
        ],
        icon: '🧘',
        timeframe: 'Last month'
      });
    }

    return insights;
  }

  /**
   * Generate growth and development insights
   */
  private generateGrowthInsights(metrics: BehavioralMetrics): PersonalInsight[] {
    const insights: PersonalInsight[] = [];
    const growth = metrics.growthMetrics;

    if (growth.currentLifecycleStage === 'growth' && growth.stageConfidence > 0.6) {
      insights.push({
        id: 'growth-stage',
        type: 'growth',
        title: 'In Growth Phase',
        insight: `You're currently in a growth-oriented life stage, actively developing new skills and expanding your capabilities. Your core values center around ${growth.values.slice(0, 2).join(' and ')}.`,
        confidence: growth.stageConfidence,
        evidence: [
          `Life stage: ${growth.currentLifecycleStage}`,
          `Confidence: ${Math.round(growth.stageConfidence * 100)}%`,
          `Core values: ${growth.values.join(', ')}`,
          `Motivations: ${growth.motivations.join(', ')}`
        ],
        icon: '🌱',
        timeframe: 'Current phase'
      });
    }

    return insights;
  }

  /**
   * Fallback insights for new users or error cases
   */
  private getFallbackInsights(): PersonalInsight[] {
    return [
      {
        id: 'fallback-1',
        type: 'communication',
        title: 'Getting to Know You',
        insight: 'Keep chatting to unlock personalized insights about your communication style and personality patterns.',
        confidence: 0.5,
        evidence: ['Initial interaction analysis', 'Building behavioral baseline'],
        icon: '🔍',
        timeframe: 'Just getting started'
      }
    ];
  }

  /**
   * Get quick insights for immediate feedback
   */
  generateQuickInsight(messageLength: number, hasQuestion: boolean): PersonalInsight | null {
    if (messageLength > 100) {
      return {
        id: `quick-${Date.now()}`,
        type: 'communication',
        title: 'Detailed Communicator',
        insight: `Your ${messageLength}-character message shows you prefer thorough communication over brief exchanges.`,
        confidence: 0.7,
        evidence: [`Message length: ${messageLength} characters`, 'Detailed expression pattern'],
        icon: '📝',
        timeframe: 'Just now'
      };
    }
    
    if (hasQuestion) {
      return {
        id: `quick-${Date.now()}`,
        type: 'communication',
        title: 'Naturally Curious',
        insight: 'Your question shows intellectual curiosity and desire to understand topics deeply.',
        confidence: 0.65,
        evidence: ['Question-based interaction', 'Inquiry-focused communication'],
        icon: '❓',
        timeframe: 'Just now'
      };
    }

    return null;
  }
}

export default new PersonalizedInsightsService();
export type { PersonalInsight };