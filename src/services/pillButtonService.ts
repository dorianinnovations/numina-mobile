import ApiService from './api';
import { logger } from '../utils/logger';

export interface PillAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  capabilities?: string[];
  temperature?: number;
  tools?: string[];
  requiresUBPM?: boolean;
  systemPrompt?: string;
}

export interface PillConfig {
  selectedActions: string[];
  processedActions: PillAction[];
  combinedConfig: {
    temperature: number;
    maxTokens: number;
    capabilities: string[];
    tools: string[];
    systemPrompts: string[];
    requiresUBPM: boolean;
    colors: string[];
    icons: string[];
  };
  synergy: {
    score: number;
    description: string;
  };
  timestamp: string;
}

export interface PillRecommendation {
  pill: string;
  reason: string;
  confidence: number;
}

export interface PillCombinationAnalysis {
  currentCombination: {
    pills: string[];
    synergy: {
      synergy: number;
      description: string;
      recommendedApproach: string;
      additionalPills: string[];
    };
    key: string;
  };
  recommendations: PillRecommendation[];
  metrics: {
    currentSynergyScore: number;
    combinationComplexity: 'low' | 'medium' | 'high';
    recommendedOptimization: 'available' | 'optimized';
    focusCoherence: 'high' | 'medium';
  };
  timestamp: string;
}

class PillButtonService {
  private baseUrl = '/sandbox';

  /**
   * Process selected pill actions and get configuration
   */
  async processPillActions(
    pillActions: string[], 
    query?: string, 
    context?: any
  ): Promise<{ success: boolean; data: PillConfig }> {
    try {
      logger.debug('Processing pill actions', { pillActions, query: query?.substring(0, 100) });

      const response = await ApiService.post(`${this.baseUrl}/pill-actions`, {
        pillActions,
        query,
        context
      });

      if (response.success) {
        logger.info('Pill actions processed successfully', { 
          actionsCount: response.data.processedActions.length,
          synergyScore: response.data.synergy.score
        });
      }

      return response;
    } catch (error) {
      logger.error('Error processing pill actions', { error });
      throw new Error('Failed to process pill actions');
    }
  }

  /**
   * Get pill combination analysis and recommendations
   */
  async analyzePillCombinations(
    currentPills: string[], 
    query?: string, 
    context?: any
  ): Promise<{ success: boolean; data: PillCombinationAnalysis }> {
    try {
      logger.debug('Analyzing pill combinations', { currentPills, query: query?.substring(0, 100) });

      const response = await ApiService.post(`${this.baseUrl}/pill-combinations`, {
        currentPills,
        query,
        context
      });

      if (response.success) {
        logger.info('Pill combinations analyzed', { 
          synergyScore: response.data.currentCombination.synergy.synergy,
          recommendationsCount: response.data.recommendations.length
        });
      }

      return response;
    } catch (error) {
      logger.error('Error analyzing pill combinations', { error });
      throw new Error('Failed to analyze pill combinations');
    }
  }

  /**
   * Generate nodes with pill configuration
   */
  async generateNodesWithPills(
    query: string,
    selectedActions: string[],
    pillConfig: PillConfig,
    options?: {
      lockedContext?: any[];
      useUBPM?: boolean;
      userData?: any;
    }
  ): Promise<any> {
    try {
      logger.debug('Generating nodes with pill configuration', { 
        query: query.substring(0, 100),
        selectedActions,
        synergyScore: pillConfig.synergy.score
      });

      const response = await ApiService.post(`${this.baseUrl}/generate-nodes`, {
        query,
        selectedActions,
        pillConfig,
        lockedContext: options?.lockedContext,
        useUBPM: options?.useUBPM || pillConfig.combinedConfig.requiresUBPM,
        userData: options?.userData
      });

      if (response.success) {
        logger.info('Nodes generated with pill configuration', { 
          nodeCount: response.data.nodes.length,
          pillActions: selectedActions
        });
      }

      return response;
    } catch (error) {
      logger.error('Error generating nodes with pills', { error });
      throw new Error('Failed to generate nodes with pill configuration');
    }
  }

