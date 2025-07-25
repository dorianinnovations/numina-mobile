import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { ToolExecution } from '../../services/toolExecutionService';
import { AIToolExecutionStream } from '../ai/AIToolExecutionStream';
import { MessageAttachment } from '../../types/message';
import * as Haptics from 'expo-haptics';
import { Easing } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ToolExecutionModalProps {
  visible: boolean;
  onClose: () => void;
  toolExecutions: ToolExecution[];
  currentMessage: string;
  onAttachmentSelected?: (attachment: MessageAttachment) => void;
  ubpmInsights?: any[];
  onAcknowledgeUBPM?: (insightId: string) => void;
  onSendQuickQuery?: (query: string) => void;
}

export const ToolExecutionModal: React.FC<ToolExecutionModalProps> = ({
  visible,
  onClose,
  toolExecutions,
  currentMessage,
  onAttachmentSelected,
  ubpmInsights = [],
  onAcknowledgeUBPM,
  onSendQuickQuery,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isClosing, setIsClosing] = useState(false);
  const [showQuickQueries, setShowQuickQueries] = useState(false);
  const [showQuickQueryModal, setShowQuickQueryModal] = useState(false);
  const [modalState, setModalState] = useState<'small' | 'large' | 'full' | 'very-large'>('large'); // small card, large modal, full screen, very large

  // Quick query options - expanded for scrollable modal
  const quickQueries = [
    // Instant Metrics
    { category: 'Instant Metrics', queries: [
      "show my behavioral data",
      "what are my intelligence metrics?", 
      "behavioral data - show my complexity progression",
      "display my current emotional baseline",
      "what patterns do you see in my interactions?",
      "show my communication style analysis"
    ]},
    // Taxonomies  
    { category: 'Taxonomies', queries: [
      "What emotional states can you identify in me?",
      "What is your complete topic classification system?",
      "What engagement levels do you track?",
      "How do you categorize my behavioral patterns?",
      "What personality traits have you identified?",
      "Show me your complete analytical framework"
    ]},
    // Predictions
    { category: 'Predictions', queries: [
      "Based on my behavioral patterns, predict my evolution",
      "What changes do you anticipate in my behavior?",
      "Analyze my learning trajectory",
      "Predict my next developmental phase",
      "What challenges might I face in my growth?",
      "How will my communication style evolve?"
    ]},
    // Deep Analysis
    { category: 'Deep Analysis', queries: [
      "Perform a complete psychological assessment",
      "Analyze my decision-making patterns",
      "What motivates me at a core level?",
      "Map my emotional triggers and responses",
      "How do I handle stress and challenges?",
      "What are my fundamental values and beliefs?"
    ]}
  ];
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(screenHeight * 0.3)).current;
  // Removed backgroundOpacity - no dim functionality
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
  // Quick query modal animation refs
  const quickModalOverlayOpacity = useRef(new Animated.Value(0)).current;
  const quickModalScale = useRef(new Animated.Value(0.9)).current;
  const quickModalOpacity = useRef(new Animated.Value(0)).current;
  
  // Pan gesture refs for swipe functionality
  const panY = useRef(new Animated.Value(0)).current;
  const lastGestureState = useRef(0);
  
  // Modal height states
  const modalHeights = {
    small: screenHeight * 0.15,     // Small card
    large: screenHeight * 0.7,      // Default modal
    full: screenHeight * 0.95,      // Full screen
    'very-large': screenHeight * 0.98 // Almost entire screen
  };
  
  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Respond to vertical gestures with lower threshold
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        lastGestureState.current = 0;
        panY.setOffset(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Direct tracking with resistance
        let newValue = gestureState.dy;
        
        // Add resistance when going beyond reasonable bounds
        if (newValue < -100) {
          const resistance = Math.max(0.3, 1 - Math.abs(newValue + 100) / 200);
          newValue = -100 + (newValue + 100) * resistance;
        }
        if (newValue > 200) {
          const resistance = Math.max(0.3, 1 - Math.abs(newValue - 200) / 200);
          newValue = 200 + (newValue - 200) * resistance;
        }
        
        panY.setValue(newValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const velocity = gestureState.vy;
        const displacement = gestureState.dy;
        
        // Determine target state based on gesture with lower thresholds
        let targetState: 'small' | 'large' | 'full' | 'very-large' = modalState;
        
        if (Math.abs(velocity) > 0.2 || Math.abs(displacement) > 20) {
          if (displacement < -20 || velocity < -0.2) {
            // Swipe up - expand through all states
            if (modalState === 'small') {
              targetState = 'large';
            } else if (modalState === 'large') {
              targetState = 'full';
            } else if (modalState === 'full') {
              targetState = 'very-large';
            }
          } else if (displacement > 20 || velocity > 0.2) {
            // Swipe down - collapse or dismiss
            if (modalState === 'very-large') {
              targetState = 'full';
            } else if (modalState === 'full') {
              targetState = 'large';
            } else if (modalState === 'large') {
              targetState = 'small';
            } else if (modalState === 'small') {
              // Dismiss via swipe - use same logic as tap outside
              handleClose();
              return;
            }
          }
        }
        
        // Debug log for testing
        console.log(`🎯 Swipe: ${modalState} → ${targetState}, displacement: ${displacement.toFixed(1)}, velocity: ${velocity.toFixed(2)}`);
        
        animateToState(targetState);
      },
    })
  ).current;
  
  const animateToState = (newState: 'small' | 'large' | 'full' | 'very-large') => {
    setModalState(newState);
    
    // Calculate slide position based on state
    let targetY = 0;
    switch (newState) {
      case 'small':
        targetY = screenHeight * 0.85;
        break;
      case 'large':
        targetY = screenHeight * 0.3;
        break;
      case 'full':
        targetY = screenHeight * 0.05;
        break;
      case 'very-large':
        targetY = screenHeight * 0.01; // Almost at the very top
        break;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.spring(panY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }),
      Animated.spring(slideAnim, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }),
    ]).start();
  };

  useEffect(() => {
    if (visible && !isClosing) {
      // Complete reset when opening
      setModalState('large');
      setIsClosing(false);
      panY.setValue(0); // Reset any lingering pan values
      
      // Haptic feedback when modal opens
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate modal in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: screenHeight * 0.3, // Large modal position
          tension: 120,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, isClosing]);

  // Simple cleanup when modal becomes invisible
  useEffect(() => {
    if (!visible) {
      // Stop all animations and reset values
      panY.stopAnimation();
      slideAnim.stopAnimation();
      contentOpacity.stopAnimation();
      scaleAnim.stopAnimation();
      
      // Reset all values immediately
      panY.setValue(0);
      slideAnim.setValue(screenHeight * 0.3);
      scaleAnim.setValue(0.9);
      rotateAnim.setValue(0);
      contentOpacity.setValue(0);
      setModalState('large');
      setIsClosing(false);
    }
  }, [visible]);

  const handleClose = async () => {
    if (isClosing) return; 
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsClosing(true);

    // Stop all running animations first
    panY.stopAnimation();
    slideAnim.stopAnimation();
    contentOpacity.stopAnimation();
    scaleAnim.stopAnimation();

    // Immediate cleanup to prevent stuck states
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight * 1.2, // Slide further down
        duration: 200,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }),
      // Removed background opacity animation
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Complete reset of all animation values and state
      slideAnim.setValue(screenHeight * 0.3);
      scaleAnim.setValue(0.9);
      rotateAnim.setValue(0);
      contentOpacity.setValue(0);
      panY.setValue(0); // Reset pan gesture value
      setModalState('large'); // Reset to default state
      setIsClosing(false);
      onClose();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executing':
        return isDarkMode ? '#919191' : '#919191';
      case 'completed':
        return isDarkMode ? '#34d399' : '#10b981';
      case 'error':
        return isDarkMode ? '#f87171' : '#ef4444';
      default:
        return isDarkMode ? '#6b7280' : '#9ca3af';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executing':
        return 'cog';
      case 'completed':
        return 'check-circle';
      case 'error':
        return 'exclamation-circle';
      default:
        return 'clock';
    }
  };

  // Beautiful heavy button animation with slight bounce - 70% faster
  const animateButton = (buttonScale: Animated.Value, callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.85,
        duration: 30, 
        useNativeDriver: true,
      }),
      // Slight bounce back up with spring 
      Animated.spring(buttonScale, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 500, 
        friction: 6,  
      }),
      // Settle to normal with gentle bounce - faster settle
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400, 
        friction: 5,  
      }),
    ]).start(() => {
      callback();
    });
  };


  const handleQuickQueryPress = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onSendQuickQuery) {
      onSendQuickQuery(query);
      handleClose();
    }
  };

  const toggleQuickQueries = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('🧠 Opening quick query modal');
    setShowQuickQueryModal(true);
  };

  const closeQuickQueryModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('🧠 Closing quick query modal');
    
    // Animate out
    Animated.parallel([
      Animated.timing(quickModalOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(quickModalScale, {
        toValue: 0.9,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(quickModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowQuickQueryModal(false);
      // Reset animation values
      quickModalOverlayOpacity.setValue(0);
      quickModalScale.setValue(0.9);
      quickModalOpacity.setValue(0);
    });
  };

  // Animate quick query modal in when it becomes visible
  useEffect(() => {
    if (showQuickQueryModal) {
      console.log('🧠 Animating quick query modal in');
      Animated.parallel([
        Animated.timing(quickModalOverlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(quickModalScale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(quickModalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('🧠 Quick query modal animation complete');
      });
    }
  }, [showQuickQueryModal]);

  const activeExecutions = toolExecutions.filter(exec => exec.status === 'executing');
  const completedExecutions = toolExecutions.filter(exec => exec.status === 'completed');
  const failedExecutions = toolExecutions.filter(exec => exec.status === 'error');

  return (
    <Modal
      visible={visible || isClosing}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        {/* Background - No Dim */}
        <TouchableOpacity
          style={styles.backgroundTouchable}
          onPress={handleClose}
          activeOpacity={1}
        />

        {/* Modal Content with Swipe Gestures */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
              height: modalHeights[modalState],
              transform: [
                { translateY: Animated.add(slideAnim, panY) },
                { scale: scaleAnim },
                { 
                  rotateX: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '5deg'],
                  })
                },
              ],
              opacity: contentOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={
              isDarkMode
                ? ['#0a0a0a', '#080808']
                : ['#ffffff', '#f8fafc']
            }
            style={styles.modalContent}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* Swipe Indicator */}
              <View style={styles.swipeIndicatorContainer}>
                <View style={[
                  styles.swipeIndicator,
                  {
                    backgroundColor: modalState === 'very-large' 
                      ? (isDarkMode ? '#71c9fc' : '#4a90e2')
                      : (isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
                    width: modalState === 'very-large' ? 60 : 40,
                  }
                ]} />
              </View>

              {/* Header - Only show full header in large/full/very-large states */}
              {modalState !== 'small' && (
                <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Feather
                    name="zap"
                    size={20}
                    color={isDarkMode ? '#98fb98' : '#22c55e'}
                  />
                  <Text style={[
                    styles.headerTitle,
                    { color: isDarkMode ? '#f9fafb' : '#1f2937' }
                  ]}>
                    Spawner
                  </Text>
                </View>
                
                <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                  >
                    <FontAwesome5
                      name="times"
                      size={18}
                      color={isDarkMode ? '#ef4444' : '#dc2626'}
                    />
                  </TouchableOpacity>
              </View>
              )}

              {/* Small Card Content */}
              {modalState === 'small' && (
                <View style={styles.smallCardContent}>
                  <View style={styles.smallCardInfo}>
                    <Feather
                      name="zap"
                      size={16}
                      color={isDarkMode ? '#98fb98' : '#22c55e'}
                    />
                    <Text style={[
                      styles.smallCardTitle,
                      { color: isDarkMode ? '#f9fafb' : '#1f2937' }
                    ]}>
                      {toolExecutions.length > 0 
                        ? `${toolExecutions.filter(e => e.status === 'executing').length} active tools`
                        : 'Spawner'
                      }
                    </Text>
                  </View>
                  <Text style={[
                    styles.smallCardHint,
                    { color: isDarkMode ? '#9ca3af' : '#6b7280' }
                  ]}>
                    Swipe up through 4 sizes
                  </Text>
                </View>
              )}

              {/* Status Summary - Only show in large/full/very-large states */}
              {modalState !== 'small' && (
                <View style={[
                  styles.statusSummary,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                  }
                ]}>
                <View style={[
                  styles.statusItem,
                  {
                    backgroundColor: isDarkMode ? 'rgba(145, 145, 145, 0.1)' : 'rgba(145, 145, 145, 0.08)',
                    borderColor: isDarkMode ? 'rgba(145, 145, 145, 0.2)' : 'rgba(145, 145, 145, 0.15)',
                  }
                ]}>
                  <FontAwesome5
                    name="cog"
                    size={12}
                    color={getStatusColor('executing')}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: isDarkMode ? '#e5e7eb' : '#374151' }
                  ]}>
                    {activeExecutions.length} Active
                  </Text>
                </View>
                <View style={[
                  styles.statusItem,
                  {
                    backgroundColor: isDarkMode ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                    borderColor: isDarkMode ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  }
                ]}>
                  <FontAwesome5
                    name="check-circle"
                    size={12}
                    color={getStatusColor('completed')}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: isDarkMode ? '#e5e7eb' : '#374151' }
                  ]}>
                    {completedExecutions.length} Complete
                  </Text>
                </View>
                {failedExecutions.length > 0 && (
                  <View style={[
                    styles.statusItem,
                    {
                      backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                      borderColor: isDarkMode ? 'rgba(248, 113, 113, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                    }
                  ]}>
                    <FontAwesome5
                      name="exclamation-circle"
                      size={12}
                      color={getStatusColor('error')}
                    />
                    <Text style={[
                      styles.statusText,
                      { color: isDarkMode ? '#e5e7eb' : '#374151' }
                    ]}>
                      {failedExecutions.length} Failed
                    </Text>
                  </View>
                )}
              </View>
              )}

              {/* Tool Execution Stream - Only show in large/full/very-large states */}
              {modalState !== 'small' && (
                <ScrollView 
                  style={styles.scrollContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <AIToolExecutionStream
                    executions={toolExecutions}
                    ubpmInsights={ubpmInsights}
                    isVisible={true}
                    onToggleVisibility={() => {}}
                    currentMessage={currentMessage}
                    onAcknowledgeUBPM={onAcknowledgeUBPM}
                  />
                </ScrollView>
              )}
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Quick Query Modal - Appears above Spawner */}
      {showQuickQueryModal && (
        <Modal
          visible={showQuickQueryModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeQuickQueryModal}
        >
          <View style={styles.quickModalOverlay}>
            {/* Background */}
            <Animated.View
              style={[
                styles.quickModalBackground,
                {
                  opacity: quickModalOverlayOpacity,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.backgroundTouchable}
                onPress={closeQuickQueryModal}
                activeOpacity={1}
              />
            </Animated.View>

            {/* Modal Content */}
            <Animated.View
              style={[
                styles.quickModalContainer,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.15)',
                  transform: [{ scale: quickModalScale }],
                  opacity: quickModalOpacity,
                },
              ]}
            >
              <LinearGradient
                colors={
                  isDarkMode
                    ? ['#1a1a1a', '#151515']
                    : ['#ffffff', '#fafbfc']
                }
                style={styles.quickModalContent}
              >
                {/* Header */}
                <View style={styles.quickModalHeader}>
                  <View style={styles.headerLeft}>
                    <FontAwesome5
                      name="lightbulb"
                      size={22}
                      color={isDarkMode ? '#71c9fc' : '#4a90e2'}
                    />
                    <Text style={[
                      styles.quickModalTitle,
                      { color: isDarkMode ? '#f9fafb' : '#1f2937' }
                    ]}>
                      Quick Analytics
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    onPress={closeQuickQueryModal}
                    style={[styles.closeButton, { 
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' 
                    }]}
                  >
                    <FontAwesome5
                      name="times"
                      size={16}
                      color={isDarkMode ? '#ef4444' : '#dc2626'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Scrollable Content */}
                <ScrollView 
                  style={styles.quickModalScrollView}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={styles.quickModalScrollContent}
                  bounces={true}
                >
                  {quickQueries.map((category, categoryIndex) => (
                    <View key={categoryIndex} style={styles.quickQueryCategory}>
                      <Text style={[
                        styles.quickCategoryTitle,
                        { color: isDarkMode ? '#71c9fc' : '#4a90e2' }
                      ]}>
                        {category.category}
                      </Text>
                      {category.queries.map((query, queryIndex) => (
                        <TouchableOpacity
                          key={queryIndex}
                          style={[
                            styles.quickQueryButton,
                            {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                            }
                          ]}
                          onPress={() => {
                            handleQuickQueryPress(query);
                            closeQuickQueryModal();
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.quickQueryText,
                            { color: isDarkMode ? '#e5e7eb' : '#374151' }
                          ]} numberOfLines={3}>
                            {query}
                          </Text>
                          <FontAwesome5
                            name="arrow-right"
                            size={14}
                            color={isDarkMode ? '#71c9fc' : '#4a90e2'}
                            style={{ marginLeft: 8 }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </LinearGradient>
            </Animated.View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modalContainer: {
    // Height is set dynamically via modalHeights[modalState]
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 44,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSummary: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Quick Query Modal Styles
  quickModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  quickModalContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    maxHeight: screenHeight * 0.8,
    minHeight: 400,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  quickModalContent: {
    height: '100%',
    borderRadius: 20,
  },
  quickModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  quickModalScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickModalScrollContent: {
    paddingVertical: 20,
    paddingBottom: 30,
  },
  quickQueryCategory: {
    marginBottom: 24,
  },
  quickCategoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  quickQueryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    minHeight: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickQueryText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  // Swipe functionality styles
  swipeIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  smallCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  smallCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallCardTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallCardHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});