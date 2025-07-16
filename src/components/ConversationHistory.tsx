import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [allowInteraction, setAllowInteraction] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      setIsVisible(true);
      setAllowInteraction(false);
      loadConversations();
      // Fast, smooth slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200, // Reduced from 350ms to 200ms
          useNativeDriver: true,
          easing: Easing.bezier(0.2, 0.0, 0.13, 1.0), // iOS-like smooth ease-out
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 120, // Reduced from 200ms to 120ms
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start(() => {
        setIsAnimating(false);
        // Allow interaction immediately after slide-in completes
        setAllowInteraction(true);
      });
      
      // Allow overlay interaction early (after 150ms instead of waiting for full animation)
      setTimeout(() => {
        setAllowInteraction(true);
      }, 150);
      
    } else if (!visible && (isAnimating || isVisible)) {
      setAllowInteraction(false);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease), // Smooth in-out curve
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 50, 
          useNativeDriver: true,
          easing: Easing.linear,
        }),
      ]).start(() => {
        setIsAnimating(false);
        setIsVisible(false);
        setAllowInteraction(true);
      });
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

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Conversations',
      'Are you sure you want to delete all conversations? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await ConversationStorageService.clearAllConversations();
              setConversations([]);
              if (currentConversationId) {
                onClose();
              }
            } catch (error) {
              console.error('Failed to clear conversations:', error);
              Alert.alert('Error', 'Failed to clear conversations');
            }
          },
        },
      ],
    );
  };

  const handleDeleteConversation = (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ConversationStorageService.deleteConversation(conversationId);
              setConversations(prev => prev.filter(c => c.id !== conversationId));
              if (conversationId === currentConversationId) {
                onClose();
              }
            } catch (error) {
              console.error('Failed to delete conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ],
    );
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
                ? 'rgba(110, 197, 255, 0.13)'
                : 'rgba(110, 197, 255, 0.18)'
              : isDarkMode 
                ? 'rgba(255,255,255,0.03)' 
                : 'rgba(0, 0, 0, 0.02)',
            borderColor: isActive
              ? isDarkMode 
                ? 'rgba(110, 197, 255, 0.38)'
                : 'rgba(110, 197, 255, 0.45)'
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
            <View style={styles.metaRight}>
              {isActive && (
                <View style={[
                  styles.activeIndicator,
                  { backgroundColor: isDarkMode ? '#6ec5ff' : '#6ec5ff' }
                ]} />
              )}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(item.id);
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={20}
                  color={isDarkMode ? '#666666' : '#999999'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!visible && !isAnimating && !isVisible) return null;

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
          onPress={allowInteraction ? onClose : undefined}
          activeOpacity={1}
          disabled={!allowInteraction}
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
            { color: isDarkMode ? '#ffffff' : '#181818' }
          ]}>
            Conversation History
          </Text>
          <View style={styles.headerButtons}>
            {conversations.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.clearAllButton,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.05)',
                  }
                ]}
                onPress={handleClearAll}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons 
                  name="trash-can-outline" 
                  size={20} 
                  color={isDarkMode ? '#ff6b6b' : '#dc3545'} 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0, 0, 0, 0.05)',
                }
              ]}
              onPress={allowInteraction ? onClose : undefined}
              activeOpacity={0.7}
              disabled={!allowInteraction}
            >
              <FontAwesome5 
                name="times" 
                size={22} 
                color={isDarkMode ? '#ffffff' : '#666666'} 
              />
            </TouchableOpacity>
          </View>
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
    fontSize: 22,
      fontWeight: '700',
      fontFamily: 'CrimsonPro_700Bold',
    letterSpacing: 0.2,
    lineHeight: 28,
    marginLeft: 2,
    marginBottom: 0,
  },
  closeButton: {
    width: 40,
    height: 30,
    borderRadius:8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  conversationList: {
    flex: 1,
  },
  conversationListContent: {
    padding: 12,
    paddingBottom: 24,
  },
  conversationItem: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 70, // Minimum height for readability
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  conversationPreview: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 8,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearAllButton: {
    width: 40,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
    marginRight: -4,
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