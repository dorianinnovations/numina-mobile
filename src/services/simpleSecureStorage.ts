import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureAuthManager from './secureAuthManager';

/**
 * Simplified Secure Storage Service
 * Works with AuthManager as single source of truth
 * Eliminates race conditions and token clearing issues
 */

class SimpleSecureStorageService {
  // Get current user ID from AuthManager
  static getCurrentUserId(): string | null {
    return SecureAuthManager.getInstance().getCurrentUserId();
  }

  // Get current token from AuthManager
  static getToken(): string | null {
    return SecureAuthManager.getInstance().getCurrentToken();
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return SecureAuthManager.getInstance().isAuthenticated();
  }

  // Generate user-specific storage keys
  static getStorageKeys(userId: string) {
    return {
      EMOTIONS: `numina_emotions_v2_${userId}`,
      METADATA: `numina_emotion_metadata_v2_${userId}`,
      USER_DATA: `numina_user_data_v2_${userId}`,
      SYNC_STATUS: `numina_sync_status_v2_${userId}`,
      CONVERSATIONS: `numina_conversations_v2_${userId}`,
      ANALYTICS: `numina_analytics_v2_${userId}`,
    };
  }

  // Store data with user-specific key
  static async setItem(key: string, value: any, useUserPrefix: boolean = true): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId && useUserPrefix) {
        console.warn('[SimpleSecureStorage] No user ID found, cannot store user-specific data for key:', key);
        return;
      }

      const storageKey = useUserPrefix && userId ? `${key}_${userId}` : key;
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await AsyncStorage.setItem(storageKey, jsonValue);
      console.log('[SimpleSecureStorage] Data stored with key:', storageKey);
    } catch (error) {
      console.error(`[SimpleSecureStorage] Error storing ${key}:`, error);
      throw new Error(`Failed to store ${key}`);
    }
  }

  // Get data with user-specific key
  static async getItem(key: string, useUserPrefix: boolean = true): Promise<any | null> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId && useUserPrefix) {
        console.warn('[SimpleSecureStorage] No user ID found, cannot retrieve user-specific data for key:', key);
        return null;
      }

      const storageKey = useUserPrefix && userId ? `${key}_${userId}` : key;
      const value = await AsyncStorage.getItem(storageKey);
      
      if (value === null) return null;
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`[SimpleSecureStorage] Error retrieving ${key}:`, error);
      return null;
    }
  }

  // Remove data with user-specific key
  static async removeItem(key: string, useUserPrefix: boolean = true): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      if (!userId && useUserPrefix) {
        console.warn('[SimpleSecureStorage] No user ID found, cannot remove user-specific data for key:', key);
        return;
      }

      const storageKey = useUserPrefix && userId ? `${key}_${userId}` : key;
      await AsyncStorage.removeItem(storageKey);
      console.log('[SimpleSecureStorage] Data removed with key:', storageKey);
    } catch (error) {
      console.error(`[SimpleSecureStorage] Error removing ${key}:`, error);
    }
  }

  // Load user-specific data for current user
  static async loadUserData(): Promise<{
    emotions: any[];
    conversations: any[];
    analytics: any;
    syncState: any;
  }> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.warn('[SimpleSecureStorage] No user ID found, returning empty data');
      return {
        emotions: [],
        conversations: [],
        analytics: null,
        syncState: null
      };
    }

    try {
      console.log('[SimpleSecureStorage] Loading user data for:', userId);
      
      const keys = this.getStorageKeys(userId);
      
      const [emotions, conversations, analytics, syncState] = await Promise.all([
        AsyncStorage.getItem(keys.EMOTIONS),
        AsyncStorage.getItem(keys.CONVERSATIONS),
        AsyncStorage.getItem(keys.ANALYTICS),
        AsyncStorage.getItem(keys.SYNC_STATUS)
      ]);
      
      const result = {
        emotions: emotions ? JSON.parse(emotions) : [],
        conversations: conversations ? JSON.parse(conversations) : [],
        analytics: analytics ? JSON.parse(analytics) : null,
        syncState: syncState ? JSON.parse(syncState) : null
      };
      
      console.log('[SimpleSecureStorage] Loaded user data:', {
        emotionsCount: result.emotions.length,
        conversationsCount: result.conversations.length,
        hasAnalytics: !!result.analytics,
        hasSyncState: !!result.syncState
      });
      
      return result;
    } catch (error) {
      console.error('[SimpleSecureStorage] Error loading user data:', error);
      return {
        emotions: [],
        conversations: [],
        analytics: null,
        syncState: null
      };
    }
  }

  // Clear user-specific data (for logout or account switching)
  static async clearUserData(userId?: string): Promise<void> {
    try {
      const targetUserId = userId || this.getCurrentUserId();
      if (!targetUserId) {
        console.warn('[SimpleSecureStorage] No user ID provided for data clearing');
        return;
      }

      console.log('[SimpleSecureStorage] Clearing data for user:', targetUserId);
      
      const keys = this.getStorageKeys(targetUserId);
      const userKeys = Object.values(keys);
      
      await AsyncStorage.multiRemove(userKeys);
      console.log('[SimpleSecureStorage] User data cleared for:', targetUserId);
    } catch (error) {
      console.error('[SimpleSecureStorage] Error clearing user data:', error);
    }
  }

  // Clear all cache data (non-user-specific)
  static async clearCacheData(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find cache keys that are not user-specific
      const cacheKeys = allKeys.filter(key => 
        key.includes('sync_state') ||
        key.includes('app_config') ||
        key.includes('batch_') ||
        key.includes('temp_') ||
        (key.startsWith('@') && !key.includes('_6')) // Global cache (not user-specific)
      );
      
      if (cacheKeys.length > 0) {
        console.log('[SimpleSecureStorage] Clearing cache keys:', cacheKeys.length);
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('[SimpleSecureStorage] Error clearing cache data:', error);
    }
  }

  // Get all user-specific keys for debugging
  static async getUserKeys(userId?: string): Promise<string[]> {
    try {
      const targetUserId = userId || this.getCurrentUserId();
      if (!targetUserId) return [];

      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter(key => key.includes(targetUserId));
    } catch (error) {
      console.error('[SimpleSecureStorage] Error getting user keys:', error);
      return [];
    }
  }
}

export default SimpleSecureStorageService;