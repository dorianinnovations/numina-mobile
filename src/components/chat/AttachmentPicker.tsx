import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageAttachment } from '../../types/message';
import { FileUploadService } from '../../services/fileUploadService';

interface AttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onAttachmentSelected: (attachment: MessageAttachment) => void;
  maxFiles?: number;
  allowedTypes?: ('image' | 'document' | 'text')[];
}

interface AttachmentOption {
  id: string;
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  label: string;
  description: string;
  action: 'camera' | 'photo' | 'document';
  color: string;
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  visible,
  onClose,
  onAttachmentSelected,
  maxFiles = 5,
  allowedTypes = ['image', 'document', 'text'],
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const fileUploadService = FileUploadService.getInstance();

  const attachmentOptions: AttachmentOption[] = [
    {
      id: 'camera',
      icon: 'camera' as const,
      label: 'Take Photo',
      description: 'Capture with camera',
      action: 'camera' as const,
      color: '#3b82f6',
    },
    {
      id: 'photo',
      icon: 'image' as const,
      label: 'Photo Library',
      description: 'Choose from gallery',
      action: 'photo' as const,
      color: '#10b981',
    },
    {
      id: 'document',
      icon: 'file-text' as const,
      label: 'Document',
      description: 'Text files, PDFs',
      action: 'document' as const,
      color: '#f59e0b',
    },
  ].filter(option => {
    // Filter options based on allowed types
    if (option.action === 'camera' || option.action === 'photo') {
      return allowedTypes.includes('image');
    }
    if (option.action === 'document') {
      return allowedTypes.includes('document') || allowedTypes.includes('text');
    }
    return true;
  });

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleOptionPress = async (option: AttachmentOption) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      let attachment: MessageAttachment | null = null;

      switch (option.action) {
        case 'camera':
          attachment = await fileUploadService.takePhoto();
          break;
        case 'photo':
          attachment = await fileUploadService.pickPhoto();
          break;
        case 'document':
          attachment = await fileUploadService.pickDocument();
          break;
      }

      if (attachment) {
        // Validate the file
        const validationError = fileUploadService.validateFile(attachment);
        if (validationError) {
          Alert.alert('Invalid File', validationError);
          return;
        }

        onAttachmentSelected(attachment);
        onClose();
      }
    } catch (error) {
      console.error('Attachment selection failed:', error);
      Alert.alert(
        'Selection Failed',
        error instanceof Error ? error.message : 'Failed to select attachment'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    if (isLoading) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={styles.modalContainer}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text
                  style={[
                    styles.title,
                    { color: isDarkMode ? '#ffffff' : '#1f2937' },
                  ]}
                >
                  Add Attachment
                </Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  disabled={isLoading}
                >
                  <FontAwesome5
                    name="times"
                    size={20}
                    color={isDarkMode ? '#9ca3af' : '#6b7280'}
                  />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {attachmentOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                        borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
                      },
                      isLoading && styles.optionDisabled,
                    ]}
                    onPress={() => handleOptionPress(option)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: option.color + '20' },
                      ]}
                    >
                      <FontAwesome5
                        name={option.icon}
                        size={24}
                        color={option.color}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: isDarkMode ? '#ffffff' : '#1f2937' },
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                    <FontAwesome5
                      name="chevron-right"
                      size={16}
                      color={isDarkMode ? '#6b7280' : '#9ca3af'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Usage Tips */}
              <View style={styles.tipsContainer}>
                <Text
                  style={[
                    styles.tipsTitle,
                    { color: isDarkMode ? '#d1d5db' : '#4b5563' },
                  ]}
                >
                  💡 Tips
                </Text>
                <Text
                  style={[
                    styles.tipsText,
                    { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                  ]}
                >
                  • Images are automatically compressed for faster upload{'\n'}
                  • Text files enable deep pattern recognition{'\n'}
                  • Maximum file size: 5MB per file
                </Text>
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
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
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    padding: 20,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  tipsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
});