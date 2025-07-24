import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  type: 'dot' | 'ring' | 'cross' | 'triangle';
}

interface InteractiveParticlesProps {
  enabled?: boolean;
  maxParticles?: number;
  trailLength?: number;
  particleLife?: number;
}

export const InteractiveParticles: React.FC<InteractiveParticlesProps> = ({
  enabled = true,
  maxParticles = 25,
  trailLength = 5,
  particleLife = 3000
}) => {
  const { isDarkMode } = useTheme();
  const particles = useRef<Particle[]>([]);
  const [gestureEnabled, setGestureEnabled] = useState(enabled);
  const lastTouch = useRef({ x: 0, y: 0, timestamp: 0 });
  const animationFrameRef = useRef<Set<number>>(new Set());

  const particleTypes = ['dot', 'ring', 'cross', 'triangle'] as const;

  const createParticle = (x: number, y: number, velocity: { vx: number; vy: number }): Particle => {
    const id = Date.now() + Math.random();
    const size = Math.random() * 4 + 2; // 2-6
    const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
    const life = particleLife + Math.random() * 1000; // Slight variation

    return {
      id,
      x: new Animated.Value(x),
      y: new Animated.Value(y),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotation: new Animated.Value(0),
      vx: velocity.vx + (Math.random() - 0.5) * 40,
      vy: velocity.vy + (Math.random() - 0.5) * 40,
      life,
      maxLife: life,
      size,
      type
    };
  };

  const animateParticle = (particle: Particle) => {
    // Spawn animation
    Animated.parallel([
      Animated.spring(particle.scale, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(particle.rotation, {
        toValue: 360,
        duration: particle.life,
        useNativeDriver: true,
      }),
    ]).start();

    // Physics-based movement
    const updatePosition = () => {
      // Stop if not enabled
      if (!enabled || !gestureEnabled) {
        animationFrameRef.current.delete(particle.id);
        return;
      }
      
      const currentX = (particle.x as any)._value;
      const currentY = (particle.y as any)._value;
      
      // Apply gravity and friction
      particle.vy += 0.3; // Gravity
      particle.vx *= 0.99; // Air friction
      particle.vy *= 0.99; // Air friction
      
      // Update position
      const newX = currentX + particle.vx * 0.16;
      const newY = currentY + particle.vy * 0.16;
      
      particle.x.setValue(newX);
      particle.y.setValue(newY);
      
      // Update life and opacity
      particle.life -= 16;
      const lifeRatio = particle.life / particle.maxLife;
      particle.opacity.setValue(Math.max(0, lifeRatio));
      
      if (particle.life > 0 && newY < height + 50) {
        const frameId = requestAnimationFrame(updatePosition);
        animationFrameRef.current.add(frameId);
      } else {
        // Remove particle
        animationFrameRef.current.delete(particle.id);
        particles.current = particles.current.filter(p => p.id !== particle.id);
      }
    };

    const frameId = requestAnimationFrame(updatePosition);
    animationFrameRef.current.add(frameId);
  };

  const handleTouch = (event: any) => {
    if (!gestureEnabled) return;

    const { locationX: x, locationY: y } = event.nativeEvent;
    const now = Date.now();
    const deltaTime = now - lastTouch.current.timestamp;
    
    if (deltaTime > 0) {
      const vx = (x - lastTouch.current.x) / deltaTime * 1000;
      const vy = (y - lastTouch.current.y) / deltaTime * 1000;
      
      // Create multiple particles for richer effect
      const numParticles = Math.min(3, trailLength);
      for (let i = 0; i < numParticles; i++) {
        if (particles.current.length < maxParticles) {
          const offsetX = (Math.random() - 0.5) * 10;
          const offsetY = (Math.random() - 0.5) * 10;
          const particle = createParticle(x + offsetX, y + offsetY, { vx, vy });
          particles.current.push(particle);
          animateParticle(particle);
        }
      }
    }
    
    lastTouch.current = { x, y, timestamp: now };
  };

  useEffect(() => {
    setGestureEnabled(enabled);
    
    // Stop all animations when disabled
    if (!enabled) {
      animationFrameRef.current.forEach(frameId => {
        cancelAnimationFrame(frameId);
      });
      animationFrameRef.current.clear();
    }
  }, [enabled]);

  // Cleanup particles on unmount
  useEffect(() => {
    return () => {
      // Cancel all animation frames
      animationFrameRef.current.forEach(frameId => {
        cancelAnimationFrame(frameId);
      });
      animationFrameRef.current.clear();
      
      // Stop all particle animations
      particles.current.forEach(particle => {
        particle.x.stopAnimation();
        particle.y.stopAnimation();
        particle.scale.stopAnimation();
        particle.opacity.stopAnimation();
        particle.rotation.stopAnimation();
      });
    };
  }, []);

  const renderParticle = (particle: Particle) => {
    const baseColor = isDarkMode ? 'rgba(173, 213, 250, 0.8)' : 'rgba(59, 130, 246, 0.6)';
    const accentColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)';

    let shape = null;
    
    switch (particle.type) {
      case 'dot':
        shape = (
          <View
            style={[
              styles.dot,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: baseColor,
                shadowColor: baseColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: particle.size * 0.5,
              },
            ]}
          />
        );
        break;
      
      case 'ring':
        shape = (
          <View
            style={[
              styles.ring,
              {
                width: particle.size * 1.5,
                height: particle.size * 1.5,
                borderRadius: particle.size * 0.75,
                borderWidth: 1,
                borderColor: baseColor,
              },
            ]}
          />
        );
        break;
      
      case 'cross':
        shape = (
          <View style={styles.cross}>
            <View
              style={[
                styles.crossBar,
                styles.crossHorizontal,
                {
                  width: particle.size,
                  height: 1,
                  backgroundColor: accentColor,
                },
              ]}
            />
            <View
              style={[
                styles.crossBar,
                styles.crossVertical,
                {
                  width: 1,
                  height: particle.size,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        );
        break;
      
      case 'triangle':
        shape = (
          <View
            style={[
              styles.triangle,
              {
                width: 0,
                height: 0,
                borderLeftWidth: particle.size * 0.5,
                borderRightWidth: particle.size * 0.5,
                borderBottomWidth: particle.size,
                borderStyle: 'solid',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: baseColor,
              },
            ]}
          />
        );
        break;
    }

    return (
      <Animated.View
        key={particle.id}
        style={[
          styles.particle,
          {
            opacity: particle.opacity,
            transform: [
              { translateX: particle.x },
              { translateY: particle.y },
              { scale: particle.scale },
              {
                rotate: particle.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        {shape}
      </Animated.View>
    );
  };

  return (
    <TouchableWithoutFeedback onPressIn={handleTouch}>
      <View style={styles.container}>
        {particles.current.map(renderParticle)}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    pointerEvents: 'box-none',
  },
  particle: {
    position: 'absolute',
  },
  dot: {
    // Styles applied inline
  },
  ring: {
    // Styles applied inline
  },
  cross: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossBar: {
    position: 'absolute',
  },
  crossHorizontal: {
    // Styles applied inline
  },
  crossVertical: {
    // Styles applied inline
  },
  triangle: {
    // Styles applied inline
  },
});