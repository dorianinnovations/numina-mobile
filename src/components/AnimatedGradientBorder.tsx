import React, { useState, useEffect, useRef } from 'react';
import { 
  Animated, 
  Easing, 
  ViewStyle, 
  View 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedGradientBorderProps {
  isActive: boolean;
  borderRadius?: number;
  borderWidth?: number;
  animationSpeed?: number;
  gradientColors?: string[];
  backgroundColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 2,
  animationSpeed = 4000,
  gradientColors,
  backgroundColor,
  children,
  style,
}) => {
  const { isDarkMode, theme } = useTheme();
  const positionAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Layout state
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const perimeter = (width + height) * 2;
    if (isActive && perimeter > 0) {
      // Start the animations
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.timing(positionAnim, {
          toValue: 1,
          duration: animationSpeed,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

    } else {
      // Stop the animations
      positionAnim.stopAnimation();
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        positionAnim.setValue(0);
      });
    }

    return () => {
      positionAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [isActive, animationSpeed, width, height]);

  // Define default colors based on theme - much more lavender purple
  const defaultGradientColors = isDarkMode
    ? ['#87ebde', 'rgba(135, 235, 222, 0.4)', 'rgba(180, 200, 240, 0.7)', 'rgba(180, 200, 240, 0)']
    : ['#00d4ff', 'rgba(0, 212, 255, 0.4)', 'rgba(160, 180, 255, 0.7)', 'rgba(160, 180, 255, 0)'];
  
  let finalGradientColors: readonly [string, string, ...string[]];
  const mergedColors = gradientColors || defaultGradientColors;
  if (mergedColors.length >= 2) {
    finalGradientColors = (mergedColors as unknown) as readonly [string, string, ...string[]];
  } else {
    finalGradientColors = [
      '#000000',
      '#FFFFFF',
      ...mergedColors
    ] as const;
  }
  const finalBackgroundColor = backgroundColor || theme.colors.background;

  // This is the core logic to move the spotlight around the perimeter.
  const translateX = positionAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, width, width, 0, 0],
  });

  const translateY = positionAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 0, height, height, 0],
  });

  // Handle the layout measurement to get the width and height
  const onLayout = (event: any) => {
    const { width: newWidth, height: newHeight } = event.nativeEvent.layout;
    setWidth(newWidth);
    setHeight(newHeight);
  };

  return (
    <Animated.View 
      style={[
        style, 
        { 
          borderRadius,
          opacity: isActive ? opacityAnim : 1,
        }
      ]} 
      onLayout={onLayout}
    >
      {/* Always visible gradient background */}
      <LinearGradient
        colors={finalGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius,
        }}
      />
      
      {/* Content container with padding to show border */}
      <View style={{
        backgroundColor: finalBackgroundColor,
        margin: borderWidth,
        borderRadius: Math.max(0, borderRadius - borderWidth),
        minHeight: 50, // Ensure some minimum height
      }}>
        {children}
      </View>
    </Animated.View>
  );
};

// Backward compatibility alias
export const ShimmerBorder = AnimatedGradientBorder;

export default AnimatedGradientBorder;