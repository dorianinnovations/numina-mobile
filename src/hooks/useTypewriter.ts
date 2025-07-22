import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface TypewriterOptions {
  speed?: number;
  minSpeed?: number;
  maxSpeed?: number;
  cursorBlinkSpeed?: number;
  onComplete?: () => void;
  onStart?: () => void;
  autoStart?: boolean;
}

interface TypewriterResult {
  displayedText: string;
  isTyping: boolean;
  cursorOpacity: Animated.Value;
  start: () => void;
  stop: () => void;
  reset: () => void;
  isComplete: boolean;
}

export const useTypewriter = (
  text: string,
  options: TypewriterOptions = {}
): TypewriterResult => {
  const {
    speed = 20,
    minSpeed = 10,
    maxSpeed = 50,
    cursorBlinkSpeed = 530,
    onComplete,
    onStart,
    autoStart = true
  } = options;

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const isActiveRef = useRef(true);

  // Dynamic typing speed based on content
  const calculateSpeed = useCallback((char: string, index: number): number => {
    // Slower for punctuation
    if (['.', '!', '?', ',', ';', ':'].includes(char)) {
      return Math.max(speed * 3, maxSpeed);
    }
    
    // Faster for spaces
    if (char === ' ') {
      return Math.max(speed * 0.5, minSpeed);
    }
    
    // Variable speed for natural feel
    const variation = Math.random() * 0.4 + 0.8; // 0.8-1.2x variation
    return Math.max(Math.min(speed * variation, maxSpeed), minSpeed);
  }, [speed, minSpeed, maxSpeed]);

  // Cursor blinking animation
  const startCursorBlink = useCallback(() => {
    const blink = () => {
      if (!isActiveRef.current) return;
      
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: cursorBlinkSpeed / 2,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: cursorBlinkSpeed / 2,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isActiveRef.current) {
          blink();
        }
      });
    };
    blink();
  }, [cursorOpacity, cursorBlinkSpeed]);

  // Stop cursor blinking
  const stopCursorBlink = useCallback(() => {
    cursorOpacity.stopAnimation();
    cursorOpacity.setValue(0);
  }, [cursorOpacity]);

  // Typewriter animation logic
  const typeCharacter = useCallback(() => {
    if (!isActiveRef.current || indexRef.current >= text.length) {
      setIsTyping(false);
      setIsComplete(true);
      stopCursorBlink();
      onComplete?.();
      return;
    }

    const currentChar = text[indexRef.current];
    setDisplayedText(text.slice(0, indexRef.current + 1));
    
    const nextSpeed = calculateSpeed(currentChar, indexRef.current);
    indexRef.current += 1;
    
    timeoutRef.current = setTimeout(typeCharacter, nextSpeed);
  }, [text, calculateSpeed, stopCursorBlink, onComplete]);

  // Start typing
  const start = useCallback(() => {
    if (!isActiveRef.current) return;
    
    setIsTyping(true);
    setIsComplete(false);
    onStart?.();
    startCursorBlink();
    typeCharacter();
  }, [typeCharacter, startCursorBlink, onStart]);

  // Stop typing
  const stop = useCallback(() => {
    setIsTyping(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopCursorBlink();
  }, [stopCursorBlink]);

  // Reset to beginning
  const reset = useCallback(() => {
    stop();
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;
  }, [stop]);

  // Auto-start when text changes
  useEffect(() => {
    if (autoStart && text && isActiveRef.current) {
      reset();
      // Small delay for smooth transition
      const startTimeout = setTimeout(start, 50);
      return () => clearTimeout(startTimeout);
    }
  }, [text, autoStart, reset, start]);

  // Cleanup on unmount
  useEffect(() => {
    isActiveRef.current = true;
    
    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cursorOpacity.stopAnimation();
    };
  }, [cursorOpacity]);

  return {
    displayedText,
    isTyping,
    cursorOpacity,
    start,
    stop,
    reset,
    isComplete
  };
};