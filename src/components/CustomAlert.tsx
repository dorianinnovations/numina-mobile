import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';

const { width } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
}) => {
  const { theme, isDarkMode } = useTheme();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (style?: AlertButton['style']) => {
    switch (style) {
      case 'destructive':
        return [styles.button, styles.destructiveButton];
      case 'cancel':
        return [styles.button, styles.cancelButton];
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (style?: AlertButton['style']) => {
    switch (style) {
      case 'destructive':
        return [styles.buttonText, { color: '#FF6B6B' }];
      case 'cancel':
        return [styles.buttonText, { color: theme.colors.navigation.text }];
      default:
        return [styles.buttonText, { color: NuminaColors.primary }];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer,
          { backgroundColor: theme.colors.surface }
        ]}>
          <LinearGradient
            colors={isDarkMode 
              ? ['rgba(110, 197, 255, 0.1)', 'rgba(110, 197, 255, 0.05)']
              : ['rgba(110, 197, 255, 0.1)', 'rgba(110, 197, 255, 0.05)']
            }
            style={styles.gradientBorder}
          />
          
          {title && (
            <Text style={[styles.title, { color: theme.colors.navigation.text }]}>
              {title}
            </Text>
          )}
          
          {message && (
            <Text style={[styles.message, { color: theme.colors.navigation.text }]}>
              {message}
            </Text>
          )}
          
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={getButtonStyle(button.style)}
                onPress={() => handleButtonPress(button)}
              >
                <Text style={getButtonTextStyle(button.style)}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: width - 80,
    maxWidth: 300,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    opacity: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: 'rgba(110, 197, 255, 0.1)',
  },
  cancelButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  destructiveButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

// Utility function to show alerts programmatically
export const showCustomAlert = (
  title?: string,
  message?: string,
  buttons?: AlertButton[]
): Promise<void> => {
  return new Promise((resolve) => {
    // This would need to be implemented with a global state manager
    // For now, components should use the CustomAlert component directly
    resolve();
  });
};