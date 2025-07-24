import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface BaseAnalyticsCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  gradient?: readonly [string, string, ...string[]];
  borderColor?: string;
}

interface MetricCardProps extends BaseAnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
  confidence?: number;
  unit?: string;
}

interface PersonalityTraitCardProps extends BaseAnalyticsCardProps {
  trait: {
    name: string;
    score: number;
    confidence: number;
  };
}

interface BehavioralMetricCardProps extends BaseAnalyticsCardProps {
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  description?: string;
}

interface ProgressCardProps extends BaseAnalyticsCardProps {
  title: string;
  progress: number;
  total?: number;
  progressColor?: string;
  subtitle?: string;
}

export const BaseAnalyticsCard: React.FC<BaseAnalyticsCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  gradient,
  borderColor,
}) => {
  const { isDarkMode } = useTheme();

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.baseCard,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: borderColor || (isDarkMode ? 'rgba(255,255,255,0.1)' : '#e0e0e0'),
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {gradient && gradient.length >= 2 && (
        <LinearGradient
          colors={gradient}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
        />
      )}
      <View style={[styles.cardContent, gradient && { backgroundColor: 'transparent' }]}>
        {children}
      </View>
    </CardComponent>
  );
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  confidence,
  unit = '',
  style,
  onPress,
}) => {
  const { isDarkMode } = useTheme();

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'minus';
    }
  };

  return (
    <BaseAnalyticsCard onPress={onPress} style={style}>
      <View style={styles.metricHeader}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <FontAwesome5 name={icon} size={16} color="#3B82F6" />
          </View>
        )}
        <View style={styles.metricTitleContainer}>
          <Text style={[styles.metricTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
            {title}
          </Text>
          {trend && (
            <View style={styles.trendContainer}>
              <Feather name={getTrendIcon()} size={12} color={getTrendColor()} />
            </View>
          )}
        </View>
      </View>
      
      <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
        {typeof value === 'number' ? value.toFixed(1) : value}{unit}
      </Text>
      
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#666' }]}>
          {subtitle}
        </Text>
      )}
      
      {confidence && (
        <View style={styles.confidenceBar}>
          <View style={styles.confidenceTrack}>
            <View 
              style={[
                styles.confidenceFill, 
                { width: `${confidence * 100}%`, backgroundColor: '#3B82F6' }
              ]} 
            />
          </View>
          <Text style={[styles.confidenceText, { color: isDarkMode ? '#ccc' : '#666' }]}>
            {Math.round(confidence * 100)}% confidence
          </Text>
        </View>
      )}
    </BaseAnalyticsCard>
  );
};

export const PersonalityTraitCard: React.FC<PersonalityTraitCardProps> = ({
  trait,
  style,
  onPress,
}) => {
  const { isDarkMode } = useTheme();
  
  const getScoreColor = (score: number) => {
    if (score > 0.7) return '#10B981';
    if (score > 0.4) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score > 0.7) return 'High';
    if (score > 0.4) return 'Moderate';
    return 'Low';
  };

  return (
    <BaseAnalyticsCard onPress={onPress} style={style} borderColor={getScoreColor(trait.score)}>
      <View style={styles.traitHeader}>
        <Text style={[styles.traitName, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
          {trait.name.charAt(0).toUpperCase() + trait.name.slice(1)}
        </Text>
        <View style={[styles.scoreTag, { backgroundColor: getScoreColor(trait.score) }]}>
          <Text style={styles.scoreTagText}>{getScoreLabel(trait.score)}</Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, { color: getScoreColor(trait.score) }]}>
          {Math.round(trait.score * 10)}/10
        </Text>
        <View style={styles.scoreBar}>
          <View style={styles.scoreTrack}>
            <View 
              style={[
                styles.scoreFill, 
                { width: `${trait.score * 100}%`, backgroundColor: getScoreColor(trait.score) }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <Text style={[styles.confidenceText, { color: isDarkMode ? '#ccc' : '#666' }]}>
        {Math.round(trait.confidence * 100)}% confidence
      </Text>
    </BaseAnalyticsCard>
  );
};

export const BehavioralMetricCard: React.FC<BehavioralMetricCardProps> = ({
  title,
  metrics,
  description,
  style,
  onPress,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <BaseAnalyticsCard onPress={onPress} style={style}>
      <Text style={[styles.behavioralTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
        {title}
      </Text>
      
      {description && (
        <Text style={[styles.behavioralDescription, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#666' }]}>
          {description}
        </Text>
      )}
      
      <View style={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: isDarkMode ? '#ccc' : '#666' }]}>
              {metric.label}:
            </Text>
            <Text style={[
              styles.metricRowValue, 
              { color: metric.color || (isDarkMode ? '#fff' : '#1a1a1a') }
            ]}>
              {metric.value}
            </Text>
          </View>
        ))}
      </View>
    </BaseAnalyticsCard>
  );
};

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  progress,
  total,
  progressColor = '#3B82F6',
  subtitle,
  style,
  onPress,
}) => {
  const { isDarkMode } = useTheme();
  const percentage = total ? (progress / total) * 100 : progress;

  return (
    <BaseAnalyticsCard onPress={onPress} style={style}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
          {title}
        </Text>
        <Text style={[styles.progressValue, { color: progressColor }]}>
          {total ? `${progress}/${total}` : `${Math.round(percentage)}%`}
        </Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }]}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${Math.min(percentage, 100)}%`, backgroundColor: progressColor }
            ]} 
          />
        </View>
      </View>
      
      {subtitle && (
        <Text style={[styles.progressSubtitle, { color: isDarkMode ? 'rgba(255,255,255,0.7)' : '#666' }]}>
          {subtitle}
        </Text>
      )}
    </BaseAnalyticsCard>
  );
};

const styles = StyleSheet.create({
  baseCard: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: 6,
  },
  cardContent: {
    padding: 16,
  },

  // Metric Card Styles
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendContainer: {
    padding: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  confidenceBar: {
    marginTop: 8,
  },
  confidenceTrack: {
    height: 4,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderRadius: 2,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Personality Trait Card Styles
  traitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  traitName: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  scoreTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 12,
    minWidth: 45,
  },
  scoreBar: {
    flex: 1,
  },
  scoreTrack: {
    height: 6,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderRadius: 3,
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Behavioral Metric Card Styles
  behavioralTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  behavioralDescription: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  metricsGrid: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  metricLabel: {
    fontSize: 12,
    flex: 1,
  },
  metricRowValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Progress Card Styles
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtitle: {
    fontSize: 11,
  },
});