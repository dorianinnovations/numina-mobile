// Desktop/Web optimizations for Numina Web

import { Platform } from 'react-native';

export const isDesktop = Platform.OS === 'web';

// Desktop breakpoints
export const DESKTOP_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
  large: 1600,
} as const;

// Get responsive value based on screen size
export const getResponsiveValue = (
  mobile: number | string,
  tablet?: number | string,
  desktop?: number | string,
  large?: number | string
) => {
  if (!isDesktop) return mobile;
  
  const width = window.innerWidth;
  
  if (width >= DESKTOP_BREAKPOINTS.large && large !== undefined) return large;
  if (width >= DESKTOP_BREAKPOINTS.desktop && desktop !== undefined) return desktop;
  if (width >= DESKTOP_BREAKPOINTS.tablet && tablet !== undefined) return tablet;
  
  return mobile;
};

// Desktop keyboard shortcuts
export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'cmd' | 'shift' | 'alt')[];
  action: () => void;
  description: string;
}

class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isListening = false;

  addShortcut(shortcut: KeyboardShortcut) {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
    
    if (!this.isListening) {
      this.startListening();
    }
  }

  removeShortcut(key: string, modifiers?: string[]) {
    const shortcutKey = this.getShortcutKey({ key, modifiers } as KeyboardShortcut);
    this.shortcuts.delete(shortcutKey);
  }

  private getShortcutKey(shortcut: KeyboardShortcut): string {
    const modifiers = shortcut.modifiers || [];
    return [...modifiers.sort(), shortcut.key.toLowerCase()].join('+');
  }

  private startListening() {
    if (!isDesktop) return;
    
    this.isListening = true;
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent) {
    const modifiers: string[] = [];
    
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.metaKey) modifiers.push('cmd');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');
    
    const key = event.key.toLowerCase();
    const shortcutKey = [...modifiers.sort(), key].join('+');
    
    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  cleanup() {
    if (isDesktop && this.isListening) {
      document.removeEventListener('keydown', this.handleKeyDown.bind(this));
      this.isListening = false;
      this.shortcuts.clear();
    }
  }
}

export const keyboardShortcuts = new KeyboardShortcutManager();

// Mouse interaction helpers
export const getHoverStyles = (normalStyles: any, hoverStyles: any) => {
  if (!isDesktop) return normalStyles;
  
  return {
    ...normalStyles,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': hoverStyles,
  };
};

// Web-specific performance optimizations
export const WebOptimizations = {
  // Lazy load images with intersection observer
  createLazyImage: (src: string, placeholder?: string) => ({
    src: isDesktop ? src : src, // Could add lazy loading logic here
    loading: 'lazy' as const,
    decoding: 'async' as const,
  }),

  // Desktop-specific scroll behavior
  smoothScroll: (element: Element, options?: ScrollIntoViewOptions) => {
    if (!isDesktop) return;
    
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      ...options,
    });
  },

  // Desktop focus management
  manageFocus: (element: HTMLElement) => {
    if (!isDesktop) return;
    
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
};

// Desktop layout utilities
export const DesktopLayout = {
  // Chat container sizing for desktop
  getChatContainerStyle: () => ({
    maxWidth: getResponsiveValue(400, 600, 800, 1000),
    alignSelf: 'center' as const,
    paddingHorizontal: getResponsiveValue(16, 24, 32, 40),
  }),

  // Hero section sizing
  getHeroContainerStyle: () => ({
    maxWidth: getResponsiveValue('100%', 900, 1200, 1400),
    paddingHorizontal: getResponsiveValue(24, 40, 60, 80),
    paddingVertical: getResponsiveValue(40, 60, 80, 100),
  }),

  // Button sizing for desktop
  getButtonStyle: () => ({
    minWidth: getResponsiveValue(120, 140, 160, 180),
    paddingHorizontal: getResponsiveValue(20, 24, 28, 32),
    paddingVertical: getResponsiveValue(12, 14, 16, 18),
  }),
};

export default {
  isDesktop,
  DESKTOP_BREAKPOINTS,
  getResponsiveValue,
  keyboardShortcuts,
  getHoverStyles,
  WebOptimizations,
  DesktopLayout,
};