import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { useLLMAnalytics } from '../../hooks/useLLMAnalytics';

const { width: screenWidth } = Dimensions.get('window');

interface LLMAnalyticsSectionProps {
  isVisible?: boolean;
}

export const LLMAnalyticsSection: React.FC<LLMAnalyticsSectionProps> = ({ isVisible = true }) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('insights');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation values for floating orbs
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3X = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;

  // Scale animations for pulsing effect
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  const orb3Scale = useRef(new Animated.Value(1)).current;

  // Card entrance animation
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  
  const {
    llmInsights,
    llmWeeklyInsights,
    llmRecommendations,
    isGeneratingInsights,
    isGeneratingWeekly,
    isGeneratingRecommendations,
    insightsError,
    weeklyError,
    recommendationsError,
    generateInsights,
    generateWeeklyInsights,
    generateRecommendations,
    getPatternInsights,
    hasCachedInsights,
  } = useLLMAnalytics();

  useEffect(() => {
    if (isVisible && !hasCachedInsights) {
      generateInsights({ days: 30, focus: 'general' });
    }
    
    // Section entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Create floating animation for orbs
    const createFloatingAnimation = (xValue: Animated.Value, yValue: Animated.Value, scaleValue: Animated.Value, delay: number) => {
      const floating = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 25 - 12.5,
              duration: 7000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 25 - 12.5,
              duration: 7000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 25 - 12.5,
              duration: 7000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 25 - 12.5,
              duration: 7000 + Math.random() * 3000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const pulsing = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 6000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.8,
            duration: 6000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      );

      setTimeout(() => {
        floating.start();
        pulsing.start();
      }, delay);
    };

    // Start animations with different delays
    createFloatingAnimation(orb1X, orb1Y, orb1Scale, 0);
    createFloatingAnimation(orb2X, orb2Y, orb2Scale, 2000);
    createFloatingAnimation(orb3X, orb3Y, orb3Scale, 4000);
  }, [isVisible, hasCachedInsights, generateInsights]);

  const tabs = [
    { id: 'insights', label: 'Insights', icon: 'lightbulb-on', color: NuminaColors.purple },
    { id: 'patterns', label: 'Patterns', icon: 'trending-up', color: NuminaColors.green },
    { id: 'recommendations', label: 'Tips', icon: 'target', color: NuminaColors.chatBlue[400] },
    { id: 'weekly', label: 'Weekly', icon: 'star', color: NuminaColors.yellow },
  ];

  const handleTabClick = async (tabId: string) => {
    setActiveTab(tabId);
    
    switch (tabId) {
      case 'patterns':
        await getPatternInsights();
        break;
      case 'recommendations':
        await generateRecommendations({}, true);
        break;
      case 'weekly':
        await generateWeeklyInsights();
        break;
      default:
        await generateInsights({ days: 30, focus: 'general' });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleTabClick(activeTab);
    setRefreshing(false);
  };

  const getTabIcon = (iconName: string, isActive: boolean, color: string) => {
    const iconColor = isActive ? color : (isDarkMode ? NuminaColors.darkMode[500] : NuminaColors.darkMode[400]);
    const iconSize = 20;
    
    switch (iconName) {
      case 'lightbulb-on':
        return <MaterialCommunityIcons name="lightbulb-on" size={iconSize} color={iconColor} />;
      case 'trending-up':
        return <Feather name="trending-up" size={iconSize} color={iconColor} />;
      case 'target':
        return <Feather name="target" size={iconSize} color={iconColor} />;
      case 'star':
        return <Ionicons name="star" size={iconSize} color={iconColor} />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return '#00ff88';
    if (confidence >= 0.7) return '#ffd93d';
    return '#ff6b9d';
  };

  const getConfidenceTrend = (confidence: number): 'up' | 'down' | 'neutral' => {
    if (confidence >= 0.8) return 'up';
    if (confidence <= 0.6) return 'down';
    return 'neutral';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '#00ff88';
      case 'down': return '#ff4757';
      default: return '#00aaff';
    }
  };

  const GlowingOrb: React.FC<{
    translateX: Animated.Value;
    translateY: Animated.Value;
    scale: Animated.Value;
    color: string;
    size: number;
    position: { top?: number; bottom?: number; left?: number; right?: number };
  }> = ({ translateX, translateY, scale, color, size, position }) => (
    <Animated.View
      style={[
        styles.orbContainer,
        position,
        {
          transform: [
            { translateX },
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      {/* Outer glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 3,
            height: size * 3,
            borderRadius: (size * 3) / 2,
            backgroundColor: color + '10',
          },
        ]}
      />
      {/* Middle glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: (size * 2) / 2,
            backgroundColor: color + '25',
          },
        ]}
      />
      {/* Inner glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: (size * 1.4) / 2,
            backgroundColor: color + '40',
          },
        ]}
      />
      {/* Core orb */}
      <View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: size / 1.2,
            elevation: 10,
          },
        ]}
      />
    </Animated.View>
  );

  const renderContent = () => {
    let insights, isLoading, error;
    
    switch (activeTab) {
      case 'weekly':
        insights = llmWeeklyInsights;
        isLoading = isGeneratingWeekly;
        error = weeklyError;
        break;
      case 'recommendations':
        insights = llmRecommendations;
        isLoading = isGeneratingRecommendations;
        error = recommendationsError;
        break;
      default:
        insights = llmInsights;
        isLoading = isGeneratingInsights;
        error = insightsError;
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NuminaColors.green} />
          <Text style={[styles.loadingText, { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }]}>
            Analyzing your data...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={24} color={NuminaColors.pink} />
          <Text style={[styles.errorText, { color: NuminaColors.pink }]}>
            {error}
          </Text>
          <TouchableOpacity 
            onPress={() => handleTabClick(activeTab)}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!insights || insights.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="lightbulb-outline" 
            size={48} 
            color={isDarkMode ? NuminaColors.darkMode[500] : NuminaColors.darkMode[400]} 
          />
          <Text style={[styles.emptyText, { color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500] }]}>
            No insights available yet. Keep logging your emotions to get personalized insights!
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
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
        {insights.map((insight) => {
          const confidenceTrend = getConfidenceTrend(insight.confidence);
          const trendColor = getTrendColor(confidenceTrend);
          const confidencePercentage = Math.round(insight.confidence * 100);
          
          return (
          <Animated.View 
            key={insight.id}
            style={[
              styles.insightCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            {/* Background orbs for individual cards */}
            <GlowingOrb
              translateX={orb1X}
              translateY={orb1Y}
              scale={orb1Scale}
              color={getConfidenceColor(insight.confidence)}
              size={20}
              position={{ top: -10, left: -10 }}
            />
            <GlowingOrb
              translateX={orb2X}
              translateY={orb2Y}
              scale={orb2Scale}
              color={trendColor}
              size={15}
              position={{ bottom: -8, right: -8 }}
            />

            <TouchableOpacity
              style={styles.cardTouchable}
              onPress={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
              activeOpacity={0.8}
            >
              <View style={styles.glassContainer}>
                <BlurView
                  intensity={isDarkMode ? 60 : 80}
                  tint={isDarkMode ? "dark" : "light"}
                  style={styles.blurView}
                >
                  <LinearGradient
                    colors={isDarkMode 
                      ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']
                      : ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.25)']
                    }
                    style={styles.gradientOverlay}
                  >
                    <View style={styles.cardContent}>
                    <View style={styles.insightHeader}>
                      <View style={styles.insightTitleRow}>
                        <View style={[
                          styles.insightIcon,
                          { backgroundColor: `${getConfidenceColor(insight.confidence)}20` }
                        ]}>
                          {insight.type === 'pattern' && <MaterialCommunityIcons name="chart-timeline-variant" size={18} color={getConfidenceColor(insight.confidence)} />}
                          {insight.type === 'trend' && <Feather name="trending-up" size={18} color={getConfidenceColor(insight.confidence)} />}
                          {insight.type === 'recommendation' && <Feather name="target" size={18} color={getConfidenceColor(insight.confidence)} />}
                          {insight.type === 'anomaly' && <Feather name="alert-circle" size={18} color={getConfidenceColor(insight.confidence)} />}
                        </View>
                        <View style={styles.titleContainer}>
                          <Text style={styles.insightTitle}>
                            {insight.title}
                          </Text>
                          <View style={styles.confidenceDisplay}>
                            <Text style={[styles.confidencePercentage, { color: trendColor }]}>
                              {confidencePercentage}%
                            </Text>
                            {confidenceTrend !== 'neutral' && (
                              <Feather 
                                name={confidenceTrend === 'up' ? 'trending-up' : 'trending-down'} 
                                size={14} 
                                color={trendColor} 
                              />
                            )}
                          </View>
                        </View>
                      </View>
                      <Feather 
                        name={expandedInsight === insight.id ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="rgba(255, 255, 255, 0.6)" 
                      />
                    </View>
                    
                    <Text 
                      style={styles.insightDescription}
                      numberOfLines={expandedInsight === insight.id ? undefined : 2}
                    >
                      {insight.description}
                    </Text>
                    
                    {insight.category && (
                      <View style={styles.insightFooter}>
                        <Text style={styles.categoryTag}>
                          {insight.category}
                        </Text>
                      </View>
                    )}
                    
                    {insight.actionable && expandedInsight === insight.id && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Take Action</Text>
                        <Feather name="arrow-right" size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                    </View>
                  </LinearGradient>
                </BlurView>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
        })}
      </ScrollView>
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }]}>
        Behavioral Insights
      </Text>
      
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
              activeTab === tab.id && { borderBottomColor: tab.color }
            ]}
            onPress={() => handleTabClick(tab.id)}
          >
            {getTabIcon(tab.icon, activeTab === tab.id, tab.color)}
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.id ? tab.color : (isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500]) }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  orbContainer: {
    position: 'absolute',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    position: 'absolute',
    zIndex: 4,
  },
  orbGlow: {
    position: 'absolute',
    zIndex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  contentContainer: {
    minHeight: 200,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: NuminaColors.green,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  insightCard: {
    position: 'relative',
    marginBottom: 16,
    marginHorizontal: 4,
  },
  cardTouchable: {
    position: 'relative',
    zIndex: 10,
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  blurView: {
    borderRadius: 20,
    overflow: 'hidden',
    flex: 1,
  },
  gradientOverlay: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flex: 1,
  },
  cardContent: {
    padding: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  confidenceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidencePercentage: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  insightDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  insightFooter: {
    marginTop: 8,
  },
  categoryTag: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    backgroundColor: '#00ff88',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});