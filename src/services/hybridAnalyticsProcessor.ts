/**
 * Hybrid Analytics Processor
 * Combines fast indexing for backend optimization with readable summaries for AI comprehension
 * 
 * This solves the problem where indexed data is fast but unreadable by GPT-4o,
 * by maintaining both formats simultaneously.
 */

interface IndexedData {
  // Fast processing format (for backend analytics)
  indexed_data: number[];
  character_patterns: string[];
  optimization_metrics: {
    processing_time: number;
    data_points: number;
    compression_ratio: number;
  };
}

interface ReadableContext {
  // Human/AI readable format (for LLM context)
  user_profile: string;
  behavioral_summary: string;
  key_patterns: string[];
  interaction_style: string;
  emotional_tendencies: string;
}

interface HybridAnalyticsData {
  // Both formats maintained
  indexed: IndexedData;
  readable: ReadableContext;
  metadata: {
    data_freshness: number;
    confidence_score: number;
    last_updated: string;
  };
}

class HybridAnalyticsProcessor {
  private static instance: HybridAnalyticsProcessor;
  private indexCache: Map<string, IndexedData> = new Map();
  private contextCache: Map<string, ReadableContext> = new Map();

  static getInstance(): HybridAnalyticsProcessor {
    if (!this.instance) {
      this.instance = new HybridAnalyticsProcessor();
    }
    return this.instance;
  }

  /**
   * Process raw analytics data into hybrid format
   * Maintains both fast indexing AND readable context
   */
  async processAnalyticsData(rawData: any, userId: string): Promise<HybridAnalyticsData> {
    const startTime = performance.now();

    // Generate both formats simultaneously
    const [indexedData, readableContext] = await Promise.all([
      this.generateIndexedFormat(rawData),
      this.generateReadableContext(rawData)
    ]);

    const processingTime = performance.now() - startTime;

    return {
      indexed: indexedData,
      readable: readableContext,
      metadata: {
        data_freshness: this.calculateFreshness(rawData),
        confidence_score: this.calculateConfidence(rawData),
        last_updated: new Date().toISOString()
      }
    };
  }

  /**
   * Generate fast indexed format for backend processing
   * This maintains your speed optimizations
   */
  private async generateIndexedFormat(rawData: any): Promise<IndexedData> {
    const startTime = performance.now();

    // Convert data to indexed arrays (your existing optimization)
    const indexed_data = this.convertToIndexedArray(rawData);
    const character_patterns = this.extractCharacterPatterns(rawData);

    const processingTime = performance.now() - startTime;

    return {
      indexed_data,
      character_patterns,
      optimization_metrics: {
        processing_time: processingTime,
        data_points: indexed_data.length,
        compression_ratio: this.calculateCompressionRatio(rawData, indexed_data)
      }
    };
  }

  /**
   * Generate readable context for AI comprehension
   * This is what GPT-4o actually needs to understand the user
   */
  private async generateReadableContext(rawData: any): Promise<ReadableContext> {
    // Convert indexed/encoded data back to meaningful descriptions
    const behavioralInsights = this.extractBehavioralInsights(rawData);
    const communicationStyle = this.analyzeCommunicationStyle(rawData);
    const emotionalProfile = this.buildEmotionalProfile(rawData);

    return {
      user_profile: this.buildUserProfileSummary(rawData),
      behavioral_summary: behavioralInsights,
      key_patterns: this.identifyKeyPatterns(rawData),
      interaction_style: communicationStyle,
      emotional_tendencies: emotionalProfile
    };
  }

  /**
   * Convert raw data to indexed arrays (your existing speed optimization)
   */
  private convertToIndexedArray(rawData: any): number[] {
    if (!rawData || !rawData.dataPoints) return [];

    // Example: Convert behavioral scores to indexed format
    return rawData.dataPoints.map((point: any, index: number) => {
      // Your existing indexing logic here
      if (typeof point.value === 'number') {
        return Math.round(point.value * 1000); // Scale and round for indexing
      }
      
      // Convert strings to numeric indices
      if (typeof point.value === 'string') {
        return this.stringToIndex(point.value);
      }

      return index; // Fallback to position index
    });
  }

