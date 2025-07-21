import React, { useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LiquidProgressProps {
  currentStep: number;
  totalSteps: number;
  liquidFlow: Animated.Value;
  liquidBubbles: Array<{
    x: Animated.Value;
    y: Animated.Value;
    scale: Animated.Value;
    opacity: Animated.Value;
  }>;
  liquidWave: Animated.Value;
  liquidShimmer: Animated.Value;
}

export const LiquidProgress: React.FC<LiquidProgressProps> = ({
  currentStep,
  totalSteps,
  liquidFlow,
  liquidBubbles,
  liquidWave,
  liquidShimmer,
}) => {
  const { isDarkMode } = useTheme();

  // Calculate discrete step positions
  const stepPositions = Array.from({ length: totalSteps }, (_, i) => (i / (totalSteps - 1)) * 100);
  const currentProgress = (currentStep / (totalSteps - 1)) * 100;

  return (
    <View style={styles.liquidProgressContainer}>
      {/* Step Markers */}
      <View style={styles.stepMarkersContainer}>
        {stepPositions.map((position, index) => (
          <View
            key={index}
            style={[
              styles.stepMarker,
              {
                left: `${position}%`,
                backgroundColor: index <= currentStep 
                  ? (isDarkMode ? '#add5fa' : '#3b82f6')
                  : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
              }
            ]}
          />
        ))}
      </View>
      
      {/* Main Progress Bar */}
      <View style={[
        styles.liquidBar,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderColor: isDarkMode ? 'rgba(173,213,250,0.3)' : 'rgba(59,130,246,0.3)',
        }
      ]}>
        {/* Liquid Fill */}
        <Animated.View
          style={[
            styles.liquidFill,
            {
              backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
              width: `${currentProgress}%`,
            },
          ]}
        >
          {/* Liquid Wave Effect */}
          <Animated.View
            style={[
              styles.liquidWave,
              {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)',
                transform: [
                  {
                    translateX: liquidWave.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 100],
                    }),
                  },
                  {
                    scaleX: liquidWave.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.5, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          
          {/* Shimmer Effect */}
          <Animated.View
            style={[
              styles.liquidShimmer,
              {
                opacity: liquidShimmer.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.8, 0.3],
                }),
                transform: [
                  {
                    translateX: liquidShimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 150],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  liquidProgressContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginVertical: 10,
    paddingLeft: 20,
    paddingRight: 60,
  },
  liquidBar: {
    width: '85%',
    height: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  liquidFill: {
    height: '100%',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  liquidWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    borderRadius: 10,
    opacity: 0.4,
  },
  liquidShimmer: {
    position: 'absolute',
    top: 0,
    left: -25,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    transform: [{ skewX: '-20deg' }],
  },
  stepMarkersContainer: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 16,
    width: '85%',
  },
  stepMarker: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: 6,
    transform: [{ translateX: -2 }],
  },
});