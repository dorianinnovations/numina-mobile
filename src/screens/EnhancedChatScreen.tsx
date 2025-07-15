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
  Alert,
  ActivityIndicator,
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
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ChatErrorBoundary } from '../components/ChatErrorBoundary';

// NEW: Import enhanced services
import batchApiService from '../services/batchApiService';
import websocketService, { ChatMessage as WSChatMessage, UserPresence } from '../services/websocketService';
import syncService from '../services/syncService';
import appConfigService from '../services/appConfigService';

interface EnhancedChatScreenProps {
  onNavigateBack: () => void;
  conversation?: Conversation;
  onConversationUpdate?: (conversation: Conversation) => void;
}

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

export const EnhancedChatScreen: React.FC<EnhancedChatScreenProps> = ({ 
  onNavigateBack, 
  conversation: initialConversation,
  onConversationUpdate,
}) => {
  const { theme, isDarkMode } = useTheme();
  const { userData } = useAuth();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  
  // Enhanced state management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(initialConversation || null);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [roomId, setRoomId] = useState<string>('general_chat');
  const [batchStats, setBatchStats] = useState(batchApiService.getStats());
  const [syncStatus, setSyncStatus] = useState<any>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize enhanced features
  useEffect(() => {
    initializeEnhancedFeatures();
    return () => {
      cleanup();
    };
  }, []);

  const initializeEnhancedFeatures = async () => {
    try {
      // Initialize WebSocket connection
      const connected = await websocketService.initialize();
      setIsConnected(connected);
      
      if (connected) {
        // Join chat room
        websocketService.joinRoom(roomId, 'general');
        
        // Set up event listeners
        setupWebSocketListeners();
        
        // Get initial data using batch API
        await loadInitialDataBatch();
      }
      
      // Initialize sync service
      await syncService.initialize();
      
      // Get sync status
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
      
    } catch (error) {
      console.error('Failed to initialize enhanced features:', error);
    }
  };

  const setupWebSocketListeners = () => {
    // Connection status
    websocketService.addEventListener('connection_status', (data) => {
      setIsConnected(data.connected);
      if (data.connected) {
        websocketService.joinRoom(roomId, 'general');
      }
    });

    // New messages
    websocketService.addEventListener('new_message', (data: WSChatMessage) => {
      if (data.roomId === roomId && data.userId !== userData?.id) {
        const newMessage: Message = {
          id: data.id,
          text: data.message,
          isUser: false,
          timestamp: new Date(data.timestamp),
          type: data.messageType as any,
          userId: data.userId,
          userData: data.userData
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    });

    // User presence
    websocketService.addEventListener('user_joined', (data: UserPresence) => {
      setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
    });

    websocketService.addEventListener('user_left', (data: UserPresence) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Typing indicators
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

    // Sync events
    websocketService.addEventListener('sync_completed', (data) => {
      console.log('Sync completed:', data);
      syncService.getSyncStatus().then(setSyncStatus);
    });
  };

  const loadInitialDataBatch = async () => {
    try {
      // Use batch API to load initial data efficiently
      const initialData = await batchApiService.getInitialData();
      
      console.log('Initial data loaded:', {
        profile: !!initialData.profile,
        emotions: initialData.emotions?.length || 0,
        analytics: !!initialData.analytics,
        cloudEvents: initialData.cloudEvents?.length || 0
      });
      
      // Update batch stats
      setBatchStats(batchApiService.getStats());
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    };
    
    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Send via WebSocket if connected
    if (isConnected) {
      websocketService.sendMessage(roomId, inputText.trim(), 'text');
    }
    
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);
    setStreamingResponse('');
    
    try {
      // Get AI response with streaming
      const aiResponse = await ChatService.sendMessage(
        messageText,
        (partialResponse) => {
          setStreamingResponse(partialResponse);
        }
      );
      
      // Create AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save conversation
      await saveConversation([userMessage, aiMessage]);
      
      // Send AI response via WebSocket
      if (isConnected) {
        websocketService.sendMessage(roomId, aiResponse, 'ai_response');
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
    }
  };

  const saveConversation = async (newMessages: Message[]) => {
    try {
      if (!currentConversation) {
        // Create new conversation
        const conversation = await ConversationStorageService.createConversation(
          newMessages[0].text,
          newMessages
        );
        setCurrentConversation(conversation);
        onConversationUpdate?.(conversation);
      } else {
        // Update existing conversation
        const updatedConversation = await ConversationStorageService.updateConversation(
          currentConversation.id,
          newMessages
        );
        setCurrentConversation(updatedConversation);
        onConversationUpdate?.(updatedConversation);
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

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

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      theme={theme}
      isUser={item.isUser}
      showAvatar={!item.isUser}
      isStreaming={item.id === 'streaming' && isLoading}
    />
  );

  const renderTypingIndicator = () => {
    if (typingUsers.size === 0) return null;
    
    const typingUserNames = Array.from(typingUsers).map(userId => {
      const user = onlineUsers.find(u => u.userId === userId);
      return user?.userData?.username || 'Someone';
    });
    
    return (
      <View style={[styles.typingIndicator, { backgroundColor: theme.background }]}>
        <Text style={[styles.typingText, { color: theme.textSecondary }]}>
          {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing...
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.background }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Enhanced Chat
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {isConnected ? `${onlineUsers.length} online` : 'Offline'}
          </Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={handleSyncData} style={styles.syncButton}>
          <FontAwesome5 
            name="sync" 
            size={16} 
            color={syncStatus?.isSyncing ? theme.primary : theme.textSecondary} 
          />
        </TouchableOpacity>
        
        <View style={[styles.connectionStatus, { 
          backgroundColor: isConnected ? '#4CAF50' : '#FF5722' 
        }]} />
      </View>
    </View>
  );

  const renderPerformanceStats = () => {
    if (!__DEV__) return null;
    
    return (
      <View style={[styles.performanceStats, { backgroundColor: theme.backgroundSecondary }]}>
        <Text style={[styles.statsText, { color: theme.textSecondary }]}>
          Batch Efficiency: {batchStats.efficiencyGain.toFixed(1)}%
        </Text>
        <Text style={[styles.statsText, { color: theme.textSecondary }]}>
          Requests Saved: {batchStats.totalRequests - Math.ceil(batchStats.totalRequests / 10)}
        </Text>
        <Text style={[styles.statsText, { color: theme.textSecondary }]}>
          Sync Status: {syncStatus?.isSyncing ? 'Syncing...' : 'Idle'}
        </Text>
      </View>
    );
  };

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

  // Create streaming message for display
  const displayMessages = React.useMemo(() => {
    const msgs = [...messages];
    
    if (streamingResponse && isLoading) {
      msgs.push({
        id: 'streaming',
        text: streamingResponse,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      });
    }
    
    return msgs;
  }, [messages, streamingResponse, isLoading]);

  return (
    <ChatErrorBoundary>
      <ScreenWrapper>
        <PageBackground />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          {renderHeader()}
          {renderPerformanceStats()}
          
          <KeyboardAvoidingView
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
          >
            <FlatList
              ref={flatListRef}
              data={displayMessages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContainer}
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
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
            />
            
            {renderTypingIndicator()}
            
            <ChatInput
              value={inputText}
              onChangeText={handleInputChange}
              onSend={handleSendMessage}
              isLoading={isLoading}
              placeholder="Type your message..."
              theme={theme}
              showSendButton={inputText.trim().length > 0}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ScreenWrapper>
    </ChatErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    padding: 8,
    marginRight: 12,
  },
  connectionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  performanceStats: {
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statsText: {
    fontSize: 10,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingTop: 16,
    paddingBottom: 100,
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
});

export default EnhancedChatScreen;