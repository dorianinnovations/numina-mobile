import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
  Alert,
  AlertButton,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';
import SettingsService, { UserSettings } from '../services/settingsService';
import { NuminaAnimations } from '../utils/animations';

interface SettingsScreenProps {
  onNavigateBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userSettings = await SettingsService.loadSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = async (key: keyof UserSettings, value: any) => {
    try {
      await SettingsService.updateSetting(key, value);
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      
      // Handle specific setting changes
      if (key === 'pushNotifications') {
        if (value) {
          const success = await SettingsService.setupNotifications();
          if (!success) {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in your device settings to receive wellness reminders.',
              [{ text: 'OK' }]
            );
          }
        }
      } else if (key === 'dailyCheckins') {
        if (value) {
          await SettingsService.scheduleDailyCheckin();
        }
      } else if (key === 'weeklyReports') {
        if (value) {
          await SettingsService.scheduleWeeklyReport();
        }
      } else if (key === 'appLock') {
        if (value) {
          const biometricSupport = await SettingsService.checkBiometricSupport();
          if (!biometricSupport.available) {
            Alert.alert(
              'Biometrics Not Available',
              'Your device does not support biometric authentication.',
              [{ text: 'OK' }]
            );
            // Revert the setting
            await SettingsService.updateSetting('appLock', false);
            setSettings(prev => prev ? { ...prev, appLock: false } : null);
            return;
          }
        }
      } else if (key === 'analyticsSharing') {
        await SettingsService.updateAnalyticsSharing(value);
      }

      NuminaAnimations.haptic.light();
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleNavigate = async (action: string) => {
    try {
      NuminaAnimations.haptic.medium();
      
      switch (action) {
        case 'themeColor':
          Alert.alert(
            'Theme Color',
            'Theme color customization will be available in a future update.',
            [{ text: 'OK' }]
          );
          break;
          
        case 'fontSize':
          Alert.alert(
            'Font Size',
            'Font size adjustment will be available in a future update.',
            [{ text: 'OK' }]
          );
          break;
          
        case 'dataPrivacy':
          showDataPrivacyOptions();
          break;
          
        case 'helpCenter':
          await SettingsService.openHelpCenter();
          break;
          
        case 'sendFeedback':
          await SettingsService.sendFeedback();
          break;
          
        case 'rateApp':
          await SettingsService.openAppStore();
          break;
          
        default:
          console.log('Unknown navigation action:', action);
      }
    } catch (error) {
      console.error('Error handling navigation:', error);
      Alert.alert('Error', 'Failed to perform action. Please try again.');
    }
  };

  const showDataPrivacyOptions = () => {
    // Light haptic for opening options
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const options: AlertButton[] = [
      { text: 'Private', onPress: () => handleDataPrivacyChange('private') },
      { text: 'Anonymous', onPress: () => handleDataPrivacyChange('anonymous') },
      { text: 'Public', onPress: () => handleDataPrivacyChange('public') },
      { text: 'Cancel', style: 'cancel' },
    ];

    Alert.alert(
      'Data Privacy',
      'Choose how your data is shared:',
      options
    );
  };

  const handleDataPrivacyChange = async (privacy: 'private' | 'anonymous' | 'public') => {
    try {
      await SettingsService.updateDataPrivacy(privacy);
      setSettings(prev => prev ? { ...prev, dataPrivacy: privacy } : null);
      NuminaAnimations.haptic.success();
    } catch (error) {
      console.error('Error updating data privacy:', error);
      Alert.alert('Error', 'Failed to update privacy settings.');
    }
  };

  const handleBiometricsToggle = async () => {
    try {
      if (settings?.biometricsEnabled) {
        // Disable biometrics
        await SettingsService.disableBiometrics();
        setSettings(prev => prev ? { ...prev, biometricsEnabled: false } : null);
        NuminaAnimations.haptic.success();
      } else {
        // Enable biometrics
        const success = await SettingsService.enableBiometrics();
        if (success) {
          setSettings(prev => prev ? { ...prev, biometricsEnabled: true } : null);
          NuminaAnimations.haptic.success();
        } else {
          Alert.alert(
            'Authentication Failed',
            'Please try again or use your device passcode.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error toggling biometrics:', error);
      Alert.alert('Error', 'Failed to update biometric settings.');
    }
  };

  if (loading || !settings) {
    return (
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />
          <View style={[styles.loadingContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={[styles.loadingText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Loading settings...
            </Text>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  const settingsSections = [
    {
      title: 'Appearance',
      items: [
        { 
          icon: 'moon', 
          title: 'Dark Mode', 
          desc: 'Toggle between light and dark theme',
          type: 'switch',
          value: isDarkMode,
          onToggle: toggleTheme,
        },
        { 
          icon: 'palette', 
          title: 'Theme Color', 
          desc: 'Customize your theme colors', 
          type: 'navigate',
          action: 'themeColor'
        },
        { 
          icon: 'text-height', 
          title: 'Font Size', 
          desc: 'Adjust text size for readability', 
          type: 'navigate',
          action: 'fontSize'
        },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { 
          icon: 'bell', 
          title: 'Push Notifications', 
          desc: 'Receive wellness reminders', 
          type: 'switch', 
          value: settings.pushNotifications,
          onToggle: (value: boolean) => handleSettingToggle('pushNotifications', value)
        },
        { 
          icon: 'clock', 
          title: 'Daily Check-ins', 
          desc: 'Remind me to log my mood', 
          type: 'switch', 
          value: settings.dailyCheckins,
          onToggle: (value: boolean) => handleSettingToggle('dailyCheckins', value)
        },
        { 
          icon: 'calendar', 
          title: 'Weekly Reports', 
          desc: 'Get weekly wellness summaries', 
          type: 'switch', 
          value: settings.weeklyReports,
          onToggle: (value: boolean) => handleSettingToggle('weeklyReports', value)
        },
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { 
          icon: 'shield-alt', 
          title: 'Data Privacy', 
          desc: 'Manage your data preferences', 
          type: 'navigate',
          action: 'dataPrivacy'
        },
        { 
          icon: 'lock', 
          title: 'App Lock', 
          desc: 'Secure app with biometrics', 
          type: 'switch', 
          value: settings.appLock,
          onToggle: (value: boolean) => handleSettingToggle('appLock', value)
        },
        { 
          icon: 'eye-slash', 
          title: 'Analytics Sharing', 
          desc: 'Share anonymous usage data', 
          type: 'switch', 
          value: settings.analyticsSharing,
          onToggle: (value: boolean) => handleSettingToggle('analyticsSharing', value)
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          icon: 'question-circle', 
          title: 'Help Center', 
          desc: 'Get help and support', 
          type: 'navigate',
          action: 'helpCenter'
        },
        { 
          icon: 'comment-dots', 
          title: 'Send Feedback', 
          desc: 'Help us improve Numina', 
          type: 'navigate',
          action: 'sendFeedback'
        },
        { 
          icon: 'star', 
          title: 'Rate App', 
          desc: 'Rate us on the App Store', 
          type: 'navigate',
          action: 'rateApp'
        },
      ]
    },
  ];

  const renderSettingItem = (item: any, index: number) => {
    const handleSwitchToggle = (value: boolean) => {
      if (item.onToggle) {
        item.onToggle(value);
      }
    };

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.settingItem,
          {
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
          }
        ]}
        activeOpacity={item.type === 'switch' ? 1 : 0.7}
        onPress={item.type === 'navigate' ? () => handleNavigate(item.action) : undefined}
        disabled={item.type === 'switch'}
      >
        <View style={[
          styles.settingIcon,
          {
            backgroundColor: isDarkMode ? 'rgba(110, 197, 255, 0.1)' : 'rgba(110, 197, 255, 0.15)',
          }
        ]}>
          <FontAwesome5 
            name={item.icon as any} 
            size={16} 
            color={isDarkMode ? '#ffffff' : '#6ec5ff'} 
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.settingDesc,
            { color: isDarkMode ? '#888888' : '#666666' }
          ]}>
            {item.desc}
          </Text>
        </View>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={handleSwitchToggle}
            trackColor={{ false: '#767577', true: '#6ec5ff' }}
            thumbColor={item.value ? '#6ec5ff' : '#f4f3f4'}
            style={{ 
              transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
              borderRadius: 4,
            }}
          />
        ) : (
          <FontAwesome5 
            name="chevron-right" 
            size={12} 
            color={isDarkMode ? '#666666' : '#999999'} 
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        <Header
          showBackButton={true}
          onBackPress={onNavigateBack}
          title="Settings"
        />

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' }
              ]}>
                {section.title}
              </Text>
              <View style={styles.sectionItems}>
                {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 120,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  sectionItems: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    height: 38 * 1.8, 
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
});