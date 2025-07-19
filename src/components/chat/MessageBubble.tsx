import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { TextStyles } from '../../utils/fonts';
import { MessageAttachment } from '../../types/message';
import StreamingMarkdown from '../StreamingMarkdown';
import { PhotoPreview } from './PhotoPreview';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'numina';
  timestamp: string;
  mood?: string;
  isStreaming?: boolean;
  attachments?: MessageAttachment[];
  // AI Personality Features
  personalityContext?: {
    communicationStyle: 'supportive' | 'direct' | 'collaborative' | 'encouraging';
    emotionalTone: 'supportive' | 'celebratory' | 'analytical' | 'calming';
    adaptedResponse: boolean;
    userMoodDetected?: string;
    responsePersonalization?: string;
  };
  aiInsight?: {
    pattern: string;
    suggestion: string;
    confidence: number;
  };
}

interface MessageBubbleProps {
  message: Message;
  index: number;
  onLongPress?: (message: Message) => void;
  onSpeakMessage?: (text: string) => void;
  userEmotionalState?: {
    mood: string;
    intensity: number;
    recentPatterns: string[];
  };
  onPersonalityFeedback?: (feedback: 'helpful' | 'not_helpful' | 'love_it') => void;
}

// Component for rendering formatted bot messages with streaming energy pulse
const BotMessageContent: React.FC<{
  text: string | undefined;
  previousLength: number;
  newContentOpacity: Animated.Value;
  isStreaming?: boolean;
  theme: any;
}> = ({ text, previousLength, newContentOpacity, isStreaming, theme }) => {
  // Handle undefined text
  const safeText = text || '';
  
  // Animated values for energy pulse effect
  const pulseAnimation = useRef(new Animated.Value(0)).current;
  // NUKED: Removed complex glow and gradient animations
  
  // Start energy pulse animation when streaming
  useEffect(() => {
    if (isStreaming) {
      // Continuous energy pulse through text
      // SAFE: Single simple pulse with native driver
      const simplePulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true, // NATIVE PERFORMANCE
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0.7,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      
      simplePulse.start();
      
      return () => {
        simplePulse.stop();
      };
    } else {
      pulseAnimation.setValue(0);
    }
  }, [isStreaming]);
  
  // SAFE: Simple opacity pulse with native driver
  const animatedOpacity = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });
  
  return (
    <Animated.View style={[
      styles.botTextContainer,
      isStreaming && { opacity: animatedOpacity }
    ]}>
      {isStreaming ? (
        <StreamingMarkdown
          content={safeText}
          isComplete={false}
          showCursor={true}
        />
      ) : (
        <StreamingMarkdown
          content={safeText}
          isComplete={true}
          showCursor={false}
        />
      )}
    </Animated.View>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  index,
  onLongPress,
  onSpeakMessage,
  userEmotionalState,
  onPersonalityFeedback,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [previousLength, setPreviousLength] = useState(0);
  const [showPersonalityIndicator, setShowPersonalityIndicator] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const newContentOpacity = useRef(new Animated.Value(1)).current;
  const timestampOpacity = useRef(new Animated.Value(0)).current;
  const personalityHeaderOpacity = useRef(new Animated.Value(0)).current;
  const personalityHeaderSlide = useRef(new Animated.Value(20)).current;

  const isUser = message?.sender === 'user';
  const isAI = message?.sender === 'numina';

  // Entry animation with stagger - rise from bottom effect (near send button)
  useEffect(() => {
    const delay = index * 80;
    
    // Debug log
    if (isAI) {
      console.log(`🧠 BUBBLE: Message ${message.id} personality context:`, message.personalityContext);
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
    if (isUser) {
      timestampOpacity.setValue(1);
    }
    if (isAI && message.personalityContext) {
      const personalityDelay = delay + 220;
      Animated.parallel([
        Animated.spring(personalityHeaderOpacity, {
          toValue: 1,
          delay: personalityDelay,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
        Animated.spring(personalityHeaderSlide, {
          toValue: 0,
          delay: personalityDelay,
          useNativeDriver: true,
          speed: 12,
          bounciness: 8,
        }),
      ]).start();
    }
  }, [index, isUser, isAI, message.personalityContext?.communicationStyle]);

  // Progressive fade-in for new content chunks and timestamp
  useEffect(() => {
    try {
      const safeText = message?.text || '';
      setDisplayedText(safeText);
      
      if (safeText && message?.isStreaming) {
        // More dynamic haptic feedback when bot starts streaming
        if (!hasStartedStreaming && isAI) {
          // Create an "awakening" sequence that feels like AI coming to life
          const createAliveStartHaptic = async () => {
            try {
              // First pulse: "waking up"
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
              // Brief pause for timing
              await new Promise(resolve => setTimeout(resolve, 60));
              
              // Second slightly stronger pulse
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
              // Shorter pause for building energy
              await new Promise(resolve => setTimeout(resolve, 40));
              
              // Final pulse
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
            } catch (error) {
              console.error('Error in alive start haptic:', error);
              // Fallback to simple haptic if sequence fails
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          };
          
          // Execute haptic sequence
          createAliveStartHaptic();
          setHasStartedStreaming(true);
        }
        
        // Check if new content was added
        if (safeText.length > previousLength) {
          // Animate the new content fading in
          newContentOpacity.setValue(0.5);
          Animated.timing(newContentOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }).start();
          
          // Simplified haptic feedback during streaming for better performance
          if (isAI && hasStartedStreaming) {
            const textAdded = safeText.length - previousLength;
            const shouldPulse = textAdded >= 20 && (safeText.length % 50 === 0); // Reduced frequency
            
            if (shouldPulse) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
          }
          
          setPreviousLength(safeText.length);
        }
        // Hide timestamp while streaming
        timestampOpacity.setValue(0);
      } else if (safeText && !message?.isStreaming) {
        // Completed message - ensure full opacity
        newContentOpacity.setValue(1);
        setPreviousLength(safeText.length);
        
        // More dynamic haptic feedback when bot finishes streaming
        if (hasStartedStreaming && isAI) {
          // Create an intelligent "breathing" completion sequence that feels alive
          const createAliveCompletionHaptic = async () => {
            try {
              const messageLength = safeText.length;
              const isLongMessage = messageLength > 200;
              const isVeryLongMessage = messageLength > 500;
              
              // Analyze message content for personality-based haptic patterns
              const messageContent = safeText.toLowerCase();
              const isQuestionResponse = messageContent.includes('?') || messageContent.includes('question');
              const isCodeResponse = messageContent.includes('```') || messageContent.includes('code') || messageContent.includes('function');
              const isEmotionalResponse = messageContent.includes('feel') || messageContent.includes('emotion') || messageContent.includes('understand');
              const isExplanationResponse = messageContent.includes('explain') || messageContent.includes('because') || messageContent.includes('therefore');
              
              // Adaptive timing based on message length and content
              const baseDelay = isLongMessage ? 100 : 80;
              const finalDelay = isVeryLongMessage ? 250 : 200;
              
              // First impact: Strong signal that completion is happening
              // Use stronger haptic for longer messages (more "satisfying")
              const initialIntensity = isLongMessage 
                ? Haptics.ImpactFeedbackStyle.Heavy 
                : Haptics.ImpactFeedbackStyle.Medium;
              await Haptics.impactAsync(initialIntensity);
              
              // Brief pause to create rhythm
              await new Promise(resolve => setTimeout(resolve, baseDelay));
              
              // Content-based middle sequence
              if (isEmotionalResponse) {
                // Gentle, flowing pattern for emotional responses
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await new Promise(resolve => setTimeout(resolve, baseDelay + 20));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await new Promise(resolve => setTimeout(resolve, baseDelay + 60));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else if (isCodeResponse) {
                // Precise, structured pattern for code responses
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await new Promise(resolve => setTimeout(resolve, baseDelay - 20));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await new Promise(resolve => setTimeout(resolve, baseDelay - 20));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else if (isQuestionResponse) {
                // Inquisitive, lighter pattern for questions
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await new Promise(resolve => setTimeout(resolve, baseDelay + 30));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await new Promise(resolve => setTimeout(resolve, baseDelay + 30));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else if (isExplanationResponse) {
                // Methodical, confident pattern for explanations
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await new Promise(resolve => setTimeout(resolve, baseDelay + 40));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await new Promise(resolve => setTimeout(resolve, baseDelay + 40));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else {
                // Default pattern for general responses
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await new Promise(resolve => setTimeout(resolve, baseDelay + 40));
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              
              // For longer messages, add more satisfying conclusion
              if (isLongMessage) {
                await new Promise(resolve => setTimeout(resolve, finalDelay));
                // Deep satisfaction haptic for completing long responses
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                
                // Extra "contentment" pulse for very long messages
                if (isVeryLongMessage) {
                  await new Promise(resolve => setTimeout(resolve, 150));
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              } else {
                // For shorter messages, lighter conclusion
                await new Promise(resolve => setTimeout(resolve, finalDelay));
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              
            } catch (error) {
              console.error('Error in alive completion haptic:', error);
              // Fallback to simple haptic if sequence fails
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          };
          
          // Execute the alive haptic sequence
          createAliveCompletionHaptic();
        }
        
        // Fade in timestamp after message completes
        setTimeout(() => {
          Animated.timing(timestampOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 300); // Small delay after message completion
      }
    } catch (error) {
      console.error('Error in MessageBubble text effect:', error);
      setDisplayedText(message?.text || '');
      // Show timestamp immediately if there's an error
      timestampOpacity.setValue(1);
    }
  }, [message?.text, message?.isStreaming, hasStartedStreaming, isAI]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(pressAnim, {
      toValue: 0.98,
      duration: 50,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 50,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([10]);
    } else {
      Vibration.vibrate(50);
    }
    onLongPress?.(message);
  };

  const handleSpeakPress = () => {
    onSpeakMessage?.(message.text);
  };

  const getMoodColor = (mood?: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return '#10b981';
      case 'sad': return '#3b82f6';
      case 'angry': return '#ef4444';
      case 'anxious': return '#f59e0b';
      case 'excited': return '#8b5cf6';
      case 'calm': return '#06b6d4';
      default: return NuminaColors.chatGreen[200];
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPersonalityColor = (style: string) => {
    switch (style) {
      case 'supportive': return '#87c3eb';
      case 'direct': return '#4DABF7';
      case 'collaborative': return '#6BCF7F';
      case 'encouraging': return '#FFD93D';
      default: return '#8E8E93';
    }
  };

  const getPersonalityIcon = (style: string) => {
    switch (style) {
      case 'supportive': return 'brain';
      case 'direct': return 'bullseye';
      case 'collaborative': return 'users';
      case 'encouraging': return 'star';
      default: return 'comment';
    }
  };

  const getPersonalityLabel = (style: string) => {
    switch (style) {
      case 'supportive': return 'Supportive Mode';
      case 'direct': return 'Direct Mode';
      case 'collaborative': return 'Collaborative Mode';
      case 'encouraging': return 'Encouraging Mode';
      default: return 'Standard Mode';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        activeOpacity={0.95}
        style={isUser ? styles.userMessageWrapper : styles.messageWrapper}
      >
        {isUser ? (
          /* User Message with Photos and Text */
          <View style={styles.userMessageContainer}>
            {/* Photo Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <View style={styles.photoAttachmentsContainer}>
                {message.attachments
                  .filter(attachment => attachment.type === 'image')
                  .map((attachment) => (
                    <PhotoPreview
                      key={attachment.id}
                      attachment={attachment}
                      isUser={true}
                      onPress={() => {
                        // Future: Open full-screen photo viewer
                        console.log('Photo pressed:', attachment.name);
                      }}
                    />
                  ))}
              </View>
            )}
            
            {/* Text Message Bubble (only if there's text) */}
            {displayedText.trim() && (
              <LinearGradient
                colors={isDarkMode 
                  ? ['#2d2d2d', '#262626', '#232323'] 
                  : [theme.colors.chat.userMessage.background, theme.colors.chat.userMessage.background]
                }
                style={[
                  styles.messageBubble,
                  styles.userBubble,
                  {
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#404040' : 'rgba(0, 0, 0, 0.1)',
                    shadowColor: isDarkMode ? '#000000' : '#000000',
                    shadowOffset: { width: 2, height: 2 },
                    shadowOpacity: isDarkMode ? 0.3 : 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                ]}
              >
                <View style={styles.textContainer}>
                  <Text style={[
                    styles.messageText,
                    {
                      color: isDarkMode ? '#f5f5f5' : theme.colors.chat.userMessage.text,
                      letterSpacing: -0.3,
                      lineHeight: 30,
                      fontFamily: 'Nunito_400Regular',
                    }
                  ]}>
                    {displayedText}
                  </Text>
                </View>
              </LinearGradient>
            )}
          </View>
        ) : (
          /* Bot Message with AI Personality Features - No Bubble */
          <View style={styles.botMessageContainer}>
            {/* Message Options - Lower Right */}
            {isAI && !message.isStreaming && (
              <View style={styles.aiMessageOptionsContainer}>
                <TouchableOpacity
                  style={styles.aiOptionsButton}
                  onPress={() => {
                    // Future functionality: share, copy, etc.
                  }}
                >
                  <FontAwesome5 name="ellipsis-h" size={8} color={isDarkMode ? '#666' : '#333'} />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Personality Context Header */}
            {message.personalityContext && (
              <Animated.View style={[
                styles.personalityHeader,
                styles.personalityHeaderNoBubble,
                {
                  backgroundColor: getPersonalityColor(message.personalityContext.communicationStyle) + '15',
                  borderColor: getPersonalityColor(message.personalityContext.communicationStyle) + '30',
                  opacity: personalityHeaderOpacity,
                  transform: [{ translateY: personalityHeaderSlide }],
                }
              ]}>
                <FontAwesome5
                  name={getPersonalityIcon(message.personalityContext.communicationStyle)}
                  size={12}
                  color={getPersonalityColor(message.personalityContext.communicationStyle)}
                />
                <Text style={[
                  styles.personalityText,
                  { color: getPersonalityColor(message.personalityContext.communicationStyle) }
                ]}>
                  {getPersonalityLabel(message.personalityContext.communicationStyle)}
                  {message.personalityContext.adaptedResponse && ' • Adapted for you'}
                </Text>
                {message.personalityContext.userMoodDetected && (
                  <View style={[
                    styles.moodDetectedIndicator,
                    { backgroundColor: getMoodColor(message.personalityContext.userMoodDetected) }
                  ]}>
                    <Text style={styles.moodDetectedText}>
                      {message.personalityContext.userMoodDetected}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
            
            {/* Photo Attachments for AI Messages */}
            {message.attachments && message.attachments.length > 0 && (
              <View style={styles.aiPhotoAttachmentsContainer}>
                {message.attachments
                  .filter(attachment => attachment.type === 'image')
                  .map((attachment) => (
                    <PhotoPreview
                      key={attachment.id}
                      attachment={attachment}
                      isUser={false}
                      onPress={() => {
                        // Future: Open full-screen photo viewer
                        console.log('AI Photo pressed:', attachment.name);
                      }}
                    />
                  ))}
              </View>
            )}
            
            <BotMessageContent 
              text={displayedText}
              previousLength={previousLength}
              newContentOpacity={newContentOpacity}
              isStreaming={message.isStreaming}
              theme={{ isDarkMode }}
            />
            
            {/* AI Insight Section */}
            {message.aiInsight && (
              <View style={[
                styles.aiInsightContainer,
                {
                  backgroundColor: isDarkMode ? '#1a1a2e' : '#f8f9ff',
                  borderColor: isDarkMode ? '#4a4a6a' : '#e0e7ff',
                }
              ]}>
                <View style={styles.insightHeader}>
                  <FontAwesome5
                    name="lightbulb"
                    size={12}
                    color="#FFD93D"
                  />
                  <Text style={[
                    styles.insightTitle,
                    { color: isDarkMode ? '#ffd93d' : '#8b5a00' }
                  ]}>
                    Pattern Insight ({Math.round(message.aiInsight.confidence * 100)}%)
                  </Text>
                </View>
                <Text style={[
                  styles.insightPattern,
                  { color: isDarkMode ? '#ccc' : '#666' }
                ]}>
                  {message.aiInsight.pattern}
                </Text>
                <Text style={[
                  styles.insightSuggestion,
                  { color: isDarkMode ? '#a7f3d0' : '#065f46' }
                ]}>
                  💡 {message.aiInsight.suggestion}
                </Text>
              </View>
            )}
            
            {/* Timestamp - Bottom Left of AI Message (no bubble) */}
            <Text style={[
              TextStyles.timestamp,
              styles.aiMessageTimestamp,
              {
                color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[200],
              }
            ]}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        )}

        {/* Timestamp - show for user messages only (AI timestamp is inside the bubble) */}
        {isUser && (
          <Text style={[
            TextStyles.timestamp,
            styles.timestamp,
            styles.userTimestamp,
            {
              color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[200],
            }
          ]}>
            {formatTime(message.timestamp)}
          </Text>
        )}
      </TouchableOpacity>



    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 1,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
    paddingLeft: 10, 
  },
  messageWrapper: {
    maxWidth: width * 0.95,
  },
  userMessageWrapper: {
    maxWidth: width * 0.95,
  },
  botMessageContainer: {
    width: '100%',
    paddingHorizontal: 2,
    paddingVertical: 4,
    position: 'relative',
  },
  botTextContainer: {
    width: '100%',
    position: 'relative',
  },
  h1Text: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 12,
    fontFamily: 'Nunito_700Bold',
  },
  h2Text: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
    marginBottom: 10,
    marginTop: 8,
    fontFamily: 'Nunito_600SemiBold',
  },
  h3Text: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 8,
    marginTop: 6,
    fontFamily: 'Nunito_600SemiBold',
  },
  regularText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
    marginBottom: 12,
    fontFamily: 'Nunito_400Regular',
  },
  boldText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    marginRight: 8,
    width: 20,
    fontFamily: 'Nunito_600SemiBold',
  },
  bulletText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '400',
    flex: 1,
    fontFamily: 'Nunito_400Regular',
  },
  inlineTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  lineSpacing: {
    height: 12,
  },
  messageBubble: {
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userBubble: {
    borderRadius: 8,
  },
  aiBubble: {
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleGradient: {
    padding: 16,
    position: 'relative',
  },
  userBubbleGradient: {
    borderBottomRightRadius: 5,
  },
  aiBubbleGradient: {
    borderBottomLeftRadius: 5,
  },
  moodIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  streamingCursor: {
    opacity: 0.7,
    fontWeight: 'bold',
  },
  speakButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  userTimestamp: {
    textAlign: 'right',
  },
  aiTimestamp: {
    textAlign: 'left',
  },
  aiTimestampWithAvatar: {
    marginLeft: 6,
  },
  botMessageWithTimestamp: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  inlineTimestamp: {
    fontSize: 11,
    marginTop: 2,
    marginLeft: 2,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    alignSelf: 'flex-start',
  },


  // AI Personality Styles
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  personalityHeaderNoBubble: {
    marginLeft: 0,
    marginRight: 0,
    maxWidth: '90%',
  },
  personalityText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    flex: 1,
  },
  moodDetectedIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moodDetectedText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Nunito_600SemiBold',
  },
  aiInsightContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  insightPattern: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  insightSuggestion: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  messageOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // New professional AI message styles
  aiMessageOptionsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 1,
  },
  aiOptionsButton: {
    padding: 4,
    borderRadius: 8,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  aiMessageTimestamp: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    alignSelf: 'flex-start',
    marginTop: 6,
    marginLeft: 2,
    opacity: 0.6,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  photoAttachmentsContainer: {
    gap: 6,
    alignItems: 'flex-end',
  },
  aiPhotoAttachmentsContainer: {
    gap: 6,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
});