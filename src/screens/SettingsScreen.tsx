import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/PageBackground';

interface SettingsScreenProps {
  onNavigateBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode, toggleTheme } = useTheme();

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
        { icon: 'palette', title: 'Theme Color', desc: 'Customize your theme colors', type: 'navigate' },
        { icon: 'text-height', title: 'Font Size', desc: 'Adjust text size for readability', type: 'navigate' },
      ]
    },
    {
      title: 'Notifications',
      items: [
        { icon: 'bell', title: 'Push Notifications', desc: 'Receive wellness reminders', type: 'switch', value: true },
        { icon: 'clock', title: 'Daily Check-ins', desc: 'Remind me to log my mood', type: 'switch', value: false },
        { icon: 'calendar', title: 'Weekly Reports', desc: 'Get weekly wellness summaries', type: 'switch', value: true },
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: 'shield-alt', title: 'Data Privacy', desc: 'Manage your data preferences', type: 'navigate' },
        { icon: 'lock', title: 'App Lock', desc: 'Secure app with biometrics', type: 'switch', value: false },
        { icon: 'eye-slash', title: 'Analytics Sharing', desc: 'Share anonymous usage data', type: 'switch', value: true },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: 'question-circle', title: 'Help Center', desc: 'Get help and support', type: 'navigate' },
        { icon: 'comment-dots', title: 'Send Feedback', desc: 'Help us improve Numina', type: 'navigate' },
        { icon: 'star', title: 'Rate App', desc: 'Rate us on the App Store', type: 'navigate' },
      ]
    },
  ];

  const renderSettingItem = (item: any, index: number) => (
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
    >
      <View style={[
        styles.settingIcon,
        {
          backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
        }
      ]}>
        <FontAwesome5 
          name={item.icon as any} 
          size={16} 
          color={isDarkMode ? '#86efac' : '#10b981'} 
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
          onValueChange={item.onToggle || (() => {})}
          trackColor={{ false: '#767577', true: '#86efac' }}
          thumbColor={item.value ? '#10b981' : '#f4f3f4'}
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

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
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
    paddingTop: 120,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
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
    height: 38 * 1.8, // Thin brick style
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