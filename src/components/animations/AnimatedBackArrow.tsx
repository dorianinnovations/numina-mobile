import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Easing, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface AnimatedBackArrowProps {
  color: string;
  size?: number;
  onPress?: () => void;
  isPressed?: boolean;
}

export const AnimatedBackArrow: React.FC<AnimatedBackArrowProps> = ({ 
  color, 
  size = 16,
  onPress,
  isPressed = false
}) => {
  // Core animations
  const arrowScale = useRef(new Animated.Value(1)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;
  const trailOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPressed) {
      // Quick and direct slide left + fade out
      Animated.parallel([
        // Slide left fast
        Animated.timing(slideX, {
          toValue: -size * 2.5,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        
        // Fade out quickly
        Animated.timing(arrowOpacity, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset instantly
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(arrowOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(arrowScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(arrowRotation, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(trailOpacity, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]).start();
    }
  }, [isPressed]);

  // Interpolations
  const rotationDeg = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-8deg'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Main arrow - simple and direct */}
      <Animated.View 
        style={[
          styles.container, 
          { 
            width: size, 
            height: size,
            opacity: arrowOpacity,
            transform: [
              { translateX: slideX },
            ]
          }
        ]}
      >
        <FontAwesome5 
          name="arrow-left" 
          size={size} 
          color={color}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  trail: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 