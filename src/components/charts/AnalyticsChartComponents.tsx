import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  EnhancedBarChart, 
  EnhancedLineChart, 
  EnhancedPieChart,
  PersonalityRadarChart,
  EmotionalHeatmapChart 
} from './EnhancedCharts';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSettings?: () => void;
  style?: object;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  subtitle,
  children,
  onSettings,
  style
}) => {
  const { isDarkMode } = useTheme();

  return (
    <View style={[
      styles.analyticsCard,
      {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      },
      style
    ]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.cardTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.cardSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {onSettings && (
          <TouchableOpacity onPress={onSettings} style={styles.settingsButton}>
            <Feather name="settings" size={18} color={isDarkMode ? '#888' : '#666'} />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
};

interface PersonalityInsightsChartProps {
  personalityTraits: {
    [key: string]: { score: number; confidence: number };
  };
  title?: string;
}

export const PersonalityInsightsChart: React.FC<PersonalityInsightsChartProps> = ({
  personalityTraits,
  title = "🧠 Personality Profile"
}) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'];
  
  const data = Object.entries(personalityTraits)
    .filter(([_, trait]) => trait.score > 0.4)
    .map(([name, trait], index) => ({
      trait: name.charAt(0).toUpperCase() + name.slice(1),
      score: Math.round(trait.score * 10),
      color: colors[index % colors.length]
    }));

  return (
    <AnalyticsCard title={title}>
      <PersonalityRadarChart data={data} maxValue={10} />
    </AnalyticsCard>
  );
};

interface BehavioralPatternsChartProps {
  temporalPatterns: {
    mostActiveHours: number[];
    sessionDuration: { average: number; distribution: number[] };
  };
  title?: string;
}

export const BehavioralPatternsChart: React.FC<BehavioralPatternsChartProps> = ({
  temporalPatterns,
  title = "⏰ Activity Patterns"
}) => {
  const data = temporalPatterns.mostActiveHours.map((hour, index) => ({
    value: Math.random() * 10 + 5, // Simulated activity level
    label: `${hour}:00`,
    frontColor: '#10B981',
    gradientColor: '#34D399',
  }));

  return (
    <AnalyticsCard title={title}>
      <EnhancedBarChart 
        data={data}
        height={180}
        showGradient
        animated
        spacing={20}
        barBorderRadius={6}
      />
    </AnalyticsCard>
  );
};

interface EmotionalTrendsChartProps {
  emotionalData: {
    baselineEmotion: string;
    intensityPattern: { average: number; trend: string };
    emotionalRange: number;
  };
  title?: string;
}

export const EmotionalTrendsChart: React.FC<EmotionalTrendsChartProps> = ({
  emotionalData,
  title = "💝 Emotional Journey"
}) => {
  // Generate sample week data based on baseline and average
  const weekData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(1, emotionalData.intensityPattern.average + (Math.random() - 0.5) * emotionalData.emotionalRange * 10),
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));

  return (
    <AnalyticsCard title={title}>
      <EnhancedLineChart 
        data={weekData}
        height={180}
        curved
        showGradient
        color="#EF4444"
        thickness={3}
        focusEnabled
        showStripOnFocus
      />
    </AnalyticsCard>
  );
};

interface GrowthMetricsChartProps {
  growthData: {
    engagementMetrics: { dailyEngagementScore: number };
    emotionalPatterns: { positivityRatio: number };
  };
  milestones?: Array<{ achieved: boolean; title: string }>;
  title?: string;
}

export const GrowthMetricsChart: React.FC<GrowthMetricsChartProps> = ({
  growthData,
  milestones = [],
  title = "🌱 Growth Metrics"
}) => {
  const data = [
    {
      value: Math.round(growthData.emotionalPatterns.positivityRatio * 100),
      color: '#10B981',
      text: 'Positivity',
      label: 'Positivity Ratio'
    },
    {
      value: Math.round(growthData.engagementMetrics.dailyEngagementScore * 10),
      color: '#3B82F6',
      text: 'Engagement',
      label: 'Engagement Score'
    },
    {
      value: milestones.filter(m => m.achieved).length * 10,
      color: '#F59E0B',
      text: 'Milestones',
      label: 'Achievements'
    }
  ];

  return (
    <AnalyticsCard title={title}>
      <EnhancedPieChart 
        data={data}
        radius={80}
        donut
        innerRadius={50}
        showText
        showLabels
        animated
        centerLabelComponent={() => (
          <View style={styles.centerLabel}>
            <Text style={styles.centerLabelText}>Growth</Text>
            <Text style={styles.centerLabelSubtext}>Score</Text>
          </View>
        )}
      />
    </AnalyticsCard>
  );
};

interface SocialConnectionChartProps {
  socialData: {
    connectionStyle: string;
    supportGiving: number;
    supportReceiving: number;
  };
  title?: string;
}

export const SocialConnectionChart: React.FC<SocialConnectionChartProps> = ({
  socialData,
  title = "👥 Social Patterns"
}) => {
  const data = [
    {
      value: Math.round(socialData.supportGiving * 10),
      label: 'Giving',
      frontColor: '#8B5CF6',
      gradientColor: '#A78BFA',
    },
    {
      value: Math.round(socialData.supportReceiving * 10),
      label: 'Receiving',
      frontColor: '#EC4899',
      gradientColor: '#F472B6',
    }
  ];

  return (
    <AnalyticsCard title={title} subtitle={`Style: ${socialData.connectionStyle}`}>
      <EnhancedBarChart 
        data={data}
        height={160}
        showGradient
        animated
        spacing={60}
        barBorderRadius={8}
        maxValue={10}
      />
    </AnalyticsCard>
  );
};

interface WeeklyInsightsChartProps {
  weeklyData: {
    totalDataPoints: number;
    keyInsights: string[];
    completenessScore: number;
  };
  title?: string;
}

export const WeeklyInsightsChart: React.FC<WeeklyInsightsChartProps> = ({
  weeklyData,
  title = "📊 Weekly Summary"
}) => {
  const data = [
    {
      value: weeklyData.totalDataPoints,
      label: 'Data Points',
      frontColor: '#06B6D4',
      gradientColor: '#67E8F9',
    },
    {
      value: weeklyData.completenessScore,
      label: 'Completeness',
      frontColor: '#84CC16',
      gradientColor: '#A3E635',
    },
    {
      value: weeklyData.keyInsights.length * 20,
      label: 'Insights',
      frontColor: '#F97316',
      gradientColor: '#FB923C',
    }
  ];

  return (
    <AnalyticsCard title={title}>
      <EnhancedBarChart 
        data={data}
        height={180}
        showGradient
        animated
        spacing={40}
        barBorderRadius={6}
        showValueOnTop
      />
      <View style={styles.insightsContainer}>
        {weeklyData.keyInsights.slice(0, 3).map((insight, index) => (
          <View key={index} style={styles.insightItem}>
            <View style={[styles.insightBullet, { backgroundColor: data[0].frontColor }]} />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    </AnalyticsCard>
  );
};

const styles = StyleSheet.create({
  analyticsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingsButton: {
    padding: 4,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  centerLabelSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  insightsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
});

