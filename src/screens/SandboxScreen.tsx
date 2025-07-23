import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  Keyboard,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Feather, 
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ChromaticCard } from '../components/ChromaticCard';
import { BaseWalletCard } from '../components/WalletCard';
import { EnhancedSpinner } from '../components/EnhancedSpinner';
import SandboxDataService from '../services/sandboxDataService';
import CloudAuth from '../services/cloudAuth';
import { API_BASE_URL } from '../services/api';
import WebSocketService from '../services/websocketService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SandboxScreenProps {
  onNavigateBack?: () => void;
}

interface SandboxAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

interface SandboxNode {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  connections: string[];
  personalHook?: string;
  confidence: number;
  category: string;
  isLocked: boolean;
  lockTimestamp?: string;
  isInsightNode?: boolean;
  patternType?: 'hidden_pattern' | 'behavioral_insight' | 'emotional_pattern' | 'temporal_connection';
  deepInsights?: {
    summary: string;
    keyPatterns: string[];
    personalizedContext: string;
    dataConnections: Array<{
      type: string;
      value: any;
      source: string;
    }>;
    relevanceScore: number;
  };
  userDataContext?: {
    ubpmData?: any;
    behavioralMetrics?: any;
    emotionalProfile?: any;
    temporalPatterns?: any;
  };
}

interface WindowTidBit {
  id: string;
  content: string;
  source: string;
  type: 'finding' | 'evidence' | 'data_point' | 'connection';
  relevanceScore: number;
  attachable: boolean;
}

interface WindowQueryResponse {
  synthesis: string;
  tidBits: WindowTidBit[];
  researchDirections: string[];
  sourcesMeta: {
    webSources: number;
    academicSources: number;
    totalSources: number;
  };
}

const SANDBOX_ACTIONS: SandboxAction[] = [
  {
    id: 'write',
    label: 'write',
    icon: 'edit-3',
    color: '#3B82F6',
    description: 'Express thoughts and ideas'
  },
  {
    id: 'think',
    label: 'think',
    icon: 'zap',
    color: '#8B5CF6',
    description: 'Deep analytical processing'
  },
  {
    id: 'find',
    label: 'find',
    icon: 'search',
    color: '#10B981',
    description: 'Discover connections'
  },
  {
    id: 'imagine',
    label: 'imagine',
    icon: 'aperture',
    color: '#F59E0B',
    description: 'Creative exploration'
  },
  {
    id: 'connect',
    label: 'connect',
    icon: 'link',
    color: '#EC4899',
    description: 'Find relationships'
  },
  {
    id: 'explore',
    label: 'explore',
    icon: 'compass',
    color: '#06B6D4',
    description: 'Venture into unknown'
  }
];

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

// Common typo patterns for realistic human typing
const TYPO_PATTERNS: Record<string, string[]> = {
  // Adjacent key typos (QWERTY layout)
  'e': ['w', 'r'],
  'r': ['e', 't'],
  't': ['r', 'y'],
  'y': ['t', 'u'],
  'u': ['y', 'i'],
  'i': ['u', 'o'],
  'o': ['i', 'p'],
  'a': ['s', 'q'],
  's': ['a', 'd'],
  'd': ['s', 'f'],
  'f': ['d', 'g'],
  'g': ['f', 'h'],
  'h': ['g', 'j'],
  'j': ['h', 'k'],
  'k': ['j', 'l'],
  'l': ['k'],
  'z': ['x'],
  'x': ['z', 'c'],
  'c': ['x', 'v'],
  'v': ['c', 'b'],
  'b': ['v', 'n'],
  'n': ['b', 'm'],
  'm': ['n'],
};

// Initialize random starting index (never starts on the same one)
const getRandomStartIndex = () => {
  const timestamp = Date.now();
  const randomSeed = Math.sin(timestamp) * 10000;
  return Math.floor((randomSeed - Math.floor(randomSeed)) * GHOST_TYPING_EXAMPLES.length);
};

