import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { TextStyles, getFontFamily } from '../../utils/fonts';

const { width, height } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: string;
  isPremium?: boolean;
}

interface QuickActionsProps {
  onActionSelect: (action: string) => void;
  messageCount?: number;
  isPremiumUser?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: '1',
    title: 'Breathing Exercise',
    subtitle: '',
    icon: 'wind',
    action: 'breathing',
  },
  {
    id: '2',
    title: 'Gratitude Practice',
    subtitle: '',
    icon: 'praying-hands',
    action: 'gratitude',
  },
  {
    id: '3',
    title: 'Positive Affirmations',
    subtitle: '',
    icon: 'star',
    action: 'affirmations',
  },
  {
    id: '4',
    title: 'Process Feelings',
    subtitle: '',
    icon: 'comments',
    action: 'feeling_processing',
  },
  {
    id: '5',
    title: 'Daily Goals',
    subtitle: '',
    icon: 'bullseye',
    action: 'goal_setting',
  },
  {
    id: '6',
    title: 'Mindfulness',
    subtitle: '',
    icon: 'brain',
    action: 'mindfulness',
  },
  {
    id: '7',
    title: 'Feeling Lonely',
    subtitle: '',
    icon: 'frown',
    action: 'feeling_lonely',
  },
  {
    id: '8',
    title: 'Sleep Problems',
    subtitle: '',
    icon: 'bed',
    action: 'sleep_prep',
  },
  {
    id: '9',
    title: 'Need Motivation',
    subtitle: '',
    icon: 'fire',
    action: 'energy_boost',
  },
  {
    id: '10',
    title: 'Self-Care Ideas',
    subtitle: '',
    icon: 'heart',
    action: 'self_care',
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({
  onActionSelect,
  messageCount = 0,
  isPremiumUser = false,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  
  // Simplified animations for smoothness
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(height * 0.5)).current;

  // Show quick actions for new users
  useEffect(() => {
    if (messageCount <= 2) {
      setShouldShow(true);
      
      // Smooth entrance animation
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(fabOpacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(fabScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }, 1200);

      // Auto-hide after 45 seconds
      const hideTimer = setTimeout(() => {
        hideFAB();
      }, 45000);

      return () => clearTimeout(hideTimer);
    } else {
      hideFAB();
    }
  }, [messageCount]);

  const showModal = async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setIsVisible(true);
    
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const hideModal = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(modalTranslateY, {
        toValue: height * 0.5,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const hideFAB = () => {
    Animated.parallel([
      Animated.timing(fabOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(fabScale, {
        toValue: 0.8,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      setShouldShow(false);
    });
  };

  const handleActionPress = async (action: QuickAction) => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (action.isPremium && !isPremiumUser) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    onActionSelect(action.action);
    hideModal();
  };

  const handleFABPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showModal();
  };

  const renderAction = (action: QuickAction, index: number) => (
    <TouchableOpacity
      key={action.id}
      onPress={() => handleActionPress(action)}
      activeOpacity={0.8}
      style={[
        styles.actionItem,
        {
          backgroundColor: 'rgba(40, 40, 40, 1)',
        }
      ]}
    >
      {/* Icon */}
      <View style={styles.iconWrapper}>
        <FontAwesome5
          name={action.icon}
          size={18}
          color="#ffffff"
        />
      </View>

      {/* Title */}
      <Text style={[
        styles.actionTitle,
        { color: '#ffffff' }
      ]}>
        {action.title}
      </Text>
    </TouchableOpacity>
  );

  if (!shouldShow) return null;

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            opacity: fabOpacity,
            transform: [{ scale: fabScale }],
          }
        ]}
      >
        <TouchableOpacity
          onPress={handleFABPress}
          activeOpacity={0.7}
          style={styles.fabButton}
        >
          <FontAwesome5 name="bolt" size={20} color="#000000" />
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Actions Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { 
              opacity: modalOpacity,
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
            }
          ]}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={hideModal}
            activeOpacity={1}
          />
          
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: 'rgba(20, 20, 20, 1)',
                borderColor: 'rgba(40, 40, 40, 1)',
                transform: [{ translateY: modalTranslateY }],
              }
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                { color: '#ffffff' }
              ]}>
                Quick Actions
              </Text>
              <TouchableOpacity
                onPress={hideModal}
                style={styles.closeButton}
                activeOpacity={0.8}
              >
                <FontAwesome5
                  name="times"
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            {/* Actions Grid */}
            <ScrollView
              style={styles.actionsContainer}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.actionsGrid}>
                {QUICK_ACTIONS.map((action, index) => renderAction(action, index))}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    zIndex: 1000,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#86efac',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 60, 0.3)',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  actionsContainer: {
    flex: 1,
  },
  actionsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionItem: {
    borderRadius: 12,
    borderWidth: 0,
    paddingVertical: 20,
    paddingHorizontal: 16,
    width: (width - 44) / 2,
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(60, 60, 60, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});