  /**
   * Extract character patterns for fast processing
   */
  private extractCharacterPatterns(rawData: any): string[] {
    if (!rawData || !rawData.patterns) return [];

    return rawData.patterns.map((pattern: any) => {
      // Convert patterns to character arrays for speed
      return pattern.type.charAt(0) + pattern.frequency.toString();
    });
  }

  /**
   * Build meaningful user profile summary for AI
   */
  private buildUserProfileSummary(rawData: any): string {
    const totalMessages = rawData.totalMessages || 0;
    const daysSinceFirst = rawData.daysSinceFirstChat || 0;
    const primaryStyle = rawData.communicationStyle || 'conversational';
    const toolUsage = rawData.toolUsagePatterns || {};
    const activityTiming = rawData.activityPatterns || {};

    // Convert indexed data back to readable insights
    let engagementLevel = 'moderate';
    if (totalMessages > 100) engagementLevel = 'high';
    if (totalMessages < 20) engagementLevel = 'low';

    let experienceLevel = 'developing';
    if (daysSinceFirst > 30) experienceLevel = 'experienced';
    if (daysSinceFirst > 90) experienceLevel = 'veteran';

    // Add insights from actual data collection methods
    const emotionalCues = this.extractEmotionalCuesFromChat(rawData);
    const behavioralContext = this.analyzeBehavioralPatterns(rawData);

    return `User is ${engagementLevel}ly engaged (${totalMessages} messages over ${daysSinceFirst} days), ${experienceLevel} with platform. Communication style: ${primaryStyle}. ${emotionalCues} ${behavioralContext}`;
  }

  /**
   * Extract behavioral insights in readable format
   */
  private extractBehavioralInsights(rawData: any): string {
    const patterns = rawData.behavioralPatterns || [];
    
    if (patterns.length === 0) {
      return "User shows developing behavioral patterns, still establishing interaction preferences.";
    }

    const topPattern = patterns[0];
    const consistency = patterns.length > 3 ? "consistent" : "emerging";
    
    return `User demonstrates ${consistency} patterns in ${topPattern.category}, with ${topPattern.frequency}% consistency. Primary behavior: ${topPattern.description}.`;
  }

  /**
   * Analyze communication style in human terms
   */
  private analyzeCommunicationStyle(rawData: any): string {
    const style = rawData.communicationMetrics || {};
    
    const traits = [];
    if (style.technical_depth > 0.7) traits.push("technically focused");
    if (style.curiosity > 0.8) traits.push("highly curious");
    if (style.interaction_complexity > 0.6) traits.push("prefers detailed responses");
    if (style.emotional_variance < 0.3) traits.push("emotionally consistent");

    if (traits.length === 0) {
      return "Developing communication style, balanced approach to interactions.";
    }

    return traits.join(", ") + ".";
  }

  /**
   * Build emotional profile in readable terms
   */
  private buildEmotionalProfile(rawData: any): string {
    const emotions = rawData.emotionalData || {};
    
    if (!emotions.dominantMood) {
      return "Emotional patterns still developing, shows varied emotional expression.";
    }

    const stability = emotions.variance < 0.3 ? "stable" : "dynamic";
    const intensity = emotions.averageIntensity > 0.7 ? "intense" : "moderate";

    return `Generally ${emotions.dominantMood} mood tendency, ${stability} emotional patterns with ${intensity} expression levels.`;
  }

  /**
   * Identify key behavioral patterns in readable format
   */
  private identifyKeyPatterns(rawData: any): string[] {
    const patterns = rawData.patterns || [];
    
    return patterns.slice(0, 3).map((pattern: any) => {
      // Convert pattern data to readable insights
      if (pattern.type === 'time_preference') {
        return `Most active during ${pattern.timeframe} hours`;
      }
      if (pattern.type === 'topic_affinity') {
        return `Shows strong interest in ${pattern.category} topics`;
      }
      if (pattern.type === 'response_length') {
        return `Prefers ${pattern.preference} response detail level`;
      }
      
      return `${pattern.type}: ${pattern.description}`;
    });
  }

