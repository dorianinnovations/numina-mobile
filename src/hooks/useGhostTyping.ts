import { useState, useEffect, useRef } from 'react';

// Constants for typing behavior
const TYPING_SPEEDS = {
  NORMAL: 35, // Faster from 65
  SPACE: 45, // Faster from 85
  WORD_START: 40, // Faster from 75
  TYPO_CHANCE: 0.015,
  TYPO_PAUSE: 100, // Faster from 150
  COMPLETE_PAUSE: 800, // Faster from 1200
  BACKSPACE_SPACE: 15, // Faster from 25
  BACKSPACE_WORD: 20, // Faster from 35
  BACKSPACE_NORMAL: 18, // Faster from 28
} as const;

const TYPO_PATTERNS: Record<string, string[]> = {
  'e': ['w', 'r'], 'r': ['e', 't'], 't': ['r', 'y'], 'y': ['t', 'u'],
  'u': ['y', 'i'], 'i': ['u', 'o'], 'o': ['i', 'p'], 'a': ['s', 'q'],
  's': ['a', 'd'], 'd': ['s', 'f'], 'f': ['d', 'g'], 'g': ['f', 'h'],
  'h': ['g', 'j'], 'j': ['h', 'k'], 'k': ['j', 'l'], 'l': ['k'],
  'z': ['x'], 'x': ['z', 'c'], 'c': ['x', 'v'], 'v': ['c', 'b'],
  'b': ['v', 'n'], 'n': ['b', 'm'], 'm': ['n'],
};

const GHOST_TYPING_EXAMPLES = [
  "explore my relationships with creativity",
  "find patterns in my decision making",
  "think about my career growth trajectory", 
  "connect my emotions to daily routines",
  "write about overcoming recent challenges",
  "imagine my ideal work environment",
  "analyze my communication patterns",
  "discover hidden productivity habits",
  "explore what motivates me most",
  "find connections between my goals",
  "think through my learning preferences",
  "write about meaningful relationships",
  "connect my values to actions",
  "imagine breakthrough moments",
  "analyze my stress responses",
  "understand my perfectionist tendencies",
  "explore creative blocks and breakthroughs",
  "think about work-life boundaries",
  "connect past experiences to present choices",
  "write about moments of clarity",
  "analyze my leadership style evolution",
  "discover what drains my energy",
  "imagine my future self's perspective",
  "find patterns in my social interactions",
  "explore financial mindset and habits",
  "think about legacy and impact",
  "connect childhood influences to adult behaviors",
  "write about overcoming fear and doubt",
  "analyze seasonal mood changes",
  "discover my authentic voice and expression"
];

const getRandomStartIndex = () => {
  const timestamp = Date.now();
  const randomSeed = Math.sin(timestamp) * 10000;
  return Math.floor((randomSeed - Math.floor(randomSeed)) * GHOST_TYPING_EXAMPLES.length);
};

interface UseGhostTypingProps {
  isInputFocused: boolean;
  inputText: string;
  isProcessing: boolean;
  showChainOfThought: boolean;
}

interface UseGhostTypingReturn {
  ghostText: string;
  isTyping: boolean;
  isBackspacing: boolean;
  isCorrectingTypo: boolean;
  showingCursorOnly: boolean;
  isDismissing: boolean;
}

