import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedAuthStatusProps {
  status: 'loading' | 'success' | 'error' | 'idle';
  color?: string;
  size?: number;
  onAnimationComplete?: () => void;
}

export const AnimatedAuthStatus: React.FC<AnimatedAuthStatusProps> = ({ 
  status, 
  color = '#ffffff',
  size = 60,
  onAnimationComplete
}) => {
  // Core animations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Circle animations
  const circleProgress = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(1)).current;
  
  // Checkmark animations
  const checkmarkProgress = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  
  // X mark animations
  const xProgress = useRef(new Animated.Value(0)).current;
  const xScale = useRef(new Animated.Value(0)).current;
  
  // Effect animations
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const particleScale = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'idle') {
      // Reset all animations
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (status === 'loading') {
      // Show and start loader animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(circleProgress, {
          toValue: 0.8,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start the rotation loop separately
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    if (status === 'success') {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Stop rotation and morph to checkmark
      rotateAnim.stopAnimation();
      
      Animated.sequence([
        // First, complete the circle
        Animated.parallel([
          Animated.timing(circleProgress, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Then morph to checkmark
        Animated.parallel([
          // Fade out circle
          Animated.timing(circleOpacity, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          // Scale up container
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.2,
              duration: 200,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(pulseScale, {
              toValue: 1,
              friction: 3,
              tension: 100,
              useNativeDriver: true,
            }),
          ]),
          // Draw checkmark
          Animated.sequence([
            Animated.timing(checkmarkScale, {
              toValue: 1.3,
              duration: 200,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.spring(checkmarkScale, {
              toValue: 1,
              friction: 4,
              tension: 200,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(checkmarkProgress, {
            toValue: 1,
            duration: 400,
            delay: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          // Glow effect
          Animated.sequence([
            Animated.timing(glowOpacity, {
              toValue: 0.6,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Bounce effect
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.back(2)),
              useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
              toValue: 0,
              friction: 3,
              tension: 100,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => onAnimationComplete?.());
    }

    if (status === 'error') {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Stop rotation and morph to X
      rotateAnim.stopAnimation();
      
      Animated.sequence([
        // Shake effect
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
        // Morph to X
        Animated.parallel([
          // Fade out circle
          Animated.timing(circleOpacity, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          // Reset rotation
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          // Scale effect
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.1,
              duration: 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(pulseScale, {
              toValue: 1,
              friction: 3,
              tension: 100,
              useNativeDriver: true,
            }),
          ]),
          // Draw X
          Animated.parallel([
            Animated.timing(xScale, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.back(1.5)),
              useNativeDriver: true,
            }),
            Animated.timing(xProgress, {
              toValue: 1,
              duration: 400,
              delay: 100,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          // Red glow effect
          Animated.sequence([
            Animated.timing(glowOpacity, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Particle burst
          Animated.sequence([
            Animated.spring(particleScale, {
              toValue: 1.2,
              friction: 2,
              tension: 200,
              useNativeDriver: true,
            }),
            Animated.timing(particleScale, {
              toValue: 0,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => onAnimationComplete?.());
    }

    // Cleanup
    return () => {
      rotateAnim.stopAnimation();
    };
  }, [status]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shakeTransform = bounceAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-5, 0, 5],
  });

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const currentColor = status === 'error' ? '#F44336' : color;

  if (status === 'idle') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { scale: pulseScale },
            { translateX: shakeTransform },
          ],
        },
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 2,
            height: size * 2,
            backgroundColor: currentColor,
            opacity: glowOpacity,
          },
        ]}
      />

    

      <View style={{ width: size, height: size }}>
        {/* Loading circle */}
        <Animated.View
          style={[
            styles.loaderContainer,
            {
              width: size,
              height: size,
              transform: [{ rotate: rotation }],
              opacity: circleOpacity,
            },
          ]}
        >
          <View style={[styles.circleBackground, { 
            width: size, 
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: `${currentColor}20`,
          }]} />
          <Animated.View
            style={[
              styles.circleProgress,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: currentColor,
                borderRightColor: 'transparent',
                borderBottomColor: 'transparent',
                transform: [
                  {
                    rotate: circleProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '270deg'],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>

        {/* Checkmark */}
        {status === 'success' && (
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: checkmarkScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.checkmark,
                {
                  width: size * 0.25,
                  height: size * 0.5,
                  borderRightWidth: strokeWidth,
                  borderBottomWidth: strokeWidth,
                  borderColor: currentColor,
                  opacity: checkmarkProgress,
                },
              ]}
            />
          </Animated.View>
        )}

        {/* X mark */}
        {status === 'error' && (
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: xScale }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.xLine1,
                {
                  width: size * 0.6,
                  height: strokeWidth,
                  backgroundColor: currentColor,
                  opacity: xProgress,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.xLine2,
                {
                  width: size * 0.6,
                  height: strokeWidth,
                  backgroundColor: currentColor,
                  opacity: xProgress,
                },
              ]}
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
  loaderContainer: {
    position: 'absolute',
  },
  circleBackground: {
    position: 'absolute',
  },
  circleProgress: {
    position: 'absolute',
  },
  iconContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
    marginLeft: 5,
  },
  xLine1: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  xLine2: {
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
    borderRadius: 2,
  },
});