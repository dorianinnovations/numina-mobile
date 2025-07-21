import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { 
  Animated, 
  Easing, 
  StyleSheet, 
  ViewStyle, 
  Text, 
  TouchableOpacity, 
  View, 
  SafeAreaView 
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import { useTheme } from '../contexts/ThemeContext';

interface ShimmerBorderProps {
  isActive: boolean;
  borderRadius?: number;
  borderWidth?: number;
  animationSpeed?: number;
  gradientColors?: string[];
  backgroundColor?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const HeaderGradient: React.FC<ShimmerBorderProps> = ({
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

  // Define default colors - using a bright cyan for high contrast in dark mode
  const defaultGradientColors = isDarkMode
    ? ['#00ffff', 'rgba(0, 200, 255, 0.613)', 'rgba(0, 150, 255, 0)']
    : ['rgba(96, 165, 250, 1)', 'rgba(59, 130, 246, 0.5)', 'rgba(30, 58, 138, 0)'];
  
  const finalGradientColors = gradientColors || defaultGradientColors;
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
    <View style={[style, { position: 'relative', borderRadius, overflow: 'hidden' }]} onLayout={onLayout}>
      {/* Layer 1: The moving spotlight. It's in the background. */}
      {isActive && width > 0 && height > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            left: -80,
            top: -80,
            width: 160,
            height: 160,
            opacity: opacityAnim,
            transform: [{ translateX }, { translateY }],
          }}
          pointerEvents="none"
        >
          <Svg width={160} height={160} style={{ flex: 1 }}>
            <AnimatedCircle
              cx={80}
              cy={80}
              r={80}
              fill={finalGradientColors[0]}
              opacity={1}
            />
            <AnimatedCircle
              cx={80}
              cy={80}
              r={60}
              fill={finalGradientColors[1]}
              opacity={0.6}
            />
            <AnimatedCircle
              cx={80}
              cy={80}
              r={40}
              fill={finalGradientColors[2]}
              opacity={0.3}
            />
          </Svg>
        </Animated.View>
      )}

      {/* Layer 2: The content itself. It sits on top and has a solid background,
          creating the mask effect. The padding reveals the border area. */}
      <View style={{
        backgroundColor: finalBackgroundColor,
        padding: borderWidth,
        borderRadius,
      }}>
        {children}
      </View>
    </View>
  );
};

export default HeaderGradient;