export const useGhostTyping = ({
  isInputFocused,
  inputText,
  isProcessing,
  showChainOfThought,
}: UseGhostTypingProps): UseGhostTypingReturn => {
  const [ghostText, setGhostText] = useState('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(() => getRandomStartIndex());
  const [isTyping, setIsTyping] = useState(false);
  const [isBackspacing, setIsBackspacing] = useState(false);
  const [isCorrectingTypo, setIsCorrectingTypo] = useState(false);
  const [showingCursorOnly, setShowingCursorOnly] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    // Reset active state when effect runs
    isActiveRef.current = true;
    
    if (isInputFocused || inputText.length > 0 || isProcessing || showChainOfThought) {
      // Trigger dismiss animation if there's content to dismiss
      if (!isDismissing && (ghostText || !showingCursorOnly)) {
        setIsDismissing(true);
        // Clear content after animation
        setTimeout(() => {
          setGhostText('');
          setIsTyping(false);
          setIsBackspacing(false);
          setIsCorrectingTypo(false);
          setShowingCursorOnly(true);
          setIsDismissing(false);
        }, 300); // Match animation duration
      } else if (!ghostText && showingCursorOnly) {
        // Already clean, just reset states
        setIsTyping(false);
        setIsBackspacing(false);
        setIsCorrectingTypo(false);
        setIsDismissing(false);
      }
      return;
    }

    // Phase 1: Show solo blinking cursor to invite user interaction (4 seconds)
    setShowingCursorOnly(true);
    setGhostText('');
    setIsTyping(false);
    setIsBackspacing(false);
    setIsCorrectingTypo(false);

    const shouldMakeTypo = () => Math.random() < TYPING_SPEEDS.TYPO_CHANCE;
    const getTypoFor = (char: string) => {
      const typos = TYPO_PATTERNS[char.toLowerCase()];
      return typos ? typos[Math.floor(Math.random() * typos.length)] : char;
    };

    const startGhostTyping = () => {
      if (!isActiveRef.current) return;
      
      // End the cursor-only phase
      setShowingCursorOnly(false);
      
      const currentExample = GHOST_TYPING_EXAMPLES[currentExampleIndex];
      let charIndex = 0;
      let targetText = currentExample;
      let hasTypo = false;
      let typoPosition = -1;
      
      setIsTyping(true);
      setIsBackspacing(false);
      setIsCorrectingTypo(false);

      const typeChar = () => {
        if (!isActiveRef.current) return;
        
        if (charIndex < targetText.length) {
          const currentChar = targetText[charIndex];
          let charToType = currentChar;
          
          if (!hasTypo && charIndex > 2 && currentChar !== ' ' && shouldMakeTypo()) {
            charToType = getTypoFor(currentChar);
            hasTypo = true;
            typoPosition = charIndex;
          }
          
          const newText = targetText.substring(0, charIndex) + charToType;
          setGhostText(newText);
          charIndex++;
          
          if (hasTypo && charIndex === typoPosition + 1) {
            const pauseBeforeCorrection = TYPING_SPEEDS.TYPO_PAUSE + Math.random() * 100;
            typingTimeoutRef.current = setTimeout(() => {
              startTypoCorrection(typoPosition, currentChar);
            }, pauseBeforeCorrection);
            return;
          }
          
          let typingSpeed;
          if (currentChar === ' ') {
            typingSpeed = TYPING_SPEEDS.SPACE + Math.random() * 15;
          } else if (charIndex === 1 || targetText[charIndex - 2] === ' ') {
            typingSpeed = TYPING_SPEEDS.WORD_START + Math.random() * 20;
          } else {
            typingSpeed = TYPING_SPEEDS.NORMAL + Math.random() * 10;
          }
          
          typingTimeoutRef.current = setTimeout(typeChar, typingSpeed);
        } else {
          const completePause = TYPING_SPEEDS.COMPLETE_PAUSE + Math.random() * 800;
          typingTimeoutRef.current = setTimeout(startBackspacing, completePause);
        }
      };

      const startTypoCorrection = (typoPos: number, correctChar: string) => {
        if (!isActiveRef.current) return;
        
        setIsCorrectingTypo(true);
        setIsTyping(false);
        
        const correctionText = targetText.substring(0, typoPos);
        setGhostText(correctionText);
        
        typingTimeoutRef.current = setTimeout(() => {
          if (!isActiveRef.current) return;
          
          const correctedText = correctionText + correctChar;
          setGhostText(correctedText);
          charIndex = typoPos + 1;
          hasTypo = false;
          typoPosition = -1;
          
          setIsCorrectingTypo(false);
          setIsTyping(true);
          
          const resumeSpeed = 30 + Math.random() * 10;
          typingTimeoutRef.current = setTimeout(typeChar, resumeSpeed);
        }, 50 + Math.random() * 30);
      };

      const startBackspacing = () => {
        if (!isActiveRef.current) return;
        
        setIsTyping(false);
        setIsBackspacing(true);
        let currentLength = targetText.length;

        const backspaceChar = () => {
          if (!isActiveRef.current) return;
          
          if (currentLength > 0) {
            currentLength--;
            const newText = targetText.substring(0, currentLength);
            setGhostText(newText);
            
            let backspaceSpeed;
            if (currentLength > 0 && targetText[currentLength] === ' ') {
              backspaceSpeed = TYPING_SPEEDS.BACKSPACE_SPACE + Math.random() * 5;
            } else if (currentLength > 0 && targetText[currentLength - 1] === ' ') {
              backspaceSpeed = TYPING_SPEEDS.BACKSPACE_WORD + Math.random() * 10;
            } else {
              backspaceSpeed = TYPING_SPEEDS.BACKSPACE_NORMAL + Math.random() * 4;
            }
            
            typingTimeoutRef.current = setTimeout(backspaceChar, backspaceSpeed);
          } else {
            setIsBackspacing(false);
            setGhostText('');
            setShowingCursorOnly(true); // Return to cursor-only phase
            setCurrentExampleIndex((prev) => (prev + 1) % GHOST_TYPING_EXAMPLES.length);
            // Shorter pause before next ghost typing cycle (2-3 seconds)
            typingTimeoutRef.current = setTimeout(startGhostTyping, 2000 + Math.random() * 1000);
          }
        };

        backspaceChar();
      };

      typeChar();
    };

    // Phase 2: After 1.5 seconds total, start ghost typing
    const ghostStartDelay = 1500 + Math.random() * 500; // 1.5-2 seconds
    typingTimeoutRef.current = setTimeout(startGhostTyping, ghostStartDelay);

    return () => {
      isActiveRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setGhostText('');
      setIsTyping(false);
      setIsBackspacing(false);
      setIsCorrectingTypo(false);
      setShowingCursorOnly(true);
      setIsDismissing(false);
    };
  }, [isInputFocused, inputText, isProcessing, showChainOfThought, currentExampleIndex]);

  return {
    ghostText,
    isTyping,
    isBackspacing,
    isCorrectingTypo,
    showingCursorOnly,
    isDismissing,
  };
}; 