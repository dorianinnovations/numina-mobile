/**
 * AI-Powered Insight Generation Engine
 * Generates dynamic, personalized insights using OpenRouter API
 * Now uses hybrid analytics processing for both speed AND AI comprehension
 */

import HybridAnalyticsProcessor, { HybridAnalyticsData } from './hybridAnalyticsProcessor';

// Analytics category type definition
interface AnalyticsCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface InsightCooldown {
  categoryId: string;
  lastGenerated: number;
  cooldownPeriod: number;
  dataFingerprint: string;
}

interface AIInsightRequest {
  category: AnalyticsCategory;
  userContext: {
    totalMessages: number;
    daysSinceFirstChat: number;
    mostActiveTimeOfDay: string;
    communicationStyle: string;
  };
  previousInsights?: string[];
}

interface AIInsightResponse {
  insight: string;
  confidence: number;
  evidence: string[];
  category: string;
  timestamp: number;
}

class AIInsightEngine {
  private cooldowns: Map<string, InsightCooldown> = new Map();
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1/chat/completions';
  private hybridProcessor: HybridAnalyticsProcessor;

  constructor() {
    // In production, this would come from secure environment variables
    this.apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
    this.hybridProcessor = HybridAnalyticsProcessor.getInstance();
  }

  /**
   * Global cooldown periods for different categories (in milliseconds)
   */
  private readonly COOLDOWN_PERIODS = {
    communication: 6 * 60 * 60 * 1000,    // 6 hours
    personality: 24 * 60 * 60 * 1000,     // 24 hours
    behavioral: 12 * 60 * 60 * 1000,      // 12 hours
    emotional: 3 * 60 * 60 * 1000,        // 3 hours
    growth: 48 * 60 * 60 * 1000,          // 48 hours
  };

  /**
   * Check if insight can be regenerated based on cooldown and data changes
   */
  private canGenerateInsight(categoryId: string, currentData: any): boolean {
    const cooldown = this.cooldowns.get(categoryId);
    
    if (!cooldown) {
      return true; // First time generation
    }

    const timeElapsed = Date.now() - cooldown.lastGenerated;
    const cooldownExpired = timeElapsed > cooldown.cooldownPeriod;
    
    // Check if underlying data has changed significantly
    const currentFingerprint = this.createDataFingerprint(currentData);
    const dataChanged = currentFingerprint !== cooldown.dataFingerprint;

    return cooldownExpired || dataChanged;
  }

  /**
   * Create a fingerprint of the data to detect significant changes
   */
  private createDataFingerprint(data: any): string {
    // Create a simple hash of key data points
    const keyData = {
      totalDataPoints: data.totalDataPoints,
      subCategoryCount: data.subCategories?.length || 0,
      // Include some key metric values for change detection
      sampleValues: data.subCategories?.slice(0, 2).map((sub: any) => 
        sub.data?.slice(0, 3).map((d: any) => Math.round(d.value * 100))
      ) || []
    };
    
    return JSON.stringify(keyData);
  }

  /**
   * Generate AI insight for a specific category
   */
  async generateCategoryInsight(request: AIInsightRequest): Promise<AIInsightResponse> {
    const { category, userContext } = request;
    
    // Check cooldown
    if (!this.canGenerateInsight(category.id, category)) {
      return this.getCooldownResponse(category.id);
    }

    try {
      // Craft precise prompt for the category using hybrid analytics
      const prompt = await this.craftCategoryPrompt(category, userContext);
      
      // Call OpenRouter API
      const aiResponse = await this.callAIAPI(prompt);
      
      // Parse and validate response
      const insight = this.parseAIResponse(aiResponse, category);
      
      // Update cooldown
      this.updateCooldown(category.id, category);
      
      return insight;
      
    } catch (error) {
      console.error('Error generating AI insight:', error);
      return this.getFallbackInsight(category);
    }
  }

  /**
   * Craft precise, category-specific prompts using hybrid analytics
   */
  private async craftCategoryPrompt(category: AnalyticsCategory, userContext: any): Promise<string> {
    // Process the category data using hybrid analytics
    const hybridData = await this.hybridProcessor.processAnalyticsData(category, userContext.userId || 'unknown');
    
    // Get readable context for AI instead of raw JSON
    const readableContext = this.hybridProcessor.formatForAIPrompt(hybridData);
    
    const baseContext = `User has sent ${userContext.totalMessages} messages over ${userContext.daysSinceFirstChat} days. Most active ${userContext.mostActiveTimeOfDay}. Communication style: ${userContext.communicationStyle}.`;
    
    switch (category.id) {
      case 'communication':
        return `${baseContext}

${readableContext}

Write a 2-sentence insight about this person's communication intelligence. Focus on:
1. Their unique communication signature (what makes them distinctive)
2. How others likely perceive them in conversations

Be specific, personal, and revealing. Use "you" and present tense. No hedging words like "might" or "seems".`;

      case 'personality':
        return `${baseContext}

${readableContext}

Write a 2-sentence insight about this person's core personality. Focus on:
1. Their dominant personality trait and what drives them
2. How this shows up in their daily behavior

Be confident and specific. Reveal something meaningful about who they are as a person.`;

      case 'behavioral':
        return `${baseContext}

${readableContext}

Write a 2-sentence insight about this person's behavioral patterns. Focus on:
1. Their unique behavioral signature (timing, decision-making, social style)
2. What this reveals about their psychological wiring

Be observant and specific about their patterns.`;

      case 'emotional':
        return `${baseContext}

${readableContext}

Write a 2-sentence insight about this person's emotional intelligence. Focus on:
1. Their emotional regulation style and stability
2. How they process and express emotions

Be supportive but honest about their emotional patterns.`;

      case 'growth':
        return `${baseContext}

${readableContext}

Write a 2-sentence insight about this person's growth trajectory. Focus on:
1. Their current development phase and learning style
2. What this suggests about their future potential

Be encouraging and forward-looking.`;

      default:
        return `Analyze this data: ${JSON.stringify(category)} and provide a meaningful 2-sentence insight about the user.`;
    }
  }

