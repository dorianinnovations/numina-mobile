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
  Keyboard,
  TouchableWithoutFeedback,
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
import { MessageAttachment } from '../types/message';
import ChatService from '../services/chatService';
import { ConversationHistory } from '../components/ConversationHistory';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Header } from '../components/Header';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAIPersonality } from '../hooks/useAIPersonality';
import { useCloudMatching } from '../hooks/useCloudMatching';
import { useNuminaPersonality } from '../hooks/useNuminaPersonality';
import { ChatErrorBoundary } from '../components/ChatErrorBoundary';

// Enhanced services integration
import batchApiService from '../services/batchApiService';
import websocketService, { ChatMessage as WSChatMessage, UserPresence } from '../services/websocketService';
import syncService from '../services/syncService';
import ToolExecutionService, { ToolExecution } from '../services/toolExecutionService';
import { AIToolExecutionStream } from '../components/AIToolExecutionStream';
import { ToolExecutionModal } from '../components/ToolExecutionModal';
import { SearchThoughtIndicator } from '../components/SearchThoughtIndicator';
import { useSearchIndicator } from '../hooks/useSearchIndicator';

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerPermanentlyHidden, setHeaderPermanentlyHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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
  
  // Search Thought Indicator Integration
  const {
    searchResults,
    isSearching,
    updateFromStreamingContent,
    updateFromFinalResponse,
    resetSearchState,
    hasActiveSearches,
  } = useSearchIndicator();
  
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
  
  // Enhanced features state
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [roomId] = useState<string>('general_chat');
  const [batchStats, setBatchStats] = useState(batchApiService.getStats());
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [toolExecutions, setToolExecutions] = useState<ToolExecution[]>([]);
  const [isToolStreamVisible, setIsToolStreamVisible] = useState(true);
  const [isToolModalVisible, setIsToolModalVisible] = useState(false);
  const [currentAIMessage, setCurrentAIMessage] = useState<string>('');
  const toolExecutionService = ToolExecutionService.getInstance();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // File attachment state
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  
  // Function to manually restore header with haptic feedback
  const restoreHeader = async () => {
    try {
      console.log('🎯 Touch gesture triggered! Restoring header...');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHeaderVisible(true);
      setHeaderPermanentlyHidden(false);
      console.log('✅ Header restored successfully');
    } catch (error) {
      console.log('⚠️ Haptics failed, restoring header without haptics');
      // Fallback if haptics fail
      setHeaderVisible(true);
      setHeaderPermanentlyHidden(false);
    }
  };

  // Initialize conversation and enhanced features
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

    // Initialize enhanced features
    initializeEnhancedFeatures();
    setupToolExecutionListeners();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    
    return () => {
      cleanup();
    };
  }, []);

  // Initialize enhanced features
  const initializeEnhancedFeatures = async () => {
    try {
      // Initialize WebSocket connection with better error handling
      const connected = await websocketService.initialize();
      setIsConnected(connected);
      
      if (connected) {
        websocketService.joinRoom(roomId, 'general');
        setupWebSocketListeners();
        await loadInitialDataBatch();
      } else {
        console.log('🔄 WebSocket connection failed, continuing without real-time features');
      }
      
      // Initialize sync service
      await syncService.initialize();
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
      
    } catch (error) {
      console.error('Failed to initialize enhanced features:', error);
      // Continue without enhanced features if initialization fails
    }
  };
  
  // Setup tool execution listeners
  const setupToolExecutionListeners = () => {
    toolExecutionService.on('executionsUpdated', (executions: ToolExecution[]) => {
      setToolExecutions(executions);
    });

    toolExecutionService.on('executionStarted', (execution: ToolExecution) => {
      console.log('🔧 Tool execution started:', execution.toolName);
      setIsToolStreamVisible(true);
    });

    toolExecutionService.on('executionCompleted', (execution: ToolExecution) => {
      console.log('✅ Tool execution completed:', execution.toolName);
    });
  };
  
  // Setup WebSocket listeners
  const setupWebSocketListeners = () => {
    websocketService.addEventListener('connection_status', (data) => {
      setIsConnected(data.connected);
      if (data.connected) {
        websocketService.joinRoom(roomId, 'general');
      }
    });

    websocketService.addEventListener('user_joined', (data: UserPresence) => {
      setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
    });

    websocketService.addEventListener('user_left', (data: UserPresence) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    websocketService.addEventListener('user_typing', (data: UserPresence) => {
      if (data.userId !== userData?.id) {
        setTypingUsers(prev => new Set(prev).add(data.userId));
      }
    });

    websocketService.addEventListener('user_stopped_typing', (data: UserPresence) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });
  };
  
  // Load initial data with batch API
  const loadInitialDataBatch = async () => {
    try {
      const initialData = await batchApiService.getInitialData();
      console.log('Initial data loaded:', {
        profile: !!initialData.profile,
        emotions: initialData.emotions?.length || 0,
        analytics: !!initialData.analytics,
        cloudEvents: initialData.cloudEvents?.length || 0
      });
      setBatchStats(batchApiService.getStats());
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };
  
  // Cleanup function
  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (isConnected) {
      websocketService.stopTyping(roomId);
      websocketService.leaveRoom(roomId);
    }
    
    syncService.cleanup();
  };

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


  const sendMessage = async (messageAttachments?: MessageAttachment[]) => {
    if ((!inputText.trim() && !messageAttachments?.length) || !conversation) return;

    // Reset search state for new message
    resetSearchState();

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      attachments: messageAttachments,
      hasFileContext: messageAttachments && messageAttachments.length > 0,
    };

    // Add user message to conversation
    const updatedConversation = ConversationStorageService.addMessageToConversation(
      conversation, 
      userMessage
    );
    
    setConversation(updatedConversation);
    const messageText = inputText.trim();
    setInputText('');
    setAttachments([]); // Clear attachments after sending
    setIsLoading(true);
    setCurrentAIMessage('');
    
    // Scroll to show the user's new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);

    // Send via WebSocket if connected (graceful fallback)
    if (isConnected) {
      try {
        websocketService.sendMessage(roomId, messageText, 'text');
      } catch (error) {
        console.warn('WebSocket send failed, continuing without real-time sync:', error);
      }
    }
    
    // Pre-detect potential tool executions
    const potentialTools = detectPotentialTools(messageText);
    potentialTools.forEach(tool => {
      toolExecutionService.startExecution(tool.name, tool.parameters);
    });

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
            
            // Update search indicator with streaming content
            updateFromStreamingContent(safePartialResponse);
            
            // Update current AI message for tool execution
            setCurrentAIMessage(safePartialResponse);
            
            // Hide header during streaming and make it sticky
            setHeaderVisible(false);
            setHeaderPermanentlyHidden(true);
            
            // Process tool executions from streaming response
            toolExecutionService.processStreamingToolResponse(safePartialResponse);
            toolExecutionService.detectToolExecutionsInMessage(safePartialResponse);
            
            // Update the AI message with streaming content
            const updatedAIMessage = {
              ...aiMessage,
              text: safePartialResponse,
              isStreaming: true,
              personalityContext: context,
            };
            
            // Debug log personality context
            if (context) {
              console.log('🧠 CHAT: Streaming chunk with personality context:', context);
            }
            
            // Update conversation with streaming response
            const streamingConversation = { ...currentConversation };
            if (streamingConversation.messages && streamingConversation.messages.length > 0) {
              streamingConversation.messages[streamingConversation.messages.length - 1] = updatedAIMessage;
              streamingConversation.updatedAt = new Date().toISOString();
              
              setConversation(streamingConversation);
              currentConversation = streamingConversation;
            }
          },
          userMessage.attachments // Pass attachments for GPT-4o vision analysis
        );
        
        // Handle the response properly - it's an object with content and personalityContext
        if (adaptiveResult && typeof adaptiveResult === 'object') {
          finalResponseText = adaptiveResult.content || '';
          personalityContext = adaptiveResult.personalityContext || null;
          console.log('🧠 CHAT: Adaptive result personality context:', personalityContext);
        } else {
          finalResponseText = String(adaptiveResult || '');
        }
        
        // Update search indicator with final response to extract tool results
        updateFromFinalResponse(finalResponseText);
      } else {
        // Fallback to traditional chat service
        const chatResult = await ChatService.sendMessage(messageText, (partialResponse: string) => {
          // Validate partialResponse
          const safePartialResponse = partialResponse || '';
          
          // Update current AI message for tool execution
          setCurrentAIMessage(safePartialResponse);
          
          // Hide header during streaming and make it sticky
          setHeaderVisible(false);
          setHeaderPermanentlyHidden(true);
          
          // Process tool executions from streaming response
          toolExecutionService.processStreamingToolResponse(safePartialResponse);
          toolExecutionService.detectToolExecutionsInMessage(safePartialResponse);
          
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
      
      console.log('🧠 CHAT: Final AI message with personality context:', {
        hasPersonalityContext: !!personalityContext,
        personalityContext: personalityContext
      });
      
      // Send AI response via WebSocket (graceful fallback)
      if (isConnected) {
        try {
          websocketService.sendMessage(roomId, finalResponseText, 'ai_response');
        } catch (error) {
          console.warn('WebSocket AI response send failed, continuing without real-time sync:', error);
        }
      }
      
      // Clean up old tool executions
      toolExecutionService.cleanupOldExecutions();
      
      // Update conversation with final response
      const finalConversation = { ...currentConversation };
      if (finalConversation.messages && finalConversation.messages.length > 0) {
        finalConversation.messages[finalConversation.messages.length - 1] = finalAIMessage;
        finalConversation.updatedAt = new Date().toISOString();
        
        setConversation(finalConversation);
        await saveConversation(finalConversation);
      }
      
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentAIMessage('');
      
      // Don't automatically restore header - let it stay hidden
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
      setIsStreaming(false);
      setCurrentAIMessage('');
      
      // Don't automatically restore header after error - let it stay hidden
    }
  };
  
  // Detect potential tools from user message
  const detectPotentialTools = (message: string): Array<{name: string, parameters: any}> => {
    const tools = [];
    const lowerMessage = message.toLowerCase();
    
    // Web search detection
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look up')) {
      tools.push({ name: 'web_search', parameters: { query: message } });
    }
    
    // Music detection
    if (lowerMessage.includes('music') || lowerMessage.includes('song') || lowerMessage.includes('playlist')) {
      tools.push({ name: 'music_recommendations', parameters: { query: message } });
    }
    
    // Restaurant detection
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('dinner') || lowerMessage.includes('reservation')) {
      tools.push({ name: 'reservation_booking', parameters: { query: message } });
    }
    
    // Travel detection
    if (lowerMessage.includes('travel') || lowerMessage.includes('trip') || lowerMessage.includes('vacation')) {
      tools.push({ name: 'itinerary_generator', parameters: { query: message } });
    }
    
    return tools;
  };
  
  // Handle input changes with typing indicators
  const handleInputChange = (text: string) => {
    setInputText(text);
    
    // Send typing indicator
    if (isConnected && text.trim()) {
      websocketService.startTyping(roomId);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        websocketService.stopTyping(roomId);
      }, 2000);
    } else if (isConnected) {
      websocketService.stopTyping(roomId);
    }
  };
  
  // Handle sync data
  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      const result = await syncService.forceFullSync();
      
      if (result.success) {
        Alert.alert('Success', 'Data synchronized successfully');
        setSyncStatus(await syncService.getSyncStatus());
      } else {
        Alert.alert('Error', result.errors.join(', '));
      }
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    
    const typingUserNames = Array.from(typingUsers).map(userId => {
      const user = onlineUsers.find(u => u.userId === userId);
      return user?.userData?.username || 'Someone';
    });
    
    return (
      <View style={[styles.typingIndicator, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.typingText, { color: theme.colors.secondary }]}>
          {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...
        </Text>
      </View>
    );
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
        showConversationsButton={true}
        onConversationSelect={handleSelectConversation}
        currentConversationId={conversation?.id}
        title="Numina"
        subtitle={
          hasActiveSearches || isSearching
            ? `🔍 AI Thinking • ${searchResults.length} searches • Real-time insights`
            : emotionalState 
            ? `🧠 AI Active • ${emotionalState.mood || 'Analyzing'} • ${emotionalState.intensity?.toFixed(1) || '?'}/10`
            : "Live Search • Intelligent Tools • Deep Understanding"
        }
        headerProps={{
          isVisible: headerVisible,
          isStreaming: isStreaming,
        }}
      >
        <PageBackground>
          <SafeAreaView style={styles.container}>
            <StatusBar 
              barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
              backgroundColor="transparent"
              translucent={true}
            />
            {/* Search Thought Indicator */}
            {(hasActiveSearches || isSearching) && (
              <View style={styles.searchIndicatorContainer}>
                <SearchThoughtIndicator
                  isSearching={isSearching}
                  searchResults={searchResults}
                  emotionalState={emotionalState}
                />
              </View>
            )}
            
            {/* Header Restore Touch Area - Invisible - Outside TouchableWithoutFeedback */}
            {headerPermanentlyHidden && (
              <TouchableOpacity 
                style={styles.headerRestoreArea}
                onPress={restoreHeader}
                activeOpacity={1}
                onPressIn={() => console.log('🎯 Touch area pressed!')}
              />
            )}
            
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
                      // Only scroll to end for user messages or initial conversation
                      if (conversation?.messages && conversation.messages.length <= 2) {
                        setTimeout(() => {
                          flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }
                    }}
                    onScroll={(event) => {
                      const currentScrollY = event.nativeEvent.contentOffset.y;
                      const scrollDelta = currentScrollY - lastScrollY;
                      
                      // Hide header immediately when scrolling down and make it sticky
                      if (scrollDelta > 0) {
                        setHeaderVisible(false);
                        setHeaderPermanentlyHidden(true);
                      }
                      // Only show header when scrolling up IF not permanently hidden
                      else if (scrollDelta < 0) {
                        if (!headerPermanentlyHidden && !isStreaming) {
                          setHeaderVisible(true);
                        }
                      }
                      
                      setLastScrollY(currentScrollY);
                    }}
                    onLayout={() => {
                      // Only scroll to end for initial conversation setup
                      if (conversation?.messages && conversation.messages.length <= 2) {
                        setTimeout(() => {
                          flatListRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }
                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.messagesContent}
                    extraData={conversation?.messages?.length || 0} // Force re-render on new messages
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                      autoscrollToTopThreshold: 10,
                    }}
                  />

                  {/* Tool Execution Modal */}
                  <ToolExecutionModal
                    visible={isToolModalVisible}
                    onClose={() => setIsToolModalVisible(false)}
                    toolExecutions={toolExecutions}
                    currentMessage={currentAIMessage}
                    onAttachmentSelected={(attachment) => {
                      const newAttachments = [...attachments, attachment];
                      setAttachments(newAttachments);
                    }}
                  />
                  
                  {renderTypingIndicator()}
                  
                  {/* Enhanced AI-Powered Input */}
                  <ChatInput
                    value={inputText}
                    onChangeText={handleInputChange}
                    onSend={sendMessage}
                    onVoiceStart={handleVoiceStart}
                    onVoiceEnd={handleVoiceEnd}
                    isLoading={isLoading || isAnalyzing}
                    placeholder={getAdaptivePlaceholderText()}
                    voiceEnabled={true}
                    userEmotionalState={emotionalState || undefined}
                    toolExecutions={toolExecutions}
                    onToggleToolModal={() => setIsToolModalVisible(true)}
                    attachments={attachments}
                    onAttachmentsChange={setAttachments}
                    enableFileUpload={true}
                    maxAttachments={5}
                  />
                </KeyboardAvoidingView>
              </Animated.View>
            </TouchableWithoutFeedback>
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
  searchIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
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
    paddingTop: 180,
    paddingBottom: 120,
    flexGrow: 1,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  headerRestoreArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 9999,
    backgroundColor: 'transparent',
  },
});