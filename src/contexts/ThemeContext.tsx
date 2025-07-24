import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeContextType, Theme, ThemeMode } from '../types/theme';
import { lightTheme, darkTheme } from '../utils/themes';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@numina_theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(lightTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Set initialized immediately with default theme
        setIsInitialized(true);
        // Then load saved theme in background
        await loadTheme();
      } catch (error) {
        console.warn('Theme initialization failed:', error);
        setIsInitialized(true);
      }
    };
    
    initializeTheme();
  }, []);

  useEffect(() => {
    // Only setup appearance listener after initialization
    if (isInitialized && themeMode === 'system') {
      try {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
          updateThemeBasedOnMode(themeMode, colorScheme);
        });
        return () => subscription?.remove();
      } catch (error) {
        console.warn('Appearance listener setup failed:', error);
      }
    }
  }, [themeMode, isInitialized]);

  const updateThemeBasedOnMode = (mode: ThemeMode, systemScheme?: 'light' | 'dark' | null) => {
    let shouldUseDark = false;
    
    try {
      switch (mode) {
        case 'light':
          shouldUseDark = false;
          break;
        case 'dark':
          shouldUseDark = true;
          break;
        case 'system':
          const currentScheme = systemScheme || Appearance.getColorScheme();
          shouldUseDark = currentScheme === 'dark';
          break;
      }
      
      setTheme(shouldUseDark ? darkTheme : lightTheme);
      setIsDarkMode(shouldUseDark);
    } catch (error) {
      console.warn('Theme update failed, using light theme:', error);
      setTheme(lightTheme);
      setIsDarkMode(false);
    }
  };

  const loadTheme = async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
      const mode = savedThemeMode || 'system';
      
      setThemeModeState(mode);
      updateThemeBasedOnMode(mode);
    } catch (error) {
      // Default to system mode
      setThemeModeState('system');
      updateThemeBasedOnMode('system');
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      updateThemeBasedOnMode(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
    }
  };

  const toggleTheme = async () => {
    const nextMode: ThemeMode = 
      themeMode === 'light' ? 'dark' : 
      themeMode === 'dark' ? 'system' : 'light';
    
    await setThemeMode(nextMode);
  };

  const value: ThemeContextType = {
    theme,
    isDarkMode,
    themeMode,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {React.Children.toArray(children)}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  try {
    const context = useContext(ThemeContext);
    if (context === undefined) {
      throw new Error('useTheme must be used within a ThemeProvider');
    }
    
    // Defensive check to ensure theme properties exist
    if (!context.theme || !context.theme.colors) {
      console.warn('ThemeContext: Invalid theme object, falling back to defaults');
      return {
        theme: lightTheme,
        isDarkMode: false,
        themeMode: 'light',
        setThemeMode: () => {},
        toggleTheme: () => {},
      };
    }
    
    return context;
  } catch (error) {
    console.warn('ThemeContext: Accessing theme before provider ready, using defaults:', error instanceof Error ? error.message : String(error));
    // Return safe defaults to prevent app crash
    return {
      theme: lightTheme,
      isDarkMode: false,
      themeMode: 'light',
      setThemeMode: () => {},
      toggleTheme: () => {},
    };
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});