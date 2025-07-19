import AsyncStorage from '@react-native-async-storage/async-storage';
import CloudAuth from './cloudAuth';

/**
 * Secure storage service for React Native
 * Replaces localStorage from web app with AsyncStorage
 * Maintains same API interface for easy migration
 */

class SecureStorageService {
  // Authentication keys
  private static TOKEN_KEY = 'numina_auth_token';
  private static USER_DATA_KEY = 'numina_user_data_v2';
  private static SYNC_STATUS_KEY = 'numina_sync_status_v2';

  // User-specific data keys (same pattern as web app)
  static getStorageKeys(userId: string) {
    return {
      EMOTIONS: `numina_emotions_v2_${userId}`,
      METADATA: `numina_emotion_metadata_v2_${userId}`,
      USER_DATA: `numina_user_data_v2_${userId}`,
      SYNC_STATUS: `numina_sync_status_v2_${userId}`,
    };
  }

  // Token management - SINGLE SOURCE OF TRUTH: Use CloudAuth
  static async setToken(token: string): Promise<void> {
    console.log('[SecureStorage] DEPRECATED: setToken - use CloudAuth instead');
    // No-op: CloudAuth handles token storage now
  }

  static async getToken(): Promise<string | null> {
    console.log('[SecureStorage] SINGLE SOURCE OF TRUTH: Using CloudAuth.getToken()');
    return CloudAuth.getInstance().getToken();
  }

  static async removeToken(): Promise<void> {
    console.log('[SecureStorage] DEPRECATED: removeToken - use CloudAuth.logout() instead');
    // No-op: CloudAuth handles token removal now
  }

