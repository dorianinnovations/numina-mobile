import { Animated, Easing, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Animation utilities for mobile interface interactions
 * Provides smooth animations with haptic feedback
 */

export class NuminaAnimations {
  // Haptic feedback patterns
  static haptic = {
    light: () => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(10);
      }
    },
    medium: () => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Vibration.vibrate(20);
      }
    },
    heavy: () => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else {
        Vibration.vibrate(50);
      }
    },
    success: () => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate([100, 50, 100]);
      }
    },
    error: () => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate([200, 100, 200]);
      }
    },
    warning: () => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Vibration.vibrate([150, 75, 150]);
      }
    },
    selection: () => {
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync();
      } else {
        Vibration.vibrate(25);
      }
    },
  };

  // Enhanced neumorphic button press animation
  static neumorphicPress(
    scaleAnim: Animated.Value,
    elevationAnim?: Animated.Value,
    hapticType: 'light' | 'medium' | 'heavy' = 'light',
    callback?: () => void
  ) {
    this.haptic[hapticType]();
    
    const animations = [
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ];

    // Add elevation animation if provided (for shadow effects)
    if (elevationAnim) {
      animations.push(
        Animated.timing(elevationAnim, {
          toValue: 0.3,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false, // elevation can't use native driver
        })
      );
    }
    
    Animated.parallel(animations).start(() => {
      const releaseAnimations = [
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.elastic(1.1),
          useNativeDriver: true,
        }),
      ];

      if (elevationAnim) {
        releaseAnimations.push(
          Animated.timing(elevationAnim, {
            toValue: 1,
            duration: 150,
            easing: Easing.elastic(1.1),
            useNativeDriver: false,
          })
        );
      }

      Animated.parallel(releaseAnimations).start(callback);
    });
  }

  // Legacy button press for backward compatibility
  static buttonPress(
    scaleAnim: Animated.Value,
    hapticType: 'light' | 'medium' | 'heavy' = 'light',
    callback?: () => void
  ) {
    return this.neumorphicPress(scaleAnim, undefined, hapticType, callback);
  }

  // Enhanced fade in animation
  static fadeIn(
    animatedValue: Animated.Value,
    duration: number = 100,
    delay: number = 0,
    callback?: () => void
  ) {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(callback);
  }

  // Enhanced slide in animation
  static slideIn(
    animatedValue: Animated.Value,
    fromValue: number = 50,
    duration: number = 60,
    delay: number = 0,
    callback?: () => void
  ) {
    animatedValue.setValue(fromValue);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      delay,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start(callback);
  }

  // Scale in animation with bounce
  static scaleIn(
    animatedValue: Animated.Value,
    fromValue: number = 0.8,
    duration: number = 100,
    delay: number = 0,
    callback?: () => void
  ) {
    animatedValue.setValue(fromValue);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.elastic(1.1),
      useNativeDriver: true,
    }).start(callback);
  }

  // Staggered entrance animation for multiple elements
  static staggeredEntrance(
    animations: Array<{
      value: Animated.Value;
      type: 'fade' | 'slide' | 'scale';
      delay?: number;
    }>,
    staggerDelay: number = 100
  ) {
    const animatedSequence = animations.map((anim, index) => {
      const delay = (anim.delay || 0) + (index * staggerDelay);
      
      switch (anim.type) {
        case 'fade':
          return () => this.fadeIn(anim.value, 100, delay);
        case 'slide':
          return () => this.slideIn(anim.value, 30, 100, delay);
        case 'scale':
          return () => this.scaleIn(anim.value, 0.9, 100, delay);
        default:
          return () => this.fadeIn(anim.value, 100, delay);
      }
    });

    // Execute all animations
    animatedSequence.forEach(animate => animate());
  }

  // Loading shimmer animation
  static shimmer(animatedValue: Animated.Value) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  // Success animation with haptic
  static success(
    scaleAnim: Animated.Value,
    fadeAnim?: Animated.Value,
    callback?: () => void
  ) {
    this.haptic.success();
    
    const animations = [
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.elastic(1.3),
        useNativeDriver: true,
      }),
    ];

    if (fadeAnim) {
      animations.push(
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        })
      );
    }

    Animated.sequence(animations).start(callback);
  }

  // Error shake animation with haptic
  static error(
    translateX: Animated.Value,
    callback?: () => void
  ) {
    this.haptic.error();
    
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(callback);
  }

  // Floating animation for elements
  static float(animatedValue: Animated.Value, distance: number = 5) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: distance,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: -distance,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  // Neumorphic glow animation
  static neumorphicGlow(
    glowAnim: Animated.Value,
    intensity: number = 0.3,
    duration: number = 1500
  ) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: intensity,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false, // opacity changes for glow effect
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }

  // Smooth morphing transition between states
  static morphTransition(
    values: { [key: string]: Animated.Value },
    targetValues: { [key: string]: number },
    duration: number = 300,
    callback?: () => void
  ) {
    const animations = Object.keys(values).map(key => 
      Animated.timing(values[key], {
        toValue: targetValues[key],
        duration,
        easing: NuminaEasing.smooth,
        useNativeDriver: false, // for flexibility with different properties
      })
    );

    Animated.parallel(animations).start(callback);
  }

  // Pulse animation
  static pulse(animatedValue: Animated.Value, scale: number = 1.05) {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: scale,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }

  // Text streaming animation
  static typewriter(
    text: string,
    callback: (currentText: string) => void,
    speed: number = 50
  ) {
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        callback(text.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }
}

