import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ExpandingBrickModalProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  brickStyle?: any;
  modalHeight?: number;
  dangerMode?: boolean;
}

export const ExpandingBrickModal: React.FC<ExpandingBrickModalProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  visible,
  onClose,
  children,
  brickStyle,
  modalHeight = screenHeight * 0.7,
  dangerMode = false,
}) => {
  const { isDarkMode } = useTheme();
  
  // Animation values
  const brickScale = useRef(new Animated.Value(1)).current;
  const brickOpacity = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.1)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  
  // Layout tracking
  const [brickLayout, setBrickLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      handleExpand();
    } else {
      handleCollapse();
    }
  }, [visible]);

  const handleExpand = () => {
    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Stage 1: Brick preparation
    Animated.sequence([
      // Pulse the brick
      Animated.parallel([
        Animated.timing(brickScale, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Stage 2: Brick transformation
      Animated.parallel([
        Animated.timing(brickScale, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(brickOpacity, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      
      // Stage 3: Modal expansion
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 120,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(brickOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Stage 4: Content reveal
      Animated.stagger(100, [
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const handleCollapse = () => {
    if (!visible && !isAnimating) return;
    
    setIsAnimating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      // Stage 1: Content hide
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Stage 2: Modal collapse
      Animated.parallel([
        Animated.timing(modalScale, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(brickOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      
      // Stage 3: Brick restoration
      Animated.parallel([
        Animated.spring(brickScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setIsAnimating(false);
      // Reset animations for next use
      modalScale.setValue(0.1);
      modalOpacity.setValue(0);
      slideAnim.setValue(50);
      contentOpacity.setValue(0);
    });
  };

  const handleBrickPress = () => {
    if (!isAnimating) {
      // This would be handled by parent component
    }
  };

  const handleModalClose = () => {
    if (!isAnimating) {
      onClose();
    }
  };

  const getBrickColors = () => {
    if (dangerMode) {
      return isDarkMode 
        ? ['rgba(248, 113, 113, 0.15)', 'rgba(239, 68, 68, 0.1)', 'rgba(185, 28, 28, 0.05)']
        : ['#FEF2F2', '#FEE2E2', '#FECACA'];
    }
    
    return isDarkMode
      ? ['rgba(96, 165, 250, 0.15)', 'rgba(59, 130, 246, 0.1)', 'rgba(30, 58, 138, 0.05)']
      : ['#EFF6FF', '#DBEAFE', '#BFDBFE'];
  };

  const getModalColors = () => {
    if (dangerMode) {
      return isDarkMode
        ? ['rgba(248, 113, 113, 0.1)', 'rgba(239, 68, 68, 0.05)', 'rgba(0, 0, 0, 0.9)']
        : ['#FFFFFF', '#FEFEFE', '#FEF2F2'];
    }
    
    return isDarkMode
      ? ['rgba(30, 30, 35, 0.95)', 'rgba(20, 20, 25, 0.9)', 'rgba(10, 10, 15, 0.85)']
      : ['#FFFFFF', '#FEFEFE', '#FAFBFC'];
  };

  const renderBrick = () => (
    <Animated.View
      style={[
        styles.brick,
        brickStyle,
        {
          transform: [{ scale: brickScale }],
          opacity: brickOpacity,
        },
      ]}
      onLayout={(event) => {
        setBrickLayout(event.nativeEvent.layout);
      }}
    >
      <TouchableOpacity
        style={styles.brickTouchable}
        onPress={handleBrickPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getBrickColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brickGradient}
        >
          <View style={styles.brickContent}>
            {icon && (
              <FontAwesome5 
                name={icon} 
                size={16} 
                color={iconColor || (dangerMode ? '#EF4444' : '#60A5FA')} 
                style={styles.brickIcon}
              />
            )}
            <View style={styles.brickTextContainer}>
              <Text style={[
                styles.brickTitle,
                { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
              ]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[
                  styles.brickSubtitle,
                  { color: isDarkMode ? 'rgba(248, 250, 252, 0.7)' : 'rgba(31, 41, 55, 0.7)' }
                ]}>
                  {subtitle}
                </Text>
              )}
            </View>
            <FontAwesome5 
              name="chevron-right" 
              size={12} 
              color={isDarkMode ? 'rgba(248, 250, 252, 0.5)' : 'rgba(31, 41, 55, 0.5)'} 
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <>
      {renderBrick()}
      
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={handleModalClose}
      >
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Overlay */}
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayOpacity }
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          <TouchableWithoutFeedback onPress={handleModalClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal */}
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.modal,
              {
                height: modalHeight,
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={getModalColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <SafeAreaView style={styles.modalSafeArea}>
                {/* Header */}
                <Animated.View 
                  style={[
                    styles.modalHeader,
                    {
                      opacity: contentOpacity,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <View style={styles.modalHeaderLeft}>
                    {icon && (
                      <FontAwesome5 
                        name={icon} 
                        size={22} 
                        color={iconColor || (dangerMode ? '#EF4444' : '#60A5FA')} 
                      />
                    )}
                    <View style={styles.modalTitleContainer}>
                      <Text style={[
                        styles.modalTitle,
                        { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
                      ]}>
                        {title}
                      </Text>
                      {subtitle && (
                        <Text style={[
                          styles.modalSubtitle,
                          { color: isDarkMode ? 'rgba(248, 250, 252, 0.8)' : 'rgba(31, 41, 55, 0.8)' }
                        ]}>
                          {subtitle}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.closeButton,
                      { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                    ]}
                    onPress={handleModalClose}
                  >
                    <FontAwesome5 
                      name="times" 
                      size={16} 
                      color={dangerMode ? '#EF4444' : (isDarkMode ? '#9CA3AF' : '#6B7280')} 
                    />
                  </TouchableOpacity>
                </Animated.View>

                {/* Content */}
                <Animated.View 
                  style={[
                    styles.modalContent,
                    {
                      opacity: contentOpacity,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <ScrollView 
                    style={styles.modalScrollView}
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {children}
                  </ScrollView>
                </Animated.View>
              </SafeAreaView>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Brick Styles
  brick: {
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  brickTouchable: {
    width: '100%',
  },
  brickGradient: {
    padding: 16,
  },
  brickContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brickIcon: {
    opacity: 0.8,
  },
  brickTextContainer: {
    flex: 1,
  },
  brickTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  brickSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },

  // Modal Styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: screenWidth * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalGradient: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});