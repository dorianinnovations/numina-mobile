/**
 * Shared types for Sandbox functionality
 */

export interface SandboxNode {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  connections: string[];
  personalHook?: string;
  confidence: number;
  category: string;
  isLocked: boolean;
  lockTimestamp?: string;
  isInsightNode?: boolean;
  patternType?: 'hidden_pattern' | 'behavioral_insight' | 'emotional_pattern' | 'temporal_connection';
  deepInsights?: {
    summary: string;
    keyPatterns: string[];
    personalizedContext: string;
    dataConnections: Array<{
      type: string;
      value: any;
      source: string;
      relevanceScore?: number;
      metadata?: any;
    }>;
    relevanceScore: number;
  };
  userDataContext?: {
    ubpmData?: any;
    behavioralMetrics?: any;
    emotionalProfile?: any;
    temporalPatterns?: any;
  };
  mediaAssets?: Array<{
    type: 'image' | 'link' | 'video' | 'document';
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
  }>;
}

export interface SandboxAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}