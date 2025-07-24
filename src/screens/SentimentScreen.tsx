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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, G, Text as SvgText, Line, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { PageBackground } from '../components/PageBackground';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const { width, height } = Dimensions.get('window');

interface SentimentScreenProps {
  onNavigateBack: () => void;
}

// Radar Chart Component
const RadarChart: React.FC<{
  data: { label: string; value: number }[];
  size: number;
}> = ({ data, size }) => {
  const center = size / 2;
  const radius = size * 0.35;
  const angleStep = (Math.PI * 2) / data.length;
  
  // Calculate points for the data polygon
  const dataPoints = data.map((item, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle) * (item.value / 100);
    const y = center + radius * Math.sin(angle) * (item.value / 100);
    return `${x},${y}`;
  }).join(' ');
  
  // Grid levels
  const levels = [0.2, 0.4, 0.6, 0.8, 1];
  
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
        </RadialGradient>
      </Defs>
      
      {/* Grid circles */}
      {levels.map((level) => (
        <Circle
          key={level}
          cx={center}
          cy={center}
          r={radius * level}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}
      
      {/* Axis lines */}
      {data.map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);
        return (
          <Line
            key={index}
            x1={center}
            y1={center}
            x2={x2}
            y2={y2}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        );
      })}
      
      {/* Data polygon */}
      <Polygon
        points={dataPoints}
        fill="url(#radarGradient)"
        stroke="#6366F1"
        strokeWidth="2"
      />
      
      {/* Data points */}
      {data.map((item, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = center + radius * Math.cos(angle) * (item.value / 100);
        const y = center + radius * Math.sin(angle) * (item.value / 100);
        return (
          <Circle
            key={index}
            cx={x}
            cy={y}
            r="4"
            fill="#6366F1"
          />
        );
      })}
      
      {/* Labels */}
      {data.map((item, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const labelRadius = radius * 1.2;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <SvgText
            key={index}
            x={x}
            y={y}
            fill="rgba(255,255,255,0.6)"
            fontSize="12"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {item.label}
          </SvgText>
        );
      })}
    </Svg>
  );
};

