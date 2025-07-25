import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
  animate?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width,
  height,
  borderRadius = 4,
  style,
  animate = true,
}) => {
  const { isDarkMode } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (animate) {
      // Base shimmer animation
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ])
      );

      // Subtle shine effect for depth
      const shineAnimation = Animated.loop(
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        })
      );

      shimmerAnimation.start();
      shineAnimation.start();

      return () => {
        shimmerAnimation.stop();
        shineAnimation.stop();
      };
    }
  }, [animate, shimmerAnim, shineAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [typeof width === 'number' ? -width * 1.5 : -300, typeof width === 'number' ? width * 1.5 : 300],
  });

  const baseColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const shimmerColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
  const shineColor = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.8)';

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          shadowColor: isDarkMode ? '#000000' : '#CCCCCC',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
    >
      {/* Base shimmer layer */}
      {animate && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: shimmerColor,
              borderRadius,
              opacity: shimmerOpacity,
            },
          ]}
        />
      )}
      
      {/* Subtle shine sweep for depth */}
      {animate && (
        <Animated.View
          style={[
            styles.shineOverlay,
            {
              transform: [{ translateX: shineTranslateX }],
              borderRadius,
            },
          ]}
        >
          <View
            style={[
              styles.shineGradient,
              {
                backgroundColor: shineColor,
                opacity: 0.3,
              },
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    position: 'relative',
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  shineGradient: {
    flex: 1,
    width: 60,
    transform: [{ skewX: '-20deg' }],
  },
});