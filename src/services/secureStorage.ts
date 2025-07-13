import AsyncStorage from '@react-native-async-storage/async-storage';

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
      USER_DATA: 'numina_user_data_v2',
      SYNC_STATUS: 'numina_sync_status_v2',
    };
  }

  // Token management
  static async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  }

  static async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // User data management
  static async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  static async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(this.USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }

  static async removeUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_DATA_KEY);
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

  // Clear all user-specific data (for logout)
  static async clearUserData(userId?: string): Promise<void> {
    try {
      const keys = [
        this.TOKEN_KEY,
        this.USER_DATA_KEY,
        this.SYNC_STATUS_KEY,
      ];

      if (userId) {
        const userKeys = this.getStorageKeys(userId);
        keys.push(
          userKeys.EMOTIONS,
          userKeys.METADATA,
        );
      }

      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Check if user data exists (for session persistence)
  static async hasValidSession(): Promise<boolean> {
    try {
      const token = await this.getToken();
      const userData = await this.getUserData();
      return !!(token && userData);
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }
}

export default SecureStorageService;