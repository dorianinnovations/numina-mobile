import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Settings Service for React Native
 * Handles all user preferences, notifications, biometrics, and app settings
 */

export interface UserSettings {
  // Appearance
  themeMode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  themeColor: string;
  
  // Notifications
  pushNotifications: boolean;
  dailyCheckins: boolean;
  weeklyReports: boolean;
  notificationTime: string; // HH:MM format
  
  // Privacy & Security
  appLock: boolean;
  biometricsEnabled: boolean;
  analyticsSharing: boolean;
  dataPrivacy: 'private' | 'anonymous' | 'public';
  
  // Support & Feedback
  lastFeedbackDate?: string;
  appRated: boolean;
  helpViewed: boolean;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  dailyCheckins: boolean;
  weeklyReports: boolean;
  notificationTime: string;
}

class SettingsService {
  private static SETTINGS_KEY = 'numina_user_settings_v2';
  private static NOTIFICATION_SETTINGS_KEY = 'numina_notification_settings';
  private static BIOMETRICS_KEY = 'numina_biometrics_enabled';
  
  // Default settings
  private static defaultSettings: UserSettings = {
    themeMode: 'system',
    fontSize: 'medium',
    themeColor: '#6ec5ff',
    pushNotifications: true,
    dailyCheckins: false,
    weeklyReports: true,
    notificationTime: '09:00',
    appLock: false,
    biometricsEnabled: false,
    analyticsSharing: true,
    dataPrivacy: 'private',
    appRated: false,
    helpViewed: false,
  };

  // Load user settings
  static async loadSettings(): Promise<UserSettings> {
    try {
      const settings = await AsyncStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        return { ...this.defaultSettings, ...parsed };
      }
      return { ...this.defaultSettings };
    } catch (error) {
      console.error('Error loading settings:', error);
      return { ...this.defaultSettings };
    }
  }

  // Save user settings
  static async saveSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  // Update specific setting
  static async updateSetting<K extends keyof UserSettings>(
    key: K, 
    value: UserSettings[K]
  ): Promise<void> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error updating setting:', error);
      throw new Error('Failed to update setting');
    }
  }

  // Notification management
  static async setupNotifications(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return false;
      }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      return true;
    } catch (error) {
      console.error('Error setting up notifications:', error);
      return false;
    }
  }

  static async scheduleDailyCheckin(): Promise<void> {
    try {
      const settings = await this.loadSettings();
      if (!settings.dailyCheckins) return;

      // Cancel existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule daily check-in
      const [hour, minute] = settings.notificationTime.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for your daily check-in! 🌟",
          body: "How are you feeling today? Take a moment to reflect.",
          data: { type: 'daily_checkin' },
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling daily check-in:', error);
    }
  }

  static async scheduleWeeklyReport(): Promise<void> {
    try {
      const settings = await this.loadSettings();
      if (!settings.weeklyReports) return;

      // Schedule weekly report (every Sunday at 10 AM)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Your weekly wellness report is ready! 📊",
          body: "Check out your emotional insights from this week.",
          data: { type: 'weekly_report' },
        },
        trigger: {
          weekday: 0, // Sunday
          hour: 10,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling weekly report:', error);
    }
  }

  // Biometric authentication
  static async checkBiometricSupport(): Promise<{
    available: boolean;
    type: 'fingerprint' | 'face' | 'iris' | null;
  }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return { available: false, type: null };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      let biometricType: 'fingerprint' | 'face' | 'iris' | null = null;
      
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'face';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
      }

      return { available: true, type: biometricType };
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return { available: false, type: null };
    }
  }

  static async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Numina',
        fallbackLabel: 'Use passcode',
      });
      
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  static async enableBiometrics(): Promise<boolean> {
    try {
      const support = await this.checkBiometricSupport();
      if (!support.available) {
        throw new Error('Biometrics not available on this device');
      }

      const authenticated = await this.authenticateWithBiometrics();
      if (authenticated) {
        await this.updateSetting('biometricsEnabled', true);
        await AsyncStorage.setItem(this.BIOMETRICS_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling biometrics:', error);
      return false;
    }
  }

  static async disableBiometrics(): Promise<void> {
    try {
      await this.updateSetting('biometricsEnabled', false);
      await AsyncStorage.removeItem(this.BIOMETRICS_KEY);
    } catch (error) {
      console.error('Error disabling biometrics:', error);
    }
  }

  // App rating and feedback
  static async openAppStore(): Promise<void> {
    try {
      const appStoreUrl = Platform.select({
        ios: 'https://apps.apple.com/app/id123456789', // Replace with actual App Store ID
        android: 'https://play.google.com/store/apps/details?id=com.numina.app', // Replace with actual package name
      });
      
      if (appStoreUrl) {
        await Linking.openURL(appStoreUrl);
        await this.updateSetting('appRated', true);
      }
    } catch (error) {
      console.error('Error opening app store:', error);
    }
  }

  static async sendFeedback(): Promise<void> {
    try {
      const feedbackEmail = 'feedback@numina.app'; // Replace with actual email
      const subject = 'Numina App Feedback';
      const body = 'Hi Numina team,\n\nI would like to share the following feedback:\n\n';
      
      const mailtoUrl = `mailto:${feedbackEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      await Linking.openURL(mailtoUrl);
      await this.updateSetting('lastFeedbackDate', new Date().toISOString());
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  }

  static async openHelpCenter(): Promise<void> {
    try {
      const helpUrl = 'https://help.numina.app'; // Replace with actual help URL
      await Linking.openURL(helpUrl);
      await this.updateSetting('helpViewed', true);
    } catch (error) {
      console.error('Error opening help center:', error);
    }
  }

  // Data export and privacy
  static async exportUserData(): Promise<string> {
    try {
      const settings = await this.loadSettings();
      const userData = await AsyncStorage.getItem('numina_user_data_v2');
      const emotions = await AsyncStorage.getItem('userLoggedEmotions');
      
      const exportData = {
        settings,
        userData: userData ? JSON.parse(userData) : null,
        emotions: emotions ? JSON.parse(emotions) : [],
        exportDate: new Date().toISOString(),
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw new Error('Failed to clear data');
    }
  }

  // Analytics and privacy
  static async updateAnalyticsSharing(enabled: boolean): Promise<void> {
    try {
      await this.updateSetting('analyticsSharing', enabled);
      // Here you would typically send this preference to your analytics service
      console.log('Analytics sharing updated:', enabled);
    } catch (error) {
      console.error('Error updating analytics sharing:', error);
    }
  }

  static async updateDataPrivacy(privacy: 'private' | 'anonymous' | 'public'): Promise<void> {
    try {
      await this.updateSetting('dataPrivacy', privacy);
      // Here you would typically update privacy settings on your backend
      console.log('Data privacy updated:', privacy);
    } catch (error) {
      console.error('Error updating data privacy:', error);
    }
  }
}

export default SettingsService; 