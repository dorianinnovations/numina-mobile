export interface ThemeColors {
  // Background colors
  background: string;
  backgroundGradient?: string[];
  surface: string;
  surfaceGradient?: string[];
  
  // Text colors
  primary: string;
  secondary: string;
  tertiary?: string;
  
  // Interactive elements
  accent: string;
  button: {
    primary: {
      background: string;
      text: string;
      shadow?: string;
      pressedShadow?: string;
    };
    secondary: {
      background: string;
      text: string;
      border?: string;
      shadow?: string;
    };
  };
  
  // Form elements
  input: {
    background: string;
    border?: string;
    text: string;
    placeholder: string;
    shadow?: string;
  };
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  
  // Chat specific
  chat: {
    userMessage: {
      background: string;
      text: string;
      shadow?: string;
    };
    aiMessage: {
      background: string;
      text: string;
      shadow?: string;
    };
    timestamp: string;
  };
  
  // Navigation
  navigation: {
    background: string;
    text: string;
    border?: string;
    shadow?: string;
  };
  
  // Neumorphic shadow system
  neumorphic?: {
    baseShadow: string;
    insetShadow: string;
    subtleShadow: string;
    glowShadow: string;
  };
}

export interface Theme {
  name: 'light' | 'dark';
  colors: ThemeColors;
}

export type ThemeMode = 'light' | 'system' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}