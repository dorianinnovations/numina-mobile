import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ShineEffectProps {
  enabled?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const ShineEffect: React.FC<ShineEffectProps> = ({ enabled = true }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const secondaryShimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    // Primary shine with premium easing
    const primaryAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Premium ease-out
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ])
    );

    // Secondary subtle shimmer for depth
    const secondaryAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(400), // Offset timing
        Animated.timing(secondaryShimmer, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(secondaryShimmer, {
          toValue: 0,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(2800),
      ])
    );

    primaryAnimation.start();
    secondaryAnimation.start();

    return () => {
      primaryAnimation.stop();
      secondaryAnimation.stop();
    };
  }, [enabled, shimmerAnim, secondaryShimmer]);

  if (!enabled) return null;

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth * 1.2, screenWidth * 1.2],
  });

  const secondaryTranslateX = secondaryShimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-screenWidth * 0.8, screenWidth * 0.8],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.08, 0.12, 0],
  });

  const secondaryOpacity = secondaryShimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.06, 0],
  });

  return (
    <>
      {/* Primary shine layer */}
      <Animated.View
        style={[
          styles.shimmerContainer,
          {
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.01)',
            'rgba(255, 255, 255, 0.02)',
            'rgba(255, 255, 255, 0.03)',
            'rgba(245, 245, 245, 0.04)', // Very subtle center
            'rgba(255, 255, 255, 0.03)',
            'rgba(255, 255, 255, 0.02)',
            'rgba(255, 255, 255, 0.01)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryShimmer}
        />
      </Animated.View>

      {/* Secondary depth layer */}
      <Animated.View
        style={[
          styles.shimmerContainer,
          {
            transform: [{ translateX: secondaryTranslateX }],
            opacity: secondaryOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(240, 248, 255, 0.01)', // Very subtle blue tint
            'rgba(255, 255, 255, 0.02)',
            'rgba(240, 248, 255, 0.01)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.secondaryShimmer}
        />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  primaryShimmer: {
    width: 140,
    height: '100%',
  },
  secondaryShimmer: {
    width: 200,
    height: '100%',
  },
});