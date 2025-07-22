import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, G, Text as SvgText, Line, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { PageBackground } from '../components/PageBackground';
import { useComprehensiveAnalytics } from '../hooks/useComprehensiveAnalytics';
import { useLLMAnalytics } from '../hooks/useLLMAnalytics';

const { width, height } = Dimensions.get('window');

interface ModernAnalyticsScreenProps {
  onNavigateBack: () => void;
}

// Chart Components
const LineChart: React.FC<{
  data: number[];
  width: number;
  height: number;
  selectedPoint?: number;
  onSelectPoint?: (index: number) => void;
}> = ({ data, width, height, selectedPoint, onSelectPoint }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  
  const points = data.map((value, index) => ({
    x: (width / (data.length - 1)) * index,
    y: height - ((value - minValue) / range) * height * 0.8 - height * 0.1,
  }));
  
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prevPoint = points[index - 1];
    const controlX = (prevPoint.x + point.x) / 2;
    return `${path} C ${controlX} ${prevPoint.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  
  return (
    <Svg width={width} height={height}>
      <Defs>
        <RadialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#4A9FFF" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#4A9FFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <Line
          key={ratio}
          x1="0"
          y1={height * (1 - ratio)}
          x2={width}
          y2={height * (1 - ratio)}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      
      {/* Area fill */}
      <Path
        d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#blueGlow)"
        opacity={0.2}
      />
      
      {/* Line */}
      <Path
        d={pathData}
        stroke="#4A9FFF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Points */}
      {points.map((point, index) => (
        <G key={index}>
          {selectedPoint === index && (
            <Circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="#4A9FFF"
              opacity="0.3"
            />
          )}
          <Circle
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#4A9FFF"
            onPress={() => onSelectPoint?.(index)}
          />
        </G>
      ))}
    </Svg>
  );
};

const AreaChart: React.FC<{
  data: number[];
  width: number;
  height: number;
  color: string;
}> = ({ data, width, height, color }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => ({
    x: (width / (data.length - 1)) * index,
    y: height - ((value - minValue) / range) * height * 0.9 - height * 0.05,
  }));
  
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');
  
  return (
    <Svg width={width} height={height}>
      <Defs>
        <RadialGradient id="greenGradient" cx="50%" cy="0%" r="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </RadialGradient>
      </Defs>
      
      <Path
        d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#greenGradient)"
      />
      
      <Path
        d={pathData}
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    </Svg>
  );
};

export const ModernAnalyticsScreen: React.FC<ModernAnalyticsScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24hr' | 'Weekly' | 'Monthly'>('Monthly');
  const [selectedChartTimeframe, setSelectedChartTimeframe] = useState<'Week' | 'Month' | 'Max'>('Max');
  const [selectedDataPoint, setSelectedDataPoint] = useState<number | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Real user analytics data
  const {
    personalGrowth,
    behavioralMetrics,
    emotionalAnalytics,
    isLoading,
    error,
    summary,
    fetchAllAnalytics,
    hasData
  } = useComprehensiveAnalytics();

  const {
    llmInsights,
    llmWeeklyInsights,
    isGeneratingInsights,
    generateInsights
  } = useLLMAnalytics();

  // Generate real chart data from user analytics
  const chartData = personalGrowth?.growthSummary ? [
    personalGrowth.growthSummary.engagementMetrics.dailyEngagementScore * 1000,
    behavioralMetrics?.engagementMetrics.dailyEngagementScore * 1200 || 0,
    personalGrowth.growthSummary.emotionalPatterns.positivityRatio * 1500,
    behavioralMetrics?.personalityTraits.openness.score * 1800 || 0,
    behavioralMetrics?.personalityTraits.conscientiousness.score * 1600 || 0,
    personalGrowth.growthSummary.engagementMetrics.consistencyScore * 100 || 0,
    behavioralMetrics?.emotionalProfile.emotionalStability * 1400 || 0,
    personalGrowth.milestones?.filter(m => m.achieved).length * 300 || 0,
    behavioralMetrics?.personalityTraits.extraversion.score * 1900 || 0,
    behavioralMetrics?.socialPatterns.supportGiving * 1700 || 0,
    behavioralMetrics?.temporalPatterns.sessionDuration.average * 50 || 0,
    behavioralMetrics?.personalityTraits.creativity.score * 2100 || 0,
    summary.totalDataPoints || 0,
    Math.max(1000, (llmInsights?.length || 0) * 200)
  ] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  
  const greenChartData = behavioralMetrics?.temporalPatterns ? 
    Array.from({ length: 14 }, (_, i) => 
      (behavioralMetrics.personalityTraits.openness.score + i * 0.1) * 100 +
      Math.sin(i * 0.3) * 20 + i * 5
    ) : Array.from({ length: 14 }, () => 0);

  const mainValue = personalGrowth?.growthSummary ? 
    Math.round(
      personalGrowth.growthSummary.engagementMetrics.dailyEngagementScore * 1000 +
      behavioralMetrics?.personalityTraits.openness.score * 500 +
      (personalGrowth.milestones?.filter(m => m.achieved).length || 0) * 200 +
      summary.totalDataPoints * 0.5
    ) : 0;

  const yearlyAverage = personalGrowth?.growthSummary ? 
    Math.round(mainValue * 1.5 + behavioralMetrics?.engagementMetrics.dailyEngagementScore * 800 || 0) : 0;

  const totalPersonas = behavioralMetrics ? 
    Object.values(behavioralMetrics.personalityTraits).filter((trait: any) => trait.score > 0.7).length +
    (personalGrowth?.milestones?.filter(m => m.achieved).length || 0) * 5 +
    Math.floor(summary.totalDataPoints / 10) : 0;
  
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleTimeframeChange = (timeframe: typeof selectedTimeframe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTimeframe(timeframe);
  };
  
  const handleChartTimeframeChange = (timeframe: typeof selectedChartTimeframe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChartTimeframe(timeframe);
  };
  
  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Analytics"
      onBackPress={onNavigateBack}
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" />
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Value Card */}
            <Animated.View
              style={[
                styles.mainCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(26, 27, 42, 0.9)', 'rgba(26, 27, 42, 0.7)']}
                style={styles.gradientCard}
              >
                <BlurView intensity={20} style={styles.blurContainer}>
                  <View style={styles.mainValueContainer}>
                    <Text style={styles.dollarSign}></Text>
                    <Text style={styles.mainValue}>{mainValue.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.comparisonContainer}>
                    <Text style={styles.comparisonLabel}>Compared to Baseline</Text>
                    <Text style={[styles.comparisonValue, { color: mainValue > 5000 ? '#00FFB3' : '#FF6B6B' }]}>
                      {mainValue > 5000 ? '+' : ''}{(((mainValue - 5000) / 5000) * 100).toFixed(1)} %
                    </Text>
                  </View>
                  
                  {/* Timeframe Selector */}
                  <View style={styles.timeframeSelector}>
                    {(['24hr', 'Weekly', 'Monthly'] as const).map((timeframe) => (
                      <TouchableOpacity
                        key={timeframe}
                        style={[
                          styles.timeframeButton,
                          selectedTimeframe === timeframe && styles.timeframeButtonActive,
                        ]}
                        onPress={() => handleTimeframeChange(timeframe)}
                      >
                        <Text
                          style={[
                            styles.timeframeText,
                            selectedTimeframe === timeframe && styles.timeframeTextActive,
                          ]}
                        >
                          {timeframe}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* Chart */}
                  <View style={styles.chartContainer}>
                    <LineChart
                      data={chartData}
                      width={width - 80}
                      height={180}
                      selectedPoint={selectedDataPoint}
                      onSelectPoint={setSelectedDataPoint}
                    />
                    
                    {/* Data point tooltip */}
                    {selectedDataPoint !== null && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipDate}>Data Point {selectedDataPoint + 1}</Text>
                        <Text style={styles.tooltipValue}>{chartData[selectedDataPoint]?.toLocaleString() || '0'}</Text>
                        <Text style={styles.tooltipPercent}>Analytics Score</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Metric labels */}
                  <View style={styles.dateLabels}>
                    <Text style={styles.dateLabel}>Engagement</Text>
                    <Text style={styles.dateLabel}>Growth</Text>
                    <Text style={styles.dateLabel}>Traits</Text>
                    <Text style={styles.dateLabel}>Social</Text>
                    <Text style={styles.dateLabel}>Insights</Text>
                  </View>
                  
                  {/* Overall Score */}
                  <View style={styles.yearlyContainer}>
                    <Text style={styles.yearlyLabel}>Overall Analytics Score</Text>
                    <View style={styles.yearlyValueContainer}>
                      <Text style={styles.yearlyValue}>{yearlyAverage.toLocaleString()}</Text>
                      <FontAwesome5 name="arrow-up" size={14} color="#4A9FFF" style={styles.yearlyArrow} />
                    </View>
                    
                    <TouchableOpacity style={styles.howItWorksButton}>
                      <FontAwesome5 name="question-circle" size={16} color="#666" />
                      <Text style={styles.howItWorksText}>How it works?</Text>
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </LinearGradient>
              
              {/* Glow effect */}
              <View style={styles.glowBottom} />
            </Animated.View>
            
            {/* Green Chart Card */}
            <Animated.View
              style={[
                styles.chartCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(26, 27, 42, 0.95)', 'rgba(26, 27, 42, 0.85)']}
                style={styles.gradientCard}
              >
                <BlurView intensity={15} style={styles.blurContainer}>
                  <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Chart</Text>
                    <TouchableOpacity>
                      <FontAwesome5 name="cog" size={18} color="#666" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.keywordsContainer}>
                    <Text style={styles.keywordsLabel}>Top Traits</Text>
                    {behavioralMetrics ? (
                      Object.entries(behavioralMetrics.personalityTraits)
                        .filter(([_, trait]: [string, any]) => trait.score > 0.7)
                        .slice(0, 2)
                        .map(([name, trait]: [string, any]) => (
                          <Text key={name} style={styles.keyword}>
                            {name.charAt(0).toUpperCase() + name.slice(1)} ({Math.round(trait.score * 100)}%)
                          </Text>
                        ))
                    ) : (
                      <Text style={styles.keyword}>Loading user traits...</Text>
                    )}
                  </View>
                  
                  {/* Chart Timeframe Selector */}
                  <View style={styles.chartTimeframeSelector}>
                    {(['Week', 'Month', 'Max'] as const).map((timeframe) => (
                      <TouchableOpacity
                        key={timeframe}
                        style={[
                          styles.chartTimeframeButton,
                          selectedChartTimeframe === timeframe && styles.chartTimeframeButtonActive,
                        ]}
                        onPress={() => handleChartTimeframeChange(timeframe)}
                      >
                        <Text
                          style={[
                            styles.chartTimeframeText,
                            selectedChartTimeframe === timeframe && styles.chartTimeframeTextActive,
                          ]}
                        >
                          {timeframe}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* Green Area Chart */}
                  <View style={styles.greenChartContainer}>
                    <AreaChart
                      data={greenChartData}
                      width={width - 80}
                      height={200}
                      color="#00FFB3"
                    />
                    
                    {/* Progress labels */}
                    <View style={styles.yearLabels}>
                      {['Start', 'Week 1', 'Week 2', 'Week 3', 'Current'].map((period, index) => (
                        <Text key={period} style={styles.yearLabel}>{period}</Text>
                      ))}
                    </View>
                  </View>
                  
                  {/* Total Personas */}
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Analytics Score</Text>
                    <View style={styles.totalValueContainer}>
                      <Text style={styles.totalValue}>{totalPersonas}</Text>
                      <Text style={styles.totalChange}>+{Math.floor(totalPersonas * 0.4)}</Text>
                      <View style={styles.percentageContainer}>
                        <FontAwesome5 name="arrow-up" size={16} color="#00FFB3" />
                        <Text style={styles.percentageValue}>{(40 + totalPersonas * 0.5).toFixed(1)}%</Text>
                      </View>
                    </View>
                  </View>
                </BlurView>
              </LinearGradient>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </PageBackground>
    </ScreenWrapper>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  mainCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  chartCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradientCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurContainer: {
    padding: 24,
  },
  mainValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  dollarSign: {
    fontSize: 36,
    fontWeight: '300',
    color: '#fff',
    marginRight: 8,
  },
  mainValue: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -2,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  comparisonLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  comparisonValue: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FF6B6B',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeframeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  chartContainer: {
    height: 200,
    marginBottom: 16,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: 40,
    left: '45%',
    backgroundColor: 'rgba(74, 159, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
  },
  tooltipDate: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  tooltipPercent: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  dateLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  yearlyContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 24,
  },
  yearlyLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
  },
  yearlyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearlyValue: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -1,
  },
  yearlyArrow: {
    marginLeft: 12,
  },
  howItWorksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  howItWorksText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -50,
    left: '50%',
    transform: [{ translateX: -100 }],
    width: 200,
    height: 100,
    backgroundColor: '#6366F1',
    borderRadius: 100,
    opacity: 0.3,
    ...StyleSheet.absoluteFillObject,
    top: undefined,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: '#fff',
  },
  keywordsContainer: {
    marginBottom: 24,
  },
  keywordsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
  },
  keyword: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  chartTimeframeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  chartTimeframeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  chartTimeframeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chartTimeframeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  chartTimeframeTextActive: {
    color: '#fff',
  },
  greenChartContainer: {
    height: 240,
    marginBottom: 24,
  },
  yearLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  yearLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  totalContainer: {
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
  },
  totalValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalValue: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -2,
  },
  totalChange: {
    fontSize: 24,
    fontWeight: '300',
    color: '#00FFB3',
    marginLeft: 8,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  percentageValue: {
    fontSize: 24,
    fontWeight: '500',
    color: '#00FFB3',
    marginLeft: 8,
  },
});