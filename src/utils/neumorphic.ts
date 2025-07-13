import { ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../types/theme';

/**
 * Neumorphic styling utilities for React Native
 * Creates soft, elevated surfaces with subtle shadows
 */

export interface NeumorphicStyleOptions {
  size?: 'small' | 'medium' | 'large';
  pressed?: boolean;
  variant?: 'elevated' | 'inset' | 'flat';
  borderRadius?: number;
}

export class NeumorphicStyles {
  private theme: Theme;

  constructor(theme: Theme) {
    this.theme = theme;
  }

  // Base neumorphic container
  container(options: NeumorphicStyleOptions = {}): ViewStyle {
    const { size = 'medium', pressed = false, variant = 'elevated', borderRadius = 16 } = options;
    
    const baseStyle: ViewStyle = {
      borderRadius,
      backgroundColor: this.theme.colors.surface,
    };

    // Apply shadows based on variant and state
    if (variant === 'elevated' && !pressed) {
      return {
        ...baseStyle,
        ...this.getShadowStyle(size),
      };
    }

    if (variant === 'inset' || pressed) {
      return {
        ...baseStyle,
        // Note: React Native doesn't support inset shadows natively
        // Inset shadows are simulated with border and background color changes
        borderWidth: 1,
        borderColor: this.theme.name === 'light' ? '#e5e7eb' : '#1a1a1a',
        backgroundColor: this.theme.name === 'light' ? '#f8fafc' : '#0a0a0a',
      };
    }

    return baseStyle;
  }

  // Neumorphic button styles
  button(options: NeumorphicStyleOptions & { type?: 'primary' | 'secondary' } = {}): ViewStyle {
    const { type = 'primary', pressed = false, borderRadius = 12 } = options;
    
    const buttonColors = this.theme.colors.button[type];
    
    return {
      ...this.container({ ...options, variant: pressed ? 'inset' : 'elevated', borderRadius }),
      backgroundColor: buttonColors.background,
      paddingHorizontal: 24,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    };
  }

  // Neumorphic input field
  input(options: NeumorphicStyleOptions = {}): ViewStyle {
    const { borderRadius = 12 } = options;
    
    return {
      ...this.container({ ...options, variant: 'inset', borderRadius }),
      backgroundColor: this.theme.colors.input.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 48,
    };
  }

  // Chat message bubble
  messageBubble(isUser: boolean, options: NeumorphicStyleOptions = {}): ViewStyle {
    const { borderRadius = 18 } = options;
    const chatColors = isUser ? this.theme.colors.chat.userMessage : this.theme.colors.chat.aiMessage;
    
    return {
      ...this.container({ ...options, size: 'small', borderRadius }),
      backgroundColor: chatColors.background,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginVertical: 4,
      maxWidth: '80%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
    };
  }

  // Header/navigation container
  header(options: NeumorphicStyleOptions = {}): ViewStyle {
    const { borderRadius = 0 } = options;
    
    return {
      ...this.container({ ...options, size: 'small', borderRadius }),
      backgroundColor: this.theme.colors.navigation.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
    };
  }

  // Card container
  card(options: NeumorphicStyleOptions = {}): ViewStyle {
    const { borderRadius = 20 } = options;
    
    return {
      ...this.container({ ...options, borderRadius }),
      padding: 20,
      margin: 8,
    };
  }

  // Floating action button
  fab(options: NeumorphicStyleOptions = {}): ViewStyle {
    const { size = 'medium' } = options;
    
    const fabSize = size === 'small' ? 48 : size === 'large' ? 64 : 56;
    
    return {
      ...this.container({ ...options, variant: 'elevated', borderRadius: fabSize / 2 }),
      width: fabSize,
      height: fabSize,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      bottom: 20,
      right: 20,
    };
  }

  // Text styles with proper contrast
  text(variant: 'primary' | 'secondary' | 'tertiary' = 'primary'): TextStyle {
    const colorMap = {
      primary: this.theme.colors.primary,
      secondary: this.theme.colors.secondary,
      tertiary: this.theme.colors.tertiary || this.theme.colors.secondary,
    };

    return {
      color: colorMap[variant],
      fontSize: variant === 'primary' ? 16 : variant === 'secondary' ? 14 : 12,
      fontWeight: variant === 'primary' ? '600' : '400',
    };
  }

  // Button text styles
  buttonText(type: 'primary' | 'secondary' = 'primary'): TextStyle {
    return {
      color: this.theme.colors.button[type].text,
      fontSize: 16,
      fontWeight: '600',
    };
  }

  // Private helper methods
  private getShadowStyle(size: 'small' | 'medium' | 'large'): ViewStyle {
    const shadowProps = {
      small: { elevation: 2, shadowRadius: 4, shadowOpacity: 0.1 },
      medium: { elevation: 4, shadowRadius: 8, shadowOpacity: 0.15 },
      large: { elevation: 8, shadowRadius: 16, shadowOpacity: 0.2 },
    };

    const props = shadowProps[size];
    
    return {
      elevation: props.elevation, // Android shadow
      shadowColor: this.theme.name === 'light' ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: props.elevation / 2 },
      shadowOpacity: props.shadowOpacity,
      shadowRadius: props.shadowRadius,
    };
  }
}

// Hook for easy access to neumorphic styles
export const useNeumorphicStyles = (theme: Theme) => {
  return new NeumorphicStyles(theme);
};

// Predefined style presets
export const neumorphicPresets = {
  // Common component presets
  chatInput: (theme: Theme): ViewStyle => new NeumorphicStyles(theme).input({ borderRadius: 24 }),
  sendButton: (theme: Theme, pressed: boolean): ViewStyle => 
    new NeumorphicStyles(theme).button({ type: 'primary', pressed, borderRadius: 20 }),
  messageCard: (theme: Theme, isUser: boolean): ViewStyle =>
    new NeumorphicStyles(theme).messageBubble(isUser, { borderRadius: isUser ? 18 : 18 }),
  settingsCard: (theme: Theme): ViewStyle => new NeumorphicStyles(theme).card({ borderRadius: 16 }),
};