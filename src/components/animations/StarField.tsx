import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  scale: Animated.Value;
  twinkleDelay: number;
  twinkleDuration: number;
}

interface StarFieldProps {
  density?: 'low' | 'medium' | 'high';
  animated?: boolean;
  interactive?: boolean;
  constellation?: boolean;
}

export const StarField: React.FC<StarFieldProps> = ({
  density = 'medium',
  animated = true,
  interactive = false,
  constellation = false
}) => {
  const { isDarkMode } = useTheme();
  const stars = useRef<Star[]>([]);
  const [touchStars, setTouchStars] = useState<{ x: number; y: number; id: number; anim: Animated.Value }[]>([]);

  // Density configuration - reduced for performance
  const densityConfig = {
    low: 8,
    medium: 15,
    high: 25
  };

  const createStar = (id: number): Star => {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1 + 0.5; 
    const twinkleDelay = Math.random() * 8000; 
    const twinkleDuration = 2000 + Math.random() * 3000;

    return {
      id,
      x,
      y,
      size,
      opacity: new Animated.Value(1), // Full opacity
      scale: new Animated.Value(1),
      twinkleDelay,
      twinkleDuration
    };
  };

  const twinkleStar = (star: Star) => {
    if (!animated) return;

    const startTwinkle = () => {
      Animated.sequence([
        Animated.delay(star.twinkleDelay),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(star.opacity, {
              toValue: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
              duration: star.twinkleDuration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(star.opacity, {
              toValue: Math.random() * 0.3 + 0.2, // 0.2 to 0.5
              duration: star.twinkleDuration * 0.7,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(star.scale, {
              toValue: 1.2 + Math.random() * 0.3, // 1.2 to 1.5
              duration: star.twinkleDuration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(star.scale, {
              toValue: 1,
              duration: star.twinkleDuration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        // Random delay before next twinkle - much longer
        star.twinkleDelay = Math.random() * 15000 + 5000; // 5-20 seconds
        startTwinkle();
      });
    };

    startTwinkle();
  };

  const handleTouch = (event: any) => {
    if (!interactive) return;

    const { locationX, locationY } = event.nativeEvent;
    const newStarId = Date.now() + Math.random();
    const newAnim = new Animated.Value(0);

    const newTouchStar = {
      x: locationX,
      y: locationY,
      id: newStarId,
      anim: newAnim
    };

    setTouchStars(prev => [...prev, newTouchStar]);

    // Animate the touch star
    Animated.sequence([
      Animated.parallel([
        Animated.timing(newAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(800),
      Animated.timing(newAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Remove the touch star after animation
      setTouchStars(prev => prev.filter(star => star.id !== newStarId));
    });
  };

  useEffect(() => {
    // Initialize stars
    const starCount = densityConfig[density];
    stars.current = Array.from({ length: starCount }, (_, i) => createStar(i));

    // Start twinkling animations
    stars.current.forEach(star => {
      twinkleStar(star);
    });

    // Cleanup function
    return () => {
      stars.current.forEach(star => {
        star.opacity.stopAnimation();
        star.scale.stopAnimation();
      });
    };
  }, [density, animated]);

  const starColor = isDarkMode ? 'rgba(173, 213, 250, 0.8)' : 'rgba(59, 130, 246, 0.7)';
  const constellationLineColor = isDarkMode ? 'rgba(173, 213, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)';

  // Create constellation connections
  const renderConstellations = () => {
    if (!constellation || stars.current.length < 3) return null;

    const connections = [];
    const numConnections = Math.min(8, Math.floor(stars.current.length / 4));

    for (let i = 0; i < numConnections; i++) {
      const star1 = stars.current[Math.floor(Math.random() * stars.current.length)];
      const star2 = stars.current[Math.floor(Math.random() * stars.current.length)];
      
      if (star1.id !== star2.id) {
        const distance = Math.sqrt(Math.pow(star2.x - star1.x, 2) + Math.pow(star2.y - star1.y, 2));
        
        // Only connect stars that are reasonably close
        if (distance < 150) {
          const angle = Math.atan2(star2.y - star1.y, star2.x - star1.x);
          const midX = (star1.x + star2.x) / 2;
          const midY = (star1.y + star2.y) / 2;

          connections.push(
            <View
              key={`constellation-${star1.id}-${star2.id}`}
              style={[
                styles.constellationLine,
                {
                  position: 'absolute',
                  left: midX - distance / 2,
                  top: midY - 0.5,
                  width: distance,
                  height: 1,
                  backgroundColor: constellationLineColor,
                  transform: [{ rotate: `${angle}rad` }],
                },
              ]}
            />
          );
        }
      }
    }

    return connections;
  };

  return (
    <View 
      style={styles.container}
      onTouchStart={handleTouch}
    >
      {/* Background stars */}
      {stars.current.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              opacity: star.opacity,
              transform: [{ scale: star.scale }],
            },
          ]}
        >
          <View
            style={[
              styles.starPoint,
              {
                width: star.size,
                height: star.size,
                backgroundColor: starColor,
                shadowColor: starColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: star.size * 0.5,
              },
            ]}
          />
        </Animated.View>
      ))}

      {/* Constellation lines */}
      {constellation && renderConstellations()}

      {/* Interactive touch stars */}
      {touchStars.map((touchStar) => (
        <Animated.View
          key={touchStar.id}
          style={[
            styles.touchStar,
            {
              left: touchStar.x - 8,
              top: touchStar.y - 8,
              opacity: touchStar.anim,
              transform: [
                {
                  scale: touchStar.anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.5, 0.8],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.touchStarRing, { borderColor: starColor }]} />
          <View style={[styles.touchStarCore, { backgroundColor: starColor }]} />
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
    zIndex: 1,
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
  },
  starPoint: {
    borderRadius: 1,
  },
  constellationLine: {
    opacity: 0.6,
  },
  touchStar: {
    position: 'absolute',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchStarRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  touchStarCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});