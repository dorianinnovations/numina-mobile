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
}

interface MessageBubbleProps {
  message: Message;
  index: number;
  onLongPress?: (message: Message) => void;
  onSpeakMessage?: (text: string) => void;
}

// Component for rendering formatted bot messages
const BotMessageContent: React.FC<{
  text: string;
  previousLength: number;
  newContentOpacity: Animated.AnimatedAddition;
  isStreaming?: boolean;
  theme: any;
}> = ({ text, previousLength, newContentOpacity, isStreaming, theme }) => {
  
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
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
        const textElements: JSX.Element[] = [];
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
          color: '#86efac',
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
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isPressed, setIsPressed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [previousLength, setPreviousLength] = useState(0);
  
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
                  fontFamily: 'Inter_400Regular',
                }
              ]}>
                {displayedText}
              </Text>
            </View>
          </View>
        ) : (
          /* Bot Message - No Bubble, Full Width with Formatting */
          <View style={styles.botMessageContainer}>
            <BotMessageContent 
              text={displayedText}
              previousLength={previousLength}
              newContentOpacity={newContentOpacity}
              isStreaming={message.isStreaming}
              theme={theme}
            />
          </View>
        )}

        {/* Timestamp */}
        <Text style={[
          TextStyles.timestamp,
          styles.timestamp,
          isUser ? styles.userTimestamp : styles.aiTimestamp,
          {
            color: isDarkMode ? NuminaColors.darkMode[400] : NuminaColors.darkMode[500],
          }
        ]}>
          {formatTime(message.timestamp)}
        </Text>
      </TouchableOpacity>

      {/* Message Status Indicator */}
      {isUser && (
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: NuminaColors.chatGreen[200] }
          ]} />
        </View>
      )}

      {/* AI Avatar */}
      {isAI && (
        <View style={[
          styles.avatarContainer,
          {
            backgroundColor: isDarkMode 
              ? NuminaColors.darkMode[600] 
              : NuminaColors.darkMode[200],
          }
        ]}>
          <FontAwesome5
            name="brain"
            size={12}
            color={isDarkMode ? '#86efac' : '#10b981'}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
    paddingLeft: 16, // Reduced padding for avatar
  },
  messageWrapper: {
    maxWidth: width * 0.75,
  },
  userMessageWrapper: {
    maxWidth: width * 0.93,
  },
  botMessageContainer: {
    width: '100%',
    paddingHorizontal: 0,
  },
  botTextContainer: {
    width: '100%',
  },
  // Typography styles for bot messages
  h1Text: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 12,
    fontFamily: 'Inter_700Bold',
  },
  h2Text: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 10,
    marginTop: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  h3Text: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
    marginTop: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  regularText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  boldText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
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
    fontFamily: 'Inter_600SemiBold',
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    flex: 1,
    fontFamily: 'Inter_400Regular',
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
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Neumorphic shadow effects
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userBubble: {
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    borderBottomLeftRadius: 5,
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
    fontSize: 19.2,
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
  statusContainer: {
    position: 'absolute',
    bottom: 8,
    right: -8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
  },
  avatarContainer: {
    position: 'absolute',
    bottom: 0,
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});