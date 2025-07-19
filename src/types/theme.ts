export interface ThemeColors {
  background: string;
  backgroundGradient?: string[];
  surface: string;
  surfaceGradient?: string[];
  
  primary: string;
  secondary: string;
  tertiary?: string;
  
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
  
  input: {
    background: string;
    border?: string;
    text: string;
    placeholder: string;
    shadow?: string;
  };
  
  success: string;
  error: string;
  warning: string;
  
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
  
  navigation: {
    background: string;
    text: string;
    border?: string;
    shadow?: string;
  };
  
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