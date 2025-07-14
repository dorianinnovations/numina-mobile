import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import ApiService from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from "../contexts/SimpleAuthContext";

const { width } = Dimensions.get('window');

type SentimentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Sentiment'>;

interface SentimentScreenProps {
  onNavigateBack: () => void;
}

interface SentimentInsights {
  currentResonance: {
    dominantEmotion: string;
    intensity: number;
    participants: number;
    trend: 'up' | 'down' | 'stable';
  };
  emotionBreakdown: Array<{
    emotion: string;
    percentage: number;
    change: number;
  }>;
  insights: Array<{
    type: string;
    message: string;
    confidence: number;
  }>;
  demographicSummary?: {
    totalParticipants: number;
    avgAge: number;
    locationCount: number;
  };
}

export const SentimentScreen: React.FC<SentimentScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<SentimentScreenNavigationProp>();
  const { logout } = useAuth();
  const [insights, setInsights] = useState<SentimentInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInsights();
    // Set up polling for real-time updates
    const interval = setInterval(loadInsights, 30000); // Update every 30 seconds

    // Start animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, []);

  const loadInsights = async () => {
    setError(null);
    
    try {
      const response = await ApiService.getSentimentInsights();
      
      if (response.success && response.data) {
        setInsights(response.data);
        setLastUpdated(new Date());
      } else {
        // If no data or error, use mock data as fallback
        const mockInsights: SentimentInsights = {
          currentResonance: {
            dominantEmotion: 'Joy',
            intensity: 7.2,
            participants: 247,
            trend: 'up'
          },
          emotionBreakdown: [
            { emotion: 'Joy', percentage: 35, change: 5 },
            { emotion: 'Calm', percentage: 28, change: 2 },
            { emotion: 'Sadness', percentage: 15, change: -3 },
            { emotion: 'Excitement', percentage: 12, change: 8 },
            { emotion: 'Anxiety', percentage: 10, change: -2 }
          ],
          insights: [
            {
              type: 'pattern',
              message: 'Community joy levels are 15% higher than last week',
              confidence: 0.87
            },
            {
              type: 'trend',
              message: 'Evening meditation sessions show increased calm resonance',
              confidence: 0.92
            },
            {
              type: 'anomaly',
              message: 'Unusual spike in collective excitement detected around 3 PM',
              confidence: 0.78
            }
          ],
          demographicSummary: {
            totalParticipants: 1247,
            avgAge: 32,
            locationCount: 47
          }
        };

        // Check if the error is due to no data vs actual error
        if (response.error?.includes('No data') || response.error?.includes('404')) {
          setInsights(mockInsights);
          setLastUpdated(new Date());
        } else {
          setError(response.error || 'Failed to load sentiment insights');
        }
      }
    } catch (error: any) {
      console.error('Error loading insights:', error);
      setError(error.message || 'Failed to load sentiment insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInsights();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Feather name="trending-up" size={20} color={NuminaColors.green} />;
      case 'down':
        return <Feather name="trending-down" size={20} color={NuminaColors.pink} />;
      default:
        return <Feather name="minus" size={20} color={NuminaColors.yellow} />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    const emotionColors: { [key: string]: string } = {
      'Joy': NuminaColors.yellow,
      'Calm': NuminaColors.chatBlue[400],
      'Sadness': NuminaColors.chatBlue[600],
      'Excitement': NuminaColors.pink,
      'Anxiety': NuminaColors.purple,
    };
    return emotionColors[emotion] || NuminaColors.green;
  };

  const handleMenuAction = (key: string) => {
    switch (key) {
      case 'chat':
        navigation.navigate('Chat');
        break;
      case 'analytics':
        navigation.navigate('Analytics');
        break;
      case 'cloud':
        navigation.navigate('Cloud');
        break;
      case 'stratosphere':
        navigation.navigate('Stratosphere');
        break;
      case 'sentiment':
        break; // Already on this screen
      case 'profile':
        navigation.navigate('Profile');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'about':
        navigation.navigate('About');
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

  if (loading && !insights) {
    return (
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <Header 
            showBackButton={true}
            onBackPress={onNavigateBack}
            showMenuButton={true}
            onMenuPress={handleMenuAction}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={NuminaColors.green} />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[600] }]}>
              Connecting to sentiment consciousness...
            </Text>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[NuminaColors.green]}
              tintColor={NuminaColors.green}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons 
                  name="earth" 
                  size={32} 
                  color={NuminaColors.green} 
                  style={styles.titleIcon}
                />
                <Text style={[styles.title, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                  Sentiment Insights
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
                Real-time emotional resonance from the Numina community
              </Text>
            </View>

            {insights && (
              <>
                {/* Current Resonance Card */}
                {insights.currentResonance && (
                  <View style={[
                    styles.resonanceCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    }
                  ]}>
                    <View style={styles.resonanceHeader}>
                      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <View style={[styles.liveBadge, { backgroundColor: NuminaColors.green }]}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      </Animated.View>
                      <Text style={[styles.participantCount, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                        {insights.currentResonance.participants || 0} participants
                      </Text>
                    </View>

                    <View style={styles.resonanceContent}>
                      <Text style={[styles.dominantEmotion, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                        {insights.currentResonance.dominantEmotion || 'Unknown'}
                      </Text>
                      <View style={styles.intensityContainer}>
                        <Text style={[styles.intensityLabel, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          Intensity
                        </Text>
                        <Text style={[styles.intensityValue, { color: getEmotionColor(insights.currentResonance.dominantEmotion || 'Unknown') }]}>
                          {(insights.currentResonance.intensity || 0).toFixed(1)}/10
                        </Text>
                        {getTrendIcon(insights.currentResonance.trend || 'stable')}
                      </View>
                    </View>
                  </View>
                )}

                {/* Emotion Breakdown */}
                {insights.emotionBreakdown && insights.emotionBreakdown.length > 0 && (
                  <View style={[
                    styles.breakdownCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    }
                  ]}>
                    <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                      Emotion Distribution
                    </Text>
                    
                    {insights.emotionBreakdown.map((emotion, index) => (
                      <View key={index} style={styles.emotionRow}>
                        <View style={styles.emotionInfo}>
                          <Text style={[styles.emotionName, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[700] }]}>
                            {emotion.emotion}
                          </Text>
                          <Text style={[
                            styles.emotionChange,
                            { color: emotion.change > 0 ? NuminaColors.green : NuminaColors.pink }
                          ]}>
                            {emotion.change > 0 ? '+' : ''}{emotion.change}%
                          </Text>
                        </View>
                        <View style={styles.emotionBarContainer}>
                          <View 
                            style={[
                              styles.emotionBar,
                              { 
                                width: `${emotion.percentage}%`,
                                backgroundColor: getEmotionColor(emotion.emotion)
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.emotionPercentage, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          {emotion.percentage}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* AI Insights */}
                {insights.insights && insights.insights.length > 0 && (
                  <View style={[
                    styles.insightsCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    }
                  ]}>
                    <View style={styles.insightsHeader}>
                      <Ionicons name="sparkles" size={24} color={NuminaColors.purple} />
                      <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                        AI-Generated Insights
                      </Text>
                    </View>
                    
                    {insights.insights.map((insight, index) => (
                      <View key={index} style={styles.insightItem}>
                        <View style={[
                          styles.insightBullet,
                          { backgroundColor: `${NuminaColors.purple}20` }
                        ]} />
                        <View style={styles.insightContent}>
                          <Text style={[styles.insightText, { color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[600] }]}>
                            {insight.message}
                          </Text>
                          <Text style={[styles.confidenceText, { color: isDarkMode ? NuminaColors.darkMode[500] : NuminaColors.darkMode[400] }]}>
                            {(insight.confidence * 100).toFixed(0)}% confidence
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Privacy Notice */}
                <View style={[
                  styles.privacyCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  }
                ]}>
                  <Feather name="shield" size={20} color={NuminaColors.green} />
                  <Text style={[styles.privacyText, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                    All data is anonymized and aggregated. Your privacy is protected.
                  </Text>
                </View>

                {/* Last Updated */}
                {lastUpdated && (
                  <Text style={[styles.lastUpdated, { color: isDarkMode ? NuminaColors.darkMode[500] : NuminaColors.darkMode[400] }]}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </Text>
                )}
              </>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={24} color={NuminaColors.pink} />
                <Text style={[styles.errorText, { color: NuminaColors.pink }]}>
                  {error}
                </Text>
                <TouchableOpacity onPress={loadInsights} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
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
  resonanceCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  resonanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  participantCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  resonanceContent: {
    alignItems: 'center',
  },
  dominantEmotion: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  intensityLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  intensityValue: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  breakdownCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emotionInfo: {
    flex: 0.3,
    flexDirection: 'column',
  },
  emotionName: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  emotionChange: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  emotionBarContainer: {
    flex: 0.5,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  emotionBar: {
    height: '100%',
    borderRadius: 4,
  },
  emotionPercentage: {
    flex: 0.2,
    textAlign: 'right',
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  insightsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  insightBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 24,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: NuminaColors.green,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});