  /**
   * Call OpenRouter API with retry logic
   */
  private async callAIAPI(prompt: string): Promise<string> {
    const requestBody = {
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a behavioral psychologist providing personalized insights. Be specific, confident, and revealing. Focus on unique patterns that help people understand themselves better."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://numina.ai',
        'X-Title': 'Numina Personal Analytics'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse and validate AI response
   */
  private parseAIResponse(aiResponse: string, category: AnalyticsCategory): AIInsightResponse {
    // Clean up the response
    const cleanedResponse = aiResponse.trim().replace(/^["']|["']$/g, '');
    
    return {
      insight: cleanedResponse,
      confidence: 0.85, // High confidence for AI-generated insights
      evidence: this.extractEvidence(category),
      category: category.name,
      timestamp: Date.now()
    };
  }

  /**
   * Extract evidence from category data
   */
  private extractEvidence(category: AnalyticsCategory): string[] {
    const evidence: string[] = [];
    
    category.subCategories.forEach(subCat => {
      const topMetrics = subCat.data
        .filter(d => d.value > 0.7) // High-value metrics
        .slice(0, 2); // Top 2 per subcategory
        
      topMetrics.forEach(metric => {
        evidence.push(`${metric.label}: ${Math.round(metric.value * 100)}%`);
      });
    });
    
    return evidence.slice(0, 4); // Max 4 evidence points
  }

  /**
   * Update cooldown tracking
   */
  private updateCooldown(categoryId: string, category: AnalyticsCategory): void {
    const cooldownPeriod = this.COOLDOWN_PERIODS[categoryId as keyof typeof this.COOLDOWN_PERIODS] || 
                          this.COOLDOWN_PERIODS.communication;
    
    this.cooldowns.set(categoryId, {
      categoryId,
      lastGenerated: Date.now(),
      cooldownPeriod,
      dataFingerprint: this.createDataFingerprint(category)
    });
  }

  /**
   * Get cooldown response when insight can't be regenerated
   */
  private getCooldownResponse(categoryId: string): AIInsightResponse {
    const cooldown = this.cooldowns.get(categoryId);
    const timeUntilNextUpdate = cooldown ? 
      Math.ceil((cooldown.cooldownPeriod - (Date.now() - cooldown.lastGenerated)) / (60 * 60 * 1000)) : 0;

    const messages = [
      `Your ${categoryId} patterns remain consistent since the last analysis.`,
      `No significant changes detected in your ${categoryId} data.`,
      `Your ${categoryId} profile is stable - consistent with previous insights.`,
    ];

    return {
      insight: messages[Math.floor(Math.random() * messages.length)] + 
               (timeUntilNextUpdate > 0 ? ` Next update available in ${timeUntilNextUpdate} hours.` : ''),
      confidence: 0.9,
      evidence: ['Pattern stability confirmed', 'Consistent behavioral signature'],
      category: categoryId,
      timestamp: Date.now()
    };
  }

  /**
   * Fallback insight for errors
   */
  private getFallbackInsight(category: AnalyticsCategory): AIInsightResponse {
    const fallbacks = {
      communication: "Your communication style shows thoughtful engagement with detailed expression patterns.",
      personality: "Your personality profile indicates strong intellectual curiosity and openness to experience.",
      behavioral: "Your behavioral patterns show consistent engagement with structured interaction preferences.",
      emotional: "Your emotional intelligence demonstrates stability with healthy expression patterns.",
      growth: "Your growth trajectory shows active development with strong learning engagement."
    };

    return {
      insight: fallbacks[category.id as keyof typeof fallbacks] || 
               "Your data shows positive engagement patterns and healthy interaction styles.",
      confidence: 0.6,
      evidence: [`${category.totalDataPoints} data points analyzed`, 'Pattern consistency detected'],
      category: category.name,
      timestamp: Date.now()
    };
  }

  /**
   * Get remaining cooldown time for a category
   */
  getRemainingCooldown(categoryId: string): number {
    const cooldown = this.cooldowns.get(categoryId);
    if (!cooldown) return 0;
    
    const timeElapsed = Date.now() - cooldown.lastGenerated;
    const remaining = cooldown.cooldownPeriod - timeElapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * Clear all cooldowns (for testing/admin use)
   */
  clearCooldowns(): void {
    this.cooldowns.clear();
  }
}

export default new AIInsightEngine();
export type { AIInsightRequest, AIInsightResponse };