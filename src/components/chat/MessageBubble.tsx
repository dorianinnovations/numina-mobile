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
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { TextStyles } from '../../utils/fonts';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'numina';
  timestamp: string;
  mood?: string;
  isStreaming?: boolean;
  // AI Personality Features
  personalityContext?: {
    communicationStyle: 'empathetic' | 'direct' | 'collaborative' | 'encouraging';
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

// Component for rendering formatted bot messages
const BotMessageContent: React.FC<{
  text: string;
  previousLength: number;
  newContentOpacity: Animated.Value;
  isStreaming?: boolean;
  theme: any;
}> = ({ text, previousLength, newContentOpacity, isStreaming, theme }) => {
  
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        elements.push(<View key={`space-${index}`} style={styles.lineSpacing} />);
        return;
      }
      
      // H1 - Lines starting with # 
      if (line.startsWith('# ')) {
        elements.push(
          <Text key={index} style={[
            styles.h1Text,
            { color: theme.colors.chat.aiMessage.text }
          ]}>
            {line.replace('# ', '')}
          </Text>
        );
      }
      // H2 - Lines starting with ##
      else if (line.startsWith('## ')) {
        elements.push(
          <Text key={index} style={[
            styles.h2Text,
            { color: theme.colors.chat.aiMessage.text }
          ]}>
            {line.replace('## ', '')}
          </Text>
        );
      }
      // H3 - Lines starting with ###
      else if (line.startsWith('### ')) {
        elements.push(
          <Text key={index} style={[
            styles.h3Text,
            { color: theme.colors.chat.aiMessage.text }
          ]}>
            {line.replace('### ', '')}
          </Text>
        );
      }
      // Bullet points - Lines starting with - or *
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <View key={index} style={styles.bulletContainer}>
            <Text style={[
              styles.bulletPoint,
              { color: theme.colors.chat.aiMessage.text }
            ]}>•</Text>
            <Text style={[
              styles.bulletText,
              { color: theme.colors.chat.aiMessage.text }
            ]}>
              {line.replace(/^[\-\*] /, '')}
            </Text>
          </View>
        );
      }
      // Numbered lists - Lines starting with numbers
      else if (/^\d+\. /.test(line)) {
        const match = line.match(/^(\d+)\. (.*)/);
        if (match) {
          elements.push(
            <View key={index} style={styles.bulletContainer}>
              <Text style={[
                styles.bulletPoint,
                { color: theme.colors.chat.aiMessage.text }
              ]}>{match[1]}.</Text>
              <Text style={[
                styles.bulletText,
                { color: theme.colors.chat.aiMessage.text }
              ]}>
                {match[2]}
              </Text>
            </View>
          );
        }
      }
      // Bold text **text**
      else if (line.includes('**')) {
        const parts = line.split('**');
        const textElements: React.ReactElement[] = [];
        parts.forEach((part, partIndex) => {
          if (partIndex % 2 === 0) {
            // Normal text
            if (part) {
              textElements.push(
                <Text key={partIndex} style={[
                  styles.regularText,
                  { color: theme.colors.chat.aiMessage.text }
                ]}>
                  {part}
                </Text>
              );
            }
          } else {
            // Bold text
            textElements.push(
              <Text key={partIndex} style={[
                styles.boldText,
                { color: theme.colors.chat.aiMessage.text }
              ]}>
                {part}
              </Text>
            );
          }
        });
        elements.push(
          <View key={index} style={styles.inlineTextContainer}>
            {textElements}
          </View>
        );
      }
      // Regular paragraph text
      else {
        elements.push(
          <Text key={index} style={[
            styles.regularText,
            { color: theme.colors.chat.aiMessage.text }
          ]}>
            {line}
          </Text>
        );
      }
    });
    
    return elements;
  };
  
  return (
    <View style={styles.botTextContainer}>
      {/* Previous content at full opacity */}
      <View>
        {renderFormattedText(text.slice(0, previousLength))}
      </View>
      
      {/* New content with fade animation */}
      <Animated.View style={{ opacity: newContentOpacity }}>
        {renderFormattedText(text.slice(previousLength))}
      </Animated.View>
      
      {isStreaming && (
        <Text style={[styles.streamingCursor, {
          color: '#86c0ef',
        }]}>|</Text>
      )}
    </View>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
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
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const newContentOpacity = useRef(new Animated.Value(1)).current;

  const isUser = message.sender === 'user';
  const isAI = message.sender === 'numina';

  // Entry animation with stagger
  useEffect(() => {
    const delay = index * 100; // Stagger animation based on index
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: false,
      }),
    ]).start();
  }, [index]);

  // Progressive fade-in for new content chunks
  useEffect(() => {
    setDisplayedText(message.text);
    
    if (message.text && message.isStreaming) {
      // Check if new content was added
      if (message.text.length > previousLength) {
        // Animate the new content fading in
        newContentOpacity.setValue(0.3);
        Animated.timing(newContentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        setPreviousLength(message.text.length);
      }
    } else if (message.text && !message.isStreaming) {
      // Completed message - ensure full opacity
      newContentOpacity.setValue(1);
      setPreviousLength(message.text.length);
    }
  }, [message.text, message.isStreaming]);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.timing(pressAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: false,
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
      case 'empathetic': return '#FF6B9D';
      case 'direct': return '#4DABF7';
      case 'collaborative': return '#6BCF7F';
      case 'encouraging': return '#FFD93D';
      default: return '#8E8E93';
    }
  };

  const getPersonalityIcon = (style: string) => {
    switch (style) {
      case 'empathetic': return 'heart';
      case 'direct': return 'bullseye';
      case 'collaborative': return 'users';
      case 'encouraging': return 'star';
      default: return 'comment';
    }
  };

  const getPersonalityLabel = (style: string) => {
    switch (style) {
      case 'empathetic': return 'Empathetic Mode';
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
          /* User Message Bubble */
          <View style={[
            styles.messageBubble,
            styles.userBubble,
            {
              backgroundColor: theme.colors.chat.userMessage.background,
            }
          ]}>
            <View style={styles.textContainer}>
              <Text style={[
                styles.messageText,
                {
                  color: theme.colors.chat.userMessage.text,
                  letterSpacing: -0.3,
                  fontFamily: 'Nunito_400Regular',
                }
              ]}>
                {displayedText}
              </Text>
            </View>
          </View>
        ) : (
          /* Bot Message with AI Personality Features */
          <View style={styles.botMessageContainer}>
            {/* Personality Context Header */}
            {message.personalityContext && (
              <View style={[
                styles.personalityHeader,
                {
                  backgroundColor: getPersonalityColor(message.personalityContext.communicationStyle) + '15',
                  borderColor: getPersonalityColor(message.personalityContext.communicationStyle) + '30',
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
              </View>
            )}
            
            <BotMessageContent 
              text={displayedText}
              previousLength={previousLength}
              newContentOpacity={newContentOpacity}
              isStreaming={message.isStreaming}
              theme={theme}
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
            
            {/* Personality Feedback */}
            {isAI && !message.isStreaming && !feedbackGiven && (
              <View style={styles.feedbackContainer}>
                <TouchableOpacity
                  style={[styles.feedbackButton, { backgroundColor: '#10b98120' }]}
                  onPress={() => {
                    onPersonalityFeedback?.('helpful');
                    setFeedbackGiven(true);
                  }}
                >
                  <FontAwesome5 name="thumbs-up" size={12} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackButton, { backgroundColor: '#ef444420' }]}
                  onPress={() => {
                    onPersonalityFeedback?.('not_helpful');
                    setFeedbackGiven(true);
                  }}
                >
                  <FontAwesome5 name="thumbs-down" size={12} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.feedbackButton, { backgroundColor: '#ff6b9d20' }]}
                  onPress={() => {
                    onPersonalityFeedback?.('love_it');
                    setFeedbackGiven(true);
                  }}
                >
                  <FontAwesome5 name="heart" size={12} color="#ff6b9d" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Timestamp */}
        <Text style={[
          TextStyles.timestamp,
          styles.timestamp,
          isUser ? styles.userTimestamp : styles.aiTimestamp,
          isAI && styles.aiTimestampWithAvatar,
          {
            color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[200],
          }
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </TouchableOpacity>



      {/* AI Avatar */}
      {isAI && (
        <View style={[
          styles.avatarContainer,
          {
            backgroundColor: isDarkMode 
              ? NuminaColors.darkMode[600] 
              : NuminaColors.darkMode[100],
          }
        ]}>
          <FontAwesome5
            name="seedling"
            size={17}
            color={isDarkMode ? '#7ccbff' : '#7ccbff'}
          />
        </View>
      )}
    </Animated.View>
  );
};

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
  },
  botTextContainer: {
    width: '100%',
  },
  h1Text: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 12,
    fontFamily: 'Nunito_700Bold',
  },
  h2Text: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 10,
    marginTop: 8,
    fontFamily: 'Nunito_600SemiBold',
  },
  h3Text: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
    marginTop: 6,
    fontFamily: 'Nunito_600SemiBold',
  },
  regularText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
    marginBottom: 12,
    fontFamily: 'Nunito_400Regular',
  },
  boldText: {
    fontSize: 16,
    lineHeight: 24,
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
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    marginRight: 8,
    width: 20,
    fontFamily: 'Nunito_600SemiBold',
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userBubble: {
    borderBottomRightRadius: 15,
  },
  aiBubble: {
    borderBottomLeftRadius: 15,
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
    fontSize: 15.2,
    lineHeight: 26.4,
    fontWeight: '400',
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
    marginTop: 4,
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

  avatarContainer: {
    position: 'absolute',
    bottom: 1,
    left: 64,
    width: 15,
    height: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  // AI Personality Styles
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
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
  feedbackContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  feedbackButton: {
    padding: 8,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});