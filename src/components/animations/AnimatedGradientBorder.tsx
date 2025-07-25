/**
 * 🔥 AnimatedGradientBorder - The ULTIMATE React Native Animated Border Component
 * 
 * The definitive solution for animated gradient borders in React Native.
 * Born from the debugging trenches and battle-tested in production.
 * 
 * Features:
 * ✅ Smooth perimeter traveling spotlight effect
 * ✅ Proper clipping masks for perfect border isolation
 * ✅ Color matching with parent backgrounds
 * ✅ TypeScript support with full type safety
 * ✅ Dark mode compatible
 * ✅ Performance optimized for 60fps
 * ✅ Production ready
 * 
 * Usage:
 * ```tsx
 * <AnimatedGradientBorder
 *   isActive={isRefreshing}
 *   borderRadius={12}
 *   borderWidth={1}
 *   animationSpeed={4000}
 * >
 *   <YourContent />
 * </AnimatedGradientBorder>
 * ```
 * 
 * @version 1.0.0
 * @author Numina AI Team
 * @license MIT
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ViewStyle, 
  View, 
  Animated, 
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useBorderTheme } from '../../contexts/BorderThemeContext';
import { useBorderSettings } from '../../contexts/BorderSettingsContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnimatedGradientBorderProps {
  /** Controls whether the animation is active */
  isActive: boolean;
  
  /** Border radius for the container */
  borderRadius?: number;
  
  /** Thickness of the animated border */
  borderWidth?: number;
  
  /** Animation speed in milliseconds (default: 4000ms) */
  animationSpeed?: number;
  
  /** Custom gradient colors for the spotlight */
  gradientColors?: string[];
  
  /** Background color override (auto-detects dark mode if not provided) */
  backgroundColor?: string;
  
  /** The content to render inside the border */
  children: React.ReactNode;
  
  /** Additional container styles */
  style?: ViewStyle;
  
  /** Debug mode - logs animation state (default: false) */
  debug?: boolean;
  
  /** Animation direction */
  direction?: 'clockwise' | 'counterclockwise';
  
  /** Animation speed (1=slow, 2=medium, 3=fast) */
  speed?: 1 | 2 | 3;
  
  /** Animation variation style */
  variation?: 'smooth' | 'pulse' | 'wave';
  
  /** Enable/disable border effects (uses settings if not provided) */
  effectsEnabled?: boolean;
  
  /** Brightness level 0-100 (uses settings if not provided) */
  brightness?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AnimatedGradientBorderComponent: React.FC<AnimatedGradientBorderProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 1,
  animationSpeed = 4000,
  gradientColors,
  backgroundColor,
  children,
  style,
  debug = false,
  direction = 'clockwise',
  speed = 2,
  variation = 'smooth',
  effectsEnabled,
  brightness,
}) => {
  const { isDarkMode, theme } = useTheme();
  const { selectedTheme } = useBorderTheme();
  const { 
    effectsEnabled: settingsEffectsEnabled, 
    brightness: settingsBrightness, 
    speed: settingsSpeed,
    direction: settingsDirection,
    variation: settingsVariation,
    loading: settingsLoading 
  } = useBorderSettings();
  
  // Wait for settings to load before determining final values
  // If still loading, use defaults to prevent flickering
  const finalEffectsEnabled = settingsLoading 
    ? (effectsEnabled !== undefined ? effectsEnabled : true)
    : (effectsEnabled !== undefined ? effectsEnabled : settingsEffectsEnabled);
    
  const finalBrightness = settingsLoading 
    ? (brightness !== undefined ? brightness : 80)
    : (brightness !== undefined ? brightness : settingsBrightness);
    
  const finalSpeed = settingsLoading 
    ? (speed !== undefined ? speed : 2)
    : (speed !== undefined ? speed : settingsSpeed);
    
  const finalDirection = settingsLoading 
    ? (direction !== undefined ? direction : 'clockwise')
    : (direction !== undefined ? direction : settingsDirection);
    
  const finalVariation = settingsLoading 
    ? (variation !== undefined ? variation : 'smooth')
    : (variation !== undefined ? variation : settingsVariation);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE AND REFS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // Debug logging moved after state declarations to fix scoping issues

  // Animation values - use refs to prevent recreation on re-renders
  const progress = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Animation cleanup refs
  const travelAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const opacityAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════════
  // CALCULATED VALUES
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize expensive calculations
  const spotlightSize = useMemo(() => 
    Math.max(120, Math.max(width, height) * 0.3),
    [width, height]
  );
  
  const brightnessMultiplier = useMemo(() => 
    Math.max(0.1, Math.min(1.0, finalBrightness / 100)),
    [finalBrightness]
  );
  
  const adjustedOpacity = useMemo(() => {
    const baseOpacity = isDarkMode ? 0.8 : 0.7;
    return baseOpacity * brightnessMultiplier;
  }, [isDarkMode, brightnessMultiplier]);
  
  const computedGradientColors = useMemo(() => {
    const primary = gradientColors?.[0] || (isDarkMode 
      ? `rgba(88, 183, 255, ${adjustedOpacity})` // Bright Cyan - ELECTRIC!
      : `rgba(59, 130, 246, ${adjustedOpacity})`); // Blue for light mode
    const secondary = gradientColors?.[1] || (isDarkMode 
      ? `rgba(138, 43, 226, ${adjustedOpacity * 0.75})` // Electric Purple - VIBRANT!
      : `rgba(99, 102, 241, ${adjustedOpacity * 0.75})`); // Indigo for light mode
    return [primary, secondary];
  }, [gradientColors, isDarkMode, adjustedOpacity]);
  
  const finalBackgroundColor = useMemo(() => 
    backgroundColor || (isDarkMode ? 'rgb(9, 9, 9)' : theme.colors.background),
    [backgroundColor, isDarkMode, theme.colors.background]
  );
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // ANIMATION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize animation configuration to prevent recalculation
  const animationConfig = useMemo(() => {
    const speedMultiplier = finalSpeed === 1 ? 1.5 : finalSpeed === 2 ? 1 : 0.6;
    const finalDuration = animationSpeed * speedMultiplier;
    const easing = finalVariation === 'smooth' ? Easing.linear :
                  finalVariation === 'pulse' ? Easing.inOut(Easing.sin) :
                  Easing.bezier(0.25, 0.46, 0.45, 0.94); // wave
    return { finalDuration, easing };
  }, [animationSpeed, finalSpeed, finalVariation]);

  useEffect(() => {
    if (debug) {
      //   isActive,
      //   width,
      //   height,
      //   spotlightSize,
      //   finalBackgroundColor,
      //   isDarkMode,
      //   translateXRange: [-60, width - 60],
      //   translateYRange: [-60, height - 60],
      // });
    }
    
    // Check if component is active and effects are enabled
    // Also ensure settings have loaded to prevent premature animation start
    if (isActive && finalEffectsEnabled && width > 0 && height > 0) {
      // Cleanup function to stop all animations
      const cleanup = () => {
        if (travelAnimationRef.current) {
          travelAnimationRef.current.stop();
          travelAnimationRef.current = null;
        }
        if (opacityAnimationRef.current) {
          opacityAnimationRef.current.stop();
          opacityAnimationRef.current = null;
        }
        progress.stopAnimation();
      };

      // Start opacity fade-in
      opacityAnimationRef.current = Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      opacityAnimationRef.current.start();

      // Start perimeter traveling animation using memoized config
      travelAnimationRef.current = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: animationConfig.finalDuration,
          easing: animationConfig.easing,
          useNativeDriver: false,
        })
      );
      
      travelAnimationRef.current.start();

      return cleanup;
    } else {
      // Stop animations when not active
      if (travelAnimationRef.current) {
        travelAnimationRef.current.stop();
        travelAnimationRef.current = null;
      }
      if (opacityAnimationRef.current) {
        opacityAnimationRef.current.stop();
      }
      
      progress.stopAnimation();
      opacityAnimationRef.current = Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      });
      opacityAnimationRef.current.start(() => {
        progress.setValue(0);
      });
    }
  }, [isActive, finalEffectsEnabled, width, height, animationConfig, debug]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERIMETER PATH CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize perimeter path calculations
  const pathCoordinates = useMemo(() => {
    const clockwiseX = [
      -60,                    // Start: left of container (spotlight extends beyond)
      width - 60,             // Top edge moving right
      width - 60,             // Right edge moving down  
      -60,                    // Bottom edge moving left
      -60                     // Back to start
    ];
    const clockwiseY = [
      -60,                    // Start: top of container (spotlight extends beyond)
      -60,                    // Top edge
      height - 60,            // Right edge moving down
      height - 60,            // Bottom edge
      -60                     // Back to top  
    ];
    
    // Reverse for counterclockwise
    const counterclockwiseX = [
      -60,                    // Start: left of container
      -60,                    // Left edge moving down
      width - 60,             // Bottom edge moving right
      width - 60,             // Right edge moving up
      -60                     // Back to start
    ];
    const counterclockwiseY = [
      -60,                    // Start: top of container
      height - 60,            // Left edge moving down
      height - 60,            // Bottom edge moving right
      -60,                    // Right edge moving up
      -60                     // Back to start
    ];

    return {
      xRange: finalDirection === 'clockwise' ? clockwiseX : counterclockwiseX,
      yRange: finalDirection === 'clockwise' ? clockwiseY : counterclockwiseY,
    };
  }, [width, height, finalDirection]);

  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: pathCoordinates.xRange,
  });

  const translateY = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: pathCoordinates.yRange,
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYOUT HANDLER
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize layout handler to prevent unnecessary re-renders
  const onLayout = useCallback((event: any) => {
    const { width: newWidth, height: newHeight } = event.nativeEvent.layout;
    setWidth(newWidth);
    setHeight(newHeight);
    
    if (debug) {
    }
  }, [debug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (travelAnimationRef.current) {
        travelAnimationRef.current.stop();
        travelAnimationRef.current = null;
      }
      if (opacityAnimationRef.current) {
        opacityAnimationRef.current.stop();
        opacityAnimationRef.current = null;
      }
      progress.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <View 
      style={[style, { position: 'relative', backgroundColor: 'transparent' }]} 
      onLayout={onLayout}
    >
      {/* 🎯 THE MAGIC: Border container with clipping mask */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius,
          borderWidth: finalEffectsEnabled ? 0 : borderWidth,
          borderColor: finalEffectsEnabled ? 'transparent' : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)'),
          overflow: 'hidden', // 🔑 THIS IS THE BREAKTHROUGH - clips everything to border shape
        }}
      >
        {/* Background layer for the traveling spotlight */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
          }}
        >
          {/* 💫 The traveling spotlight that creates the border effect */}
          {isActive && finalEffectsEnabled && width > 0 && height > 0 && (
            <Animated.View
              style={{
                position: 'absolute',
                width: spotlightSize,
                height: spotlightSize,
                opacity: opacityAnim,
                transform: [
                  { translateX },
                  { translateY },
                ],
              }}
            >
              <LinearGradient
                colors={(() => {
                  if (computedGradientColors && computedGradientColors.length > 0) {
                    return computedGradientColors;
                  }
                  if (selectedTheme && selectedTheme.colors && Array.isArray(selectedTheme.colors)) {
                    return selectedTheme.colors;
                  }
                  // Safe fallback colors
                  return ['rgba(88, 183, 255, 0.8)', 'rgba(138, 43, 226, 0.6)', 'transparent'];
                })()}
                style={{
                  width: spotlightSize,
                  height: spotlightSize,
                  borderRadius: spotlightSize / 2,
                }}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          )}
        </View>
        
        {/* 🎭 Inner content area that blocks the center (creates the border "window") */}
        <View
          style={{
            position: 'absolute',
            top: borderWidth + 1,
            left: borderWidth + 1,
            right: borderWidth + 1,
            bottom: borderWidth + 1,
            backgroundColor: finalBackgroundColor,
            borderRadius: Math.max(0, borderRadius - borderWidth - 1),
          }}
        />
      </View>
      
      {/* 📱 Content container (your actual content sits here) */}
      <View style={{
        position: 'relative',
        zIndex: 10,
        margin: borderWidth - 0.5,
        borderRadius: Math.max(0, borderRadius - borderWidth + 0.5),
        minHeight: 50,
        backgroundColor: 'transparent',
        padding: 8,
      }}>
        {children}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZED EXPORT FOR PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const AnimatedGradientBorder = React.memo(AnimatedGradientBorderComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.borderWidth === nextProps.borderWidth &&
    prevProps.animationSpeed === nextProps.animationSpeed &&
    prevProps.direction === nextProps.direction &&
    prevProps.speed === nextProps.speed &&
    prevProps.variation === nextProps.variation &&
    prevProps.effectsEnabled === nextProps.effectsEnabled &&
    prevProps.brightness === nextProps.brightness &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    JSON.stringify(prevProps.gradientColors) === JSON.stringify(nextProps.gradientColors)
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/** @deprecated Use AnimatedGradientBorder instead */
export const ShimmerBorder = AnimatedGradientBorder;

export default AnimatedGradientBorder;

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES (FOR DOCUMENTATION)
// ═══════════════════════════════════════════════════════════════════════════════

/*
// 🔥 BASIC USAGE
<AnimatedGradientBorder isActive={isLoading}>
  <MyComponent />
</AnimatedGradientBorder>

// 🎨 CUSTOM STYLING
<AnimatedGradientBorder
  isActive={isActive}
  borderRadius={16}
  borderWidth={2}
  animationSpeed={3000}
  gradientColors={['rgba(255, 0, 0, 0.8)', 'transparent']}
  backgroundColor="rgb(20, 20, 20)"
>
  <MyContent />
</AnimatedGradientBorder>

// 🐛 DEBUG MODE
<AnimatedGradientBorder 
  isActive={true} 
  debug={true}
>
  <MyComponent />
</AnimatedGradientBorder>
*/