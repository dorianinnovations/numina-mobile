import AsyncStorage from '@react-native-async-storage/async-storage';
import CloudAuth from './cloudAuth';
import conversationStorage from './conversationStorage';

/**
 * Smart Data Retention Service
 * Implements intelligent, time-based data retention with user preferences
 */

export interface RetentionPolicy {
  type: 'time-based' | 'count-based' | 'smart';
  conversationData: {
    maxAge: number; // days
    maxCount: number;
    maxMessagesPerConversation: number;
  };
  analyticsCache: {
    maxAge: number; // hours
    refreshInterval: number; // hours
  };
  userPreferences?: {
    keepImportantData: boolean;
    autoArchive: boolean;
    compressionEnabled: boolean;
  };
}

export interface DataAgeReport {
  oldestConversationDate: Date | null;
  totalConversations: number;
  totalMessages: number;
  storageUsedMB: number;
  recommendedActions: string[];
}

class SmartDataRetentionService {
  private static instance: SmartDataRetentionService;
  private defaultPolicy: RetentionPolicy = {
    type: 'smart',
    conversationData: {
      maxAge: 180, // 6 months
      maxCount: 30,
      maxMessagesPerConversation: 100
    },
    analyticsCache: {
      maxAge: 24, // 1 day
      refreshInterval: 6 // 6 hours
    },
    userPreferences: {
      keepImportantData: true,
      autoArchive: true,
      compressionEnabled: true
    }
  };

  static getInstance(): SmartDataRetentionService {
    if (!this.instance) {
      this.instance = new SmartDataRetentionService();
    }
    return this.instance;
  }

  /**
   * Get user's retention policy
   */
  async getUserPolicy(): Promise<RetentionPolicy> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return this.defaultPolicy;

