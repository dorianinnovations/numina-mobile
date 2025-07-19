import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface TruePseudoBorderProps {
  isActive: boolean;
  borderRadius?: number;
  borderWidth?: number;
  animationSpeed?: number;
  glowColor?: string;
  intensity?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TruePseudoBorder: React.FC<TruePseudoBorderProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 2,
  animationSpeed = 4000,
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
      Animated.parallel([
        // Fade in the pseudo-element
        Animated.timing(opacityAnim, {
          toValue: intensity,
          duration: 600,
          useNativeDriver: true,
        }),
        // Rotate the background
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: animationSpeed,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
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
  }, [isActive, animationSpeed, intensity]);

  const defaultGlowColor = isDarkMode ? '#6ec5ff' : '#4a90e2';
  const finalGlowColor = glowColor || defaultGlowColor;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[style, { position: 'relative' }]}>
      {/* 
        This is our ::before pseudo-element
        - Larger than the content (padding creates border space)
        - Contains the animated background
        - Sits BEHIND the content (zIndex: 1)
      */}
      <Animated.View
        style={{
          position: 'absolute',
          top: -borderWidth,
          left: -borderWidth,
          right: -borderWidth,
          bottom: -borderWidth,
          borderRadius: borderRadius + borderWidth,
          opacity: opacityAnim,
          transform: [{ rotate: rotation }],
          zIndex: 1, // Behind the content
        }}
        pointerEvents="none"
      >
        {/* The animated background - like conic-gradient */}
        <LinearGradient
          colors={[
            'rgba(0, 0, 0, 0)',      // Transparent
            'rgba(0, 0, 0, 0)',      // Transparent  
            `${finalGlowColor}ff`,   // Full glow
            `${finalGlowColor}80`,   // Fade out
            'rgba(0, 0, 0, 0)',      // Transparent
            'rgba(0, 0, 0, 0)',      // Transparent
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            borderRadius: borderRadius + borderWidth,
          }}
        />
      </Animated.View>

      {/* 
        This is the actual content element
        - Sits ON TOP of the pseudo-element (zIndex: 2)
        - Its background MASKS the center of the pseudo-element
        - Creates the border illusion by covering the middle
      */}
      <View
        style={{
          borderRadius: borderRadius,
          zIndex: 2, // On top of the animated background
          position: 'relative',
        }}
      >
        {children}
      </View>
    </View>
  );
};