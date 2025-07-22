/**
 * 🎨 BorderThemeContext - Global Border Theme Management
 * 
 * Manages the user's selected animated border theme across the entire app.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BORDER_THEMES, BorderTheme } from '../components/BorderThemeSelector';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

interface BorderThemeContextType {
  selectedTheme: BorderTheme;
  selectTheme: (theme: BorderTheme) => Promise<void>;
  isLoading: boolean;
}

const BorderThemeContext = createContext<BorderThemeContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface BorderThemeProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = '@numina_border_theme';

export const BorderThemeProvider: React.FC<BorderThemeProviderProps> = ({ children }) => {
  const [selectedTheme, setSelectedTheme] = useState<BorderTheme>(BORDER_THEMES[0]); // Default to Electric Neon
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme on startup
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedThemeId) {
        const theme = BORDER_THEMES.find(t => t.id === savedThemeId);
        if (theme) {
          setSelectedTheme(theme);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved border theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTheme = async (theme: BorderTheme) => {
    try {
      setSelectedTheme(theme);
      await AsyncStorage.setItem(STORAGE_KEY, theme.id);
      console.log(`🎨 Border theme changed to: ${theme.name}`);
    } catch (error) {
      console.error('Failed to save border theme:', error);
    }
  };

  const value: BorderThemeContextType = {
    selectedTheme,
    selectTheme,
    isLoading,
  };

  return (
    <BorderThemeContext.Provider value={value}>
      {children}
    </BorderThemeContext.Provider>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export const useBorderTheme = (): BorderThemeContextType => {
  const context = useContext(BorderThemeContext);
  if (!context) {
    // Graceful fallback - return default theme without throwing error
    console.warn('useBorderTheme used without BorderThemeProvider, using default theme');
    return {
      selectedTheme: BORDER_THEMES[0], // Default to Electric Neon
      selectTheme: async () => {},
      isLoading: false,
    };
  }
  return context;
};

export default BorderThemeProvider;