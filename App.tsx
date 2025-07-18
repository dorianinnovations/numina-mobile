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
        /* Fix text input focus issues - CRITICAL for single click activation */
        input, textarea {
          outline: none !important;
          user-select: text !important;
          cursor: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          -webkit-tap-highlight-color: transparent !important;
          pointer-events: auto !important;
          touch-action: manipulation !important;
        }

        /* React Native Web TextInput specific fixes */
        div[data-focusable="true"] input,
        div[data-focusable="true"] textarea,
        input[data-testid="chat-input"],
        .react-native-web-text-input {
          user-select: text !important;
          -webkit-user-select: text !important;
          pointer-events: auto !important;
          cursor: text !important;
          touch-action: manipulation !important;
          -webkit-tap-highlight-color: transparent !important;
        }

        /* Force text input behavior on all React Native inputs */
        div[style*="border"] input,
        div[role="textbox"] input {
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
          pointer-events: auto !important;
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

        /* Ensure proper text input behavior - CRITICAL FIX */
        div[data-focusable="true"] input,
        div[data-focusable="true"] textarea {
          user-select: text !important;
          -webkit-user-select: text !important;
          pointer-events: auto !important;
          cursor: text !important;
          touch-action: manipulation !important;
        }

        /* Fix React Native Web text input containers */
        div[data-focusable="true"],
        div[style*="position: relative"] {
          pointer-events: auto !important;
        }

        /* Override React Native Web's input event blocking */
        div[style*="text"] input {
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }

        /* Force click activation for all text inputs */
        input[type="text"]:not(:focus) {
          pointer-events: auto !important;
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
          /* Smooth page transitions with dark mode support */
          .react-navigation-screen {
            transition: opacity 0.15s ease-in-out !important;
          }

          /* Dark mode page transitions - prevent white flash */
          @media (prefers-color-scheme: dark) {
            body, html, #root {
              background-color: #000000 !important;
            }
            
            .react-navigation-screen {
              background-color: #000000 !important;
            }
          }

          /* Light mode page transitions */
          @media (prefers-color-scheme: light) {
            body, html, #root {
              background-color: #ffffff !important;
            }
            
            .react-navigation-screen {
              background-color: #ffffff !important;
            }
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

          /* React Navigation container dark mode support */
          .react-navigation-container {
            background-color: inherit !important;
          }

          /* All React Native Views respect theme */
          div[style*="position: absolute"],
          div[style*="flex: 1"] {
            background-color: inherit !important;
          }
        }

        /* Universal dark mode background fix */
        @media (prefers-color-scheme: dark) {
          * {
            background-color: inherit !important;
          }
          
          /* Root elements must be dark */
          body, html, #root, #__next {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
        }

        /* Universal light mode background fix */
        @media (prefers-color-scheme: light) {
          /* Root elements must be light */
          body, html, #root, #__next {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
        }
      `;
      document.head.appendChild(style);

      // Set initial theme-based background color
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.style.backgroundColor = isDarkMode ? '#000000' : '#ffffff';
      document.body.style.backgroundColor = isDarkMode ? '#000000' : '#ffffff';

      // CRITICAL FIX: JavaScript handler for input field click activation
      const handleInputClick = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          // Force focus on click
          (target as HTMLInputElement).focus();
          // Prevent any parent handlers from interfering
          event.stopPropagation();
        }
      };

      // Add click handlers to ensure text inputs activate on first click
      document.addEventListener('click', handleInputClick, true);
      document.addEventListener('mousedown', handleInputClick, true);

      // Cleanup function
      return () => {
        document.removeEventListener('click', handleInputClick, true);
        document.removeEventListener('mousedown', handleInputClick, true);
      };
    }
  }, []);

  return <SimpleApp />;
};

export default App;