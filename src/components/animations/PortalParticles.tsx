import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  speed: number;
  direction: number;
}

interface PortalParticlesProps {
  isActive: boolean;
  transitionType: 'enter' | 'dive' | 'exit';
  particleColor?: string;
  particleCount?: number;
}

export const PortalParticles: React.FC<PortalParticlesProps> = ({
  isActive,
  transitionType,
  particleColor = '#8B5CF6',
  particleCount = 60,
}) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(Math.random() * screenHeight),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.5),
      rotation: new Animated.Value(0),
      speed: 1 + Math.random() * 3,
      direction: Math.random() * Math.PI * 2,
    }));
  }, [particleCount]);

  useEffect(() => {
    if (isActive) {
      startParticleAnimation();
    } else {
      stopParticleAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, transitionType]);

  const startParticleAnimation = () => {
    const particles = particlesRef.current;

    particles.forEach((particle, index) => {
      const delay = index * 30;
      
      if (transitionType === 'enter') {
        // Particles emerge from center
        particle.x.setValue(screenWidth / 2);
        particle.y.setValue(screenHeight / 2);
        
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0.7,
            duration: 1200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(particle.x, {
            toValue: Math.random() * screenWidth,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * screenHeight,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(particle.rotation, {
              toValue: 1,
              duration: 4000 + Math.random() * 2000,
              useNativeDriver: true,
            })
          ),
        ]).start();
        
      } else if (transitionType === 'dive') {
        // Spiral effect
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        Animated.sequence([
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: centerX,
              duration: 600,
              delay: delay / 2,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: centerY,
              duration: 600,
              delay: delay / 2,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 1,
              duration: 300,
              delay: delay / 2,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.x, {
              toValue: centerX + (Math.cos(particle.direction) * 150),
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(particle.y, {
              toValue: centerY + (Math.sin(particle.direction) * 150),
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0.4,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
        
      } else if (transitionType === 'exit') {
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 800,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: particle.y._value - 80,
            duration: 1200,
            delay,
            useNativeDriver: true,
          }),
        ]).start();
      }
    });

    // Start floating animation
    animateParticles();
  };

  const animateParticles = () => {
    const particles = particlesRef.current;
    
    const animate = () => {
      particles.forEach((particle) => {
        const time = Date.now() * 0.001;
        const currentX = particle.x._value;
        const currentY = particle.y._value;
        
        // Gentle floating motion
        const newX = currentX + Math.cos(time + particle.direction) * 0.3;
        const newY = currentY + Math.sin(time + particle.direction) * 0.2;
        
        if (newX >= 0 && newX <= screenWidth) {
          particle.x.setValue(newX);
        }
        if (newY >= 0 && newY <= screenHeight) {
          particle.y.setValue(newY);
        }
      });
      
      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

  const stopParticleAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const renderParticle = (particle: Particle, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.particle,
        {
          transform: [
            { translateX: particle.x },
            { translateY: particle.y },
            { scale: particle.scale },
            { 
              rotate: particle.rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              })
            },
          ],
          opacity: particle.opacity,
        },
      ]}
    >
      <View style={[
        styles.particleDot,
        { backgroundColor: particleColor }
      ]} />
    </Animated.View>
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map(renderParticle)}
      
      {/* Central portal ring for dive transitions */}
      {transitionType === 'dive' && (
        <View style={styles.portalCenter}>
          <Animated.View style={[
            styles.portalRing,
            { borderColor: particleColor }
          ]} />
        </View>
      )}
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
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
  },
  particleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  portalCenter: {
    position: 'absolute',
    top: screenHeight / 2 - 40,
    left: screenWidth / 2 - 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    opacity: 0.6,
  },
});