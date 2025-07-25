import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeMode } from '../../types/theme';

interface ThemeSelectorProps {
  style?: any;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ style }) => {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: 'sun' },
    { mode: 'system', label: 'Auto', icon: 'smartphone' },
    { mode: 'dark', label: 'Dark', icon: 'moon' },
  ];

  // Layout and animation state
  const [containerWidth, setContainerWidth] = useState(0);
  const selectedIndicator = useRef(new Animated.Value(0)).current;

  // Calculate button width based on container
  const buttonWidth = containerWidth / 3;

  // Update selected indicator position when theme changes
  useEffect(() => {
    const selectedIndex = options.findIndex(option => option.mode === themeMode);
    
    Animated.spring(selectedIndicator, {
      toValue: selectedIndex * buttonWidth,
      tension: 200,
      friction: 20,
      useNativeDriver: false, // Use false for translateX with calculated values
    }).start();
  }, [themeMode, buttonWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const handleThemePress = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.segmentedControl} onLayout={handleLayout}>
        {/* Selected indicator background */}
        <Animated.View
          style={[
            styles.selectedIndicator,
            {
              width: buttonWidth,
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.04)',
              transform: [
                {
                  translateX: selectedIndicator,
                },
              ],
            },
          ]}
        />
        
        {options.map((option, index) => {
          const isSelected = themeMode === option.mode;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;
          
          return (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.segment,
                {
                  backgroundColor: 'transparent',
                  borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
                  borderTopLeftRadius: isFirst ? 8 : 0,
                  borderBottomLeftRadius: isFirst ? 8 : 0,
                  borderTopRightRadius: isLast ? 8 : 0,
                  borderBottomRightRadius: isLast ? 8 : 0,
                  borderRightWidth: isLast ? 1 : 0,
                  borderLeftWidth: isFirst ? 1 : 0,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                }
              ]}
              onPress={() => handleThemePress(option.mode)}
              activeOpacity={0.7}
            >
              <Feather 
                name={option.icon as any} 
                size={16} 
                color={isSelected ? (isDarkMode ? '#fff' : '#333') : (isDarkMode ? '#888' : '#666')}
              />
              <Text style={[
                styles.segmentText,
                {
                  color: isSelected ? (isDarkMode ? '#fff' : '#333') : (isDarkMode ? '#888' : '#666'),
                  fontWeight: isSelected ? '600' : '500',
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    marginVertical: 2,
    position: 'relative',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 8,
    zIndex: 0,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 1,
  },
  segmentText: {
    fontSize: 14,
    letterSpacing: -0.2,
    fontFamily: 'Inter_500Medium',
  },
});