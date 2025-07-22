import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface SignOutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  const { isDarkMode } = useTheme();
  
  // Animation refs
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.8)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;
  
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(20)).current;
  
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation - 200ms
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(containerScale, {
          toValue: 1,
          tension: 150,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Staggered content animation - faster
        Animated.stagger(50, [
          // Icon animation
          Animated.parallel([
            Animated.timing(iconOpacity, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.spring(iconScale, {
              toValue: 1,
              tension: 180,
              friction: 5,
              useNativeDriver: true,
            }),
          ]),
          
          // Title animation
          Animated.parallel([
            Animated.timing(titleOpacity, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(titleTranslateY, {
              toValue: 0,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          
          // Message animation
          Animated.parallel([
            Animated.timing(messageOpacity, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(messageTranslateY, {
              toValue: 0,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          
          // Buttons animation
          Animated.parallel([
            Animated.timing(buttonsOpacity, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(buttonsTranslateY, {
              toValue: 0,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    } else {
      // Reset animations
      backgroundOpacity.setValue(0);
      containerScale.setValue(0.8);
      containerOpacity.setValue(0);
      iconOpacity.setValue(0);
      iconScale.setValue(0.5);
      titleOpacity.setValue(0);
      titleTranslateY.setValue(20);
      messageOpacity.setValue(0);
      messageTranslateY.setValue(20);
      buttonsOpacity.setValue(0);
      buttonsTranslateY.setValue(20);
    }
  }, [visible]);

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.background,
          {
            opacity: backgroundOpacity,
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
          }
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
              borderColor: isDarkMode ? '#87ebde' : '#00d4ff',
              opacity: containerOpacity,
              transform: [{ scale: containerScale }],
            }
          ]}
        >
          {/* Warning Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: iconOpacity,
                transform: [{ scale: iconScale }],
              }
            ]}
          >
            <FontAwesome5 
              name="sign-out-alt" 
              size={48} 
              color={isDarkMode ? '#b4a7d6' : '#a78bfa'} 
            />
          </Animated.View>
          
          {/* Title */}
          <Animated.View
            style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            }}
          >
            <Text style={[
              styles.title,
              { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
            ]}>
              Sign Out
            </Text>
          </Animated.View>
          
          {/* Message */}
          <Animated.View
            style={{
              opacity: messageOpacity,
              transform: [{ translateY: messageTranslateY }],
            }}
          >
            <Text style={[
              styles.message,
              { color: isDarkMode ? '#b4a7d6' : '#6b7280' }
            ]}>
              Are you sure you want to sign out of your account?
            </Text>
          </Animated.View>
          
          {/* Buttons */}
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsTranslateY }],
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc',
                  borderColor: isDarkMode ? '#87ebde' : '#00d4ff',
                }
              ]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                { color: isDarkMode ? '#87ebde' : '#00d4ff' }
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: isDarkMode ? '#b4a7d6' : '#a78bfa',
                }
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                styles.confirmButtonText,
                { color: isDarkMode ? '#0f0f0f' : '#ffffff' }
              ]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    shadowColor: '#b4a7d6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  confirmButtonText: {
    fontWeight: '700',
  },
});