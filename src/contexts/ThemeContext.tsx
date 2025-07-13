import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
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

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    // Listen for system theme changes when in system mode
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        updateThemeBasedOnMode(themeMode, colorScheme);
      });
      return () => subscription?.remove();
    }
  }, [themeMode]);

  const updateThemeBasedOnMode = (mode: ThemeMode, systemScheme?: 'light' | 'dark' | null) => {
    let shouldUseDark = false;
    
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
    // Legacy toggle function - cycles through light -> dark -> system
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
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};