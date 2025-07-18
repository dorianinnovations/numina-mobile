import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Import all enhanced services
import ApiService from './api';
import getWebSocketService from './websocketService';
import syncService from './syncService';
import appConfigService from './appConfigService';
import batchApiService from './batchApiService';
import offlineQueueService from './offlineQueue';
import SecureStorageService from './secureStorage';

/**
 * App Initializer Service
 * Coordinates initialization of all enhanced features
 */

interface InitializationStatus {
  apiService: 'pending' | 'success' | 'failed';
  websocket: 'pending' | 'success' | 'failed';
  appConfig: 'pending' | 'success' | 'failed';
  syncService: 'pending' | 'success' | 'failed';
  offlineQueue: 'pending' | 'success' | 'failed';
  pushNotifications: 'pending' | 'success' | 'failed';
  overall: 'pending' | 'success' | 'failed';
}

interface InitializationResult {
  success: boolean;
  status: InitializationStatus;
  errors: string[];
  warnings: string[];
  duration: number;
}

class AppInitializer {
  private static initializationStatus: InitializationStatus = {
    apiService: 'pending',
    websocket: 'pending',
    appConfig: 'pending',
    syncService: 'pending',
    offlineQueue: 'pending',
    pushNotifications: 'pending',
    overall: 'pending'
  };

  private static isInitialized = false;
  private static initializationPromise: Promise<InitializationResult> | null = null;

