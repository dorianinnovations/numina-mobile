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
import { Header } from '../components/Header';

interface ProfileScreenProps {
  onNavigateBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const { userData } = useAuth();

  const profileSections = [
    { 
      icon: 'user', 
      title: 'Personal Information', 
      desc: 'Manage your account details',
      onPress: () => console.log('Personal Info')
    },
    { 
      icon: 'chart-line', 
      title: 'Activity Summary', 
      desc: 'View your usage statistics',
      onPress: () => console.log('Activity Summary')
    },
    { 
      icon: 'heart', 
      title: 'Wellness Goals', 
      desc: 'Set and track your goals',
      onPress: () => console.log('Wellness Goals')
    },
    { 
      icon: 'shield-alt', 
      title: 'Privacy Settings', 
      desc: 'Control your data sharing',
      onPress: () => console.log('Privacy Settings')
    },
    { 
      icon: 'bell', 
      title: 'Notifications', 
      desc: 'Manage your preferences',
      onPress: () => console.log('Notifications')
    },
    { 
      icon: 'download', 
      title: 'Export Data', 
      desc: 'Download your information',
      onPress: () => console.log('Export Data')
    },
  ];

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Header */}
        <Header 
          title="Profile"
          showBackButton={true}
          showMenuButton={true}
          onBackPress={onNavigateBack}
          onMenuPress={(key: string) => {}}
        />

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                size={24} 
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
                onPress={section.onPress}
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
                    size={12} 
                    color={isDarkMode ? '#86baef' : '#6ac2f2'} 
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
                  size={10} 
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  profileHeader: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 60,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
});
