import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AnimatedConversationsIconProps {
  color: string;
  size?: number;
  isPressed?: boolean;
}

export const AnimatedConversationsIcon: React.FC<AnimatedConversationsIconProps> = ({ 
  color, 
  size = 16,
  isPressed = false
}) => {
  // Just a wiggle
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPressed) {
      // Simple wiggle animation
      Animated.sequence([
        Animated.timing(wiggle, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: -1,
          duration: 80,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 0.5,
          duration: 60,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(wiggle, {
          toValue: 0,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset
      Animated.timing(wiggle, { toValue: 0, duration: 0, useNativeDriver: true }).start();
    }
  }, [isPressed]);

  // Wiggle rotation
  const wiggleRotation = wiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Just the wiggling icon */}
      <Animated.View 
        style={[
          styles.container, 
          { 
            width: size, 
            height: size,
            transform: [
              { rotate: wiggleRotation },
            ]
          }
        ]}
      >
        <MaterialCommunityIcons
          name="forum-outline"
          size={size}
          color={color}
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
});