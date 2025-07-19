import React, { useEffect, useRef, useState } from 'react';
import { Animated, ViewStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface TravelingBorderLightProps {
  isActive: boolean;
  borderRadius?: number;
  borderWidth?: number;
  outlineWidth?: number;
  spotLength?: number;
  speed?: number;
  glowColor?: string;
  borderColor?: string;
  intensity?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TravelingBorderLight: React.FC<TravelingBorderLightProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 2,
  outlineWidth = 3,
  spotLength = 40,
  speed = 4000,
  glowColor,
  borderColor,
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

  // Default colors based on theme
  const defaultGlowColor = isDarkMode ? '#6ec5ff' : '#4a90e2';
  const defaultBorderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const finalGlowColor = glowColor || defaultGlowColor;
  const finalBorderColor = borderColor || defaultBorderColor;

  const { width, height } = containerSize;
  
  // Create interpolation for smooth travel around the perimeter
  const createPerimeterInterpolation = () => {
    if (width === 0 || height === 0) return { left: 0, top: 0, rotation: '0deg' };
    
    // Position the light in the border area (between outline and content)
    const borderOffset = outlineWidth - borderWidth / 2;
    
    return {
      left: progressAnim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [
          borderOffset,                       // Start: top edge
          width - borderOffset,               // Top-right corner
          width - borderOffset,               // Right edge
          borderOffset,                       // Bottom-left corner
          borderOffset,                       // Back to start
        ],
        extrapolate: 'clamp',
      }),
      top: progressAnim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [
          borderOffset,                       // Start: top edge
          borderOffset,                       // Top edge
          height - borderOffset,              // Bottom edge
          height - borderOffset,              // Bottom edge
          borderOffset,                       // Back to start
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
    <View style={[style]}>
      {/* Fake border outline - slightly thicker to create border space */}
      <View
        style={{
          position: 'absolute',
          top: -outlineWidth,
          left: -outlineWidth,
          right: -outlineWidth,
          bottom: -outlineWidth,
          borderRadius: borderRadius + outlineWidth,
          borderWidth: outlineWidth,
          borderColor: finalBorderColor,
        }}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContainerSize({ 
            width: width - 2 * outlineWidth, 
            height: height - 2 * outlineWidth 
          });
        }}
      />
      
      {/* Main content - no border needed, outline handles it */}
      <View style={{ borderRadius: borderRadius }}>
        {children}
      </View>
      
      {/* Traveling light spot in border space */}
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
            zIndex: 5, // Between outline and content
          }}
          pointerEvents="none"
        >
          {/* Traveling light gradient */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0)',           // Transparent start
              `${finalGlowColor}40`,        // Subtle fade in
              `${finalGlowColor}80`,        // Building intensity
              `${finalGlowColor}ff`,        // Full intensity center
              `${finalGlowColor}80`,        // Building intensity
              `${finalGlowColor}40`,        // Subtle fade out
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
          
          {/* Soft outer glow for extra depth */}
          <View
            style={{
              position: 'absolute',
              top: -borderWidth,
              left: -borderWidth / 2,
              width: spotLength + borderWidth,
              height: borderWidth * 3,
              borderRadius: borderWidth * 1.5,
              backgroundColor: `${finalGlowColor}15`,
              shadowColor: finalGlowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: borderWidth * 2,
              elevation: 3,
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};