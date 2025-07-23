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
  RefreshControl,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useRefresh } from '../contexts/RefreshContext';
import { NuminaColors } from '../utils/colors';
import ConversationStorageService, { Conversation } from '../services/conversationStorage';
import { AnimatedGradientBorder } from './AnimatedGradientBorder';
import { BaseWalletCard } from './WalletCard';

const { width } = Dimensions.get('window');

interface ConversationHistoryProps {
  onSelectConversation: (conversation: Conversation) => void;
  currentConversationId?: string;
  visible: boolean;
  onClose: () => void;
  onStartNewChat?: () => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  onSelectConversation,
  currentConversationId,
  visible,
  onClose,
  onStartNewChat,
}) => {
  const { isDarkMode } = useTheme();
  const { isRefreshing: globalRefreshing, setIsRefreshing } = useRefresh();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [allowInteraction, setAllowInteraction] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation values for clear modal
  const clearOverlayOpacity = useRef(new Animated.Value(0)).current;
  const clearContainerScale = useRef(new Animated.Value(0.3)).current;
  const clearContainerOpacity = useRef(new Animated.Value(0)).current;
  const trashScale = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

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
      const loadedConversations = await ConversationStorageService.loadConversations();
      setConversations(loadedConversations || []);
    } catch (error) {
      setConversations([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // DON'T trigger global refresh - only local conversation refresh
    try {
      await loadConversations();
      // Keep animation visible for minimum time
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setRefreshing(false);
    }
  };

  const showClearAllModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowClearModal(true);
    Animated.parallel([
      Animated.timing(clearOverlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(clearContainerScale, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(clearContainerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideClearModal = () => {
    Animated.parallel([
      Animated.timing(clearOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(clearContainerScale, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(clearContainerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowClearModal(false);
      setIsClearing(false);
      // Reset animation values
      trashScale.setValue(1);
      checkOpacity.setValue(0);
    });
  };

  const confirmClearAll = async () => {
    setIsClearing(true);
    
    try {
      // Animate trash can
      Animated.sequence([
        Animated.timing(trashScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(trashScale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Clear conversations
      await ConversationStorageService.clearAllConversations();
      setConversations([]);
      
      // Show success animation
      setTimeout(() => {
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 400);

      // Wait a moment then close modal and conversation panel
      setTimeout(() => {
        if (currentConversationId) {
          onClose();
        }
        hideClearModal();
      }, 1500);

    } catch (error) {
      console.error('Failed to clear conversations:', error);
      Alert.alert('Error', 'Failed to clear conversations. Please try again.');
      setIsClearing(false);
    }
  };

  const handleClearAll = () => {
    showClearAllModal();
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

  const renderConversation = ({ item, index }: { item: Conversation, index: number }) => {
    const isActive = item.id === currentConversationId;
    const isFirstItem = index === 0;
    const shouldAnimate = refreshing && isFirstItem;
    
    
    return (
      <AnimatedGradientBorder
        isActive={shouldAnimate}
        borderRadius={12}
        borderWidth={2}
        gradientColors={[
          'rgba(173, 216, 255, 0.3)',  // Super light blue - transparent
          'rgba(173, 216, 255, 0.6)',  // Light blue - building
          'rgba(173, 216, 255, 0.9)',  // Light blue - stronger
          'rgba(186, 164, 255, 0.9)',  // Light purple - peak
          'rgba(186, 164, 255, 0.6)',  // Light purple - fading
          'rgba(173, 216, 255, 0.3)',  // Back to light blue
        ]}
        style={{ marginBottom: 8 }}
      >
        <BaseWalletCard
          onPress={() => {
            onSelectConversation(item);
            onClose();
          }}
          style={[
            styles.conversationCard,
            {
              backgroundColor: isActive
                ? isDarkMode 
                  ? 'rgba(110, 197, 255, 0.13)'
                  : 'rgba(110, 197, 255, 0.18)'
                : undefined, // Let BaseWalletCard handle default colors
            }
          ]}
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
        </BaseWalletCard>
      </AnimatedGradientBorder>
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
            <TouchableOpacity
              style={[
                styles.newChatButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(110, 197, 255, 0.1)' : 'rgba(110, 197, 255, 0.15)',
                  borderColor: isDarkMode ? 'rgba(110, 197, 255, 0.3)' : 'rgba(110, 197, 255, 0.4)',
                }
              ]}
              onPress={() => {
                if (onStartNewChat) {
                  onStartNewChat();
                }
                onClose();
              }}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="plus" 
                size={16} 
                color={isDarkMode ? '#6ec5ff' : '#4a90e2'} 
              />
            </TouchableOpacity>
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
                  size={18} 
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
                size={18} 
                color={isDarkMode ? '#ffffff' : '#666666'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Conversation list */}
        <FlatList
          data={conversations}
          renderItem={({ item, index }) => renderConversation({ item, index })}
          keyExtractor={item => item.id}
          style={styles.conversationList}
          contentContainerStyle={styles.conversationListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['transparent']}
              tintColor="transparent"
              progressBackgroundColor="transparent"
            />
          }
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
                No conversations yet
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <Animated.View style={[
          styles.modalOverlay,
          {
            opacity: clearOverlayOpacity,
          }
        ]}>
          <Animated.View style={[
            styles.modalContainer,
            {
              backgroundColor: isDarkMode ? '#1a1a1a' : '#add5fa',
              borderColor: isDarkMode 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.3)',
              opacity: clearContainerOpacity,
              transform: [{ scale: clearContainerScale }],
            }
          ]}>
            {!isClearing ? (
              <>
                <FontAwesome5 
                  name="exclamation-triangle" 
                  size={48} 
                  color={isDarkMode ? '#ff6b6b' : '#e53e3e'} 
                />
                
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#4a5568' }
                ]}>
                  Clear All Conversations?
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: isDarkMode ? '#a0aec0' : '#718096' }
                ]}>
                  This action cannot be undone. All conversation history will be permanently deleted.
                </Text>
                
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: isDarkMode ? '#374151' : '#e2e8f0',
                        flex: 1,
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      hideClearModal();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      { color: isDarkMode ? '#ffffff' : '#4a5568' }
                    ]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: isDarkMode ? '#dc2626' : '#e53e3e',
                        flex: 1,
                      }
                    ]}
                    onPress={confirmClearAll}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      { color: '#ffffff' }
                    ]}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Animated.View
                  style={{
                    transform: [{ scale: trashScale }]
                  }}
                >
                  <FontAwesome5 
                    name="trash-alt" 
                    size={48} 
                    color={isDarkMode ? '#dc2626' : '#e53e3e'} 
                  />
                </Animated.View>
                
                <Animated.View
                  style={{
                    opacity: checkOpacity,
                    position: 'absolute',
                    top: 20,
                  }}
                >
                  <FontAwesome5 
                    name="check-circle" 
                    size={48} 
                    color={isDarkMode ? '#6ec5ff' : '#4a5568'} 
                  />
                </Animated.View>
                
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#ffffff' : '#4a5568' }
                ]}>
                  Conversations Cleared
                </Text>
                
                <Text style={[
                  styles.modalMessage,
                  { color: isDarkMode ? '#a0aec0' : '#718096' }
                ]}>
                  All conversation history has been permanently deleted
                </Text>
                
                {/* Spacer to match button area height */}
                <View style={{ height: 68, marginTop: 24 }} />
              </>
            )}
          </Animated.View>
        </Animated.View>
      )}
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
    width: width * 0.80,
    borderRightWidth: 1,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 100, 
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    letterSpacing: -0.2,
    lineHeight: 28,
    marginLeft: 0,
    marginBottom: 0,
    flex: 1,
    flexShrink: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
  },
  conversationList: {
    flex: 1,
  },
  conversationListContent: {
    padding: 12,
    paddingBottom: 24,
  },
  conversationCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 50, // Slimmer height
    overflow: 'hidden',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    overflow: 'hidden',
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    flex: 1,
    marginRight: 8,
    flexShrink: 1,
  },
  conversationTime: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    flexShrink: 0,
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
    flexWrap: 'nowrap',
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
    flexShrink: 0,
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  clearAllButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
    borderRadius: 8,
    alignSelf: 'flex-end',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  },
  modalContainer: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButton: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});