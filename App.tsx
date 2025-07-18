import React, { useEffect } from 'react';
import { Platform } from 'react-native';
// Import the main app
import SimpleApp from './src/SimpleApp';
import SimpleNavigationTest from './TEST_SIMPLE_NAV';

const App: React.FC = () => {
  useEffect(() => {
    // Apply web-specific fixes
    if (Platform.OS === 'web') {
      // Inject CSS fixes for React Native Web issues
      const style = document.createElement('style');
      style.textContent = `
        /* Fix text input focus issues */
        input, textarea {
          outline: none !important;
          user-select: text !important;
          cursor: text !important;
          -webkit-tap-highlight-color: transparent !important;
        }

        /* Remove unwanted button overlays */
        button, div[role="button"] {
          -webkit-tap-highlight-color: transparent !important;
          cursor: pointer !important;
          user-select: none !important;
          outline: none !important;
        }

        /* Remove focus rings and overlays */
        *:focus {
          outline: none !important;
        }

        /* Ensure proper text input behavior */
        div[data-focusable="true"] input,
        div[data-focusable="true"] textarea {
          user-select: text !important;
          -webkit-user-select: text !important;
          pointer-events: auto !important;
          cursor: text !important;
        }

        /* Remove mobile-style hover effects on web */
        @media (pointer: fine) {
          div[role="button"]:active {
            opacity: 1 !important;
            background-color: transparent !important;
          }
          
          div[role="button"]:hover {
            transform: scale(1.02) !important;
            transition: transform 0.1s ease !important;
          }

          div[role="button"]:active {
            transform: scale(0.98) !important;
          }
        }

        /* Smooth font rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Fix React Native Web shadow glitches - prevent white boxes */
        div[style*="shadow"] {
          background: transparent !important;
        }

        /* Remove any unwanted shadow backgrounds */
        div[style*="elevation"] {
          background: transparent !important;
        }

        /* Ensure icons don't get white backgrounds from shadows */
        svg, i, span[role="img"] {
          background: transparent !important;
        }

        /* Desktop-optimized page transitions and animations */
        @media (pointer: fine) {
          /* Smooth page transitions */
          .react-navigation-screen {
            transition: opacity 0.15s ease-in-out !important;
          }

          /* Reduce motion for desktop users who prefer it */
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01s !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01s !important;
            }
          }

          /* Smooth scrolling for better desktop UX */
          html {
            scroll-behavior: smooth;
          }

          /* Desktop hover states for clickable elements */
          div[role="button"]:hover,
          button:hover {
            transform: scale(1.02) !important;
            transition: transform 0.1s ease !important;
          }

          div[role="button"]:active,
          button:active {
            transform: scale(0.98) !important;
          }

          /* Desktop focus indicators */
          div[role="button"]:focus-visible,
          button:focus-visible {
            outline: 2px solid #6ec5ff !important;
            outline-offset: 2px !important;
          }

          /* Smooth opacity transitions for content loading */
          div[data-testid*="screen"] {
            transition: opacity 0.15s ease-in-out !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return <SimpleApp />;
};

export default App;