  /**
   * Initialize all app services
   */
  static async initialize(): Promise<InitializationResult> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return cached result if already initialized
    if (this.isInitialized) {
      return {
        success: true,
        status: this.initializationStatus,
        errors: [],
        warnings: [],
        duration: 0
      };
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  private static async performInitialization(): Promise<InitializationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('🚀 Starting app initialization...');

    try {
      // Step 1: Initialize API service and validate connection
      console.log('📡 Initializing API service...');
      try {
        const connected = await ApiService.checkConnection();
        if (connected) {
          this.initializationStatus.apiService = 'success';
          console.log('✅ API service initialized successfully');
        } else {
          this.initializationStatus.apiService = 'failed';
          errors.push('API service test failed');
        }
      } catch (error) {
        this.initializationStatus.apiService = 'failed';
        errors.push(`API service initialization failed: ${error}`);
      }

      // Step 2: Initialize app configuration
      console.log('⚙️ Loading app configuration...');
      try {
        const config = await appConfigService.initialize();
        this.initializationStatus.appConfig = 'success';
        console.log('✅ App configuration loaded successfully');
        
        // Update API base URL from config
        const endpoints = appConfigService.getEndpoints();
        
        if (endpoints.websocket) {
          // Use production WebSocket URL - no localhost fallbacks in production
          const wsUrl = process.env.EXPO_PUBLIC_WEBSOCKET_URL || endpoints.websocket;
          getWebSocketService().updateServerUrl(wsUrl);
        }
      } catch (error) {
        this.initializationStatus.appConfig = 'failed';
        errors.push(`App configuration failed: ${error}`);
      }

      // Step 3: Initialize offline queue service
      console.log('📦 Initializing offline queue...');
      try {
        await offlineQueueService.initialize();
        this.initializationStatus.offlineQueue = 'success';
        console.log('✅ Offline queue initialized successfully');
      } catch (error) {
        this.initializationStatus.offlineQueue = 'failed';
        errors.push(`Offline queue initialization failed: ${error}`);
      }

      // Step 4: Initialize sync service
      console.log('🔄 Initializing sync service...');
      try {
        await syncService.initialize();
        this.initializationStatus.syncService = 'success';
        console.log('✅ Sync service initialized successfully');
      } catch (error) {
        this.initializationStatus.syncService = 'failed';
        errors.push(`Sync service initialization failed: ${error}`);
      }

      // Step 5: Initialize WebSocket (if user is authenticated)
      console.log('🔌 Initializing WebSocket...');
      try {
        const token = await SecureStorageService.getToken();
        if (token) {
          const connected = await getWebSocketService().initialize();
          if (connected) {
            this.initializationStatus.websocket = 'success';
            console.log('✅ WebSocket connected successfully');
          } else {
            this.initializationStatus.websocket = 'failed';
            warnings.push('WebSocket connection failed - will retry when authenticated');
          }
        } else {
          this.initializationStatus.websocket = 'success';
          warnings.push('WebSocket not initialized - user not authenticated');
        }
      } catch (error) {
        this.initializationStatus.websocket = 'failed';
        warnings.push(`WebSocket initialization failed: ${error}`);
      }

      // Step 6: Initialize push notifications
      console.log('🔔 Initializing push notifications...');
      try {
        await this.initializePushNotifications();
        this.initializationStatus.pushNotifications = 'success';
        console.log('✅ Push notifications initialized successfully');
      } catch (error) {
        this.initializationStatus.pushNotifications = 'failed';
        warnings.push(`Push notifications initialization failed: ${error}`);
      }

      // Step 7: Setup network monitoring
      console.log('📶 Setting up network monitoring...');
      this.setupNetworkMonitoring();

      // Step 8: Setup app state monitoring
      console.log('📱 Setting up app state monitoring...');
      this.setupAppStateMonitoring();

      // Determine overall success
      const criticalServicesOk = this.initializationStatus.apiService === 'success' &&
                                this.initializationStatus.appConfig === 'success' &&
                                this.initializationStatus.offlineQueue === 'success' &&
                                this.initializationStatus.syncService === 'success';

      if (criticalServicesOk) {
        this.initializationStatus.overall = 'success';
        this.isInitialized = true;
      } else {
        this.initializationStatus.overall = 'failed';
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 App initialization completed in ${duration}ms`);

      return {
        success: this.initializationStatus.overall === 'success',
        status: this.initializationStatus,
        errors,
        warnings,
        duration
      };

    } catch (error) {
      console.error('❌ App initialization failed:', error);
      this.initializationStatus.overall = 'failed';
      
      return {
        success: false,
        status: this.initializationStatus,
        errors: [...errors, `Initialization failed: ${error}`],
        warnings,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Initialize push notifications
   */
  private static async initializePushNotifications(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Push notification permissions not granted');
      }

      // Configure notifications
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '720f015c-2618-4658-a225-f3690b9825d4',
      });

      // Register token with server
      const platform = Platform.OS as 'ios' | 'android';
      await ApiService.registerPushToken(token.data, platform);

      console.log('Push notification token registered:', token.data);

    } catch (error) {
      console.error('Push notifications setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup network monitoring
   */
  private static setupNetworkMonitoring(): void {
    NetInfo.addEventListener(state => {
      console.log('Network state changed:', state.isConnected);
      
      if (state.isConnected) {
        // Trigger sync when network is restored
        syncService.triggerSync({ includeOfflineQueue: true });
        
        // Reconnect WebSocket if needed
        const websocketService = getWebSocketService();
        if (!websocketService.isConnected()) {
          websocketService.initialize();
        }
      }
    });
  }

  /**
   * Setup app state monitoring
   */
  private static setupAppStateMonitoring(): void {
    // This would integrate with AppState from react-native
    // For now, we'll set up periodic sync
    setInterval(async () => {
      if (await syncService.isSyncNeeded()) {
        syncService.triggerSync({ dataTypes: ['emotions'] });
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Initialize WebSocket after authentication
   */
  static async initializeWebSocketAfterAuth(): Promise<boolean> {
    try {
      console.log('🔌 Initializing WebSocket after authentication...');
      
      const connected = await getWebSocketService().initialize();
      
      if (connected) {
        this.initializationStatus.websocket = 'success';
        console.log('✅ WebSocket connected after authentication');
        return true;
      } else {
        this.initializationStatus.websocket = 'failed';
        console.log('❌ WebSocket connection failed after authentication');
        return false;
      }
    } catch (error) {
      console.error('WebSocket initialization after auth failed:', error);
      this.initializationStatus.websocket = 'failed';
      return false;
    }
  }

  /**
   * Perform initial data sync
   */
  static async performInitialDataSync(): Promise<void> {
    try {
      console.log('🔄 Performing initial data sync...');
      
      // Get initial data using batch API
      const initialData = await batchApiService.getInitialData();
      console.log('Initial data loaded:', initialData);
      
      // Trigger full sync
      await syncService.forceFullSync();
      
      console.log('✅ Initial data sync completed');
    } catch (error) {
      console.error('Initial data sync failed:', error);
      throw error;
    }
  }

  /**
   * Check if app is initialized
   */
  static isAppInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get initialization status
   */
  static getInitializationStatus(): InitializationStatus {
    return { ...this.initializationStatus };
  }

  /**
   * Reset initialization state
   */
  static reset(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.initializationStatus = {
      apiService: 'pending',
      websocket: 'pending',
      appConfig: 'pending',
      syncService: 'pending',
      offlineQueue: 'pending',
      pushNotifications: 'pending',
      overall: 'pending'
    };
  }

  /**
   * Cleanup services
   */
  static cleanup(): void {
    console.log('🧹 Cleaning up app services...');
    
    try {
      getWebSocketService().disconnect();
      syncService.cleanup();
      batchApiService.clearBatch();
      
      console.log('✅ App services cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Get service health status
   */
  static async getHealthStatus(): Promise<{
    services: InitializationStatus;
    connectivity: boolean;
    lastSync: string;
    batchStats: any;
  }> {
    try {
      const netInfo = await NetInfo.fetch();
      const syncStatus = await syncService.getSyncStatus();
      const batchStats = batchApiService.getStats();
      
      return {
        services: this.initializationStatus,
        connectivity: netInfo.isConnected || false,
        lastSync: syncStatus.lastSync,
        batchStats
      };
    } catch (error) {
      console.error('Failed to get health status:', error);
      throw error;
    }
  }

  /**
   * Reinitialize failed services
   */
  static async reinitializeFailedServices(): Promise<InitializationResult> {
    console.log('🔄 Reinitializing failed services...');
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Reinitialize failed services
    if (this.initializationStatus.websocket === 'failed') {
      try {
        const connected = await getWebSocketService().initialize();
        if (connected) {
          this.initializationStatus.websocket = 'success';
        }
      } catch (error) {
        errors.push(`WebSocket reinit failed: ${error}`);
      }
    }
    
    if (this.initializationStatus.pushNotifications === 'failed') {
      try {
        await this.initializePushNotifications();
        this.initializationStatus.pushNotifications = 'success';
      } catch (error) {
        warnings.push(`Push notifications reinit failed: ${error}`);
      }
    }
    
    return {
      success: errors.length === 0,
      status: this.initializationStatus,
      errors,
      warnings,
      duration: 0
    };
  }
}

export default AppInitializer;
export type { InitializationStatus, InitializationResult };