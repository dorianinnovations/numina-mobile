import React, { useState, useEffect, useRef } from 'react';
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
  RefreshControl,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/SimpleAuthContext';
import { PageBackground } from '../components/PageBackground';
import { Header } from '../components/Header';
import SettingsService, { UserSettings } from '../services/settingsService';
import { NuminaAnimations } from '../utils/animations';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useBorderSettings } from '../contexts/BorderSettingsContext';
import ApiService from '../services/api';

interface SettingsScreenProps {
  onNavigateBack: () => void;
  onNavigateToSignIn?: () => void;
  onNavigateToBorderThemes?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateBack,
  onNavigateToSignIn,
  onNavigateToBorderThemes,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout, isAuthenticated } = useAuth();
  const { updateBorderSetting, effectsEnabled, brightness, speed, direction, variation } = useBorderSettings();
  
  // Pull-to-refresh functionality
  const { refreshControl: refreshControlProps } = usePullToRefresh(async () => {
    await loadSettings();
  });
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Animation values for delete modal
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.3)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const trashScale = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  // Load settings on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
          
        case 'deleteAccount':
          showDeleteAccountModal();
          break;
          
        case 'signIn':
          // Navigate to sign in for unauthenticated users
          if (onNavigateToSignIn) {
            onNavigateToSignIn();
          } else {
            onNavigateBack(); // Fallback to going back
          }
          break;
          
        case 'borderThemes':
          if (onNavigateToBorderThemes) {
            onNavigateToBorderThemes();
          }
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

  const showDeleteAccountModal = () => {
    setShowDeleteModal(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(containerScale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideDeleteModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDeleteModal(false);
      setIsDeleting(false);
      // Reset animation values
      trashScale.setValue(1);
      checkOpacity.setValue(0);
    });
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // Animate trash can
      Animated.sequence([
        Animated.timing(trashScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(trashScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Call delete account API
      const response = await ApiService.deleteAccount();
      
      if (response.success) {
        // Show success animation
        setTimeout(() => {
          Animated.timing(checkOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 400);

        // Wait a moment then logout and close modal
        setTimeout(() => {
          logout();
          hideDeleteModal();
        }, 1500);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Failed to delete account:', error);
      Alert.alert(
        'Error',
        'Failed to delete account. Please try again or contact support.',
        [{ text: 'OK' }]
      );
      setIsDeleting(false);
    }
  };

  if (loading || (isAuthenticated && !settings)) {
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

  // Define settings sections based on authentication status
  const getSettingsSections = () => {
    if (!isAuthenticated) {
      // Limited settings for unauthenticated users
      return [
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
              icon: 'magic', 
              title: 'Border Effects', 
              desc: 'Enable/disable animated border effects', 
              type: 'switch',
              value: true, // Default enabled for unauthenticated users
              onToggle: (value: boolean) => {
                // For unauthenticated users, just show an info message
                if (!value) {
                  Alert.alert(
                    'Border Effects Disabled',
                    'Border effects have been temporarily disabled. Sign in to save your preferences.',
                    [{ text: 'OK' }]
                  );
                }
              }
            },
            { 
              icon: 'palette', 
              title: 'Border Themes', 
              desc: 'Customize border colors and styles', 
              type: 'navigate',
              action: 'borderThemes'
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
        {
          title: 'Account',
          items: [
            { 
              icon: 'sign-in-alt', 
              title: 'Sign In', 
              desc: 'Access your account and all features', 
              type: 'navigate',
              action: 'signIn'
            },
          ]
        },
      ];
    }
    
    // Full settings for authenticated users
    return [
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
          icon: 'magic', 
          title: 'Border Effects', 
          desc: 'Enable/disable animated border effects', 
          type: 'switch',
          value: effectsEnabled,
          onToggle: (value: boolean) => updateBorderSetting('effectsEnabled', value)
        },
        ...(effectsEnabled ? [
          { 
            icon: 'sun', 
            title: 'Border Brightness', 
            desc: `Adjust brightness level (${brightness}%)`, 
            type: 'slider',
            value: brightness,
            onValueChange: (value: number) => updateBorderSetting('brightness', value)
          },
          { 
            icon: 'tachometer-alt', 
            title: 'Border Speed', 
            desc: `Animation speed (${speed === 1 ? 'Slow' : speed === 2 ? 'Medium' : 'Fast'})`, 
            type: 'segmented',
            value: speed,
            options: [
              { label: 'Slow', value: 1 },
              { label: 'Med', value: 2 },
              { label: 'Fast', value: 3 }
            ],
            onValueChange: (value: number) => updateBorderSetting('speed', value)
          },
          { 
            icon: 'arrows-spin', 
            title: 'Border Direction', 
            desc: `Animation direction (${direction === 'clockwise' ? 'Clockwise' : 'Counter-clockwise'})`, 
            type: 'segmented',
            value: direction,
            options: [
              { label: 'CW', value: 'clockwise' },
              { label: 'CCW', value: 'counterclockwise' }
            ],
            onValueChange: (value: string) => updateBorderSetting('direction', value)
          },
          { 
            icon: 'wave-square', 
            title: 'Border Style', 
            desc: `Animation variation (${variation.charAt(0).toUpperCase() + variation.slice(1)})`, 
            type: 'segmented',
            value: variation,
            options: [
              { label: 'Smooth', value: 'smooth' },
              { label: 'Pulse', value: 'pulse' },
              { label: 'Wave', value: 'wave' }
            ],
            onValueChange: (value: string) => updateBorderSetting('variation', value)
          }
        ] : []),
        { 
          icon: 'palette', 
          title: 'Border Themes', 
          desc: 'Customize border colors and styles', 
          type: 'navigate',
          action: 'borderThemes'
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
          value: settings?.pushNotifications ?? false,
          onToggle: (value: boolean) => handleSettingToggle('pushNotifications', value)
        },
        { 
          icon: 'clock', 
          title: 'Daily Check-ins', 
          desc: 'Remind me to log my mood', 
          type: 'switch', 
          value: settings?.dailyCheckins ?? false,
          onToggle: (value: boolean) => handleSettingToggle('dailyCheckins', value)
        },
        { 
          icon: 'calendar', 
          title: 'Weekly Reports', 
          desc: 'Get weekly wellness summaries', 
          type: 'switch', 
          value: settings?.weeklyReports ?? false,
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
          value: settings?.appLock ?? false,
          onToggle: (value: boolean) => handleSettingToggle('appLock', value)
        },
        { 
          icon: 'eye-slash', 
          title: 'Analytics Sharing', 
          desc: 'Share anonymous usage data', 
          type: 'switch', 
          value: settings?.analyticsSharing ?? false,
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
    {
      title: 'Account',
      items: [
        { 
          icon: 'trash-alt', 
          title: 'Delete Account', 
          desc: 'Permanently delete your account and all data', 
          type: 'navigate',
          action: 'deleteAccount',
          destructive: true
        },
      ]
    },
    ];
  };
  
  const settingsSections = getSettingsSections();

  const renderSettingItem = (item: any, index: number) => {
    const handleSwitchToggle = (value: boolean) => {
      if (item.onToggle) {
        item.onToggle(value);
      }
    };

    const handleSliderChange = (value: number) => {
      if (item.onValueChange) {
        item.onValueChange(Math.round(value));
      }
    };

    const handleSegmentedChange = (value: any) => {
      if (item.onValueChange) {
        item.onValueChange(value);
      }
    };

    if (item.type === 'segmented') {
      return (
        <View
          key={index}
          style={[
            styles.settingItem,
            styles.sliderItem,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}
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
            <View style={styles.segmentedControl}>
              {item.options?.map((option: any, optionIndex: number) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.segmentedOption,
                    {
                      backgroundColor: item.value === option.value 
                        ? (isDarkMode ? '#6ec5ff' : '#6ec5ff')
                        : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                    }
                  ]}
                  onPress={() => {
                    handleSegmentedChange(option.value);
                    NuminaAnimations.haptic.light();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.segmentedText,
                    {
                      color: item.value === option.value 
                        ? '#ffffff' 
                        : (isDarkMode ? '#ffffff' : '#000000'),
                      fontWeight: item.value === option.value ? '600' : '400',
                    }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    if (item.type === 'slider') {
      return (
        <View
          key={index}
          style={[
            styles.settingItem,
            styles.sliderItem,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}
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
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={100}
              value={item.value}
              onValueChange={handleSliderChange}
              onSlidingComplete={(value) => {
                handleSliderChange(value);
                NuminaAnimations.haptic.light();
              }}
              minimumTrackTintColor={isDarkMode ? '#6ec5ff' : '#6ec5ff'}
              maximumTrackTintColor={isDarkMode ? '#333333' : '#cccccc'}
            />
          </View>
        </View>
      );
    }

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
        activeOpacity={item.type === 'switch' || item.type === 'slider' ? 1 : 0.7}
        onPress={item.type === 'navigate' ? () => handleNavigate(item.action) : undefined}
        disabled={item.type === 'switch' || item.type === 'slider'}
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
          refreshControl={
            isAuthenticated ? <RefreshControl {...refreshControlProps} /> : undefined
          }
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

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <Animated.View style={[
            styles.successOverlay,
            {
              opacity: overlayOpacity,
            }
          ]}>
            <Animated.View style={[
              styles.successContainer,
              {
                backgroundColor: isDarkMode ? '#1a1a1a' : '#add5fa',
                borderColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.3)',
                opacity: containerOpacity,
                transform: [{ scale: containerScale }],
              }
            ]}>
              {!isDeleting ? (
                <>
                  <FontAwesome5 
                    name="exclamation-triangle" 
                    size={48} 
                    color={isDarkMode ? '#ff6b6b' : '#e53e3e'} 
                  />
                  
                  <Text style={[
                    styles.successTitle,
                    { color: isDarkMode ? '#ffffff' : '#4a5568' }
                  ]}>
                    Delete Account?
                  </Text>
                  
                  <Text style={[
                    styles.successMessage,
                    { color: isDarkMode ? '#a0aec0' : '#718096' }
                  ]}>
                    This action cannot be undone. All your data will be permanently deleted.
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                    <TouchableOpacity
                      style={[
                        styles.closeButton,
                        {
                          backgroundColor: isDarkMode ? '#374151' : '#e2e8f0',
                          flex: 1,
                        }
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        hideDeleteModal();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.closeButtonText,
                        { color: isDarkMode ? '#ffffff' : '#4a5568' }
                      ]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.closeButton,
                        {
                          backgroundColor: isDarkMode ? '#dc2626' : '#e53e3e',
                          flex: 1,
                        }
                      ]}
                      onPress={confirmDeleteAccount}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.closeButtonText,
                        { color: '#ffffff' }
                      ]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Animated.View
                    style={{
                      transform: [{ scale: trashScale }]
                    }}
                  >
                    <FontAwesome5 
                      name="trash-alt" 
                      size={48} 
                      color={isDarkMode ? '#dc2626' : '#e53e3e'} 
                    />
                  </Animated.View>
                  
                  <Animated.View
                    style={{
                      opacity: checkOpacity,
                      position: 'absolute',
                    }}
                  >
                    <FontAwesome5 
                      name="check-circle" 
                      size={48} 
                      color={isDarkMode ? '#6ec5ff' : '#4a5568'} 
                    />
                  </Animated.View>
                  
                  <Text style={[
                    styles.successTitle,
                    { color: isDarkMode ? '#ffffff' : '#4a5568' }
                  ]}>
                    Account Deleted
                  </Text>
                  
                  <Text style={[
                    styles.successMessage,
                    { color: isDarkMode ? '#a0aec0' : '#718096' }
                  ]}>
                    Your account and all data have been permanently removed
                  </Text>
                </>
              )}
            </Animated.View>
          </Animated.View>
        )}
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
  sliderItem: {
    height: 'auto',
    minHeight: 38 * 2.2,
    alignItems: 'flex-start',
    paddingVertical: 20,
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
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  successContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButton: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    gap: 1,
  },
  segmentedOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentedText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});