// Enhanced easing presets for neumorphic design
export const NuminaEasing = {
  // Smooth, natural easing - perfect for neumorphic transitions
  smooth: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  
  // Quick, snappy interactions
  snappy: Easing.bezier(0.25, 0.1, 0.25, 1),
  
  // Gentle, elegant motion
  gentle: Easing.bezier(0.16, 1, 0.3, 1),
  
  // Subtle bounce for neumorphic elements
  neumorphicBounce: Easing.elastic(1.05),
  
  // Soft entrance animation
  neumorphicEntrance: Easing.out(Easing.back(1.2)),
  
  // Natural press feeling
  neumorphicPress: Easing.bezier(0.4, 0, 0.2, 1),
  
  // Soft release feeling
  neumorphicRelease: Easing.bezier(0, 0, 0.2, 1),
  
  // Legacy easing (keeping for compatibility)
  bouncy: Easing.elastic(1.2),
  entrance: Easing.out(Easing.back(1.5)),
  exit: Easing.in(Easing.quad),
};

// Screen transition animations
export const ScreenTransitions = {
  // Slide in from right (forward navigation)
  slideInRight: (value: Animated.Value, callback?: () => void) => {
    value.setValue(100);
    Animated.timing(value, {
      toValue: 0,
      duration: 60,
      useNativeDriver: true,
      easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    }).start(callback);
  },

  // Slide in from left (back navigation)
  slideInLeft: (value: Animated.Value, callback?: () => void) => {
    value.setValue(-100);
    Animated.timing(value, {
      toValue: 0,
      duration: 60,
      useNativeDriver: true,
      easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    }).start(callback);
  },

  // Slide out to left (forward navigation)
  slideOutLeft: (value: Animated.Value, callback?: () => void) => {
    Animated.timing(value, {
      toValue: -100,
      duration: 60,
      useNativeDriver: true,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    }).start(callback);
  },

  // Slide out to right (back navigation)
  slideOutRight: (value: Animated.Value, callback?: () => void) => {
    Animated.timing(value, {
      toValue: 100,
      duration: 30,
      useNativeDriver: true,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    }).start(callback);
  },

  // Fade in with scale
  fadeInScale: (value: Animated.Value, scaleValue: Animated.Value, callback?: () => void) => {
    value.setValue(0);
    scaleValue.setValue(0.9);
    Animated.parallel([
      Animated.timing(value, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      }),
    ]).start(callback);
  },

  // Fade out with scale
  fadeOutScale: (value: Animated.Value, scaleValue: Animated.Value, callback?: () => void) => {
    Animated.parallel([
      Animated.timing(value, {
        toValue: 0,
        duration: 62,
        useNativeDriver: true,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      }),
      Animated.timing(scaleValue, {
        toValue: 0.9,
        duration: 62,
        useNativeDriver: true,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      }),
    ]).start(callback);
  },

  // Staggered entrance for multiple elements
  staggeredEntrance: (elements: Array<{ value: Animated.Value; delay: number }>, staggerDelay: number = 60) => {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.value.setValue(0);
        Animated.timing(element.value, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
          easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        }).start();
      }, element.delay + (index * staggerDelay));
    });
  },

  // Exit animation with callback
  exitWithCallback: (value: Animated.Value, callback: () => void) => {
    Animated.timing(value, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    }).start(callback);
  },
};

export default NuminaAnimations;