  /**
   * Get optimized data for backend processing
   */
  getIndexedData(hybridData: HybridAnalyticsData): IndexedData {
    return hybridData.indexed;
  }

  /**
   * Get readable context for AI prompts
   */
  getReadableContext(hybridData: HybridAnalyticsData): ReadableContext {
    return hybridData.readable;
  }

  /**
   * Format readable context for GPT-4o prompt
   */
  formatForAIPrompt(hybridData: HybridAnalyticsData): string {
    const context = hybridData.readable;
    
    return `
USER CONTEXT: ${context.user_profile}

BEHAVIORAL SUMMARY: ${context.behavioral_summary}

INTERACTION STYLE: ${context.interaction_style}

EMOTIONAL PROFILE: ${context.emotional_tendencies}

KEY PATTERNS:
${context.key_patterns.map(pattern => `- ${pattern}`).join('\n')}

DATA CONFIDENCE: ${Math.round(hybridData.metadata.confidence_score * 100)}%
LAST UPDATED: ${hybridData.metadata.last_updated}
`.trim();
  }

  /**
   * Extract emotional cues from chat analysis (automatic detection)
   */
  private extractEmotionalCuesFromChat(rawData: any): string {
    const chatAnalysis = rawData.chatEmotionalData || {};
    const dominantEmotions = chatAnalysis.dominantEmotions || [];
    const emotionalVariance = chatAnalysis.variance || 0;
    
    if (dominantEmotions.length === 0) {
      return "Shows varied emotional expression through chat interactions.";
    }
    
    const topEmotion = dominantEmotions[0];
    const varianceLevel = emotionalVariance > 0.5 ? "dynamic" : "stable";
    
    return `Chat analysis reveals ${topEmotion} emotional tendencies with ${varianceLevel} expression patterns.`;
  }

  /**
   * Analyze behavioral patterns from actual usage data
   */
  private analyzeBehavioralPatterns(rawData: any): string {
    const toolUsage = rawData.toolUsagePatterns || {};
    const activityTiming = rawData.activityPatterns || {};
    const communicationMetrics = rawData.communicationMetrics || {};
    
    const insights = [];
    
    // Tool usage patterns
    if (toolUsage.mostUsedCategory) {
      insights.push(`Prefers ${toolUsage.mostUsedCategory} tools`);
    }
    
    // Activity timing patterns
    if (activityTiming.peakHours) {
      insights.push(`most active during ${activityTiming.peakHours}`);
    }
    
    // Communication patterns
    if (communicationMetrics.averageMessageLength > 100) {
      insights.push("tends toward detailed communication");
    } else if (communicationMetrics.averageMessageLength < 30) {
      insights.push("prefers concise interactions");
    }
    
    if (insights.length === 0) {
      return "Developing consistent behavioral patterns through platform usage.";
    }
    
    return insights.join(", ") + ".";
  }

  // Helper methods
  private stringToIndex(str: string): number {
    return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;
  }

  private calculateCompressionRatio(original: any, compressed: number[]): number {
    const originalSize = JSON.stringify(original).length;
    const compressedSize = compressed.length * 8; // Assuming 8 bytes per number
    return originalSize / compressedSize;
  }

  private calculateFreshness(rawData: any): number {
    const lastUpdate = rawData.lastUpdated ? new Date(rawData.lastUpdated).getTime() : Date.now();
    const age = Date.now() - lastUpdate;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Math.max(0, 1 - (age / maxAge));
  }

  private calculateConfidence(rawData: any): number {
    const dataPoints = rawData.dataPoints?.length || 0;
    const patterns = rawData.patterns?.length || 0;
    const totalMessages = rawData.totalMessages || 0;

    // Confidence increases with more data
    const dataConfidence = Math.min(1, dataPoints / 100);
    const patternConfidence = Math.min(1, patterns / 10);
    const messageConfidence = Math.min(1, totalMessages / 50);

    return (dataConfidence + patternConfidence + messageConfidence) / 3;
  }
}

export default HybridAnalyticsProcessor;
export type { HybridAnalyticsData, IndexedData, ReadableContext };