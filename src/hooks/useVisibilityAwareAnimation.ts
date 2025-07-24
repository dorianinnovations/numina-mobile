import { useEffect, useRef } from 'react';
import { Animated, AppState, AppStateStatus } from 'react-native';
import AppStateManager from '../services/appStateManager';

interface UseVisibilityAwareAnimationOptions {
  animationId: string;
  shouldPause?: boolean;
}

/**
 * Hook to create animations that automatically pause when app goes to background
 * or component becomes invisible
 */
export const useVisibilityAwareAnimation = (
  initialValue: number = 0,
  options: UseVisibilityAwareAnimationOptions
) => {
  const animation = useRef(new Animated.Value(initialValue)).current;
  const currentAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isPausedRef = useRef(false);
  
  useEffect(() => {
    const appStateManager = AppStateManager.getInstance();
    
    // Handle app state changes
    const unsubscribe = appStateManager.addListener((state: AppStateStatus) => {
      if (state === 'background' && currentAnimationRef.current && !isPausedRef.current) {
        // Pause animation
        currentAnimationRef.current.stop();
        isPausedRef.current = true;
      } else if (state === 'active' && isPausedRef.current && options.shouldPause !== false) {
        // Resume animation
        isPausedRef.current = false;
        // Animation will be restarted by the component
      }
    });
    
    return () => {
      unsubscribe();
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop();
      }
    };
  }, [options.animationId, options.shouldPause]);
  
  // Wrapper for Animated.loop to track the animation
  const loop = (animation: Animated.CompositeAnimation) => {
    const loopAnimation = Animated.loop(animation);
    currentAnimationRef.current = loopAnimation;
    
    // Register with app state manager
    const appStateManager = AppStateManager.getInstance();
    appStateManager.registerPausableAnimation(options.animationId, loopAnimation);
    
    return loopAnimation;
  };
  
  // Wrapper for other animation types
  const track = (animation: Animated.CompositeAnimation) => {
    currentAnimationRef.current = animation;
    return animation;
  };
  
  return {
    value: animation,
    loop,
    track,
    isPaused: isPausedRef.current,
  };
};

/**
 * Hook to stop animations when component is not visible
 */
export const useComponentVisibility = (
  isVisible: boolean,
  animationCleanup?: () => void
) => {
  const wasVisibleRef = useRef(isVisible);
  
  useEffect(() => {
    if (!isVisible && wasVisibleRef.current) {
      // Component became invisible - stop animations
      if (animationCleanup) {
        animationCleanup();
      }
    }
    
    wasVisibleRef.current = isVisible;
  }, [isVisible, animationCleanup]);
  
  return isVisible;
};