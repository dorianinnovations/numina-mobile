import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService, { SyncData } from './api';
import offlineQueueService from './offlineQueue';
import { getEnhancedWebSocketService } from './enhancedWebSocketService';
import CloudAuth from './cloudAuth';
import { Message, Conversation } from '../types/message';

interface UserProfile {
  id: string;
  email: string;
  experienceLevel?: string;
  preferences?: Record<string, unknown>;
  [key: string]: unknown;
}

interface EmotionData {
  id: string;
  emotion: string;
  intensity: number;
  timestamp: string;
  context?: string;
  [key: string]: unknown;
}

interface AnalyticsData {
  insights?: string[];
  patterns?: Record<string, unknown>;
  metrics?: Record<string, number>;
  [key: string]: unknown;
}

interface ConflictData {
  id: string;
  type: string;
  localData: unknown;
  serverData: unknown;
  timestamp: string;
}

/**
 * Comprehensive Sync Service
 * Handles incremental sync, conflict resolution, and data synchronization
 */

interface SyncState {
  lastSync: string;
  isSyncing: boolean;
  lastSyncAttempt: string;
  syncErrors: string[];
  syncStats: {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    dataTypesSynced: string[];
  };
}

interface SyncOptions {
  dataTypes?: string[];
  forceSync?: boolean;
  includeOfflineQueue?: boolean;
  maxRetries?: number;
}

interface SyncResult {
  success: boolean;
  syncedData: {
    profile?: UserProfile;
    emotions?: EmotionData[];
    conversations?: Conversation[];
    analytics?: AnalyticsData;
  };
  conflicts: ConflictData[];
  errors: string[];
  timestamp: string;
}

interface ConflictResolution {
  conflictId: string;
  resolution: 'server' | 'client' | 'merge';
  resolvedData?: unknown;
}

class SyncService {
  private static readonly SYNC_STATE_KEY = 'sync_state';
  private static readonly LAST_SYNC_KEY = 'last_sync_timestamp';
  private static readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_SYNC_AGE = 24 * 60 * 60 * 1000; // 24 hours
  
  // Get user-specific keys
  private static getUserSyncKeys(userId: string) {
    return {
      SYNC_STATE: `sync_state_${userId}`,
      LAST_SYNC: `last_sync_timestamp_${userId}`,
    };
  }
  
  private static syncTimer: NodeJS.Timeout | null = null;
  private static isSyncing = false;

