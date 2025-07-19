import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedLightBeam } from './AnimatedLightBeam';
import { LightRefractionBorder } from './LightRefractionBorder';
import { TravelingLightSpot } from './TravelingLightSpot';
import { TravelingBorderLight } from './TravelingBorderLight';
import { PseudoBorderAnimation } from './PseudoBorderAnimation';
import { TruePseudoBorder } from './TruePseudoBorder';
import { AnimatedGradientBorder } from './AnimatedGradientBorder';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from './PageBackground';

/**
 * Example usage of the AnimatedLightBeam component
 * This shows how to integrate the light beam effect with any component
 */
export const AnimatedLightBeamExample: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate a refresh operation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 3000);
  };

  return (
    <PageBackground>
      <View style={styles.container}>
      {/* Perfect Animated Border Button */}
      <AnimatedGradientBorder
        isActive={isRefreshing}
        borderRadius={30}
        borderWidth={1}
        animationSpeed={3500}
        style={styles.perfectButton}
      >
        <View style={[
          styles.buttonContent,
          {
            backgroundColor: 'transparent',
          }
        ]}>
          <Text style={styles.buttonText}>
            Free to try. No credit card required
          </Text>
        </View>
      </AnimatedGradientBorder>

      {/* Control button */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isDarkMode ? '#6ec5ff' : '#4a90e2',
          }
        ]}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        <Text style={styles.buttonText}>
          {isRefreshing ? 'Refreshing...' : 'Start Refresh Animation'}
        </Text>
      </TouchableOpacity>

      <Text style={[
        styles.instructions,
        { color: isDarkMode ? '#888888' : '#666666' }
      ]}>
        Perfect animated gradient border using CSS pseudo-element technique. The thin border creates that premium, modern feel.
      </Text>
      </View>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  perfectButton: {
    alignSelf: 'center',
  },
  buttonContent: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 20,
    paddingHorizontal: 20,
  },
});