import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

interface LockParticlesProps {
  enabled: boolean;
  color?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const LockParticles: React.FC<LockParticlesProps> = ({ 
  enabled = false, 
  color = '#add5fa' 
}) => {
  // Create many more particles for excessive effect
  const particles = useRef(
    Array.from({ length: 18 }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!enabled) return;

    // Excessive particle burst with professional polish
    const animateParticles = () => {
      particles.forEach((particle, index) => {
        // More varied and dramatic starting positions
        const startY = Math.random() * 300 - 150; // Larger spread: -150 to 150
        const endX = Math.random() * 80 + 20; // Much further: 20 to 100 pixels
        const endY = startY + (Math.random() * 120 - 60); // More dramatic drift
        const rotationEnd = Math.random() * 720 - 360; // Full spins
        const scaleVariation = 0.8 + Math.random() * 0.6; // 0.8 to 1.4 scale
        
        // Reset particle
        particle.opacity.setValue(0);
        particle.translateX.setValue(0);
        particle.translateY.setValue(startY);
        particle.scale.setValue(0);
        particle.rotation.setValue(0);

        // Much faster staggered delays for rapid-fire effect
        const delay = index * 25; // Much faster: 25ms between particles

        setTimeout(() => {
          // Snappy particle birth - faster and more dramatic
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 120, // Much faster
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: scaleVariation,
              duration: 120,
              useNativeDriver: true,
            }),
            Animated.timing(particle.rotation, {
              toValue: rotationEnd * 0.3, // Initial rotation
              duration: 120,
              useNativeDriver: true,
            }),
          ]).start();

          // Immediately start dramatic movement
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(particle.translateX, {
                toValue: endX,
                duration: 600, // Faster movement
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateY, {
                toValue: endY,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(particle.rotation, {
                toValue: rotationEnd, // Complete rotation
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 400, // Faster fade
                delay: 100, // Start fading quickly
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.1, // Shrink more dramatically
                duration: 600,
                useNativeDriver: true,
              }),
            ]).start();
          }, 50); // Start movement almost immediately
        }, delay);
      });
    };

    // Start particle burst immediately for maximum impact
    const timeout = setTimeout(animateParticles, 100);

    return () => clearTimeout(timeout);
  }, [enabled, particles]);

  if (!enabled) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: color,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
                { rotate: particle.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 80, // Particle effect area
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    width: 4, // Slightly larger for more visibility
    height: 4,
    borderRadius: 2,
    left: 2, // Start near the border
    top: '50%', // Center vertically initially
    shadowColor: '#add5fa',
    shadowOpacity: 0.8,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
});