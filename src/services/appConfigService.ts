import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService, { AppConfig } from './api';

/**
 * App Configuration Service
 * Manages dynamic app configuration from server
 */

interface CachedConfig {
  config: AppConfig;
  timestamp: number;
  version: string;
}

interface ConfigState {
  isLoaded: boolean;
  isLoading: boolean;
  lastUpdated: number;
  version: string;
  config: AppConfig | null;
  error: string | null;
}

class AppConfigService {
  private static readonly CONFIG_KEY = 'app_config';
  private static readonly CONFIG_STATE_KEY = 'app_config_state';
  private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private static readonly RETRY_DELAY = 5000; // 5 seconds
  private static readonly MAX_RETRIES = 3;

  private static configState: ConfigState = {
    isLoaded: false,
    isLoading: false,
    lastUpdated: 0,
    version: '1.0.0',
    config: null,
    error: null
  };

  private static listeners: Array<(config: AppConfig) => void> = [];

  /**
   * Initialize app configuration
   */
  static async initialize(): Promise<AppConfig> {
    try {
      this.configState.isLoading = true;
      this.configState.error = null;

      // Try to load from cache first
      const cachedConfig = await this.getCachedConfig();
      
      if (cachedConfig && this.isCacheValid(cachedConfig)) {
        this.configState.config = cachedConfig.config;
        this.configState.isLoaded = true;
        this.configState.isLoading = false;
        this.configState.lastUpdated = cachedConfig.timestamp;
        this.configState.version = cachedConfig.version;
        
        console.log('App config loaded from cache');
        this.notifyListeners(cachedConfig.config);
        
        // Fetch updated config in background
        this.fetchConfigInBackground();
        
        return cachedConfig.config;
      }

      // No valid cache, fetch from server
      const config = await this.fetchConfigFromServer();
      
      if (config) {
        await this.cacheConfig(config);
        this.configState.config = config;
        this.configState.isLoaded = true;
        this.configState.lastUpdated = Date.now();
        this.configState.version = config.version;
        
        console.log('App config loaded from server');
        this.notifyListeners(config);
        
        return config;
      }

      // Fallback to default config
      const defaultConfig = this.getDefaultConfig();
      this.configState.config = defaultConfig;
      this.configState.isLoaded = true;
      this.configState.error = 'Using default configuration';
      
      console.warn('Using default app configuration');
      this.notifyListeners(defaultConfig);
      
      return defaultConfig;

    } catch (error) {
      console.error('Failed to initialize app config:', error);
      
      this.configState.isLoading = false;
      this.configState.error = error instanceof Error ? error.message : 'Config initialization failed';
      
      // Return default config on error
      const defaultConfig = this.getDefaultConfig();
      this.configState.config = defaultConfig;
      this.configState.isLoaded = true;
      
      return defaultConfig;
    } finally {
      this.configState.isLoading = false;
    }
  }

  /**
   * Get current configuration
   */
  static getConfig(): AppConfig | null {
    return this.configState.config;
  }

  /**
   * Get configuration state
   */
  static getConfigState(): ConfigState {
    return { ...this.configState };
  }

