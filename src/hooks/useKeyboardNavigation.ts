import { useEffect } from 'react';
import { Platform } from 'react-native';

interface KeyboardNavigationConfig {
  onBack?: () => void;
  onHome?: () => void;
  onSettings?: () => void;
  onChat?: () => void;
  onAnalytics?: () => void;
}

export const useKeyboardNavigation = (config: KeyboardNavigationConfig) => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Handle keyboard shortcuts
      if (event.altKey || event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault();
            config.onHome?.();
            break;
          case 'c':
            event.preventDefault();
            config.onChat?.();
            break;
          case 'a':
            event.preventDefault();
            config.onAnalytics?.();
            break;
          case ',':
            event.preventDefault();
            config.onSettings?.();
            break;
        }
      } else {
        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            config.onBack?.();
            break;
          case 'Backspace':
            if (!target.tagName.match(/INPUT|TEXTAREA/)) {
              event.preventDefault();
              config.onBack?.();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config]);
};

export default useKeyboardNavigation;