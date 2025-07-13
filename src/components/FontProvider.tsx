import React, { useState, useEffect, ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { loadFonts, areFontsLoaded, TextStyles } from '../utils/fonts';
import { useTheme } from '../contexts/ThemeContext';

interface FontProviderProps {
  children: ReactNode;
}

/**
 * FontProvider Component
 * Loads Google Fonts (Nunito, Inter, Open Sans) before rendering the app
 * Matches the web app's font loading pattern exactly
 */
export const FontProvider: React.FC<FontProviderProps> = ({ children }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    const loadAppFonts = async () => {
      try {
        await loadFonts();
        
        // Verify fonts are actually loaded
        if (areFontsLoaded()) {
          setFontsLoaded(true);
        } else {
          console.warn('⚠️ Some fonts failed to load, using fallbacks');
          setFontsLoaded(true); // Continue anyway with system fonts
        }
      } catch (error) {
        console.error('❌ Font loading error:', error);
        setFontError(true);
        setFontsLoaded(true); // Continue with system fonts
      }
    };

    loadAppFonts();
  }, []);

  // Show loading screen while fonts are loading
  if (!fontsLoaded) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      }}>
        <ActivityIndicator 
          size="large" 
          color={theme.colors.accent}
          style={{ marginBottom: 16 }}
        />
        <Text style={{
          ...TextStyles.body,
          color: theme.colors.primary,
          textAlign: 'center',
        }}>
          Loading Numina Fonts...
        </Text>
        <Text style={{
          ...TextStyles.caption,
          color: theme.colors.secondary,
          textAlign: 'center',
          marginTop: 8,
        }}>
          Nunito • Inter • Open Sans
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

export default FontProvider;