      const stored = await AsyncStorage.getItem(`retention_policy_${userId}`);
      return stored ? JSON.parse(stored) : this.defaultPolicy;
    } catch (error) {
      console.error('Failed to load retention policy:', error);
      return this.defaultPolicy;
    }
  }

  /**
   * Update user's retention policy
   */
  async updateUserPolicy(policy: Partial<RetentionPolicy>): Promise<void> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return;

      const current = await this.getUserPolicy();
      const updated = { ...current, ...policy };
      
      await AsyncStorage.setItem(`retention_policy_${userId}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update retention policy:', error);
    }
  }

  /**
   * Analyze data age and provide recommendations
   */
  async analyzeDataAge(): Promise<DataAgeReport> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) {
        return this.getEmptyReport();
      }

      // Get all data statistics
      const [conversations, storageInfo] = await Promise.all([
        this.getConversationStats(userId),
        this.getStorageUsage()
      ]);

      const recommendations: string[] = [];

      // Check if cleanup is needed
      if (conversations.totalMessages > 3000) {
        recommendations.push('Large conversation history detected. Enable auto-archive for better performance');
      }
      if (storageInfo.usedMB > 50) {
        recommendations.push('Storage usage is high. Enable compression to save space');
      }
      if (conversations.count > 40) {
        recommendations.push('Many conversations stored. Consider cleaning up old conversations');
      }

      // Check conversation age
      const convAgeDays = conversations.oldestDate 
        ? Math.floor((Date.now() - conversations.oldestDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      if (convAgeDays > 180) {
        recommendations.push('You have conversations older than 6 months. Consider reviewing retention settings');
      }

      return {
        oldestConversationDate: conversations.oldestDate,
        totalConversations: conversations.count,
        totalMessages: conversations.totalMessages,
        storageUsedMB: storageInfo.usedMB,
        recommendedActions: recommendations
      };
    } catch (error) {
      console.error('Failed to analyze data age:', error);
      return this.getEmptyReport();
    }
  }

  /**
   * Apply retention policy (clean up old data)
   */
  async applyRetentionPolicy(dryRun: boolean = false): Promise<{
    emotionsRemoved: number;
    conversationsRemoved: number;
    messagesRemoved: number;
    storageFreedMB: number;
  }> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return { emotionsRemoved: 0, conversationsRemoved: 0, messagesRemoved: 0, storageFreedMB: 0 };

      const policy = await this.getUserPolicy();
      const now = Date.now();
      
      let conversationsRemoved = 0;
      let messagesRemoved = 0;

      // Clean conversation data
      if (!dryRun) {
        const convResult = await this.cleanConversationData(userId, policy);
        conversationsRemoved = convResult.conversationsRemoved;
        messagesRemoved = convResult.messagesRemoved;
      } else {
        const convResult = await this.countConversationsToRemove(userId, policy);
        conversationsRemoved = convResult.conversationsRemoved;
        messagesRemoved = convResult.messagesRemoved;
      }

      // Calculate storage freed (rough estimate)
      const storageFreedMB = ((messagesRemoved * 0.2) / 1024).toFixed(2);

      return {
        emotionsRemoved: 0,
        conversationsRemoved,
        messagesRemoved,
        storageFreedMB: parseFloat(storageFreedMB)
      };
    } catch (error) {
      console.error('Failed to apply retention policy:', error);
      return { emotionsRemoved: 0, conversationsRemoved: 0, messagesRemoved: 0, storageFreedMB: 0 };
    }
  }

  /**
   * Archive old data (compress and store separately)
   */
  async archiveOldData(): Promise<{
    emotionsArchived: number;
    conversationsArchived: number;
    compressionRatio: number;
  }> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return { emotionsArchived: 0, conversationsArchived: 0, compressionRatio: 0 };

      const policy = await this.getUserPolicy();
      
      // Archive conversations older than maxAge
      const conversationsArchived = await this.archiveConversations(userId, policy);
      
      // Simple compression simulation (in real app, use actual compression)
      const compressionRatio = 0.3; // 70% size reduction

      return {
        emotionsArchived: 0,
        conversationsArchived,
        compressionRatio
      };
    } catch (error) {
      console.error('Failed to archive data:', error);
      return { emotionsArchived: 0, conversationsArchived: 0, compressionRatio: 0 };
    }
  }

  /**
   * Get preset retention policies
   */
  getPresetPolicies(): { [key: string]: RetentionPolicy } {
    return {
      minimal: {
        type: 'time-based',
        conversationData: { maxAge: 60, maxCount: 10, maxMessagesPerConversation: 50 },
        analyticsCache: { maxAge: 12, refreshInterval: 3 }
      },
      balanced: this.defaultPolicy,
      comprehensive: {
        type: 'count-based',
        conversationData: { maxAge: 365, maxCount: 100, maxMessagesPerConversation: 500 },
        analyticsCache: { maxAge: 72, refreshInterval: 12 }
      },
      performance: {
        type: 'smart',
        conversationData: { maxAge: 90, maxCount: 20, maxMessagesPerConversation: 75 },
        analyticsCache: { maxAge: 6, refreshInterval: 2 },
        userPreferences: {
          keepImportantData: true,
          autoArchive: true,
          compressionEnabled: true
        }
      }
    };
  }

  // Private helper methods
  private getEmptyReport(): DataAgeReport {
    return {
      oldestConversationDate: null,
      totalConversations: 0,
      totalMessages: 0,
      storageUsedMB: 0,
      recommendedActions: []
    };
  }


  private async getConversationStats(userId: string) {
    try {
      const conversations = await conversationStorage.loadConversations();
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
      const oldestDate = conversations.length > 0 
        ? new Date(Math.min(...conversations.map(c => new Date(c.createdAt).getTime())))
        : null;
      
      return { 
        count: conversations.length, 
        totalMessages,
        oldestDate 
      };
    } catch (error) {
      console.error('Failed to get conversation stats:', error);
      return { count: 0, totalMessages: 0, oldestDate: null };
    }
  }

  private async getStorageUsage() {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      let totalSize = 0;
      
      // Estimate storage size (rough calculation)
      for (const key of allKeys.slice(0, 10)) { // Sample first 10 keys to estimate
        try {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            totalSize += data.length;
          }
        } catch (error) {
          // Skip corrupted keys
        }
      }
      
      // Extrapolate total size
      const estimatedTotal = (totalSize / Math.min(10, allKeys.length)) * allKeys.length;
      const usedMB = estimatedTotal / (1024 * 1024); // Convert to MB
      
      return { usedMB: Math.max(usedMB, 0.1) }; // Minimum 0.1 MB
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { usedMB: 0.1 };
    }
  }


  private async cleanConversationData(userId: string, policy: RetentionPolicy) {
    try {
      const conversations = await conversationStorage.loadConversations();
      const maxAge = policy.conversationData.maxAge * 24 * 60 * 60 * 1000;
      const cutoffDate = Date.now() - maxAge;
      
      let conversationsRemoved = 0;
      let messagesRemoved = 0;
      
      const filteredConversations = conversations.filter((conv, index) => {
        const isOld = new Date(conv.updatedAt).getTime() < cutoffDate;
        const exceedsLimit = index >= policy.conversationData.maxCount;
        
        if (isOld || exceedsLimit) {
          conversationsRemoved++;
          messagesRemoved += conv.messages.length;
          return false;
        }
        
        // Also trim messages within kept conversations
        if (conv.messages.length > policy.conversationData.maxMessagesPerConversation) {
          const originalLength = conv.messages.length;
          conv.messages = conv.messages.slice(-policy.conversationData.maxMessagesPerConversation);
          messagesRemoved += originalLength - conv.messages.length;
        }
        
        return true;
      });
      
      await conversationStorage.saveConversations(filteredConversations);
      return { conversationsRemoved, messagesRemoved };
    } catch (error) {
      console.error('Failed to clean conversation data:', error);
      return { conversationsRemoved: 0, messagesRemoved: 0 };
    }
  }

  private async countConversationsToRemove(userId: string, policy: RetentionPolicy) {
    try {
      const conversations = await conversationStorage.loadConversations();
      const maxAge = policy.conversationData.maxAge * 24 * 60 * 60 * 1000;
      const cutoffDate = Date.now() - maxAge;
      
      let conversationsRemoved = 0;
      let messagesRemoved = 0;
      
      conversations.forEach((conv, index) => {
        const isOld = new Date(conv.updatedAt).getTime() < cutoffDate;
        const exceedsLimit = index >= policy.conversationData.maxCount;
        
        if (isOld || exceedsLimit) {
          conversationsRemoved++;
          messagesRemoved += conv.messages.length;
        } else if (conv.messages.length > policy.conversationData.maxMessagesPerConversation) {
          messagesRemoved += conv.messages.length - policy.conversationData.maxMessagesPerConversation;
        }
      });
      
      return { conversationsRemoved, messagesRemoved };
    } catch (error) {
      console.error('Failed to count conversations to remove:', error);
      return { conversationsRemoved: 0, messagesRemoved: 0 };
    }
  }


  private async archiveConversations(userId: string, policy: RetentionPolicy): Promise<number> {
    try {
      const conversations = await conversationStorage.loadConversations();
      const maxAge = policy.conversationData.maxAge * 24 * 60 * 60 * 1000;
      const cutoffDate = Date.now() - maxAge;
      
      const oldConversations = conversations.filter(conv => 
        new Date(conv.updatedAt).getTime() < cutoffDate
      );
      
      if (oldConversations.length > 0) {
        // Archive old conversations
        const archiveKey = `conversationArchive_${userId}_${Date.now()}`;
        await AsyncStorage.setItem(archiveKey, JSON.stringify(oldConversations));
      }
      
      return oldConversations.length;
    } catch (error) {
      console.error('Failed to archive conversations:', error);
      return 0;
    }
  }
}

export const smartDataRetention = SmartDataRetentionService.getInstance();