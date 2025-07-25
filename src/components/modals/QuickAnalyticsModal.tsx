import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Easing,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuickAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  onSendQuery: (query: string) => void;
}

export const QuickAnalyticsModal: React.FC<QuickAnalyticsModalProps> = ({
  visible,
  onClose,
  onSendQuery,
}) => {
  const { isDarkMode } = useTheme();
  
  // Animation refs
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Quick query options - expanded for scrollable modal
  const quickQueries = [
    // Instant Metrics
    { category: 'Quick Stats', queries: [
      "show my data",
      "what are my metrics?", 
      "show my progress",
      "display my current baseline",
      "what patterns do you see?",
      "show my communication style"
    ]},
    // Categories  
    { category: 'Categories', queries: [
      "What states can you identify in me?",
      "What is your classification system?",
      "What levels do you track?",
      "How do you categorize my patterns?",
      "What traits have you identified?",
      "Show me your framework"
    ]},
    // Predictions
    { category: 'Predictions', queries: [
      "predict my evolution",
      "What changes do you anticipate?",
      "Analyze my learning path",
      "Predict my next phase",
      "What challenges might I face?",
      "How will my style evolve?"
    ]},
    // Analysis
    { category: 'Analysis', queries: [
      "Perform a complete assessment",
      "Analyze my decision patterns",
      "What motivates me?",
      "Map my triggers and responses",
      "How do I handle challenges?",
      "What are my core values?"
    ]}
  ];

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('🧠 Closing quick analytics modal');
    
    // Animate out
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.9,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset animation values
      overlayOpacity.setValue(0);
      modalScale.setValue(0.9);
      modalOpacity.setValue(0);
    });
  };

  const handleQueryPress = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSendQuery(query);
    handleClose();
  };

  // Animate modal in when it becomes visible
  useEffect(() => {
    if (visible) {
      console.log('🧠 Animating quick analytics modal in');
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('🧠 Quick analytics modal animation complete');
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
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
              opacity: overlayOpacity,
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
              backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              borderColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.15)',
              transform: [{ scale: modalScale }],
              opacity: modalOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={
              isDarkMode
                ? ['#1a1a1a', '#151515']
                : ['#ffffff', '#fafbfc']
            }
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <FontAwesome5
                  name="chart-line"
                  size={22}
                  color={isDarkMode ? '#71c9fc' : '#4a90e2'}
                />
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#f9fafb' : '#1f2937' }
                ]}>
                  Quick Analytics
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={handleClose}
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
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
              bounces={true}
            >
              {quickQueries.map((category, categoryIndex) => (
                <View key={categoryIndex} style={styles.queryCategory}>
                  <Text style={[
                    styles.categoryTitle,
                    { color: isDarkMode ? '#fbbf24' : '#f59e0b' }
                  ]}>
                    {category.category}
                  </Text>
                  {category.queries.map((query, queryIndex) => (
                    <TouchableOpacity
                      key={queryIndex}
                      style={[
                        styles.queryButton,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                        }
                      ]}
                      onPress={() => handleQueryPress(query)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.queryText,
                        { color: isDarkMode ? '#e5e7eb' : '#374151' }
                      ]} numberOfLines={3}>
                        {query}
                      </Text>
                      <FontAwesome5
                        name="arrow-right"
                        size={11}
                        color={isDarkMode ? '#fbbf24' : '#f59e0b'}
                        style={{ marginLeft: 6 }}
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
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modalContainer: {
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
  modalContent: {
    height: '100%',
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 44,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  queryCategory: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  queryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    minHeight: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  queryText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
    letterSpacing: -0.1,
  },
});