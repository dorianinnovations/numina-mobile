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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { ToolExecution } from '../services/toolExecutionService';
import { AIToolExecutionStream } from './AIToolExecutionStream';
import { FileUploadService } from '../services/fileUploadService';
import { MessageAttachment } from '../types/message';
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
  const fileUploadService = FileUploadService.getInstance();

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
  
  // Animation refs for upload buttons
  const cameraButtonScale = useRef(new Animated.Value(1)).current;
  const photoLibraryButtonScale = useRef(new Animated.Value(1)).current;
  const fileButtonScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight * 0.3)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
  // Quick query modal animation refs
  const quickModalOverlayOpacity = useRef(new Animated.Value(0)).current;
  const quickModalScale = useRef(new Animated.Value(0.9)).current;
  const quickModalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !isClosing) {
      // Reset closing state and animate in
      setIsClosing(false);
      
      // Haptic feedback when modal opens
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Animate modal in
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
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

  const handleClose = async () => {
    if (isClosing) return; // Prevent multiple close calls
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsClosing(true);

    // Fast, vertical-only exit animation: slide down, fade out, slight rotate, no scale
    Animated.sequence([
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight * 0.9,
          duration: 120,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0.2,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Finish fading out after slide is done for trailing effect
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Background fade out after modal is mostly gone
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 90,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animation values for next open
      slideAnim.setValue(screenHeight * 0.3);
      backgroundOpacity.setValue(0);
      scaleAnim.setValue(0.9);
      rotateAnim.setValue(0);
      contentOpacity.setValue(0);
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

  const handleCameraUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButton(cameraButtonScale, async () => {
      try {
        const attachment = await fileUploadService.takePhoto();
        if (attachment && onAttachmentSelected) {
          onAttachmentSelected(attachment);
          handleClose();
        }
      } catch (error) {
        console.error('Camera upload failed:', error);
      }
    });
  };

  const handlePhotoLibraryUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButton(photoLibraryButtonScale, async () => {
      try {
        const attachment = await fileUploadService.pickPhoto();
        if (attachment && onAttachmentSelected) {
          onAttachmentSelected(attachment);
          handleClose();
        }
      } catch (error) {
        console.error('Photo library upload failed:', error);
      }
    });
  };

  const handleFileUpload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButton(fileButtonScale, async () => {
      try {
        const attachment = await fileUploadService.pickDocument();
        if (attachment && onAttachmentSelected) {
          onAttachmentSelected(attachment);
          handleClose();
        }
      } catch (error) {
        console.error('File upload failed:', error);
      }
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
        {/* Background */}
        <Animated.View
          style={[
            styles.modalBackground,
            {
              opacity: backgroundOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backgroundTouchable}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
              transform: [
                { translateY: slideAnim },
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
                ? ['#121212', '#0f0f0f']
                : ['#ffffff', '#f8fafc']
            }
            style={styles.modalContent}
          >
            <SafeAreaView style={styles.safeArea}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <FontAwesome5
                    name="bolt"
                    size={20}
                    color={isDarkMode ? '#71c9fc' : '#71c9fc'}
                  />
                  <Text style={[
                    styles.headerTitle,
                    { color: isDarkMode ? '#f9fafb' : '#1f2937' }
                  ]}>
                    Spawner
                  </Text>
                </View>
                
                <View style={styles.headerRight}>
                  {/* Upload Buttons */}
                  <View style={styles.uploadButtons}>
                    <Animated.View style={{ transform: [{ scale: cameraButtonScale }] }}>
                      <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
                        onPress={handleCameraUpload}
                        activeOpacity={0.8}
                      >
                        <FontAwesome5
                          name="camera-retro"
                          size={18}
                          solid
                          color={isDarkMode ? '#71c9fc' : '#71c9fc'}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                    <Animated.View style={{ transform: [{ scale: photoLibraryButtonScale }] }}>
                      <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
                        onPress={handlePhotoLibraryUpload}
                        activeOpacity={0.8}
                      >
                        <FontAwesome5
                          name="images"
                          size={18}
                          solid
                          color={isDarkMode ? '#71c9fc' : '#71c9fc'}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                    <Animated.View style={{ transform: [{ scale: fileButtonScale }] }}>
                      <TouchableOpacity
                        style={[styles.uploadButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
                        onPress={handleFileUpload}
                        activeOpacity={0.8}
                      >
                        <FontAwesome5
                          name="file-upload"
                          size={18}
                          solid
                          color={isDarkMode ? '#71c9fc' : '#71c9fc'}
                        />
                      </TouchableOpacity>
                    </Animated.View>
                    <TouchableOpacity
                      style={[styles.uploadButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
                      onPress={() => console.log('Music upload')}
                    >
                      <FontAwesome5
                        name="music"
                        size={18}
                        color={isDarkMode ? '#71c9fc' : '#71c9fc'}
                      />
                    </TouchableOpacity>
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
              </View>

              {/* Status Summary */}
              <View style={styles.statusSummary}>
                <View style={styles.statusItem}>
                  <FontAwesome5
                    name="cog"
                    size={14}
                    color={getStatusColor('executing')}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: isDarkMode ? '#d1d5db' : '#4b5563' }
                  ]}>
                    {activeExecutions.length} Active
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <FontAwesome5
                    name="check-circle"
                    size={14}
                    color={getStatusColor('completed')}
                  />
                  <Text style={[
                    styles.statusText,
                    { color: isDarkMode ? '#d1d5db' : '#4b5563' }
                  ]}>
                    {completedExecutions.length} Complete
                  </Text>
                </View>
                {failedExecutions.length > 0 && (
                  <View style={styles.statusItem}>
                    <FontAwesome5
                      name="exclamation-circle"
                      size={14}
                      color={getStatusColor('error')}
                    />
                    <Text style={[
                      styles.statusText,
                      { color: isDarkMode ? '#d1d5db' : '#4b5563' }
                    ]}>
                      {failedExecutions.length} Failed
                    </Text>
                  </View>
                )}
              </View>


              {/* Tool Execution Stream */}
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
                      name="brain"
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
    height: screenHeight * 0.7,
    maxHeight: 400,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  uploadButton: {
    width: 44,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
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
});