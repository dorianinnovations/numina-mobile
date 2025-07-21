import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

interface LinkConfirmationModalProps {
  visible: boolean;
  url: string;
  hostname: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DONT_SHOW_AGAIN_KEY = 'link_confirmation_dont_show_again';

export const shouldShowLinkConfirmation = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(DONT_SHOW_AGAIN_KEY);
    return value !== 'true';
  } catch (error) {
    console.warn('Error reading link confirmation preference:', error);
    return true; // Default to showing confirmation if we can't read the preference
  }
};

export const LinkConfirmationModal: React.FC<LinkConfirmationModalProps> = ({
  visible,
  url,
  hostname,
  onConfirm,
  onCancel,
}) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = async () => {
    if (dontShowAgain) {
      await AsyncStorage.setItem(DONT_SHOW_AGAIN_KEY, 'true');
    }
    onConfirm();
  };

  const handleCancel = () => {
    setDontShowAgain(false);
    onCancel();
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          onPress={onCancel}
          activeOpacity={1}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[
                styles.indicator,
                { backgroundColor: isDarkMode ? '#71c9fc' : '#7dbaffff' }
              ]} />
              <Text style={[
                styles.headerTitle,
                { color: isDarkMode ? '#e5e7eb' : '#374151' }
              ]}>
                Open External Link
              </Text>
            </View>
            <FontAwesome5
              name="external-link-alt"
              size={16}
              color={isDarkMode ? '#71c9fc' : '#86bfffff'}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[
              styles.message,
              { color: isDarkMode ? '#d1d5db' : '#4b5563' }
            ]}>
              Are you sure you want to open this link?
            </Text>
            
            <View style={[
              styles.urlContainer,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            ]}>
              <FontAwesome5
                name="globe"
                size={14}
                color={isDarkMode ? '#71c9fc' : '#8bc1ffff'}
                style={styles.urlIcon}
              />
              <Text style={[
                styles.urlText,
                { color: isDarkMode ? '#71c9fc' : '#82bcffff' }
              ]} numberOfLines={2}>
                {hostname}
              </Text>
            </View>
          </View>

          {/* Don't show again option */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setDontShowAgain(!dontShowAgain)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              {
                backgroundColor: dontShowAgain 
                  ? (isDarkMode ? '#71c9fc' : '#85beffff')
                  : 'transparent',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              }
            ]}>
              {dontShowAgain && (
                <FontAwesome5
                  name="check"
                  size={10}
                  color="#ffffff"
                />
              )}
            </View>
            <Text style={[
              styles.checkboxText,
              { color: isDarkMode ? '#d1d5db' : '#6b7280' }
            ]}>
              Don't show this confirmation again
            </Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
                }
              ]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.buttonText,
                { color: isDarkMode ? '#d1d5db' : '#6b7280' }
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: isDarkMode ? '#71c9fc' : '#81bcffff' }
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <FontAwesome5
                name="external-link-alt"
                size={12}
                color="#ffffff"
                style={styles.buttonIcon}
              />
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                Open Link
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: screenWidth * 0.85,
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  content: {
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Nunito',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  urlIcon: {
    marginRight: 8,
  },
  urlText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelButton: {
    // Styling handled via props
  },
  confirmButton: {
    // Styling handled via props
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    fontSize: 13,
    fontFamily: 'Nunito',
    flex: 1,
  },
});