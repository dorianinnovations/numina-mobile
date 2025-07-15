import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  Dimensions,
  Text,
  Easing,
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
  // Emotional State Features
  userEmotionalState?: {
    mood: string;
    intensity: number;
    primaryEmotion?: string;
  };
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
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showEmotionNotification, setShowEmotionNotification] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  
  // Animated values for smooth animations
  const voiceAnimScale = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const emotionSlideAnim = useRef(new Animated.Value(120)).current; // Start at bottom of phone
  const emotionOpacityAnim = useRef(new Animated.Value(0)).current; // Start invisible
  
  // Computed values
  const isInputEmpty = !value.trim();

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

  // Watch for emotion changes and trigger notification
  useEffect(() => {
    if (userEmotionalState) {
      const newEmotion = userEmotionalState.primaryEmotion || userEmotionalState.mood;
      
      if (newEmotion && newEmotion !== currentEmotion) {
        setCurrentEmotion(newEmotion);
        showNotification();
      }
    }
  }, [userEmotionalState, currentEmotion]);


  const showNotification = () => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;
    const minCooldown = 8000; // 8 second cooldown between notifications
    
    // Skip if notification is already showing or if cooldown hasn't elapsed
    if (showEmotionNotification || timeSinceLastNotification < minCooldown) {
      return;
    }
    
    setLastNotificationTime(now);
    setShowEmotionNotification(true);
    
    Animated.parallel([
      Animated.timing(emotionSlideAnim, {
        toValue: -87, // Lowered by 13% from -100
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), 
      }),
      // Fade in as it slides up
      Animated.timing(emotionOpacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();

    // Auto-hide after 3.5 seconds
    setTimeout(() => {
      hideNotification();
    }, 3000);
  };

  const hideNotification = () => {
    // Slide down and out of view (back toward bottom of phone, +Y direction)
    Animated.parallel([
      Animated.timing(emotionSlideAnim, {
        toValue: 120, // Slide down and out of view (+Y direction)
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(emotionOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => {
      // Reset position for next show and hide component
      emotionSlideAnim.setValue(120);
      setShowEmotionNotification(false);
    });
  };

  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideNotification();
  };

  const getMoodColor = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy':
      case 'joyful': return '#10b981';
      case 'sad':
      case 'melancholy': return '#3b82f6';
      case 'angry':
      case 'frustrated': return '#ef4444';
      case 'anxious':
      case 'worried': return '#f59e0b';
      case 'excited': return '#7f69ff';
      case 'calm':
      case 'peaceful': return '#06b6d4';
      default: return '#80eaff';
    }
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
                styles.textInput,
                {
                  height: 44,
                  minHeight: 44,
                  maxHeight: 44,
                  color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[500],
                }
              ]}
              value={value}
              onChangeText={(text) => {
                // Check if user pressed Enter (text ends with newline)
                if (text.endsWith('\n')) {
                  // Remove the newline and send the message
                  const messageText = text.slice(0, -1);
                  onChangeText(messageText);
                  handleSendPress();
                } else {
                  onChangeText(text);
                }
              }}
              placeholder={placeholder}
              placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
              multiline={false}
              numberOfLines={1}
              maxLength={maxLength}
              onSubmitEditing={handleSendPress}
              returnKeyType="send"
              blurOnSubmit={false}
              scrollEnabled={true}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              editable={!isLoading}
              textAlignVertical="center"
            />
          </Animated.View>

          {/* Send Button */}
          <View style={styles.sendButtonContainer}>
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
      </View>

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

      {/* Emotion Notification */}
      {showEmotionNotification && currentEmotion && (
        <TouchableOpacity
          onPress={handleNotificationPress}
          activeOpacity={0.8}
          style={styles.notificationWrapper}
        >
          <Animated.View style={[
            styles.emotionNotification,
            {
              backgroundColor: isDarkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              opacity: emotionOpacityAnim,
              transform: [{ translateY: emotionSlideAnim }],
            }
          ]}>
            <View style={[
              styles.emotionDot,
              { 
                backgroundColor: getMoodColor(currentEmotion),
                opacity: 0.7 
              }
            ]} />
            <Text style={[
              styles.emotionText,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              Feeling {currentEmotion}
            </Text>
            <Text style={[
              styles.tapHint,
              { color: isDarkMode ? '#888' : '#aaa' }
            ]}>
              Dismiss
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 3,
    paddingTop: 0,
    paddingVertical: 0,
    paddingBottom: 0,
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
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    position: 'relative',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 18,
    zIndex: 10, // Above notification
    height: 68, // Fixed height for the entire container
    minHeight: 68,
    maxHeight: 68,
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
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 2,
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    justifyContent: 'center',
  },
  textInput: {
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    paddingVertical: 1,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  sendButtonContainer: {
    marginBottom: 2,
  },
  sendButton: {
    width: 55,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
  },
  enterHint: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
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
  notificationWrapper: {
    position: 'absolute',
    bottom: 20, 
    left: 16,
    right: 16,
    zIndex: 5, // Above message bubbles but below input field
  },
  emotionNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 0.5,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emotionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emotionText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Inter_500Medium',
  },
  tapHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});