import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { AIInsightResponse } from '../services/aiInsightEngine';

interface AIInsightDisplayProps {
  insight: AIInsightResponse;
  onDismiss?: () => void;
  categoryColor?: string;
}

// Simple glowing orb component
const GlowingOrb: React.FC<{
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  position: any;
}> = ({ translateX, translateY, scale, color, size, position }) => (
  <Animated.View
    style={[
      {
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.3,
        ...position,
      },
      {
        transform: [
          { translateX },
          { translateY },
          { scale },
        ],
      },
    ]}
  />
);

export const AIInsightDisplay: React.FC<AIInsightDisplayProps> = ({
  insight,
  onDismiss,
  categoryColor = '#3B82F6',
}) => {
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation values
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate card in
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate orbs
    const animateOrbs = () => {
      Animated.parallel([
        Animated.timing(orb1X, {
          toValue: Math.random() * 10 - 5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(orb1Y, {
          toValue: Math.random() * 10 - 5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(orb2X, {
          toValue: Math.random() * 10 - 5,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Y, {
          toValue: Math.random() * 10 - 5,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]).start(() => animateOrbs());
    };
    animateOrbs();
  }, []);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#22C55E';
    if (confidence >= 0.6) return '#F59E0B';
    return '#EF4444';
  };

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
        color={categoryColor}
        size={25}
        position={{ top: -15, left: -15 }}
      />
      <GlowingOrb
        translateX={orb2X}
        translateY={orb2Y}
        scale={orb2Scale}
        color={getConfidenceColor(insight.confidence)}
        size={20}
        position={{ bottom: -10, right: -10 }}
      />

      {/* Glass card container */}
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.aiIcon, { backgroundColor: categoryColor + '20' }]}>
              <Text style={styles.aiIconText}>🤖</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[
                styles.title,
                { color: isDarkMode ? '#FFFFFF' : '#1F2937' }
              ]}>
                AI Insight • {insight.category}
              </Text>
              <View style={styles.metaRow}>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(insight.confidence) }
                ]}>
                  <Text style={styles.confidenceText}>
                    {Math.round(insight.confidence * 100)}% confidence
                  </Text>
                </View>
                <Text style={[
                  styles.timestamp,
                  { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                ]}>
                  {formatTimestamp(insight.timestamp)}
                </Text>
              </View>
            </View>
          </View>
          
          {onDismiss && (
            <TouchableOpacity
              onPress={onDismiss}
              style={styles.dismissButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name="x"
                size={18}
                color={isDarkMode ? '#9CA3AF' : '#6B7280'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Main Insight */}
        <Text style={[
          styles.insightText,
          { color: isDarkMode ? '#E5E7EB' : '#374151' }
        ]}>
          {insight.insight}
        </Text>

        {/* Evidence Section */}
        {insight.evidence && insight.evidence.length > 0 && (
          <TouchableOpacity
            style={styles.evidenceToggle}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.evidenceToggleText,
              { color: categoryColor }
            ]}>
              {isExpanded ? 'Hide' : 'Show'} Evidence ({insight.evidence.length})
            </Text>
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={categoryColor}
            />
          </TouchableOpacity>
        )}

        {/* Expanded Evidence */}
        {isExpanded && insight.evidence && (
          <View style={styles.evidenceContainer}>
            <Text style={[
              styles.evidenceLabel,
              { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
            ]}>
              Based on analysis of:
            </Text>
            {insight.evidence.map((evidence, index) => (
              <View key={index} style={styles.evidenceItem}>
                <View style={[styles.evidenceDot, { backgroundColor: categoryColor }]} />
                <Text style={[
                  styles.evidenceText,
                  { color: isDarkMode ? '#D1D5DB' : '#4B5563' }
                ]}>
                  {evidence}
                </Text>
              </View>
            ))}
          </View>
        )}

              {/* AI Attribution */}
              <View style={styles.attribution}>
                <Text style={[
                  styles.attributionText,
                  { color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }
                ]}>
                  Generated by AI • Timegated refresh
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: 8,
    marginBottom: 32,
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
  glassContainer: {
    position: 'relative',
    zIndex: 10,
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiIconText: {
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito',
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Nunito',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Nunito',
  },
  dismissButton: {
    padding: 4,
  },
  insightText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito',
    marginBottom: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  evidenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  evidenceToggleText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito',
  },
  evidenceContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
  },
  evidenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito',
    marginBottom: 8,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  evidenceDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginRight: 8,
    marginLeft: 4,
  },
  evidenceText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Nunito',
    flex: 1,
  },
  attribution: {
    marginTop: 12,
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 11,
    fontFamily: 'Nunito',
  },
});

export default AIInsightDisplay;