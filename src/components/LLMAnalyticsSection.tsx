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
} from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { useLLMAnalytics } from '../hooks/useLLMAnalytics';

interface LLMAnalyticsSectionProps {
  isVisible?: boolean;
}

export const LLMAnalyticsSection: React.FC<LLMAnalyticsSectionProps> = ({ isVisible = true }) => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('insights');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
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
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [isVisible, hasCachedInsights, generateInsights]);

  const tabs = [
    { id: 'insights', label: 'Insights', icon: 'brain', color: NuminaColors.purple },
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
      case 'brain':
        return <MaterialCommunityIcons name="brain" size={iconSize} color={iconColor} />;
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
    if (confidence >= 0.9) return NuminaColors.green;
    if (confidence >= 0.7) return NuminaColors.yellow;
    return NuminaColors.pink;
  };

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
        {insights.map((insight) => (
          <TouchableOpacity
            key={insight.id}
            style={[
              styles.insightCard,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }
            ]}
            onPress={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
            activeOpacity={0.7}
          >
            <View style={styles.insightHeader}>
              <View style={styles.insightTitleRow}>
                <View style={[
                  styles.insightIcon,
                  { backgroundColor: `${getConfidenceColor(insight.confidence)}20` }
                ]}>
                  {insight.type === 'pattern' && <MaterialCommunityIcons name="chart-timeline-variant" size={16} color={getConfidenceColor(insight.confidence)} />}
                  {insight.type === 'trend' && <Feather name="trending-up" size={16} color={getConfidenceColor(insight.confidence)} />}
                  {insight.type === 'recommendation' && <Feather name="target" size={16} color={getConfidenceColor(insight.confidence)} />}
                  {insight.type === 'anomaly' && <Feather name="alert-circle" size={16} color={getConfidenceColor(insight.confidence)} />}
                </View>
                <Text style={[styles.insightTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
                  {insight.title}
                </Text>
              </View>
              <Feather 
                name={expandedInsight === insight.id ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500]} 
              />
            </View>
            
            <Text 
              style={[
                styles.insightDescription, 
                { color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[600] }
              ]}
              numberOfLines={expandedInsight === insight.id ? undefined : 2}
            >
              {insight.description}
            </Text>
            
            <View style={styles.insightFooter}>
              <View style={styles.confidenceContainer}>
                <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor(insight.confidence) }]} />
                <Text style={[styles.confidenceText, { color: isDarkMode ? NuminaColors.darkMode[500] : NuminaColors.darkMode[400] }]}>
                  {(insight.confidence * 100).toFixed(0)}% confidence
                </Text>
              </View>
              {insight.category && (
                <Text style={[styles.categoryTag, { 
                  color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500],
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }]}>
                  {insight.category}
                </Text>
              )}
            </View>
            
            {insight.actionable && expandedInsight === insight.id && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: NuminaColors.green }]}>
                <Text style={styles.actionButtonText}>Take Action</Text>
                <Feather name="arrow-right" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : NuminaColors.darkMode[800] }]}>
        AI-Powered Insights
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
    </Animated.View>
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  categoryTag: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});