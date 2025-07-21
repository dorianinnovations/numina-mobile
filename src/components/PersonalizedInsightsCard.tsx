import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';

const { width } = Dimensions.get('window');

interface PersonalInsight {
  id: string;
  type: 'personality' | 'behavioral' | 'emotional' | 'communication' | 'growth';
  title: string;
  insight: string;
  confidence: number;
  evidence: string[];
  icon: string;
  timeframe: string;
}

interface PersonalizedInsightsCardProps {
  insights: PersonalInsight[];
  isLoading?: boolean;
}

export const PersonalizedInsightsCard: React.FC<PersonalizedInsightsCardProps> = ({
  insights,
  isLoading = false,
}) => {
  const { isDarkMode } = useTheme();
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

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

  useEffect(() => {
    // Card entrance animation
    Animated.parallel([
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
              toValue: Math.random() * 30 - 15,
              duration: 6000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 30 - 15,
              duration: 6000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 30 - 15,
              duration: 6000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 30 - 15,
              duration: 6000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const pulsing = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.3,
            duration: 5000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.7,
            duration: 5000 + Math.random() * 2000,
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
    createFloatingAnimation(orb2X, orb2Y, orb2Scale, 1500);
    createFloatingAnimation(orb3X, orb3Y, orb3Scale, 3000);
  }, []);

  const getInsightColor = (type: PersonalInsight['type']) => {
    switch (type) {
      case 'personality': return '#c0a4ff';
      case 'behavioral': return '#9cc2ff';
      case 'emotional': return '#a4ffc6';
      case 'communication': return '#ffd895';
      case 'growth': return '#ffa6d2';
      default: return '#00aaff';
    }
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

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Moderate';
    if (confidence >= 0.6) return 'Emerging';
    return 'Observed';
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

  const renderInsightCard = (insight: PersonalInsight) => {
    const isExpanded = expandedInsight === insight.id;
    const insightColor = getInsightColor(insight.type);
    const confidenceTrend = getConfidenceTrend(insight.confidence);
    const trendColor = getTrendColor(confidenceTrend);
    const confidencePercentage = Math.round(insight.confidence * 100);

    return (
      <TouchableOpacity
        key={insight.id}
        style={styles.insightCard}
        onPress={() => setExpandedInsight(isExpanded ? null : insight.id)}
        activeOpacity={0.8}
      >
        <View style={styles.glassContainer}>
          <BlurView
            intensity={60}
            tint="dark"
            style={styles.blurView}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.gradientOverlay}
            >
              <View style={styles.cardContent}>
                {/* Header */}
                <View style={styles.insightHeader}>
                  <View style={[styles.insightIcon, { backgroundColor: insightColor + '20' }]}>
                    <Text style={styles.iconText}>{insight.icon}</Text>
                  </View>
                  <View style={styles.insightHeaderText}>
                    <Text style={styles.insightTitle}>
                      {insight.title}
                    </Text>
                    <View style={styles.confidenceRow}>
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
                      <Text style={styles.timeframe}>
                        {insight.timeframe}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </View>

                {/* Main Insight */}
                <Text style={styles.insightText}>
                  {insight.insight}
                </Text>

                {/* Expanded Evidence */}
                {isExpanded && (
                  <View style={styles.evidenceSection}>
                    <Text style={styles.evidenceLabel}>
                      Based on analysis of:
                    </Text>
                    {insight.evidence.map((evidence, index) => (
                      <View key={index} style={styles.evidenceItem}>
                        <View style={[styles.evidenceDot, { backgroundColor: insightColor }]} />
                        <Text style={styles.evidenceText}>
                          {evidence}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View>
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: isDarkMode ? '#FFFFFF' : '#1F2937' }
          ]}>
            🧠 Your Personal Insights
          </Text>
        </View>
        <View style={styles.loadingState}>
          <Text style={[
            styles.loadingText,
            { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
          ]}>
            Analyzing your patterns...
          </Text>
        </View>
      </View>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <View>
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            { color: isDarkMode ? '#FFFFFF' : '#1F2937' }
          ]}>
            🧠 Your Personal Insights
          </Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={[
            styles.emptyText,
            { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
          ]}>
            Keep chatting to unlock insights about your communication patterns and personality!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
        },
      ]}
    >
      {/* Background orbs */}
      <GlowingOrb
        translateX={orb1X}
        translateY={orb1Y}
        scale={orb1Scale}
        color="#c0a4ff"
        size={35}
        position={{ top: -20, left: -20 }}
      />
      <GlowingOrb
        translateX={orb2X}
        translateY={orb2Y}
        scale={orb2Scale}
        color="#a4ffc6"
        size={30}
        position={{ bottom: -15, right: -15 }}
      />
      <GlowingOrb
        translateX={orb3X}
        translateY={orb3Y}
        scale={orb3Scale}
        color="#ffd895"
        size={25}
        position={{ top: 100, right: -10 }}
      />

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Your Personal Insights
          </Text>
          <Text style={styles.headerSubtitle}>
            {insights.length} insights discovered • Tap to explore
          </Text>
        </View>

        <View style={styles.insightsContainer}>
          {insights.map(renderInsightCard)}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Nunito',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  insightsContainer: {
    gap: 12,
  },
  contentContainer: {
    gap: 16,
  },
  insightCard: {
    position: 'relative',
    marginHorizontal: 4,
    marginBottom: 16,
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
  cardTouchable: {
    position: 'relative',
    zIndex: 10,
  },
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconText: {
    fontSize: 20,
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito',
    marginBottom: 6,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confidenceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidencePercentage: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeframe: {
    fontSize: 12,
    fontFamily: 'Nunito',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Nunito',
    marginBottom: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  evidenceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  evidenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito',
    marginBottom: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  evidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
    marginLeft: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  evidenceText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Nunito',
    flex: 1,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingState: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Nunito',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Nunito',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default PersonalizedInsightsCard;