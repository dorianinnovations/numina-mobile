import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Feather, 
  MaterialCommunityIcons, 
  Ionicons 
} from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ChromaticCard, ChromaticText } from '../components/ChromaticCard';
import { BaseWalletCard } from '../components/WalletCard';
import { EnhancedSpinner } from '../components/EnhancedSpinner';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { useComprehensiveAnalytics } from '../hooks/useComprehensiveAnalytics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdvancedAnalyticsScreenProps {
  onNavigateBack?: () => void;
}

interface MetricTile {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  confidence?: number;
}

interface InsightCard {
  id: string;
  category: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const AdvancedAnalyticsScreen: React.FC<AdvancedAnalyticsScreenProps> = ({ 
  onNavigateBack 
}) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'personality' | 'behavior' | 'emotional' | 'social' | 'growth'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    personalGrowth,
    behavioralMetrics,
    collectiveInsights,
    emotionalAnalytics,
    ubpmContext,
    recommendations,
    isLoading,
    error,
    summary,
    fetchAllAnalytics,
    triggerUBPMAnalysis,
    hasData,
    isFullyLoaded,
    dataQuality
  } = useComprehensiveAnalytics();

  const { refreshControl: refreshControlProps } = usePullToRefresh(async () => {
    setIsRefreshing(true);
    await fetchAllAnalytics(true); // Force refresh on manual pull-to-refresh
    setIsRefreshing(false);
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isFullyLoaded) {
      fetchAllAnalytics();
    }
  }, []);

  const generateMetricTiles = (): MetricTile[] => {
    if (!behavioralMetrics || !personalGrowth) return [];

    return [
      {
        id: 'engagement',
        title: 'Engagement Score',
        value: behavioralMetrics.engagementMetrics.dailyEngagementScore.toFixed(1),
        subtitle: 'Daily interaction quality',
        icon: 'target',
        color: '#3B82F6',
        trend: 'up',
        confidence: 0.92
      },
      {
        id: 'emotional_stability',
        title: 'Emotional Stability',
        value: `${Math.round(behavioralMetrics.emotionalProfile.emotionalStability * 100)}%`,
        subtitle: 'Emotional regulation',
        icon: 'heart',
        color: '#10B981',
        trend: 'stable',
        confidence: 0.88
      },
      {
        id: 'growth_velocity',
        title: 'Growth Velocity',
        value: `${personalGrowth.growthSummary.engagementMetrics.dailyEngagementScore.toFixed(1)}x`,
        subtitle: 'Personal development rate',
        icon: 'trending-up',
        color: '#8B5CF6',
        trend: 'up',
        confidence: 0.85
      },
      {
        id: 'social_connection',
        title: 'Social Resonance',
        value: `${Math.round(behavioralMetrics.socialPatterns.supportGiving * 100)}%`,
        subtitle: 'Community connection',
        icon: 'users',
        color: '#EC4899',
        trend: 'up',
        confidence: 0.79
      },
      {
        id: 'cognitive_complexity',
        title: 'Cognitive Depth',
        value: behavioralMetrics.communicationStyle.complexity,
        subtitle: 'Thinking sophistication',
        icon: 'zap',
        color: '#F59E0B',
        trend: 'stable',
        confidence: 0.91
      },
      {
        id: 'temporal_consistency',
        title: 'Consistency Score',
        value: `${Math.round(behavioralMetrics.engagementMetrics.consistencyScore || 0)}%`,
        subtitle: 'Behavioral patterns',
        icon: 'clock',
        color: '#06B6D4',
        trend: 'up',
        confidence: 0.83
      }
    ];
  };

  const generateInsightCards = (): InsightCard[] => {
    if (!behavioralMetrics || !personalGrowth) return [];

    const insights: InsightCard[] = [];

    if (behavioralMetrics.personalityTraits.openness.score > 0.7) {
      insights.push({
        id: 'openness_insight',
        category: 'Personality',
        title: 'High Openness to Experience',
        description: 'Your curiosity and willingness to explore new ideas drives creative problem-solving and innovative thinking patterns.',
        confidence: behavioralMetrics.personalityTraits.openness.confidence,
        actionable: true,
        priority: 'high'
      });
    }

    if (behavioralMetrics.emotionalProfile.emotionalStability > 0.8) {
      insights.push({
        id: 'emotional_insight',
        category: 'Emotional',
        title: 'Exceptional Emotional Regulation',
        description: 'Your emotional stability indicates strong self-awareness and resilience in challenging situations.',
        confidence: 0.89,
        actionable: true,
        priority: 'medium'
      });
    }

    if (behavioralMetrics.socialPatterns.supportGiving > 0.7) {
      insights.push({
        id: 'social_insight',
        category: 'Social',
        title: 'Natural Support Provider',
        description: 'Your tendency to offer help and guidance suggests strong empathetic abilities and community leadership potential.',
        confidence: 0.86,
        actionable: true,
        priority: 'high'
      });
    }

    return insights.slice(0, 6);
  };

  const metricTiles = generateMetricTiles();
  const insightCards = generateInsightCards();

  const timeframeButtons = [
    { key: 'day', label: '24H', color: '#3B82F6' },
    { key: 'week', label: '7D', color: '#10B981' },
    { key: 'month', label: '30D', color: '#F59E0B' },
    { key: 'all', label: 'All', color: '#8B5CF6' }
  ];

  const categoryButtons = [
    { key: 'all', label: 'All', icon: 'grid', color: '#6B7280' },
    { key: 'personality', label: 'Mind', icon: 'user', color: '#EC4899' },
    { key: 'behavior', label: 'Actions', icon: 'target', color: '#10B981' },
    { key: 'emotional', label: 'Heart', icon: 'heart', color: '#EF4444' },
    { key: 'social', label: 'Connect', icon: 'users', color: '#8B5CF6' },
    { key: 'growth', label: 'Evolve', icon: 'trending-up', color: '#06B6D4' }
  ];

  const renderMetricTile = (metric: MetricTile) => (
    <BaseWalletCard
      key={metric.id}
      style={[
        styles.metricTile,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        }
      ]}
    >
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
          <Feather name={metric.icon as any} size={20} color={metric.color} />
        </View>
        {metric.trend && (
          <View style={[styles.trendIndicator, { backgroundColor: getTrendColor(metric.trend) }]}>
            <Feather 
              name={metric.trend === 'up' ? 'trending-up' : metric.trend === 'down' ? 'trending-down' : 'minus'} 
              size={12} 
              color="#fff" 
            />
          </View>
        )}
      </View>
      
      <Text style={[styles.metricValue, { color: metric.color }]}>
        {metric.value}
      </Text>
      
      <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
        {metric.title}
      </Text>
      
      <Text style={[styles.metricSubtitle, { color: isDarkMode ? '#888' : '#666' }]}>
        {metric.subtitle}
      </Text>
      
      {metric.confidence && (
        <View style={styles.confidenceBar}>
          <View style={[
            styles.confidenceFill,
            {
              width: `${metric.confidence * 100}%`,
              backgroundColor: metric.color
            }
          ]} />
        </View>
      )}
    </BaseWalletCard>
  );

  const renderInsightCard = (insight: InsightCard) => (
    <ChromaticCard
      key={insight.id}
      tier={insight.priority === 'high' ? 'aether' : 'core'}
      style={styles.insightCard}
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightCategory}>
          <Text style={[styles.categoryLabel, { 
            color: insight.priority === 'high' ? '#a855f7' : '#94a3b8'
          }]}>
            {insight.category}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { 
          backgroundColor: getPriorityColor(insight.priority) 
        }]}>
          <Text style={styles.priorityText}>{insight.priority}</Text>
        </View>
      </View>
      
      <ChromaticText 
        tier={insight.priority === 'high' ? 'aether' : 'core'}
        variant="title"
        style={styles.insightTitle}
      >
        {insight.title}
      </ChromaticText>
      
      <Text style={[styles.insightDescription, { 
        color: isDarkMode ? '#ccc' : '#666' 
      }]}>
        {insight.description}
      </Text>
      
      <View style={styles.insightFooter}>
        <View style={styles.confidenceIndicator}>
          <Text style={[styles.confidenceLabel, { 
            color: isDarkMode ? '#888' : '#666' 
          }]}>
            Confidence: {Math.round(insight.confidence * 100)}%
          </Text>
        </View>
        
        {insight.actionable && (
          <TouchableOpacity style={[styles.actionButton, {
            backgroundColor: insight.priority === 'high' ? '#a855f7' : '#3B82F6'
          }]}>
            <Feather name="arrow-right" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </ChromaticCard>
  );

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  if (isLoading && !isFullyLoaded) {
    return (
      <ScreenWrapper
        showHeader={true}
        showBackButton={true}
        showMenuButton={true}
        title="Advanced Analytics"
        subtitle="Deep behavioral insights"
      >
        <PageBackground>
          <SafeAreaView style={styles.container}>
            <View style={styles.loadingContainer}>
              <EnhancedSpinner type="holographic" size="large" />
              <Text style={[styles.loadingText, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                Analyzing {summary.totalDataPoints}+ behavioral patterns...
              </Text>
              <Text style={[styles.loadingSubtext, { color: isDarkMode ? '#888' : '#666' }]}>
                UBPM deep learning in progress
              </Text>
            </View>
          </SafeAreaView>
        </PageBackground>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Advanced Analytics"
      subtitle="Deep behavioral insights"
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl {...refreshControlProps} />
              }
            >
              {/* Timeframe Selector */}
              <View style={styles.timeframeSelector}>
                {timeframeButtons.map((button) => (
                  <TouchableOpacity
                    key={button.key}
                    style={[
                      styles.timeframeButton,
                      {
                        backgroundColor: selectedTimeframe === button.key 
                          ? button.color
                          : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                        borderColor: selectedTimeframe === button.key 
                          ? button.color
                          : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                      }
                    ]}
                    onPress={() => {
                      NuminaAnimations.haptic.light();
                      setSelectedTimeframe(button.key as any);
                    }}
                  >
                    <Text style={[
                      styles.timeframeText,
                      {
                        color: selectedTimeframe === button.key 
                          ? '#fff'
                          : (isDarkMode ? '#fff' : '#1a1a1a'),
                        fontWeight: selectedTimeframe === button.key ? '700' : '500'
                      }
                    ]}>
                      {button.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Selector */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categorySelector}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {categoryButtons.map((button) => (
                  <TouchableOpacity
                    key={button.key}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selectedCategory === button.key 
                          ? button.color
                          : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                        borderColor: selectedCategory === button.key 
                          ? button.color
                          : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
                      }
                    ]}
                    onPress={() => {
                      NuminaAnimations.haptic.light();
                      setSelectedCategory(button.key as any);
                    }}
                  >
                    <Feather 
                      name={button.icon as any} 
                      size={16} 
                      color={selectedCategory === button.key ? '#fff' : button.color} 
                    />
                    <Text style={[
                      styles.categoryText,
                      {
                        color: selectedCategory === button.key 
                          ? '#fff'
                          : (isDarkMode ? '#fff' : '#1a1a1a'),
                        fontWeight: selectedCategory === button.key ? '600' : '500'
                      }
                    ]}>
                      {button.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Metric Tiles Grid */}
              <View style={styles.metricsSection}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  🎯 Key Metrics
                </Text>
                <View style={styles.metricGrid}>
                  {metricTiles.map(renderMetricTile)}
                </View>
              </View>

              {/* AI Insights Section */}
              <View style={styles.insightsSection}>
                <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  🧠 AI-Powered Insights
                </Text>
                {insightCards.length > 0 ? (
                  insightCards.map(renderInsightCard)
                ) : (
                  <BaseWalletCard style={[
                    styles.emptyInsights,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    }
                  ]}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={48} color={isDarkMode ? '#444' : '#ddd'} />
                    <Text style={[styles.emptyTitle, { color: isDarkMode ? '#888' : '#666' }]}>
                      Keep chatting to unlock insights
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#666' : '#999' }]}>
                      More conversations = deeper understanding
                    </Text>
                  </BaseWalletCard>
                )}
              </View>

              {/* Data Quality Indicator */}
              <BaseWalletCard style={[
                styles.dataQualityCard,
                {
                  backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)',
                  borderColor: 'rgba(59,130,246,0.2)',
                }
              ]}>
                <View style={styles.dataQualityHeader}>
                  <MaterialCommunityIcons name="database-check" size={24} color="#3B82F6" />
                  <Text style={[styles.dataQualityTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                    Analytics Engine Status
                  </Text>
                </View>
                <View style={styles.dataQualityMetrics}>
                  <View style={styles.dataQualityMetric}>
                    <Text style={[styles.dataQualityValue, { color: '#3B82F6' }]}>
                      {summary.totalDataPoints}
                    </Text>
                    <Text style={[styles.dataQualityLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      Data Points
                    </Text>
                  </View>
                  <View style={styles.dataQualityMetric}>
                    <Text style={[styles.dataQualityValue, { color: '#10B981' }]}>
                      {summary.completenessScore}%
                    </Text>
                    <Text style={[styles.dataQualityLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      Complete
                    </Text>
                  </View>
                  <View style={styles.dataQualityMetric}>
                    <Text style={[styles.dataQualityValue, { color: '#F59E0B' }]}>
                      {dataQuality}
                    </Text>
                    <Text style={[styles.dataQualityLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      Quality
                    </Text>
                  </View>
                </View>
              </BaseWalletCard>
            </ScrollView>
          </Animated.View>
        </SafeAreaView>
      </PageBackground>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },

  // Selectors
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  timeframeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  categorySelector: {
    marginBottom: 24,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
    gap: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Sections
  metricsSection: {
    marginBottom: 32,
  },
  insightsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // Metric Tiles
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  metricTile: {
    width: (screenWidth - 56) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  confidenceBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Insight Cards
  insightCard: {
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightCategory: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceIndicator: {
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty States
  emptyInsights: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

  // Data Quality Card
  dataQualityCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  dataQualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dataQualityTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dataQualityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dataQualityMetric: {
    alignItems: 'center',
  },
  dataQualityValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  dataQualityLabel: {
    fontSize: 11,
    marginTop: 4,
  },
});