import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from "../contexts/SimpleAuthContext";
import { NuminaColors } from '../utils/colors';
import { ChatInput } from '../components/chat/ChatInput';
import { MessageBubble } from '../components/chat/MessageBubble';
import ConversationStorageService, { Message, Conversation } from '../services/conversationStorage';
import ChatService from '../services/chatService';
import { ConversationHistory } from '../components/ConversationHistory';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAIPersonality } from '../hooks/useAIPersonality';
import { useCloudMatching } from '../hooks/useCloudMatching';
import { useNuminaPersonality } from '../hooks/useNuminaPersonality';
import { ChatErrorBoundary } from '../components/ChatErrorBoundary';

interface ChatScreenProps {
  onNavigateBack: () => void;
  conversation?: Conversation;
  onConversationUpdate?: (conversation: Conversation) => void;
}

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC<ChatScreenProps> = ({ 
  onNavigateBack, 
  conversation: initialConversation,
  onConversationUpdate,
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { userData, logout } = useAuth();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [conversation, setConversation] = useState<Conversation | null>(initialConversation || null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // AI Personality Integration
  const {
    emotionalState,
    aiPersonality,
    isAnalyzing,
    sendAdaptiveChatMessage,
    getContextualSuggestions,
    getAdaptivePlaceholder,
    error: aiError,
  } = useAIPersonality();


  // Cloud Matching Integration  
  const {
    getPersonalizedRecommendations,
    error: cloudError,
  } = useCloudMatching();

  // Numina Personality Integration - This starts the frequent updates!
  const numinaPersonality = useNuminaPersonality(true); // true = active chat session
  
  // Get adaptive placeholder from AI Personality
  const getAdaptivePlaceholderText = useCallback(() => {
    if (emotionalState && aiPersonality) {
      return getAdaptivePlaceholder();
    }
    return "Share your thoughts...";
  }, [emotionalState, aiPersonality, getAdaptivePlaceholder]);
  
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Initialize conversation if none provided
  useEffect(() => {
    if (!conversation) {
      const welcomeMessage: Message = {
        id: '1',
        text: "Welcome to Numina! I'm here to help you explore, discover, and connect. What would you like to explore today?",
        sender: 'numina',
        timestamp: new Date().toISOString(),
      };
      
      const newConversation = ConversationStorageService.createConversation(welcomeMessage);
      setConversation(newConversation);
      saveConversation(newConversation);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const saveConversation = useCallback(async (conv: Conversation) => {
    try {
      const conversations = await ConversationStorageService.loadConversations();
      const existingIndex = conversations.findIndex(c => c.id === conv.id);
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = conv;
      } else {
        conversations.unshift(conv);
      }
      
      await ConversationStorageService.saveConversations(conversations);
      onConversationUpdate?.(conv);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [onConversationUpdate]);


  const sendMessage = async () => {
    if (!inputText.trim() || !conversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    // Add user message to conversation
    const updatedConversation = ConversationStorageService.addMessageToConversation(
      conversation, 
      userMessage
    );
    
    setConversation(updatedConversation);
    setInputText('');
    setIsLoading(true);

    // Save conversation with user message
    await saveConversation(updatedConversation);

    // Create AI message placeholder for streaming
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'numina',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    // Add placeholder AI message
    let currentConversation = ConversationStorageService.addMessageToConversation(
      updatedConversation, 
      aiMessage
    );
    setConversation(currentConversation);

    try {
      // Use AI Personality Service for adaptive chat if available
      let finalResponseText = '';
      let personalityContext = null;
      
      if (sendAdaptiveChatMessage && emotionalState && aiPersonality) {
        
        const adaptiveResult = await sendAdaptiveChatMessage(
          userMessage.text,
          (partialResponse: string, context?: any) => {
            // Validate partialResponse
            const safePartialResponse = partialResponse || '';
            
            // Update the AI message with streaming content
            const updatedAIMessage = {
              ...aiMessage,
              text: safePartialResponse,
              isStreaming: true,
              personalityContext: context,
            };
            
            // Update conversation with streaming response
            const streamingConversation = { ...currentConversation };
            if (streamingConversation.messages && streamingConversation.messages.length > 0) {
              streamingConversation.messages[streamingConversation.messages.length - 1] = updatedAIMessage;
              streamingConversation.updatedAt = new Date().toISOString();
              
              setConversation(streamingConversation);
              currentConversation = streamingConversation;
            }
          }
        );
        
        // Handle the response properly - it's an object with content and personalityContext
        if (adaptiveResult && typeof adaptiveResult === 'object') {
          finalResponseText = adaptiveResult.content || '';
          personalityContext = adaptiveResult.personalityContext || null;
        } else {
          finalResponseText = String(adaptiveResult || '');
        }
      } else {
        // Fallback to traditional chat service
        const chatResult = await ChatService.sendMessage(userMessage.text, (partialResponse: string) => {
          // Validate partialResponse
          const safePartialResponse = partialResponse || '';
          
          // Update the AI message with streaming content
          const updatedAIMessage = {
            ...aiMessage,
            text: safePartialResponse,
            isStreaming: true,
          };
          
          // Update conversation with streaming response
          const streamingConversation = { ...currentConversation };
          if (streamingConversation.messages && streamingConversation.messages.length > 0) {
            streamingConversation.messages[streamingConversation.messages.length - 1] = updatedAIMessage;
            streamingConversation.updatedAt = new Date().toISOString();
          
            setConversation(streamingConversation);
            currentConversation = streamingConversation;
          }
        });
        
        finalResponseText = String(chatResult || '');
      }
      
      // Validate final response
      if (!finalResponseText) {
        throw new Error('Empty response received from chat service');
      }
      
      // Finalize the AI message
      const finalAIMessage = {
        ...aiMessage,
        text: finalResponseText,
        isStreaming: false,
        personalityContext,
      };
      
      // Update conversation with final response
      const finalConversation = { ...currentConversation };
      if (finalConversation.messages && finalConversation.messages.length > 0) {
        finalConversation.messages[finalConversation.messages.length - 1] = finalAIMessage;
        finalConversation.updatedAt = new Date().toISOString();
        
        setConversation(finalConversation);
        await saveConversation(finalConversation);
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorText = "I'm having trouble connecting right now. Please check your internet connection and try again.";
      
      // Provide specific error messages based on the error type
      if (error.message?.includes('401') || error.message?.includes('not logged in')) {
        errorText = "Authentication required. Please log in again to continue our conversation.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorText = "Network connection issue. Please check your internet connection and try again.";
      } else if (error.message?.includes('timeout')) {
        errorText = "Request timed out. The server might be busy. Please try again in a moment.";
      }
      
      // Handle error with a helpful message
      try {
        const errorMessage: Message = {
          ...aiMessage,
          text: errorText,
          isStreaming: false,
        };
        
        const errorConversation = { ...currentConversation };
        if (errorConversation.messages && errorConversation.messages.length > 0) {
          errorConversation.messages[errorConversation.messages.length - 1] = errorMessage;
          errorConversation.updatedAt = new Date().toISOString();
          
          setConversation(errorConversation);
          await saveConversation(errorConversation);
        }
      } catch (saveError) {
        console.error('Failed to save error message:', saveError);
      }
      
      setIsLoading(false);
    }
  };

  // Removed generateAIResponse - now using real backend responses


  const handleVoiceStart = () => {
    setIsVoiceActive(true);
    // TODO: Implement actual voice recognition
  };

  const handleVoiceEnd = () => {
    setIsVoiceActive(false);
    // TODO: Process voice input
  };

  const handleMessageLongPress = (message: Message) => {
    Alert.alert(
      'Message Options',
      'What would you like to do with this message?',
      [
        { text: 'Copy', onPress: () => handleCopyMessage(message) },
        { text: 'Share', onPress: () => handleShareMessage(message) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCopyMessage = (message: Message) => {
    // TODO: Implement clipboard functionality
  };

  const handleShareMessage = async (message: Message) => {
    try {
      await Share.share({
        message: `From my chat with Numina: "${message.text}"`,
      });
    } catch (error) {
      console.error('Error sharing message:', error);
    }
  };

  const handleSpeakMessage = (text: string) => {
    // TODO: Implement text-to-speech
  };

  const handleSelectConversation = (selectedConversation: Conversation) => {
    setConversation(selectedConversation);
    onConversationUpdate?.(selectedConversation);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Safety check for item
    if (!item || !item.text) {
      console.warn('Invalid message item:', item);
      return null;
    }

    return (
      <ChatErrorBoundary
        fallback={
          <View style={{ padding: 16, backgroundColor: '#fee2e2', margin: 8, borderRadius: 8 }}>
            <Text style={{ color: '#dc2626', textAlign: 'center' }}>
              Message failed to render
            </Text>
          </View>
        }
      >
        <MessageBubble
          message={item}
          index={index}
          onLongPress={handleMessageLongPress}
          onSpeakMessage={handleSpeakMessage}
        />
      </ChatErrorBoundary>
    );
  };

  if (!conversation) {
    return (
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingScreen}>
            <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
              Loading conversation...
            </Text>
          </View>
        </SafeAreaView>
      </PageBackground>
    );
  }

  return (
    <ChatErrorBoundary
      onError={(error, errorInfo) => {
        console.error('ChatScreen Error:', error, errorInfo);
      }}
    >
      <ScreenWrapper
        showHeader={true}
        showBackButton={false}
        showMenuButton={true}
        title="Numina"
        subtitle={
          emotionalState 
            ? `🧠 AI Active • ${emotionalState.mood || 'Analyzing'} • ${emotionalState.intensity?.toFixed(1) || '?'}/10`
            : "Emotion Inference • Pattern Recognition • Deep Insights"
        }
      >
        <PageBackground>
          <SafeAreaView style={styles.container}>
            <StatusBar 
              barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
              backgroundColor="transparent"
              translucent={true}
            />
          
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Messages Container */}
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={conversation?.messages || []}
              renderItem={renderMessage}
              keyExtractor={item => item?.id || Math.random().toString()}
              style={styles.messagesList}
              onContentSizeChange={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              onLayout={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messagesContent}
              extraData={conversation?.messages?.length || 0} // Force re-render on new messages
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
            />


            {/* Enhanced AI-Powered Input */}
            <ChatInput
              value={inputText}
              onChangeText={setInputText}
              onSend={sendMessage}
              onVoiceStart={handleVoiceStart}
              onVoiceEnd={handleVoiceEnd}
              isLoading={isLoading || isAnalyzing}
              placeholder={getAdaptivePlaceholderText()}
              voiceEnabled={true}
              userEmotionalState={emotionalState || undefined}
              aiPersonality={aiPersonality as any || undefined}
              onPersonalityUpdate={(personality) => {
                // Handle personality updates
              }}
            />
          </KeyboardAvoidingView>


        </Animated.View>

        {/* Conversation History */}
        <ConversationHistory
          visible={historyVisible}
          onClose={() => setHistoryVisible(false)}
          onSelectConversation={handleSelectConversation}
          currentConversationId={conversation?.id}
        />
          </SafeAreaView>
        </PageBackground>
      </ScreenWrapper>
    </ChatErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 5,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 5,
  },
  messagesContent: {
    paddingTop: 100,
    paddingBottom: 100,
    flexGrow: 1,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});