  /**
   * Get smart pill recommendations based on query
   */
  async getPillRecommendations(
    query: string, 
    currentPills: string[] = []
  ): Promise<PillRecommendation[]> {
    try {
      // Analyze query locally for immediate recommendations
      const recommendations: PillRecommendation[] = [];
      const queryLower = query.toLowerCase();

      // Analysis patterns
      const analysisPatterns = /how|why|explain|analyze|understand|reason|problem|solve/i;
      const creativityPatterns = /creative|imagine|idea|innovative|brainstorm|design|invent/i;
      const researchPatterns = /find|search|research|look up|information|data|facts|learn about/i;
      const connectionPatterns = /connect|relate|relationship|between|link|compare|contrast/i;
      const explorationPatterns = /explore|discover|tell me about|what about|investigate/i;
      const personalizationPatterns = /my|personal|for me|tailored|customize|prefer/i;
      const writingPatterns = /write|compose|create|draft|document|essay|story|article/i;

      // Generate recommendations
      if (analysisPatterns.test(query) && !currentPills.includes('think')) {
        recommendations.push({
          pill: 'think',
          reason: 'Query requires analytical processing',
          confidence: 0.85
        });
      }

      if (creativityPatterns.test(query) && !currentPills.includes('imagine')) {
        recommendations.push({
          pill: 'imagine',
          reason: 'Query indicates creative ideation needed',
          confidence: 0.88
        });
      }

      if (researchPatterns.test(query) && !currentPills.includes('find')) {
        recommendations.push({
          pill: 'find',
          reason: 'Query requires information discovery',
          confidence: 0.90
        });
      }

      if (connectionPatterns.test(query) && !currentPills.includes('connect')) {
        recommendations.push({
          pill: 'connect',
          reason: 'Query involves relationship analysis',
          confidence: 0.87
        });
      }

      if (explorationPatterns.test(query) && !currentPills.includes('explore')) {
        recommendations.push({
          pill: 'explore',
          reason: 'Query suggests exploratory approach',
          confidence: 0.83
        });
      }

      if (personalizationPatterns.test(query) && !currentPills.includes('ubpm')) {
        recommendations.push({
          pill: 'ubpm',
          reason: 'Query benefits from personalization',
          confidence: 0.86
        });
      }

      if (writingPatterns.test(query) && !currentPills.includes('write')) {
        recommendations.push({
          pill: 'write',
          reason: 'Query involves content creation',
          confidence: 0.84
        });
      }

      // Sort by confidence and return top 3
      const sortedRecommendations = recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      logger.debug('Generated pill recommendations', { 
        query: query.substring(0, 50),
        recommendationsCount: sortedRecommendations.length,
        recommendations: sortedRecommendations.map(r => r.pill)
      });

      return sortedRecommendations;
    } catch (error) {
      logger.error('Error getting pill recommendations', { error });
      return [];
    }
  }

  /**
   * Calculate synergy score for pill combination
   */
  calculateSynergyScore(pillActions: string[]): { score: number; description: string } {
    const synergyCombinations: { [key: string]: { score: number; description: string } } = {
      'find+think': { score: 0.95, description: 'Research with analytical depth' },
      'write+imagine': { score: 0.93, description: 'Creative expression with ideation' },
      'connect+explore': { score: 0.90, description: 'Relationship discovery through exploration' },
      'think+connect': { score: 0.88, description: 'Analytical pattern recognition' },
      'ubpm+write': { score: 0.92, description: 'Personalized creative expression' },
      'find+explore': { score: 0.87, description: 'Comprehensive information discovery' },
      'imagine+connect': { score: 0.85, description: 'Creative ideation with relationship mapping' },
      'think+explore': { score: 0.82, description: 'Analytical exploration' },
      'write+think': { score: 0.86, description: 'Structured creative expression' },
      'find+ubpm': { score: 0.84, description: 'Personalized research' }
    };

    const key = pillActions.sort().join('+');
    return synergyCombinations[key] || { 
      score: 0.75, 
      description: 'Custom combination' 
    };
  }

  /**
   * Get effective temperature based on pill combination
   */
  getEffectiveTemperature(pillActions: string[]): number {
    const temperatureMap: { [key: string]: number } = {
      write: 0.8,
      think: 0.3,
      find: 0.5,
      imagine: 0.9,
      connect: 0.6,
      explore: 0.7,
      ubpm: 0.4
    };

    if (pillActions.length === 0) return 0.6;

    const totalTemp = pillActions.reduce((sum, action) => {
      return sum + (temperatureMap[action] || 0.6);
    }, 0);

    return totalTemp / pillActions.length;
  }

  /**
   * Get pill color combination for UI
   */
  getPillColorCombination(pillActions: string[]): string[] {
    const colorMap: { [key: string]: string } = {
      write: '#3B82F6',
      think: '#8B5CF6',
      find: '#10B981',
      imagine: '#F59E0B',
      connect: '#EC4899',
      explore: '#06B6D4',
      ubpm: '#8B5CF6'
    };

    return pillActions.map(action => colorMap[action] || '#6B7280');
  }

  /**
   * Validate pill combination
   */
  validatePillCombination(pillActions: string[]): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for conflicting temperatures
    const temps = pillActions.map(action => {
      const tempMap: { [key: string]: number } = {
        write: 0.8, think: 0.3, find: 0.5, imagine: 0.9,
        connect: 0.6, explore: 0.7, ubpm: 0.4
      };
      return tempMap[action] || 0.6;
    });

    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);

    if (maxTemp - minTemp > 0.5) {
      warnings.push('Selected pills have conflicting approaches (creative vs analytical)');
      suggestions.push('Consider balancing creative and analytical pills');
    }

    // Check for redundancy
    if (pillActions.includes('find') && pillActions.includes('explore')) {
      warnings.push('Find and Explore pills have overlapping functions');
      suggestions.push('Choose either Find for specific research or Explore for broad discovery');
    }

    // Check for too many pills
    if (pillActions.length > 4) {
      warnings.push('Too many pills selected may dilute focus');
      suggestions.push('Consider limiting to 3-4 core capabilities');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }
}

// Export singleton instance
export const pillButtonService = new PillButtonService();
export default pillButtonService;