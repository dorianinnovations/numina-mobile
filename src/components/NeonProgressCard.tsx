import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface NeonProgressCardProps {
  title?: string;
  progress?: number; // 0 to 100
  glowColors?: string[];
  onClose?: () => void;
  children?: React.ReactNode;
}

export const NeonProgressCard: React.FC<NeonProgressCardProps> = ({
  title = "Progress 65%",
  progress = 65,
  glowColors = ['#00ffff', '#ff00ff', '#ffff00', '#4ecdc4'],
  onClose,
  children
}) => {
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

  // Progress bar animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    // Create floating animation for orbs
    const createFloatingAnimation = (xValue: Animated.Value, yValue: Animated.Value, scaleValue: Animated.Value, delay: number) => {
      const floating = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 30 - 15,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 30 - 15,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(xValue, {
              toValue: Math.random() * 30 - 15,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(yValue, {
              toValue: Math.random() * 30 - 15,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      const pulsing = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.3,
            duration: 3000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.7,
            duration: 3000 + Math.random() * 1000,
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
    createFloatingAnimation(orb2X, orb2Y, orb2Scale, 800);
    createFloatingAnimation(orb3X, orb3Y, orb3Scale, 1600);
  }, [progress]);

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
            width: size * 2.5,
            height: size * 2.5,
            borderRadius: (size * 2.5) / 2,
            backgroundColor: color + '15',
          },
        ]}
      />
      {/* Middle glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: (size * 1.8) / 2,
            backgroundColor: color + '25',
          },
        ]}
      />
      {/* Inner glow */}
      <View
        style={[
          styles.orbGlow,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: (size * 1.3) / 2,
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
            shadowOpacity: 1,
            shadowRadius: size / 1.5,
            elevation: 15,
          },
        ]}
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <GlowingOrb
        translateX={orb1X}
        translateY={orb1Y}
        scale={orb1Scale}
        color={glowColors[0]}
        size={70}
        position={{ top: -35, left: -35 }}
      />
      <GlowingOrb
        translateX={orb2X}
        translateY={orb2Y}
        scale={orb2Scale}
        color={glowColors[1]}
        size={55}
        position={{ top: -25, right: -25 }}
      />
      <GlowingOrb
        translateX={orb3X}
        translateY={orb3Y}
        scale={orb3Scale}
        color={glowColors[2]}
        size={45}
        position={{ bottom: -20, right: 20 }}
      />

      {/* Glass card container */}
      <View style={styles.glassContainer}>
        <BlurView
          intensity={80}
          tint="dark"
          style={styles.blurView}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.gradientOverlay}
          >
            <View style={styles.cardContent}>
              {/* Header with close button */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {onClose && (
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                  >
                    <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressBar,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#00ffaa', '#00ccff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressGradient}
                    />
                  </Animated.View>
                </View>
              </View>

              {/* Custom content */}
              {children}
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    margin: 16,
    marginVertical: 24,
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
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  blurView: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  gradientOverlay: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardContent: {
    padding: 24,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Nunito_600SemiBold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    shadowColor: '#00ffaa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5,
  },
});