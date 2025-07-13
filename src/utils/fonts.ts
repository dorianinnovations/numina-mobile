import * as Font from 'expo-font';
import { Platform } from 'react-native';
import {
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  OpenSans_300Light,
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  OpenSans_800ExtraBold,
} from '@expo-google-fonts/open-sans';

/**
 * Font System for Numina React Native
 * Matches the web app typography exactly
 * Based on: Nunito (headings), Inter (small text), Open Sans (reading), System (body)
 */

// Font families exactly matching web app
export const FontFamilies = {
  // Primary brand font - used for headings, chat messages, important UI
  heading: Platform.select({
    ios: 'Nunito',
    android: 'nunito',
    default: 'Nunito',
  }),
  
  // Small text font - used for UI elements, labels, captions
  small: Platform.select({
    ios: 'Inter',
    android: 'inter',
    default: 'Inter',
  }),
  
  // Reading font - used for paragraph content, descriptions
  reading: Platform.select({
    ios: 'OpenSans',
    android: 'opensans',
    default: 'Open Sans',
  }),
  
  // Body font - system fallback for general text
  body: Platform.select({
    ios: 'SF Pro Text', // San Francisco
    android: 'Roboto',
    default: 'System',
  }),
  
  // Fallback system fonts
  system: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
};

// Font weights matching web app exactly
export const FontWeights = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Font sizes matching Tailwind's scale (web app uses these exact sizes)
export const FontSizes = {
  xs: 12,    // text-xs
  sm: 14,    // text-sm (most common in web app)
  base: 16,  // text-base (default)
  lg: 18,    // text-lg
  xl: 20,    // text-xl
  '2xl': 24, // text-2xl
  '3xl': 30, // text-3xl
  '4xl': 36, // text-4xl
  '5xl': 48, // text-5xl
  '6xl': 60, // text-6xl
  '7xl': 72, // text-7xl
  '8xl': 96, // text-8xl
  '9xl': 128, // text-9xl
};

// Line heights matching Tailwind's scale
export const LineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625, // Used for chat messages in web app
  loose: 2,
};

// Letter spacing matching web app patterns
export const LetterSpacing = {
  tighter: -0.06,  // tracking-tighter
  tight: -0.02,    // tracking-tight
  normal: 0,       // tracking-normal
  wide: 0.025,     // tracking-wide
  wider: 0.05,     // tracking-wider
  widest: 0.1,     // tracking-widest
};

// Exact text styles matching web app components
export const TextStyles = {
  // Chat message styles (primary use of Nunito in web app)
  chatMessage: {
    fontFamily: 'Nunito_400Regular', // Exact match to web app
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  
  chatMessageUser: {
    fontFamily: 'Nunito_500Medium', // Emphasized for user messages
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Heading styles (all use Nunito with semibold weight)
  h1: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: FontSizes['4xl'],
    lineHeight: FontSizes['4xl'] * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  h2: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: FontSizes['3xl'],
    lineHeight: FontSizes['3xl'] * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  
  h3: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: FontSizes['2xl'],
    lineHeight: FontSizes['2xl'] * LineHeights.snug,
    letterSpacing: LetterSpacing.normal,
  },
  
  h4: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: FontSizes.xl,
    lineHeight: FontSizes.xl * LineHeights.snug,
    letterSpacing: LetterSpacing.normal,
  },
  
  h5: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: FontSizes.lg,
    lineHeight: FontSizes.lg * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  h6: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Body text styles (system fonts)
  body: {
    fontFamily: FontFamilies.body, // System font
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  bodyLarge: {
    fontFamily: FontFamilies.body, // System font
    fontSize: FontSizes.lg,
    lineHeight: FontSizes.lg * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Reading content (Open Sans)
  reading: {
    fontFamily: 'OpenSans_400Regular',
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.relaxed,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Small text styles (Inter) - most common in web app UI
  textSm: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  textXs: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Button styles
  button: {
    fontFamily: 'Nunito_500Medium', // Nunito for consistency with web
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.tight,
    letterSpacing: LetterSpacing.normal,
  },
  
  buttonLarge: {
    fontFamily: 'Nunito_500Medium',
    fontSize: FontSizes.lg,
    lineHeight: FontSizes.lg * LineHeights.tight,
    letterSpacing: LetterSpacing.normal,
  },
  
  buttonSmall: {
    fontFamily: 'Inter_500Medium',
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.tight,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Input styles
  input: {
    fontFamily: FontFamilies.body, // System font
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Caption and label styles
  caption: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
  
  // Timestamp and metadata
  timestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * LineHeights.normal,
    letterSpacing: LetterSpacing.normal,
  },
};

// Font loading configuration - using Google Fonts
export const fontAssets = {
  // Nunito family (primary brand font) - matches web app exactly
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  
  // Inter family (small text) - matches web app exactly
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  
  // Open Sans family (reading content) - matches web app exactly
  OpenSans_300Light,
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  OpenSans_800ExtraBold,
};

// Load fonts function
export const loadFonts = async (): Promise<void> => {
  try {
    await Font.loadAsync(fontAssets);
  } catch (error) {
    console.warn('⚠️ Font loading failed, falling back to system fonts:', error);
  }
};

// Font loading status
export const areFontsLoaded = (): boolean => {
  return Font.isLoaded('Nunito_400Regular') && 
         Font.isLoaded('Inter_400Regular') && 
         Font.isLoaded('OpenSans_400Regular');
};

// Utility function to get font family with weight (Google Fonts naming)
export const getFontFamily = (
  family: keyof typeof FontFamilies, 
  weight: keyof typeof FontWeights = 'normal'
): string => {
  // For Google Fonts, use exact naming from expo-google-fonts
  if (family === 'heading') {
    switch (weight) {
      case 'light': return 'Nunito_300Light';
      case 'normal': return 'Nunito_400Regular';
      case 'medium': return 'Nunito_500Medium';
      case 'semibold': return 'Nunito_600SemiBold';
      case 'bold': return 'Nunito_700Bold';
      case 'extrabold': return 'Nunito_800ExtraBold';
      default: return 'Nunito_400Regular';
    }
  }
  
  if (family === 'small') {
    switch (weight) {
      case 'light': return 'Inter_300Light';
      case 'normal': return 'Inter_400Regular';
      case 'medium': return 'Inter_500Medium';
      case 'semibold': return 'Inter_600SemiBold';
      case 'bold': return 'Inter_700Bold';
      case 'extrabold': return 'Inter_800ExtraBold';
      default: return 'Inter_400Regular';
    }
  }
  
  if (family === 'reading') {
    switch (weight) {
      case 'light': return 'OpenSans_300Light';
      case 'normal': return 'OpenSans_400Regular';
      case 'medium': return 'OpenSans_500Medium';
      case 'semibold': return 'OpenSans_600SemiBold';
      case 'bold': return 'OpenSans_700Bold';
      case 'extrabold': return 'OpenSans_800ExtraBold';
      default: return 'OpenSans_400Regular';
    }
  }
  
  // For system fonts, return base family
  return FontFamilies[family];
};

// Text style helper with font family resolution
export const createTextStyle = (
  styleKey: keyof typeof TextStyles,
  overrides?: any
) => {
  const baseStyle = TextStyles[styleKey];
  return {
    ...baseStyle,
    ...overrides,
  };
};

export default {
  FontFamilies,
  FontWeights,
  FontSizes,
  LineHeights,
  LetterSpacing,
  TextStyles,
  loadFonts,
  areFontsLoaded,
  getFontFamily,
  createTextStyle,
};