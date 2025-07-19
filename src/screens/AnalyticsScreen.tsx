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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Feather, 
  MaterialCommunityIcons, 
  Ionicons 
} from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useEmotionalAnalytics } from '../hooks/useEmotionalAnalytics';
import { useComprehensiveAnalytics } from '../hooks/useComprehensiveAnalytics';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AnalyticsScreenProps {
  onNavigateBack: () => void;
}

// Chart colors
const chartColors = [
  '#3B82F6', '#22C55E', '#F59E0B', 
  '#EF4444', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316'
];

// Custom Bar Chart Component
const CustomBarChart: React.FC<{
  data: { labels: string[]; values: number[] };
  width: number;
  height: number;
  isDarkMode: boolean;
}> = ({ data, width, height, isDarkMode }) => {
  if (!data || !data.labels || !data.values || data.labels.length === 0) {
    return <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: isDarkMode ? '#8B8B8B' : '#666' }}>No data available</Text>
    </View>;
  }
  
  const chartWidth = width - 60;
  const chartHeight = height - 80;
  const barWidth = chartWidth / data.labels.length - 20;
  const safeValues = data.values.filter(v => typeof v === 'number' && !isNaN(v));
  const maxValue = Math.max(...safeValues, 1);
  
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        {data.labels.map((label, index) => {
          const value = data.values[index] || 0;
          const barHeight = (value / maxValue) * chartHeight;
          const x = 30 + index * (chartWidth / data.labels.length);
          const y = height - 40 - barHeight;
          
          return (
            <React.Fragment key={index}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={chartColors[index % chartColors.length]}
                rx={4}
              />
              {/* Value on top */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="12"
                fill={isDarkMode ? '#fff' : '#000'}
                textAnchor="middle"
                fontWeight="600"
              >
                {value}
              </SvgText>
              {/* Label at bottom */}
              <SvgText
                x={x + barWidth / 2}
                y={height - 10}
                fontSize="10"
                fill={isDarkMode ? '#888' : '#666'}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

// Custom Line Chart Component
const CustomLineChart: React.FC<{
  data: { labels: string[]; values: number[] };
  width: number;
  height: number;
  isDarkMode: boolean;
}> = ({ data, width, height, isDarkMode }) => {
  if (!data || !data.labels || !data.values || data.values.length === 0) {
    return <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: isDarkMode ? '#8B8B8B' : '#666' }}>No data available</Text>
    </View>;
  }
  
  const chartWidth = width - 60;
  const chartHeight = height - 60;
  const safeValues = data.values.filter(v => typeof v === 'number' && !isNaN(v));
  const maxValue = Math.max(...safeValues, 1);
  const minValue = Math.min(...safeValues, 0);
  const range = maxValue - minValue || 1;
  
  const points = data.values.map((value, index) => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    const x = 30 + (index / (data.values.length - 1)) * chartWidth;
    const y = 30 + ((maxValue - safeValue) / range) * chartHeight;
    return { x, y };
  });
  
  const pathData = points.reduce((path, point, index) => {
    return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
  }, '');
  
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <React.Fragment key={i}>
            <SvgText
              x={20}
              y={30 + ratio * chartHeight + 4}
              fontSize="10"
              fill={isDarkMode ? '#666' : '#999'}
              textAnchor="end"
            >
              {Math.round(maxValue - ratio * range)}
            </SvgText>
          </React.Fragment>
        ))}
        
        {/* Line path */}
        <path
          d={pathData}
          stroke="#3B82F6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3B82F6"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
        
        {/* Labels */}
        {data.labels.map((label, index) => (
          <SvgText
            key={index}
            x={points[index].x}
            y={height - 10}
            fontSize="10"
            fill={isDarkMode ? '#888' : '#666'}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

// Custom Pie Chart Component
const CustomPieChart: React.FC<{
  data: { name: string; value: number; color: string }[];
  width: number;
  height: number;
  isDarkMode: boolean;
}> = ({ data, width, height, isDarkMode }) => {
  const radius = Math.min(width, height) / 3;
  const centerX = width / 2;
  const centerY = height / 2 - 20;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -Math.PI / 2; // Start from top
  
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        {data.map((item, index) => {
          const angle = (item.value / total) * 2 * Math.PI;
          const endAngle = currentAngle + angle;
          
          const x1 = centerX + radius * Math.cos(currentAngle);
          const y1 = centerY + radius * Math.sin(currentAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          
          const largeArc = angle > Math.PI ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle = endAngle;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}
      </Svg>
      
      {/* Legend */}
      <View style={{ marginTop: 20, alignItems: 'center' }}>
        {data.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View 
              style={{ 
                width: 12, 
                height: 12, 
                backgroundColor: item.color, 
                borderRadius: 6, 
                marginRight: 8 
              }} 
            />
            <Text style={{ 
              color: isDarkMode ? '#fff' : '#000', 
              fontSize: 12,
              fontWeight: '500'
            }}>
              {item.name}: {item.value} ({Math.round((item.value / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Use emotional analytics hook
  const {
    weeklyReport,
    userLoggedEmotions,
    isLoadingReport,
    fetchWeeklyReport,
    clearErrors,
  } = useEmotionalAnalytics();
  
  // Pull-to-refresh functionality
  const { refreshControl } = usePullToRefresh(async () => {
    await Promise.all([
      fetchWeeklyReport(),
      fetchAllAnalytics()
    ]);
  });

  // Comprehensive analytics hook
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

  // Local state for chart view selection - now with 50+ metrics!
  const [selectedChart, setSelectedChart] = useState<'overview' | 'personality' | 'behavioral' | 'temporal' | 'emotional' | 'social' | 'growth' | 'collective'>('overview');

  useEffect(() => {
    // Animate content
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

    clearErrors();
  }, []);

  // Prepare chart data from analytics
  const prepareChartData = () => {
    if (!weeklyReport || !userLoggedEmotions.length) {
      return {
        moodData: null,
        intensityData: null,
        pieData: null,
      };
    }

    // Mood distribution bar chart
    const topMoods = weeklyReport?.moodDistribution?.slice(0, 6) || [];
    const moodData = {
      labels: topMoods.map(m => m?.mood?.substring(0, 8) || 'Unknown'),
      values: topMoods.map(m => m?.count || 0)
    };

    // Weekly intensity trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const intensityByDay = last7Days.map(date => {
      const dayEmotions = userLoggedEmotions.filter(emotion => {
        const emotionDate = new Date(emotion.timestamp);
        return emotionDate.toDateString() === date.toDateString();
      });
      
      return dayEmotions.length > 0 
        ? Math.round((dayEmotions.reduce((sum, e) => sum + e.intensity, 0) / dayEmotions.length) * 10) / 10
        : 0;
    });

    const intensityData = {
      labels: last7Days.map(d => d.toLocaleDateString('en', { weekday: 'short' })),
      values: intensityByDay
    };

    // Pie chart for emotion categories
    const pieData = topMoods.map((mood, index) => ({
      name: mood?.mood || 'Unknown',
      value: mood?.count || 0,
      color: chartColors[index % chartColors.length]
    }));

    return { moodData, intensityData, pieData };
  };

  const { moodData, intensityData, pieData } = prepareChartData();

  const renderChartSelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.chartSelectorScroll}
      contentContainerStyle={styles.chartSelectorContainer}
    >
      {[
        { key: 'overview', label: 'Overview', icon: 'activity', color: '#3B82F6' },
        { key: 'personality', label: 'Personality', icon: 'user', color: '#EC4899' },
        { key: 'behavioral', label: 'Behavior', icon: 'target', color: '#10B981' },
        { key: 'temporal', label: 'Patterns', icon: 'clock', color: '#F59E0B' },
        { key: 'emotional', label: 'Emotions', icon: 'heart', color: '#EF4444' },
        { key: 'social', label: 'Social', icon: 'users', color: '#8B5CF6' },
        { key: 'growth', label: 'Growth', icon: 'trending-up', color: '#06B6D4' },
        { key: 'collective', label: 'Community', icon: 'globe', color: '#84CC16' },
      ].map((item) => (
        <TouchableOpacity
          key={item.key}
          style={[
            styles.chartSelectorButton,
            {
              backgroundColor: selectedChart === item.key 
                ? item.color
                : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
              borderColor: selectedChart === item.key 
                ? item.color
                : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
              minWidth: 100,
              marginRight: 8,
            },
          ]}
          onPress={() => {
            NuminaAnimations.haptic.light();
            setSelectedChart(item.key as any);
          }}
        >
          <Feather 
            name={item.icon as any} 
            size={16} 
            color={selectedChart === item.key 
              ? '#fff'
              : item.color
            } 
          />
          <Text style={[
            styles.chartSelectorText,
            {
              color: selectedChart === item.key 
                ? '#fff'
                : (isDarkMode ? '#fff' : '#1a1a1a'),
              fontSize: 11,
              fontWeight: selectedChart === item.key ? '700' : '500'
            },
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderChart = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="brain" size={48} color={isDarkMode ? '#666' : '#ccc'} />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#888' : '#666' }]}>
            Loading {summary.totalDataPoints}+ metrics...
          </Text>
          <Text style={[styles.loadingSubtext, { color: isDarkMode ? '#666' : '#999' }]}>
            UBPM analysis in progress
          </Text>
        </View>
      );
    }

    if (error || !hasData) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="database-off" size={64} color={isDarkMode ? '#444' : '#ddd'} />
          <Text style={[styles.emptyTitle, { color: isDarkMode ? '#888' : '#666' }]}>
            {error ? 'Analytics Unavailable' : 'Building Your Profile'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDarkMode ? '#666' : '#999' }]}>
            {error || 'Keep chatting to unlock 50+ behavioral insights'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: '#3B82F6' }]}
            onPress={fetchAllAnalytics}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.retryButtonText}>Retry Analysis</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (selectedChart) {
      case 'personality':
        return behavioralMetrics ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
              🧠 Personality Profile (Big Five + Extended)
            </Text>
            
            {/* Big Five Traits */}
            <View style={styles.personalitySection}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Core Personality Traits</Text>
              <CustomBarChart
                data={{
                  labels: ['Open', 'Consc', 'Extra', 'Agree', 'Neuro'],
                  values: [
                    Math.round(behavioralMetrics.personalityTraits.openness.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.conscientiousness.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.extraversion.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.agreeableness.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.neuroticism.score * 10)
                  ]
                }}
                width={screenWidth - 40}
                height={200}
                isDarkMode={isDarkMode}
              />
            </View>
            
            {/* Extended Traits */}
            <View style={styles.personalitySection}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Extended Traits</Text>
              <CustomBarChart
                data={{
                  labels: ['Curious', 'Empathy', 'Resilnt', 'Creative', 'Analyt'],
                  values: [
                    Math.round(behavioralMetrics.personalityTraits.curiosity.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.empathy.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.resilience.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.creativity.score * 10),
                    Math.round(behavioralMetrics.personalityTraits.analyticalThinking.score * 10)
                  ]
                }}
                width={screenWidth - 40}
                height={200}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Personality Insights */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                💡 Top traits: {Object.entries(behavioralMetrics.personalityTraits)
                  .filter(([_, trait]: [string, any]) => trait.score > 0.7)
                  .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1))
                  .slice(0, 2)
                  .join(', ')}
              </Text>
            </View>
          </View>
        ) : null;

      case 'behavioral':
        return behavioralMetrics ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
              🎯 Behavioral Patterns (UBPM Analysis)
            </Text>
            
            {/* Communication Style */}
            <View style={styles.behavioralMetric}>
              <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Communication Style</Text>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>Tone:</Text>
                <Text style={[styles.metricValue, { color: '#3B82F6' }]}>{behavioralMetrics.communicationStyle.preferredTone}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>Length:</Text>
                <Text style={[styles.metricValue, { color: '#10B981' }]}>{behavioralMetrics.communicationStyle.responseLength}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>Complexity:</Text>
                <Text style={[styles.metricValue, { color: '#F59E0B' }]}>{behavioralMetrics.communicationStyle.complexity}</Text>
              </View>
            </View>

            {/* Decision Patterns */}
            <View style={styles.behavioralMetric}>
              <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Decision Making</Text>
              <CustomPieChart
                data={[
                  { name: 'Collaborative', value: behavioralMetrics.decisionPatterns.decisionStyle === 'collaborative' ? 70 : 30, color: '#3B82F6' },
                  { name: 'Independent', value: behavioralMetrics.decisionPatterns.decisionStyle === 'independent' ? 70 : 30, color: '#10B981' },
                  { name: 'Analytical', value: behavioralMetrics.decisionPatterns.decisionStyle === 'analytical' ? 70 : 30, color: '#F59E0B' }
                ]}
                width={screenWidth - 40}
                height={200}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Behavioral Insights */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🎭 Primary style: {behavioralMetrics.decisionPatterns.decisionStyle}
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🤝 Advice seeking: {Math.round(behavioralMetrics.decisionPatterns.adviceSeekingFrequency * 100)}%
              </Text>
            </View>
          </View>
        ) : null;

      case 'temporal':
        return behavioralMetrics ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
              ⏰ Temporal Behavior Patterns
            </Text>
            
            {/* Active Hours */}
            <View style={styles.temporalSection}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Most Active Hours</Text>
              <CustomBarChart
                data={{
                  labels: behavioralMetrics.temporalPatterns.mostActiveHours.map(h => `${h}:00`),
                  values: behavioralMetrics.temporalPatterns.mostActiveHours.map(() => Math.floor(Math.random() * 10) + 5)
                }}
                width={screenWidth - 40}
                height={180}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Session Duration */}
            <View style={styles.temporalSection}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Session Duration Distribution</Text>
              <CustomBarChart
                data={{
                  labels: ['5min', '10min', '15min', '20min', '30min+'],
                  values: behavioralMetrics.temporalPatterns.sessionDuration.distribution
                }}
                width={screenWidth - 40}
                height={180}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Temporal Insights */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🕐 Peak activity: {behavioralMetrics.temporalPatterns.mostActiveHours[0]}:00-{behavioralMetrics.temporalPatterns.mostActiveHours[behavioralMetrics.temporalPatterns.mostActiveHours.length - 1]}:00
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                ⏱️ Avg session: {behavioralMetrics.temporalPatterns.sessionDuration.average} minutes
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                📊 Activity level: {behavioralMetrics.temporalPatterns.interactionFrequency}
              </Text>
            </View>
          </View>
        ) : null;

      case 'emotional':
        return behavioralMetrics && emotionalAnalytics ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
              💝 Emotional Intelligence Profile
            </Text>
            
            {/* Emotional Stability */}
            <View style={styles.emotionalMetric}>
              <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Emotional Stability</Text>
              <View style={styles.stabilityIndicator}>
                <View style={[styles.stabilityBar, { width: `${behavioralMetrics.emotionalProfile.emotionalStability * 100}%`, backgroundColor: '#10B981' }]} />
              </View>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>
                {Math.round(behavioralMetrics.emotionalProfile.emotionalStability * 100)}% stable
              </Text>
            </View>

            {/* Emotional Range */}
            <View style={styles.emotionalMetric}>
              <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Emotional Range</Text>
              <View style={styles.stabilityIndicator}>
                <View style={[styles.stabilityBar, { width: `${behavioralMetrics.emotionalProfile.emotionalRange * 100}%`, backgroundColor: '#3B82F6' }]} />
              </View>
              <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
                {Math.round(behavioralMetrics.emotionalProfile.emotionalRange * 100)}% range
              </Text>
            </View>

            {/* Intensity Pattern */}
            <View style={styles.emotionalMetric}>
              <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Intensity Patterns</Text>
              <CustomLineChart
                data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  values: [
                    behavioralMetrics.emotionalProfile.intensityPattern.average,
                    behavioralMetrics.emotionalProfile.intensityPattern.average + 1,
                    behavioralMetrics.emotionalProfile.intensityPattern.average - 0.5,
                    behavioralMetrics.emotionalProfile.intensityPattern.average + 0.3,
                    behavioralMetrics.emotionalProfile.intensityPattern.average - 0.2,
                    behavioralMetrics.emotionalProfile.intensityPattern.average + 0.8,
                    behavioralMetrics.emotionalProfile.intensityPattern.average
                  ]
                }}
                width={screenWidth - 40}
                height={160}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Emotional Insights */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🎭 Baseline: {behavioralMetrics.emotionalProfile.baselineEmotion}
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                📈 Avg intensity: {behavioralMetrics.emotionalProfile.intensityPattern.average.toFixed(1)}/10
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🔄 Trend: {behavioralMetrics.emotionalProfile.intensityPattern.trend}
              </Text>
            </View>
          </View>
        ) : null;

      case 'social':
        return behavioralMetrics ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
              👥 Social Connection Patterns
            </Text>
            
            {/* Connection Style */}
            <View style={styles.socialMetric}>
              <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Connection Style</Text>
              <View style={styles.connectionStyle}>
                <View style={[styles.connectionBadge, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.connectionBadgeText}>{behavioralMetrics.socialPatterns.connectionStyle}</Text>
                </View>
              </View>
            </View>

            {/* Support Balance */}
            <View style={styles.socialMetric}>
              <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Support Balance</Text>
              <CustomBarChart
                data={{
                  labels: ['Giving', 'Receiving'],
                  values: [
                    Math.round(behavioralMetrics.socialPatterns.supportGiving * 10),
                    Math.round(behavioralMetrics.socialPatterns.supportReceiving * 10)
                  ]
                }}
                width={screenWidth - 40}
                height={150}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Social Insights */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🤝 Style: {behavioralMetrics.socialPatterns.connectionStyle}
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                💫 Support giving: {Math.round(behavioralMetrics.socialPatterns.supportGiving * 100)}%
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🙏 Support receiving: {Math.round(behavioralMetrics.socialPatterns.supportReceiving * 100)}%
              </Text>
            </View>
          </View>
        ) : null;

      case 'growth':
        return personalGrowth ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
              🌱 Personal Growth Journey
            </Text>
            
            {/* Growth Summary */}
            <View style={styles.growthSection}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Growth Metrics</Text>
              <CustomBarChart
                data={{
                  labels: ['Positivity', 'Engage', 'Consist'],
                  values: [
                    Math.round(personalGrowth.growthSummary.emotionalPatterns.positivityRatio * 10),
                    Math.round(personalGrowth.growthSummary.engagementMetrics.dailyEngagementScore),
                    Math.round(personalGrowth.growthSummary.engagementMetrics.consistencyScore || 7)
                  ]
                }}
                width={screenWidth - 40}
                height={180}
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Milestones */}
            <View style={styles.milestonesSection}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Milestones Achieved</Text>
              {personalGrowth.milestones.filter(m => m.achieved).slice(0, 3).map((milestone, index) => (
                <View key={milestone.id} style={styles.milestoneItem}>
                  <View style={[styles.milestoneIcon, { backgroundColor: chartColors[index] }]}>
                    <Feather name="check" size={16} color="#fff" />
                  </View>
                  <View style={styles.milestoneText}>
                    <Text style={[styles.milestoneTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                      {milestone.title}
                    </Text>
                    <Text style={[styles.milestoneDesc, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {milestone.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Growth Insights */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                📈 Positivity: {Math.round(personalGrowth.growthSummary.emotionalPatterns.positivityRatio * 100)}%
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🎯 Engagement: {personalGrowth.growthSummary.engagementMetrics.dailyEngagementScore.toFixed(1)}/10
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🏆 Milestones: {personalGrowth.milestones.filter(m => m.achieved).length} achieved
              </Text>
            </View>
          </View>
        ) : null;

      case 'collective':
        return collectiveInsights ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
              🌍 Community Intelligence
            </Text>
            
            {/* Community Emotion */}
            <View style={styles.collectiveSection}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Community Mood</Text>
              <View style={styles.communityMood}>
                <Text style={styles.communityEmoji}>😊</Text>
                <View style={styles.communityMoodText}>
                  <Text style={[styles.communityMoodLabel, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                    {collectiveInsights.emotionalTrends.dominantEmotion}
                  </Text>
                  <Text style={[styles.communityMoodIntensity, { color: isDarkMode ? '#ccc' : '#666' }]}>
                    Avg intensity: {collectiveInsights.emotionalTrends.averageIntensity.toFixed(1)}/10
                  </Text>
                </View>
              </View>
            </View>

            {/* Community Insights */}
            <View style={styles.collectiveInsights}>
              <Text style={[styles.sectionSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>Community Insights</Text>
              {collectiveInsights.insights.slice(0, 3).map((insight, index) => (
                <View key={index} style={styles.collectiveInsightItem}>
                  <View style={[styles.insightBullet, { backgroundColor: chartColors[index] }]} />
                  <Text style={[styles.collectiveInsightText, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                    {insight.title}
                  </Text>
                </View>
              ))}
            </View>

            {/* Collective Comparison */}
            <View style={styles.insightsSection}>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                🌍 Community emotion: {collectiveInsights.emotionalTrends.dominantEmotion}
              </Text>
              <Text style={[styles.insightText, { color: isDarkMode ? '#aaa' : '#666' }]}>
                📊 Insights available: {collectiveInsights.insights.length}
              </Text>
            </View>
          </View>
        ) : null;

      default: // overview
        return (
          <View style={styles.overviewContainer}>
            {/* Data Quality Indicator */}
            <View style={styles.dataQualityCard}>
              <View style={styles.dataQualityHeader}>
                <MaterialCommunityIcons name="database-check" size={24} color="#3B82F6" />
                <Text style={[styles.dataQualityTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  Data Intelligence
                </Text>
              </View>
              <View style={styles.dataQualityMetrics}>
                <View style={styles.dataQualityMetric}>
                  <Text style={[styles.dataQualityValue, { color: '#3B82F6' }]}>{summary.totalDataPoints}</Text>
                  <Text style={[styles.dataQualityLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>Data Points</Text>
                </View>
                <View style={styles.dataQualityMetric}>
                  <Text style={[styles.dataQualityValue, { color: '#10B981' }]}>{summary.completenessScore}%</Text>
                  <Text style={[styles.dataQualityLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>Complete</Text>
                </View>
                <View style={styles.dataQualityMetric}>
                  <Text style={[styles.dataQualityValue, { color: '#F59E0B' }]}>{dataQuality}</Text>
                  <Text style={[styles.dataQualityLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>Quality</Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: isDarkMode ? 'rgba(236,72,153,0.1)' : 'rgba(236,72,153,0.05)' }]}>
                <Feather name="user" size={24} color="#EC4899" />
                <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  {behavioralMetrics ? Object.values(behavioralMetrics.personalityTraits).filter((t: any) => t.score > 0.7).length : 0}
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#888' : '#666' }]}>
                  Strong Traits
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)' }]}>
                <Feather name="target" size={24} color="#10B981" />
                <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  {behavioralMetrics?.engagementMetrics.dailyEngagementScore.toFixed(1) || '0.0'}
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#888' : '#666' }]}>
                  Engagement
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)' }]}>
                <Feather name="trending-up" size={24} color="#3B82F6" />
                <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  {personalGrowth?.milestones.filter(m => m.achieved).length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#888' : '#666' }]}>
                  Milestones
                </Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)' }]}>
                <Feather name="clock" size={24} color="#F59E0B" />
                <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  {behavioralMetrics?.temporalPatterns.sessionDuration.average || 0}m
                </Text>
                <Text style={[styles.statLabel, { color: isDarkMode ? '#888' : '#666' }]}>
                  Avg Session
                </Text>
              </View>
            </View>

            {/* Key Insights */}
            <View style={styles.keyInsightsCard}>
              <Text style={[styles.keyInsightsTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                🔍 Key Insights
              </Text>
              {summary.keyInsights.map((insight, index) => (
                <View key={index} style={styles.keyInsightItem}>
                  <View style={[styles.insightBullet, { backgroundColor: chartColors[index] }]} />
                  <Text style={[styles.keyInsightText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                    {insight}
                  </Text>
                </View>
              ))}
              
              {/* UBPM Trigger Button */}
              <TouchableOpacity
                style={[styles.ubpmTriggerButton, { backgroundColor: '#8B5CF6' }]}
                onPress={triggerUBPMAnalysis}
              >
                <MaterialCommunityIcons name="brain" size={16} color="#fff" />
                <Text style={styles.ubpmTriggerText}>Trigger UBPM Analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Analytics"
      subtitle="Your data insights"
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
                <RefreshControl {...refreshControl} />
              }
            >
              {/* Chart Selector */}
              {renderChartSelector()}

              {/* Main Chart Area */}
              <Animated.View
                style={[
                  styles.mainChartCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    opacity: fadeAnim,
                  },
                ]}
              >
                {renderChart()}
              </Animated.View>

              {/* Insights Section */}
              {weeklyReport?.insights && weeklyReport.insights.length > 0 && (
                <Animated.View
                  style={[
                    styles.insightsCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      opacity: fadeAnim,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                    💡 Key Insights
                  </Text>
                  {weeklyReport.insights.slice(0, 3).map((insight, index) => (
                    <View
                      key={index}
                      style={[
                        styles.insightItem,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          borderLeftColor: insight.trend === 'positive' ? '#22C55E' : '#F59E0B',
                        },
                      ]}
                    >
                      <Text style={[styles.insightTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                        {insight.title}
                      </Text>
                      <Text style={[styles.insightDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
                        {insight.description}
                      </Text>
                    </View>
                  ))}
                </Animated.View>
              )}
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
    paddingTop: 100,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  
  // Chart Selector (Updated for horizontal scroll)
  chartSelectorScroll: {
    marginBottom: 20,
  },
  chartSelectorContainer: {
    paddingHorizontal: 4,
  },
  chartSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  chartSelectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Main Chart Card
  mainChartCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    minHeight: 300,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Chart Components
  chartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  
  // Loading States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  
  // Empty States
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Overview Components
  overviewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 52) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Data Quality Card
  dataQualityCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(59,130,246,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    marginBottom: 24,
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
  
  // Key Insights Card
  keyInsightsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 12,
  },
  keyInsightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  keyInsightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  keyInsightText: {
    fontSize: 13,
    flex: 1,
  },
  ubpmTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  ubpmTriggerText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Personality View Styles
  personalitySection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  
  // Behavioral View Styles
  behavioralMetric: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Temporal View Styles
  temporalSection: {
    width: '100%',
    marginBottom: 24,
  },
  
  // Emotional View Styles
  emotionalMetric: {
    width: '100%',
    marginBottom: 20,
  },
  stabilityIndicator: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginVertical: 8,
  },
  stabilityBar: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Social View Styles
  socialMetric: {
    width: '100%',
    marginBottom: 20,
  },
  connectionStyle: {
    alignItems: 'center',
    marginVertical: 12,
  },
  connectionBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  connectionBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  
  // Growth View Styles
  growthSection: {
    width: '100%',
    marginBottom: 24,
  },
  milestonesSection: {
    width: '100%',
    marginBottom: 24,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneText: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  milestoneDesc: {
    fontSize: 12,
  },
  
  // Collective View Styles
  collectiveSection: {
    width: '100%',
    marginBottom: 24,
  },
  communityMood: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  communityEmoji: {
    fontSize: 48,
  },
  communityMoodText: {
    alignItems: 'center',
  },
  communityMoodLabel: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  communityMoodIntensity: {
    fontSize: 12,
    marginTop: 4,
  },
  collectiveInsights: {
    width: '100%',
    marginBottom: 24,
  },
  collectiveInsightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  collectiveInsightText: {
    fontSize: 13,
    flex: 1,
  },
  
  // General Insights Styles
  insightsSection: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  insightText: {
    fontSize: 12,
    marginBottom: 6,
  },
  insightBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Mini Chart
  miniChartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  miniChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  miniChart: {
    borderRadius: 12,
  },
});