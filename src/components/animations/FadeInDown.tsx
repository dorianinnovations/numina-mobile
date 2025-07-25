import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface FadeInDownProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
}

const FadeInDown: React.FC<FadeInDownProps> = ({ 
  children, 
  delay = 0, 
  duration = 500, 
  distance = -15 
}) => {
  // Set up animated values. Start with opacity 0 and slightly above normal position.
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(distance)).current;

  // Run the animation when the component mounts
  useEffect(() => {
    const animation = Animated.parallel([
      // Animate opacity from 0 to 1
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: duration, // Animation speed in milliseconds
        delay: delay,
        useNativeDriver: true, // Use the native thread for smoother animations
      }),
      // Animate position from distance to 0
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: duration * 0.6, // Slightly faster movement
        delay: delay,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    // Cleanup function
    return () => {
      animation.stop();
    };
  }, [delay, duration, distance]);

  return (
    <Animated.View
      style={{
        opacity: opacityAnim, // Bind opacity to the animated value
        transform: [{ translateY: translateYAnim }], // Bind transform to the animated value
      }}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInDown;