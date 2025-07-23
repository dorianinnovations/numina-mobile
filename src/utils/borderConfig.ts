/**
 * Border Configuration Utilities
 * Ensures consistent border behavior across all screens and components
 */

export interface BorderConfigOptions {
  /** Whether this specific border should be active (e.g., during refresh) */
  isActive?: boolean;
  /** Override border radius for this instance */
  borderRadius?: number;
  /** Override border width for this instance */
  borderWidth?: number;
  /** Override animation speed for this instance */
  animationSpeed?: number;
  /** Custom gradient colors for this instance */
  gradientColors?: string[];
  /** Custom background color for this instance */
  backgroundColor?: string;
  /** Custom style for this instance */
  style?: any;
}

/**
 * Standard border configuration for headers
 * This ensures all headers behave consistently while allowing for conditional activation
 */
export const getHeaderBorderConfig = (isRefreshing: boolean = false): BorderConfigOptions => ({
  isActive: isRefreshing, // Headers only show border when refreshing
  borderRadius: 12,
  borderWidth: 1,
  animationSpeed: 3000,
  style: { flex: 1 }
});

/**
 * Standard border configuration for cards/containers
 * This ensures all card-like components behave consistently
 */
export const getCardBorderConfig = (isActive: boolean = true): BorderConfigOptions => ({
  isActive,
  borderRadius: 12,
  borderWidth: 2,
  animationSpeed: 2000,
  style: { marginBottom: 8 }
});

/**
 * Standard border configuration for settings preview
 * This shows all settings in action for the settings screen
 */
export const getPreviewBorderConfig = (isActive: boolean = true): BorderConfigOptions => ({
  isActive,
  borderRadius: 12,
  borderWidth: 1,
  animationSpeed: 3000,
  style: { marginHorizontal: 20, marginTop: 10 }
});

/**
 * Border cohesion guidelines:
 * 
 * 1. ALWAYS use AnimatedGradientBorder without explicit effectsEnabled prop
 *    - This allows global settings to control all borders
 * 
 * 2. Use isActive prop to control when borders should animate
 *    - Headers: only during refresh
 *    - Cards: usually always active
 *    - Modals: while visible
 * 
 * 3. Use these utility functions for consistent sizing and timing
 * 
 * 4. Only override props when absolutely necessary for specific effects
 * 
 * Examples:
 * 
 * // Header border (only active during refresh)
 * <AnimatedGradientBorder {...getHeaderBorderConfig(isRefreshing)}>
 * 
 * // Card border (always active)
 * <AnimatedGradientBorder {...getCardBorderConfig()}>
 * 
 * // Settings preview (respects user's current settings)
 * <AnimatedGradientBorder {...getPreviewBorderConfig()}>
 */