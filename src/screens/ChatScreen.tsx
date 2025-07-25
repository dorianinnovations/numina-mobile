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
import { ToolStatusIndicator } from '../components/ai/ToolStatusIndicator';
import ConversationStorageService, { Message, Conversation } from '../services/conversationStorage';
import { useLocation } from '../hooks/useLocation';
import LocationContextService from '../services/locationContextService';
import { MessageAttachment } from '../types/message';
import { ConversationHistory } from '../components/ConversationHistory';
import { PageBackground } from '../components/ui/PageBackground';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useCloudMatching } from '../hooks/useCloudMatching';
import { ChatErrorBoundary } from '../components/dev/ChatErrorBoundary';
import { log } from '../utils/logger';
import { SubscriptionModal } from '../components/modals/SubscriptionModal';

import getBatchApiService from '../services/batchApiService';
import ApiService from '../services/api';
import getWebSocketService, { ChatMessage as WSChatMessage, UserPresence } from '../services/websocketService';
import syncService from '../services/syncService';
import ToolExecutionService, { ToolExecution } from '../services/toolExecutionService';
import { ToolExecutionModal } from '../components/modals/ToolExecutionModal';
import { useOptimizedStreaming } from '../hooks/useOptimizedStreaming';
import { QuickAnalyticsModal } from '../components/modals/QuickAnalyticsModal';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const websocketService = useMemo(() => {
    const { getEnhancedWebSocketService } = require('../services/enhancedWebSocketService');
    return getEnhancedWebSocketService();
  }, []);
  const batchApiService = useMemo(() => getBatchApiService(), []);


  const {
    getPersonalizedRecommendations,
    error: cloudError,
  } = useCloudMatching();

  
  // Location services for AI tools
  const { location, requestLocation } = useLocation();
  
  // Remove getAdaptivePlaceholderText and any use of getAdaptivePlaceholder
  // In the ChatInput component, set placeholder to 'Share your thoughts...'
  
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
  
  // Store WebSocket event handlers for proper cleanup
  const wsHandlersRef = useRef<{[key: string]: (data: any) => void}>({});
  
  // Streaming optimization
  const streamingUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { processStreamingContent, flushBuffer, scrollToEnd, getStreamingHandler } = useOptimizedStreaming({
    minUpdateInterval: 50, // Update max 20fps
    bufferSize: 30, // Buffer more characters
    scrollThrottle: 100, // Scroll max 10fps
    enableSmartBatching: true,
  });
  
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
      
      if (scrollDebounceTimeout) {
        clearTimeout(scrollDebounceTimeout);
        setScrollDebounceTimeout(null);
      }
      
      setIsTouchActive(true);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHeaderVisible(true);
      setHeaderPermanentlyHidden(false);
      
      createManagedTimeout(() => {
        setIsTouchActive(false);
      }, 500);
      
    } catch (error) {
      log.warn('Haptics failed, restoring header without haptics', null, 'ChatScreen');
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
        text: "Ask me anything to start our first chat",
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

  // Update location context service when location data changes
  useEffect(() => {
    LocationContextService.getInstance().setLocationData(location);
    if (location) {
      log.info('Location updated for AI tools', { location: location.city || 'coordinates' }, 'ChatScreen');
    }
  }, [location]);

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
        log.warn('WebSocket connection failed, continuing without real-time features', null, 'ChatScreen');
      }
      
      // Initialize sync service
      await syncService.initialize();
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
      
    } catch (error) {
      log.error('Failed to initialize enhanced features', error, 'ChatScreen');
      // Continue without enhanced features if initialization fails
    }
  };
  
  // Setup tool execution listeners
  const setupToolExecutionListeners = () => {
    toolExecutionService.on('executionsUpdated', (executions: ToolExecution[]) => {
      setToolExecutions(executions);
    });

    toolExecutionService.on('executionStarted', (execution: ToolExecution) => {
      log.info('Tool execution started', { toolName: execution.toolName }, 'ChatScreen');
      setIsToolStreamVisible(true);
    });

    toolExecutionService.on('executionCompleted', (execution: ToolExecution) => {
      log.info('Tool execution completed', { toolName: execution.toolName }, 'ChatScreen');
    });
  };
  
  // Setup WebSocket listeners
  const setupWebSocketListeners = () => {
    websocketService.addEventListener('connection_status', (data: { connected: boolean }) => {
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
      log.info('UBPM notification received', data, 'ChatScreen');
      setUbpmInsights(prev => [data, ...prev]);
      // Show the tool stream when UBPM insights arrive
      setIsToolStreamVisible(true);
    });

    websocketService.addEventListener('ubpm_insight', (data: any) => {
      log.info('UBPM insight received', data, 'ChatScreen');
      setUbpmInsights(prev => [data, ...prev]);
      // Show the tool stream when UBPM insights arrive
      setIsToolStreamVisible(true);
    });

    // Tool execution WebSocket listeners - trigger beautiful status indicators
    websocketService.addEventListener('tool_execution_start', (data: any) => {
      log.info('WebSocket: Tool execution started', data, 'ChatScreen');
      // Start tool execution in the service to trigger beautiful modal
      const executionId = toolExecutionService.startExecution(data.toolName, { 
        fromWebSocket: true,
        progress: data.progress,
        message: data.message 
      });
      setIsToolStreamVisible(true);
    });

    websocketService.addEventListener('tool_execution_complete', (data: any) => {
      log.info('WebSocket: Tool execution completed', data, 'ChatScreen');
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


  // Handle navigation to Analytics screen
  const handleNavigateToAnalytics = () => {
    navigation.navigate('Analytics');
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
    log.info('Quick analytics query', { query }, 'ChatScreen');
    setInputText(query);
    createManagedTimeout(() => {
      sendMessage();
    }, 100);
  };
  
  // Load initial data with batch API
  const loadInitialDataBatch = async () => {
    try {
      const initialData = await batchApiService.getInitialData();
      log.info('Initial data loaded', {
        profile: !!initialData.profile,
        emotions: initialData.emotions?.emotions?.length || 0,
        analytics: !!initialData.analytics,
        cloudEvents: initialData.cloudEvents?.length || 0
      }, 'ChatScreen');
      setBatchStats(batchApiService.getStats());
    } catch (error) {
      log.error('Failed to load initial data', error, 'ChatScreen');
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
    
    // Flush any remaining streaming content on cleanup
    flushBuffer(() => {});
    
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
    
    // Clean up WebSocket  to prevent duplicates
    try {
  
      
      // Call general cleanup if available
      websocketService.disconnect?.();
    } catch (error) {
      log.warn('WebSocket cleanup failed', error, 'ChatScreen');
    }
    
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
      log.error('Error saving conversation', error, 'ChatScreen');
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
    createManagedTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);

    // Send via WebSocket if connected (graceful fallback)
    if (isConnected) {
      try {
        websocketService.sendMessage(roomId, messageText, 'text');
      } catch (error) {
        log.warn('WebSocket send failed, continuing without real-time sync', error, 'ChatScreen');
      }
    }
    
    // Pre-detect potential tool executions
    const potentialTools = detectPotentialTools(messageText);
    if (potentialTools.length > 0) {
      potentialTools.forEach(tool => {
        toolExecutionService.startExecution(tool.name, tool.parameters);
      });
    }

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
      // Use standard chat service
      let finalResponseText = '';
      
      // Create chat message for API
      const chatMessage: any = {
        prompt: userMessage.text,
        stream: true,
        files: userMessage.attachments?.map(attachment => ({
          url: attachment.url,
          type: attachment.type,
          name: attachment.name
        }))
      };
      
      // Send streaming chat message with optimized handler
      let accumulatedContent = '';
      
      finalResponseText = await ApiService.sendChatMessageStreaming(
        chatMessage,
        (partialResponse: string) => {
          // Process streaming content with intelligent batching
          processStreamingContent(partialResponse, (bufferedContent) => {
            // Accumulate content
            accumulatedContent += bufferedContent;
            
            // Update current AI message for tool execution
            setCurrentAIMessage(accumulatedContent);
            
            // Hide header during streaming (only once)
            if (!headerPermanentlyHidden) {
              setHeaderVisible(false);
              setHeaderPermanentlyHidden(true);
            }
            
            // Process tool executions from accumulated response
            toolExecutionService.processStreamingToolResponse(accumulatedContent);
            toolExecutionService.detectToolExecutionsInMessage(accumulatedContent);
            
            // Update the AI message with optimized batching
            const updatedAIMessage = {
              ...aiMessage,
              text: accumulatedContent,
              isStreaming: true,
            };
            
            // Update conversation state efficiently
            if (currentConversation.messages && currentConversation.messages.length > 0) {
              const updatedConversation = {
                ...currentConversation,
                messages: [...currentConversation.messages.slice(0, -1), updatedAIMessage],
                updatedAt: new Date().toISOString()
              };
              
              setConversation(updatedConversation);
              
              // Throttled scroll
              scrollToEnd(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, false);
            }
          });
        }
      );
      
      // Flush any remaining buffered content
      flushBuffer((remainingContent) => {
        if (remainingContent) {
          accumulatedContent += remainingContent;
          setCurrentAIMessage(accumulatedContent);
        }
      });
      
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
      };
      
      
      // Send AI response via WebSocket (graceful fallback)
      if (isConnected) {
        try {
          websocketService.sendMessage(roomId, finalResponseText, 'ai_response');
        } catch (error) {
          log.warn('WebSocket AI response send failed, continuing without real-time sync', error, 'ChatScreen');
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
      
      // Flush any remaining streaming buffer
      flushBuffer((remainingContent) => {
        if (remainingContent) {
          log.debug('Flushed remaining streaming content', { length: remainingContent.length }, 'ChatScreen');
        }
      });
      
      // Don't automatically restore header - let it stay hidden
    } catch (error: any) {
      log.error('Chat error', error, 'ChatScreen');
      
      // Handle rate limit errors (429)
      if (error.status === 429 || error.isRateLimit || error.message?.includes('429') || error.message?.includes('Thank you for using Numina, please upgrade')) {
        // Clean up the upgrade message - remove technical error details
        let upgradeMessageText = error.message || 'Thank you for using Numina! Please upgrade to Pro or Aether for more chatting.';
        
        // If the message contains technical error info, use clean upgrade message instead
        if (upgradeMessageText.includes('Chat API request failed') || upgradeMessageText.includes('429')) {
          upgradeMessageText = 'Thank you for using Numina! Please upgrade to Pro or Aether for more chatting.';
        }
        
        
        // Add the upgrade message as a system message with wallet navigation
        try {
          const upgradeMessage: Message = {
            ...aiMessage,
            text: 'Upgrade to Aether for unlimited chatting. View your usage here',
            isStreaming: false,
            isSystem: true,
           
          };
          
          const errorConversation = { ...currentConversation };
          if (errorConversation.messages && errorConversation.messages.length > 0) {
            errorConversation.messages[errorConversation.messages.length - 1] = upgradeMessage;
            errorConversation.updatedAt = new Date().toISOString();
            
            setConversation(errorConversation);
            await saveConversation(errorConversation);
          }
          
          // No longer showing modal - message is inline now
        } catch (saveError) {
          log.error('Failed to save upgrade message', saveError, 'ChatScreen');
        }
        
        setIsLoading(false);
        setIsStreaming(false);
        setCurrentAIMessage('');
        
        if (streamingUpdateTimeoutRef.current) {
          clearTimeout(streamingUpdateTimeoutRef.current);
          streamingUpdateTimeoutRef.current = null;
        }
        return;
      }
      
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
        log.error('Failed to save error message', saveError, 'ChatScreen');
      }
      
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentAIMessage('');
      
      // Flush any remaining streaming buffer
      flushBuffer((remainingContent) => {
        if (remainingContent) {
          log.debug('Flushed remaining streaming content', { length: remainingContent.length }, 'ChatScreen');
        }
      });
      
      // Don't automatically restore header after error - let it stay hidden
    }
  };
  
  // Detect potential tools from user message - STRICT detection to avoid false positives
  const detectPotentialTools = (message: string): Array<{name: string, parameters: any}> => {
    const tools = [];
    const lowerMessage = message.toLowerCase();
    
    // Web search detection - only explicit search requests
    if (lowerMessage.includes('search for') || lowerMessage.includes('google') || 
        lowerMessage.includes('look up online') || lowerMessage.includes('find on the web')) {
      tools.push({ name: 'web_search', parameters: { query: message } });
    }
    
    // Music detection - only explicit music requests
    if ((lowerMessage.includes('play music') || lowerMessage.includes('music recommendation') || 
         lowerMessage.includes('find songs') || lowerMessage.includes('spotify playlist')) && 
         !lowerMessage.includes('what is music') && !lowerMessage.includes('how does music')) {
      tools.push({ name: 'music_recommendations', parameters: { query: message } });
    }
    
    // Calculator - only explicit calculations
    if (lowerMessage.includes('calculate') || lowerMessage.includes('what is') && 
        (lowerMessage.includes('+') || lowerMessage.includes('-') || lowerMessage.includes('*') || lowerMessage.includes('/'))) {
      tools.push({ name: 'calculator', parameters: { query: message } });
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
      log.error('Sync failed', error, 'ChatScreen');
      Alert.alert('Error', 'Sync failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubscriptionComplete = (plan: string) => {
    setShowSubscriptionModal(false);
    // Optionally show success message
    Alert.alert('Success', `Welcome to Numina ${plan}! You now have access to more features.`);
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

  const handleCopyMessage = async (message: Message) => {
    try {
      await Clipboard.setStringAsync(message.text || '');
      log.debug('Copy message', { text: message.text }, 'ChatScreen');
    } catch (error) {
      log.error('Failed to copy message', error, 'ChatScreen');
    }
  };

  const handleShareMessage = async (message: Message) => {
    try {
      await Share.share({
        message: `From my chat with Numina: "${message.text}"`,
      });
    } catch (error) {
      log.error('Error sharing message', error, 'ChatScreen');
    }
  };

  const handleSpeakMessage = (text: string) => {
    try {
      if (text && text.trim()) {
        Speech.speak(text, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.9,
        });
        log.debug('Speak message', { text }, 'ChatScreen');
      }
    } catch (error) {
      log.error('Failed to speak message', error, 'ChatScreen');
    }
  };

  const handleSelectConversation = (selectedConversation: Conversation) => {
    setConversation(selectedConversation);
    onConversationUpdate?.(selectedConversation);
  };

  const handleStartNewChat = () => {
    // Save current conversation if it exists and has messages (non-blocking)
    if (conversation && conversation.messages.length > 0) {
      saveConversation(conversation).catch(() => {});
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
                  setIsTouchActive(true);
                }}
                onPressOut={() => {
                  // Keep touch active for a bit longer to prevent scroll interference
                  createManagedTimeout(() => {
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
                      // Only scroll if not actively streaming
                      if (!isStreaming) {
                        flatListRef.current?.scrollToEnd({ animated: false });
                      }
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
                      // Instant scroll when layout changes (new messages added)
                      flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.messagesContent,
                      // Top-down message flow
                      { justifyContent: 'flex-start' }
                    ]}
                    // Performance optimizations for streaming
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={5}
                    updateCellsBatchingPeriod={50}
                    windowSize={10}
                    initialNumToRender={10}
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                      autoscrollToTopThreshold: 10,
                    }}
                    scrollEventThrottle={16}
                    extraData={conversation?.messages?.length || 0} // Force re-render on new messages
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
                      createManagedTimeout(() => {
                        sendMessage();
                      }, 100);
                    }}
                  />
                  
                  {renderTypingIndicator()}
                  
                  {/* Tool Status Indicator */}
                  <ToolStatusIndicator 
                    toolExecutions={toolExecutions}
                    onNavigateToAnalytics={handleNavigateToAnalytics}
                  />
                  
                  {/* Enhanced AI-Powered Input */}
                  <ChatInput
                    value={inputText}
                    onChangeText={handleInputChange}
                    onSend={sendMessage}
                    onVoiceStart={handleVoiceStart}
                    onVoiceEnd={handleVoiceEnd}
                    isLoading={isLoading}
                    placeholder="Share your thoughts..."
                    voiceEnabled={true}
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

            {/* Upgrade prompts are now inline in messages */}

            {/* Subscription Modal */}
            <SubscriptionModal
              visible={showSubscriptionModal}
              onClose={() => setShowSubscriptionModal(false)}
              onSubscribe={handleSubscriptionComplete}
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