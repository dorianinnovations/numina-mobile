import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaAnimations } from '../../utils/animations';
import { useGhostTyping } from '../../hooks/useGhostTyping';
import { SandboxAction } from '../../types/sandbox';

interface SandboxInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isInputFocused: boolean;
  setIsInputFocused: (focused: boolean) => void;
  selectedActions: string[];
  setSelectedActions: (actions: string[]) => void;
  isProcessing: boolean;
  showChainOfThought: boolean;
  streamingMessage?: string;
  onSubmit: () => void;
  contentOffsetAnim: Animated.Value;
  inputContainerAnim: Animated.Value;
  sendButtonAnim: Animated.Value;
  sendButtonScaleAnim: Animated.Value;
  buttonContentAnim: Animated.Value;
  pillsAnim: Animated.Value;
  cursorAnim: Animated.Value;
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
  },
  {
    id: 'ubpm',
    label: 'UBPM',
    icon: 'user',
    color: '#8B5CF6',
    description: 'Use behavioral profile'
  }
];

export const SandboxInput: React.FC<SandboxInputProps> = ({
  inputText,
  setInputText,
  isInputFocused,
  setIsInputFocused,
  selectedActions,
  setSelectedActions,
  isProcessing,
  showChainOfThought,
  streamingMessage,
  onSubmit,
  contentOffsetAnim,
  inputContainerAnim,
  sendButtonAnim,
  sendButtonScaleAnim,
  buttonContentAnim,
  pillsAnim,
  cursorAnim,
}) => {
  const { isDarkMode } = useTheme();
  const textInputRef = useRef<TextInput>(null);
  const pillAnimations = useRef<Map<string, { scale: Animated.Value }>>(new Map()).current;
  
  // Dismiss animation refs
  const dismissOpacity = useRef(new Animated.Value(1)).current;
  const dismissScale = useRef(new Animated.Value(1)).current;
  const dismissRotate = useRef(new Animated.Value(0)).current;

  // Micro interaction state
  const [showMicroInteraction, setShowMicroInteraction] = useState(false);
  const microInteractionOpacity = useRef(new Animated.Value(0)).current;
  const microInteractionInterval = useRef<NodeJS.Timeout | null>(null);
  const [hasShownInitialMicroInteraction, setHasShownInitialMicroInteraction] = useState(false);

  // Tooltip state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipScale = useRef(new Animated.Value(0.8)).current;

  const {
    ghostText,
    isTyping,
    isBackspacing,
    isCorrectingTypo,
    showingCursorOnly,
    isDismissing,
  } = useGhostTyping({
    isInputFocused,
    inputText,
    isProcessing,
    showChainOfThought,
  });

  // Initialize pill animations
  useEffect(() => {
    SANDBOX_ACTIONS.forEach(action => {
      if (!pillAnimations.has(action.id)) {
        pillAnimations.set(action.id, {
          scale: new Animated.Value(1),
        });
      }
    });
  }, [pillAnimations]);

  // Dismiss animation effect
  useEffect(() => {
    if (isDismissing) {
      // Subtle haptic feedback for the dismiss
      NuminaAnimations.haptic.light();
      
      // Quirky dissolve animation: scale down, rotate, and fade out
      Animated.parallel([
        Animated.timing(dismissOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dismissScale, {
          toValue: 0.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dismissRotate, {
          toValue: 1, // Will be interpolated to 15 degrees
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      dismissOpacity.setValue(1);
      dismissScale.setValue(1);
      dismissRotate.setValue(0);
    }
  }, [isDismissing, dismissOpacity, dismissScale, dismissRotate]);

  // Micro interaction effect - show every 5 seconds, but only 50% of the time after initial load
  useEffect(() => {
    // Clear existing interval
    if (microInteractionInterval.current) {
      clearInterval(microInteractionInterval.current);
      microInteractionInterval.current = null;
    }

    const showAnimation = () => {
      setShowMicroInteraction(true);
      Animated.timing(microInteractionOpacity, {
        toValue: isDarkMode ? 0.5 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(microInteractionOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowMicroInteraction(false);
        });
      }, 1000); // Display for 1 second
    };

    if (!isInputFocused && inputText.length === 0) {
      // Initial load: show after 2 seconds, always
      if (!hasShownInitialMicroInteraction) {
        const initialTimeout = setTimeout(() => {
          showAnimation();
          setHasShownInitialMicroInteraction(true);
        }, 2000); // Always show after 2 seconds on initial load
        return () => clearTimeout(initialTimeout);
      }

      // Subsequent appearances: random chance every 5 seconds
      microInteractionInterval.current = setInterval(() => {
        if (Math.random() < 0.5) {
          showAnimation();
        }
      }, 5000); // Check every 5 seconds
    } else {
      // If input is focused or has text, reset the initial flag
      setHasShownInitialMicroInteraction(false);
    }

    // Cleanup function
    return () => {
      if (microInteractionInterval.current) {
        clearInterval(microInteractionInterval.current);
        microInteractionInterval.current = null;
      }
    };
  }, [isInputFocused, inputText, microInteractionOpacity, hasShownInitialMicroInteraction, isDarkMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (microInteractionInterval.current) {
        clearInterval(microInteractionInterval.current);
        microInteractionInterval.current = null;
      }
    };
  }, []);

  const handleInputFocus = () => {
    setIsInputFocused(true);
    NuminaAnimations.haptic.light();
  };

  const handleInputBlur = () => {
    if (inputText.length === 0 && selectedActions.length === 0) {
      setIsInputFocused(false);
    }
  };

  const handleScreenTap = () => {
    if (isInputFocused) {
      // If input is focused, blur it to exit
      if (textInputRef.current) {
        textInputRef.current.blur();
      }
    } else {
      // If input is not focused, focus it to enter
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }
  };

  const handleClear = () => {
    NuminaAnimations.haptic.light();
    setInputText('');
    setSelectedActions([]);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const handleActionSelect = (actionId: string) => {
    NuminaAnimations.haptic.medium();
    
    const animations = pillAnimations.get(actionId);
    if (!animations) return;

    const isSelecting = !selectedActions.includes(actionId);
    
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
      
      setSelectedActions((prev: string[]) => [...prev, actionId]);
    } else {
      Animated.spring(animations.scale, {
        toValue: 1,
        tension: 300,
        friction: 7,
        useNativeDriver: true,
      }).start();
      
      setSelectedActions((prev: string[]) => prev.filter((id: string) => id !== actionId));
    }
  };

  const showTooltip = (actionId: string, event: any) => {
    event.persist();
    const action = SANDBOX_ACTIONS.find(a => a.id === actionId);
    if (!action) return;

    NuminaAnimations.haptic.light();
    
    // Calculate position based on touch event
    const { pageX, pageY } = event.nativeEvent;
    setTooltipPosition({ x: pageX, y: pageY - 60 });
    setActiveTooltip(actionId);

    // Animate tooltip in
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(tooltipScale, {
        toValue: 1,
        tension: 400,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideTooltip = () => {
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveTooltip(null);
    });
  };

  const getSendButtonIcon = () => {
    if (selectedActions.length === 0) return 'send';
    if (selectedActions.length === 1) {
      const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      return selectedAction?.icon || 'send';
    }
    return 'plus';
  };

  const getSendButtonColor = () => {
    if (selectedActions.length === 0) return '#1a1a1a';
    if (selectedActions.length === 1) {
      const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      return selectedAction?.color || '#1a1a1a';
    }
    return '#8B5CF6';
  };

  const renderSendButtonContent = () => {
    if (selectedActions.length === 0) {
      return <Feather name="send" size={17} color="#1a1a1a" />;
    }
    
    if (selectedActions.length === 1) {
      const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      return (
        <Feather 
          name={(selectedAction?.icon || 'send') as any} 
          size={17} 
          color={selectedAction?.color || '#1a1a1a'} 
        />
      );
    }
    
    if (selectedActions.length === 2) {
      const action1 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
      const action2 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[1]);
      
      return (
        <View style={styles.dualIconContainer}>
          <Feather 
            name={(action1?.icon || 'help-circle') as any} 
            size={12} 
            color={action1?.color || '#1a1a1a'} 
          />
          <Feather 
            name={(action2?.icon || 'help-circle') as any} 
            size={12} 
            color={action2?.color || '#1a1a1a'} 
          />
        </View>
      );
    }
    
    const action1 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
    const action2 = SANDBOX_ACTIONS.find(action => action.id === selectedActions[1]);
    
    return (
      <View style={styles.multiActionContainer}>
        <View style={styles.firstTwoIcons}>
          <Feather 
            name={(action1?.icon || 'help-circle') as any} 
            size={10} 
            color={action1?.color || '#1a1a1a'} 
          />
          <Feather 
            name={(action2?.icon || 'help-circle') as any} 
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

  const renderActionPills = () => (
    <Animated.View
      style={[
        styles.pillsContainer,
        {
          opacity: pillsAnim,
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
              <Pressable
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: isSelected
                      ? action.color
                      : (isDarkMode ? 'rgba(255,255,255,0.05)' : (isInputFocused ? '#ffffff' : 'rgba(0,0,0,0.05)')),
                    borderColor: isSelected
                      ? action.color
                      : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  }
                ]}
                onPress={() => handleActionSelect(action.id)}
                onLongPress={(event) => showTooltip(action.id, event)}
                onPressOut={hideTooltip}
                delayLongPress={500}
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
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderTooltip = () => {
    if (!activeTooltip) return null;
    
    const action = SANDBOX_ACTIONS.find(a => a.id === activeTooltip);
    if (!action) return null;

    return (
      <Animated.View
        style={[
          styles.tooltip,
          {
            left: tooltipPosition.x - 75, // Center the tooltip (150px width / 2)
            top: tooltipPosition.y,
            opacity: tooltipOpacity,
            transform: [{ scale: tooltipScale }],
          }
        ]}
        pointerEvents="none"
      >
        <View style={[
          styles.tooltipContent,
          { 
            backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
            borderColor: action.color,
          }
        ]}>
          <View style={styles.tooltipHeader}>
            <Feather 
              name={action.icon as any} 
              size={16} 
              color={action.color} 
            />
            <Text style={[
              styles.tooltipTitle,
              { color: isDarkMode ? '#fff' : '#1a1a1a' }
            ]}>
              {action.label}
            </Text>
          </View>
          <Text style={[
            styles.tooltipDescription,
            { color: isDarkMode ? '#ccc' : '#666' }
          ]}>
            {action.description}
          </Text>
        </View>
        <View style={[
          styles.tooltipArrow,
          { 
            borderTopColor: isDarkMode ? '#1a1a1a' : '#fff',
          }
        ]} />
      </Animated.View>
    );
  };

  return (
    <TouchableWithoutFeedback 
      onPress={handleScreenTap}
    >
      <Animated.View 
        style={[
          styles.inputContainer,
          {
            transform: [
              { translateY: contentOffsetAnim },
              { translateY: inputContainerAnim },
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
                textAlign: inputText.length === 0 ? 'center' : 'left',
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
          <View style={styles.buttonRow}>
            {/* Clear button - only show when there's input text or selected actions */}
            <Animated.View
              style={[
                styles.clearButton,
                {
                  opacity: sendButtonAnim,
                  transform: [{
                    scale: sendButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.clearButtonTouchable,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }
                ]}
                onPress={handleClear}
              >
                <Feather 
                  name="x" 
                  size={14} 
                  color={isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'} 
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Send button */}
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
                    opacity: isProcessing ? 0.5 : 1,
                  }
                ]}
                onPress={isProcessing ? undefined : onSubmit}
                disabled={isProcessing}
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
        </View>
        
        {/* Micro Interaction - Above Ghost Text */}
        {!isInputFocused && showMicroInteraction && (
          <Animated.View 
            style={[
              styles.microInteractionContainer,
              {
                opacity: showMicroInteraction ? microInteractionOpacity : 1,
              }
            ]}
          >
            <LottieView
              source={require('../../../assets/tapheredarkmode.json')}
              autoPlay
              loop={true}
              style={styles.microInteractionAnimation}
            />
          </Animated.View>
        )}

        {!isInputFocused && inputText.length === 0 && (showingCursorOnly || ghostText || isDismissing || streamingMessage) && (
          <Animated.View 
            style={[
              styles.ghostTextContainer,
              {
                opacity: dismissOpacity,
                transform: [
                  { scale: dismissScale },
                  { 
                    rotate: dismissRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '15deg'],
                    })
                  }
                ]
              }
            ]}
          >
            {/* Show streaming message first, then ghost text */}
            {streamingMessage && !isDismissing && (
              <Animated.Text 
                style={[
                  styles.ghostText, 
                  { 
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  }
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {streamingMessage}
              </Animated.Text>
            )}
            {!streamingMessage && !showingCursorOnly && ghostText && !isDismissing && (
              <Animated.Text 
                style={[
                  styles.ghostText, 
                  { 
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  }
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {ghostText}
              </Animated.Text>
            )}
            {/* Show fading ghost text during dismiss */}
            {isDismissing && ghostText && (
              <Animated.Text 
                style={[
                  styles.ghostText, 
                  { 
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  }
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {ghostText}
              </Animated.Text>
            )}
            <Animated.Text
              style={[
                styles.ghostCursor,
                {
                  color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                  opacity: isDismissing ? dismissOpacity : cursorAnim,
                }
              ]}
            >
              |
            </Animated.Text>
          </Animated.View>
        )}
      </View>
      
      {renderActionPills()}
      {renderTooltip()}
    </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
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
    letterSpacing: 0.2,
  },
  ghostCursor: {
    fontSize: 20,
    fontWeight: '300',
    marginLeft: 1,
    lineHeight: 26,
    flexShrink: 0,
  },
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
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inlineSendButton: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonTouchable: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  dualIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  multiActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  firstTwoIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  plusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  actionCount: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B5CF6',
    marginTop: -0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonTouchable: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microInteractionContainer: {
    position: 'absolute',
    top: 35,
    left: '60%',
    marginLeft: -25,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
  microInteractionAnimation: {
    width: 56,
    height: 56,
  },
  tooltip: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
  },
  tooltipContent: {
    width: 150,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tooltipDescription: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
}); 