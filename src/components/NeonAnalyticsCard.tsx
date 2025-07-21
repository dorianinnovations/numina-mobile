import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface NeonAnalyticsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  glowColors?: string[];
  children?: React.ReactNode;
}

export const NeonAnalyticsCard: React.FC<NeonAnalyticsCardProps> = ({
  title,
  value,
  icon,
  subtitle,
  trend = 'neutral',
  glowColors = ['#00ffaa', '#0099ff', '#ff6b9d', '#ffd93d'],
  children
}) => {
  // Animation values for floating orbs
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2X = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;

  // Scale animations for pulsing effect
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;

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
              toValue: Math.random() * 20 - 10,
              duration: 5000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 20 - 10,
              duration: 5000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 20 - 10,
              duration: 5000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 20 - 10,
              duration: 5000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const pulsing = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.4,
            duration: 4000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.6,
            duration: 4000 + Math.random() * 2000,
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
    createFloatingAnimation(orb2X, orb2Y, orb2Scale, 1000);
  }, []);

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return '#00ff88';
      case 'down': return '#ff4757';
      default: return '#00aaff';
    }
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
        color={glowColors[0]}
        size={40}
        position={{ top: -20, left: -20 }}
      />
      <GlowingOrb
        translateX={orb2X}
        translateY={orb2Y}
        scale={orb2Scale}
        color={glowColors[1]}
        size={35}
        position={{ bottom: -15, right: -15 }}
      />

      {/* Glass card container */}
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
              {/* Header with icon */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: getTrendColor() + '20' }]}>
                  <Feather 
                    name={icon} 
                    size={20} 
                    color={getTrendColor()} 
                  />
                </View>
                {trend !== 'neutral' && (
                  <Feather 
                    name={trend === 'up' ? 'trending-up' : 'trending-down'} 
                    size={16} 
                    color={getTrendColor()} 
                  />
                )}
              </View>

              {/* Main content */}
              <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={[styles.value, { color: getTrendColor() }]}>
                  {value}
                </Text>
                {subtitle && (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                )}
              </View>

              {/* Custom content */}
              {children}
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
    flex: 1,
    minWidth: (screenWidth - 48) / 2,
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
    minHeight: 140,
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
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Nunito_500Medium',
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Nunito_400Regular',
  },
});