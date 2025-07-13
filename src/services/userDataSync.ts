import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import SecureStorageService from './secureStorage';

interface SyncStatus {
  lastSync: string | null;
  pending: number;
  failed: number;
  userId: string;
}

class UserDataSync {
  private static syncInProgress = false;
  private static syncListeners: ((status: SyncStatus) => void)[] = [];

  static async getSyncStatus(userId?: string): Promise<SyncStatus> {
    try {
      const userData = await SecureStorageService.getUserData();
      const currentUserId = userId || userData?.id || 'guest';
      
      const statusKey = `syncStatus_${currentUserId}`;
      const status = await AsyncStorage.getItem(statusKey);
      
      if (status) {
        return JSON.parse(status);
      }
      
      return {
        lastSync: null,
        pending: 0,
        failed: 0,
        userId: currentUserId,
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        lastSync: null,
        pending: 0,
        failed: 0,
        userId: 'guest',
      };
    }
  }

  static async updateSyncStatus(updates: Partial<SyncStatus>, userId?: string): Promise<void> {
    try {
      const userData = await SecureStorageService.getUserData();
      const currentUserId = userId || userData?.id || 'guest';
      
      const statusKey = `syncStatus_${currentUserId}`;
      const current = await this.getSyncStatus(currentUserId);
      const updated = { ...current, ...updates };
      
      await AsyncStorage.setItem(statusKey, JSON.stringify(updated));
      
      // Notify listeners
      this.notifyListeners(updated);
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  static async startSync(userId?: string): Promise<boolean> {
    if (this.syncInProgress) {
      return false;
    }

    try {
      this.syncInProgress = true;
      
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        return false;
      }

      // Check if user is authenticated
      const token = await SecureStorageService.getToken();
      if (!token) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to start sync:', error);
      this.syncInProgress = false;
      return false;
    }
  }

  static endSync(): void {
    this.syncInProgress = false;
  }

  static isSyncing(): boolean {
    return this.syncInProgress;
  }

  static addSyncListener(listener: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(status: SyncStatus): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  static async clearSyncData(userId: string): Promise<void> {
    try {
      const statusKey = `syncStatus_${userId}`;
      await AsyncStorage.removeItem(statusKey);
    } catch (error) {
      console.error('Failed to clear sync data:', error);
    }
  }

  // Set up automatic sync on network reconnection
  static setupAutoSync(): void {
    // Auto-sync is now handled by AuthContext to avoid circular dependencies
    console.log('[UserDataSync] Auto-sync setup - handled by AuthContext');
  }

  private static async triggerAutoSync(): Promise<void> {
    // Auto-sync is now handled by AuthContext to avoid circular dependencies
    console.log('[UserDataSync] Auto-sync triggered - handled by AuthContext');
  }
}

export const userDataSync = UserDataSync;