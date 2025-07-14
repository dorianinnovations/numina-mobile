import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
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
  const arrowRotation = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPressed) {
      // Press animation sequence
      Animated.parallel([
        // Scale down on press
        Animated.timing(arrowScale, {
          toValue: 0.85,
          duration: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        
        // Slight rotation for dynamic feel
        Animated.timing(arrowRotation, {
          toValue: 1,
          duration: 150,
          easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
          useNativeDriver: true,
        }),
        
        // Container scale for depth
        Animated.timing(containerScale, {
          toValue: 0.95,
          duration: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        
        // Glow effect
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 1,
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.3,
            duration: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
        
        // Wobble effect
        Animated.spring(wobbleAnim, {
          toValue: 1,
          friction: 3,
          tension: 150,
          useNativeDriver: true,
        }),
        
        // Bounce effect
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 150,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Release animation sequence
      Animated.parallel([
        // Scale back to normal
        Animated.spring(arrowScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        
        // Reset rotation
        Animated.timing(arrowRotation, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        
        // Container scale back
        Animated.spring(containerScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        
        // Fade glow
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        
        // Reset wobble
        Animated.spring(wobbleAnim, {
          toValue: 0,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isPressed]);

  // Interpolations
  const arrowRotationDeg = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-15deg'],
    extrapolate: 'clamp',
  });

  const wobbleRotation = wobbleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-8deg', '0deg'],
    extrapolate: 'clamp',
  });

  const bounceScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
    extrapolate: 'clamp',
  });

  const glowIntensity = glowOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowIntensity,
            width: size * 2,
            height: size * 2,
            borderRadius: size,
          }
        ]}
      />
      
      {/* Main arrow container */}
      <Animated.View 
        style={[
          styles.container, 
          { 
            width: size, 
            height: size,
            transform: [
              { scale: containerScale },
              { rotate: wobbleRotation },
            ]
          }
        ]}
      >
        <Animated.View
          style={[
            styles.arrowContainer,
            {
              transform: [
                { scale: arrowScale },
                { rotate: arrowRotationDeg },
                { scale: bounceScale },
              ]
            }
          ]}
        >
          <FontAwesome5 
            name="arrow-left" 
            size={size} 
            color={color}
            style={{
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          />
        </Animated.View>
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
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'transparent',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
}); 