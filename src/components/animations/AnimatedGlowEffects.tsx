import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface GlowOrbProps {
  color: string;
  size: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
}

const GlowOrb: React.FC<GlowOrbProps> = ({
  color,
  size,
  startX,
  startY,
  endX,
  endY,
  duration,
  delay,
}) => {
  const position = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animate = () => {
      // Reset position
      position.setValue({ x: startX, y: startY });
      opacity.setValue(0);
      scale.setValue(0.5);

      // Start animation sequence
      setTimeout(() => {
        Animated.parallel([
          // Move across screen
          Animated.timing(position, {
            toValue: { x: endX, y: endY },
            duration: duration,
            useNativeDriver: false,
          }),
          // Fade in then out
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: duration * 0.2,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: duration * 0.6,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: false,
            }),
          ]),
          // Scale animation
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.3,
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: duration * 0.4,
              useNativeDriver: false,
            }),
            Animated.timing(scale, {
              toValue: 0.3,
              duration: duration * 0.3,
              useNativeDriver: false,
            }),
          ]),
        ]).start(() => {
          // Restart animation after a brief pause
          setTimeout(animate, 1000);
        });
      }, delay);
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.orbContainer,
        {
          left: position.x,
          top: position.y,
          opacity: opacity,
          transform: [{ scale: scale }],
        },
      ]}
    >
      <LinearGradient
        colors={[color + '80', color + '40', color + '00']}
        style={[styles.orb, { width: size, height: size, borderRadius: size / 2 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

export const AnimatedGlowEffects: React.FC = () => {
  const glowOrbs = [
    // Cyan orbs moving from left to right
    {
      color: '#06b6d4', // cyan
      size: 60,
      startX: -30,
      startY: height * 0.2,
      endX: width + 30,
      endY: height * 0.3,
      duration: 8000,
      delay: 0,
    },
    {
      color: '#0891b2', // darker cyan
      size: 40,
      startX: -20,
      startY: height * 0.6,
      endX: width + 20,
      endY: height * 0.5,
      duration: 10000,
      delay: 2000,
    },
    // Purple orbs moving diagonally
    {
      color: '#a855f7', // purple
      size: 80,
      startX: width * 0.1,
      startY: height + 40,
      endX: width * 0.9,
      endY: -40,
      duration: 12000,
      delay: 1000,
    },
    {
      color: '#9333ea', // darker purple
      size: 50,
      startX: width * 0.8,
      startY: height + 25,
      endX: width * 0.2,
      endY: -25,
      duration: 9000,
      delay: 4000,
    },
    // Light blue orbs moving from top to bottom
    {
      color: '#3b82f6', // light blue
      size: 70,
      startX: width * 0.3,
      startY: -35,
      endX: width * 0.7,
      endY: height + 35,
      duration: 11000,
      delay: 500,
    },
    {
      color: '#60a5fa', // lighter blue
      size: 45,
      startX: width * 0.7,
      startY: -25,
      endX: width * 0.3,
      endY: height + 25,
      duration: 13000,
      delay: 3000,
    },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {glowOrbs.map((orb, index) => (
        <GlowOrb
          key={index}
          color={orb.color}
          size={orb.size}
          startX={orb.startX}
          startY={orb.startY}
          endX={orb.endX}
          endY={orb.endY}
          duration={orb.duration}
          delay={orb.delay}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  orbContainer: {
    position: 'absolute',
  },
  orb: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
});