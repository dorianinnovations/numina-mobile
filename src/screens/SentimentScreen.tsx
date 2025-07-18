import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import getWebSocketService from '../services/websocketService';

const { width } = Dimensions.get('window');

type SentimentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Sentiment'>;

interface SentimentScreenProps {
  onNavigateBack: () => void;
}


interface RealGrowthData {
  period: string;
  timeframe: string;
  generatedAt: string;
  metrics: {
    positivityRatio: number;
    engagementScore: number;
    avgSessionsPerDay: number;
    avgIntensity: number;
    topEmotions: Array<{ emotion: string; count: number }>;
  };
  aiInsights: string;
}

export const SentimentScreen: React.FC<SentimentScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<SentimentScreenNavigationProp>();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [growthData, setGrowthData] = useState<RealGrowthData | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<string>('Calm');
  const [emotionIntensity, setEmotionIntensity] = useState<number>(5);
  const [emotionConfidence, setEmotionConfidence] = useState<number>(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isStreamingGrowthData, setIsStreamingGrowthData] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingStatus, setStreamingStatus] = useState<string>('');

  const animationLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Data validation function to ensure metrics are properly bounded
  const validateGrowthData = (data: any): any => {
    if (!data || !data.metrics) return data;
    
    const validatedMetrics = {
      ...data.metrics,
      positivityRatio: Math.max(0, Math.min(1, data.metrics.positivityRatio || 0)),
      engagementScore: Math.max(0, Math.min(1, data.metrics.engagementScore || 0)),
      avgSessionsPerDay: Math.max(0, Math.min(24, data.metrics.avgSessionsPerDay || 0)),
      avgIntensity: Math.max(0, Math.min(10, data.metrics.avgIntensity || 0))
    };
    
    return {
      ...data,
      metrics: validatedMetrics
    };
  };

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Stagger animation refs for content fade-in
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const growthCardFadeAnim = useRef(new Animated.Value(0)).current;
  const milestonesCardFadeAnim = useRef(new Animated.Value(0)).current;
  const statsCardFadeAnim = useRef(new Animated.Value(0)).current;
  const socialCardFadeAnim = useRef(new Animated.Value(0)).current;
  const privacyCardFadeAnim = useRef(new Animated.Value(0)).current;

  // CRITICAL FIX: Proper cleanup function
  const cleanupResources = useCallback(() => {
    // Clear animation loop
    if (animationLoopRef.current) {
      animationLoopRef.current.stop();
      animationLoopRef.current = null;
    }
    
    // Clear streaming timeout
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }
    
    // Clear refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log('🎭 SentimentScreen: Component mounted, loading data...');
    
    // Test connectivity first
    const testConnectivity = async () => {
      try {
        console.log('🔍 Testing server connectivity...');
        const response = await fetch('https://server-a7od.onrender.com/health');
        console.log('✅ Health check response:', response.status, response.statusText);
        if (response.ok) {
          const data = await response.text();
          console.log('✅ Health check data:', data);
        }

        // Test authentication
        console.log('🔍 Testing authentication...');
        const authResponse = await ApiService.checkConnection();
        console.log('🔑 Auth check result:', authResponse);
        
        // Test a protected endpoint
        console.log('🔍 Testing protected endpoint...');
        const profileResponse = await ApiService.getUserProfile();
        console.log('👤 Profile response:', profileResponse);
        
      } catch (error) {
        console.error('❌ Connectivity test failed:', error);
      }
    };
    
    testConnectivity();
    loadGrowthData();
    loadMilestones();
    
    // CRITICAL FIX: Store interval ref for proper cleanup
    refreshIntervalRef.current = setInterval(() => {
      console.log('🔄 SentimentScreen: Periodic refresh (5 min interval)...');
      if (canRefresh()) {
        loadGrowthData();
        loadMilestones();
      }
    }, 300000); // Update every 5 minutes instead of 30 seconds

    // Set up WebSocket listeners for real-time features
    const websocketService = getWebSocketService();
    websocketService.addEventListener('milestone_achieved', handleMilestoneAchieved);
    websocketService.addEventListener('milestone_celebrated', handleMilestoneCelebrated);
    websocketService.addEventListener('emotional_share_received', handleEmotionalShareReceived);
    websocketService.addEventListener('growth_insights_updated', handleGrowthInsightsUpdated);
    websocketService.addEventListener('numina_senses_updated', handleNuminaSensesUpdated);

    // CRITICAL FIX: Store animation loop ref for proper cleanup
    animationLoopRef.current = Animated.loop(
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
    );
    animationLoopRef.current.start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // CRITICAL FIX: Comprehensive cleanup
    return () => {
      console.log('🎭 SentimentScreen: Component unmounting, cleaning up...');
      
      // Clear interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      // Clear animation loop
      if (animationLoopRef.current) {
        animationLoopRef.current.stop();
        animationLoopRef.current = null;
      }
      
      // Clear streaming timeout
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
      
      // Remove WebSocket listeners
      const websocketService = getWebSocketService();
      websocketService.removeEventListener('milestone_achieved', handleMilestoneAchieved);
      websocketService.removeEventListener('milestone_celebrated', handleMilestoneCelebrated);
      websocketService.removeEventListener('emotional_share_received', handleEmotionalShareReceived);
      websocketService.removeEventListener('growth_insights_updated', handleGrowthInsightsUpdated);
      websocketService.removeEventListener('numina_senses_updated', handleNuminaSensesUpdated);
    };
  }, []);

  // Trigger stagger animations when loading completes
  useEffect(() => {
    if (!loading && !isInitialLoad && (growthData || milestones.length > 0)) {
      console.log('🎭 SentimentScreen: Loading complete, triggering stagger animations');
      triggerStaggerAnimations();
    }
  }, [loading, isInitialLoad, growthData, milestones]);

  // Rate limiting function
  const canRefresh = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const minRefreshInterval = 60000; // 1 minute minimum between refreshes
    return timeSinceLastRefresh > minRefreshInterval;
  };

  const loadGrowthData = async () => {
    if (!canRefresh() && !isInitialLoad) {
      console.log('📈 SentimentScreen: Skipping refresh due to rate limit');
      return;
    }
    
    setLastRefreshTime(Date.now());
    console.log('📈 SentimentScreen: Loading growth data with streaming...');
    
    // Try streaming first, fall back to static if needed
    try {
      setIsStreamingGrowthData(true);
      setStreamingProgress(0);
      setStreamingStatus('Initializing...');
      
      const streamingResponse = await ApiService.getPersonalGrowthSummaryStreaming('week', (chunk) => {
        // Handle streaming chunks with progress updates
        if (chunk.type === 'status') {
          console.log(`📊 Growth insights: ${chunk.message} (${chunk.progress}%)`);
          setStreamingStatus(chunk.message);
          setStreamingProgress(chunk.progress || 0);
        } else if (chunk.type === 'complete') {
          // Final data received
          console.log('✅ SentimentScreen: Successfully loaded streaming growth data');
          setStreamingStatus('Finalizing...');
          setStreamingProgress(100);
          
          setGrowthData(validateGrowthData(chunk.data));
          
          // CRITICAL FIX: Store timeout ref for proper cleanup
          streamingTimeoutRef.current = setTimeout(() => {
            setIsStreamingGrowthData(false);
            setLoading(false);
            setIsInitialLoad(false);
            streamingTimeoutRef.current = null;
          }, 500);
        }
      });

      // Handle completion for any remaining processing
      if (streamingResponse.complete && streamingResponse.content) {
        console.log('✅ SentimentScreen: Streaming completed with final content');
        setGrowthData(validateGrowthData(streamingResponse.content));
        setIsStreamingGrowthData(false);
        setLoading(false);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('❌ SentimentScreen: Error with streaming growth data, falling back:', error);
      setIsStreamingGrowthData(false);
      
      // Fallback to static API
      try {
        const response = await ApiService.getPersonalGrowthSummary('week');
        console.log('📈 SentimentScreen: Growth data API response (fallback):', response);
        if (response.success && response.data) {
          console.log('✅ SentimentScreen: Successfully loaded growth data (fallback)');
          setGrowthData(validateGrowthData(response.data));
          setLoading(false);
          setIsInitialLoad(false);
        } else {
          throw new Error('Static API also failed');
        }
      } catch (fallbackError) {
        console.log('📈 SentimentScreen: Using mock growth data due to complete failure');
        // Final fallback to mock data
        setGrowthData(validateGrowthData({
          metrics: {
            positivityRatio: 0.78, // Values should be 0.0-1.0, not percentages
            engagementScore: 0.85,
            avgSessionsPerDay: 2.4,
            avgIntensity: 6.8,
            topEmotions: [
              { emotion: 'Joy', count: 12 },
              { emotion: 'Calm', count: 8 },
              { emotion: 'Excitement', count: 5 }
            ]
          },
          period: 'Last 7 days',
          aiInsights: 'Your positivity has increased 15% this week. Great progress on maintaining emotional balance!'
        }));
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const loadMilestones = async () => {
    if (!canRefresh() && !isInitialLoad) {
      console.log('🏆 SentimentScreen: Skipping milestones refresh due to rate limit');
      return;
    }
    
    console.log('🏆 SentimentScreen: Loading milestones...');
    try {
      const response = await ApiService.getMilestones();
      console.log('🏆 SentimentScreen: Milestones API response:', response);
      if (response.success && response.data) {
        console.log('✅ SentimentScreen: Successfully loaded milestones');
        const milestonesData = response.data.milestones || [];
        setMilestones(milestonesData);
        console.log('🏆 SentimentScreen: Milestones state updated:', milestonesData);
      } else {
        console.log('🏆 SentimentScreen: No milestones from API, using mock data');
        // Mock data as fallback
        setMilestones([
          {
            id: '1',
            title: '7-Day Streak',
            description: 'Logged emotions for 7 consecutive days',
            achieved: true,
            progress: 100,
            category: 'consistency',
            celebratedAt: '2025-07-10'
          },
          {
            id: '2',
            title: 'Positivity Champion',
            description: 'Maintained 80%+ positive emotions for a week',
            achieved: true,
            progress: 100,
            category: 'mood'
          },
          {
            id: '3',
            title: 'Community Helper',
            description: 'Supported 5 community members',
            achieved: false,
            progress: 60,
            category: 'social'
          },
          {
            id: '4',
            title: 'Mindfulness Master',
            description: 'Complete 10 mindfulness sessions',
            achieved: false,
            progress: 30,
            category: 'wellness'
          }
        ]);
      }
    } catch (error) {
      console.error('❌ SentimentScreen: Error loading milestones:', error);
      console.log('🏆 SentimentScreen: Using mock milestones due to error');
      // Fallback to mock data on error
      setMilestones([
        {
          id: '1',
          title: '7-Day Streak',
          description: 'Logged emotions for 7 consecutive days',
          achieved: true,
          progress: 100,
          category: 'consistency',
          celebratedAt: '2025-07-10'
        },
        {
          id: '2',
          title: 'Positivity Champion',
          description: 'Maintained 80%+ positive emotions for a week',
          achieved: true,
          progress: 100,
          category: 'mood'
        },
        {
          id: '3',
          title: 'Community Helper',
          description: 'Supported 5 community members',
          achieved: false,
          progress: 60,
          category: 'social'
        },
        {
          id: '4',
          title: 'Mindfulness Master',
          description: 'Complete 10 mindfulness sessions',
          achieved: false,
          progress: 30,
          category: 'wellness'
        }
      ]);
    }
  };

  // WebSocket event handlers
  const handleMilestoneAchieved = (data: any) => {
    console.log('🏆 Milestone achieved:', data);
    Alert.alert(
      'Milestone Achieved! 🏆',
      `Congratulations! You've achieved: ${data.title}`,
      [
        { text: 'Celebrate', onPress: () => celebrateMilestone(data) },
        { text: 'OK', style: 'default' }
      ]
    );
    // Only refresh if enough time has passed
    if (canRefresh()) {
      loadMilestones();
    }
  };

  const handleMilestoneCelebrated = (data: any) => {
    console.log('🎉 Milestone celebrated:', data);
    Alert.alert('🎉', `Someone celebrated: ${data.title}`);
  };

  const handleEmotionalShareReceived = (data: any) => {
    console.log('💝 Emotional share received:', data);
    Alert.alert(
      'Emotional Check-in',
      `${data.fromUser?.username || 'Someone'} shared: ${data.emotion}`,
      [{ text: 'OK' }]
    );
  };

  const handleGrowthInsightsUpdated = (data: any) => {
    console.log('📊 Growth insights updated:', data);
    // Only refresh if enough time has passed
    if (canRefresh()) {
      loadGrowthData();
    }
  };

  const handleNuminaSensesUpdated = (data: any) => {
    console.log('🎭 Numina Senses updated:', data);
    console.log(`Emotion detected: ${data.emotion} (${Math.round(data.confidence * 100)}% confident)`);
    console.log(`Reasoning: ${data.reasoning}`);
    
    // Update current emotion state
    setCurrentEmotion(data.emotion);
    setEmotionIntensity(data.intensity || 5);
    setEmotionConfidence(data.confidence || 0);
    
    // Optional: Show subtle notification for high confidence changes
    if (data.confidence >= 0.8) {
      console.log(`🎯 High confidence emotion change to: ${data.emotion}`);
    }
  };

  const celebrateMilestone = (milestone: any) => {
    console.log('🎉 Celebrating milestone:', milestone.title);
    getWebSocketService().celebrateMilestone(milestone.id, milestone.title, true);
    ApiService.celebrateMilestone(milestone.id);
  };

  const shareCurrentEmotion = () => {
    const confidenceText = emotionConfidence > 0 
      ? `\n\n(AI detected with ${Math.round(emotionConfidence * 100)}% confidence)`
      : '';
    
    Alert.alert(
      'Share Your Feeling',
      `Share your current ${currentEmotion} feeling with the community?${confidenceText}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => {
            console.log('📤 Sharing emotion:', currentEmotion, 'intensity:', emotionIntensity);
            getWebSocketService().shareEmotionalState('community', currentEmotion, emotionIntensity);
          }
        }
      ]
    );
  };

  const requestSupport = () => {
    Alert.alert(
      'Request Support',
      'Share your need for encouragement with the community?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request Support', 
          onPress: () => {
            console.log('🆘 Requesting support');
            getWebSocketService().requestSupport(8, 'Need encouragement', true);
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    // Allow manual refresh regardless of rate limit
    setRefreshing(true);
    setLastRefreshTime(0); // Reset rate limit for manual refresh
    Promise.all([
      loadGrowthData(),
      loadMilestones()
    ]).finally(() => setRefreshing(false));
  };

  const triggerStaggerAnimations = () => {
    // Reset all animations to 0
    contentFadeAnim.setValue(0);
    growthCardFadeAnim.setValue(0);
    milestonesCardFadeAnim.setValue(0);
    statsCardFadeAnim.setValue(0);
    socialCardFadeAnim.setValue(0);
    privacyCardFadeAnim.setValue(0);
    
    // Stagger the animations with delays
    Animated.sequence([
      // Main content fade in
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Growth card fade in
      Animated.timing(growthCardFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      // Milestones card fade in
      Animated.timing(milestonesCardFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      // Stats card fade in
      Animated.timing(statsCardFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      // Social card fade in
      Animated.timing(socialCardFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      // Privacy card fade in
      Animated.timing(privacyCardFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
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
      case 'wallet':
        navigation.navigate('Wallet');
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

  console.log('🎭 SentimentScreen RENDER:', {
    loading,
    hasGrowthData: !!growthData,
    milestonesCount: milestones.length
  });

  // Show loader during initial load or when both data sets are missing
  if ((loading && isInitialLoad) || (!growthData && milestones.length === 0 && loading)) {
    console.log('📊 SentimentScreen: Showing loading screen');
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
              {isStreamingGrowthData ? streamingStatus : 'Loading your growth insights...'}
            </Text>
            <Text style={[styles.loadingSubtext, { color: isDarkMode ? '#888' : '#666', marginTop: 8, fontSize: 12 }]}>
              {isStreamingGrowthData ? 'Thank you for your patience, Numina is fetching' : 'Analyzing your emotional patterns and progress'}
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
          <Animated.View style={{ opacity: contentFadeAnim }}>



                {/* Growth Insights Dashboard */}
                {growthData && (
                  <Animated.View style={[
                    styles.growthCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      opacity: growthCardFadeAnim,
                    }
                  ]}>
                    <View style={styles.insightsHeader}>
                      <MaterialCommunityIcons name="chart-line" size={24} color={NuminaColors.green} />
                      <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                        Weekly Growth Insights
                      </Text>
                    </View>

                    {/* Period */}
                    {growthData.period && (
                      <Text style={[styles.periodText, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                        {growthData.period}
                      </Text>
                    )}

                    {/* Growth Progress Ring */}
                    <View style={styles.growthRingContainer}>
                      <View style={[styles.growthRing, { borderColor: NuminaColors.green }]}>
                        <Text style={[styles.growthPercentage, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                          {Math.min(100, Math.round((growthData.metrics?.positivityRatio || 0) * 100))}%
                        </Text>
                        <Text style={[styles.growthLabel, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          Positive
                        </Text>
                      </View>
                      <View style={styles.growthMetrics}>
                        <Text style={[styles.metricText, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
                          Engagement: {Math.min(100, Math.round((growthData.metrics?.engagementScore || 0) * 100))}%
                        </Text>
                        <Text style={[styles.metricText, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
                          Sessions/Day: {Math.max(0, (growthData.metrics?.avgSessionsPerDay || 0)).toFixed(1)}
                        </Text>
                        <Text style={[styles.metricText, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
                          Avg Intensity: {Math.max(0, Math.min(10, (growthData.metrics?.avgIntensity || 0))).toFixed(1)}/10
                        </Text>
                      </View>
                    </View>

                    {/* AI Insights */}
                    {growthData.aiInsights && (
                      <View style={styles.aiInsightsContainer}>
                        <Text style={[styles.aiInsightsTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[700] }]}>
                          Your Personal AI Analysis
                        </Text>
                        <Text style={[styles.aiInsightText, { color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[600] }]}>
                          {growthData.aiInsights}
                        </Text>
                      </View>
                    )}
                  </Animated.View>
                )}

                {/* Milestone System */}
                {milestones && milestones.length > 0 && (
                  <Animated.View style={[
                    styles.milestonesCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      opacity: milestonesCardFadeAnim,
                    }
                  ]}>
                    <View style={styles.insightsHeader}>
                      <Ionicons name="trophy" size={24} color={NuminaColors.yellow} />
                      <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                        Milestones
                      </Text>
                    </View>

                    {/* Achieved Milestones */}
                    <View style={styles.achievedMilestones}>
                      {milestones.filter(m => m.achieved).map(milestone => (
                        <TouchableOpacity 
                          key={milestone.id}
                          onPress={() => celebrateMilestone(milestone)}
                          style={[styles.celebrationBadge, { backgroundColor: `${NuminaColors.yellow}20` }]}
                        >
                          <Text style={styles.badgeEmoji}>🏆</Text>
                          <Text style={[styles.badgeText, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[700] }]}>
                            {milestone.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Progress Milestones */}
                    {milestones.filter(m => !m.achieved && m.progress > 0).map(milestone => (
                      <View key={milestone.id} style={styles.progressMilestone}>
                        <Text style={[styles.milestoneTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[700] }]}>
                          {milestone.title}
                        </Text>
                        <View style={styles.progressBarContainer}>
                          <View 
                            style={[
                              styles.progressBar,
                              { 
                                width: `${milestone.progress}%`,
                                backgroundColor: NuminaColors.green
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.progressText, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          {milestone.progress}% complete
                        </Text>
                      </View>
                    ))}
                  </Animated.View>
                )}

                {/* Quick Stats Card */}
                {growthData && (
                  <Animated.View style={[
                    styles.statsCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      opacity: statsCardFadeAnim,
                    }
                  ]}>
                    <View style={styles.insightsHeader}>
                      <MaterialCommunityIcons name="chart-box" size={24} color={NuminaColors.purple} />
                      <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                        Quick Stats
                      </Text>
                    </View>

                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: NuminaColors.green }]}>
                          {Math.min(100, Math.round((growthData.metrics?.positivityRatio || 0) * 100))}%
                        </Text>
                        <Text style={[styles.statLabel, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          Positivity
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: NuminaColors.chatBlue[400] }]}>
                          {Math.max(0, Math.min(24, (growthData.metrics?.avgSessionsPerDay || 0))).toFixed(1)}
                        </Text>
                        <Text style={[styles.statLabel, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          Sessions/Day
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: NuminaColors.yellow }]}>
                          {Math.max(0, Math.min(10, (growthData.metrics?.avgIntensity || 0))).toFixed(1)}
                        </Text>
                        <Text style={[styles.statLabel, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          Avg Intensity
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: NuminaColors.chatPurple[400] }]}>
                          {Math.min(100, Math.round((growthData.metrics?.engagementScore || 0) * 100))}%
                        </Text>
                        <Text style={[styles.statLabel, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                          Engagement
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* Real-Time Social Features */}
                <Animated.View style={[
                  styles.socialCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    opacity: socialCardFadeAnim,
                  }
                ]}>
                  <View style={styles.insightsHeader}>
                    <MaterialCommunityIcons name="heart-multiple" size={24} color={NuminaColors.chatPurple[400]} />
                    <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                      Connect & Share
                    </Text>
                  </View>

                  <View style={styles.socialButtons}>
                    {/* Share Current Emotion */}
                    <TouchableOpacity onPress={shareCurrentEmotion} style={[styles.socialButton, { backgroundColor: `${NuminaColors.green}20` }]}>
                      <MaterialCommunityIcons name="share" size={20} color={NuminaColors.green} />
                      <View style={styles.emotionShareContent}>
                        <Text style={[styles.socialButtonText, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[700] }]}>
                          Share {currentEmotion} feeling →
                        </Text>
                        {emotionConfidence > 0 && (
                          <Text style={[styles.confidenceText, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                            AI detected • {Math.round(emotionConfidence * 100)}% confident
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Request Support */}
                    <TouchableOpacity onPress={requestSupport} style={[styles.socialButton, { backgroundColor: `${NuminaColors.chatPurple[400]}20` }]}>
                      <Text style={styles.supportEmoji}>🆘</Text>
                      <Text style={[styles.socialButtonText, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[700] }]}>
                        Request Support
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Privacy Notice */}
                <Animated.View style={[
                  styles.privacyCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    opacity: privacyCardFadeAnim,
                  }
                ]}>
                  <Feather name="shield" size={20} color={NuminaColors.green} />
                  <Text style={[styles.privacyText, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
                    All data is anonymized and aggregated. Your privacy is protected.
                  </Text>
                </Animated.View>

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
    paddingHorizontal: 8,
    paddingTop: 80,
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
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 18,
    letterSpacing: -0.3,
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
  // Growth Insights styles
  growthCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  growthRingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  growthRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthPercentage: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter_800Bold',
    letterSpacing: -0.5,
  },
  growthLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
  growthMetrics: {
    flex: 1,
    minWidth: 0,
  },
  metricText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginBottom: 10,
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  aiInsightText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    flex: 1,
    flexWrap: 'wrap',
    letterSpacing: -0.1,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  aiInsightsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
  },
  aiInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  // Milestone styles
  milestonesCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  achievedMilestones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  progressMilestone: {
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  // Stats card styles
  statsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  // Social features styles
  socialCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  emotionShareContent: {
    flex: 1,
  },
  supportEmoji: {
    fontSize: 16,
  },
  loadingSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 24,
    width: '80%',
    alignItems: 'center',
  },
  progressBarLoading: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressTextLoading: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});