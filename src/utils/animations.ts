import { Animated, Easing, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export class NuminaAnimations {
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

    if (elevationAnim) {
      animations.push(
        Animated.timing(elevationAnim, {
          toValue: 0.3,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
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

  static buttonPress(
    scaleAnim: Animated.Value,
    hapticType: 'light' | 'medium' | 'heavy' = 'light',
    callback?: () => void
  ) {
    return this.neumorphicPress(scaleAnim, undefined, hapticType, callback);
  }

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

    animatedSequence.forEach(animate => animate());
  }
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
          useNativeDriver: false,
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
        useNativeDriver: false,
      })
    );

    Animated.parallel(animations).start(callback);
  }

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

export const NuminaEasing = {
  smooth: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  snappy: Easing.bezier(0.25, 0.1, 0.25, 1),
  gentle: Easing.bezier(0.16, 1, 0.3, 1),
  neumorphicBounce: Easing.elastic(1.05),
  neumorphicEntrance: Easing.out(Easing.back(1.2)),
  neumorphicPress: Easing.bezier(0.4, 0, 0.2, 1),
  neumorphicRelease: Easing.bezier(0, 0, 0.2, 1),
  bouncy: Easing.elastic(1.2),
  entrance: Easing.out(Easing.back(1.5)),
  exit: Easing.in(Easing.quad),
};

export const ScreenTransitions = {
  snapInRight: (value: Animated.Value, callback?: () => void) => {
    value.setValue(50);
    Animated.timing(value, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
      easing: Easing.bezier(0.2, 0, 0, 1),
    }).start(callback);
  },

  snapInLeft: (value: Animated.Value, callback?: () => void) => {
    value.setValue(-50);
    Animated.timing(value, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
      easing: Easing.bezier(0.2, 0, 0, 1),
    }).start(callback);
  },

  snapOutLeft: (value: Animated.Value, callback?: () => void) => {
    Animated.timing(value, {
      toValue: -50,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 1, 1),
    }).start(callback);
  },

  snapOutRight: (value: Animated.Value, callback?: () => void) => {
    Animated.timing(value, {
      toValue: 50,
      duration: 120,
      useNativeDriver: true,
      easing: Easing.bezier(0.4, 0, 1, 1),
    }).start(callback);
  },

  instantFade: (value: Animated.Value, scaleValue: Animated.Value, callback?: () => void) => {
    value.setValue(0);
    scaleValue.setValue(0.98);
    Animated.parallel([
      Animated.timing(value, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start(callback);
  },

  instantFadeOut: (value: Animated.Value, scaleValue: Animated.Value, callback?: () => void) => {
    Animated.parallel([
      Animated.timing(value, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(callback);
  },

  immediate: (callback?: () => void) => {
    if (callback) callback();
  },

  matrixFadeIn: (value: Animated.Value, callback?: () => void) => {
    value.setValue(0);
    Animated.timing(value, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }).start(callback);
  },

  quickExit: (value: Animated.Value, callback: () => void) => {
    Animated.timing(value, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.in(Easing.quad),
    }).start(callback);
  },
  slideInRight: (value: Animated.Value, callback?: () => void) => {
    ScreenTransitions.snapInRight(value, callback);
  },
  slideInLeft: (value: Animated.Value, callback?: () => void) => {
    ScreenTransitions.snapInLeft(value, callback);
  },
  slideOutLeft: (value: Animated.Value, callback?: () => void) => {
    ScreenTransitions.snapOutLeft(value, callback);
  },
  slideOutRight: (value: Animated.Value, callback?: () => void) => {
    ScreenTransitions.snapOutRight(value, callback);
  },
  fadeInScale: (value: Animated.Value, scaleValue: Animated.Value, callback?: () => void) => {
    ScreenTransitions.instantFade(value, scaleValue, callback);
  },
  fadeOutScale: (value: Animated.Value, scaleValue: Animated.Value, callback?: () => void) => {
    ScreenTransitions.instantFadeOut(value, scaleValue, callback);
  },
};

export default NuminaAnimations;