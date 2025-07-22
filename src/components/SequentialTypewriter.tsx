import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTypewriter } from '../hooks/useTypewriter';

interface SequentialTypewriterProps {
  title: string;
  description: string;
  titleStyle?: TextStyle | TextStyle[];
  descriptionStyle?: TextStyle | TextStyle[];
  titleSpeed?: number;
  descriptionSpeed?: number;
  showCursor?: boolean;
  cursorChar?: string;
  onTitleComplete?: () => void;
  onDescriptionComplete?: () => void;
  step: number; // Used to trigger reset when step changes
}

export const SequentialTypewriter: React.FC<SequentialTypewriterProps> = ({
  title,
  description,
  titleStyle,
  descriptionStyle,
  titleSpeed = 30,
  descriptionSpeed = 15,
  showCursor = true,
  cursorChar = '|',
  onTitleComplete,
  onDescriptionComplete,
  step,
}) => {
  const { isDarkMode } = useTheme();
  const [showDescription, setShowDescription] = useState(false);
  const previousStepRef = useRef(step);

  // Title typewriter
  const titleTypewriter = useTypewriter(title, {
    speed: titleSpeed,
    onComplete: () => {
      setShowDescription(true);
      onTitleComplete?.();
    },
    autoStart: true,
  });

  // Description typewriter (only starts when title is complete)
  const descriptionTypewriter = useTypewriter(showDescription ? description : '', {
    speed: descriptionSpeed,
    onComplete: onDescriptionComplete,
    autoStart: showDescription,
  });

  // Reset everything when step changes
  useEffect(() => {
    if (step !== previousStepRef.current) {
      setShowDescription(false);
      titleTypewriter.reset();
      descriptionTypewriter.reset();
      previousStepRef.current = step;
      
      // Small delay then restart
      setTimeout(() => {
        titleTypewriter.start();
      }, 100);
    }
  }, [step, titleTypewriter, descriptionTypewriter]);

  const defaultCursorStyle: TextStyle = {
    color: isDarkMode ? '#add5fa' : '#3b82f6',
    fontWeight: '300',
  };

  return (
    <>
      {/* Title */}
      <Text style={titleStyle}>
        {titleTypewriter.displayedText}
        {showCursor && titleTypewriter.isTyping && (
          <Animated.Text
            style={[defaultCursorStyle, { opacity: titleTypewriter.cursorOpacity }]}
          >
            {cursorChar}
          </Animated.Text>
        )}
      </Text>

      {/* Description */}
      {showDescription && (
        <Text style={descriptionStyle}>
          {descriptionTypewriter.displayedText}
          {showCursor && descriptionTypewriter.isTyping && (
            <Animated.Text
              style={[defaultCursorStyle, { opacity: descriptionTypewriter.cursorOpacity }]}
            >
              {cursorChar}
            </Animated.Text>
          )}
        </Text>
      )}
    </>
  );
};