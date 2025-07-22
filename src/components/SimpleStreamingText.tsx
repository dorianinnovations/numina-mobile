import React, { useState, useEffect, useRef } from 'react';
import { Text, TextStyle } from 'react-native';

interface SimpleStreamingTextProps {
  text: string;
  style?: TextStyle | TextStyle[];
  speed?: number;
  onComplete?: () => void;
}

export const SimpleStreamingText: React.FC<SimpleStreamingTextProps> = ({
  text,
  style,
  speed = 30,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) return;
    
    // Reset for new text
    setDisplayedText('');
    setShowCursor(true);
    indexRef.current = 0;
    
    const streamText = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
        timeoutRef.current = setTimeout(streamText, speed);
      } else {
        setShowCursor(false);
        onComplete?.();
      }
    };

    // Start streaming
    timeoutRef.current = setTimeout(streamText, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <Text style={style}>
      {displayedText}
      {showCursor && <Text style={{ opacity: 0.7 }}>|</Text>}
    </Text>
  );
};