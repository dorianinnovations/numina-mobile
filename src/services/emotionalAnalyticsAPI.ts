import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

/**
 * Emotional Analytics API for React Native
 * Matches web app implementation exactly with offline-first approach
 * Handles user isolation, automatic sync, and LLM-powered analytics
 */

export interface EmotionEntry {
  id: string;
  emotion: string;
  intensity: number;
  description?: string;
  timestamp: string;
  userId: string;
  mood?: string;
  tags?: string[];
  context?: {
    location?: string;
    activity?: string;
    people?: string[];
  };
}

export interface EmotionMetadata {
  totalEntries: number;
  lastSyncTime: string | null;
  pendingSync: number;
  userId: string;
}

class EmotionalAnalyticsAPI {
  // Storage keys with user isolation - exactly like web app
  private static getStorageKeys(userId?: string) {
    const currentUserId = userId || 'guest';
    
    return {
      EMOTIONS: `numina_emotions_v2_${currentUserId}`,
      METADATA: `numina_emotion_metadata_v2_${currentUserId}`,
      ANALYTICS: `numina_analytics_cache_${currentUserId}`,
      SYNC_QUEUE: `numina_sync_queue_${currentUserId}`,
    };
  }

  // Submit emotional entry - offline-first approach like web app
  static async submitEmotionalEntry(emotionData: Omit<EmotionEntry, 'id' | 'timestamp' | 'userId'>): Promise<{
    success: boolean;
    entry: EmotionEntry;
    onlineSync: boolean;
    error?: string;
  }> {
    try {
      // Get current user ID
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : 'guest';
      
      // Create complete emotion entry
      const emotionEntry: EmotionEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userId,
        ...emotionData,
      };

      // ALWAYS store locally first (works offline/online) - exactly like web app
      const localResult = await this.storeEmotionLocally(emotionEntry);
      
      if (!localResult.success) {
        return {
          success: false,
          entry: emotionEntry,
          onlineSync: false,
          error: 'Failed to store emotion locally',
        };
      }

      // Try online sync if available
      let onlineSync = false;
      if (await this.canUseOnlineAPI()) {
        try {
          const syncResult = await this.syncEmotionToServer(emotionEntry);
          onlineSync = syncResult.success;
        } catch (onlineError) {
          // Don't fail - local storage succeeded
        }
      }

      return {
        success: true,
        entry: emotionEntry,
        onlineSync,
      };
    } catch (error: any) {
      console.error('Submit emotional entry error:', error);
      return {
        success: false,
        entry: { ...emotionData } as EmotionEntry,
        onlineSync: false,
        error: error.message,
      };
    }
  }

  // Store emotion locally with user isolation
  private static async storeEmotionLocally(emotion: EmotionEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const keys = this.getStorageKeys(emotion.userId);
      
      // Load existing emotions
      const existing = await AsyncStorage.getItem(keys.EMOTIONS);
      const emotions: EmotionEntry[] = existing ? JSON.parse(existing) : [];
      
      // Add new emotion
      emotions.unshift(emotion);
      
      // Limit to recent entries (performance)
      const limitedEmotions = emotions.slice(0, 1000);
      
      // Save updated emotions
      await AsyncStorage.setItem(keys.EMOTIONS, JSON.stringify(limitedEmotions));
      
      // Update metadata
      await this.updateMetadata(emotion.userId, {
        totalEntries: limitedEmotions.length,
        pendingSync: 1, // Increment pending sync
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Store emotion locally error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync emotion to server
  private static async syncEmotionToServer(emotion: EmotionEntry): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await ApiService.saveEmotion(emotion);
      
      if (response.success) {
        // Update sync metadata
        await this.updateMetadata(emotion.userId, {
          lastSyncTime: new Date().toISOString(),
          pendingSync: -1, // Decrement pending sync
        });
        
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error: any) {
      console.error('Sync emotion to server error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update metadata
  private static async updateMetadata(userId: string, updates: Partial<EmotionMetadata>): Promise<void> {
    try {
      const keys = this.getStorageKeys(userId);
      const existing = await AsyncStorage.getItem(keys.METADATA);
      const metadata: EmotionMetadata = existing 
        ? JSON.parse(existing)
        : {
            totalEntries: 0,
            lastSyncTime: null,
            pendingSync: 0,
            userId,
          };
      
      // Apply updates
      Object.assign(metadata, updates);
      
      // Handle relative updates for pendingSync
      if (updates.pendingSync !== undefined) {
        if (updates.pendingSync > 0) {
          metadata.pendingSync += updates.pendingSync;
        } else {
          metadata.pendingSync = Math.max(0, metadata.pendingSync + updates.pendingSync);
        }
      }
      
      await AsyncStorage.setItem(keys.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('Update metadata error:', error);
    }
  }

  // Check if online API is available
  private static async canUseOnlineAPI(): Promise<boolean> {
    try {
      return await ApiService.checkConnection();
    } catch (error) {
      return false;
    }
  }

  // Sync all pending emotions (called on app start/network reconnection)
  static async syncPendingEmotions(userId: string): Promise<{
    synced: number;
    failed: number;
    error?: string;
  }> {
    try {
      const keys = this.getStorageKeys(userId);
      const emotions = await AsyncStorage.getItem(keys.EMOTIONS);
      
      if (!emotions) {
        return { synced: 0, failed: 0 };
      }
      
      const emotionList: EmotionEntry[] = JSON.parse(emotions);
      let synced = 0;
      let failed = 0;
      
      // Sync recent emotions that might not be synced
      const recentEmotions = emotionList.slice(0, 10);
      
      for (const emotion of recentEmotions) {
        try {
          const result = await this.syncEmotionToServer(emotion);
          if (result.success) {
            synced++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }
      }
      
      return { synced, failed };
    } catch (error: any) {
      console.error('Sync pending emotions error:', error);
      return {
        synced: 0,
        failed: 0,
        error: error.message,
      };
    }
  }

  // Clear user data (for logout)
  static async clearUserData(userId: string): Promise<void> {
    try {
      const keys = this.getStorageKeys(userId);
      await Promise.all([
        AsyncStorage.removeItem(keys.EMOTIONS),
        AsyncStorage.removeItem(keys.METADATA),
        AsyncStorage.removeItem(keys.ANALYTICS),
        AsyncStorage.removeItem(keys.SYNC_QUEUE),
      ]);
    } catch (error) {
      console.error('Clear user data error:', error);
    }
  }
}

export default EmotionalAnalyticsAPI;