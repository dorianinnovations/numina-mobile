import React, { useEffect, useRef, useState } from 'react';
import { Animated, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface TravelingLightSpotProps {
  isActive: boolean;
  borderRadius?: number;
  borderWidth?: number;
  spotLength?: number;
  speed?: number;
  glowColor?: string;
  intensity?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TravelingLightSpot: React.FC<TravelingLightSpotProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 2,
  spotLength = 30,
  speed = 4000,
  glowColor,
  intensity = 0.8,
  children,
  style,
}) => {
  const { isDarkMode } = useTheme();
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isActive) {
      // Start the traveling animation
      Animated.parallel([
        // Fade in the light spot
        Animated.timing(opacityAnim, {
          toValue: intensity,
          duration: 600,
          useNativeDriver: false,
        }),
        // Travel around the perimeter
        Animated.loop(
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: speed,
            useNativeDriver: false,
          })
        ),
      ]).start();
    } else {
      // Stop and fade out
      progressAnim.stopAnimation();
      
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        progressAnim.setValue(0);
      });
    }

    return () => {
      progressAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [isActive, speed, intensity]);

  // Default glow color based on theme
  const defaultGlowColor = isDarkMode ? '#6ec5ff' : '#4a90e2';
  const finalGlowColor = glowColor || defaultGlowColor;

  const { width, height } = containerSize;
  
  // Create interpolation for smooth travel around the perimeter
  const createPerimeterInterpolation = () => {
    if (width === 0 || height === 0) return { left: 0, top: 0, rotation: '0deg' };
    
    // Calculate position on the border (inset by borderWidth/2 to center on border)
    const inset = borderWidth / 2;
    
    return {
      left: progressAnim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [
          inset,                          // Start: top edge
          width - inset,                  // Top-right corner
          width - inset,                  // Right edge
          inset,                          // Bottom-left corner
          inset,                          // Back to start
        ],
        extrapolate: 'clamp',
      }),
      top: progressAnim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [
          inset,                          // Start: top edge
          inset,                          // Top edge
          height - inset,                 // Bottom edge
          height - inset,                 // Bottom edge
          inset,                          // Back to start
        ],
        extrapolate: 'clamp',
      }),
      // Rotate the light spot to align with border direction
      rotation: progressAnim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '90deg', '180deg', '270deg', '360deg'],
        extrapolate: 'clamp',
      }),
    };
  };

  const position = createPerimeterInterpolation();

  return (
    <View 
      style={[style]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
      {/* Main content */}
      {children}
      
      {/* Traveling light spot on border */}
      {width > 0 && height > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            width: spotLength,
            height: borderWidth,
            left: Animated.subtract(position.left, spotLength / 2),
            top: Animated.subtract(position.top, borderWidth / 2),
            opacity: opacityAnim,
            transform: [{ rotate: position.rotation }],
            zIndex: 10, // Ensure it's on top of the border
          }}
          pointerEvents="none"
        >
          {/* Main light spot - matches border width */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0)',           // Transparent start
              `${finalGlowColor}60`,        // Fade in
              `${finalGlowColor}ff`,        // Full intensity center
              `${finalGlowColor}60`,        // Fade out
              'rgba(0, 0, 0, 0)',           // Transparent end
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: spotLength,
              height: borderWidth,
              borderRadius: borderWidth / 2,
            }}
          />
          
          {/* Subtle outer glow */}
          <View
            style={{
              position: 'absolute',
              top: -borderWidth / 2,
              left: -borderWidth / 2,
              width: spotLength + borderWidth,
              height: borderWidth * 2,
              borderRadius: borderWidth,
              backgroundColor: `${finalGlowColor}20`,
              shadowColor: finalGlowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: borderWidth,
              elevation: 5,
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};