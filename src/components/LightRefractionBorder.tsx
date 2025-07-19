import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface LightRefractionBorderProps {
  isActive: boolean;
  borderRadius?: number;
  refractionWidth?: number;
  intensity?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const LightRefractionBorder: React.FC<LightRefractionBorderProps> = ({
  isActive,
  borderRadius = 12,
  refractionWidth = 2,
  intensity = 1,
  children,
  style,
}) => {
  const { isDarkMode } = useTheme();
  
  // Multiple animation values for different refraction layers
  const shimmer1 = useRef(new Animated.Value(0)).current;
  const shimmer2 = useRef(new Animated.Value(0)).current;
  const shimmer3 = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      // Start all shimmer animations with different timings
      Animated.parallel([
        // Fade in the effect
        Animated.timing(opacityAnim, {
          toValue: intensity,
          duration: 400,
          useNativeDriver: true,
        }),
        // Subtle pulse effect
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.02,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ),
        // First shimmer layer - fastest
        Animated.loop(
          Animated.timing(shimmer1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        ),
        // Second shimmer layer - medium speed
        Animated.loop(
          Animated.timing(shimmer2, {
            toValue: 1,
            duration: 4500,
            useNativeDriver: true,
          })
        ),
        // Third shimmer layer - slowest
        Animated.loop(
          Animated.timing(shimmer3, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      // Stop and reset all animations
      shimmer1.stopAnimation();
      shimmer2.stopAnimation();
      shimmer3.stopAnimation();
      pulseAnim.stopAnimation();
      
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        shimmer1.setValue(0);
        shimmer2.setValue(0);
        shimmer3.setValue(0);
        pulseAnim.setValue(1);
      });
    }

    return () => {
      shimmer1.stopAnimation();
      shimmer2.stopAnimation();
      shimmer3.stopAnimation();
      pulseAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [isActive, intensity]);

  // Create prismatic color sequences for light refraction
  const refractionColors = isDarkMode
    ? [
        'rgba(255, 0, 150, 0)',      // Magenta start
        'rgba(255, 0, 150, 0.3)',
        'rgba(255, 100, 0, 0.4)',    // Orange
        'rgba(255, 255, 0, 0.5)',    // Yellow
        'rgba(0, 255, 100, 0.4)',    // Green
        'rgba(0, 150, 255, 0.5)',    // Blue
        'rgba(150, 0, 255, 0.4)',    // Purple
        'rgba(255, 0, 150, 0.3)',
        'rgba(255, 0, 150, 0)',      // Magenta end
      ]
    : [
        'rgba(255, 0, 150, 0)',      // Magenta start
        'rgba(255, 0, 150, 0.2)',
        'rgba(255, 100, 0, 0.3)',    // Orange
        'rgba(255, 255, 0, 0.4)',    // Yellow
        'rgba(0, 255, 100, 0.3)',    // Green
        'rgba(0, 150, 255, 0.4)',    // Blue
        'rgba(150, 0, 255, 0.3)',    // Purple
        'rgba(255, 0, 150, 0.2)',
        'rgba(255, 0, 150, 0)',      // Magenta end
      ];

  // Secondary refraction layer with different colors
  const secondaryColors = isDarkMode
    ? [
        'rgba(0, 255, 255, 0)',      // Cyan start
        'rgba(0, 255, 255, 0.2)',
        'rgba(255, 255, 255, 0.3)',  // White
        'rgba(255, 200, 100, 0.4)',  // Golden
        'rgba(100, 255, 200, 0.3)',  // Aqua
        'rgba(200, 100, 255, 0.4)',  // Violet
        'rgba(255, 255, 255, 0.2)',  // White
        'rgba(0, 255, 255, 0.2)',
        'rgba(0, 255, 255, 0)',      // Cyan end
      ]
    : [
        'rgba(0, 255, 255, 0)',      // Cyan start
        'rgba(0, 255, 255, 0.15)',
        'rgba(255, 255, 255, 0.25)', // White
        'rgba(255, 200, 100, 0.3)',  // Golden
        'rgba(100, 255, 200, 0.25)', // Aqua
        'rgba(200, 100, 255, 0.3)',  // Violet
        'rgba(255, 255, 255, 0.2)',  // White
        'rgba(0, 255, 255, 0.15)',
        'rgba(0, 255, 255, 0)',      // Cyan end
      ];

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: pulseAnim }],
        },
        style,
      ]}
    >
      {/* Main content */}
      {children}
      
      {/* First refraction layer - primary spectrum */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -refractionWidth,
          left: -refractionWidth,
          right: -refractionWidth,
          bottom: -refractionWidth,
          borderRadius: borderRadius + refractionWidth,
          opacity: opacityAnim,
          transform: [
            {
              rotate: shimmer1.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={refractionColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + refractionWidth,
            padding: refractionWidth,
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

      {/* Second refraction layer - secondary spectrum */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -refractionWidth * 0.5,
          left: -refractionWidth * 0.5,
          right: -refractionWidth * 0.5,
          bottom: -refractionWidth * 0.5,
          borderRadius: borderRadius + refractionWidth * 0.5,
          opacity: Animated.multiply(opacityAnim, 0.6),
          transform: [
            {
              rotate: shimmer2.interpolate({
                inputRange: [0, 1],
                outputRange: ['360deg', '0deg'], // Opposite direction
              }),
            },
          ],
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={secondaryColors}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + refractionWidth * 0.5,
            padding: refractionWidth * 0.5,
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

      {/* Third refraction layer - subtle shimmer */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -refractionWidth * 1.5,
          left: -refractionWidth * 1.5,
          right: -refractionWidth * 1.5,
          bottom: -refractionWidth * 1.5,
          borderRadius: borderRadius + refractionWidth * 1.5,
          opacity: Animated.multiply(opacityAnim, 0.3),
          transform: [
            {
              rotate: shimmer3.interpolate({
                inputRange: [0, 1],
                outputRange: ['180deg', '540deg'], // Faster rotation
              }),
            },
          ],
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.2)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0)',
          ]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + refractionWidth * 1.5,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};