import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface EnhancedSpinnerProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  type?: 'ring' | 'morphing' | 'particle' | 'liquid' | 'holographic';
  success?: boolean;
  onComplete?: () => void;
}

export const EnhancedSpinner: React.FC<EnhancedSpinnerProps> = ({
  size = 24,
  color = '#6ec5ff',
  strokeWidth = 2,
  type = 'morphing',
  success = false,
  onComplete
}) => {
  const rotationValue = useRef(new Animated.Value(0)).current;
  const morphValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const particleValues = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;

  // Base rotation animation - perfect speed for holographic
  useEffect(() => {
    const duration = type === 'holographic' ? 420 : 480; // 40% faster - maximum performance
    
    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      ).start();
    };
    
    // Dramatic delay for holographic effect - makes mind think it's processing
    if (type === 'holographic') {
      setTimeout(startRotation, 120); // Maximum speed dramatic pause
    } else {
      startRotation();
    }
  }, [type]);

  // Success morphing animation
  useEffect(() => {
    if (success) {
      // Stop rotation and morph to success
      Animated.sequence([
        // Quick scale up
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        // Morph to checkmark
        Animated.parallel([
          Animated.timing(morphValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        // Final celebration bounce
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      });

      // Particle burst animation
      if (type === 'particle') {
        particleValues.forEach((value, index) => {
          Animated.timing(value, {
            toValue: 1,
            duration: 800,
            delay: index * 50,
            useNativeDriver: true,
          }).start();
        });
      }
    }
  }, [success]);

  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const checkmarkOpacity = morphValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const ringOpacity = morphValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 0],
  });

  const successColor = success ? '#10b981' : color;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Thinner curve - smaller arc for holographic, full circle for others
  const arcLength = type === 'holographic' ? 0.35 : 0.75; // Much thinner arc
  const strokeDasharray = circumference * arcLength;
  const strokeDashoffset = circumference * (1 - arcLength);

  const renderSpinner = () => {
    switch (type) {
      case 'morphing':
        return (
          <Animated.View style={[
            styles.container,
            {
              width: size,
              height: size,
              transform: [{ rotate: success ? '0deg' : rotation }, { scale: scaleValue }],
            }
          ]}>
            <Svg width={size} height={size}>
              {/* Loading ring */}
              <G opacity={ringOpacity}>
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={successColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </G>
              
              {/* Success checkmark */}
              <G opacity={checkmarkOpacity}>
                <Path
                  d={`M ${size * 0.3} ${size * 0.5} L ${size * 0.45} ${size * 0.65} L ${size * 0.7} ${size * 0.35}`}
                  stroke={successColor}
                  strokeWidth={strokeWidth + 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="transparent"
                />
              </G>
            </Svg>
          </Animated.View>
        );

      case 'holographic':
        return (
          <Animated.View style={[
            styles.container,
            {
              width: size,
              height: size,
              transform: [{ rotate: rotation }, { scale: scaleValue }],
            }
          ]}>
            <Svg width={size} height={size}>
              {/* Outer holographic ring - thinner stroke */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#holographic-gradient-${size})`}
                strokeWidth={strokeWidth * 0.7} // Thinner stroke
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                opacity={0.85}
              />
              
              {/* Inner glow ring - much thinner */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius * 0.8}
                stroke={`url(#inner-glow-${size})`}
                strokeWidth={strokeWidth * 0.3} // Much thinner inner ring
                strokeDasharray={strokeDasharray * 0.8}
                strokeDashoffset={strokeDashoffset * 0.8}
                strokeLinecap="round"
                fill="transparent"
                opacity={0.4}
              />
              
              <Defs>
                {/* Main holographic gradient */}
                <LinearGradient id={`holographic-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#ff0080" stopOpacity="1" />
                  <Stop offset="20%" stopColor="#7928ca" stopOpacity="1" />
                  <Stop offset="40%" stopColor="#0070f3" stopOpacity="1" />
                  <Stop offset="60%" stopColor="#00f5ff" stopOpacity="1" />
                  <Stop offset="80%" stopColor="#50e3c2" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#f5a623" stopOpacity="1" />
                </LinearGradient>
                
                {/* Inner glow gradient */}
                <LinearGradient id={`inner-glow-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <Stop offset="50%" stopColor="#e0e7ff" stopOpacity="0.6" />
                  <Stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.4" />
                </LinearGradient>
              </Defs>
            </Svg>
            
            {/* Additional sparkle effect */}
            <View style={[styles.sparkleOverlay, { width: size, height: size }]}>
              <Animated.View style={[
                styles.sparkle,
                {
                  transform: [{ rotate: rotation }],
                  opacity: scaleValue.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.3, 0.8],
                  }),
                }
              ]}>
                <View style={[styles.sparklePoint, { backgroundColor: '#ffffff' }]} />
              </Animated.View>
            </View>
          </Animated.View>
        );

      default:
        // Standard ring
        return (
          <Animated.View style={[
            styles.container,
            {
              width: size,
              height: size,
              transform: [{ rotate: rotation }],
            }
          ]}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </Svg>
          </Animated.View>
        );
    }
  };

  return renderSpinner();
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  sparklePoint: {
    width: 2,
    height: 2,
    borderRadius: 1,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
});