export const SandboxScreen: React.FC<SandboxScreenProps> = ({ 
  onNavigateBack 
}) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const pillsAnim = useRef(new Animated.Value(0)).current;
  const inputContainerAnim = useRef(new Animated.Value(0)).current; // For centering input
  const contentOffsetAnim = useRef(new Animated.Value(0)).current;
  const buttonContentAnim = useRef(new Animated.Value(1)).current; // For button content transitions
  const textInputRef = useRef<TextInput>(null);

  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showUBPMModal, setShowUBPMModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ghost typing effect state
  const [ghostText, setGhostText] = useState('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(() => getRandomStartIndex());
  const [isTyping, setIsTyping] = useState(false);
  const [isBackspacing, setIsBackspacing] = useState(false);
  const [isCorrectingTypo, setIsCorrectingTypo] = useState(false);
  const [nodes, setNodes] = useState<SandboxNode[]>([]);
  const [showNodes, setShowNodes] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SandboxNode | null>(null);
  const [lockedNodes, setLockedNodes] = useState<SandboxNode[]>([]);
  const [nodeConnections, setNodeConnections] = useState<Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>>([]);
  const sendButtonAnim = useRef(new Animated.Value(0)).current;
  const sendButtonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Window Modal state
  const [showWindowModal, setShowWindowModal] = useState(false);
  const [windowQuery, setWindowQuery] = useState('');
  const [windowResults, setWindowResults] = useState<WindowQueryResponse | null>(null);
  const [isWindowLoading, setIsWindowLoading] = useState(false);
  const [attachingTidBit, setAttachingTidBit] = useState<string | null>(null);
  
  // Node Modal size state
  const [nodeModalSize, setNodeModalSize] = useState<'standard' | 'xl' | 'fullscreen'>('standard');

  // Pill animation state management
  const pillAnimations = useRef<Map<string, {
    scale: Animated.Value;
  }>>(new Map()).current;
  
  // Initialize pill animations for each action
  useEffect(() => {
    SANDBOX_ACTIONS.forEach(action => {
      if (!pillAnimations.has(action.id)) {
        pillAnimations.set(action.id, {
          scale: new Animated.Value(1),
        });
      }
    });
  }, []);

  // Node animation refs
  const nodeAnims = useRef<Map<string, {
    opacity: Animated.Value;
    scale: Animated.Value;
    translateY: Animated.Value;
    glow?: Animated.Value;
    pulse?: Animated.Value;
  }>>(new Map()).current;

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // VS Code terminal-style cursor blinking with consistent timing
    let cursorAnimationRef: any;
    
    const blinkCursor = () => {
      let blinkOnDuration, blinkOffDuration;
      
      if (isCorrectingTypo) {
        // Fast pulsing during typo correction
        blinkOnDuration = 30;
        blinkOffDuration = 30;
      } else if (isTyping) {
        // Steady fast blink during typing - like VS Code when active
        blinkOnDuration = 80;
        blinkOffDuration = 80;
      } else if (isBackspacing) {
        // Quick blink during deletion
        blinkOnDuration = 50;
        blinkOffDuration = 50;
      } else {
        // VS Code terminal default: 530ms visible, 530ms hidden (1.06s cycle)
        blinkOnDuration = 530;
        blinkOffDuration = 530;
      }
      
      cursorAnimationRef = Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: blinkOffDuration,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: blinkOnDuration,
          useNativeDriver: true,
        }),
      ]);
      
      cursorAnimationRef.start(() => blinkCursor());
    };
    
    blinkCursor();

    return () => {
      if (cursorAnimationRef) {
        cursorAnimationRef.stop();
      }
    };
  }, [isTyping, isBackspacing, isCorrectingTypo]);

  useEffect(() => {
    // Keyboard listeners
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const keyboardHeight = e.endCoordinates.height;
        // Move content up by 40% of keyboard height to keep pills visible
        Animated.timing(contentOffsetAnim, {
          toValue: -keyboardHeight * 0.4,
          duration: Platform.OS === 'ios' ? 250 : 200,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(contentOffsetAnim, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? 250 : 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Simple, fast opacity animation for pills
    Animated.timing(pillsAnim, {
      toValue: isInputFocused ? 1 : 0,
      duration: 150, // Nearly instant
      useNativeDriver: true,
    }).start();

    // Keep the centered input positioning
    Animated.timing(inputContainerAnim, {
      toValue: isInputFocused ? -40 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isInputFocused]);

  useEffect(() => {
    // Animate send button when user types or selects actions
    const shouldShowButton = inputText.trim().length > 0 || selectedActions.length > 0;
    
    if (shouldShowButton) {
      setTimeout(() => {
        Animated.timing(sendButtonAnim, {
          toValue: 1,
          duration: 400, // Faster animation for better responsiveness
          useNativeDriver: true,
        }).start();
      }, 50);
    } else {
      Animated.timing(sendButtonAnim, {
        toValue: 0,
        duration: 200, // Quick fade out
        useNativeDriver: true,
      }).start();
    }

    // Subtle input container adjustment as text grows to maintain visual balance
    if (isInputFocused) {
      const textLength = inputText.length;
      const adjustmentOffset = Math.min(textLength * 0.3, 15); // Max 15px adjustment
      
      Animated.timing(inputContainerAnim, {
        toValue: -40 + adjustmentOffset, // Gradually move back toward center as text grows
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [inputText, selectedActions, isInputFocused]);

  // Animate button content changes when actions change
  useEffect(() => {
    // Quick fade out and in for smooth content transitions
    Animated.sequence([
      Animated.timing(buttonContentAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonContentAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  }, [selectedActions]);

  // Keyboard event listeners for better UX
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsInputFocused(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (inputText.length === 0 && selectedActions.length === 0) {
        setIsInputFocused(false);
      }
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [inputText, selectedActions]);

  // WebSocket integration for real-time Insight Node delivery
  useEffect(() => {
    const setupInsightNodeListener = async () => {
      try {
        const webSocketService = WebSocketService();
        
        // Ensure WebSocket is connected
        await webSocketService.initialize();
        
        // Listen for Pattern Engine insight discoveries
        const handleInsightNodeArrival = (data: any) => {
          console.log('🔮 Insight Node arriving:', data);
          
          if (data.type === 'insight_discovery' && data.insightNode) {
            const insightNode: SandboxNode = {
              ...data.insightNode,
              isInsightNode: true,
              position: data.insightNode.position || {
                x: Math.random() * (screenWidth - 120) + 60,
                y: Math.random() * (screenHeight - 400) + 200,
              }
            };
            
            // Trigger the breathtaking arrival animation
            createInsightArrivalAnimation(insightNode);
            
            // Add to nodes state with a small delay to ensure animation is ready
            setTimeout(() => {
              setNodes(prevNodes => [...prevNodes, insightNode]);
              
              // Save the new insight node to backend
              SandboxDataService.saveInsightNode(insightNode).catch(error => {
                console.warn('Failed to save insight node:', error);
              });
            }, 100);
          }
        };
        
        // Listen for pattern analysis events
        const handlePatternAnalysis = (data: any) => {
          console.log('🧠 Pattern analysis result:', data);
          
          if (data.type === 'pattern_triggered' && data.analysis?.shouldCreateInsightNode) {
            // This will trigger the actual insight node creation on the backend
            // which will then send the insight_discovery event
            console.log('Pattern Engine triggered insight creation');
          }
        };
        
        // Register event listeners
        webSocketService.addEventListener('insight_discovery', handleInsightNodeArrival);
        webSocketService.addEventListener('pattern_analysis', handlePatternAnalysis);
        webSocketService.addEventListener('pattern_triggered', handlePatternAnalysis);
        
        // Cleanup function
        return () => {
          webSocketService.removeEventListener('insight_discovery', handleInsightNodeArrival);
          webSocketService.removeEventListener('pattern_analysis', handlePatternAnalysis);
          webSocketService.removeEventListener('pattern_triggered', handlePatternAnalysis);
        };
        
      } catch (error) {
        console.warn('Failed to setup WebSocket insight listener:', error);
      }
    };
    
    setupInsightNodeListener();
  }, []);

  // Advanced ghost typing effect with human-like variations and typos
  useEffect(() => {
    if (isInputFocused || inputText.length > 0 || isProcessing) {
      setGhostText('');
      setIsTyping(false);
      setIsBackspacing(false);
      setIsCorrectingTypo(false);
      return;
    }

    let typingTimeoutId: NodeJS.Timeout;
    let isActive = true;

    const shouldMakeTypo = () => Math.random() < 0.015; // 1.5% chance of typo (very subtle)
    const getTypoFor = (char: string) => {
      const typos = TYPO_PATTERNS[char.toLowerCase()];
      return typos ? typos[Math.floor(Math.random() * typos.length)] : char;
    };

    const startGhostTyping = () => {
      if (!isActive) return;
      
      const currentExample = GHOST_TYPING_EXAMPLES[currentExampleIndex];
      let charIndex = 0;
      let targetText = currentExample;
      let hasTypo = false;
      let typoPosition = -1;
      
      setIsTyping(true);
      setIsBackspacing(false);
      setIsCorrectingTypo(false);

      const typeChar = () => {
        if (!isActive) return;
        
        if (charIndex < targetText.length) {
          const currentChar = targetText[charIndex];
          let charToType = currentChar;
          
          // Randomly introduce typos (but not on spaces or at the very beginning)
          if (!hasTypo && charIndex > 2 && currentChar !== ' ' && shouldMakeTypo()) {
            charToType = getTypoFor(currentChar);
            hasTypo = true;
            typoPosition = charIndex;
          }
          
          const newText = targetText.substring(0, charIndex) + charToType;
          setGhostText(newText);
          charIndex++;
          
          // If we made a typo, pause and then correct it (VS Code style)
          if (hasTypo && charIndex === typoPosition + 1) {
            const pauseBeforeCorrection = 150 + Math.random() * 100; // 150-250ms pause (like a programmer noticing)
            typingTimeoutId = setTimeout(() => {
              startTypoCorrection(typoPosition, currentChar);
            }, pauseBeforeCorrection);
            return;
          }
          
          // VS Code terminal-style consistent typing speed with subtle variations
          let typingSpeed;
          if (currentChar === ' ') {
            typingSpeed = 85 + Math.random() * 15; // Spaces (85-100ms) - more consistent
          } else if (charIndex === 1 || targetText[charIndex - 2] === ' ') {
            typingSpeed = 75 + Math.random() * 20; // Word start (75-95ms) - slight pause for word boundary
          } else {
            typingSpeed = 65 + Math.random() * 10; // Normal speed (65-75ms) - very consistent like terminal
          }
          
          typingTimeoutId = setTimeout(typeChar, typingSpeed);
        } else {
          // Optimized pause before backspacing
          const completePause = 1200 + Math.random() * 800; // 1.2-2s pause (faster)
          typingTimeoutId = setTimeout(startBackspacing, completePause);
        }
      };

      const startTypoCorrection = (typoPos: number, correctChar: string) => {
        if (!isActive) return;
        
        setIsCorrectingTypo(true);
        setIsTyping(false);
        
        // Backspace the typo
        const correctionText = targetText.substring(0, typoPos);
        setGhostText(correctionText);
        
        // Brief pause before typing correct character
        typingTimeoutId = setTimeout(() => {
          if (!isActive) return;
          
          const correctedText = correctionText + correctChar;
          setGhostText(correctedText);
          charIndex = typoPos + 1;
          hasTypo = false;
          typoPosition = -1;
          
          setIsCorrectingTypo(false);
          setIsTyping(true);
          
          // Continue typing after correction (VS Code style - quick resume)
          const resumeSpeed = 60 + Math.random() * 15; // 60-75ms - consistent resume speed
          typingTimeoutId = setTimeout(typeChar, resumeSpeed);
        }, 50 + Math.random() * 30); // 50-80ms pause (quick correction like VS Code)
      };

      const startBackspacing = () => {
        if (!isActive) return;
        
        setIsTyping(false);
        setIsBackspacing(true);
        let currentLength = targetText.length;

        const backspaceChar = () => {
          if (!isActive) return;
          
          if (currentLength > 0) {
            currentLength--;
            const newText = targetText.substring(0, currentLength);
            setGhostText(newText);
            
            // VS Code terminal-style backspacing - consistent and smooth
            let backspaceSpeed;
            if (currentLength > 0 && targetText[currentLength] === ' ') {
              backspaceSpeed = 25 + Math.random() * 5; // Spaces (25-30ms) - consistent fast
            } else if (currentLength > 0 && targetText[currentLength - 1] === ' ') {
              backspaceSpeed = 35 + Math.random() * 10; // Word boundaries (35-45ms) - slight pause
            } else {
              backspaceSpeed = 28 + Math.random() * 4; // Normal speed (28-32ms) - very consistent like terminal
            }
            
            typingTimeoutId = setTimeout(backspaceChar, backspaceSpeed);
          } else {
            setIsBackspacing(false);
            setGhostText(''); // Ensure clean state
            // Move to next example and pause before starting
            setCurrentExampleIndex((prev) => (prev + 1) % GHOST_TYPING_EXAMPLES.length);
            typingTimeoutId = setTimeout(startGhostTyping, 600 + Math.random() * 400); // 0.6-1s pause (faster)
          }
        };

        backspaceChar();
      };

      typeChar();
    };

    // Optimized initial delay
    const initialDelay = 500 + Math.random() * 400; // 0.5-0.9s (faster start)
    typingTimeoutId = setTimeout(startGhostTyping, initialDelay);

    return () => {
      isActive = false;
      if (typingTimeoutId) {
        clearTimeout(typingTimeoutId);
      }
      setGhostText('');
      setIsTyping(false);
      setIsBackspacing(false);
      setIsCorrectingTypo(false);
    };
  }, [isInputFocused, inputText, isProcessing, currentExampleIndex]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
    NuminaAnimations.haptic.light();
  };

  const handleInputBlur = () => {
    if (inputText.length === 0 && selectedActions.length === 0) {
      setIsInputFocused(false);
    }
  };

  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
  };

  // Get dynamic send button icon based on selected actions
  const getSendButtonIcon = () => {
    if (selectedActions.length === 0) {
      return 'send'; // Default send icon
    }
    
    if (selectedActions.length === 1) {
      const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      return selectedAction?.icon || 'send';
    }
    
    // Multiple actions - use a plus icon
    return 'plus'; // Indicates multiple actions
  };

  // Get dynamic send button color based on selected actions
  const getSendButtonColor = () => {
    if (selectedActions.length === 0) {
      return '#1a1a1a'; // Default dark color
    }
    
    if (selectedActions.length === 1) {
      const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      return selectedAction?.color || '#1a1a1a';
    }
    
    // Multiple actions - use a gradient-like color
    return '#8B5CF6'; // Purple for multi-action
  };

  // Render multi-action send button content
  const renderSendButtonContent = () => {
    if (selectedActions.length === 0) {
      return <Feather name="send" size={17} color="#1a1a1a" />;
    }
    
    if (selectedActions.length === 1) {
      const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      return (
        <Feather 
          name={selectedAction?.icon || 'send'} 
          size={17} 
          color={selectedAction?.color || '#1a1a1a'} 
        />
      );
    }
    
    if (selectedActions.length === 2) {
      // Show both icons side by side for exactly 2 actions
      const action1 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      const action2 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[1]);
      
      return (
        <View style={styles.dualIconContainer}>
          <Feather 
            name={action1?.icon || 'help-circle'} 
            size={12} 
            color={action1?.color || '#1a1a1a'} 
          />
          <Feather 
            name={action2?.icon || 'help-circle'} 
            size={12} 
            color={action2?.color || '#1a1a1a'} 
          />
        </View>
      );
    }
    
    // 3+ actions: show first two icons + plus with number
    const action1 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
    const action2 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[1]);
    
    return (
      <View style={styles.multiActionContainer}>
        <View style={styles.firstTwoIcons}>
          <Feather 
            name={action1?.icon || 'help-circle'} 
            size={10} 
            color={action1?.color || '#1a1a1a'} 
          />
          <Feather 
            name={action2?.icon || 'help-circle'} 
            size={10} 
            color={action2?.color || '#1a1a1a'} 
          />
        </View>
        <View style={styles.plusIndicator}>
          <Feather name="plus" size={8} color="#8B5CF6" />
          <Text style={styles.actionCount}>{selectedActions.length - 2}</Text>
        </View>
      </View>
    );
  };

  const handleActionSelect = (actionId: string) => {
    NuminaAnimations.haptic.medium();
    
    const animations = pillAnimations.get(actionId);
    if (!animations) return;

    const isSelecting = !selectedActions.includes(actionId);
    
    // Trigger send button jiggly bounce for cohesive feeling
    Animated.sequence([
      Animated.timing(sendButtonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScaleAnim, {
        toValue: 1,
        tension: 400,
        friction: 6,
        useNativeDriver: true,
      })
    ]).start();
    
    if (isSelecting) {
      // Simple satisfying selection animation
      Animated.sequence([
        Animated.timing(animations.scale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(animations.scale, {
          toValue: 1.02,
          tension: 400,
          friction: 6,
          useNativeDriver: true,
        })
      ]).start();
      
      setSelectedActions(prev => [...prev, actionId]);
    } else {
      // Simple deselection
      Animated.spring(animations.scale, {
        toValue: 1,
        tension: 300,
        friction: 7,
        useNativeDriver: true,
      }).start();
      
      setSelectedActions(prev => prev.filter(id => id !== actionId));
    }
  };

  const handleSubmit = () => {
    if (inputText.trim()) {
      // If no actions are selected, default to 'explore' for general discovery
      if (selectedActions.length === 0) {
        setSelectedActions(['explore']);
      }
      setShowUBPMModal(true);
    }
  };

  const buildContextFromLockedNodes = (): string => {
    if (lockedNodes.length === 0) {
      return '';
    }

    const contextParts = lockedNodes.map(node => {
      const insights = node.deepInsights ? 
        ` Insights: ${node.deepInsights.personalizedContext}` : '';
      const connections = node.deepInsights?.dataConnections && node.deepInsights.dataConnections.length > 0 ? 
        ` Connected to: ${node.deepInsights.dataConnections.map(c => c.type).join(', ')}` : '';
      
      return `[${node.title}] ${node.content}${insights}${connections}`;
    });

    return `Previously explored and locked context: ${contextParts.join(' | ')} `;
  };

  const handleUBPMConfirm = (useUBPM: boolean) => {
    setShowUBPMModal(false);
    setIsProcessing(true);
    
    // Simulate backend processing
    setTimeout(() => {
      generateNodes(useUBPM);
    }, 1200);
  };

  const generateNodes = async (useUBPM: boolean) => {
    try {
      // Get comprehensive user data
      const userData = await SandboxDataService.getComprehensiveUserData();
      
      // Build context from previously locked nodes for recursive enhancement
      const lockedContext = buildContextFromLockedNodes();
      const enhancedQuery = lockedContext + inputText + ' ' + selectedActions.join(' ');
      
      // Generate base nodes with enhanced data influenced by locked context
      const baseNodes = await generateEnhancedNodesFromContext(enhancedQuery, userData, useUBPM);
      
      // Generate positions and enhance nodes with user data
      const enhancedNodes: SandboxNode[] = await Promise.all(
        baseNodes.map(async (node, index) => {
          const position = SandboxDataService.generateNodePosition(
            screenWidth, 
            screenHeight * 0.6, 
            [...nodes, ...lockedNodes] // Avoid overlapping with existing nodes
          );

          const enhancement = await SandboxDataService.enhanceNodeWithUserData(node, userData);

          return {
            ...node,
            position,
            deepInsights: {
              summary: enhancement.personalizedContext,
              keyPatterns: ['pattern_analysis', 'behavioral_insights'],
              personalizedContext: enhancement.personalizedContext,
              dataConnections: enhancement.dataConnections,
              relevanceScore: 0.8 + Math.random() * 0.2
            },
            userDataContext: {
              ubpmData: userData.ubpmData,
              behavioralMetrics: userData.behavioralMetrics,
              emotionalProfile: userData.emotionalProfile,
              temporalPatterns: userData.temporalPatterns
            }
          };
        })
      );

      // Add the new nodes to existing ones (don't replace)
      const allNodes = [...nodes, ...enhancedNodes];
      
      // Create animations for each new node
      enhancedNodes.forEach(node => {
        if (!nodeAnims.has(node.id)) {
          nodeAnims.set(node.id, {
            opacity: new Animated.Value(0),
            scale: new Animated.Value(0.1),
            translateY: new Animated.Value(20),
          });
        }
      });

      setNodes(allNodes);
      
      // Detect and create connections with all nodes
      const connections = await SandboxDataService.detectNodeConnections([...allNodes, ...lockedNodes]);
      setNodeConnections(connections);
      
      setIsProcessing(false);
      setShowNodes(true);
      
      // Animate nodes in with 700ms timing
      setTimeout(() => {
        animateNodesIn(enhancedNodes);
      }, 100);
      
      // Reset input for next iteration
      setInputText('');
      setSelectedActions([]);
      setIsInputFocused(false);
      
    } catch (error) {
      console.error('Error generating nodes:', error);
      generateSimpleNodes();
    }
  };

  const generateEnhancedNodesFromContext = async (
    enhancedQuery: string, 
    userData: any, 
    useUBPM: boolean
  ): Promise<Omit<SandboxNode, 'position' | 'deepInsights' | 'userDataContext'>[]> => {
    try {
      // Try to generate nodes using AI streaming endpoint
      const aiNodes = await generateNodesFromAI(enhancedQuery, userData, useUBPM);
      if (aiNodes && aiNodes.length > 0) {
        return aiNodes;
      }
    } catch (error) {
      console.log('⚠️ AI node generation unavailable, using contextual fallback:', error);
    }

    // Fallback to contextual generation based on locked content
    const hasPhysicsContext = lockedNodes.some(node => node.category === 'Physics');
    const hasPersonalContext = lockedNodes.some(node => node.personalHook);
    
    const contextualNodes = [];
    
    if (hasPhysicsContext && selectedActions.includes('think')) {
      contextualNodes.push({
        id: `context_${Date.now()}_1`,
        title: 'Quantum Consciousness',
        content: 'Building on the cosmological framework, consciousness might emerge from quantum field interactions',
        connections: [],
        confidence: 0.85,
        category: 'Physics',
        isLocked: false
      });
    }
    
    if (hasPersonalContext && selectedActions.includes('connect')) {
      contextualNodes.push({
        id: `context_${Date.now()}_2`,
        title: 'Interconnected Growth',
        content: 'Your personal resonance creates ripples that connect with others on similar journeys',
        connections: [],
        personalHook: 'Your ripple effect',
        confidence: 0.92,
        category: 'Personal',
        isLocked: false
      });
    }
    
    // Always generate at least one node related to the current search
    if (contextualNodes.length === 0) {
      contextualNodes.push({
        id: `search_${Date.now()}_1`,
        title: inputText.slice(0, 20) || 'New Discovery',
        content: `This discovery builds upon your exploration: "${enhancedQuery.slice(0, 100)}..."`,
        connections: [],
        confidence: 0.8,
        category: 'Discovery',
        isLocked: false
      });
    }
    
    return contextualNodes;
  };

  const generateNodesFromAI = async (
    query: string,
    userData: any,
    useUBPM: boolean
  ): Promise<Omit<SandboxNode, 'position' | 'deepInsights' | 'userDataContext'>[] | null> => {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) return null;

      const requestPayload = {
        query: query,
        selectedActions: selectedActions,
        lockedContext: lockedNodes.map(node => ({
          title: node.title,
          content: node.content,
          category: node.category,
          personalHook: node.personalHook
        })),
        useUBPM: useUBPM,
        userData: useUBPM ? {
          ubpmData: userData.ubpmData,
          behavioralMetrics: userData.behavioralMetrics,
          emotionalProfile: userData.emotionalProfile
        } : null
      };

      console.log('🚀 Sending AI node generation request:', requestPayload);

      const response = await fetch(`https://server-a7od.onrender.com/sandbox/generate-nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI nodes generated:', result.data);
        
        return result.data.nodes.map((node: any) => ({
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: node.title,
          content: node.content,
          connections: [],
          confidence: node.confidence || 0.8,
          category: node.category || 'Discovery',
          personalHook: node.personalHook,
          isLocked: false
        }));
      } else {
        console.log('⚠️ AI node generation failed:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error in AI node generation:', error);
      return null;
    }
  };

  const generateSimpleNodes = () => {
    const simpleNodes: SandboxNode[] = [
      {
        id: `fallback_${Date.now()}_1`,
        title: 'Discovery',
        content: 'Every journey begins with a single step into the unknown',
        position: { x: screenWidth * 0.3, y: screenHeight * 0.4 },
        connections: [],
        confidence: 0.8,
        category: 'General',
        isLocked: false
      }
    ];

    simpleNodes.forEach(node => {
      if (!nodeAnims.has(node.id)) {
        nodeAnims.set(node.id, {
          opacity: new Animated.Value(0),
          scale: new Animated.Value(0.1),
          translateY: new Animated.Value(20),
        });
      }
    });

    setNodes(simpleNodes);
    setIsProcessing(false);
    setShowNodes(true);
    
    setTimeout(() => {
      animateNodesIn(simpleNodes);
    }, 100);
  };

  const animateNodesIn = (nodesToAnimate: SandboxNode[]) => {
    const animations = nodesToAnimate.map((node, index) => {
      const nodeAnim = nodeAnims.get(node.id);
      if (!nodeAnim) return Animated.timing(new Animated.Value(0), { toValue: 1, duration: 0, useNativeDriver: true });

      return Animated.stagger(200, [
        Animated.timing(nodeAnim.opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(nodeAnim.scale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(nodeAnim.translateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      NuminaAnimations.haptic.success();
    });
  };

  const renderCursor = () => (
    <Animated.Text
      style={[
        styles.cursor,
        {
          color: isDarkMode ? '#fff' : '#000',
          opacity: cursorAnim,
        }
      ]}
    >
      |
    </Animated.Text>
  );

  const renderActionPills = () => (
    <Animated.View
      style={[
        styles.pillsContainer,
        {
          opacity: pillsAnim, // Simple opacity transition only
        }
      ]}
    >
      <Text style={[styles.pillsLabel, { color: isDarkMode ? '#888' : '#666' }]}>
        How should I help?
      </Text>
      <View style={styles.pillsGrid}>
        {SANDBOX_ACTIONS.map((action) => {
          const animations = pillAnimations.get(action.id);
          const isSelected = selectedActions.includes(action.id);
          
          return (
            <Animated.View
              key={action.id}
              style={{
                transform: [
                  { scale: animations?.scale || 1 }
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: isSelected
                      ? action.color
                      : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                    borderColor: isSelected
                      ? action.color
                      : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  }
                ]}
                onPress={() => handleActionSelect(action.id)}
              >
                
                <Feather 
                  name={action.icon as any} 
                  size={14} 
                  color={isSelected ? '#fff' : action.color} 
                />
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isSelected
                        ? '#fff'
                        : (isDarkMode ? '#fff' : '#1a1a1a'),
                    }
                  ]}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderUBPMModal = () => (
    showUBPMModal && (
      <View style={styles.modalOverlay}>
        <BaseWalletCard style={{
          ...styles.ubpmModal,
          backgroundColor: isDarkMode ? 'rgba(10,10,10,0.98)' : 'rgba(255,255,255,0.98)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        }}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
            Use your UBPM for this sandbox?
          </Text>
          <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#888' : '#666' }]}>
            Your behavioral profile will enable deeper, more personalized insights
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => handleUBPMConfirm(false)}
            >
              <Text style={[styles.modalButtonText, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                Skip
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#3B82F6' }]}
              onPress={() => handleUBPMConfirm(true)}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                Yes, use UBPM
              </Text>
            </TouchableOpacity>
          </View>
        </BaseWalletCard>
      </View>
    )
  );

  const renderProcessingState = () => (
    <View style={styles.processingContainer}>
      <EnhancedSpinner type="holographic" size={24} />
      <Text style={[styles.processingText, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
        Weaving connections through your consciousness...
      </Text>
    </View>
  );

  const handleNodePress = (node: SandboxNode) => {
    NuminaAnimations.haptic.medium();
    setSelectedNode(node);
  };

  const handleLockNode = async (node: SandboxNode) => {
    NuminaAnimations.haptic.success();
    
    const lockedNode = {
      ...node,
      isLocked: true,
      lockTimestamp: new Date().toISOString()
    };

    setNodes(prevNodes => 
      prevNodes.map(n => n.id === node.id ? lockedNode : n)
    );
    
    setLockedNodes(prevLocked => [...prevLocked, lockedNode]);
    setSelectedNode(null);

    // Save lock state to backend
    await SandboxDataService.saveLockState(node.id, {
      node: lockedNode,
      context: buildContextFromLockedNodes(),
      timestamp: lockedNode.lockTimestamp
    });
    
    // Detect new connections with locked nodes
    setTimeout(async () => {
      const updatedConnections = await SandboxDataService.detectNodeConnections(
        [...nodes.filter(n => n.id !== node.id), lockedNode]
      );
      setNodeConnections(updatedConnections);

      // Save updated session after connections are analyzed
      await saveSandboxSession();
    }, 500);
  };

  const saveSandboxSession = async () => {
    try {
      await SandboxDataService.saveSandboxSession({
        nodes,
        lockedNodes,
        connections: nodeConnections,
        userQuery: inputText,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.log('⚠️ Failed to save sandbox session:', error);
    }
  };

  const handleOpenWindow = () => {
    setShowWindowModal(true);
    setWindowQuery('');
    setWindowResults(null);
  };

  const handleWindowQuery = async () => {
    if (!selectedNode || !windowQuery.trim()) return;
    
    setIsWindowLoading(true);
    NuminaAnimations.haptic.selection();
    
    try {
      const response = await fetch(`${API_BASE_URL}/sandbox/node/${selectedNode.id}/window-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CloudAuth.getInstance().getToken()}`
        },
        body: JSON.stringify({
          query: windowQuery,
          nodeContext: {
            title: selectedNode.title,
            content: selectedNode.content,
            category: selectedNode.category
          }
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data: WindowQueryResponse = await response.json();
      setWindowResults(data);
      
    } catch (error) {
      console.error('Window query failed:', error);
      // Handle error gracefully - maybe show a toast or alert
    } finally {
      setIsWindowLoading(false);
    }
  };

  const handleAttachTidBit = async (tidBit: WindowTidBit) => {
    if (!selectedNode || attachingTidBit) return;
    
    setAttachingTidBit(tidBit.id);
    NuminaAnimations.haptic.success();
    
    try {
      // Update the node with the attached tid-bit
      const updatedNode = {
        ...selectedNode,
        deepInsights: {
          ...selectedNode.deepInsights,
          dataConnections: [
            ...(selectedNode.deepInsights?.dataConnections || []),
            {
              type: tidBit.type,
              value: tidBit.content,
              source: `Window Research: ${tidBit.source}`
            }
          ]
        }
      };
      
      // Update nodes state
      setNodes(prevNodes => 
        prevNodes.map(n => n.id === selectedNode.id ? {
          ...updatedNode,
          deepInsights: {
            ...updatedNode.deepInsights,
            summary: updatedNode.deepInsights?.summary || '',
            keyPatterns: updatedNode.deepInsights?.keyPatterns || [],
            personalizedContext: updatedNode.deepInsights?.personalizedContext || '',
            dataConnections: updatedNode.deepInsights?.dataConnections || [],
            relevanceScore: updatedNode.deepInsights?.relevanceScore || 0,
          }
        } as SandboxNode : n)
      );
      
      // Update selected node
      setSelectedNode({
        ...updatedNode,
        deepInsights: {
          ...updatedNode.deepInsights,
          summary: updatedNode.deepInsights?.summary || '',
          keyPatterns: updatedNode.deepInsights?.keyPatterns || [],
          personalizedContext: updatedNode.deepInsights?.personalizedContext || '',
          dataConnections: updatedNode.deepInsights?.dataConnections || [],
          relevanceScore: updatedNode.deepInsights?.relevanceScore || 0,
        }
      } as SandboxNode);
      
      // Remove the tid-bit from available list (since it's now attached)
      if (windowResults) {
        setWindowResults({
          ...windowResults,
          tidBits: windowResults.tidBits.map(tb => 
            tb.id === tidBit.id ? { ...tb, attachable: false } : tb
          )
        });
      }
      
      // Save the updated node to backend
      await SandboxDataService.attachTidBitToNode(selectedNode.id, tidBit);
      
    } catch (error) {
      console.error('Failed to attach tid-bit:', error);
    } finally {
      setTimeout(() => setAttachingTidBit(null), 1000);
    }
  };

  const renderConnectionLines = () => {
    return nodeConnections.map((connection) => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;

      // Only show connections for locked nodes
      if (!fromNode.isLocked && !toNode.isLocked) return null;

      const startX = fromNode.position.x;
      const startY = fromNode.position.y;
      const endX = toNode.position.x;
      const endY = toNode.position.y;

      const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

      return (
        <View
          key={`connection-${connection.from}-${connection.to}`}
          style={[
            styles.connectionLine,
            {
              left: startX,
              top: startY - 1,
              width: lineLength,
              transform: [{ rotate: `${angle}deg` }],
              opacity: connection.relevance * 0.8,
              backgroundColor: connection.connectionType === 'personal' 
                ? '#EC4899' 
                : connection.connectionType === 'categorical'
                  ? '#3B82F6'
                  : '#10B981',
            }
          ]}
        />
      );
    });
  };

  const renderWindowModal = () => {
    if (!showWindowModal || !selectedNode) return null;

    return (
      <Modal
        visible={showWindowModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowWindowModal(false)}
      >
        <View style={[styles.windowModalContainer, { backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff' }]}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.windowModalHeader}>
              <View style={styles.windowModalTitleContainer}>
                <Feather name="search" size={20} color="#8B5CF6" />
                <Text style={[styles.windowModalTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  Research Window
                </Text>
              </View>
              <TouchableOpacity
                style={styles.windowModalCloseButton}
                onPress={() => setShowWindowModal(false)}
              >
                <Feather name="x" size={20} color={isDarkMode ? '#fff' : '#1a1a1a'} />
              </TouchableOpacity>
            </View>

            <View style={styles.windowModalSubheader}>
              <Text style={[styles.windowModalSubtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>
                Exploring: {selectedNode.title}
              </Text>
            </View>

            {/* Query Input */}
            <View style={styles.windowQueryContainer}>
              <TextInput
                style={[
                  styles.windowQueryInput,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: isDarkMode ? '#fff' : '#1a1a1a',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  }
                ]}
                placeholder="What would you like to research about this node?"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                selectionColor={isDarkMode ? '#f5f5f5' : '#007AFF'}
                value={windowQuery}
                onChangeText={setWindowQuery}
                multiline
                autoFocus
              />
              <TouchableOpacity
                style={[
                  styles.windowQueryButton,
                  {
                    backgroundColor: windowQuery.trim() ? '#8B5CF6' : (isDarkMode ? '#333' : '#ddd'),
                    opacity: windowQuery.trim() ? 1 : 0.6
                  }
                ]}
                onPress={handleWindowQuery}
                disabled={!windowQuery.trim() || isWindowLoading}
              >
                {isWindowLoading ? (
                  <EnhancedSpinner size={16} color="#fff" />
                ) : (
                  <Feather name="search" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* Results */}
            <ScrollView style={styles.windowResultsContainer} showsVerticalScrollIndicator={false}>
              {windowResults && (
                <>
                  {/* Synthesis */}
                  <BaseWalletCard style={styles.synthesisCard}>
                    <View style={styles.synthesisHeader}>
                      <Feather name="zap" size={16} color="#8B5CF6" />
                      <Text style={[styles.synthesisTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                        Research Synthesis
                      </Text>
                    </View>
                    <Text style={[styles.synthesisText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                      {windowResults.synthesis}
                    </Text>
                    <View style={styles.sourcesMeta}>
                      <Text style={[styles.sourcesText, { color: isDarkMode ? '#999' : '#888' }]}>
                        {windowResults.sourcesMeta.webSources} web • {windowResults.sourcesMeta.academicSources} academic
                      </Text>
                    </View>
                  </BaseWalletCard>

                  {/* Tid-bits */}
                  <View style={styles.tidBitsSection}>
                    <Text style={[styles.tidBitsSectionTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                      Research Tid-bits
                    </Text>
                    {windowResults.tidBits.map((tidBit) => (
                      <BaseWalletCard key={tidBit.id} style={styles.tidBitCard}>
                        <View style={styles.tidBitHeader}>
                          <View style={styles.tidBitMeta}>
                            <View style={[
                              styles.tidBitTypeIndicator,
                              { backgroundColor: getTidBitColor(tidBit.type) }
                            ]} />
                            <Text style={[styles.tidBitType, { color: isDarkMode ? '#ccc' : '#666' }]}>
                              {tidBit.type.replace('_', ' ')}
                            </Text>
                          </View>
                          <View style={styles.tidBitRelevance}>
                            <Text style={[styles.tidBitRelevanceText, { color: isDarkMode ? '#999' : '#888' }]}>
                              {Math.round(tidBit.relevanceScore * 100)}%
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.tidBitContent, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                          {tidBit.content}
                        </Text>
                        <View style={styles.tidBitFooter}>
                          <Text style={[styles.tidBitSource, { color: isDarkMode ? '#999' : '#888' }]}>
                            {tidBit.source}
                          </Text>
                          {tidBit.attachable && (
                            <TouchableOpacity
                              style={[
                                styles.attachButton,
                                {
                                  backgroundColor: attachingTidBit === tidBit.id ? '#10B981' : '#8B5CF6',
                                  opacity: attachingTidBit && attachingTidBit !== tidBit.id ? 0.6 : 1
                                }
                              ]}
                              onPress={() => handleAttachTidBit(tidBit)}
                              disabled={!!attachingTidBit}
                            >
                              {attachingTidBit === tidBit.id ? (
                                <Feather name="check" size={14} color="#fff" />
                              ) : (
                                <Feather name="plus" size={14} color="#fff" />
                              )}
                              <Text style={styles.attachButtonText}>
                                {attachingTidBit === tidBit.id ? 'Attached' : 'Attach'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </BaseWalletCard>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    );
  };

  const getTidBitColor = (type: string) => {
    switch (type) {
      case 'finding': return '#3B82F6';
      case 'evidence': return '#10B981';
      case 'data_point': return '#F59E0B';
      case 'connection': return '#EC4899';
      default: return '#8B5CF6';
    }
  };

  const getInsightIcon = (patternType?: string) => {
    switch (patternType) {
      case 'hidden_pattern': return 'eye';
      case 'behavioral_insight': return 'trending-up';
      case 'emotional_pattern': return 'heart';
      case 'temporal_connection': return 'clock';
      default: return 'zap';
    }
  };

  const createInsightArrivalAnimation = (insightNode: SandboxNode) => {
    const arrivalAnim = {
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.3),
      translateY: new Animated.Value(-50),
      glow: new Animated.Value(0),
      pulse: new Animated.Value(0.5),
    };

    // Store the animation in nodeAnims for rendering
    nodeAnims.set(insightNode.id, arrivalAnim);

    // Create the breathtaking arrival sequence
    const arrivalSequence = Animated.sequence([
      // Phase 1: Materialization (600ms)
      Animated.parallel([
        Animated.timing(arrivalAnim.opacity, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(arrivalAnim.glow, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(arrivalAnim.scale, {
          toValue: 0.7,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 2: Pause for Drama (300ms)
      Animated.delay(300),
      
      // Phase 3: Coalescing (800ms)
      Animated.parallel([
        Animated.timing(arrivalAnim.opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(arrivalAnim.scale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(arrivalAnim.translateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 4: Final Pulse (400ms)
      Animated.spring(arrivalAnim.pulse, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]);

    // Start the animation sequence
    arrivalSequence.start(() => {
      // Start continuous subtle pulse after arrival
      const continuousPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(arrivalAnim.pulse, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(arrivalAnim.pulse, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      continuousPulse.start();
    });

    // Haptic feedback for the arrival moment
    NuminaAnimations.haptic.success();
    
    return arrivalAnim;
  };

  const renderNodeModal = () => {
    if (!selectedNode) return null;

    const isXL = (selectedNode.deepInsights?.dataConnections && selectedNode.deepInsights.dataConnections.length > 3) || 
                  (selectedNode.deepInsights?.keyPatterns && selectedNode.deepInsights.keyPatterns.length > 2);

    return (
      <View style={styles.modalOverlay}>
        <BaseWalletCard style={{
          ...(isXL ? styles.xlNodeModal : styles.nodeModal),
          backgroundColor: isDarkMode ? 'rgba(10,10,10,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        }}>
          {/* Header with size controls */}
          <View style={styles.nodeModalHeader}>
            <View style={styles.nodeModalTitleContainer}>
              <View style={[
                styles.nodeModalColorIndicator,
                {
                  backgroundColor: selectedNode.isInsightNode
                    ? '#8B5CF6'
                    : selectedNode.isLocked
                      ? '#10B981'
                      : selectedNode.personalHook
                        ? '#EC4899'
                        : '#3B82F6'
                }
              ]} />
              <Text style={[styles.nodeModalTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                {selectedNode.title}
              </Text>
              {selectedNode.isInsightNode && (
                <View style={styles.smallInsightBadge}>
                  <Feather name={getInsightIcon(selectedNode.patternType)} size={12} color="#8B5CF6" />
                </View>
              )}
            </View>
            <View style={styles.modalHeaderActions}>
              {!isXL && (
                <TouchableOpacity
                  style={styles.modalSizeButton}
                  onPress={() => setNodeModalSize('xl')}
                >
                  <Feather name="maximize-2" size={16} color={isDarkMode ? '#fff' : '#1a1a1a'} />
                </TouchableOpacity>
              )}
              {isXL && (
                <>
                  <TouchableOpacity
                    style={styles.modalSizeButton}
                    onPress={() => setNodeModalSize('fullscreen')}
                  >
                    <Feather name="maximize" size={16} color={isDarkMode ? '#fff' : '#1a1a1a'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSizeButton}
                    onPress={() => setNodeModalSize('standard')}
                  >
                    <Feather name="minimize-2" size={16} color={isDarkMode ? '#fff' : '#1a1a1a'} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedNode(null)}
              >
                <Feather name="x" size={20} color={isDarkMode ? '#fff' : '#1a1a1a'} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={isXL ? styles.xlModalContent : undefined} showsVerticalScrollIndicator={false}>
            {/* Content */}
            <Text style={[styles.nodeModalContent, { color: isDarkMode ? '#ccc' : '#666' }]}>
              {selectedNode.content}
            </Text>

            {selectedNode.personalHook && (
              <View style={styles.personalHookContainer}>
                <Text style={[styles.personalHookText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  {selectedNode.personalHook}
                </Text>
              </View>
            )}

            {/* Deep Insights */}
            {selectedNode.deepInsights && (
              <View style={styles.insightsSection}>
                <Text style={[styles.insightsSectionTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  Deep Insights
                </Text>
                <Text style={[styles.insightsText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                  {selectedNode.deepInsights.personalizedContext}
                </Text>
                
                {selectedNode.deepInsights.dataConnections.length > 0 && (
                  <View style={styles.dataConnectionsContainer}>
                    <Text style={[styles.dataConnectionsTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                      Your Data Connections
                    </Text>
                    {selectedNode.deepInsights.dataConnections.slice(0, isXL ? 5 : 2).map((connection, index) => (
                      <View key={index} style={styles.dataConnection}>
                        <View style={[styles.dataConnectionDot, { backgroundColor: connection.type === 'personality' ? '#8B5CF6' : '#06B6D4' }]} />
                        <Text style={[styles.dataConnectionText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                          {connection.type}: {connection.source}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.nodeModalActions}>
              <TouchableOpacity
                style={[styles.windowButton, { backgroundColor: '#8B5CF6' }]}
                onPress={handleOpenWindow}
              >
                <Feather name="search" size={16} color="#fff" />
                <Text style={styles.windowButtonText}>Research Window</Text>
              </TouchableOpacity>
              
              {!selectedNode.isLocked ? (
                <TouchableOpacity
                  style={[styles.lockNodeButton, { backgroundColor: '#10B981' }]}
                  onPress={() => handleLockNode(selectedNode)}
                >
                  <Feather name="lock" size={16} color="#fff" />
                  <Text style={styles.lockNodeButtonText}>Lock Node</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.lockedIndicator}>
                  <Feather name="check-circle" size={16} color="#10B981" />
                  <Text style={[styles.lockedText, { color: '#10B981' }]}>
                    Locked at {new Date(selectedNode.lockTimestamp!).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </BaseWalletCard>
      </View>
    );
  };

  const renderNode = (node: SandboxNode) => {
    const nodeAnim = nodeAnims.get(node.id);
    if (!nodeAnim) return null;

    const isLocked = node.isLocked;
    const isInsight = node.isInsightNode;
    const hasConnections = nodeConnections.some(conn => 
      conn.from === node.id || conn.to === node.id
    );

    const getNodeColor = () => {
      if (isInsight) {
        switch (node.patternType) {
          case 'hidden_pattern': return '#C4B5FD'; // Pastel purple
          case 'behavioral_insight': return '#A7F3D0'; // Pastel mint
          case 'emotional_pattern': return '#FBCFE8'; // Pastel pink
          case 'temporal_connection': return '#FDE68A'; // Pastel yellow
          default: return '#C4B5FD';
        }
      }
      if (isLocked) return '#A7F3D0'; // Pastel green
      if (node.personalHook) return '#FBCFE8'; // Pastel pink
      return '#BFDBFE'; // Pastel blue
    };

    const nodeColor = getNodeColor();

    return (
      <Animated.View
        key={node.id}
        style={[
          styles.node,
          {
            left: node.position.x - 40,
            top: node.position.y - 20,
            opacity: nodeAnim.opacity,
            transform: [
              { scale: nodeAnim.scale },
              { translateY: nodeAnim.translateY }
            ],
          }
        ]}
      >
        {/* Insight Node Glow Effect */}
        {isInsight && (
          <Animated.View
            style={[
              styles.insightGlow,
              {
                opacity: nodeAnim.glow ? 
                  Animated.multiply(nodeAnim.opacity, nodeAnim.glow) : 
                  nodeAnim.opacity,
                backgroundColor: nodeColor,
                shadowColor: nodeColor,
                transform: [
                  { scale: nodeAnim.pulse || 1 }
                ]
              }
            ]}
          />
        )}
        
        <TouchableOpacity
          style={[
            styles.nodeDot,
            isInsight && styles.insightNodeDot,
            {
              backgroundColor: nodeColor,
              borderColor: isInsight ? '#8B5CF6' : (hasConnections ? '#666' : '#ccc'),
              borderWidth: hasConnections ? 2 : (isInsight ? 2 : 1),
              shadowColor: isInsight ? '#8B5CF6' : nodeColor,
              shadowOpacity: isInsight ? 0.4 : 0.2,
              shadowRadius: isInsight ? 6 : 3,
              shadowOffset: { width: 0, height: 1 },
            }
          ]}
          onPress={() => handleNodePress(node)}
        >
          {/* Insight Node Icon */}
          {isInsight && (
            <View style={styles.insightIcon}>
              <Feather 
                name={getInsightIcon(node.patternType)} 
                size={8} 
                color="#8B5CF6" 
              />
            </View>
          )}
          
          {isLocked && !isInsight && (
            <Feather 
              name="lock" 
              size={8} 
              color="#fff" 
              style={styles.lockIcon} 
            />
          )}
          {hasConnections && !isInsight && (
            <View style={styles.connectionIndicator} />
          )}
          
          {/* Insight Node Pulse Effect */}
          {isInsight && (
            <Animated.View
              style={[
                styles.insightPulse,
                {
                  opacity: nodeAnim.pulse ? 
                    nodeAnim.pulse.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.3, 0.8],
                      extrapolate: 'clamp',
                    }) :
                    nodeAnim.scale.interpolate({
                      inputRange: [0.9, 1.1],
                      outputRange: [0.3, 0.8],
                      extrapolate: 'clamp',
                    }),
                  borderColor: nodeColor,
                  transform: [
                    { scale: nodeAnim.pulse || 1 }
                  ]
                }
              ]}
            />
          )}
        </TouchableOpacity>
        
        {/* Node Text Below Gumball */}
        <View style={styles.nodeTextContainer}>
          <Text style={[styles.nodeTitle, isInsight && styles.insightNodeTitle, { color: isDarkMode ? '#fff' : '#333' }]} numberOfLines={2} ellipsizeMode="tail">
            {node.title}
          </Text>
          {node.personalHook && (
            <Text style={[styles.personalHook, { color: isDarkMode ? '#ccc' : '#666' }]} numberOfLines={1} ellipsizeMode="tail">
              {node.personalHook}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Sandbox"
      subtitle="Collaborative discovery environment"
      headerProps={{
        style: {
          top: Platform.OS === 'ios' ? 50 : 15, // Reduced top positioning
        },
      }}
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <TouchableWithoutFeedback onPress={handleDismissKeyboard}>
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
            {!isProcessing && !showNodes && (
              <>
                {/* Minimal Input Area */}
                <Animated.View 
                  style={[
                    styles.inputContainer,
                    {
                      transform: [
                        { translateY: contentOffsetAnim },
                        { translateY: inputContainerAnim }, // Center the input when focused
                      ],
                    }
                  ]}
                >
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputRow}>
                      <TextInput
                        ref={textInputRef}
                        style={[
                          styles.mainInput,
                          {
                            color: isDarkMode ? '#fff' : '#1a1a1a',
                            flex: 1,
                            textAlign: inputText.length === 0 ? 'center' : 'left', // Dynamic alignment
                          }
                        ]}
                        placeholder=""
                        placeholderTextColor="transparent"
                        selectionColor={isDarkMode ? '#f5f5f5' : '#007AFF'}
                        value={inputText}
                        onChangeText={setInputText}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        multiline
                        autoFocus={false}
                        keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                      />
                      <Animated.View
                        style={[
                          styles.inlineSendButton,
                          {
                            opacity: sendButtonAnim,
                            transform: [{
                              scale: Animated.multiply(
                                sendButtonAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.8, 1],
                                }),
                                sendButtonScaleAnim
                              )
                            }]
                          }
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            styles.sendButtonTouchable,
                            {
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.95)' : '#fff',
                              borderColor: getSendButtonColor(),
                              borderWidth: selectedActions.length > 0 ? 1.5 : 0,
                              shadowColor: selectedActions.length > 0 ? getSendButtonColor() : (isDarkMode ? '#87CEEB' : '#87CEEB'),
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: selectedActions.length > 0 ? 0.4 : (isDarkMode ? 0.6 : 0.4),
                              shadowRadius: selectedActions.length > 0 ? 6 : (isDarkMode ? 8 : 6),
                              elevation: selectedActions.length > 0 ? 6 : (isDarkMode ? 8 : 6),
                            }
                          ]}
                          onPress={handleSubmit}
                        >
                          <Animated.View
                            style={{
                              opacity: buttonContentAnim,
                              transform: [{
                                scale: buttonContentAnim.interpolate({
                                  inputRange: [0.7, 1],
                                  outputRange: [0.9, 1],
                                })
                              }]
                            }}
                          >
                            {renderSendButtonContent()}
                          </Animated.View>
                        </TouchableOpacity>
                      </Animated.View>
                    </View>
                    {/* Ghost Text and Cursor */}
                    {!isInputFocused && inputText.length === 0 && ghostText && (
                      <View style={styles.ghostTextContainer}>
                        <Text 
                          key={`ghost-${currentExampleIndex}-${ghostText.length}`}
                          style={[styles.ghostText, { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {ghostText}
                        </Text>
                        <Animated.Text
                          style={[
                            styles.ghostCursor,
                            {
                              color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                              opacity: cursorAnim,
                            }
                          ]}
                        >
                          |
                        </Animated.Text>
                      </View>
                    )}
                  </View>
                  
                  {renderActionPills()}
                  
                </Animated.View>
              </>
            )}

            {isProcessing && renderProcessingState()}

            {showNodes && (
              <View style={styles.nodesCanvas}>
                {renderConnectionLines()}
                {nodes.map(renderNode)}
              </View>
            )}

            {renderUBPMModal()}
            {renderNodeModal()}
            {renderWindowModal()}
            </Animated.View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </PageBackground>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 75, // Adjusted for repositioned header
  },

  // Input Area
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 600,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  mainInput: {
    fontSize: 24,
    fontWeight: '300',
    minHeight: 70,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  cursor: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: '300',
    alignSelf: 'center',
    top: 16,
  },

  // Ghost Typing Effect
  ghostTextContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    minHeight: 32,
  },
  ghostText: {
    fontSize: 20,
    fontWeight: '300',
    fontFamily: 'Nunito-Light',
    textAlign: 'center',
    lineHeight: 26,
    flexShrink: 1,
    letterSpacing: 0.2, // Subtle letter spacing for VS Code terminal feel
  },
  ghostCursor: {
    fontSize: 20,
    fontWeight: '300',
    marginLeft: 1,
    lineHeight: 26,
    flexShrink: 0,
  },

  // Action Pills
  pillsContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  pillsLabel: {
    fontSize: 14,
    marginBottom: 16,
    fontWeight: '500',
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Inline Send Button
  inlineSendButton: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonTouchable: {
    width: 44,
    height: 32,
    borderRadius: 16, // Less circular, more rounded rectangle
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4, // Better positioning for thumb reach
  },
  dualIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2, // Small gap between dual icons
  },
  multiActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2, // Small gap between first two icons and plus indicator
  },
  firstTwoIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1, // Tight spacing between first two icons
  },
  plusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1, // Tight spacing for + and number
  },
  actionCount: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B5CF6',
    marginTop: -0.5, // Slight vertical adjustment for better alignment
  },

  // UBPM Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  ubpmModal: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Processing State
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 24,
    textAlign: 'center',
  },

  // Nodes Canvas
  nodesCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    width: 30,
  },
  nodeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  nodeTextContainer: {
    position: 'absolute',
    top: 28,
    alignItems: 'center',
    width: 28,
    left: -2,
  },
  nodeTitle: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 10,
    marginBottom: 2,
    fontFamily: 'Nunito-SemiBold',
  },
  personalHook: {
    fontSize: 7,
    fontWeight: '400',
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },

  // Connection Lines
  connectionLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0 50%',
  },

  // Node Modal Styles
  nodeModal: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
  },
  nodeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  nodeModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nodeModalColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  nodeModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  nodeModalContent: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  personalHookContainer: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  personalHookText: {
    color: '#EC4899',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Deep Insights Section
  insightsSection: {
    marginBottom: 20,
  },
  insightsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  dataConnectionsContainer: {
    marginTop: 12,
  },
  dataConnectionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dataConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dataConnectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  dataConnectionText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },

  // Node Modal Actions
  nodeModalActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lockNodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  lockNodeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lockedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Node Enhancements
  lockIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  connectionIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },

  // Insight Node Styles
  insightGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 75,
    opacity: 0.3,
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  insightNodeDot: {
    elevation: 12,
    borderWidth: 3,
  },
  insightIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 2,
  },
  insightNodeTitle: {
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  insightPulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 68,
    borderWidth: 2,
    opacity: 0.6,
  },
  
  // Window Button
  windowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    marginBottom: 8,
  },
  windowButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Window Modal
  windowModalContainer: {
    flex: 1,
  },
  windowModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  windowModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  windowModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  windowModalCloseButton: {
    padding: 4,
  },
  windowModalSubheader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  windowModalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Query Input
  windowQueryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  windowQueryInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  windowQueryButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Results
  windowResultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  synthesisCard: {
    marginBottom: 20,
    padding: 16,
  },
  synthesisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  synthesisTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  synthesisText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sourcesMeta: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sourcesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Tid-bits
  tidBitsSection: {
    marginBottom: 20,
  },
  tidBitsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tidBitCard: {
    marginBottom: 12,
    padding: 14,
  },
  tidBitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tidBitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tidBitTypeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tidBitType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  tidBitRelevance: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
  },
  tidBitRelevanceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tidBitContent: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 10,
  },
  tidBitFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tidBitSource: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  attachButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // XL Node Modal
  xlNodeModal: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    width: '95%',
    maxWidth: 600,
    maxHeight: '85%',
  },
  xlModalContent: {
    maxHeight: 500,
  },

  // Modal Header Actions
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalSizeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Insight Badges
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  insightBadgeText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  smallInsightBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    padding: 4,
  },

  // Fullscreen Modal
  fullscreenModal: {
    flex: 1,
  },
  fullscreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  fullscreenModalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fullscreenModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
    flex: 1,
  },
  fullscreenModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullscreenModalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Fullscreen Content Sections
  fullscreenContentSection: {
    marginVertical: 20,
  },
  fullscreenSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
    marginBottom: 12,
  },
  fullscreenNodeContent: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito-Regular',
  },
  fullscreenPersonalHook: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito-Medium',
    fontStyle: 'italic',
  },
  fullscreenInsightsText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito-Regular',
    marginBottom: 16,
  },

  // Fullscreen Data Connections
  fullscreenDataConnections: {
    marginTop: 16,
  },
  fullscreenDataConnectionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 12,
  },
  fullscreenDataConnectionCard: {
    marginBottom: 12,
    padding: 16,
  },
  fullscreenDataConnectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fullscreenDataConnectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  fullscreenDataConnectionType: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
    textTransform: 'capitalize',
  },
  fullscreenDataConnectionText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Nunito-Regular',
  },

  // Fullscreen Actions
  fullscreenActions: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 24,
    flexWrap: 'wrap',
  },
  fullscreenActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    flex: 1,
    minWidth: 160,
    justifyContent: 'center',
  },
  fullscreenActionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
  fullscreenLockedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    minWidth: 160,
  },
  fullscreenLockedText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito-SemiBold',
  },
});