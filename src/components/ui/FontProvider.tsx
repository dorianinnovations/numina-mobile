import React, { useState, useEffect, ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { loadFonts, areFontsLoaded, TextStyles } from '../../utils/fonts';
import { useTheme } from '../../contexts/ThemeContext';

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

  // Block app rendering until critical fonts (especially Crimson Pro for brand) are loaded
  if (!fontsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff'
      }}>
        <ActivityIndicator 
          size="large" 
          color={isDarkMode ? '#ffffff' : '#000000'} 
        />
        <Text style={{
          marginTop: 16,
          fontSize: 14,
          color: isDarkMode ? '#888888' : '#666666',
          fontFamily: 'System'
        }}>
          Loading brand fonts...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {React.Children.toArray(children)}
    </View>
  );
};

export default FontProvider;