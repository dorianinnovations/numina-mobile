import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeMode } from '../types/theme';

interface ThemeSelectorProps {
  style?: any;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ style }) => {
  const { themeMode, setThemeMode, isDarkMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Light', icon: 'sun' },
    { mode: 'system', label: 'Auto', icon: 'monitor' },
    { mode: 'dark', label: 'Dark', icon: 'moon' },
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.segmentedControl}>
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
                  backgroundColor: isSelected 
                    ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0, 0, 0, 0.04)')
                    : (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)'),
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
              onPress={() => setThemeMode(option.mode)}
              activeOpacity={0.7}
            >
              <Feather 
                name={option.icon as any} 
                size={16} 
                color={isDarkMode ? '#fff' : '#333'}
              />
              <Text style={[
                styles.segmentText,
                {
                  color: isDarkMode ? '#fff' : '#333',
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
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 16,
    gap: 12,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
    fontFamily: 'Inter_500Medium',
  },
});