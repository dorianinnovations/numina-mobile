import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageAttachment, UploadProgress } from '../../types/message';
import { NuminaColors } from '../../utils/colors';

const { width: screenWidth } = Dimensions.get('window');

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
  maxHeight = 300, // Increased default max height
}) => {
  const { theme, isDarkMode } = useTheme();
  const [imageDimensions, setImageDimensions] = useState<{[key: string]: {width: number, height: number}}>({});

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

  const getFileIcon = (attachment: MessageAttachment): { icon: string; color: string } => {
    switch (attachment.type) {
      case 'image':
        return { icon: 'image', color: '#10b981' };
      case 'document':
        if (attachment.mimeType === 'application/pdf') {
          return { icon: 'file-pdf', color: '#ef4444' };
        }
        return { icon: 'file-alt', color: '#3b82f6' };
      case 'text':
        return { icon: 'file-text', color: '#f59e0b' };
      default:
        return { icon: 'file', color: '#6b7280' };
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

  // Calculate optimal image size based on aspect ratio
  const getOptimalImageSize = (attachment: MessageAttachment) => {
    const dimensions = imageDimensions[attachment.id];
    if (!dimensions || attachment.type !== 'image') {
      return { width: 140, height: 90 }; // Default size for non-images
    }

    const maxPreviewWidth = screenWidth * 0.7; // Max 70% of screen width
    const maxPreviewHeight = 200; // Max height for images
    const minWidth = 120;
    const minHeight = 80;

    const aspectRatio = dimensions.width / dimensions.height;
    
    let optimalWidth = Math.min(maxPreviewWidth, dimensions.width);
    let optimalHeight = optimalWidth / aspectRatio;

    // If height exceeds max, adjust width accordingly
    if (optimalHeight > maxPreviewHeight) {
      optimalHeight = maxPreviewHeight;
      optimalWidth = optimalHeight * aspectRatio;
    }

    // Ensure minimums
    optimalWidth = Math.max(minWidth, optimalWidth);
    optimalHeight = Math.max(minHeight, optimalHeight);

    return {
      width: Math.round(optimalWidth),
      height: Math.round(optimalHeight)
    };
  };

  // Load image dimensions when attachments change
  useEffect(() => {
    attachments.forEach(attachment => {
      if (attachment.type === 'image' && attachment.uri && !imageDimensions[attachment.id]) {
        Image.getSize(
          attachment.uri,
          (width, height) => {
            setImageDimensions(prev => ({
              ...prev,
              [attachment.id]: { width, height }
            }));
          },
          (error) => {
            console.warn('Failed to get image dimensions:', error);
            // Set fallback dimensions
            setImageDimensions(prev => ({
              ...prev,
              [attachment.id]: { width: 140, height: 90 }
            }));
          }
        );
      }
    });
  }, [attachments, imageDimensions]);

  const renderAttachmentCard = (attachment: MessageAttachment) => {
    const progress = getProgressForAttachment(attachment.id);
    const isUploading = attachment.uploadStatus === 'uploading';
    const isError = attachment.uploadStatus === 'error';
    const fileInfo = getFileIcon(attachment);
    const optimalSize = getOptimalImageSize(attachment);

    return (
      <View
        key={attachment.id}
        style={[
          styles.attachmentCard,
          {
            width: optimalSize.width,
            height: optimalSize.height,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            shadowColor: isDarkMode ? '#000' : '#000',
          },
        ]}
      >
        {/* Status gradient overlay */}
        <LinearGradient
          colors={
            isError
              ? ['rgba(239, 68, 68, 0.1)', 'transparent']
              : isUploading
              ? ['rgba(59, 130, 246, 0.1)', 'transparent']
              : ['rgba(16, 185, 129, 0.1)', 'transparent']
          }
          style={styles.statusOverlay}
        />

        {/* Remove button */}
        <TouchableOpacity
          style={[
            styles.removeButton,
            {
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            }
          ]}
          onPress={() => handleRemoveAttachment(attachment.id)}
          activeOpacity={0.7}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <FontAwesome5 name="times" size={12} color="#ef4444" />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.attachmentContent}>
          {attachment.type === 'image' && attachment.uri ? (
            <View style={[styles.imageContainer, { height: optimalSize.height - 60 }]}>
              <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
              {isUploading && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.fileIconContainer, { backgroundColor: `${fileInfo.color}15`, height: optimalSize.height - 60 }]}>
              <FontAwesome5 name={fileInfo.icon as any} size={Math.min(32, optimalSize.height / 4)} color={fileInfo.color} />
            </View>
          )}

          <View style={styles.attachmentInfo}>
            <Text
              style={[
                styles.fileName,
                {
                  color: isDarkMode ? NuminaColors.darkMode[100] : NuminaColors.darkMode[700],
                }
              ]}
              numberOfLines={2}
            >
              {attachment.name}
            </Text>
            
            <View style={styles.statusRow}>
              <Text
                style={[
                  styles.fileSize,
                  {
                    color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[500],
                  }
                ]}
              >
                {formatFileSize(attachment.size)}
              </Text>
              
              <View style={styles.statusIndicator}>
                {isUploading && progress ? (
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress.progress}%`,
                            backgroundColor: '#3b82f6',
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressText, { color: '#3b82f6' }]}>
                      {Math.round(progress.progress)}%
                    </Text>
                  </View>
                ) : (
                  <FontAwesome5
                    name={
                      isError ? 'exclamation-circle' :
                      attachment.uploadStatus === 'uploaded' ? 'check-circle' :
                      'clock'
                    }
                    size={12}
                    color={getStatusColor(attachment.uploadStatus)}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(248, 250, 252, 0.95)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          maxHeight,
        },
      ]}
    >
      <View style={styles.header}>
        <FontAwesome5 
          name="paperclip" 
          size={14} 
          color={isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[500]} 
        />
        <Text
          style={[
            styles.headerText,
            {
              color: isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[500],
            }
          ]}
        >
          {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.scrollView}
      >
        <View style={styles.scrollContent}>
          {attachments.map(renderAttachmentCard)}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 4,
    marginBottom: 2,
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  scrollView: {
    flexGrow: 1,
    minHeight: 80,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingRight: 20,
    alignItems: 'flex-start',
    minWidth: '100%',
  },
  attachmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentContent: {
    flex: 1,
    padding: 8,
    zIndex: 2,
  },
  imageContainer: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: 'transparent',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  attachmentInfo: {
    flex: 1,
    marginTop: 6,
  },
  fileName: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  fileSize: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  statusIndicator: {
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 2,
  },
  progressBar: {
    width: 30,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressText: {
    fontSize: 8,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});