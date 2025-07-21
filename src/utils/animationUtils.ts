/**
 * Animation Safety Utilities
 * Provides robust error handling for React Native animation operations
 */

import { Animated } from 'react-native';

/**
 * Safely stops an animation with comprehensive error handling
 */
export const safeStopAnimation = (animValue: Animated.Value | Animated.ValueXY): void => {
  try {
    if (animValue && typeof animValue.stopAnimation === 'function') {
      animValue.stopAnimation();
    }
  } catch (error) {
    // Silently handle animation stop errors - these are usually race conditions
    if (__DEV__) {
      console.warn('Animation stop error (non-critical):', error);
    }
  }
};

/**
 * Safely sets an animation value with error handling
 */
export function safeSetValue(animValue: Animated.Value, value: number): void;
export function safeSetValue(animValue: Animated.ValueXY, value: { x: number; y: number }): void;
export function safeSetValue(animValue: Animated.Value | Animated.ValueXY, value: number | { x: number; y: number }): void {
  try {
    if (animValue && typeof animValue.setValue === 'function') {
      (animValue as any).setValue(value);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Animation setValue error (non-critical):', error);
    }
  }
}

/**
 * Safely resets an animation value to its initial state
 */
export function safeResetAnimation(animValue: Animated.Value, initialValue?: number): void;
export function safeResetAnimation(animValue: Animated.ValueXY, initialValue?: { x: number; y: number }): void;
export function safeResetAnimation(animValue: Animated.Value | Animated.ValueXY, initialValue?: number | { x: number; y: number }): void {
  try {
    safeStopAnimation(animValue);
    if (animValue instanceof Animated.ValueXY) {
      const defaultValue = initialValue as { x: number; y: number } | undefined || { x: 0, y: 0 };
      safeSetValue(animValue, defaultValue);
    } else {
      const defaultValue = initialValue as number | undefined || 0;
      safeSetValue(animValue as Animated.Value, defaultValue);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Animation reset error (non-critical):', error);
    }
  }
}

/**
 * Safely executes an animation with error handling
 */
export const safeStartAnimation = (animation: Animated.CompositeAnimation, callback?: () => void): void => {
  try {
    animation.start((finished) => {
      if (finished && callback) {
        callback();
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('Animation start error (non-critical):', error);
    }
    // Execute callback anyway to prevent UI state inconsistencies
    if (callback) {
      callback();
    }
  }
};

/**
 * Creates a safe cleanup function for animations
 */
export const createAnimationCleanup = (...animValues: (Animated.Value | Animated.ValueXY)[]): (() => void) => {
  return () => {
    animValues.forEach(animValue => {
      safeStopAnimation(animValue);
    });
  };
};

/**
 * Safely executes multiple animation operations in parallel
 */
export const safeParallelAnimations = (animations: Animated.CompositeAnimation[], callback?: () => void): void => {
  try {
    Animated.parallel(animations).start((finished) => {
      if (finished && callback) {
        callback();
      }
    });
  } catch (error) {
    if (__DEV__) {
      console.warn('Parallel animation error (non-critical):', error);
    }
    if (callback) {
      callback();
    }
  }
};