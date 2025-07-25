/**
 * 🎨 BorderThemeSelector - Choose Your Animated Border Style
 * 
 * A beautiful theme selector for animated gradient border effects.
 * Users can preview and select from multiple gorgeous themes.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedGradientBorder } from '../animations/AnimatedGradientBorder';
import { BORDER_THEMES, BorderTheme } from '../../constants/borderThemes';

const { width: screenWidth } = Dimensions.get('window');

// Note: Theme definitions moved to ../constants/borderThemes.ts to avoid circular dependencies

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface BorderThemeSelectorProps {
  selectedThemeId: string;
  onThemeSelect: (theme: BorderTheme) => void;
  isActive?: boolean; // Control animation state
  direction?: 'clockwise' | 'counterclockwise';
  speed?: 1 | 2 | 3;
  variation?: 'smooth' | 'pulse' | 'wave';
}

export const BorderThemeSelector: React.FC<BorderThemeSelectorProps> = ({
  selectedThemeId,
  onThemeSelect,
  isActive = true,
  direction = 'clockwise',
  speed = 2,
  variation = 'smooth',
}) => {
  const { isDarkMode } = useTheme();
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const componentMountedRef = useRef(true);

  // Controlled animation loading
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isActive && componentMountedRef.current) {
      // Small delay to ensure smooth screen transition
      timeoutId = setTimeout(() => {
        if (componentMountedRef.current) {
          setAnimationsEnabled(true);
        }
      }, 300);
    } else {
      setAnimationsEnabled(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false;
      setAnimationsEnabled(false);
    };
  }, []);

  const renderThemePreview = (theme: BorderTheme) => {
    const isSelected = theme.id === selectedThemeId;

    return (
      <TouchableOpacity
        key={theme.id}
        style={[
          styles.minimalCard,
          {
            borderColor: isSelected 
              ? theme.colors[0]
              : 'transparent',
            borderWidth: isSelected ? 2 : 0,
          }
        ]}
        onPress={() => onThemeSelect(theme)}
        activeOpacity={0.8}
      >
        <AnimatedGradientBorder
          isActive={animationsEnabled && isActive}
          borderRadius={12}
          borderWidth={2}
          animationSpeed={3000}
          gradientColors={theme.colors}
          direction={direction}
          speed={speed}
          variation={variation}
          style={styles.previewBorder}
        >
          <View style={[
            styles.minimalContent,
            { backgroundColor: isDarkMode ? '#000' : '#fff' }
          ]}>
            {isSelected && (
              <Text style={styles.selectedDot}>●</Text>
            )}
          </View>
        </AnimatedGradientBorder>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.minimalContainer}>
      <View style={styles.minimalGrid}>
        {BORDER_THEMES.map(renderThemePreview)}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  minimalContainer: {
    flex: 1,
    padding: 20,
  },
  minimalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  minimalCard: {
    width: (screenWidth - 72) / 2,
    borderRadius: 16,
    padding: 4,
  },
  previewBorder: {
    width: '100%',
    height: 80,
  },
  minimalContent: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    fontSize: 12,
    color: '#6ec5ff',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  themesGrid: {
    gap: 16,
  },
  themeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    position: 'relative',
  },
  previewContainer: {
    marginBottom: 12,
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 6,
  },
  themeEmoji: {
    fontSize: 24,
  },
  themeInfo: {
    gap: 4,
  },
  themeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  themeDescription: {
    fontSize: 14,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BorderThemeSelector;