  /**
   * Check if feature is enabled
   */
  static isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
    const config = this.getConfig();
    return config?.features[feature] || false;
  }

  /**
   * Get API limits
   */
  static getApiLimits(): AppConfig['limits'] {
    const config = this.getConfig();
    return config?.limits || this.getDefaultConfig().limits;
  }

  /**
   * Get endpoints configuration
   */
  static getEndpoints(): AppConfig['endpoints'] {
    const config = this.getConfig();
    return config?.endpoints || this.getDefaultConfig().endpoints;
  }

  /**
   * Get user preferences
   */
  static getUserPreferences(): any {
    const config = this.getConfig();
    return config?.user?.preferences || {};
  }

  /**
   * Get user settings
   */
  static getUserSettings(): any {
    const config = this.getConfig();
    return config?.user?.settings || {};
  }

  /**
   * Refresh configuration from server
   */
  static async refreshConfig(): Promise<AppConfig> {
    try {
      this.configState.isLoading = true;
      this.configState.error = null;

      const config = await this.fetchConfigFromServer();
      
      if (config) {
        await this.cacheConfig(config);
        
        const oldConfig = this.configState.config;
        this.configState.config = config;
        this.configState.lastUpdated = Date.now();
        this.configState.version = config.version;
        
        // Check if config changed
        if (oldConfig && JSON.stringify(oldConfig) !== JSON.stringify(config)) {
          console.log('App config updated');
          this.notifyListeners(config);
        }
        
        return config;
      }

      throw new Error('Failed to fetch config from server');

    } catch (error) {
      console.error('Failed to refresh config:', error);
      this.configState.error = error instanceof Error ? error.message : 'Config refresh failed';
      
      // Return current config if refresh fails
      return this.configState.config || this.getDefaultConfig();
    } finally {
      this.configState.isLoading = false;
    }
  }

  /**
   * Fetch configuration from server
   */
  private static async fetchConfigFromServer(): Promise<AppConfig | null> {
    let retryCount = 0;
    let lastError: string | null = null;

    while (retryCount < this.MAX_RETRIES) {
      try {
        const response = await ApiService.getAppConfig();
        
        if (response.success && response.data) {
          return response.data;
        }
        
        lastError = response.error || 'Failed to fetch config';
        retryCount++;
        
        if (retryCount < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Network error';
        retryCount++;
        
        if (retryCount < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    console.error('Failed to fetch config after retries:', lastError);
    return null;
  }

  /**
   * Fetch config in background
   */
  private static async fetchConfigInBackground(): Promise<void> {
    try {
      const config = await this.fetchConfigFromServer();
      
      if (config) {
        await this.cacheConfig(config);
        
        // Only update if config changed
        if (JSON.stringify(this.configState.config) !== JSON.stringify(config)) {
          this.configState.config = config;
          this.configState.lastUpdated = Date.now();
          this.configState.version = config.version;
          
          console.log('App config updated in background');
          this.notifyListeners(config);
        }
      }
    } catch (error) {
      console.error('Background config fetch failed:', error);
    }
  }

  /**
   * Cache configuration
   */
  private static async cacheConfig(config: AppConfig): Promise<void> {
    try {
      const cachedConfig: CachedConfig = {
        config,
        timestamp: Date.now(),
        version: config.version
      };
      
      await AsyncStorage.setItem(this.CONFIG_KEY, JSON.stringify(cachedConfig));
    } catch (error) {
      console.error('Failed to cache config:', error);
    }
  }

  /**
   * Get cached configuration
   */
  private static async getCachedConfig(): Promise<CachedConfig | null> {
    try {
      const cachedJson = await AsyncStorage.getItem(this.CONFIG_KEY);
      
      if (!cachedJson) {
        return null;
      }
      
      return JSON.parse(cachedJson);
    } catch (error) {
      console.error('Failed to get cached config:', error);
      return null;
    }
  }

  /**
   * Check if cache is valid
   */
  private static isCacheValid(cachedConfig: CachedConfig): boolean {
    const now = Date.now();
    const age = now - cachedConfig.timestamp;
    
    return age < this.CACHE_DURATION;
  }

  /**
   * Get default configuration
   */
  private static getDefaultConfig(): AppConfig {
    return {
      features: {
        realTimeChat: true,
        offlineMode: true,
        pushNotifications: true,
        analyticsLLM: true,
        cloudEvents: true,
        emotionalTracking: true,
        adaptivePersonality: true
      },
      limits: {
        batchRequestLimit: 10,
        offlineQueueLimit: 100,
        messageLengthLimit: 2000,
        fileUploadLimit: 5242880 // 5MB
      },
      endpoints: {
        websocket: 'wss://server-a7od.onrender.com',
        api: 'https://server-a7od.onrender.com',
        cdn: undefined
      },
      user: {
        preferences: {},
        settings: {}
      },
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Add configuration change listener
   */
  static addListener(listener: (config: AppConfig) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove configuration change listener
   */
  static removeListener(listener: (config: AppConfig) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners of configuration changes
   */
  private static notifyListeners(config: AppConfig): void {
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Error in config listener:', error);
      }
    });
  }

  /**
   * Update local user preferences
   */
  static async updateUserPreferences(preferences: any): Promise<void> {
    try {
      const currentConfig = this.getConfig();
      
      if (currentConfig) {
        currentConfig.user.preferences = {
          ...currentConfig.user.preferences,
          ...preferences
        };
        
        await this.cacheConfig(currentConfig);
        this.notifyListeners(currentConfig);
      }
    } catch (error) {
      console.error('Failed to update user preferences:', error);
    }
  }

  /**
   * Update local user settings
   */
  static async updateUserSettings(settings: any): Promise<void> {
    try {
      const currentConfig = this.getConfig();
      
      if (currentConfig) {
        currentConfig.user.settings = {
          ...currentConfig.user.settings,
          ...settings
        };
        
        await this.cacheConfig(currentConfig);
        this.notifyListeners(currentConfig);
      }
    } catch (error) {
      console.error('Failed to update user settings:', error);
    }
  }

  /**
   * Clear cached configuration
   */
  static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CONFIG_KEY);
      await AsyncStorage.removeItem(this.CONFIG_STATE_KEY);
      
      this.configState = {
        isLoaded: false,
        isLoading: false,
        lastUpdated: 0,
        version: '1.0.0',
        config: null,
        error: null
      };
      
      console.log('App config cache cleared');
    } catch (error) {
      console.error('Failed to clear config cache:', error);
    }
  }

  /**
   * Get configuration info
   */
  static getConfigInfo(): {
    version: string;
    lastUpdated: number;
    isLoaded: boolean;
    isLoading: boolean;
    error: string | null;
  } {
    return {
      version: this.configState.version,
      lastUpdated: this.configState.lastUpdated,
      isLoaded: this.configState.isLoaded,
      isLoading: this.configState.isLoading,
      error: this.configState.error
    };
  }

  /**
   * Check if config needs refresh
   */
  static needsRefresh(): boolean {
    const now = Date.now();
    const age = now - this.configState.lastUpdated;
    
    return age > this.CACHE_DURATION;
  }

  /**
   * Enable/disable feature locally
   */
  static setFeatureEnabled(feature: keyof AppConfig['features'], enabled: boolean): void {
    const config = this.getConfig();
    
    if (config) {
      config.features[feature] = enabled;
      this.notifyListeners(config);
    }
  }
}

export default AppConfigService;
export type { AppConfig, ConfigState, CachedConfig };