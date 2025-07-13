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
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [inputHeight, setInputHeight] = useState(44);
  
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
          backgroundColor: 'transparent',
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
                  color: isDarkMode ? NuminaColors.darkMode[50] : NuminaColors.darkMode[50],
                }
              ]}
              value={value}
              onChangeText={onChangeText}
              placeholder="Ask, brainstorm, or share your thoughts..."
              placeholderTextColor={'rgba(150, 150, 150, 1)'}
              multiline
              maxLength={maxLength}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
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
                  ? '#86efac'
                  : 'transparent',
                borderColor: 'transparent',
                transform: [{ scale: sendButtonScale }],
              }
            ]}>
              <FontAwesome5
                name={isLoading ? "circle-notch" : "arrow-up"}
                size={20}
                color={(!isInputEmpty && !isLoading) 
                  ? '#000000' 
                  : '#86efac'
                }
                style={isLoading ? { transform: [{ rotate: '45deg' }] } : {}}
              />
            </Animated.View>
          </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
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
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: 'relative',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    letterSpacing: -0.2,
  },
  sendButtonContainer: {
    marginBottom: 2,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 5,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
});