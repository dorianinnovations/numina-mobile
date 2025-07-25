import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { 
  Feather, 
  MaterialCommunityIcons
} from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/ui/PageBackground';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { BaseWalletCard } from '../components/cards/WalletCard';
import { ShineEffect } from '../components/effects/ShineEffect';
import { EnhancedSpinner } from '../components/loaders/EnhancedSpinner';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsScreenProps {
  onNavigateBack: () => void;
}

const categories = [
  { id: 'all', label: 'Overview', icon: 'brain', color: '#8B5CF6' },
  { id: 'communication', label: 'Communication', icon: 'message-circle', color: '#3B82F6' },
  { id: 'personality', label: 'Personality', icon: 'users', color: '#22C55E' },
  { id: 'behavioral', label: 'Behavioral', icon: 'activity', color: '#F59E0B' },
  { id: 'emotional', label: 'Emotional', icon: 'heart', color: '#EF4444' },
  { id: 'growth', label: 'Growth', icon: 'trending-up', color: '#10B981' }
];

// Lottie Refresh Spinner Component
const LottieRefreshSpinner: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        source={require('../../assets/Loading.json')}
        autoPlay
        loop
        style={{
          width: size,
          height: size,
        }}
      />
    </View>
  );
};

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  onNavigateBack
}) => {
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Analytics hook
  const {
    analytics,
    ubmpAnalysis,
    llmInsights,
    growthSummary,
    recommendations,
    loading,
    refreshing,
    error,
    refresh,
    refreshUBMP,
    refreshInsights,
    lastUpdated
  } = useAnalytics();


  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    
    // Refresh data based on category selection
    if (categoryId === 'all') {
      // Refresh all data when showing overview
      await refresh();
    } else {
      // Refresh specific insights for the selected category
      await refreshInsights(categoryId);
      
      // Also refresh UBMP analysis if it's behavioral category
      if (categoryId === 'behavioral') {
        await refreshUBMP();
      }
    }
  };



  const renderCategorySelector = () => (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const isLoading = refreshing && isSelected;
          
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.7}
              disabled={refreshing}
              style={[
                styles.pillButton,
                {
                  backgroundColor: isSelected
                    ? category.color
                    : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                  borderColor: isSelected
                    ? category.color
                    : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  opacity: refreshing && !isSelected ? 0.5 : 1,
                }
              ]}
            >
              {isLoading ? (
                <EnhancedSpinner type="ring" color={isSelected ? '#fff' : category.color} size={16} />
              ) : (
                <Feather 
                  name={category.icon as any} 
                  size={16} 
                  color={isSelected ? '#fff' : category.color} 
                />
              )}
              <Text style={[
                styles.pillText,
                {
                  color: isSelected
                    ? '#fff'
                    : (isDarkMode ? '#fff' : '#1a1a1a'),
                }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderUBPMAnalysis = () => {
    // Only show UBMP analysis for 'all' or 'behavioral' categories
    if (!ubmpAnalysis || (selectedCategory !== 'all' && selectedCategory !== 'behavioral')) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Behavioral Analysis (UBPM)
        </Text>
        
        <BaseWalletCard style={styles.ubmpCard}>
          <ShineEffect />
          
          <View style={styles.ubmpHeader}>
            <View style={styles.ubmpIconContainer}>
              <MaterialCommunityIcons name="head-lightbulb" size={28} color="#8B5CF6" />
            </View>
            <View style={styles.ubmpTitleContainer}>
              <Text style={[styles.ubmpTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Behavioral Vector Analysis
              </Text>
              <Text style={[styles.ubmpSubtitle, { color: isDarkMode ? '#999' : '#666' }]}>
                {ubmpAnalysis.behavioralInsights.length} insights • {ubmpAnalysis.recommendations.length} recommendations
              </Text>
            </View>
          </View>

          {/* Vector Space Visualization */}
          <View style={styles.vectorContainer}>
            <Text style={[styles.vectorTitle, { color: isDarkMode ? '#ccc' : '#333' }]}>
              Behavioral Vectors
            </Text>
            <View style={styles.vectorGrid}>
              {Object.entries(ubmpAnalysis.vectorSpace).map(([key, value]) => (
                <View key={key} style={styles.vectorItem}>
                  <Text style={[styles.vectorLabel, { color: isDarkMode ? '#999' : '#666' }]}>
                    {key.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={styles.vectorBar}>
                    <View 
                      style={[
                        styles.vectorFill,
                        { 
                          width: `${Math.max(value * 100, 5)}%`,
                          backgroundColor: '#8B5CF6'
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.vectorValue, { color: isDarkMode ? '#fff' : '#000' }]}>
                    {(value * 100).toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Behavioral Insights */}
          {ubmpAnalysis.behavioralInsights.length > 0 && (
            <View style={styles.insightsContainer}>
              <Text style={[styles.insightsTitle, { color: isDarkMode ? '#ccc' : '#333' }]}>
                Key Insights
              </Text>
              {ubmpAnalysis.behavioralInsights.slice(0, 3).map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={[styles.insightDot, { backgroundColor: '#8B5CF6' }]} />
                  <Text style={[styles.insightText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
                    {insight}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </BaseWalletCard>
      </View>
    );
  };

  const renderLLMInsights = () => {
    const filteredInsights = selectedCategory === 'all' 
      ? llmInsights 
      : llmInsights.filter(insight => insight.category === selectedCategory);

    // Show loading state if refreshing and no data yet
    if (filteredInsights.length === 0 && refreshing && selectedCategory !== 'all') {
      return (
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
            {categories.find(cat => cat.id === selectedCategory)?.label || 'Category'} Insights
          </Text>
          <BaseWalletCard style={styles.insightCard}>
            <View style={styles.loadingStateCard}>
              <EnhancedSpinner type="holographic" color="#8B5CF6" size={32} />
              <Text style={[styles.loadingStateText, { color: isDarkMode ? '#999' : '#666' }]}>
                Loading {categories.find(cat => cat.id === selectedCategory)?.label?.toLowerCase() || 'category'} insights...
              </Text>
            </View>
          </BaseWalletCard>
        </View>
      );
    }
    
    if (filteredInsights.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          {selectedCategory === 'all' 
            ? `Pattern Insights (${filteredInsights.length})` 
            : `${categories.find(cat => cat.id === selectedCategory)?.label || 'Category'} Insights (${filteredInsights.length})`
          }
        </Text>
        
        {filteredInsights.map((insight, index) => {
          const categoryInfo = categories.find(cat => cat.id === insight.category);
          
          return (
            <View
              key={`${insight.category}-${index}`}
              style={styles.insightCardWrapper}
            >
              <BaseWalletCard style={styles.insightCard}>
                <View style={styles.insightCardHeader}>
                  <View style={[
                    styles.insightCategoryIcon,
                    { backgroundColor: `${categoryInfo?.color || '#8B5CF6'}20` }
                  ]}>
                    <Feather 
                      name={categoryInfo?.icon as any || 'brain'} 
                      size={16} 
                      color={categoryInfo?.color || '#8B5CF6'} 
                    />
                  </View>
                  <View style={styles.insightCardTitleContainer}>
                    <Text style={[styles.insightCategory, { color: categoryInfo?.color || '#8B5CF6' }]}>
                      {categoryInfo?.label || insight.category.toUpperCase()}
                    </Text>
                    <Text style={[styles.insightConfidence, { color: isDarkMode ? '#999' : '#666' }]}>
                      {Math.round(insight.confidence * 100)}% confidence
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.insightContent, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
                  {insight.insight}
                </Text>
                
                {insight.evidence.length > 0 && (
                  <View style={styles.evidenceContainer}>
                    <Text style={[styles.evidenceTitle, { color: isDarkMode ? '#999' : '#666' }]}>
                      Evidence:
                    </Text>
                    {insight.evidence.slice(0, 2).map((evidence, evidenceIndex) => (
                      <Text key={evidenceIndex} style={[styles.evidenceText, { color: isDarkMode ? '#ccc' : '#555' }]}>
                        • {evidence}
                      </Text>
                    ))}
                  </View>
                )}
              </BaseWalletCard>
            </View>
          );
        })}
      </View>
    );
  };

  const renderGrowthSummary = () => {
    // Show growth summary for 'all' or 'growth' categories
    if (!growthSummary || (selectedCategory !== 'all' && selectedCategory !== 'growth')) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Personal Growth
        </Text>
        
        <BaseWalletCard style={styles.growthCard}>
          <View style={styles.growthHeader}>
            <View style={styles.growthIconContainer}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#10B981" />
            </View>
            <View style={styles.growthProgressContainer}>
              <Text style={[styles.growthTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                Overall Progress
              </Text>
              <Text style={[styles.growthProgress, { color: '#10B981' }]}>
                {Math.round(growthSummary.overallProgress * 100)}%
              </Text>
            </View>
          </View>

          {growthSummary.achievements.length > 0 && (
            <View style={styles.achievementsContainer}>
              <Text style={[styles.achievementsTitle, { color: isDarkMode ? '#ccc' : '#333' }]}>
                Recent Achievements
              </Text>
              {growthSummary.achievements.slice(0, 3).map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <MaterialCommunityIcons name="trophy" size={16} color="#F59E0B" />
                  <Text style={[styles.achievementText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
                    {achievement}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {growthSummary.nextSteps.length > 0 && (
            <View style={styles.nextStepsContainer}>
              <Text style={[styles.nextStepsTitle, { color: isDarkMode ? '#ccc' : '#333' }]}>
                Next Steps
              </Text>
              {growthSummary.nextSteps.slice(0, 2).map((step, index) => (
                <View key={index} style={styles.nextStepItem}>
                  <View style={[styles.nextStepDot, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.nextStepText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </BaseWalletCard>
      </View>
    );
  };

  const renderRecommendations = () => {
    // Show recommendations for 'all' category or when there are category-specific recommendations
    if (recommendations.length === 0 || (selectedCategory !== 'all' && selectedCategory !== 'growth')) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Personalized Recommendations
        </Text>
        
        <BaseWalletCard style={styles.recommendationsCard}>
          <View style={styles.recommendationsHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={24} color="#F59E0B" />
            <Text style={[styles.recommendationsTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Personalized Suggestions
            </Text>
          </View>
          
          {recommendations.slice(0, 4).map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={[styles.recommendationNumber, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.recommendationNumberText}>{index + 1}</Text>
              </View>
              <Text style={[styles.recommendationText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
                {recommendation}
              </Text>
            </View>
          ))}
        </BaseWalletCard>
      </View>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={24} color="#EF4444" />
        <Text style={[styles.errorText, { color: isDarkMode ? '#EF4444' : '#DC2626' }]}>
          {error}
        </Text>
        <TouchableOpacity onPress={refresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <EnhancedSpinner type="holographic" color="#8B5CF6" size={32} />
      <Text style={[styles.loadingText, { color: isDarkMode ? '#999' : '#666' }]}>
        Weaving insights from your patterns...
      </Text>
      <Text style={[styles.loadingSubtext, { color: isDarkMode ? '#666' : '#999' }]}>
        Mapping behavioral resonance through UBPM
      </Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenWrapper 
        showHeader={true}
        showBackButton={true}
        title="Analytics"
        onBackPress={onNavigateBack}
      >
        <PageBackground>
          <View style={styles.container}>
            {renderLoadingState()}
          </View>
        </PageBackground>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper 
      showHeader={true}
      showBackButton={true}
      title="Analytics"
      onBackPress={onNavigateBack}
    >
      <PageBackground>
        <View style={styles.container}>
          {renderCategorySelector()}
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            refreshing && { paddingTop: 60 }
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: false,
              listener: (event: any) => {
                const offsetY = event.nativeEvent.contentOffset.y;
                // Trigger refresh when pulled down beyond -100
                if (offsetY < -100 && !refreshing) {
                  refresh();
                }
              }
            }
          )}
          scrollEventThrottle={16}
          bounces={true}
        >
          {/* Custom Lottie Refresh Indicator */}
          {refreshing && (
            <View style={styles.lottieRefreshContainer}>
              <LottieRefreshSpinner size={38} />
              <Text style={[
                styles.refreshingText,
                { color: isDarkMode ? '#8B5CF6' : '#6366F1' }
              ]}>
                Refreshing insights...
              </Text>
            </View>
          )}
          {renderError()}
          {renderUBPMAnalysis()}
          {renderLLMInsights()}
          {renderGrowthSummary()}
          {renderRecommendations()}
          
          {/* Empty state when no data */}
          {!loading && !error && !ubmpAnalysis && llmInsights.length === 0 && !growthSummary && recommendations.length === 0 && (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons 
                name="chart-line" 
                size={48} 
                color={isDarkMode ? '#666' : '#999'} 
              />
              <Text style={[styles.emptyStateTitle, { color: isDarkMode ? '#999' : '#666' }]}>
                No Analytics Data Available
              </Text>
              <Text style={[styles.emptyStateText, { color: isDarkMode ? '#666' : '#999' }]}>
                Pull down to refresh or start chatting to generate insights
              </Text>
              <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
                <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
                <Text style={styles.refreshButtonText}>Refresh Analytics</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {lastUpdated && (
            <View style={styles.lastUpdatedContainer}>
              <Text style={[styles.lastUpdatedText, { color: isDarkMode ? '#666' : '#999' }]}>
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </Text>
            </View>
          )}
        </ScrollView>
        </View>
      </PageBackground>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryContainer: {
    paddingTop: 140,
    paddingBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  
  // UBMP Card Styles
  ubmpCard: {
    marginHorizontal: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  ubmpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ubmpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ubmpTitleContainer: {
    flex: 1,
  },
  ubmpTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  ubmpSubtitle: {
    fontSize: 13,
  },
  vectorContainer: {
    marginBottom: 20,
  },
  vectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  vectorGrid: {
    gap: 12,
  },
  vectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    width: 80,
  },
  vectorBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  vectorFill: {
    height: '100%',
    borderRadius: 4,
  },
  vectorValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  
  // LLM Insight Card Styles
  insightCardWrapper: {
    marginBottom: 16,
  },
  insightCard: {
    marginHorizontal: 16,
    padding: 20,
  },
  insightCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightCategoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightCardTitleContainer: {
    flex: 1,
  },
  insightCategory: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightConfidence: {
    fontSize: 11,
    marginTop: 1,
  },
  insightContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  evidenceContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  evidenceTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  evidenceText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 2,
  },
  
  // Growth Card Styles
  growthCard: {
    marginHorizontal: 16,
    padding: 20,
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  growthIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  growthProgressContainer: {
    flex: 1,
  },
  growthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  growthProgress: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  achievementsContainer: {
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  achievementText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  nextStepsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nextStepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 12,
  },
  nextStepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Recommendations Card Styles
  recommendationsCard: {
    marginHorizontal: 16,
    padding: 20,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  recommendationNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  lastUpdatedText: {
    fontSize: 11,
    textAlign: 'center',
  },
  
  // Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 20,
    gap: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Loading State Card
  loadingStateCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  loadingStateText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Lottie Refresh Styles
  lottieRefreshContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  refreshingText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});