// Bar Chart Component
const BarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  width: number;
  height: number;
}> = ({ data, width, height }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 40) / data.length - 10;
  
  return (
    <Svg width={width} height={height}>
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * (height - 40);
        const x = 20 + index * (barWidth + 10);
        const y = height - barHeight - 20;
        
        return (
          <G key={index}>
            <Defs>
              <RadialGradient id={`gradient-${index}`} cx="50%" cy="0%" r="100%">
                <Stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={item.color} stopOpacity="0.4" />
              </RadialGradient>
            </Defs>
            
            <Path
              d={`M ${x} ${y + barHeight} 
                  L ${x} ${y + 10} 
                  Q ${x} ${y}, ${x + 10} ${y}
                  L ${x + barWidth - 10} ${y}
                  Q ${x + barWidth} ${y}, ${x + barWidth} ${y + 10}
                  L ${x + barWidth} ${y + barHeight}
                  Z`}
              fill={`url(#gradient-${index})`}
            />
            
            <SvgText
              x={x + barWidth / 2}
              y={height - 5}
              fill="rgba(255,255,255,0.5)"
              fontSize="10"
              textAnchor="middle"
            >
              {item.label}
            </SvgText>
            
            <SvgText
              x={x + barWidth / 2}
              y={y - 5}
              fill={item.color}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
            >
              {item.value}%
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
};

export const SentimentScreen: React.FC<SentimentScreenProps> = ({
  onNavigateBack,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'Today' | 'Week' | 'Month'>('Week');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Pull to refresh
  const { refreshControl } = usePullToRefresh(async () => {
    console.log('Refreshing sentiment data...');
  });
  
  // Mock data
  const emotionalData = [
    { label: 'Joy', value: 75 },
    { label: 'Trust', value: 82 },
    { label: 'Fear', value: 25 },
    { label: 'Surprise', value: 60 },
    { label: 'Sadness', value: 30 },
    { label: 'Disgust', value: 15 },
    { label: 'Anger', value: 20 },
    { label: 'Anticipation', value: 70 },
  ];
  
  const moodData = [
    { label: 'Mon', value: 65, color: '#4A9FFF' },
    { label: 'Tue', value: 72, color: '#6366F1' },
    { label: 'Wed', value: 58, color: '#8B5CF6' },
    { label: 'Thu', value: 80, color: '#A78BFA' },
    { label: 'Fri', value: 75, color: '#4A9FFF' },
    { label: 'Sat', value: 85, color: '#6366F1' },
    { label: 'Sun', value: 78, color: '#8B5CF6' },
  ];
  
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
  
  const handlePeriodChange = (period: typeof selectedPeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPeriod(period);
  };
  
  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Sentiment Analysis"
      onBackPress={onNavigateBack}
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" />
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {/* Overall Sentiment Card */}
            <Animated.View
              style={[
                styles.card,
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
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Overall Sentiment</Text>
                    <View style={styles.sentimentBadge}>
                      <Text style={styles.sentimentText}>Positive</Text>
                    </View>
                  </View>
                  
                  <View style={styles.scoreContainer}>
                    <Text style={styles.scoreValue}>78.5</Text>
                    <Text style={styles.scoreLabel}>Sentiment Score</Text>
                  </View>
                  
                  <View style={styles.changeContainer}>
                    <FontAwesome5 name="arrow-up" size={16} color="#00FFB3" />
                    <Text style={styles.changeValue}>12.3%</Text>
                    <Text style={styles.changeLabel}>from last week</Text>
                  </View>
                </BlurView>
              </LinearGradient>
            </Animated.View>
            
            {/* Emotional Radar Chart */}
            <Animated.View
              style={[
                styles.card,
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
                  <Text style={styles.cardTitle}>Emotional Spectrum</Text>
                  <Text style={styles.cardSubtitle}>Your emotional landscape over time</Text>
                  
                  <View style={styles.radarContainer}>
                    <RadarChart
                      data={emotionalData}
                      size={width - 120}
                    />
                  </View>
                </BlurView>
              </LinearGradient>
            </Animated.View>
            
            {/* Mood Trends */}
            <Animated.View
              style={[
                styles.card,
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
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Mood Trends</Text>
                    
                    {/* Period Selector */}
                    <View style={styles.periodSelector}>
                      {(['Today', 'Week', 'Month'] as const).map((period) => (
                        <TouchableOpacity
                          key={period}
                          style={[
                            styles.periodButton,
                            selectedPeriod === period && styles.periodButtonActive,
                          ]}
                          onPress={() => handlePeriodChange(period)}
                        >
                          <Text
                            style={[
                              styles.periodText,
                              selectedPeriod === period && styles.periodTextActive,
                            ]}
                          >
                            {period}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  <View style={styles.barChartContainer}>
                    <BarChart
                      data={moodData}
                      width={width - 80}
                      height={200}
                    />
                  </View>
                  
                  <View style={styles.insightContainer}>
                    <FontAwesome5 name="lightbulb" size={16} color="#FFD93D" />
                    <Text style={styles.insightText}>
                      Your mood peaks on weekends, suggesting work-life balance impacts
                    </Text>
                  </View>
                </BlurView>
              </LinearGradient>
            </Animated.View>
            
            {/* Key Insights */}
            <Animated.View
              style={[
                styles.card,
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
                  <Text style={styles.cardTitle}>Key Insights</Text>
                  
                  <View style={styles.insightCard}>
                    <View style={[styles.insightIcon, { backgroundColor: 'rgba(74, 159, 255, 0.2)' }]}>
                      <MaterialCommunityIcons name="head-lightbulb" size={20} color="#4A9FFF" />
                    </View>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>Cognitive Pattern</Text>
                      <Text style={styles.insightDescription}>
                        Your analytical thinking peaks in the morning hours
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.insightCard}>
                    <View style={[styles.insightIcon, { backgroundColor: 'rgba(0, 255, 179, 0.2)' }]}>
                      <FontAwesome5 name="heart" size={20} color="#00FFB3" />
                    </View>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>Emotional Balance</Text>
                      <Text style={styles.insightDescription}>
                        Strong resilience with quick emotional recovery time
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.insightCard}>
                    <View style={[styles.insightIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                      <FontAwesome5 name="chart-line" size={20} color="#8B5CF6" />
                    </View>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightTitle}>Growth Trajectory</Text>
                      <Text style={styles.insightDescription}>
                        Consistent improvement in emotional regulation
                      </Text>
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
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 24,
  },
  sentimentBadge: {
    backgroundColor: 'rgba(0, 255, 179, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sentimentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FFB3',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -3,
  },
  scoreLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeValue: {
    fontSize: 24,
    fontWeight: '500',
    color: '#00FFB3',
    marginLeft: 8,
  },
  changeLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 8,
  },
  radarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 2,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#fff',
  },
  barChartContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  insightText: {
    fontSize: 14,
    color: '#FFD93D',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
});