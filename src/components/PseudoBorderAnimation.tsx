import React, { useEffect, useRef, useState } from 'react';
import { Animated, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface PseudoBorderAnimationProps {
  isActive: boolean;
  borderRadius?: number;
  borderWidth?: number;
  animationSpeed?: number;
  glowColor?: string;
  borderColor?: string;
  intensity?: number;
  animationType?: 'conic' | 'chase' | 'draw';
  children: React.ReactNode;
  style?: ViewStyle;
}

export const PseudoBorderAnimation: React.FC<PseudoBorderAnimationProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 2,
  animationSpeed = 4000,
  glowColor,
  borderColor,
  intensity = 0.8,
  animationType = 'conic',
  children,
  style,
}) => {
  const { isDarkMode } = useTheme();
  
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        // Fade in the pseudo-element
        Animated.timing(opacityAnim, {
          toValue: intensity,
          duration: 600,
          useNativeDriver: true,
        }),
        // Scale in the pseudo-element
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Main animation loop
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
      
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        rotateAnim.setValue(0);
      });
    }

    return () => {
      rotateAnim.stopAnimation();
      opacityAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, [isActive, animationSpeed, intensity]);

  // Default colors
  const defaultGlowColor = isDarkMode ? '#6ec5ff' : '#4a90e2';
  const defaultBorderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
  const finalGlowColor = glowColor || defaultGlowColor;
  const finalBorderColor = borderColor || defaultBorderColor;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Create different animation types
  const renderPseudoElement = () => {
    const pseudoSize = Math.max(containerSize.width, containerSize.height) + borderWidth * 4;
    
    switch (animationType) {
      case 'conic':
        // Conic gradient rotation (most common web technique)
        return (
          <Animated.View
            style={{
              position: 'absolute',
              top: -borderWidth,
              left: -borderWidth,
              right: -borderWidth,
              bottom: -borderWidth,
              borderRadius: borderRadius + borderWidth,
              opacity: opacityAnim,
              transform: [{ rotate: rotation }, { scale: scaleAnim }],
            }}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0)',
                `${finalGlowColor}ff`,
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                borderRadius: borderRadius + borderWidth,
                padding: borderWidth,
              }}
            >
              {/* Inner cutout to create border effect */}
              <View
                style={{
                  flex: 1,
                  borderRadius: borderRadius,
                  backgroundColor: 'transparent',
                }}
              />
            </LinearGradient>
          </Animated.View>
        );

      case 'chase':
        // Light chasing around perimeter
        return (
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
            }}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[
                `${finalGlowColor}ff`,
                `${finalGlowColor}80`,
                `${finalGlowColor}40`,
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0)',
                'rgba(0, 0, 0, 0)',
                `${finalGlowColor}40`,
                `${finalGlowColor}80`,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flex: 1,
                borderRadius: borderRadius + borderWidth,
                padding: borderWidth,
              }}
            >
              <View
                style={{
                  flex: 1,
                  borderRadius: borderRadius,
                  backgroundColor: 'transparent',
                }}
              />
            </LinearGradient>
          </Animated.View>
        );

      case 'draw':
        // Drawing effect with scale
        const drawProgress = scaleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        });
        
        return (
          <Animated.View
            style={{
              position: 'absolute',
              top: -borderWidth,
              left: -borderWidth,
              right: -borderWidth,
              bottom: -borderWidth,
              borderRadius: borderRadius + borderWidth,
              opacity: opacityAnim,
              transform: [{ scale: drawProgress }],
            }}
            pointerEvents="none"
          >
            <View
              style={{
                flex: 1,
                borderRadius: borderRadius + borderWidth,
                borderWidth: borderWidth,
                borderColor: finalGlowColor,
                shadowColor: finalGlowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: borderWidth * 2,
                elevation: 8,
              }}
            />
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[style]}>
      {/* Static border base */}
      <View
        style={{
          borderRadius: borderRadius,
          borderWidth: borderWidth,
          borderColor: finalBorderColor,
        }}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContainerSize({ width, height });
        }}
      >
        {/* Main content */}
        {children}
      </View>

      {/* Pseudo-element animation layer */}
      {renderPseudoElement()}
    </View>
  );
};