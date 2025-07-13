import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import ConversationStorageService, { Conversation } from '../services/conversationStorage';

const { width } = Dimensions.get('window');

interface ConversationHistoryProps {
  onSelectConversation: (conversation: Conversation) => void;
  currentConversationId?: string;
  visible: boolean;
  onClose: () => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  onSelectConversation,
  currentConversationId,
  visible,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadConversations();
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const loadedConversations = await ConversationStorageService.loadConversations();
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPreviewText = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return 'No messages';
    
    const text = lastMessage.text.trim();
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isActive = item.id === currentConversationId;
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: isActive
              ? isDarkMode 
                ? 'rgba(134, 239, 172, 0.1)' 
                : 'rgba(134, 239, 172, 0.15)'
              : isDarkMode 
                ? 'rgba(255,255,255,0.03)' 
                : 'rgba(0, 0, 0, 0.02)',
            borderColor: isActive
              ? isDarkMode 
                ? 'rgba(134, 239, 172, 0.3)' 
                : 'rgba(134, 239, 172, 0.4)'
              : isDarkMode 
                ? '#23272b' 
                : 'rgba(0, 0, 0, 0.05)',
          }
        ]}
        onPress={() => {
          onSelectConversation(item);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[
              styles.conversationTitle,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              {item.title || 'Untitled Conversation'}
            </Text>
            <Text style={[
              styles.conversationTime,
              { color: isDarkMode ? '#888888' : '#666666' }
            ]}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>
          <Text style={[
            styles.conversationPreview,
            { color: isDarkMode ? '#bbbbbb' : '#666666' }
          ]}>
            {getPreviewText(item)}
          </Text>
          <View style={styles.conversationMeta}>
            <Text style={[
              styles.messageCount,
              { color: isDarkMode ? '#888888' : '#999999' }
            ]}>
              {item.messages.length} messages
            </Text>
            {isActive && (
              <View style={[
                styles.activeIndicator,
                { backgroundColor: isDarkMode ? '#86efac' : '#10b981' }
              ]} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Overlay background */}
      <Animated.View
        style={[
          styles.overlayBackground,
          {
            opacity: overlayOpacity,
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Conversation history panel */}
      <Animated.View
        style={[
          styles.historyPanel,
          {
            transform: [{ translateX: slideAnim }],
            backgroundColor: isDarkMode ? '#111111' : '#ffffff',
            borderRightColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.1)',
          }
        ]}
      >
        {/* Header */}
        <View style={[
          styles.header,
          {
            borderBottomColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
          }
        ]}>
          <Text style={[
            styles.headerTitle,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            Conversation History
          </Text>
          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <FontAwesome5 
              name="times" 
              size={16} 
              color={isDarkMode ? '#ffffff' : '#666666'} 
            />
          </TouchableOpacity>
        </View>

        {/* Conversation list */}
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          style={styles.conversationList}
          contentContainerStyle={styles.conversationListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FontAwesome5 
                name="comments" 
                size={32} 
                color={isDarkMode ? '#444444' : '#cccccc'} 
                style={styles.emptyIcon}
              />
              <Text style={[
                styles.emptyText,
                { color: isDarkMode ? '#666666' : '#999999' }
              ]}>
                {loading ? 'Loading conversations...' : 'No conversations yet'}
              </Text>
            </View>
          }
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    flex: 1,
  },
  historyPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.85,
    borderRightWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Account for status bar
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationList: {
    flex: 1,
  },
  conversationListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  conversationItem: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    height: 38 * 2.5, // Thin brick style - about 2.5x the standard 38px height
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    marginRight: 12,
  },
  conversationTime: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  conversationPreview: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});