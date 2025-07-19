import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, View, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedGradientBorderProps {
  isActive: boolean;
  borderRadius?: number;
  borderWidth?: number;
  animationSpeed?: number;
  gradientColors?: string[];
  backgroundColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number; // New: animation intensity (0-1)
  glowStrength?: number; // New: glow effect strength
}

export const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 2,
  animationSpeed = 4000,
  gradientColors,
  backgroundColor,
  children,
  style,
  intensity = 1,
  glowStrength = 1,
}) => {
  const { isDarkMode } = useTheme();
  
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle pulse for static ring - always running
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (isActive) {
      // Premium entrance with bounce
      Animated.parallel([
        // Fade in with smooth easing
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Buttery smooth infinite rotation with variable speed
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: animationSpeed * 0.8, // Slightly faster for premium feel
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Premium easing curve
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      rotateAnim.stopAnimation();
      
      // Smooth fade out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
      });
    }

    return () => {
      rotateAnim.stopAnimation();
      opacityAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [isActive, animationSpeed]);

      // Gradient with smoother transitions and premium feel
  const defaultGradientColors = isDarkMode 
    ? [
        // Dark mode: enhanced with subtle warmth
        'rgba(28, 28, 35, 1)',       // 0% - Rich dark with blue hint
        'rgba(30, 30, 37, 1)',       // 15% - Slightly warmer
        'rgba(32, 32, 40, 1)',       // 30% - Building warmth  
        'rgba(32, 32, 40, 1)',       // 45% - Stable
        'rgba(32, 32, 40, 1)',       // 55% - Stable
        'rgba(65, 85, 120, 0.3)',    // 65% - Subtle blue glow starts
        'rgba(110, 197, 255, 0.5)',  // 70% - Light blue begins
        'rgba(110, 197, 255, 0.9)',  // 75% - Building intensity
        'rgba(110, 197, 255, 1)',    // 80% - Peak brilliance
        'rgba(110, 197, 255, 0.9)',  // 85% - Fading intensity
        'rgba(110, 197, 255, 0.5)',  // 90% - Light blue ends
        'rgba(65, 85, 120, 0.3)',    // 95% - Subtle glow fades
        'rgba(32, 32, 40, 1)',       // 100% - Back to dark
      ]
    : [
        // Light mode: enhanced with subtle blue hints
        'rgba(250, 252, 255, 1)',    // 0% - Pure bright white
        'rgba(248, 251, 255, 1)',    // 15% - Hint of blue
        'rgba(246, 250, 255, 1)',    // 30% - Subtle blue tint
        'rgba(246, 250, 255, 1)',    // 45% - Stable
        'rgba(246, 250, 255, 1)',    // 55% - Stable
        'rgba(200, 220, 255, 0.4)',  // 65% - Soft blue glow starts
        'rgba(110, 197, 255, 0.5)',  // 70% - Light blue begins
        'rgba(110, 197, 255, 0.9)',  // 75% - Building intensity
        'rgba(110, 197, 255, 1)',    // 80% - Peak brilliance
        'rgba(110, 197, 255, 0.9)',  // 85% - Fading intensity
        'rgba(110, 197, 255, 0.5)',  // 90% - Light blue ends
        'rgba(200, 220, 255, 0.4)',  // 95% - Soft glow fades
        'rgba(246, 250, 255, 1)',    // 100% - Back to light
      ];
  
  // Extremely dark background for dark mode
  const defaultBackgroundColor = isDarkMode ? '#080808' : '#f8fafc';
  
  const finalGradientColors = gradientColors || defaultGradientColors;
  const finalBackgroundColor = backgroundColor || defaultBackgroundColor;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'], // Full rotation but light only shows 10%
  });

  return (
    <View 
      style={[
        style, 
        { 
          position: 'relative',
          borderRadius: borderRadius,
          overflow: 'hidden',
          padding: borderWidth,
        }
      ]}
    >
      {/* 
        Solid static ring - matches header menu button thickness
      */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: borderRadius,
          borderWidth: 1, // Same thickness as header menu buttons
          borderColor: isDarkMode ? '#1f2937' : '#e5e7eb', // Extremely dark grey in dark mode, light grey in light mode
          zIndex: -3,
        }}
      />

      {/* 
        Rotating gradient - traveling light effect
      */}
      <Animated.View
        style={{
          position: 'absolute',
          left: '-50%',
          top: '-50%',
          width: '200%',
          height: '200%',
          opacity: opacityAnim,
          transform: [{ rotate: rotation }],
          zIndex: -2,
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={finalGradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
          }}
        />
      </Animated.View>

      {/* 
        Center background with subtle inner shadow for depth
      */}
      <View
        style={{
          position: 'absolute',
          left: borderWidth,
          top: borderWidth,
          right: borderWidth,
          bottom: borderWidth,
          backgroundColor: finalBackgroundColor,
          borderRadius: borderRadius - borderWidth,
          // Inner shadow effect for premium depth
          shadowColor: isDarkMode ? '#000000' : '#e2e8f0',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDarkMode ? 0.4 : 0.1,
          shadowRadius: 2,
          elevation: 1,
          zIndex: -1,
        }}
      />

      {/* 
        Main content
        - z-index: 0 (on top)
        - Contains the actual component content
      */}
      <View
        style={{
          borderRadius: borderRadius - borderWidth,
          zIndex: 0, // On top
        }}
      >
        {children}
      </View>
    </View>
  );
};