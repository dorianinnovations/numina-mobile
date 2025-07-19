import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

interface AnimatedHamburgerProps {
  isOpen: boolean;
  color: string;
  size?: number;
}

export const AnimatedHamburger: React.FC<AnimatedHamburgerProps> = ({ 
  isOpen, 
  color, 
  size = 16 
}) => {
  // Core animations
  const topBarAnim = useRef(new Animated.Value(0)).current;
  const middleBarOpacity = useRef(new Animated.Value(1)).current;
  const middleBarScale = useRef(new Animated.Value(1)).current;
  const bottomBarAnim = useRef(new Animated.Value(0)).current;
  
  // Animations
  const containerRotation = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const particleScale = useRef(new Animated.Value(0)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const perspectiveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      // Opening animation sequence
      Animated.parallel([
        // Core transformation
        Animated.sequence([
          Animated.timing(containerScale, {
            toValue: 1.2,
            duration: 150,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.spring(containerScale, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
        
        // Rotation with wobble
        Animated.sequence([
          Animated.timing(containerRotation, {
            toValue: 1,
            duration: 400,
            easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
            useNativeDriver: true,
          }),
          Animated.spring(wobbleAnim, {
            toValue: 1,
            friction: 2,
            tension: 180,
            useNativeDriver: true,
          }),
        ]),
        
        // 3D perspective effect
        Animated.timing(perspectiveAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        
        // Top bar animation
        Animated.timing(topBarAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
          useNativeDriver: true,
        }),
        
        // Middle bar effects
        Animated.parallel([
          Animated.timing(middleBarOpacity, {
            toValue: 0,
            duration: 150,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(middleBarScale, {
              toValue: 1.5,
              duration: 150,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(middleBarScale, {
              toValue: 0,
              duration: 150,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
        
        // Bottom bar animation
        Animated.timing(bottomBarAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
          useNativeDriver: true,
        }),
        
        // Glow effect
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.8,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        
        // Particle burst effect
        Animated.sequence([
          Animated.spring(particleScale, {
            toValue: 1.5,
            friction: 2,
            tension: 200,
            useNativeDriver: true,
          }),
          Animated.timing(particleScale, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Closing animation sequence
      Animated.parallel([
        Animated.spring(containerScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        
        Animated.timing(containerRotation, {
          toValue: 0,
          duration: 350,
          easing: Easing.bezier(0.68, -0.6, 0.32, 1.6),
          useNativeDriver: true,
        }),
        
        Animated.timing(perspectiveAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        
        Animated.spring(wobbleAnim, {
          toValue: 0,
          friction: 3,
          tension: 100,
          useNativeDriver: true,
        }),
        
        Animated.timing(topBarAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
          useNativeDriver: true,
        }),
        
        Animated.parallel([
          Animated.timing(middleBarOpacity, {
            toValue: 1,
            duration: 350,
            delay: 100,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(middleBarScale, {
            toValue: 1,
            friction: 4,
            tension: 100,
            delay: 100,
            useNativeDriver: true,
          }),
        ]),
        
        Animated.timing(bottomBarAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.175, 0.885, 0.32, 1.275),
          useNativeDriver: true,
        }),
        
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        
        Animated.timing(particleScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const barHeight = size * 0.125;
  const barSpacing = size * 0.25;

  // Interpolations
  const topBarTransform = topBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, barSpacing],
  });

  const topBarRotation = topBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const bottomBarTransform = bottomBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -barSpacing],
  });

  const bottomBarRotation = bottomBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-45deg'],
  });

  const containerRotationDeg = containerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const wobbleRotation = wobbleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-10deg', '0deg'],
  });

  const perspectiveRotateX = perspectiveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '25deg', '0deg'],
  });

  return (
    <View style={styles.wrapper}>
     

      
      {/* Main hamburger container */}
      <Animated.View 
        style={[
          styles.container, 
          { 
            width: size, 
            height: size,
            transform: [
              { scale: containerScale },
              { rotate: containerRotationDeg },
              { rotate: wobbleRotation },
              { rotateX: perspectiveRotateX },
              { perspective: 1000 },
            ]
          }
        ]}
      >
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: barHeight,
              width: size,
              transform: [
                { translateY: topBarTransform },
                { rotate: topBarRotation },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: barHeight,
              width: size,
              marginVertical: barSpacing / 2,
              opacity: middleBarOpacity,
              transform: [
                { scaleX: middleBarScale },
                { scaleY: middleBarScale },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: color,
              height: barHeight,
              width: size,
              transform: [
                { translateY: bottomBarTransform },
                { rotate: bottomBarRotation },
              ],
            },
          ]}
        />
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
  bar: {
    borderRadius: 2,
  },
  glow: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
});