import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  Dimensions,
  Text,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { TextStyles } from '../../utils/fonts';

const { width } = Dimensions.get('window');

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  isLoading?: boolean;
  maxLength?: number;
  placeholder?: string;
  voiceEnabled?: boolean;
  // AI Personality Features
  userEmotionalState?: {
    mood: string;
    intensity: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    recentInteractions: string[];
  };
  aiPersonality?: {
    communicationStyle: 'empathetic' | 'direct' | 'collaborative' | 'encouraging';
    adaptivePrompts: string[];
    contextualHints: string[];
  };
  onPersonalityUpdate?: (personality: any) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onVoiceStart,
  onVoiceEnd,
  isLoading = false,
  maxLength = 500,
  placeholder = "Share your thoughts...",
  voiceEnabled = true,
  userEmotionalState,
  aiPersonality,
  onPersonalityUpdate,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  const [adaptivePlaceholder, setAdaptivePlaceholder] = useState(placeholder);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
  const [isEmotionalAnalysisLoading, setIsEmotionalAnalysisLoading] = useState(false);
  
  // Animated values for smooth animations
  const suggestionsScale = useRef(new Animated.Value(0)).current;
  const suggestionsOpacity = useRef(new Animated.Value(0)).current;
  const suggestionsTranslateY = useRef(new Animated.Value(20)).current;
  const suggestionsRotate = useRef(new Animated.Value(0)).current;
  
  // Animations
  const voiceAnimScale = useRef(new Animated.Value(1)).current;
  const voiceAnimOpacity = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const emotionalLoadingAnim = useRef(new Animated.Value(0)).current;
  
  // Individual suggestion item animations
  const suggestionItems = useRef<Animated.Value[]>([]).current;

  // Voice recording animation
  useEffect(() => {
    if (isVoiceActive) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceActive]);

  // Emotional analysis loading animation
  useEffect(() => {
    if (isEmotionalAnalysisLoading) {
      const loadingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(emotionalLoadingAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(emotionalLoadingAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      loadingAnimation.start();
      return () => loadingAnimation.stop();
    } else {
      emotionalLoadingAnim.setValue(0);
    }
  }, [isEmotionalAnalysisLoading]);

  // Fluid Animation Functions
  const showSuggestionsWithAnimation = () => {
    setShowSuggestions(true);
    
    // Reset values for clean entrance
    suggestionsScale.setValue(0);
    suggestionsOpacity.setValue(0);
    suggestionsTranslateY.setValue(20);
    suggestionsRotate.setValue(-2);
    
    // Smooth bounce entrance with spring physics
    Animated.parallel([
      Animated.spring(suggestionsScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 180,
        friction: 12,
        overshootClamping: false,
      }),
      Animated.timing(suggestionsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(suggestionsTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 200,
        friction: 15,
      }),
      Animated.spring(suggestionsRotate, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
    ]).start();
    
    // Staggered animation for suggestion items
    suggestionItems.forEach((item, index) => {
      item.setValue(0);
      Animated.timing(item, {
        toValue: 1,
        delay: index * 80,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };
  
  const hideSuggestionsWithAnimation = () => {
    // Snappy exit animation
    Animated.parallel([
      Animated.spring(suggestionsScale, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 400,
        friction: 25,
      }),
      Animated.timing(suggestionsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(suggestionsTranslateY, {
        toValue: -10,
        useNativeDriver: true,
        tension: 350,
        friction: 20,
      }),
      Animated.spring(suggestionsRotate, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 25,
      }),
    ]).start();
    
    // Hide after animation completes
    setTimeout(() => {
      setShowSuggestions(false);
    }, 220);
  };
  
  const handleSuggestionPress = (suggestion: string) => {
    // Haptic feedback for premium feel
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Quick scale down animation before selection
    Animated.sequence([
      Animated.timing(suggestionsScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(suggestionsScale, {
        toValue: 0.85,
        useNativeDriver: true,
        tension: 500,
        friction: 30,
      }),
    ]).start();
    
    Animated.timing(suggestionsOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
    
    // Apply suggestion and hide
    setTimeout(() => {
      onChangeText(suggestion);
      setShowSuggestions(false);
    }, 100);
  };
  
  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideSuggestionsWithAnimation();
  };
  
  // Animated styles for the suggestions container
  const suggestionsAnimatedStyle = {
    transform: [
      { scale: suggestionsScale },
      { translateY: suggestionsTranslateY },
      { rotate: suggestionsRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '1deg'],
      }) },
    ],
    opacity: suggestionsOpacity,
  };
  
  // Individual suggestion item animated styles
  const getSuggestionItemStyle = (index: number) => {
    const item = suggestionItems[index];
    if (!item) return {};
    
    return {
      transform: [
        { 
          translateY: item.interpolate({
            inputRange: [0, 1],
            outputRange: [15, 0],
          })
        },
        {
          scale: item.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          })
        },
      ],
      opacity: item,
    };
  };

  const handleVoicePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isVoiceActive) {
      // Stop voice recording
      setIsVoiceActive(false);
      onVoiceEnd?.();
      
      Animated.spring(voiceAnimScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // Start voice recording
      setIsVoiceActive(true);
      onVoiceStart?.();
      
      Animated.spring(voiceAnimScale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handleSendPress = async () => {
    if (!value.trim() || isLoading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(sendButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start(() => {
      Animated.spring(sendButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }).start();
    });

    onSend();
  };

  const handleInputFocus = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 150,
      friction: 10,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(inputFocusAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 120,
      friction: 12,
    }).start();
  };

  const isInputEmpty = !value.trim();

  // Trigger emotional analysis loading when userEmotionalState changes
  useEffect(() => {
    if (userEmotionalState) {
      // Simulate loading for emotional analysis
      setIsEmotionalAnalysisLoading(true);
      const timer = setTimeout(() => {
        setIsEmotionalAnalysisLoading(false);
      }, 1500); // 1.5 seconds loading time
      
      return () => clearTimeout(timer);
    }
  }, [userEmotionalState]);

  // AI Personality Adaptation
  useEffect(() => {
    if (userEmotionalState && aiPersonality) {
      const adaptedPlaceholder = getAdaptivePlaceholder(userEmotionalState, aiPersonality);
      setAdaptivePlaceholder(adaptedPlaceholder);
      
      const suggestions = getContextualSuggestions(userEmotionalState, aiPersonality);
      setContextualSuggestions(suggestions);
    }
  }, [userEmotionalState, aiPersonality]);
  
  // Initialize suggestion item animations when suggestions change
  useEffect(() => {
    if (contextualSuggestions.length > 0) {
      // Create animated values for each suggestion item
      suggestionItems.length = 0;
      contextualSuggestions.forEach((_, index) => {
        suggestionItems[index] = new Animated.Value(0);
      });
    }
  }, [contextualSuggestions]);

  const getAdaptivePlaceholder = (emotionalState: any, personality: any) => {
    const { mood, intensity, timeOfDay } = emotionalState;
    const { communicationStyle } = personality;
    
    if (mood === 'anxious' && intensity > 7) {
      return communicationStyle === 'empathetic' 
        ? "What's weighing on your mind right now?"
        : "Let's break this down step by step...";
    }
    
    if (mood === 'happy' && intensity > 8) {
      return "What's bringing you this energy today?";
    }
    
    if (mood === 'stressed' && timeOfDay === 'evening') {
      return "How can we process today and prepare for rest?";
    }
    
    if (timeOfDay === 'morning') {
      return "What's your mental state as you start today?";
    }
    
    switch (communicationStyle) {
      case 'empathetic':
        return "What would help you feel understood right now?";
      case 'collaborative':
        return "What should we work through together?";
      case 'encouraging':
        return "What's on your mind that we can tackle?";
      case 'direct':
        return "What would you like to discuss?";
      default:
        return placeholder;
    }
  };

  const getContextualSuggestions = (emotionalState: any, personality: any) => {
    const { mood, intensity, timeOfDay } = emotionalState;
    
    if (mood === 'anxious' && intensity > 6) {
      return [
        "I'm feeling overwhelmed...",
        "Help me understand these thoughts",
        "What breathing exercises work?"
      ];
    }
    
    if (mood === 'happy' && intensity > 7) {
      return [
        "I want to share something amazing!",
        "Today was incredible because...",
        "I'm grateful for..."
      ];
    }
    
    if (mood === 'sad' && intensity > 5) {
      return [
        "I need some support today",
        "Help me process these feelings",
        "What self-care practices help?"
      ];
    }
    
    if (timeOfDay === 'evening') {
      return [
        "Reflect on my day",
        "Plan for tomorrow",
        "Practice gratitude"
      ];
    }
    
    return [
      "How can I grow today?",
      "What patterns do you notice?",
      "Help me understand myself better"
    ];
  };

  const getMoodColor = (mood: string | undefined) => {
    if (!mood) return '#62bbef';
    
    switch (mood.toLowerCase()) {
      case 'happy': return '#10b981';
      case 'sad': return '#3b82f6';
      case 'angry': return '#ef4444';
      case 'anxious': return '#f59e0b';
      case 'excited': return '#7f69ff';
      case 'calm': return '#06b6d4';
      case 'stressed': return '#f59e0b';
      default: return '#80eaff';
    }
  };


  return (
    <View style={styles.container}>
      {/* Character Count */}
      {value.length > maxLength * 0.8 && (
        <View style={styles.characterCount}>
          <Text style={[
            TextStyles.caption,
            styles.characterCountText,
            {
              color: value.length >= maxLength 
                ? NuminaColors.chatGreen[200]
                : isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[400],
            }
          ]}>
            {value.length}/{maxLength}
          </Text>
        </View>
      )}

      {/* Floating Input Container */}
      <View style={[
        styles.floatingContainer,
        {
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
          borderColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <View style={styles.inputRow}>
          {/* Text Input */}
          <Animated.View style={[
            styles.inputContainer,
            {
              backgroundColor: 'transparent',
              borderColor: inputFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  'transparent',
                  'rgba(134, 239, 173, 0)'
                ],
              }),
              borderWidth: inputFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            }
          ]}>
            <TextInput
              style={[
                TextStyles.input,
                styles.textInput,
                {
                  height: Math.max(36, Math.min(80, inputHeight)),
                  color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[500],
                }
              ]}
              value={value}
              onChangeText={onChangeText}
              placeholder={adaptivePlaceholder}
              placeholderTextColor={userEmotionalState?.mood === 'anxious' ? '#FF6B9D' : '#646464'}
              multiline
              maxLength={maxLength}
              onFocus={() => {
                handleInputFocus();
                showSuggestionsWithAnimation();
              }}
              onBlur={() => {
                handleInputBlur();
                setTimeout(() => hideSuggestionsWithAnimation(), 150);
              }}
              onContentSizeChange={(event) => {
                setInputHeight(event.nativeEvent.contentSize.height);
              }}
              editable={!isLoading}
              textAlignVertical="center"
            />
          </Animated.View>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSendPress}
            disabled={isInputEmpty || isLoading}
            activeOpacity={0.7}
            style={styles.sendButtonContainer}
          >
            <Animated.View style={[
              styles.sendButton,
              {
                backgroundColor: (!isInputEmpty && !isLoading)
                  ? (isDarkMode ? '#6ec5ff' : '#6ec5ff')
                  : (isDarkMode ? '#8acbff' : '#acdcff'),
                borderColor: 'transparent',
                transform: [{ scale: sendButtonScale }],
              }
            ]}>
              <FontAwesome5
                name={isLoading ? "circle-notch" : "arrow-up"}
                size={18}
                color={isDarkMode ? '#ffffff' : '#616161'}
                style={isLoading ? { transform: [{ rotate: '45deg' }] } : {}}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contextual Suggestions */}
      {showSuggestions && contextualSuggestions.length > 0 && (
        <Animated.View style={[
          styles.suggestionsContainer,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderColor: isDarkMode ? '#333' : '#e5e7eb',
          },
          suggestionsAnimatedStyle,
        ]}>
          <View style={styles.suggestionsHeader}>
            <FontAwesome5
              name="brain"
              size={10}
              color="#FF6B9D"
            />
            <Text style={[
              styles.suggestionsTitle,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              Numina suggests...
            </Text>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <FontAwesome5
                name="times"
                size={10}
                color={isDarkMode ? '#666' : '#999'}
              />
            </TouchableOpacity>
          </View>
          {contextualSuggestions.map((suggestion, index) => (
            <Animated.View
              key={index}
              style={getSuggestionItemStyle(index)}
            >
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  { borderColor: isDarkMode ? '#333' : '#f0f0f0' }
                ]}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.suggestionText,
                  { color: isDarkMode ? '#fff' : '#333' }
                ]}>
                  {suggestion}
                </Text>
                <FontAwesome5
                  name="arrow-right"
                  size={8}
                  color={isDarkMode ? '#666' : '#999'}
                />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      )}
      
      {/* Emotional State Indicator */}
      {userEmotionalState && (
        <View style={[
          styles.emotionalStateIndicator,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderColor: getMoodColor(userEmotionalState.mood),
          }
        ]}>
          <View style={[
            styles.moodDot,
            { backgroundColor: getMoodColor(userEmotionalState.mood) }
          ]} />
          {isEmotionalAnalysisLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.Text style={[
                styles.emotionalStateText,
                { 
                  color: isDarkMode ? '#ccc' : '#666',
                  opacity: emotionalLoadingAnim
                }
              ]}>
                Numina is analyzing your emotional state...
              </Animated.Text>
              <View style={styles.loadingDots}>
                <Animated.View style={[
                  styles.loadingDot,
                  { 
                    backgroundColor: getMoodColor(userEmotionalState.mood),
                    opacity: emotionalLoadingAnim
                  }
                ]} />
                <Animated.View style={[
                  styles.loadingDot,
                  { 
                    backgroundColor: getMoodColor(userEmotionalState.mood),
                    opacity: emotionalLoadingAnim,
                    transform: [{ translateX: emotionalLoadingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 4]
                    })}]
                  }
                ]} />
                <Animated.View style={[
                  styles.loadingDot,
                  { 
                    backgroundColor: getMoodColor(userEmotionalState.mood),
                    opacity: emotionalLoadingAnim,
                    transform: [{ translateX: emotionalLoadingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 8]
                    })}]
                  }
                ]} />
              </View>
            </View>
          ) : (
            <Text style={[
              styles.emotionalStateText,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              Numina senses you're feeling {userEmotionalState.mood}
            </Text>
          )}
          <View style={[
            styles.intensityBar,
            { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }
          ]}>
            <View style={[
              styles.intensityFill,
              {
                width: `${userEmotionalState.intensity * 10}%`,
                backgroundColor: getMoodColor(userEmotionalState.mood),
              }
            ]} />
          </View>
        </View>
      )}

      {/* Voice Recording Indicator */}
      {isVoiceActive && (
        <Animated.View style={[
          styles.voiceIndicator,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(20, 20, 20, 0.9)' 
              : 'rgba(255, 255, 255, 0.3)',
            borderColor: 'rgba(134, 239, 172, 0.4)',
          }
        ]}>
          <View style={styles.voiceIndicatorContent}>
            <Animated.View style={[
              styles.voiceRecordingDot,
              { transform: [{ scale: pulseAnim }] }
            ]} />
            <Text style={[
              TextStyles.caption,
              styles.voiceIndicatorText,
              { color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[50] }
            ]}>
              Listening...
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 3,
    paddingTop: 12,
    paddingVertical: 0,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  characterCount: {
    alignItems: 'flex-end',
    paddingBottom: 8,
    paddingRight: 4,
  },
  characterCountText: {
    letterSpacing: -0.2,
  },
  floatingContainer: {
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
    position: 'relative',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    position: 'relative',
    zIndex: 10,
  },
  voiceButtonContainer: {
    marginBottom: 2,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minHeight: 36,
    justifyContent: 'center',
  },
  textInput: {
    maxHeight: 70,
    paddingVertical: 6,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  sendButtonContainer: {
    marginBottom: 2,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
  },
  voiceIndicator: {
    position: 'absolute',
    top: -48,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  voiceIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  voiceRecordingDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#86efac',
  },
  voiceIndicatorText: {
    letterSpacing: -0.2,
  },
  // AI Adaptive Features Styles
  suggestionsContainer: {
    position: 'absolute',
    bottom: 156, 
    left: 16,
    right: 16,
    borderRadius: 16, 
    borderWidth: 1,
    padding: 16, 
    maxHeight: 400, 
    elevation: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 20, 
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, // Increased from 6
    gap: 6, // Increased from 4
  },
  suggestionsTitle: {
    fontSize: 12, // Increased from 11
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    flex: 1,
  },
  dismissButton: {
    padding: 6, // Increased for better touch target
    borderRadius: 16, // Increased for modern look
    backgroundColor: 'rgba(0, 0, 0, 0.08)', // Slightly more visible
    minWidth: 28, // Ensure consistent size
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, // Increased for better touch targets
    paddingHorizontal: 12, // Increased for better spacing
    borderRadius: 12, // Increased for more modern look
    marginVertical: 4, // Increased spacing between items
    borderWidth: 1,
    // Added subtle background interaction
    transform: [{ scale: 1 }],
  },
  suggestionText: {
    fontSize: 14, // Increased from 13
    fontFamily: 'Nunito_400Regular',
    flex: 1,
  },
  emotionalStateIndicator: {
    position: 'absolute',
    top: -30,
    left: 16,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emotionalStateText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    flex: 1,
  },
  intensityBar: {
    width: 30,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Loading animation styles
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});