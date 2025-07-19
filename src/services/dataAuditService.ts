import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { dataManager } from './dataManager';
import conversationStorage from './conversationStorage';
import { offlineEmotionStorage } from './offlineEmotionStorage';
import ApiService from './api';

/**
 * Data Audit Service - Data Management & Privacy
 * 
 * Handles data privacy, cleanup, and verification
 * For testing, debugging, and GDPR compliance
 */
export class DataAuditService {
  private static instance: DataAuditService;

  static getInstance(): DataAuditService {
    if (!DataAuditService.instance) {
      DataAuditService.instance = new DataAuditService();
    }
    return DataAuditService.instance;
  }

  /**
   * Nuclear data wipe - Remove all app data
   * For testing and emergency cleanup
   */
  async performNuclearDataWipe(): Promise<{
    success: boolean;
    clearedItems: string[];
    errors: string[];
  }> {
    console.log('☢️ DATA AUDIT: Starting nuclear data wipe...');
    
    const clearedItems: string[] = [];
    const errors: string[] = [];

    try {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        console.log(`☢️ Found ${allKeys.length} AsyncStorage keys:`, allKeys);
        
        if (allKeys.length > 0) {
          await AsyncStorage.multiRemove(allKeys);
          clearedItems.push(`AsyncStorage: ${allKeys.length} items`);
        }
      } catch (error) {
        errors.push(`AsyncStorage: ${error}`);
      }

      try {
        const commonSecureKeys = [
          'authToken', 'userProfile', 'userSettings', 'biometricKey',
          'encryptionKey', 'sessionData', 'spotify_tokens', 'spotify_user_profile',
          'auth_token', 'user_profile', 'secure_session', 'biometric_data',
          'encryption_key', 'oauth_tokens', 'user_credentials', 'app_state'
        ];

        const possibleUserIds = await this.extractUserIdsFromStorage();
        const allSecureKeys = [
          ...commonSecureKeys,
          ...possibleUserIds.flatMap(userId => 
            commonSecureKeys.map(key => `${key}_${userId}`)
          )
        ];

        let secureItemsCleared = 0;
        for (const key of allSecureKeys) {
          try {
            await SecureStore.deleteItemAsync(key);
            secureItemsCleared++;
          } catch {
          }
        }

        if (secureItemsCleared > 0) {
          clearedItems.push(`SecureStore: ${secureItemsCleared} items`);
        }
      } catch (error) {
        errors.push(`SecureStore: ${error}`);
      }

      try {
        await dataManager.performCompleteLogout();
        clearedItems.push('DataManager: Complete logout');
      } catch (error) {
        errors.push(`DataManager: ${error}`);
      }

      console.log('☢️ DATA AUDIT: Nuclear wipe completed');
      return {
        success: errors.length === 0,
        clearedItems,
        errors
      };

    } catch (error) {
      console.error('☢️ DATA AUDIT: Nuclear wipe failed:', error);
      return {
        success: false,
        clearedItems,
        errors: [...errors, `Fatal: ${error}`]
      };
    }
  }

  async performDataAudit(): Promise<{
    asyncStorage: { key: string; preview: string }[];
    secureStore: string[];
    conversations: any[];
    emotions: any[];
    userIds: string[];
    totalItems: number;
    estimatedSize: string;
  }> {
    console.log('🔍 DATA AUDIT: Starting comprehensive audit...');

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const asyncStorage = await Promise.all(
        allKeys.map(async (key) => {
          try {
            const value = await AsyncStorage.getItem(key);
            return {
              key,
              preview: value ? value.substring(0, 100) + '...' : 'null'
            };
          } catch {
            return { key, preview: 'Error reading value' };
          }
        })
      );

      const userIds = await this.extractUserIdsFromStorage();

      let conversations: any[] = [];
      try {
        conversations = await conversationStorage.getAllConversations();
      } catch (error) {
        console.error('Error reading conversations:', error);
      }

      let emotions: any[] = [];
      try {
        emotions = await offlineEmotionStorage.getAllEmotions();
      } catch (error) {
        console.error('Error reading emotions:', error);
      }

      const secureStore = await this.auditSecureStore(userIds);

      const totalItems = asyncStorage.length + secureStore.length + conversations.length + emotions.length;
      const estimatedSize = this.calculateEstimatedSize(asyncStorage, conversations, emotions);

      console.log('🔍 DATA AUDIT: Audit completed');
      return {
        asyncStorage,
        secureStore,
        conversations,
        emotions,
        userIds,
        totalItems,
        estimatedSize
      };

    } catch (error) {
      console.error('🔍 DATA AUDIT: Audit failed:', error);
      return {
        asyncStorage: [],
        secureStore: [],
        conversations: [],
        emotions: [],
        userIds: [],
        totalItems: 0,
        estimatedSize: '0 KB'
      };
    }
  }

  async deleteUserAccount(userId: string): Promise<{
    success: boolean;
    serverDeletion: boolean;
    localDeletion: boolean;
    errors: string[];
  }> {
    console.log(`🗑️ DATA AUDIT: Deleting account for user ${userId}...`);

    const errors: string[] = [];
    let serverDeletion = false;
    let localDeletion = false;

    try {
      try {
        await ApiService.deleteAccount(userId);
        serverDeletion = true;
        console.log('✅ Server account deletion successful');
      } catch (error) {
        errors.push(`Server deletion failed: ${error}`);
        console.error('❌ Server account deletion failed:', error);
      }

      try {
        await dataManager.performCompleteLogout(userId);
        
        await this.deleteSpecificUserData(userId);
        
        localDeletion = true;
        console.log('✅ Local account deletion successful');
      } catch (error) {
        errors.push(`Local deletion failed: ${error}`);
        console.error('❌ Local account deletion failed:', error);
      }

      return {
        success: serverDeletion && localDeletion,
        serverDeletion,
        localDeletion,
        errors
      };

    } catch (error) {
      console.error('🗑️ DATA AUDIT: Account deletion failed:', error);
      return {
        success: false,
        serverDeletion,
        localDeletion,
        errors: [...errors, `Fatal: ${error}`]
      };
    }
  }

  /**
   * VERIFY DATA CLEANUP - Confirm no data remains
   */
  async verifyDataCleanup(userId?: string): Promise<{
    isClean: boolean;
    remainingData: string[];
    recommendations: string[];
  }> {
    console.log('✅ DATA AUDIT: Verifying data cleanup...');

    const remainingData: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const userRelatedKeys = userId ? 
        allKeys.filter(key => key.includes(userId)) : 
        allKeys;

      if (userRelatedKeys.length > 0) {
        remainingData.push(`AsyncStorage: ${userRelatedKeys.length} items`);
        recommendations.push('Run nuclear data wipe to clear AsyncStorage');
      }

      // Check conversations
      const conversations = await conversationStorage.getAllConversations();
      const userConversations = userId ? 
        conversations.filter(c => c.userId === userId) : 
        conversations;

      if (userConversations.length > 0) {
        remainingData.push(`Conversations: ${userConversations.length} items`);
        recommendations.push('Clear conversation storage');
      }

      // Check emotions
      const emotions = await offlineEmotionStorage.getAllEmotions();
      const userEmotions = userId ? 
        emotions.filter(e => e.userId === userId) : 
        emotions;

      if (userEmotions.length > 0) {
        remainingData.push(`Emotions: ${userEmotions.length} items`);
        recommendations.push('Clear emotion storage');
      }

      const isClean = remainingData.length === 0;

      console.log(`✅ DATA AUDIT: Cleanup verification ${isClean ? 'PASSED' : 'FAILED'}`);
      return {
        isClean,
        remainingData,
        recommendations
      };

    } catch (error) {
      console.error('✅ DATA AUDIT: Verification failed:', error);
      return {
        isClean: false,
        remainingData: [`Verification error: ${error}`],
        recommendations: ['Run nuclear data wipe']
      };
    }
  }

  async checkPrivacyCompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('🔒 DATA AUDIT: Checking privacy compliance...');

    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const audit = await this.performDataAudit();

      if (audit.conversations.length > 1000) {
        issues.push(`Excessive conversation retention: ${audit.conversations.length} items`);
        recommendations.push('Implement conversation cleanup policy');
      }

      if (audit.emotions.length > 500) {
        issues.push(`Excessive emotion retention: ${audit.emotions.length} items`);
        recommendations.push('Implement emotion cleanup policy');
      }

      const orphanedData = audit.asyncStorage.filter(item => 
        !audit.userIds.some(userId => item.key.includes(userId))
      );

      if (orphanedData.length > 0) {
        issues.push(`Orphaned data: ${orphanedData.length} items`);
        recommendations.push('Clean up orphaned data');
      }

      if (audit.userIds.length > 3) {
        issues.push(`Multiple user accounts: ${audit.userIds.length} users`);
        recommendations.push('Implement proper account switching');
      }

      const compliant = issues.length === 0;

      console.log(`🔒 DATA AUDIT: Privacy compliance ${compliant ? 'PASSED' : 'FAILED'}`);
      return {
        compliant,
        issues,
        recommendations
      };

    } catch (error) {
      console.error('🔒 DATA AUDIT: Privacy compliance check failed:', error);
      return {
        compliant: false,
        issues: [`Compliance check error: ${error}`],
        recommendations: ['Review data storage practices']
      };
    }
  }

  private async extractUserIdsFromStorage(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userIds = new Set<string>();

      for (const key of allKeys) {
        const match = key.match(/_([a-f0-9]{24})$/);
        if (match) {
          userIds.add(match[1]);
        }
      }

      return Array.from(userIds);
    } catch {
      return [];
    }
  }

  private async auditSecureStore(userIds: string[]): Promise<string[]> {
    const commonKeys = [
      'authToken', 'userProfile', 'userSettings', 'biometricKey',
      'encryptionKey', 'sessionData', 'spotify_tokens'
    ];

    const existingKeys: string[] = [];

    for (const key of commonKeys) {
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value) existingKeys.push(key);
              } catch {
        }
      }

      for (const userId of userIds) {
      for (const key of commonKeys) {
        try {
          const value = await SecureStore.getItemAsync(`${key}_${userId}`);
          if (value) existingKeys.push(`${key}_${userId}`);
        } catch {
        }
      }
    }

    return existingKeys;
  }

  private calculateEstimatedSize(
    asyncStorage: { key: string; preview: string }[],
    conversations: any[],
    emotions: any[]
  ): string {
    let totalBytes = 0;

    asyncStorage.forEach(item => {
      totalBytes += item.key.length + item.preview.length;
    });

    conversations.forEach(conv => {
      totalBytes += JSON.stringify(conv).length;
    });

    emotions.forEach(emotion => {
      totalBytes += JSON.stringify(emotion).length;
    });

    if (totalBytes < 1024) return `${totalBytes} B`;
    if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private async deleteSpecificUserData(userId: string): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const userKeys = allKeys.filter(key => key.includes(userId));
    
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
    }

    const commonKeys = [
      'authToken', 'userProfile', 'userSettings', 'biometricKey',
      'encryptionKey', 'sessionData', 'spotify_tokens'
    ];

    await Promise.allSettled(
      commonKeys.map(key => SecureStore.deleteItemAsync(`${key}_${userId}`))
    );
  }
}

export const dataAuditService = DataAuditService.getInstance();