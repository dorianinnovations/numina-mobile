import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedColorBlobProps {
  colors: readonly [string, string, ...string[]]; // At least 2 colors required
  size?: number;
  duration?: number;
  delay?: number;
}

export const AnimatedColorBlob: React.FC<AnimatedColorBlobProps> = ({
  colors,
  size = 200,
  duration = 8000,
  delay = 0,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = () => {
      const randomX = Math.random() * (width - size);
      const randomY = Math.random() * (height - size);
      const randomScale = 0.8 + Math.random() * 0.4;
      const randomRotation = Math.random() * 360;

      return Animated.parallel([
        Animated.timing(translateX, {
          toValue: randomX,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: randomY,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: randomScale,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: randomRotation,
          duration: duration,
          useNativeDriver: true,
        }),
      ]);
    };

    const startAnimation = () => {
      createAnimation().start(() => {
        startAnimation();
      });
    };

    const timer = setTimeout(() => {
      startAnimation();
    }, delay);

    return () => clearTimeout(timer);
  }, [translateX, translateY, scale, rotate, duration, delay, size]);

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        transform: [
          { translateX },
          { translateY },
          { scale },
          { rotate: rotateInterpolation },
        ],
        zIndex: -1,
      }}
      pointerEvents="none"
    >
      <LinearGradient
        colors={colors}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size / 2,
          opacity: 0.6,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

export default AnimatedColorBlob;