  /**
   * Initialize sync service
   */
  static async initialize(): Promise<void> {
    try {
      // Load sync state
      const syncState = await this.getSyncState();
      
      // Start automatic sync if enabled
      this.startAutoSync();
      
      // Listen for WebSocket sync events
      const websocketService = getEnhancedWebSocketService();
      websocketService.addEventListener('sync_completed', (data) => {
        this.handleServerSyncCompleted(data);
      });
      
      // Process offline queue on network reconnection
      websocketService.addEventListener('connection_status', (data) => {
        if (data.connected) {
          this.triggerSync({ includeOfflineQueue: true });
        }
      });
      
      // console.log('Sync service initialized');
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  }

  /**
   * Start automatic sync
   */
  static startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(async () => {
      const lastSync = await this.getLastSyncTimestamp();
      const now = Date.now();
      
      // Only sync if last sync was more than sync interval ago
      if (now - new Date(lastSync).getTime() > this.SYNC_INTERVAL) {
        this.triggerSync({ dataTypes: ['emotions', 'conversations'] });
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop automatic sync
   */
  static stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Trigger sync operation
   */
  static async triggerSync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedData: {},
        conflicts: [],
        errors: ['Sync already in progress'],
        timestamp: new Date().toISOString()
      };
    }

    this.isSyncing = true;
    const syncStartTime = Date.now();
    
    try {
      const {
        dataTypes = ['profile', 'emotions', 'conversations', 'analytics'],
        forceSync = false,
        includeOfflineQueue = false,
        maxRetries = 3
      } = options;

      console.log('Starting sync operation:', { dataTypes, forceSync, includeOfflineQueue });

      // Update sync state
      await this.updateSyncState({
        isSyncing: true,
        lastSyncAttempt: new Date().toISOString(),
        syncErrors: []
      });

      // Process offline queue first if requested
      if (includeOfflineQueue) {
        await offlineQueueService.processQueue();
      }

      // Get last sync timestamp
      const lastSync = forceSync ? new Date(0).toISOString() : await this.getLastSyncTimestamp();

      // Perform incremental sync
      const syncResult = await this.performIncrementalSync(lastSync, dataTypes, maxRetries);
      
      if (syncResult.success) {
        // Update last sync timestamp
        await this.setLastSyncTimestamp(syncResult.timestamp);
        
        // Update sync statistics
        await this.updateSyncStats({
          totalSyncs: 1,
          successfulSyncs: 1,
          dataTypesSynced: dataTypes
        });
        
        console.log('Sync completed successfully:', syncResult);
      } else {
        // Update sync statistics for failed sync
        await this.updateSyncStats({
          totalSyncs: 1,
          failedSyncs: 1,
          dataTypesSynced: []
        });
        
        console.error('Sync failed:', syncResult.errors);
      }

      // Update sync state
      await this.updateSyncState({
        isSyncing: false,
        syncErrors: syncResult.errors,
        lastSync: syncResult.success ? syncResult.timestamp : lastSync
      });

      return syncResult;

    } catch (error) {
      console.error('Sync operation failed:', error);
      
      await this.updateSyncState({
        isSyncing: false,
        syncErrors: [error instanceof Error ? error.message : 'Unknown sync error']
      });

      return {
        success: false,
        syncedData: {},
        conflicts: [],
        errors: [error instanceof Error ? error.message : 'Unknown sync error'],
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isSyncing = false;
      const syncDuration = Date.now() - syncStartTime;
      console.log(`Sync operation completed in ${syncDuration}ms`);
    }
  }

  /**
   * Perform incremental sync
   */
  private static async performIncrementalSync(
    lastSync: string,
    dataTypes: string[],
    maxRetries: number
  ): Promise<SyncResult> {
    let retryCount = 0;
    let lastError: string | null = null;

    while (retryCount < maxRetries) {
      try {
        // Get incremental sync data from server
        const syncResponse = await ApiService.getIncrementalSync(lastSync, dataTypes);
        
        if (!syncResponse.success) {
          lastError = syncResponse.error || 'Failed to get sync data';
          retryCount++;
          
          if (retryCount < maxRetries) {
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
        } else {
          // Process sync data
          const syncData = syncResponse.data;
          
          // Check if we have valid sync data structure
          // Handle both old (data) and new (changes) format
          const dataToProcess = syncData.changes || syncData.data;
          if (!syncData || !dataToProcess) {
            console.warn('Invalid sync data structure received:', syncData);
            return {
              success: true,
              syncedData: {},
              conflicts: [],
              errors: [],
              timestamp: new Date().toISOString()
            };
          }
          
          const syncedData: SyncResult['syncedData'] = {};
          const conflicts: ConflictData[] = [];
          
          // Handle both old and new sync data formats
          const syncChanges = syncData.changes || syncData.data;
          
          // Safely process profile data
          if (syncChanges?.profile?.data || syncChanges?.profile?.updated) {
            const profileData = syncChanges.profile.data || syncChanges.profile;
            syncedData.profile = profileData;
            await this.applyProfileChanges(profileData);
          }
          
          // Safely process emotions data
          if (syncChanges?.emotions?.data || syncChanges?.emotions?.updated) {
            const emotionsData = syncChanges.emotions.data || syncChanges.emotions;
            syncedData.emotions = emotionsData;
            await this.applyEmotionsChanges(emotionsData);
          }
          
          // Safely process conversations data
          if (syncChanges?.conversations?.data || syncChanges?.conversations?.updated) {
            const conversationsData = syncChanges.conversations.data || syncChanges.conversations;
            syncedData.conversations = conversationsData;
            await this.applyConversationsChanges(conversationsData);
          }
          
          // Safely process analytics data
          if (syncChanges?.analytics?.data || syncChanges?.analytics?.updated) {
            const analyticsData = syncChanges.analytics.data || syncChanges.analytics;
            syncedData.analytics = analyticsData;
            await this.applyAnalyticsChanges(analyticsData);
          }
          
          return {
            success: true,
            syncedData,
            conflicts,
            errors: [],
            timestamp: syncData?.timestamp || new Date().toISOString()
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error during sync';
        retryCount++;
        
        if (retryCount < maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }

    return {
      success: false,
      syncedData: {},
      conflicts: [],
      errors: [lastError || 'Max retries exceeded'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Apply profile changes
   */
  private static async applyProfileChanges(profileData: UserProfile): Promise<void> {
    try {
      const currentUserId = CloudAuth.getInstance().getCurrentUserId();
      if (!currentUserId) {
        console.warn('No current user ID found, cannot apply profile changes');
        return;
      }
      
      const userKey = `user_profile_${currentUserId}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(profileData));
      console.log('Profile changes applied for user:', currentUserId);
    } catch (error) {
      console.error('Failed to apply profile changes:', error);
    }
  }

  /**
   * Apply emotions changes
   */
  private static async applyEmotionsChanges(emotionsData: EmotionData[]): Promise<void> {
    try {
      const currentUserId = CloudAuth.getInstance().getCurrentUserId();
      if (!currentUserId) {
        console.warn('No current user ID found, cannot apply emotions changes');
        return;
      }
      
      const userKey = `emotions_data_${currentUserId}`;
      const existingEmotions = await AsyncStorage.getItem(userKey);
      const emotions = existingEmotions ? JSON.parse(existingEmotions) : [];
      
      // Merge new emotions with existing ones
      const mergedEmotions = this.mergeEmotionsData(emotions, emotionsData);
      
      await AsyncStorage.setItem(userKey, JSON.stringify(mergedEmotions));
      console.log(`Applied ${emotionsData.length} emotion changes for user:`, currentUserId);
    } catch (error) {
      console.error('Failed to apply emotions changes:', error);
    }
  }

  /**
   * Apply conversations changes
   */
  private static async applyConversationsChanges(conversationsData: any[]): Promise<void> {
    try {
      const currentUserId = CloudAuth.getInstance().getCurrentUserId();
      if (!currentUserId) {
        console.warn('No current user ID found, cannot apply conversations changes');
        return;
      }
      
      const userKey = `conversations_data_${currentUserId}`;
      const existingConversations = await AsyncStorage.getItem(userKey);
      const conversations = existingConversations ? JSON.parse(existingConversations) : [];
      
      // Merge new conversations with existing ones
      const mergedConversations = this.mergeConversationsData(conversations, conversationsData);
      
      await AsyncStorage.setItem(userKey, JSON.stringify(mergedConversations));
      console.log(`Applied ${conversationsData.length} conversation changes for user:`, currentUserId);
    } catch (error) {
      console.error('Failed to apply conversations changes:', error);
    }
  }

  /**
   * Apply analytics changes
   */
  private static async applyAnalyticsChanges(analyticsData: any): Promise<void> {
    try {
      const currentUserId = CloudAuth.getInstance().getCurrentUserId();
      if (!currentUserId) {
        console.warn('No current user ID found, cannot apply analytics changes');
        return;
      }
      
      const userKey = `analytics_data_${currentUserId}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(analyticsData));
      console.log('Analytics changes applied for user:', currentUserId);
    } catch (error) {
      console.error('Failed to apply analytics changes:', error);
    }
  }

  /**
   * Merge emotions data (conflict resolution)
   */
  private static mergeEmotionsData(existing: any[], incoming: any[]): any[] {
    const merged = [...existing];
    
    for (const newEmotion of incoming) {
      const existingIndex = merged.findIndex(e => e.id === newEmotion.id);
      
      if (existingIndex >= 0) {
        // Resolve conflict (newer timestamp wins)
        if (new Date(newEmotion.timestamp) > new Date(merged[existingIndex].timestamp)) {
          merged[existingIndex] = newEmotion;
        }
      } else {
        merged.push(newEmotion);
      }
    }
    
    return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Merge conversations data (conflict resolution)
   */
  private static mergeConversationsData(existing: any[], incoming: any[]): any[] {
    const merged = [...existing];
    
    for (const newConversation of incoming) {
      const existingIndex = merged.findIndex(c => c.id === newConversation.id);
      
      if (existingIndex >= 0) {
        // Merge messages
        const existingMessages = merged[existingIndex].messages || [];
        const incomingMessages = newConversation.messages || [];
        
        const mergedMessages = [...existingMessages];
        for (const message of incomingMessages) {
          const messageExists = mergedMessages.find(m => m.id === message.id);
          if (!messageExists) {
            mergedMessages.push(message);
          }
        }
        
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...newConversation,
          messages: mergedMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        };
      } else {
        merged.push(newConversation);
      }
    }
    
    return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Handle server sync completed event
   */
  private static handleServerSyncCompleted(data: any): void {
    console.log('Server sync completed:', data);
    // Could trigger a local sync to get the latest data
  }

  /**
   * Get sync state
   */
  private static async getSyncState(): Promise<SyncState> {
    try {
      const stateJson = await AsyncStorage.getItem(this.SYNC_STATE_KEY);
      
      if (!stateJson) {
        return this.getDefaultSyncState();
      }
      
      return JSON.parse(stateJson);
    } catch (error) {
      console.error('Failed to get sync state:', error);
      return this.getDefaultSyncState();
    }
  }

  /**
   * Update sync state
   */
  private static async updateSyncState(updates: Partial<SyncState>): Promise<void> {
    try {
      const currentState = await this.getSyncState();
      const newState = { ...currentState, ...updates };
      
      await AsyncStorage.setItem(this.SYNC_STATE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to update sync state:', error);
    }
  }

  /**
   * Get default sync state
   */
  private static getDefaultSyncState(): SyncState {
    return {
      lastSync: new Date(0).toISOString(),
      isSyncing: false,
      lastSyncAttempt: new Date(0).toISOString(),
      syncErrors: [],
      syncStats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        dataTypesSynced: []
      }
    };
  }

  /**
   * Update sync statistics
   */
  private static async updateSyncStats(updates: Partial<SyncState['syncStats']>): Promise<void> {
    try {
      const currentState = await this.getSyncState();
      const newStats = {
        ...currentState.syncStats,
        totalSyncs: currentState.syncStats.totalSyncs + (updates.totalSyncs || 0),
        successfulSyncs: currentState.syncStats.successfulSyncs + (updates.successfulSyncs || 0),
        failedSyncs: currentState.syncStats.failedSyncs + (updates.failedSyncs || 0),
        dataTypesSynced: updates.dataTypesSynced || currentState.syncStats.dataTypesSynced
      };
      
      await this.updateSyncState({ syncStats: newStats });
    } catch (error) {
      console.error('Failed to update sync stats:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  private static async getLastSyncTimestamp(): Promise<string> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return timestamp || new Date(0).toISOString();
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return new Date(0).toISOString();
    }
  }

  /**
   * Set last sync timestamp
   */
  private static async setLastSyncTimestamp(timestamp: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, timestamp);
    } catch (error) {
      console.error('Failed to set last sync timestamp:', error);
    }
  }

  /**
   * Get sync statistics
   */
  static async getSyncStats(): Promise<SyncState['syncStats']> {
    const state = await this.getSyncState();
    return state.syncStats;
  }

  /**
   * Check if sync is needed
   */
  static async isSyncNeeded(): Promise<boolean> {
    const lastSync = await this.getLastSyncTimestamp();
    const now = Date.now();
    const timeSinceLastSync = now - new Date(lastSync).getTime();
    
    return timeSinceLastSync > this.SYNC_INTERVAL;
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<{
    isSyncing: boolean;
    lastSync: string;
    syncErrors: string[];
    syncStats: SyncState['syncStats'];
  }> {
    const state = await this.getSyncState();
    return {
      isSyncing: state.isSyncing,
      lastSync: state.lastSync,
      syncErrors: state.syncErrors,
      syncStats: state.syncStats
    };
  }

  /**
   * Force full sync
   */
  static async forceFullSync(): Promise<SyncResult> {
    return this.triggerSync({
      dataTypes: ['profile', 'emotions', 'conversations', 'analytics'],
      forceSync: true,
      includeOfflineQueue: true
    });
  }

  /**
   * Cleanup sync service
   */
  static cleanup(): void {
    this.stopAutoSync();
    this.isSyncing = false;
  }
}

export default SyncService;
export type { SyncResult, SyncOptions, SyncState, ConflictResolution };