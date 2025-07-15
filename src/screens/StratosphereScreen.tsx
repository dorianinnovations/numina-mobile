import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from "../contexts/SimpleAuthContext";
import { NuminaColors } from '../utils/colors';
import { Header } from '../components/Header';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LLMAnalyticsSection } from '../components/LLMAnalyticsSection';
import { PageBackground } from '../components/PageBackground';

interface StratosphereScreenProps {
  onNavigateBack: () => void;
}

type StratosphereScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Stratosphere'>;

export const StratosphereScreen: React.FC<StratosphereScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();
  const navigation = useNavigation<StratosphereScreenNavigationProp>();

  const handleMenuAction = (key: string) => {
    switch (key) {
      case 'chat':
        navigation.navigate('Chat');
        break;
      case 'analytics':
        navigation.navigate('Analytics');
        break;
      case 'stratosphere':
        break;
      case 'sentiment':
        navigation.navigate('Sentiment');
        break;
      case 'profile':
        Alert.alert('Profile', 'Profile feature coming soon!');
        break;
      case 'settings':
        Alert.alert('Settings', 'Settings feature coming soon!');
        break;
      case 'about':
        Alert.alert('About', 'About feature coming soon!');
        break;
      case 'signout':
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sign Out', 
              style: 'destructive',
              onPress: async () => {
                try {
                  await logout();
                  // The AppNavigator will automatically redirect to Hero screen
                  // when isAuthenticated becomes false
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }
            }
          ]
        );
        break;
      default:
        break;
    }
  };

  const stratosphereFeatures = [
    {
              title: 'Sentiment Insights',
      description: 'Explore anonymized emotional patterns from the Numina community',
      icon: <MaterialCommunityIcons name="earth" size={28} color={NuminaColors.green} />,
      color: NuminaColors.green,
      comingSoon: false,
    },
    {
      title: 'Wellness Trends',
      description: 'Real-time global wellness metrics and insights',
      icon: <Feather name="trending-up" size={28} color={NuminaColors.chatBlue[400]} />,
      color: NuminaColors.chatBlue[400],
      comingSoon: false,
    },
    {
      title: 'Community Stories',
      description: 'Anonymous success stories and shared experiences',
      icon: <MaterialCommunityIcons name="account-group" size={28} color={NuminaColors.chatGreen[400]} />,
      color: NuminaColors.chatGreen[400],
      comingSoon: true,
    },
    {
      title: 'Guided Journeys',
      description: 'Structured wellness programs based on community data',
      icon: <Ionicons name="map-outline" size={28} color={NuminaColors.purple} />,
      color: NuminaColors.purple,
      comingSoon: true,
    },
    {
      title: 'Mindfulness Sessions',
      description: 'Join live meditation and mindfulness sessions',
      icon: <MaterialCommunityIcons name="meditation" size={28} color={NuminaColors.pink} />,
      color: NuminaColors.pink,
      comingSoon: true,
    },
    {
      title: 'Emotional Weather',
      description: 'See the current emotional climate in your area',
      icon: <Feather name="cloud" size={28} color={NuminaColors.chatBlue[300]} />,
      color: NuminaColors.chatBlue[300],
      comingSoon: false,
    },
  ];

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
      
      <Header 
        showBackButton={true}
        onBackPress={onNavigateBack}
        showMenuButton={true}
        onMenuPress={handleMenuAction}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="earth" 
              size={32} 
              color={NuminaColors.green} 
              style={styles.titleIcon}
            />
            <Text style={[styles.title, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
              Stratosphere
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
            Connect with the global wellness community and explore sentiment insights
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {stratosphereFeatures.map((feature, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.featureCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                }
              ]}
              activeOpacity={feature.comingSoon ? 1 : 0.7}
              onPress={() => {
                if (!feature.comingSoon && index === 0) {
                  navigation.navigate('Sentiment');
                }
              }}
            >
              <View style={styles.featureHeader}>
                <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                  {feature.icon}
                </View>
                {feature.comingSoon && (
                  <View style={[styles.comingSoonBadge, { backgroundColor: NuminaColors.yellow }]}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </View>
              
              <Text style={[
                styles.featureTitle, 
                { 
                  color: feature.comingSoon 
                    ? (isDarkMode ? NuminaColors.darkMode[500] : NuminaColors.darkMode[400])
                    : (isDarkMode ? '#fff' : NuminaColors.darkMode[700])
                }
              ]}>
                {feature.title}
              </Text>
              
              <Text style={[
                styles.featureDescription, 
                { 
                  color: feature.comingSoon 
                    ? (isDarkMode ? NuminaColors.darkMode[600] : NuminaColors.darkMode[400])
                    : (isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500])
                }
              ]}>
                {feature.description}
              </Text>

              {!feature.comingSoon && (
                <View style={styles.exploreButton}>
                  <Text style={[styles.exploreText, { color: feature.color }]}>
                    Explore
                  </Text>
                  <Feather name="arrow-right" size={16} color={feature.color} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[
          styles.infoCard,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }
        ]}>
          <Feather name="shield" size={24} color={NuminaColors.green} style={styles.shieldIcon} />
          <Text style={[styles.infoTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
            Privacy First
          </Text>
          <Text style={[styles.infoText, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
            All sentiment insights are completely anonymized and encrypted. Your personal data 
            remains private while contributing to global wellness understanding.
          </Text>
        </View>

        {/* LLM Analytics Section */}
        <LLMAnalyticsSection isVisible={true} />
      </ScrollView>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 15,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 15,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  exploreText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginRight: 8,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  shieldIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
});