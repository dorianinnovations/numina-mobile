import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface FluidGradientBackgroundProps {
  children?: React.ReactNode;
  colors?: string[];
}

export const FluidGradientBackground: React.FC<FluidGradientBackgroundProps> = ({ 
  children,
  colors = ['#1a0033', '#330066', '#4d0099', '#6600cc', '#7f00ff']
}) => {
  const { isDarkMode } = useTheme();
  // Reduced to just 2 gradient layers for performance
  const layer1X = useRef(new Animated.Value(0)).current;
  const layer1Y = useRef(new Animated.Value(0)).current;
  const layer2X = useRef(new Animated.Value(width * 0.5)).current;
  const layer2Y = useRef(new Animated.Value(height * 0.5)).current;
  
  // Simplified rotation
  const rotation1 = useRef(new Animated.Value(0)).current;
  
  // Single scale animation
  const scale1 = useRef(new Animated.Value(1)).current;
  
  // Blob morphing animations
  const blob1ScaleX = useRef(new Animated.Value(1.2)).current;
  const blob1ScaleY = useRef(new Animated.Value(0.8)).current;
  const blob2ScaleX = useRef(new Animated.Value(0.9)).current;
  const blob2ScaleY = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    // Simplified layer 1 animation - much slower and less CPU intensive
    Animated.loop(
      Animated.sequence([
        Animated.timing(layer1X, {
          toValue: width * 0.3,
          duration: 40000, // Much slower
          useNativeDriver: true,
        }),
        Animated.timing(layer1X, {
          toValue: 0,
          duration: 40000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simplified layer 2 animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(layer2Y, {
          toValue: height * 0.2,
          duration: 35000, // Much slower
          useNativeDriver: true,
        }),
        Animated.timing(layer2Y, {
          toValue: height * 0.5,
          duration: 35000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Very slow rotation
    Animated.loop(
      Animated.timing(rotation1, {
        toValue: 360,
        duration: 120000, // 2 minutes per rotation
        useNativeDriver: true,
      })
    ).start();

    // Gentle scale breathing
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale1, {
          toValue: 1.1,
          duration: 20000,
          useNativeDriver: true,
        }),
        Animated.timing(scale1, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Blob 1 morphing
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1ScaleX, {
          toValue: 0.8,
          duration: 25000,
          useNativeDriver: true,
        }),
        Animated.timing(blob1ScaleX, {
          toValue: 1.4,
          duration: 30000,
          useNativeDriver: true,
        }),
        Animated.timing(blob1ScaleX, {
          toValue: 1.2,
          duration: 20000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1ScaleY, {
          toValue: 1.2,
          duration: 28000,
          useNativeDriver: true,
        }),
        Animated.timing(blob1ScaleY, {
          toValue: 0.6,
          duration: 22000,
          useNativeDriver: true,
        }),
        Animated.timing(blob1ScaleY, {
          toValue: 0.8,
          duration: 25000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Blob 2 morphing
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2ScaleX, {
          toValue: 1.3,
          duration: 32000,
          useNativeDriver: true,
        }),
        Animated.timing(blob2ScaleX, {
          toValue: 0.7,
          duration: 28000,
          useNativeDriver: true,
        }),
        Animated.timing(blob2ScaleX, {
          toValue: 0.9,
          duration: 24000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2ScaleY, {
          toValue: 0.8,
          duration: 26000,
          useNativeDriver: true,
        }),
        Animated.timing(blob2ScaleY, {
          toValue: 1.4,
          duration: 30000,
          useNativeDriver: true,
        }),
        Animated.timing(blob2ScaleY, {
          toValue: 1.1,
          duration: 22000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const interpolatedRotation1 = rotation1.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // Define earth-like color schemes based on theme
  const colorScheme = isDarkMode ? {
    base: ['#0a1419', '#1a2831', '#1f3644'],
    blob1: ['#1e3a5f', '#2d4a6b', '#3d5a7b', '#4d6a8b'],
    blob2: ['#1a4555', '#2a5565', '#3a6575', '#4a7585'],
    blob3: ['#26404f', '#36505f', '#46606f', '#56707f'],
    vignette: 'rgba(0,20,40,0.6)',
    blurTint: 'dark' as const
  } : {
    base: ['#f0f9ff', '#e0f2fe', '#bae6fd'],
    blob1: ['#e0f4ff', '#bfdbfe', '#93c5fd', '#60a5fa'],
    blob2: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80'],
    blob3: ['#f0f9ff', '#e0f2fe', '#a7f0ff', '#67d4f0'],
    vignette: 'rgba(240,249,255,0.3)',
    blurTint: 'light' as const
  };

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={colorScheme.base}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Morphing animated gradient blobs */}
      <Animated.View
        style={[
          styles.gradientBlob,
          {
            transform: [
              { translateX: layer1X },
              { scale: scale1 },
              { scaleX: blob1ScaleX },
              { scaleY: blob1ScaleY },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={colorScheme.blob1}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.gradientBlob,
          {
            transform: [
              { translateY: layer2Y },
              { rotate: interpolatedRotation1 },
              { scaleX: blob2ScaleX },
              { scaleY: blob2ScaleY },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={colorScheme.blob2}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>
      
      {/* Reduced blur overlay for performance */}
      <BlurView 
        intensity={isDarkMode ? 10 : 15} 
        style={StyleSheet.absoluteFillObject}
        tint={colorScheme.blurTint}
      />
      
      {/* Subtle vignette */}
      <LinearGradient
        colors={['transparent', 'transparent', colorScheme.vignette]}
        locations={[0, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradientBlob: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.2,
    borderRadius: width * 0.3,
    overflow: 'hidden',
    transform: [{ scaleX: 1.2 }, { scaleY: 0.8 }],
  },
  gradient: {
    flex: 1,
  },
});

export default FluidGradientBackground;