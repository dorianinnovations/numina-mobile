import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Star {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  opacity: Animated.Value;
  translateX: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
}

interface ShootingStarsProps {
  count?: number;
  speed?: 'slow' | 'medium' | 'fast';
  direction?: 'diagonal' | 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
}

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  count = 3,
  speed = 'medium',
  direction = 'diagonal',
  size = 'medium'
}) => {
  const { isDarkMode } = useTheme();
  const stars = useRef<Star[]>([]);

  // Speed configuration
  const speedConfig = {
    slow: { min: 3000, max: 5000 },
    medium: { min: 1500, max: 3000 },
    fast: { min: 800, max: 1500 }
  };

  // Size configuration
  const sizeConfig = {
    small: { width: 1, height: 12, blur: 2 },
    medium: { width: 2, height: 20, blur: 3 },
    large: { width: 3, height: 28, blur: 4 }
  };

  const createStar = (id: number): Star => {
    let startX, startY, endX, endY;

    switch (direction) {
      case 'horizontal':
        startX = -50;
        startY = Math.random() * height * 0.8;
        endX = width + 50;
        endY = startY + (Math.random() - 0.5) * 100;
        break;
      case 'vertical':
        startX = Math.random() * width;
        startY = -50;
        endX = startX + (Math.random() - 0.5) * 100;
        endY = height + 50;
        break;
      default: // diagonal
        const isTopToBottom = Math.random() > 0.5;
        if (isTopToBottom) {
          startX = Math.random() * width * 0.3;
          startY = -50;
          endX = startX + width * 0.6 + Math.random() * width * 0.4;
          endY = height * 0.7 + Math.random() * height * 0.3;
        } else {
          startX = width + 50;
          startY = Math.random() * height * 0.3;
          endX = -50;
          endY = startY + height * 0.4 + Math.random() * height * 0.3;
        }
    }

    const duration = speedConfig[speed].min + Math.random() * (speedConfig[speed].max - speedConfig[speed].min);
    const delay = Math.random() * 5000; // Random delay up to 5 seconds - slower for performance

    return {
      id,
      startX,
      startY,
      endX,
      endY,
      duration,
      delay,
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(startX),
      translateY: new Animated.Value(startY),
      scale: new Animated.Value(0.3)
    };
  };

  const animateStar = (star: Star) => {
    // Reset to start position
    star.opacity.setValue(0);
    star.translateX.setValue(star.startX);
    star.translateY.setValue(star.startY);
    star.scale.setValue(0.3);

    // Create shooting star animation sequence
    Animated.sequence([
      // Wait for delay
      Animated.delay(star.delay),
      
      // Fade in and scale up quickly
      Animated.parallel([
        Animated.timing(star.opacity, {
          toValue: 0.9,
          duration: star.duration * 0.1,
          useNativeDriver: true,
        }),
        Animated.timing(star.scale, {
          toValue: 1,
          duration: star.duration * 0.1,
          useNativeDriver: true,
        }),
      ]),
      
      // Move across screen while maintaining opacity
      Animated.parallel([
        Animated.timing(star.translateX, {
          toValue: star.endX,
          duration: star.duration * 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(star.translateY, {
          toValue: star.endY,
          duration: star.duration * 0.8,
          useNativeDriver: true,
        }),
      ]),
      
      // Fade out
      Animated.timing(star.opacity, {
        toValue: 0,
        duration: star.duration * 0.1,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Restart animation after random interval
      setTimeout(() => {
        star.delay = Math.random() * 3000; // New random delay - slower for performance
        animateStar(star);
      }, Math.random() * 2000 + 1500); // 1.5-3.5 second pause - slower for performance
    });
  };

  useEffect(() => {
    // Initialize stars
    stars.current = Array.from({ length: count }, (_, i) => createStar(i));

    // Start animations with staggered timing
    stars.current.forEach((star, index) => {
      setTimeout(() => {
        animateStar(star);
      }, index * 1000); // Stagger by 1 second
    });

    // Cleanup function
    return () => {
      stars.current.forEach(star => {
        star.opacity.stopAnimation();
        star.translateX.stopAnimation();
        star.translateY.stopAnimation();
        star.scale.stopAnimation();
      });
    };
  }, [count, speed, direction]);

  const starColor = isDarkMode ? 'rgba(173, 213, 250, 0.95)' : 'rgba(59, 130, 246, 0.85)';
  const trailColor = isDarkMode ? 'rgba(173, 213, 250, 0.5)' : 'rgba(59, 130, 246, 0.4)';

  return (
    <View style={styles.container}>
      {stars.current.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              opacity: star.opacity,
              transform: [
                { translateX: star.translateX },
                { translateY: star.translateY },
                { scale: star.scale },
              ],
            },
          ]}
        >
          {/* Main star */}
          <View
            style={[
              styles.starCore,
              {
                width: sizeConfig[size].width,
                height: sizeConfig[size].height,
                backgroundColor: starColor,
                shadowColor: starColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: sizeConfig[size].blur,
              },
            ]}
          />
          
          {/* Trailing glow */}
          <View
            style={[
              styles.starTrail,
              {
                width: sizeConfig[size].width * 0.5,
                height: sizeConfig[size].height * 2,
                backgroundColor: trailColor,
                shadowColor: trailColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: sizeConfig[size].blur * 1.5,
              },
            ]}
          />
        </Animated.View>
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
    zIndex: 15,
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starCore: {
    borderRadius: 1,
    position: 'absolute',
  },
  starTrail: {
    borderRadius: 1,
    position: 'absolute',
    top: -10,
    opacity: 0.5,
  },
});