import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface TravelingGlowBorderProps {
  isActive: boolean;
  borderRadius?: number;
  glowWidth?: number;
  speed?: number;
  glowColor?: string;
  intensity?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TravelingGlowBorder: React.FC<TravelingGlowBorderProps> = ({
  isActive,
  borderRadius = 12,
  glowWidth = 2,
  speed = 4000,
  glowColor,
  intensity = 0.8,
  children,
  style,
}) => {
  const { isDarkMode } = useTheme();
  
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Start the smooth traveling animation
      Animated.parallel([
        // Fade in the glow
        Animated.timing(opacityAnim, {
          toValue: intensity,
          duration: 600,
          useNativeDriver: true,
        }),
        // Smooth continuous rotation
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: speed,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      // Stop and fade out
      rotateAnim.stopAnimation();
      
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
      });
    }

    return () => {
      rotateAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [isActive, speed, intensity]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Default glow color based on theme
  const defaultGlowColor = isDarkMode ? '#6ec5ff' : '#4a90e2';
  const finalGlowColor = glowColor || defaultGlowColor;

  // Create traveling glow gradient
  const glowGradient = [
    'rgba(0, 0, 0, 0)',           // Transparent start
    'rgba(0, 0, 0, 0)',           // Transparent 
    'rgba(0, 0, 0, 0)',           // Transparent
    `${finalGlowColor}20`,        // Very subtle start
    `${finalGlowColor}40`,        // Building intensity
    `${finalGlowColor}80`,        // Peak glow
    `${finalGlowColor}ff`,        // Full intensity
    `${finalGlowColor}80`,        // Fading
    `${finalGlowColor}40`,        // Subtle
    `${finalGlowColor}20`,        // Very subtle end
    'rgba(0, 0, 0, 0)',           // Transparent
    'rgba(0, 0, 0, 0)',           // Transparent
    'rgba(0, 0, 0, 0)',           // Transparent end
  ];

  return (
    <Animated.View style={[style]}>
      {/* Main content */}
      {children}
      
      {/* Traveling glow border */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -glowWidth,
          left: -glowWidth,
          right: -glowWidth,
          bottom: -glowWidth,
          borderRadius: borderRadius + glowWidth,
          opacity: opacityAnim,
          transform: [{ rotate: rotation }],
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={glowGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + glowWidth,
            padding: glowWidth,
          }}
        >
          <Animated.View
            style={{
              flex: 1,
              borderRadius: borderRadius,
              backgroundColor: 'transparent',
            }}
          />
        </LinearGradient>
      </Animated.View>

      {/* Subtle outer glow for depth */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -glowWidth * 2,
          left: -glowWidth * 2,
          right: -glowWidth * 2,
          bottom: -glowWidth * 2,
          borderRadius: borderRadius + glowWidth * 2,
          opacity: Animated.multiply(opacityAnim, 0.3),
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0)',
            `${finalGlowColor}10`,
            `${finalGlowColor}20`,
            `${finalGlowColor}10`,
            'rgba(0, 0, 0, 0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + glowWidth * 2,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};