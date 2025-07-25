import React from 'react';
import { Text, TextStyle, Animated } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTypewriter } from '../../hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  style?: TextStyle | TextStyle[];
  speed?: number;
  showCursor?: boolean;
  cursorStyle?: TextStyle;
  cursorChar?: string;
  onComplete?: () => void;
  onStart?: () => void;
  autoStart?: boolean;
  children?: never;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  style,
  speed = 20,
  showCursor = true,
  cursorStyle,
  cursorChar = '|',
  onComplete,
  onStart,
  autoStart = true,
}) => {
  const { isDarkMode } = useTheme();
  
  const {
    displayedText,
    isTyping,
    cursorOpacity,
    isComplete
  } = useTypewriter(text, {
    speed,
    onComplete,
    onStart,
    autoStart,
  });

  const defaultCursorStyle: TextStyle = {
    color: isDarkMode ? '#add5fa' : '#3b82f6',
    fontWeight: '300',
    ...cursorStyle,
  };

  return (
    <Text style={style}>
      {displayedText}
      {showCursor && (isTyping || !isComplete) && (
        <Animated.Text
          style={[
            defaultCursorStyle,
            { opacity: cursorOpacity }
          ]}
        >
          {cursorChar}
        </Animated.Text>
      )}
    </Text>
  );
};