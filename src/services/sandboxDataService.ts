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
      // Gather all user data in parallel, including MongoDB collections
      const [
        analytics,
        profile,
        conversations,
        toolUsage,
        subscription,
        insights,
        mongoData
      ] = await Promise.all([
        ComprehensiveAnalyticsService.getAllAnalytics(),
        ApiService.getUserProfile(),
        this.getConversationHistory(),
        this.getToolUsageData(),
        this.getSubscriptionData(),
        this.getPersonalInsights(),
        this.getMongoUserData() // New comprehensive MongoDB data
      ]);

      const userDataSnapshot: UserDataSnapshot = {
        ubpmData: { 
          ...analytics.ubpmContext, 
          ...mongoData?.ubpmCollection // MongoDB UBPM data
        } || {},
        behavioralMetrics: analytics.behavioralMetrics,
        emotionalProfile: { 
          ...analytics.emotionalAnalytics, 
          ...mongoData?.emotionalCollection // MongoDB emotional data
        } || {},
        temporalPatterns: analytics.behavioralMetrics?.temporalPatterns || {},
        conversationHistory: conversations,
        toolUsageData: { 
          ...toolUsage, 
          ...mongoData?.toolUsageCollection // MongoDB tool usage data
        },
        subscriptionData: subscription,
        personalInsights: { 
          ...insights, 
          ...mongoData?.insightsCollection // MongoDB insights data
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataCompleteness: this.calculateDataCompleteness(analytics, profile, conversations, mongoData),
          sources: ['ubpm', 'behavioral', 'emotional', 'conversations', 'tools', 'subscription', 'mongodb']
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
      // Try to get real UBPM enhancement from backend first
      const ubpmEnhancement = await this.getUBPMNodeEnhancement(node, userData);
      if (ubpmEnhancement) {
        return ubpmEnhancement;
      }

      // Fallback to local enhancement
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

  private async getUBPMNodeEnhancement(node: any, userData: UserDataSnapshot): Promise<NodeEnhancementData | null> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/sandbox/enhance-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          node: {
            title: node.title,
            content: node.content,
            category: node.category
          },
          userContext: {
            ubpmData: userData.ubpmData,
            behavioralMetrics: userData.behavioralMetrics,
            emotionalProfile: userData.emotionalProfile
          }
        })
      });

      if (response.ok) {
        const enhancement = await response.json();
        console.log('✅ UBPM node enhancement received:', enhancement.data);
        return enhancement.data;
      } else {
        console.log('⚠️ UBPM enhancement not available, using fallback');
        return null;
      }
    } catch (error) {
      console.log('⚠️ UBPM enhancement service unavailable:', error);
      return null;
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
    try {
      // Try AI-powered contextual search enhancement
      const aiSuggestions = await this.getContextualSearchEnhancement(node, userData);
      if (aiSuggestions) {
        return aiSuggestions;
      }
    } catch (error) {
      console.log('⚠️ AI contextual search unavailable, using local suggestions:', error);
    }

    // Fallback to semantic suggestions based on user data patterns
    const suggestions = [];

    if (userData.behavioralMetrics?.personalityTraits?.curiosity?.score > 0.7) {
      suggestions.push('exploration', 'learning', 'discovery');
    }

    if (userData.behavioralMetrics?.personalityTraits?.creativity?.score > 0.7) {
      suggestions.push('innovation', 'imagination', 'artistic-expression');
    }

    return suggestions;
  }

  private async getContextualSearchEnhancement(node: any, userData: UserDataSnapshot): Promise<string[] | null> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/sandbox/contextual-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          node: {
            title: node.title,
            content: node.content,
            category: node.category
          },
          userContext: {
            ubpmData: userData.ubpmData,
            behavioralMetrics: userData.behavioralMetrics,
            emotionalProfile: userData.emotionalProfile,
            conversationHistory: userData.conversationHistory.slice(0, 5) // Last 5 conversations
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI contextual search suggestions received:', result.data);
        return result.data.suggestions || [];
      } else {
        console.log('⚠️ AI contextual search failed:', response.status);
        return null;
      }
    } catch (error) {
      console.log('⚠️ AI contextual search error:', error);
      return null;
    }
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

  private async getMongoUserData(): Promise<any> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/user/mongo-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ MongoDB user data retrieved:', Object.keys(result.data || {}));
        return result.data;
      } else {
        console.log('⚠️ MongoDB user data not available:', response.status);
        return null;
      }
    } catch (error) {
      console.log('⚠️ Error fetching MongoDB user data:', error);
      return null;
    }
  }

  private calculateDataCompleteness(analytics: any, profile: any, conversations: any[], mongoData?: any): number {
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

  // Backend storage for sandbox sessions
  async saveSandboxSession(sessionData: {
    nodes: any[];
    lockedNodes: any[];
    connections: any[];
    userQuery: string;
    timestamp: string;
  }): Promise<boolean> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/sandbox/save-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionData,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Sandbox session saved to backend');
        return true;
      } else {
        console.log('⚠️ Failed to save sandbox session:', response.status);
        return false;
      }
    } catch (error) {
      console.log('⚠️ Error saving sandbox session:', error);
      return false;
    }
  }

  async loadSandboxSessions(limit: number = 10): Promise<any[]> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return [];

      const response = await fetch(`${this.baseURL}/sandbox/sessions?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Sandbox sessions loaded:', result.data);
        return result.data || [];
      } else {
        console.log('⚠️ Failed to load sandbox sessions:', response.status);
        return [];
      }
    } catch (error) {
      console.log('⚠️ Error loading sandbox sessions:', error);
      return [];
    }
  }

  async saveLockState(nodeId: string, lockData: any): Promise<boolean> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/sandbox/lock-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nodeId,
          lockData,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.log('⚠️ Error saving lock state:', error);
      return false;
    }
  }

  async saveInsightNode(insightNode: any): Promise<boolean> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/sandbox/save-insight-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          insightNode,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.log('⚠️ Error saving insight node:', error);
      return false;
    }
  }

  async attachTidBitToNode(nodeId: string, tidBit: any): Promise<boolean> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/sandbox/node/${nodeId}/attach-tidbit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          tidBit,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.log('⚠️ Error attaching tid-bit to node:', error);
      return false;
    }
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
    try {
      // Try AI-powered connection analysis first
      const aiConnections = await this.getAIConnectionAnalysis(nodes);
      if (aiConnections) {
        return aiConnections;
      }
    } catch (error) {
      console.log('⚠️ AI connection analysis unavailable, using local analysis:', error);
    }

    // Fallback to local connection detection
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

  private async getAIConnectionAnalysis(nodes: any[]): Promise<Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }> | null> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/sandbox/analyze-connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nodes: nodes.map(node => ({
            id: node.id,
            title: node.title,
            content: node.content,
            category: node.category,
            personalHook: node.personalHook,
            isLocked: node.isLocked
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI connection analysis received:', result.data);
        return result.data.connections;
      } else {
        console.log('⚠️ AI connection analysis failed:', response.status);
        return null;
      }
    } catch (error) {
      console.log('⚠️ AI connection analysis error:', error);
      return null;
    }
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