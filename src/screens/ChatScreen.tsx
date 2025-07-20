import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import * as Haptics from 'expo-haptics';
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

import getBatchApiService from '../services/batchApiService';
import getWebSocketService, { ChatMessage as WSChatMessage, UserPresence } from '../services/websocketService';
import syncService from '../services/syncService';
import ToolExecutionService, { ToolExecution } from '../services/toolExecutionService';
import { ToolExecutionModal } from '../components/ToolExecutionModal';
import { QuickAnalyticsModal } from '../components/QuickAnalyticsModal';

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
  const [isTouchActive, setIsTouchActive] = useState(false);
  const [scrollDebounceTimeout, setScrollDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const websocketService = useMemo(() => getWebSocketService(), []);
  const batchApiService = useMemo(() => getBatchApiService(), []);

  const {
    emotionalState,
    aiPersonality,
    isAnalyzing,
    sendAdaptiveChatMessage,
    getContextualSuggestions,
    getAdaptivePlaceholder,
    error: aiError,
  } = useAIPersonality();

  const {
    getPersonalizedRecommendations,
    error: cloudError,
  } = useCloudMatching();

  const numinaPersonality = useNuminaPersonality(true);
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
  const [showQuickAnalyticsModal, setShowQuickAnalyticsModal] = useState(false);
  const [ubpmInsights, setUbpmInsights] = useState<any[]>([]);

  const toolExecutionService = ToolExecutionService.getInstance();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const createManagedTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = setTimeout(() => {
      animationTimeoutRefs.current.delete(timeoutId);
      callback();
    }, delay);
    animationTimeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);
  
  const restoreHeader = async () => {
    try {
      console.log('🎯 Touch gesture triggered! Restoring header...');
      
      if (scrollDebounceTimeout) {
        clearTimeout(scrollDebounceTimeout);
        setScrollDebounceTimeout(null);
      }
      
      setIsTouchActive(true);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHeaderVisible(true);
      setHeaderPermanentlyHidden(false);
      console.log('✅ Header restored successfully');
      
      createManagedTimeout(() => {
        setIsTouchActive(false);
      }, 500);
      
    } catch (error) {
      console.log('⚠️ Haptics failed, restoring header without haptics');
      setHeaderVisible(true);
      setHeaderPermanentlyHidden(false);
      
      createManagedTimeout(() => {
        setIsTouchActive(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
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
    setupWebSocketListeners();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    
    return () => {
      cleanup();
    };
  }, []); // Empty dependency array to run only once

  // Cleanup scroll debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollDebounceTimeout) {
        clearTimeout(scrollDebounceTimeout);
      }
    };
  }, [scrollDebounceTimeout]);

  // Initialize enhanced features
  const initializeEnhancedFeatures = async () => {
    try {
      // Clean up any existing listeners first
      cleanup();
      
      // Initialize WebSocket connection with better error handling
      const connected = await websocketService.initialize();
      setIsConnected(connected);
      
      if (connected) {
        websocketService.joinRoom(roomId, 'general');
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

    // UBPM WebSocket listeners
    websocketService.addEventListener('ubpm_notification', (data: any) => {
      console.log('🧠 UBPM notification received:', data);
      setUbpmInsights(prev => [data, ...prev]);
      // Show the tool stream when UBPM insights arrive
      setIsToolStreamVisible(true);
    });

    websocketService.addEventListener('ubpm_insight', (data: any) => {
      console.log('🧠 UBPM insight received:', data);
      setUbpmInsights(prev => [data, ...prev]);
      // Show the tool stream when UBPM insights arrive
      setIsToolStreamVisible(true);
    });

    // Tool execution WebSocket listeners - trigger beautiful status indicators
    websocketService.addEventListener('tool_execution_start', (data: any) => {
      console.log('🔧 WebSocket: Tool execution started:', data);
      // Start tool execution in the service to trigger beautiful modal
      const executionId = toolExecutionService.startExecution(data.toolName, { 
        fromWebSocket: true,
        progress: data.progress,
        message: data.message 
      });
      setIsToolStreamVisible(true);
    });

    websocketService.addEventListener('tool_execution_complete', (data: any) => {
      console.log('✅ WebSocket: Tool execution completed:', data);
      // Find the execution and mark it complete
      const activeExecutions = toolExecutionService.getActiveExecutions();
      const execution = activeExecutions.find(exec => exec.toolName === data.toolName);
      if (execution) {
        if (data.success) {
          toolExecutionService.completeExecution(execution.id, data);
        } else {
          toolExecutionService.failExecution(execution.id, data.message || 'Tool execution failed');
        }
      }
    });
  };

  // Handle UBPM insight acknowledgment
  const handleAcknowledgeUBPM = (insightId: string) => {
    setUbpmInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, status: 'acknowledged' }
          : insight
      )
    );
  };

  const handleQuickAnalyticsQuery = (query: string) => {
    console.log('🧠 Quick analytics query:', query);
    setInputText(query);
    setTimeout(() => {
      sendMessage();
    }, 100);
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
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Clear scroll debounce timeout
    if (scrollDebounceTimeout) {
      clearTimeout(scrollDebounceTimeout);
      setScrollDebounceTimeout(null);
    }
    
    // Clear all managed animation timeouts
    animationTimeoutRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    animationTimeoutRefs.current.clear();
    
    // WebSocket cleanup
    if (isConnected) {
      websocketService.stopTyping(roomId);
      websocketService.leaveRoom(roomId);
    }
    
    // Clean up WebSocket listeners to prevent duplicates
    websocketService.removeEventListener('connection_status');
    websocketService.removeEventListener('user_joined');
    websocketService.removeEventListener('user_left');
    websocketService.removeEventListener('user_typing');
    websocketService.removeEventListener('user_stopped_typing');
    websocketService.removeEventListener('ubpm_notification');
    websocketService.removeEventListener('ubpm_insight');
    websocketService.removeEventListener('tool_execution_start');
    websocketService.removeEventListener('tool_execution_complete');
    websocketService.removeEventListener('tool_execution_progress');
    
    // Clean up tool execution listeners
    toolExecutionService.removeAllListeners();
    
    // Sync service cleanup
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
    // Search state removed

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
    setIsLoading(true);
    setCurrentAIMessage('');
    
    // Clear attachments after a delay to allow UI rendering
    createManagedTimeout(() => {
      setAttachments([]);
    }, 500); // Give UI time to render the message with attachments
    
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
      
      // Use adaptive chat for full features (personality, tools, UBPM)
      const adaptiveResult = await sendAdaptiveChatMessage(
        userMessage.text,
        (partialResponse: string, context?: any) => {
          // Validate partialResponse
          const safePartialResponse = partialResponse || '';
          
          // Update search indicator with streaming content
          // Search indicator removed
          
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
          
          // Log personality context
          if (context) {
            console.log('🧠 CHAT: Received personality context:', context);
          }
          
          // Update conversation with streaming response
          const streamingConversation = { ...currentConversation };
          if (streamingConversation.messages && streamingConversation.messages.length > 0) {
            streamingConversation.messages[streamingConversation.messages.length - 1] = updatedAIMessage;
            streamingConversation.updatedAt = new Date().toISOString();
            
            setConversation(streamingConversation);
            currentConversation = streamingConversation;
            // Scroll to show streaming content
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 50);
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
      // Search indicator removed
      
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
    // Voice recognition implementation needed
  };

  const handleVoiceEnd = () => {
    setIsVoiceActive(false);
    // Process voice input
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
    // Clipboard functionality needed
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
    // Text-to-speech implementation needed
  };

  const handleSelectConversation = (selectedConversation: Conversation) => {
    setConversation(selectedConversation);
    onConversationUpdate?.(selectedConversation);
  };

  const handleStartNewChat = () => {
    // Save current conversation if it exists and has messages (non-blocking)
    if (conversation && conversation.messages.length > 0) {
      saveConversation(conversation).catch(console.error);
    }
    
    // Immediately clear everything - no waiting, no intermediate states
    setConversation(null);
    setInputText('');
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    // Safety check for item - allow empty text for streaming messages
    if (!item || (!item.text && !item.isStreaming)) {
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

  // Industry standard: Auto-create conversation on first message
  // No special "no conversation" state needed
  if (!conversation) {
    // Create a new empty conversation immediately
    const newConversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversation(newConversation);
    // Return null briefly while state updates
    return null;
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
        showQuickAnalyticsButton={true}
        onConversationSelect={handleSelectConversation}
        onStartNewChat={handleStartNewChat}
        onQuickAnalyticsPress={() => setShowQuickAnalyticsModal(true)}
        currentConversationId={conversation?.id}
        title="Numina"
        headerProps={{
          isVisible: headerVisible,
          isStreaming: isStreaming,
          onRestoreHeader: restoreHeader,
        }}
      >
        <PageBackground>
          <SafeAreaView style={styles.container}>
            <StatusBar 
              barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
              backgroundColor="transparent"
              translucent={true}
            />
            {/* Search Thought Indicator - Removed */}
            
            {/* Header Restore Touch Area - Invisible - Outside TouchableWithoutFeedback */}
            {headerPermanentlyHidden && (
              <TouchableOpacity 
                style={styles.headerRestoreArea}
                onPress={restoreHeader}
                onPressIn={() => {
                  console.log('🎯 Touch area pressed!');
                  setIsTouchActive(true);
                }}
                onPressOut={() => {
                  // Keep touch active for a bit longer to prevent scroll interference
                  setTimeout(() => {
                    if (!isTouchActive) {
                      setIsTouchActive(false);
                    }
                  }, 200);
                }}
                activeOpacity={1}
                delayPressIn={0}
                delayPressOut={0}
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
                      // Scroll to end for new messages and streaming content
                      setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    onScroll={(event) => {
                      const currentScrollY = event.nativeEvent.contentOffset.y;
                      const scrollDelta = currentScrollY - lastScrollY;
                      
                      // Always show header if near the top
                      if (currentScrollY <= 30) {
                        setHeaderVisible(true);
                        setHeaderPermanentlyHidden(false);
                        setLastScrollY(currentScrollY);
                        return;
                      }
                      
                      // Don't process scroll events if touch is active
                      if (isTouchActive) {
                        setLastScrollY(currentScrollY);
                        return;
                      }
                      
                      // Clear any existing debounce timeout
                      if (scrollDebounceTimeout) {
                        clearTimeout(scrollDebounceTimeout);
                      }
                      
                      // Debounce scroll events to prevent rapid state changes
                      const timeout = setTimeout(() => {
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
                      }, 50); // 50ms debounce
                      
                      setScrollDebounceTimeout(timeout);
                      setLastScrollY(currentScrollY);
                    }}
                    onLayout={() => {
                      // Scroll to end when layout changes (new messages added)
                      setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.messagesContent,
                      // Top-down message flow
                      { justifyContent: 'flex-start' }
                    ]}
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
                    ubpmInsights={ubpmInsights}
                    onAcknowledgeUBPM={handleAcknowledgeUBPM}
                    onAttachmentSelected={(attachment) => {
                      const newAttachments = [...attachments, attachment];
                      setAttachments(newAttachments);
                    }}
                    onSendQuickQuery={(query) => {
                      setInputText(query);
                      setTimeout(() => {
                        sendMessage();
                      }, 100);
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

            {/* Quick Analytics Modal */}
            <QuickAnalyticsModal
              visible={showQuickAnalyticsModal}
              onClose={() => setShowQuickAnalyticsModal(false)}
              onSendQuery={handleQuickAnalyticsQuery}
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
    paddingHorizontal: 2,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 2,
  },
  messagesContent: {
    paddingTop: 120,
    paddingBottom: 80,
    flexGrow: 1,
    justifyContent: 'flex-start',
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