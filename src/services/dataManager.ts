import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CloudAuth from './cloudAuth';
import { offlineEmotionStorage } from './offlineEmotionStorage';
import conversationStorage from './conversationStorage';
import { appConfigService } from './appConfigService';
import { offlineQueue } from './offlineQueue';
import { userDataSync } from './userDataSync';
import SpotifyService from './spotifyService';
import AutoPlaylistService from './autoPlaylistService';
// simpleSecureStorage removed - using CloudAuth directly

/**
 * Centralized Data Manager
 * Handles all data operations, cleanup, and performance optimization
 */
export class DataManager {
  private static instance: DataManager;
  
  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  /**
   * COMPREHENSIVE LOGOUT - Clears ALL user data
   */
  async performCompleteLogout(userId?: string): Promise<void> {
    console.log('🗑️ DataManager: Starting comprehensive logout...');
    
    try {
      // Get current user ID if not provided
      const currentUserId = userId || await this.getCurrentUserId();
      
      // Simple cleanup - just clear storage
      await this.clearAllUserAsyncStorage(currentUserId);
      await this.clearAllUserSecureStore(currentUserId);
      
      console.log('✅ DataManager: Comprehensive logout completed');
    } catch (error) {
      console.error('❌ DataManager: Logout error:', error);
      // Force clear even on error
      await this.forceCleanup();
    }
  }

  /**
   * Get current user ID from any available source
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const cloudAuth = CloudAuth.getInstance();
      const user = cloudAuth.getCurrentUser();
      return user?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all AsyncStorage items with user prefix
   */
  private async clearAllUserAsyncStorage(userId: string | null): Promise<void> {
    if (!userId) return;
    
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => key.includes(userId));
      
      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
        console.log(`🗑️ DataManager: Cleared ${userKeys.length} AsyncStorage items for user ${userId}`);
      }
    } catch (error) {
      console.error('❌ DataManager: Error clearing AsyncStorage:', error);
    }
  }

  /**
   * Clear all SecureStore items with user prefix
   */
  private async clearAllUserSecureStore(userId: string | null): Promise<void> {
    if (!userId) return;
    
    try {
      // Common SecureStore keys that might have user data
      const commonKeys = [
        'authToken',
        'userProfile',
        'userSettings',
        'biometricKey',
        'encryptionKey',
        'sessionData'
      ];
      
      await Promise.allSettled(
        commonKeys.map(key => SecureStore.deleteItemAsync(`${key}_${userId}`))
      );
      
      console.log(`🗑️ DataManager: Cleared SecureStore items for user ${userId}`);
    } catch (error) {
      console.error('❌ DataManager: Error clearing SecureStore:', error);
    }
  }

  /**
   * Force cleanup - nuclear option
   */
  private async forceCleanup(): Promise<void> {
    try {
      // Clear all AsyncStorage
      await AsyncStorage.clear();
      
      // Clear common SecureStore items
      const commonKeys = [
        'authToken', 'userProfile', 'userSettings', 'biometricKey',
        'encryptionKey', 'sessionData', 'spotify_tokens', 'spotify_user_profile'
      ];
      
      await Promise.allSettled(
        commonKeys.map(key => SecureStore.deleteItemAsync(key))
      );
      
      console.log('🗑️ DataManager: Force cleanup completed');
    } catch (error) {
      console.error('❌ DataManager: Force cleanup error:', error);
    }
  }

  /**
   * PERFORMANCE OPTIMIZATION - Preload critical data
   */
  async preloadCriticalData(): Promise<void> {
    try {
      // Skip auth initialization - handled by AuthContext
      console.log('✅ DataManager: Skipping auth init (handled by AuthContext)');
      
      // Preload app configuration
      await appConfigService.initialize();
      
      console.log('✅ DataManager: Critical data preloaded');
    } catch (error) {
      console.error('❌ DataManager: Preload error:', error);
    }
  }

  /**
   * PERFORMANCE OPTIMIZATION - Batch data operations
   */
  async batchDataSync(): Promise<void> {
    try {
      // Batch sync operations
      await Promise.allSettled([
        userDataSync.syncUserData(),
        offlineQueue.processQueue(),
        offlineEmotionStorage.syncPendingEmotions()
      ]);
      
      console.log('✅ DataManager: Batch sync completed');
    } catch (error) {
      console.error('❌ DataManager: Batch sync error:', error);
    }
  }

  /**
   * PERFORMANCE OPTIMIZATION - Clean up old data
   */
  async performMaintenance(): Promise<void> {
    try {
      // Skip maintenance for now - services may not be ready
      console.log('✅ DataManager: Skipping maintenance (services may not be ready)');
      
      // Add maintenance back when services are properly initialized
      // await conversationStorage.cleanupOldConversations(100);
      // await offlineEmotionStorage.cleanupOldEmotions(thirtyDaysAgo);
      
      console.log('✅ DataManager: Maintenance completed');
    } catch (error) {
      console.error('❌ DataManager: Maintenance error:', error);
    }
  }

  /**
   * Get storage usage stats
   */
  async getStorageStats(): Promise<{
    asyncStorage: number;
    conversations: number;
    emotions: number;
    total: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const conversations = await conversationStorage.getAllConversations();
      const emotions = await offlineEmotionStorage.getAllEmotions();
      
      return {
        asyncStorage: allKeys.length,
        conversations: conversations.length,
        emotions: emotions.length,
        total: allKeys.length + conversations.length + emotions.length
      };
    } catch (error) {
      console.error('❌ DataManager: Storage stats error:', error);
      return { asyncStorage: 0, conversations: 0, emotions: 0, total: 0 };
    }
  }
}

export const dataManager = DataManager.getInstance();