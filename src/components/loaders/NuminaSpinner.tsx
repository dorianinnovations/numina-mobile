import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface NuminaSpinnerProps {
  size?: number;
  visible?: boolean;
}

export const NuminaSpinner: React.FC<NuminaSpinnerProps> = ({
  size = 30,
  visible = true
}) => {
  const { isDarkMode } = useTheme();
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Smooth fast spin - no stuttering
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 600, // Fast smooth spin
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Fade out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const color = isDarkMode ? '#ffffff' : '#1a1a1a';
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        opacity: opacityAnim,
        transform: [{ rotate: spin }],
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: `${color}40`, // 25% opacity
        }}
      />
    </Animated.View>
  );
};