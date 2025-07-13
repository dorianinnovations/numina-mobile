import { Platform, Dimensions } from 'react-native';
import { NuminaColors } from './colors';

/**
 * Enhanced Styling Utilities for Numina
 * Provides precise spacing, typography, and visual effects for mobile
 */

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive design system based on screen size
export const responsiveScale = (size: number, factor: number = 0.5) => {
  const baseWidth = 375; // iPhone X base width
  const scale = screenWidth / baseWidth;
  const newSize = size + (scale - 1) * size * factor;
  return Math.round(newSize);
};

// Precise spacing system matching your web design
export const Spacing = {
  // Base spacing unit (8px)
  unit: 8,
  
  // Micro spacing for fine adjustments
  micro: responsiveScale(2),
  
  // Standard spacing scale
  xs: responsiveScale(4),
  sm: responsiveScale(8),
  md: responsiveScale(16),
  lg: responsiveScale(24),
  xl: responsiveScale(32),
  xxl: responsiveScale(48),
  xxxl: responsiveScale(64),
  
  // Component-specific spacing
  componentPadding: responsiveScale(20),
  cardPadding: responsiveScale(24),
  sectionGap: responsiveScale(32),
  screenPadding: responsiveScale(24),
  
  // Interactive element spacing
  buttonPadding: {
    vertical: responsiveScale(16),
    horizontal: responsiveScale(24),
  },
  inputPadding: {
    vertical: responsiveScale(14),
    horizontal: responsiveScale(16),
  },
  
  // Safe area insets for modern devices
  safeArea: {
    top: Platform.OS === 'ios' ? 44 : 24,
    bottom: Platform.OS === 'ios' ? 34 : 16,
  },
};

// Perfect typography system
export const Typography = {
  // Font sizes with responsive scaling
  fontSize: {
    xs: responsiveScale(12),
    sm: responsiveScale(14),
    base: responsiveScale(16),
    lg: responsiveScale(18),
    xl: responsiveScale(20),
    '2xl': responsiveScale(24),
    '3xl': responsiveScale(30),
    '4xl': responsiveScale(36),
    '5xl': responsiveScale(48),
  },
  
  // Line heights for perfect vertical rhythm
  lineHeight: {
    xs: responsiveScale(16),
    sm: responsiveScale(18),
    base: responsiveScale(22),
    lg: responsiveScale(24),
    xl: responsiveScale(26),
    '2xl': responsiveScale(30),
    '3xl': responsiveScale(36),
    '4xl': responsiveScale(42),
    '5xl': responsiveScale(56),
  },
  
  // Font weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Letter spacing for refined typography
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
  
  // Text styles matching your design system
  styles: {
    h1: {
      fontSize: responsiveScale(32),
      lineHeight: responsiveScale(38),
      fontWeight: '700' as const,
      letterSpacing: -1,
    },
    h2: {
      fontSize: responsiveScale(28),
      lineHeight: responsiveScale(34),
      fontWeight: '600' as const,
      letterSpacing: -0.8,
    },
    h3: {
      fontSize: responsiveScale(24),
      lineHeight: responsiveScale(30),
      fontWeight: '600' as const,
      letterSpacing: -0.6,
    },
    h4: {
      fontSize: responsiveScale(20),
      lineHeight: responsiveScale(26),
      fontWeight: '600' as const,
      letterSpacing: -0.4,
    },
    body: {
      fontSize: responsiveScale(16),
      lineHeight: responsiveScale(22),
      fontWeight: '400' as const,
      letterSpacing: -0.2,
    },
    bodyLarge: {
      fontSize: responsiveScale(18),
      lineHeight: responsiveScale(24),
      fontWeight: '400' as const,
      letterSpacing: -0.3,
    },
    caption: {
      fontSize: responsiveScale(14),
      lineHeight: responsiveScale(18),
      fontWeight: '400' as const,
      letterSpacing: -0.1,
    },
    small: {
      fontSize: responsiveScale(12),
      lineHeight: responsiveScale(16),
      fontWeight: '400' as const,
      letterSpacing: 0,
    },
    button: {
      fontSize: responsiveScale(16),
      lineHeight: responsiveScale(20),
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    buttonLarge: {
      fontSize: responsiveScale(18),
      lineHeight: responsiveScale(22),
      fontWeight: '600' as const,
      letterSpacing: -0.4,
    },
  },
};

// Enhanced border radius system
export const BorderRadius = {
  none: 0,
  sm: responsiveScale(4),
  md: responsiveScale(8),
  lg: responsiveScale(12),
  xl: responsiveScale(16),
  '2xl': responsiveScale(20),
  '3xl': responsiveScale(24),
  full: 9999,
  
  // Component-specific radius
  button: responsiveScale(12),
  card: responsiveScale(16),
  input: responsiveScale(12),
  modal: responsiveScale(20),
  avatar: responsiveScale(24),
};

// Advanced shadow system for depth
export const Shadows = {
  // iOS-style shadows
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
  },
  
  // Android-style elevation
  android: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
    xl: { elevation: 12 },
    '2xl': { elevation: 16 },
  },
  
  // Cross-platform shadow helper
  get: (size: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => {
    if (Platform.OS === 'ios') {
      return Shadows.ios[size];
    } else {
      return Shadows.android[size];
    }
  },
  
  // Colored shadows for special effects
  colored: {
    green: {
      shadowColor: NuminaColors.chatGreen[200],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    blue: {
      shadowColor: NuminaColors.chatBlue[300],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
  },
};

// Glass morphism effects
export const GlassMorphism = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Shadows.get('md'),
  },
  
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Shadows.get('lg'),
  },
  
  heavy: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.get('xl'),
  },
  
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.get('md'),
  },
};

// Interactive state styling
export const InteractionStates = {
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  
  focused: {
    borderWidth: 2,
    borderColor: NuminaColors.chatGreen[200],
  },
  
  disabled: {
    opacity: 0.5,
  },
  
  loading: {
    opacity: 0.7,
  },
};

// Layout utilities
export const Layout = {
  // Common flex layouts
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  spaceBetween: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  
  spaceAround: {
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
  
  // Common dimensions
  fullWidth: { width: '100%' },
  fullHeight: { height: '100%' },
  fullSize: { width: '100%', height: '100%' },
  
  // Aspect ratios
  aspectRatio: {
    square: { aspectRatio: 1 },
    wide: { aspectRatio: 16 / 9 },
    tall: { aspectRatio: 3 / 4 },
  },
  
  // Screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
    halfWidth: screenWidth / 2,
    halfHeight: screenHeight / 2,
  },
};

// Animation timing matching your web design
export const AnimationTiming = {
  // Duration presets
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
  },
  
  // Delay presets for staggered animations
  delay: {
    none: 0,
    short: 100,
    medium: 200,
    long: 300,
  },
};

export const Styling = {
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  GlassMorphism,
  InteractionStates,
  Layout,
  AnimationTiming,
  responsiveScale,
};