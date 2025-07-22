import CloudAuth from './cloudAuth';
import ApiService from './api';
import ComprehensiveAnalyticsService from './comprehensiveAnalytics';
import { BehavioralMetrics } from './comprehensiveAnalytics';

interface UserDataSnapshot {
  ubpmData: any;
  behavioralMetrics: BehavioralMetrics | null;
  emotionalProfile: any;
  temporalPatterns: any;
  conversationHistory: any[];
  toolUsageData: any;
  subscriptionData: any;
  personalInsights: any;
  metadata: {
    lastUpdated: string;
    dataCompleteness: number;
    sources: string[];
  };
}

interface NodeEnhancementData {
  relevantUserData: any;
  personalizedContext: string;
  dataConnections: Array<{
    type: string;
    value: any;
    source: string;
    relevanceScore: number;
  }>;
  suggestedConnections: string[];
}

class SandboxDataService {
  private userDataCache: UserDataSnapshot | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getComprehensiveUserData(): Promise<UserDataSnapshot> {
    // Check cache first
    if (this.userDataCache && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.userDataCache;
    }

    try {
      // Gather all user data in parallel
      const [
        analytics,
        profile,
        conversations,
        toolUsage,
        subscription,
        insights
      ] = await Promise.all([
        ComprehensiveAnalyticsService.getAllAnalytics(),
        ApiService.getUserProfile(),
        this.getConversationHistory(),
        this.getToolUsageData(),
        this.getSubscriptionData(),
        this.getPersonalInsights()
      ]);

      const userDataSnapshot: UserDataSnapshot = {
        ubpmData: analytics.ubpmContext || {},
        behavioralMetrics: analytics.behavioralMetrics,
        emotionalProfile: analytics.emotionalAnalytics || {},
        temporalPatterns: analytics.behavioralMetrics?.temporalPatterns || {},
        conversationHistory: conversations,
        toolUsageData: toolUsage,
        subscriptionData: subscription,
        personalInsights: insights,
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataCompleteness: this.calculateDataCompleteness(analytics, profile, conversations),
          sources: ['ubpm', 'behavioral', 'emotional', 'conversations', 'tools', 'subscription']
        }
      };

      // Cache the data
      this.userDataCache = userDataSnapshot;
      this.cacheTimestamp = Date.now();

      return userDataSnapshot;
    } catch (error) {
      console.error('Error gathering comprehensive user data:', error);
      return this.getFallbackUserData();
    }
  }

  private getFallbackUserData(): UserDataSnapshot {
    return {
      ubpmData: {},
      behavioralMetrics: null,
      emotionalProfile: {},
      temporalPatterns: {},
      conversationHistory: [],
      toolUsageData: {},
      subscriptionData: {},
      personalInsights: {},
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataCompleteness: 10,
        sources: ['fallback']
      }
    };
  }

  async enhanceNodeWithUserData(node: any, userData: UserDataSnapshot): Promise<NodeEnhancementData> {
    try {
      const relevantData = this.findRelevantUserData(node, userData);
      const personalizedContext = this.generatePersonalizedContext(node, relevantData, userData);
      const dataConnections = this.createDataConnections(node, userData);
      const suggestedConnections = await this.findSuggestedConnections(node, userData);

      return {
        relevantUserData: relevantData,
        personalizedContext,
        dataConnections,
        suggestedConnections
      };
    } catch (error) {
      console.error('Error enhancing node with user data:', error);
      return this.getFallbackEnhancement(node);
    }
  }

  private findRelevantUserData(node: any, userData: UserDataSnapshot): any {
    const relevantData: any = {};

    // Check behavioral patterns
    if (userData.behavioralMetrics?.personalityTraits) {
      const traits = userData.behavioralMetrics.personalityTraits;
      relevantData.personalityAlignment = this.calculatePersonalityAlignment(node, traits);
    }

    // Check emotional patterns
    if (userData.emotionalProfile) {
      relevantData.emotionalRelevance = this.calculateEmotionalRelevance(node, userData.emotionalProfile);
    }

    // Check temporal patterns
    if (userData.temporalPatterns?.mostActiveHours) {
      relevantData.temporalContext = {
        activeHours: userData.temporalPatterns.mostActiveHours,
        currentTimeRelevance: this.calculateTimeRelevance(node)
      };
    }

    // Check conversation history for related topics
    if (userData.conversationHistory?.length > 0) {
      relevantData.conversationalContext = this.findConversationalRelevance(node, userData.conversationHistory);
    }

    return relevantData;
  }

  private generatePersonalizedContext(node: any, relevantData: any, userData: UserDataSnapshot): string {
    const contexts = [];

    if (relevantData.personalityAlignment?.highestTrait) {
      contexts.push(`This aligns with your ${relevantData.personalityAlignment.highestTrait} nature`);
    }

    if (relevantData.emotionalRelevance?.dominantPattern) {
      contexts.push(`Resonates with your ${relevantData.emotionalRelevance.dominantPattern} patterns`);
    }

    if (relevantData.conversationalContext?.relatedTopics?.length > 0) {
      contexts.push(`Connected to your interests in ${relevantData.conversationalContext.relatedTopics.join(', ')}`);
    }

    if (contexts.length === 0) {
      return `This discovery connects to your unique journey of growth and self-understanding`;
    }

    return contexts.join(' • ');
  }

  private createDataConnections(node: any, userData: UserDataSnapshot): Array<{
    type: string;
    value: any;
    source: string;
    relevanceScore: number;
  }> {
    const connections = [];

    // UBPM connections
    if (userData.ubpmData?.personalityContext) {
      connections.push({
        type: 'personality',
        value: userData.ubpmData.personalityContext,
        source: 'UBPM',
        relevanceScore: 0.8
      });
    }

    // Behavioral connections
    if (userData.behavioralMetrics?.engagementMetrics) {
      connections.push({
        type: 'engagement',
        value: userData.behavioralMetrics.engagementMetrics,
        source: 'Behavioral Analytics',
        relevanceScore: 0.7
      });
    }

    // Emotional connections
    if (userData.emotionalProfile?.currentSession) {
      connections.push({
        type: 'emotional_state',
        value: userData.emotionalProfile.currentSession,
        source: 'Emotional Analytics',
        relevanceScore: 0.9
      });
    }

    return connections.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async findSuggestedConnections(node: any, userData: UserDataSnapshot): Promise<string[]> {
    // This would integrate with AI endpoints for intelligent connection suggestions
    // For now, return semantic suggestions based on user data patterns
    const suggestions = [];

    if (userData.behavioralMetrics?.personalityTraits?.curiosity?.score > 0.7) {
      suggestions.push('exploration', 'learning', 'discovery');
    }

    if (userData.behavioralMetrics?.personalityTraits?.creativity?.score > 0.7) {
      suggestions.push('innovation', 'imagination', 'artistic-expression');
    }

    return suggestions;
  }

  private calculatePersonalityAlignment(node: any, traits: any): any {
    const alignments: any = {};
    let highestScore = 0;
    let highestTrait = '';

    Object.entries(traits).forEach(([trait, data]: [string, any]) => {
      const score = data?.score || 0;
      alignments[trait] = score;
      
      if (score > highestScore) {
        highestScore = score;
        highestTrait = trait;
      }
    });

    return { alignments, highestTrait, highestScore };
  }

  private calculateEmotionalRelevance(node: any, emotionalProfile: any): any {
    return {
      dominantPattern: emotionalProfile.currentSession?.dominantEmotion || 'balanced',
      intensity: emotionalProfile.currentSession?.averageIntensity || 5,
      relevanceScore: 0.6
    };
  }

  private calculateTimeRelevance(node: any): number {
    const currentHour = new Date().getHours();
    // Simple relevance based on current time
    return Math.random() * 0.5 + 0.3; // 0.3 to 0.8
  }

  private findConversationalRelevance(node: any, conversations: any[]): any {
    // Simplified topic extraction - in production this would use NLP
    const relatedTopics = ['growth', 'understanding', 'discovery'];
    return {
      relatedTopics,
      conversationCount: conversations.length,
      relevanceScore: 0.5
    };
  }

  private async getConversationHistory(): Promise<any[]> {
    try {
      const response = await ApiService.apiRequest('/conversations/recent?limit=20');
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  private async getToolUsageData(): Promise<any> {
    try {
      const response = await ApiService.apiRequest('/tools/stats');
      return response.data || {};
    } catch (error) {
      return {};
    }
  }

  private async getSubscriptionData(): Promise<any> {
    try {
      const response = await ApiService.apiRequest('/subscription/status');
      return response.data || {};
    } catch (error) {
      return {};
    }
  }

  private async getPersonalInsights(): Promise<any> {
    try {
      const response = await ApiService.getPersonalGrowthSummary('week');
      return response.data || {};
    } catch (error) {
      return {};
    }
  }

  private calculateDataCompleteness(analytics: any, profile: any, conversations: any[]): number {
    let completeness = 0;
    const maxScore = 6;

    if (analytics.ubpmContext) completeness += 1;
    if (analytics.behavioralMetrics) completeness += 1;
    if (analytics.emotionalAnalytics) completeness += 1;
    if (profile?.data) completeness += 1;
    if (conversations.length > 0) completeness += 1;
    if (analytics.personalGrowth) completeness += 1;

    return Math.round((completeness / maxScore) * 100);
  }

  private getFallbackUserData(): UserDataSnapshot {
    return {
      ubpmData: {},
      behavioralMetrics: null,
      emotionalProfile: {},
      temporalPatterns: {},
      conversationHistory: [],
      toolUsageData: {},
      subscriptionData: {},
      personalInsights: {},
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataCompleteness: 10,
        sources: ['fallback']
      }
    };
  }

  private getFallbackEnhancement(node: any): NodeEnhancementData {
    return {
      relevantUserData: {},
      personalizedContext: 'This discovery is part of your unique journey',
      dataConnections: [],
      suggestedConnections: []
    };
  }

  // Method to generate abstract but presentable positions
  generateNodePosition(canvasWidth: number, canvasHeight: number, existingNodes: any[]): { x: number; y: number } {
    const margin = 60;
    const minDistance = 120;
    let attempts = 0;
    let position;

    do {
      position = {
        x: margin + Math.random() * (canvasWidth - 2 * margin),
        y: margin + Math.random() * (canvasHeight - 2 * margin)
      };
      attempts++;
    } while (
      attempts < 50 &&
      existingNodes.some(node => {
        const distance = Math.sqrt(
          Math.pow(position!.x - node.position.x, 2) +
          Math.pow(position!.y - node.position.y, 2)
        );
        return distance < minDistance;
      })
    );

    return position;
  }

  // Method to detect and create connections between nodes
  async detectNodeConnections(nodes: any[]): Promise<Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>> {
    const connections = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const relevance = await this.calculateNodeRelevance(nodes[i], nodes[j]);
        
        if (relevance > 0.6) { // Threshold for meaningful connections
          connections.push({
            from: nodes[i].id,
            to: nodes[j].id,
            relevance,
            connectionType: this.determineConnectionType(nodes[i], nodes[j])
          });
        }
      }
    }

    return connections.sort((a, b) => b.relevance - a.relevance);
  }

  private async calculateNodeRelevance(nodeA: any, nodeB: any): Promise<number> {
    // Simplified relevance calculation - in production this would use AI endpoints
    let relevance = 0;

    // Category similarity
    if (nodeA.category === nodeB.category) {
      relevance += 0.3;
    }

    // Content similarity (simplified)
    const commonWords = this.findCommonWords(nodeA.content, nodeB.content);
    relevance += Math.min(commonWords.length * 0.1, 0.4);

    // Personal hook relevance
    if (nodeA.personalHook && nodeB.personalHook) {
      relevance += 0.2;
    }

    // User data context similarity
    if (nodeA.userDataContext && nodeB.userDataContext) {
      relevance += 0.1;
    }

    return Math.min(relevance, 1.0);
  }

  private findCommonWords(textA: string, textB: string): string[] {
    const wordsA = textA.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const wordsB = textB.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    return wordsA.filter(word => wordsB.includes(word));
  }

  private determineConnectionType(nodeA: any, nodeB: any): string {
    if (nodeA.category === nodeB.category) {
      return 'categorical';
    }
    
    if (nodeA.personalHook || nodeB.personalHook) {
      return 'personal';
    }
    
    return 'contextual';
  }
}

export default new SandboxDataService();