import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedLightBeamProps {
  isActive: boolean;
  borderRadius?: number;
  beamWidth?: number;
  speed?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AnimatedLightBeam: React.FC<AnimatedLightBeamProps> = ({
  isActive,
  borderRadius = 12,
  beamWidth = 3,
  speed = 2000,
  children,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isActive) {
      // Start the animations
      Animated.parallel([
        // Rotation animation for the light beam
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: speed,
            useNativeDriver: true,
          })
        ),
        // Fade in the beam
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Subtle scale pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.02,
              duration: speed / 4,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: speed / 4,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      // Stop and reset animations
      rotateAnim.stopAnimation();
      scaleAnim.stopAnimation();
      
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
        scaleAnim.setValue(1);
      });
    }

    return () => {
      rotateAnim.stopAnimation();
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [isActive, speed]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Define gradient colors based on theme
  const gradientColors = isDarkMode
    ? [
        'rgba(110, 197, 255, 0)',
        'rgba(110, 197, 255, 0.3)',
        'rgba(110, 197, 255, 0.8)',
        'rgba(110, 197, 255, 1)',
        'rgba(173, 213, 250, 0.8)',
        'rgba(173, 213, 250, 0.3)',
        'rgba(173, 213, 250, 0)',
      ]
    : [
        'rgba(173, 213, 250, 0)',
        'rgba(173, 213, 250, 0.4)',
        'rgba(173, 213, 250, 0.9)',
        'rgba(74, 85, 104, 1)',
        'rgba(110, 197, 255, 0.9)',
        'rgba(110, 197, 255, 0.4)',
        'rgba(110, 197, 255, 0)',
      ];

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {/* Main content */}
      {children}
      
      {/* Animated light beam border */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -beamWidth / 2,
          left: -beamWidth / 2,
          right: -beamWidth / 2,
          bottom: -beamWidth / 2,
          borderRadius: borderRadius + beamWidth / 2,
          opacity: opacityAnim,
          transform: [{ rotate: rotation }],
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + beamWidth / 2,
            padding: beamWidth,
          }}
        >
          <Animated.View
            style={{
              flex: 1,
              borderRadius: borderRadius,
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            }}
          />
        </LinearGradient>
      </Animated.View>

      {/* Secondary glow effect */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -beamWidth * 1.5,
          left: -beamWidth * 1.5,
          right: -beamWidth * 1.5,
          bottom: -beamWidth * 1.5,
          borderRadius: borderRadius + beamWidth * 1.5,
          opacity: opacityAnim,
          transform: [{ rotate: rotation }],
        }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(110, 197, 255, 0)',
            'rgba(110, 197, 255, 0.1)',
            'rgba(110, 197, 255, 0.2)',
            'rgba(110, 197, 255, 0.1)',
            'rgba(110, 197, 255, 0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + beamWidth * 1.5,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};