  // User data management - User-specific storage
  static async setUserData(userData: any): Promise<void> {
    try {
      if (!userData?.id) {
        throw new Error('User data must include user ID for secure storage');
      }
      
      const userKey = `numina_user_data_v2_${userData.id}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(userData));
      
      // Also store the current user ID separately for quick access
      await AsyncStorage.setItem('numina_current_user_id', userData.id);
      
      console.log('[SecureStorage] User data stored with user-specific key:', userKey);
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  static async getUserData(): Promise<any | null> {
    try {
      // Get current user ID first
      const currentUserId = await AsyncStorage.getItem('numina_current_user_id');
      if (!currentUserId) {
        console.log('[SecureStorage] No current user ID found');
        return null;
      }
      
      const userKey = `numina_user_data_v2_${currentUserId}`;
      const data = await AsyncStorage.getItem(userKey);
      
      console.log('[SecureStorage] Retrieved user data for user:', currentUserId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  static async removeUserData(): Promise<void> {
    try {
      // Get current user ID first
      const currentUserId = await AsyncStorage.getItem('numina_current_user_id');
      if (currentUserId) {
        const userKey = `numina_user_data_v2_${currentUserId}`;
        await AsyncStorage.removeItem(userKey);
        console.log('[SecureStorage] Removed user data for user:', currentUserId);
      }
      
      // Also remove the global fallback key (migration)
      await AsyncStorage.removeItem(this.USER_DATA_KEY);
      
      // Remove current user ID
      await AsyncStorage.removeItem('numina_current_user_id');
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  }

  // Generic storage methods for offline data
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw new Error(`Failed to store ${key}`);
    }
  }

  static async getItem(key: string): Promise<any | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }

  // Clear session data only (preserve user data for re-login)
  static async clearSessionData(): Promise<void> {
    try {
      console.log('[SecureStorage] Clearing session data only (preserving user data)');
      
      // Only clear session-related keys, NOT user data
      const sessionKeys = [
        this.TOKEN_KEY,  // Auth token
        'numina_current_user_id',  // Current session user
        // Legacy keys
        this.USER_DATA_KEY,
        this.SYNC_STATUS_KEY,
      ];

      await AsyncStorage.multiRemove(sessionKeys);
      console.log('[SecureStorage] Cleared session keys:', sessionKeys);
      
      // Clear cache data that's not user-specific
      const allStorageKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allStorageKeys.filter(key => 
        key.includes('sync_state') ||  // Global sync state
        key.includes('app_config') ||  // App config cache
        key.includes('batch_') ||      // Batch processing cache
        key.includes('temp_') ||       // Temporary data
        (key.startsWith('@') && !key.includes('_6')) // Global cache (not user-specific)
      );
      
      if (cacheKeys.length > 0) {
        console.log('[SecureStorage] Clearing non-user cache keys:', cacheKeys);
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  // Clear all user-specific data (for complete removal)
  static async clearUserData(userId?: string): Promise<void> {
    try {
      console.log('[SecureStorage] Clearing all data for user:', userId);
      
      // Get current user ID if not provided
      const targetUserId = userId || await AsyncStorage.getItem('numina_current_user_id');
      
      if (!targetUserId) {
        console.log('[SecureStorage] No user ID provided, clearing session only');
        await this.clearSessionData();
        return;
      }

      // User-specific keys to clear
      const userKeys = this.getStorageKeys(targetUserId);
      const userSpecificKeys = [
        userKeys.EMOTIONS,
        userKeys.METADATA,
        userKeys.USER_DATA,
        userKeys.SYNC_STATUS,
      ];
      
      console.log('[SecureStorage] Clearing user-specific keys for user:', targetUserId);
      await AsyncStorage.multiRemove(userSpecificKeys);
      
      // Also clear user-specific cache
      const allStorageKeys = await AsyncStorage.getAllKeys();
      const userCacheKeys = allStorageKeys.filter(key => 
        key.includes(targetUserId) ||
        key.includes(`_${targetUserId}_`) ||
        key.endsWith(`_${targetUserId}`)
      );
      
      if (userCacheKeys.length > 0) {
        console.log('[SecureStorage] Clearing user cache keys:', userCacheKeys);
        await AsyncStorage.multiRemove(userCacheKeys);
      }
      
      // Also clear session data
      await this.clearSessionData();
      
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Clear other users' data when a different user logs in
  static async clearOtherUsersData(currentUserId: string): Promise<void> {
    try {
      console.log('[SecureStorage] Clearing other users data, keeping current user:', currentUserId);
      
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find keys that belong to other users
      const otherUsersKeys = allKeys.filter(key => {
        // User-specific data pattern: contains user ID but not current user
        const containsUserId = key.includes('_6') && key.length > 20; // MongoDB ObjectId pattern
        const isCurrentUser = key.includes(currentUserId);
        const isUserData = key.includes('numina_') || key.includes('emotions_') || 
                          key.includes('conversations_') || key.includes('analytics_') ||
                          key.includes('@ai_') || key.includes('@cloud_');
        
        return containsUserId && !isCurrentUser && isUserData;
      });
      
      if (otherUsersKeys.length > 0) {
        console.log('[SecureStorage] Clearing other users keys:', otherUsersKeys);
        await AsyncStorage.multiRemove(otherUsersKeys);
      }
      
      // DON'T clear session data - we just logged in!
      console.log('[SecureStorage] Other users data cleared, current session preserved');
      
    } catch (error) {
      console.error('Error clearing other users data:', error);
    }
  }

  // Nuclear option: Clear ALL app data (for complete user isolation)
  static async clearAllAppData(): Promise<void> {
    try {
      console.log('[SecureStorage] NUCLEAR CLEAR: Removing ALL app data');
      
      // Get all storage keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // NUCLEAR OPTION: Clear ALL cache and app data
      // Ensures complete user isolation by removing everything
      const numinaKeys = allKeys.filter(key => 
        // Core app data
        key.includes('numina_') || 
        key.includes('emotions_') ||
        key.includes('conversations_') ||
        key.includes('analytics_') ||
        key.includes('sync_') ||
        key.includes('cache_') ||
        key.includes('user_profile') ||
        key.includes('personality_') ||
        key.includes('batch_') ||
        key.includes('offline_') ||
        // ALL cache keys (starts with @)
        key.startsWith('@') ||
        // Common cache patterns
        key.includes('_cache') ||
        key.includes('Cache') ||
        key.includes('cached_') ||
        key.includes('temp_') ||
        key.includes('pending_') ||
        // Service-specific keys
        key.includes('ai_') ||
        key.includes('cloud_') ||
        key.includes('match_') ||
        key.includes('recent_') ||
        key.includes('last_') ||
        key.includes('state_') ||
        // Any key that might contain user data
        key.includes('user') ||
        key.includes('User')
      );
      
      console.log('[SecureStorage] Found Numina keys to clear:', numinaKeys.length);
      
      if (numinaKeys.length > 0) {
        await AsyncStorage.multiRemove(numinaKeys);
        console.log('[SecureStorage] Cleared all Numina app data:', numinaKeys);
      }
      
    } catch (error) {
      console.error('Error clearing all app data:', error);
    }
  }

  // Get current user ID
  static async getCurrentUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('numina_current_user_id');
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // Load user-specific data (emotions, conversations, etc.)
  static async loadUserSpecificData(userId: string): Promise<{
    emotions: any[];
    conversations: any[];
    analytics: any;
    syncState: any;
  }> {
    try {
      console.log('[SecureStorage] Loading user-specific data for:', userId);
      
      const userKeys = this.getStorageKeys(userId);
      
      // Load user-specific data
      const [emotions, conversations, analytics, syncState] = await Promise.all([
        AsyncStorage.getItem(userKeys.EMOTIONS),
        AsyncStorage.getItem(`conversations_data_${userId}`),
        AsyncStorage.getItem(`analytics_data_${userId}`),
        AsyncStorage.getItem(`sync_state_${userId}`)
      ]);
      
      const result = {
        emotions: emotions ? JSON.parse(emotions) : [],
        conversations: conversations ? JSON.parse(conversations) : [],
        analytics: analytics ? JSON.parse(analytics) : null,
        syncState: syncState ? JSON.parse(syncState) : null
      };
      
      console.log('[SecureStorage] Loaded user data:', {
        emotionsCount: result.emotions.length,
        conversationsCount: result.conversations.length,
        hasAnalytics: !!result.analytics,
        hasSyncState: !!result.syncState
      });
      
      return result;
    } catch (error) {
      console.error('Error loading user-specific data:', error);
      return {
        emotions: [],
        conversations: [],
        analytics: null,
        syncState: null
      };
    }
  }

  // Check if user data exists (for session persistence)
  static async hasValidSession(): Promise<boolean> {
    console.log('[SecureStorage] SINGLE SOURCE OF TRUTH: Using CloudAuth.isAuthenticated()');
    return CloudAuth.getInstance().isAuthenticated();
  }
}

export default SecureStorageService;