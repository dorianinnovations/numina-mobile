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
  
  // Animations
  const voiceAnimScale = useRef(new Animated.Value(1)).current;
  const voiceAnimOpacity = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

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

  // AI Personality Adaptation
  useEffect(() => {
    if (userEmotionalState && aiPersonality) {
      const adaptedPlaceholder = getAdaptivePlaceholder(userEmotionalState, aiPersonality);
      setAdaptivePlaceholder(adaptedPlaceholder);
      
      const suggestions = getContextualSuggestions(userEmotionalState, aiPersonality);
      setContextualSuggestions(suggestions);
    }
  }, [userEmotionalState, aiPersonality]);

  const getAdaptivePlaceholder = (emotionalState: any, personality: any) => {
    const { mood, intensity, timeOfDay } = emotionalState;
    const { communicationStyle } = personality;
    
    if (mood === 'anxious' && intensity > 7) {
      return communicationStyle === 'empathetic' 
        ? "I'm here to listen... what's on your mind? 💙"
        : "Let's work through this together...";
    }
    
    if (mood === 'happy' && intensity > 8) {
      return "Share your joy! What's making you feel amazing? ✨";
    }
    
    if (mood === 'stressed' && timeOfDay === 'evening') {
      return "End-of-day check-in... how can I help you unwind? 🌙";
    }
    
    if (timeOfDay === 'morning') {
      return "Good morning! How are you feeling today? ☀️";
    }
    
    switch (communicationStyle) {
      case 'empathetic':
        return "I'm here for you... what's in your heart? 💫";
      case 'collaborative':
        return "Let's explore this together... what's happening?";
      case 'encouraging':
        return "You've got this! What's on your mind? 🌟";
      case 'direct':
        return "What would you like to talk about?";
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

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case 'happy': return '#10b981';
      case 'sad': return '#3b82f6';
      case 'angry': return '#ef4444';
      case 'anxious': return '#f59e0b';
      case 'excited': return '#8b5cf6';
      case 'calm': return '#06b6d4';
      case 'stressed': return '#f59e0b';
      default: return '#6366f1';
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
                setShowSuggestions(true);
              }}
              onBlur={() => {
                handleInputBlur();
                setTimeout(() => setShowSuggestions(false), 150);
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
        <View style={[
          styles.suggestionsContainer,
          {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            borderColor: isDarkMode ? '#333' : '#e5e7eb',
          }
        ]}>
          <View style={styles.suggestionsHeader}>
            <FontAwesome5
              name="brain"
              size={12}
              color="#FF6B9D"
            />
            <Text style={[
              styles.suggestionsTitle,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              Numina suggests...
            </Text>
          </View>
          {contextualSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.suggestionItem,
                { borderColor: isDarkMode ? '#333' : '#f0f0f0' }
              ]}
              onPress={() => {
                onChangeText(suggestion);
                setShowSuggestions(false);
              }}
            >
              <Text style={[
                styles.suggestionText,
                { color: isDarkMode ? '#fff' : '#333' }
              ]}>
                {suggestion}
              </Text>
              <FontAwesome5
                name="arrow-right"
                size={10}
                color={isDarkMode ? '#666' : '#999'}
              />
            </TouchableOpacity>
          ))}
        </View>
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
          <Text style={[
            styles.emotionalStateText,
            { color: isDarkMode ? '#ccc' : '#666' }
          ]}>
            Numina senses you're feeling {userEmotionalState.mood}
          </Text>
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
    bottom: 80,
    left: 16,
    right: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    maxHeight: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    flex: 1,
  },
  emotionalStateIndicator: {
    position: 'absolute',
    top: -60,
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
});