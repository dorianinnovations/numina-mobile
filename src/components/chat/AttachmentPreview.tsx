import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageAttachment, UploadProgress } from '../../types/message';

interface AttachmentPreviewProps {
  attachments: MessageAttachment[];
  uploadProgress?: UploadProgress[];
  onRemoveAttachment: (attachmentId: string) => void;
  maxHeight?: number;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachments,
  uploadProgress = [],
  onRemoveAttachment,
  maxHeight = 120,
}) => {
  const { theme, isDarkMode } = useTheme();

  if (attachments.length === 0) {
    return null;
  }

  const getProgressForAttachment = (attachmentId: string): UploadProgress | undefined => {
    return uploadProgress.find(p => p.attachmentId === attachmentId);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (attachment: MessageAttachment): string => {
    switch (attachment.type) {
      case 'image':
        return 'image';
      case 'document':
        if (attachment.mimeType === 'application/pdf') return 'file-pdf';
        return 'file-alt';
      case 'text':
        return 'file-text';
      default:
        return 'file';
    }
  };

  const getStatusColor = (status: MessageAttachment['uploadStatus']): string => {
    switch (status) {
      case 'pending':
        return isDarkMode ? '#9ca3af' : '#6b7280';
      case 'uploading':
        return '#3b82f6';
      case 'uploaded':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return isDarkMode ? '#9ca3af' : '#6b7280';
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemoveAttachment(attachmentId);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
          borderColor: isDarkMode ? '#374151' : '#e5e7eb',
          maxHeight,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {attachments.map((attachment) => {
          const progress = getProgressForAttachment(attachment.id);
          const isUploading = attachment.uploadStatus === 'uploading';
          const hasError = attachment.uploadStatus === 'error';

          return (
            <View
              key={attachment.id}
              style={[
                styles.attachmentCard,
                {
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
                },
                hasError && { borderColor: '#ef4444' },
              ]}
            >
              {/* Remove button */}
              <TouchableOpacity
                style={[
                  styles.removeButton,
                  { backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' },
                ]}
                onPress={() => handleRemoveAttachment(attachment.id)}
                disabled={isUploading}
              >
                <FontAwesome5
                  name="times"
                  size={12}
                  color={isDarkMode ? '#ef4444' : '#dc2626'}
                />
              </TouchableOpacity>

              {/* Content */}
              <View style={styles.attachmentContent}>
                {attachment.type === 'image' ? (
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: attachment.uri }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    {isUploading && (
                      <View style={styles.uploadOverlay}>
                        <ActivityIndicator size="small" color="#ffffff" />
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.fileIconContainer,
                      { backgroundColor: getStatusColor(attachment.uploadStatus) + '20' },
                    ]}
                  >
                    <FontAwesome5
                      name={getFileIcon(attachment)}
                      size={20}
                      color={getStatusColor(attachment.uploadStatus)}
                    />
                  </View>
                )}

                {/* File info */}
                <View style={styles.fileInfo}>
                  <Text
                    style={[
                      styles.fileName,
                      { color: isDarkMode ? '#ffffff' : '#1f2937' },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {attachment.name}
                  </Text>
                  <Text
                    style={[
                      styles.fileSize,
                      { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                    ]}
                  >
                    {formatFileSize(attachment.size)}
                  </Text>
                </View>

                {/* Upload progress */}
                {isUploading && progress && (
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: isDarkMode ? '#4b5563' : '#e5e7eb' },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress.progress}%`,
                            backgroundColor: '#3b82f6',
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.progressText,
                        { color: isDarkMode ? '#9ca3af' : '#6b7280' },
                      ]}
                    >
                      {Math.round(progress.progress)}%
                    </Text>
                  </View>
                )}

                {/* Status indicator */}
                <View style={styles.statusContainer}>
                  {attachment.uploadStatus === 'uploaded' && (
                    <FontAwesome5 name="check-circle" size={12} color="#10b981" />
                  )}
                  {attachment.uploadStatus === 'error' && (
                    <FontAwesome5 name="exclamation-circle" size={12} color="#ef4444" />
                  )}
                  {attachment.uploadStatus === 'pending' && (
                    <FontAwesome5 name="clock" size={12} color={getStatusColor('pending')} />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Summary */}
      <View style={styles.summary}>
        <Text
          style={[
            styles.summaryText,
            { color: isDarkMode ? '#9ca3af' : '#6b7280' },
          ]}
        >
          {attachments.length} file{attachments.length !== 1 ? 's' : ''} selected
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  attachmentCard: {
    width: 140,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentContent: {
    alignItems: 'center',
    gap: 6,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnailImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    alignItems: 'center',
    gap: 2,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
  },
  fileSize: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  progressBar: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 4,
    left: 4,
  },
  summary: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
});