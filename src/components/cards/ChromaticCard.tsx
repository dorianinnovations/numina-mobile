import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import { ShineEffect } from '../effects/ShineEffect';

interface ChromaticCardProps {
  children: React.ReactNode;
  tier: 'core' | 'aether';
  style?: ViewStyle;
  isActive?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const ChromaticCard: React.FC<ChromaticCardProps> = ({ 
  children, 
  tier, 
  style,
  isActive = false 
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle pulse for active cards
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isActive]);

  // Core: Neon pastel mint and cyan with electric highlights
  const coreGradient = {
    outer: [
      'rgba(34, 211, 238, 0.4)',   // Electric cyan
      'rgba(125, 211, 252, 0.5)',  // Sky blue
      'rgba(196, 254, 236, 0.4)',  // Mint
      'rgba(34, 211, 238, 0.4)',   // Back to electric cyan
    ],
    inner: [
      'rgba(103, 232, 249, 0.2)',  // Bright cyan
      'rgba(165, 243, 252, 0.2)',  // Light cyan
      'rgba(167, 243, 208, 0.2)',  // Mint green
    ],
    shimmer: [
      'transparent',
      'rgba(255, 255, 255, 0.05)',
      'rgba(196, 254, 236, 0.2)',  // Bright mint shimmer
      'rgba(255, 255, 255, 0.05)',
      'transparent',
    ],
    edge: 'rgba(34, 211, 238, 0.8)',
  };

  // Aether: Vibrant neon purple-pink-orange with holographic intensity
  const aetherGradient = {
    outer: [
      'rgba(244, 114, 182, 0.5)',  // Hot pink
      'rgba(196, 125, 255, 0.6)',  // Bright purple
      'rgba(251, 146, 60, 0.5)',   // Electric orange
      'rgba(139, 92, 246, 0.5)',   // Electric violet
      'rgba(244, 114, 182, 0.5)',  // Back to hot pink
    ],
    inner: [
      'rgba(217, 70, 239, 0.25)',  // Fuchsia
      'rgba(196, 125, 255, 0.25)',  // Light purple
      'rgba(251, 146, 60, 0.2)',   // Orange glow
      'rgba(139, 92, 246, 0.25)',  // Violet
    ],
    shimmer: [
      'transparent',
      'rgba(254, 202, 202, 0.1)',  // Peach shimmer
      'rgba(255, 251, 235, 0.2)',  // Golden shimmer
      'rgba(254, 202, 202, 0.1)',
      'transparent',
    ],
    edge: 'rgba(251, 146, 60, 0.9)',
  };

  const gradient = tier === 'aether' ? aetherGradient : coreGradient;

  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          transform: [{ scale: pulseAnim }],
        }
      ]}
    >
      {/* Neumorphic base */}
      <View style={styles.neumorphicBase}>
        <View style={[
          styles.innerContent,
          {
            backgroundColor: '#0a0a0a',
            borderColor: '#333333',
            borderWidth: 1,
          }
        ]}>
          {children}
        </View>
      </View>

      {/* Shine effect - only for aether */}
      <ShineEffect enabled={tier === 'aether'} />

    </Animated.View>
  );
};

interface ChromaticTextProps {
  children: string;
  tier: 'core' | 'aether';
  style?: any;
  variant?: 'title' | 'price' | 'normal';
}

export const ChromaticText: React.FC<ChromaticTextProps> = ({ 
  children, 
  tier, 
  style,
  variant = 'normal' 
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Core colors: Single neutral colors
  const coreColors = {
    title: ['#ffffff', '#ffffff'] as const, // Pure white
    price: ['#94a3b8', '#94a3b8'] as const, // Neutral slate
    normal: ['#94a3b8', '#94a3b8'] as const, // Neutral slate
  };

  // Aether colors: Single purple theme
  const aetherColors = {
    title: ['#a855f7', '#a855f7'] as const, // Single purple
    price: ['#c084fc', '#c084fc'] as const, // Light purple
    normal: ['#a855f7', '#a855f7'] as const, // Purple
  };

  const colors = tier === 'aether' ? aetherColors[variant] : coreColors[variant];

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0.8],
  });

  return (
    <Animated.View style={{ opacity }}>
      <MaskedView
        style={[{ flexDirection: 'row' }, style]}
        maskElement={
          <Text style={[
            styles.maskText, 
            style,
            variant === 'title' && styles.titleText,
            variant === 'price' && styles.priceText,
          ]}>
            {children}
          </Text>
        }
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </MaskedView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  neumorphicBase: {
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  innerContent: {
    borderRadius: 6,
    padding: 24,
    overflow: 'hidden',
  },
  maskText: {
    backgroundColor: 'transparent',
    color: 'black',
  },
  titleText: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  priceText: {
    fontWeight: '800',
  },
});