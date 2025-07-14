import { Theme } from '../types/theme';
import { NuminaColors } from './colors';

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#f0f2f5',
    backgroundGradient: ['#f0f2f5', '#f8fafc', '#f0f2f5'],
    surface: '#ffffff',
    surfaceGradient: ['#ffffff', '#f9fafb', '#ffffff'],
    
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
    
    accent: NuminaColors.chatGreen[200],
    
    button: {
      primary: {
        background: '#ffffff',
        text: '#1a1a1a',
        shadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
        pressedShadow: 'inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff',
      },
      secondary: {
        background: '#f8fafc',
        text: '#374151',
        shadow: '4px 4px 8px #e5e7eb, -4px -4px 8px #ffffff',
      },
    },
    
    input: {
      background: '#ffffff',
      text: '#1a1a1a',
      placeholder: '#9ca3af',
      shadow: 'inset 4px 4px 8px #e5e7eb, inset -4px -4px 8px #ffffff',
    },
    
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    
    chat: {
      userMessage: {
        background: '#fafbfc',
        text: '#1a1a1a',
        shadow: '4px 4px 12px rgba(250, 251, 252, 0.3), -2px -2px 8px #ffffff',
      },
      aiMessage: {
        background: '#ffffff',
        text: '#374151',
        shadow: '4px 4px 12px #e5e7eb, -2px -2px 8px #ffffff',
      },
      timestamp: '#9ca3af',
    },
    
    navigation: {
      background: '#ffffff',
      text: '#374151',
      shadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    },
    
    neumorphic: {
      baseShadow: '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
      insetShadow: 'inset 4px 4px 8px #e5e7eb, inset -4px -4px 8px #ffffff',
      subtleShadow: '4px 4px 8px #e5e7eb, -4px -4px 8px #ffffff',
      glowShadow: '0px 0px 20px rgba(153, 255, 153, 0.1)',
    },
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#000000',
    surface: '#111111',
    
    primary: '#ffffff',
    secondary: '#e5e7eb',
    tertiary: '#9ca3af',
    
    accent: NuminaColors.chatGreen[200],
    
    button: {
      primary: {
        background: '#1a1a1a',
        text: '#ffffff',
        shadow: '8px 8px 16px #000000, -8px -8px 16px #222222',
        pressedShadow: 'inset 4px 4px 8px #000000, inset -4px -4px 8px #222222',
      },
      secondary: {
        background: '#111111',
        text: '#e5e7eb',
        shadow: '4px 4px 8px #000000, -4px -4px 8px #1a1a1a',
      },
    },
    
    input: {
      background: '#111111',
      text: '#ffffff',
      placeholder: '#6b7280',
      shadow: 'inset 4px 4px 8px #000000, inset -4px -4px 8px #222222',
    },
    
    success: NuminaColors.chatGreen[200],
    error: '#f87171',
    warning: '#fbbf24',
    
    chat: {
      userMessage: {
        background: '#90CAF9',
        text: '#ffffff',
        shadow: '4px 4px 12px rgba(0, 0, 0, 0.5), -2px -2px 8px #1a1a1a',
      },
      aiMessage: {
        background: '#1a1a1a',
        text: '#e5e7eb',
        shadow: '4px 4px 12px #000000, -2px -2px 8px #222222',
      },
      timestamp: '#6b7280',
    },
    
    navigation: {
      background: '#111111',
      text: '#e5e7eb',
      shadow: '0px 2px 8px rgba(0, 0, 0, 0.8)',
    },
    
    neumorphic: {
      baseShadow: '8px 8px 16px #000000, -8px -8px 16px #222222',
      insetShadow: 'inset 4px 4px 8px #000000, inset -4px -4px 8px #222222',
      subtleShadow: '4px 4px 8px #000000, -4px -4px 8px #1a1a1a',
      glowShadow: '0px 0px 20px rgba(153, 255, 153, 0.2)',
    },
  },
};