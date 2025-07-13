import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: any;
  useOrb?: boolean;
}

/**
 * Gradient Background Component
 * Provides beautiful gradient backgrounds for light mode
 * Pure OLED black with mint orb backdrop for dark mode
 */
export const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  style, 
  useOrb = false 
}) => {
  const { isDarkMode } = useTheme();

  if (useOrb) {
    // Use dark background for chat screens
    if (isDarkMode) {
      return (
        <LinearGradient
          colors={[
            '#1a1a1a', // Darker than button color (#2a2a2a)
            '#161616', // Even darker for depth
            '#121212', // Deep dark
            '#0f0f0f', // Almost black
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, style]}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: '#f8fafc' }, style]}>
        {children}
      </View>
    );
  }

  if (isDarkMode) {
    //Dark mode bg
    return (
      <LinearGradient
        colors={[
          '#1a1a1a', 
          '#161616',
          '#121212', 
          '#0f0f0f', 
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  // Beautiful gradient for light mode
  return (
    <LinearGradient
      colors={[
        '#b8e3ff', // Light blue
        '#aedfff', // Sky blue
        '#f0f9ff', // Light blue
        '#e0f2fe', // Sky blue
        '#fefce8', // Light yellow
        '#fdf2f8', // Light pink
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;