/**
 * 🎨 BorderThemeSettingsScreen - Choose Your Animated Border Theme
 * 
 * A beautiful settings screen where users can preview and select
 * their preferred animated border theme.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useBorderTheme } from '../contexts/BorderThemeContext';
import { BorderThemeSelector, BorderTheme } from '../components/BorderThemeSelector';
import { AnimatedGradientBorder } from '../components/AnimatedGradientBorder';
import { FontAwesome5 } from '@expo/vector-icons';

interface BorderThemeSettingsScreenProps {
  navigation: any;
}

export const BorderThemeSettingsScreen: React.FC<BorderThemeSettingsScreenProps> = ({
  navigation,
}) => {
  const { isDarkMode } = useTheme();
  const { selectedTheme, selectTheme } = useBorderTheme();
  const [isScreenActive, setIsScreenActive] = useState(false);
  
  // Animation controls
  const [direction, setDirection] = useState<'clockwise' | 'counterclockwise'>('clockwise');
  const [speed, setSpeed] = useState<1 | 2 | 3>(2); // 1=slow, 2=medium, 3=fast
  const [variation, setVariation] = useState<'smooth' | 'pulse' | 'wave'>('smooth');

  // Control when animations should be active
  useEffect(() => {
    // Activate animations after screen is mounted
    const activateTimer = setTimeout(() => {
      setIsScreenActive(true);
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(activateTimer);
      setIsScreenActive(false);
    };
  }, []);

  // Listen to navigation focus events
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      setIsScreenActive(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsScreenActive(false);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const handleThemeSelect = (theme: BorderTheme) => {
    selectTheme(theme);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: isDarkMode ? '#000' : '#fff' }
    ]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#fff'}
      />
      
      {/* Header with animated border */}
      <AnimatedGradientBorder
        isActive={isScreenActive}
        borderRadius={12}
        borderWidth={1}
        animationSpeed={3000}
        direction={direction}
        speed={speed}
        variation={variation}
        style={{ marginHorizontal: 20, marginTop: 10 }}
      >
        <View style={[
          styles.header,
          { backgroundColor: isDarkMode ? 'rgb(9, 9, 9)' : 'rgba(255, 255, 255, 0.9)' }
        ]}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
          >
            <Text style={[
              styles.backButtonText,
              { color: isDarkMode ? '#fff' : '#000' }
            ]}>
              ← Back
            </Text>
          </TouchableOpacity>
          
          <Text style={[
            styles.headerTitle,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            Border Themes
          </Text>
          
          <View style={styles.spacer} />
        </View>
      </AnimatedGradientBorder>

      {/* Animation Controls */}
      <View style={styles.controls}>
        {/* Direction */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setDirection(direction === 'clockwise' ? 'counterclockwise' : 'clockwise')}
        >
          <FontAwesome5 
            name={direction === 'clockwise' ? 'redo' : 'undo'} 
            size={18} 
            color={isDarkMode ? '#fff' : '#000'} 
          />
        </TouchableOpacity>

        {/* Speed */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setSpeed(speed === 3 ? 1 : (speed + 1) as 1 | 2 | 3)}
        >
          <FontAwesome5 
            name={speed === 1 ? 'tachometer-alt' : speed === 2 ? 'shipping-fast' : 'rocket'} 
            size={18} 
            color={isDarkMode ? '#fff' : '#000'} 
          />
        </TouchableOpacity>

        {/* Variation */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setVariation(
            variation === 'smooth' ? 'pulse' : 
            variation === 'pulse' ? 'wave' : 'smooth'
          )}
        >
          <FontAwesome5 
            name={variation === 'smooth' ? 'minus' : variation === 'pulse' ? 'heartbeat' : 'water'} 
            size={18} 
            color={isDarkMode ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
      </View>

      {/* Theme Selector */}
      <BorderThemeSelector
        selectedThemeId={selectedTheme.id}
        onThemeSelect={handleThemeSelect}
        isActive={isScreenActive}
        direction={direction}
        speed={speed}
        variation={variation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  spacer: {
    width: 60, // Balance the back button
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 24,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(110, 197, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(110, 197, 255, 0.2)',
  },
});

export default BorderThemeSettingsScreen;