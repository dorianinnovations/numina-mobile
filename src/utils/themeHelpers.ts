/**
 * Theme utility functions
 * Consolidates the 35+ duplicate backgroundColor patterns across the app
 */

export interface ThemeColors {
  light: string;
  dark: string;
}

export class ThemeHelpers {
  /**
   * Get background color based on theme mode
   */
  static getBackgroundColor(isDarkMode: boolean, colors: ThemeColors): string {
    return isDarkMode ? colors.dark : colors.light;
  }

  /**
   * Common background patterns used throughout the app
   */
  static backgrounds = {
    // Semi-transparent overlay patterns
    overlay: {
      light: 'rgba(255, 255, 255, 0.95)',
      dark: 'rgba(255, 255, 255, 0.05)'
    },
    
    // Card/container backgrounds
    card: {
      light: 'rgba(255, 255, 255, 0.9)',
      dark: 'rgba(0, 0, 0, 0.3)'
    },
    
    // Modal/popup backgrounds
    modal: {
      light: 'rgba(255, 255, 255, 0.98)',
      dark: 'rgba(0, 0, 0, 0.8)'
    },
    
    // Input field backgrounds
    input: {
      light: 'rgba(255, 255, 255, 0.8)',
      dark: 'rgba(255, 255, 255, 0.1)'
    },
    
    // Button backgrounds
    button: {
      light: 'rgba(255, 255, 255, 0.2)',
      dark: 'rgba(0, 0, 0, 0.2)'
    }
  };

  /**
   * Get overlay background
   */
  static getOverlayBackground(isDarkMode: boolean): string {
    return this.getBackgroundColor(isDarkMode, this.backgrounds.overlay);
  }

  /**
   * Get card background
   */
  static getCardBackground(isDarkMode: boolean): string {
    return this.getBackgroundColor(isDarkMode, this.backgrounds.card);
  }

  /**
   * Get modal background
   */
  static getModalBackground(isDarkMode: boolean): string {
    return this.getBackgroundColor(isDarkMode, this.backgrounds.modal);
  }

  /**
   * Get input background
   */
  static getInputBackground(isDarkMode: boolean): string {
    return this.getBackgroundColor(isDarkMode, this.backgrounds.input);
  }

  /**
   * Get button background
   */
  static getButtonBackground(isDarkMode: boolean): string {
    return this.getBackgroundColor(isDarkMode, this.backgrounds.button);
  }

  /**
   * Get text color based on theme
   */
  static getTextColor(isDarkMode: boolean): string {
    return isDarkMode ? '#FFFFFF' : '#000000';
  }

  /**
   * Get secondary text color
   */
  static getSecondaryTextColor(isDarkMode: boolean): string {
    return isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  }

  /**
   * Get border color
   */
  static getBorderColor(isDarkMode: boolean): string {
    return isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  }
}