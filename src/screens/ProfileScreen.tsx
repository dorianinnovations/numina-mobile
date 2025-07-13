import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PageBackground } from '../components/PageBackground';

interface ProfileScreenProps {
  onNavigateBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const { userData } = useAuth();

  const profileSections = [
    { icon: 'user', title: 'Personal Information', desc: 'Manage your account details' },
    { icon: 'chart-line', title: 'Activity Summary', desc: 'View your usage statistics' },
    { icon: 'heart', title: 'Wellness Goals', desc: 'Set and track your goals' },
    { icon: 'shield-alt', title: 'Privacy Settings', desc: 'Control your data sharing' },
    { icon: 'bell', title: 'Notifications', desc: 'Manage your preferences' },
    { icon: 'download', title: 'Export Data', desc: 'Download your information' },
  ];

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
          {/* Profile Header */}
          <View style={[
            styles.profileHeader,
            {
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}>
            <View style={[
              styles.avatarContainer,
              {
                backgroundColor: isDarkMode ? '#86efac' : '#10b981',
              }
            ]}>
              <FontAwesome5 
                name="user" 
                size={32} 
                color="#ffffff" 
              />
            </View>
            <Text style={[
              styles.userName,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              {userData?.email || 'User'}
            </Text>
            <Text style={[
              styles.userSubtitle,
              { color: isDarkMode ? '#bbbbbb' : '#666666' }
            ]}>
              Member since {new Date().getFullYear()}
            </Text>
          </View>

          {/* Profile Sections */}
          <View style={styles.sectionsContainer}>
            {profileSections.map((section, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.sectionItem,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
                  }
                ]}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.sectionIcon,
                  {
                    backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
                  }
                ]}>
                  <FontAwesome5 
                    name={section.icon as any} 
                    size={16} 
                    color={isDarkMode ? '#86efac' : '#10b981'} 
                  />
                </View>
                <View style={styles.sectionText}>
                  <Text style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? '#ffffff' : '#000000' }
                  ]}>
                    {section.title}
                  </Text>
                  <Text style={[
                    styles.sectionDesc,
                    { color: isDarkMode ? '#888888' : '#666666' }
                  ]}>
                    {section.desc}
                  </Text>
                </View>
                <FontAwesome5 
                  name="chevron-right" 
                  size={12} 
                  color={isDarkMode ? '#666666' : '#999999'} 
                />
              </TouchableOpacity>
            ))}
          </View>
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
  profileHeader: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  sectionsContainer: {
    gap: 12,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    height: 38 * 1.8, // Thin brick style
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
});