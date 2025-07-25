import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  Dimensions,
  Text,
  Easing,
  Alert,
} from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { TextStyles } from '../../utils/fonts';
import ToolExecutionService, { ToolExecution } from '../../services/toolExecutionService';
import { FileUploadService } from '../../services/fileUploadService';
import { MessageAttachment, UploadProgress } from '../../types/message';
import { AttachmentPreview } from './AttachmentPreview';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width } = Dimensions.get('window');

// Fast Ring Loader Component for Send Button
const FastRingLoader: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({ 
  size = 18, 
  color = '#ffffff', 
  strokeWidth = 2 
}) => {
  const rotationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animationLoop = Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    );
    
    animationLoop.start();
    
    // Cleanup animation on unmount
    return () => {
      animationLoop.stop();
      rotationValue.setValue(0);
    };
  }, [rotationValue]);

  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference * 0.8; // 80% of circle
  const strokeDashoffset = circumference * 0.2; // Smaller gap for rounder look

  return (
    <Animated.View style={{ 
      transform: [{ rotate: rotation }],
      width: size,
      height: size,
    }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
    </Animated.View>
  );
};

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (attachments?: MessageAttachment[]) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  isLoading?: boolean;
  maxLength?: number;
  placeholder?: string;
  voiceEnabled?: boolean;
  // Emotional State Features
  userEmotionalState?: {
    mood: string;
    intensity: number;
    primaryEmotion?: string;
  };
  // Tool execution props
  toolExecutions?: ToolExecution[];
  onToggleToolModal?: () => void;
  // File attachment props
  attachments?: MessageAttachment[];
  onAttachmentsChange?: (attachments: MessageAttachment[]) => void;
  enableFileUpload?: boolean;
  maxAttachments?: number;
}

export const ChatInput: React.FC<ChatInputProps> = React.memo(({
  value,
  onChangeText,
  onSend,
  onVoiceStart,
  onVoiceEnd,
  isLoading = false,
  maxLength = 500,
  placeholder = "Share your thoughts...",
  voiceEnabled = true,
  userEmotionalState,
  toolExecutions = [],
  onToggleToolModal,
  attachments = [],
  onAttachmentsChange,
  enableFileUpload = true,
  maxAttachments = 5,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showEmotionNotification, setShowEmotionNotification] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  
  // Tool execution state
  const [showToolStream, setShowToolStream] = useState(false);
  const [currentToolText, setCurrentToolText] = useState<string>('');
  const [zapIconScale] = useState(new Animated.Value(1));
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);
  const toolExecutionService = ToolExecutionService.getInstance();
  const fileUploadService = FileUploadService.getInstance();
  
  // File attachment state
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentButtonsVisible, setAttachmentButtonsVisible] = useState(false);
  const attachmentButtonsAnim = useRef(new Animated.Value(0)).current;
  
  // Check if there are active tool executions
  const hasActiveTools = toolExecutions.some(exec => exec.status === 'executing');
  const toolCount = toolExecutions.length;

  
  // Animated values for smooth animations
  const voiceAnimScale = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const zapPulseAnim = useRef(new Animated.Value(1)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const emotionSlideAnim = useRef(new Animated.Value(120)).current; // Start at bottom of phone
  const emotionOpacityAnim = useRef(new Animated.Value(0)).current; // Start invisible
  
  // Computed values
  const isInputEmpty = !value.trim();
  const hasAttachments = attachments.length > 0;
  const canSend = (!isInputEmpty || hasAttachments) && !isLoading && !isUploading;

  // Voice recording animation
  useEffect(() => {
    if (isVoiceActive) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceActive]);
  
  // Zap icon animation when tools are active
  useEffect(() => {
    if (hasActiveTools) {
      const zapAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(zapPulseAnim, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(zapPulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      zapAnimation.start();
      return () => zapAnimation.stop();
    } else {
      zapPulseAnim.setValue(1);
    }
  }, [hasActiveTools]);

  // Watch for emotion changes and trigger notification
  useEffect(() => {
    if (userEmotionalState) {
      const newEmotion = userEmotionalState.primaryEmotion || userEmotionalState.mood;
      
      if (newEmotion && newEmotion !== currentEmotion) {
        setCurrentEmotion(newEmotion);
        showNotification();
      }
    }
  }, [userEmotionalState, currentEmotion]);
  
  // Tool notification system - proper notification behavior
  useEffect(() => {
    const activeExecutions = toolExecutions.filter(exec => exec.status === 'executing');
    const completedExecutions = toolExecutions.filter(exec => exec.status === 'completed');
    
    if (activeExecutions.length > 0) {
      // Show notification for active executions
      const latestExecution = activeExecutions[activeExecutions.length - 1];
      const toolText = getToolDisplayText(latestExecution);
      setCurrentToolText(toolText);
      showToolNotification();
    } else if (completedExecutions.length > 0) {
      // Show completion notification and auto-dismiss
      const latestCompleted = completedExecutions[completedExecutions.length - 1];
      const toolText = getToolDisplayText(latestCompleted);
      setCurrentToolText(toolText);
      showToolNotification();
      
      // Clear any existing timer
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
      
      // Auto-dismiss after 2 seconds
      autoDismissTimer.current = setTimeout(() => {
        hideToolNotification();
      }, 2000);
    } else if (toolExecutions.length === 0 && showToolStream) {
      // No executions, hide notification
      hideToolNotification();
    }
  }, [toolExecutions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, []);

  const getToolDisplayText = (execution: ToolExecution): string => {
    const { toolName, details, status } = execution;
    const isExecuting = status === 'executing';
    
    // Helper function to get safe query text
    const getQueryText = () => {
      if (!details) return '';
      return details.query || details.action || details.searchType || '';
    };
    
    // Helper function to create search display text
    const getSearchText = (action: string, emoji: string, completedEmoji: string) => {
      const query = getQueryText();
      if (isExecuting) {
        return query ? `${emoji} ${action}: "${query}"` : `${emoji} ${action}...`;
      } else {
        return query ? `${completedEmoji} ${action} complete` : `${completedEmoji} Search complete`;
      }
    };
    
    switch (toolName) {
      // Search Tools
      case 'web_search':
        return getSearchText('Web search', '🌐', '⚡');
      case 'news_search':
        return getSearchText('News search', '📡', '📺');
      case 'social_search':
        return getSearchText('Social search', '💬', '💭');
      case 'academic_search':
        return getSearchText('Academic search', '📚', '🎯');
      case 'image_search':
        return getSearchText('Image search', '🎨', '🖼️');
      
      // Music & Entertainment
      case 'music_recommendations':
        const musicQuery = getQueryText();
        return isExecuting 
          ? (musicQuery ? `🎵 Finding music for "${musicQuery}"` : `🎵 Finding music recommendations`)
          : (musicQuery ? `🎶 Music found for "${musicQuery}"` : `🎶 Music recommendations ready`);
      case 'spotify_playlist':
        const playlistQuery = getQueryText();
        return isExecuting 
          ? (playlistQuery ? `🎧 Creating playlist: "${playlistQuery}"` : `🎧 Creating playlist`)
          : `✅ Playlist created`;
      
      // Quick Utilities
      case 'weather_check':
        const location = details?.location || getQueryText();
        return isExecuting 
          ? (location ? `☀️ Checking weather for ${location}` : `☀️ Checking weather`)
          : (location ? `🌈 Weather for ${location}` : `🌈 Weather info`);
      case 'timezone_converter':
        return isExecuting ? `🌍 Converting time zones` : `⏰ Time converted`;
      case 'calculator':
        const calculation = getQueryText();
        return isExecuting 
          ? (calculation ? `🧮 Calculating: ${calculation}` : `🧮 Calculating`)
          : `✅ Calculation complete`;
      case 'translation':
        const translateText = getQueryText();
        return isExecuting 
          ? (translateText ? `🌐 Translating: "${translateText}"` : `🌐 Translating`)
          : `🌍 Translation complete`;
      
      // Financial Tools
      case 'stock_lookup':
        const stockSymbol = getQueryText();
        return isExecuting 
          ? (stockSymbol ? `📊 Getting data for ${stockSymbol}` : `📊 Getting stock data`)
          : (stockSymbol ? `💹 Data for ${stockSymbol}` : `💹 Stock info`);
      case 'crypto_lookup':
        const cryptoSymbol = getQueryText();
        return isExecuting 
          ? (cryptoSymbol ? `⚡ Getting ${cryptoSymbol} prices` : `⚡ Getting crypto prices`)
          : (cryptoSymbol ? `₿ ${cryptoSymbol} data` : `₿ Crypto data`);
      case 'currency_converter':
        return isExecuting ? `💱 Converting currency` : `✅ Currency converted`;
      
      // Creative & Professional
      case 'text_generator':
        const textType = getQueryText();
        return isExecuting 
          ? (textType ? `✍️ Generating: "${textType}"` : `✍️ Generating content`)
          : `📝 Content generated`;
      case 'code_generator':
        const codeType = getQueryText();
        return isExecuting 
          ? (codeType ? `💻 Writing ${codeType}` : `💻 Writing code`)
          : `⚡ Code generated`;
      case 'linkedin_helper':
        const linkedinTopic = getQueryText();
        return isExecuting 
          ? (linkedinTopic ? `💼 Creating LinkedIn post about "${linkedinTopic}"` : `💼 Creating LinkedIn post`)
          : `🎯 LinkedIn content ready`;
      case 'email_assistant':
        const emailTopic = getQueryText();
        return isExecuting 
          ? (emailTopic ? `✉️ Drafting email about "${emailTopic}"` : `✉️ Drafting email`)
          : `📧 Email ready`;
      
      // Health & Wellness
      case 'fitness_tracker':
        const workoutType = getQueryText();
        return isExecuting 
          ? (workoutType ? `💪 Tracking ${workoutType}` : `💪 Tracking workout`)
          : `🏆 Fitness logged`;
      case 'nutrition_lookup':
        const foodItem = getQueryText();
        return isExecuting 
          ? (foodItem ? `🥗 Analyzing ${foodItem}` : `🥗 Analyzing nutrition`)
          : `📊 Nutrition info`;
      
      // Lifestyle Tools
      case 'reservation_booking':
        const restaurant = getQueryText();
        return isExecuting 
          ? (restaurant ? `🍽️ Booking table at ${restaurant}` : `🍽️ Booking table`)
          : `✅ Reservation confirmed`;
      case 'itinerary_generator':
        const destination = getQueryText();
        return isExecuting 
          ? (destination ? `✈️ Planning trip to ${destination}` : `✈️ Planning trip`)
          : `🗺️ Itinerary ready`;
      case 'credit_management':
        return isExecuting ? `💳 Managing credits` : `✅ Credits updated`;
      
      // Quick Generators
      case 'qr_generator':
        const qrContent = getQueryText();
        return isExecuting 
          ? (qrContent ? `📱 Creating QR code for "${qrContent}"` : `📱 Creating QR code`)
          : `✅ QR code ready`;
      case 'password_generator':
        const passwordSpecs = getQueryText();
        return isExecuting 
          ? (passwordSpecs ? `🔐 Generating password (${passwordSpecs})` : `🔐 Generating secure password`)
          : `✅ Password created`;
      
      default:
        const displayName = toolName.replace(/_/g, ' ');
        const query = getQueryText();
        return isExecuting 
          ? (query ? `⚡ ${displayName}: "${query}"` : `⚡ ${displayName}...`)
          : (query ? `✓ ${displayName} complete` : `✓ ${displayName}`);
    }
  };

  const showToolNotification = () => {
    // Set state to showing
    setShowToolStream(true);
    
    // Reset animation values to start position
    emotionSlideAnim.setValue(120);
    emotionOpacityAnim.setValue(0);
    
    // Slide in animation
    Animated.parallel([
      Animated.timing(emotionSlideAnim, {
        toValue: -60,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(emotionOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideToolNotification = () => {
    // Clear any existing auto-dismiss timer
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
    
    // Don't hide if not showing
    if (!showToolStream) return;
    
    // Slide out animation
    Animated.parallel([
      Animated.timing(emotionSlideAnim, {
        toValue: 120,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
      Animated.timing(emotionOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset state after animation
      setShowToolStream(false);
      setCurrentToolText('');
      emotionSlideAnim.setValue(120);
      emotionOpacityAnim.setValue(0);
    });
  };

  const showNotification = () => {
    const now = Date.now();
    const timeSinceLastNotification = now - lastNotificationTime;
    const minCooldown = 8000; // 8 second cooldown between notifications
    
    // Skip if notification is already showing or if cooldown hasn't elapsed
    if (showEmotionNotification || timeSinceLastNotification < minCooldown) {
      return;
    }
    
    setLastNotificationTime(now);
    setShowEmotionNotification(true);
    
    Animated.parallel([
      Animated.timing(emotionSlideAnim, {
        toValue: -60, 
        duration: 200,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), 
      }),
      Animated.timing(emotionOpacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();

    // Auto-hide after 3.5 seconds
    setTimeout(() => {
      hideNotification();
    }, 3000);
  };

  const hideNotification = () => {
    // Slide down and out of view (back toward bottom of phone, +Y direction)
    Animated.parallel([
      Animated.timing(emotionSlideAnim, {
        toValue: 120, 
        duration: 300,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(emotionOpacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.quad),
      }),
    ]).start(() => {
      // Reset position for next show and hide component
      emotionSlideAnim.setValue(120);
      setShowEmotionNotification(false);
    });
  };

  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideNotification();
  };

  const getMoodColor = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy':
      case 'joyful': return '#10b981';
      case 'sad':
      case 'melancholy': return '#3b82f6';
      case 'angry':
      case 'frustrated': return '#ef4444';
      case 'anxious':
      case 'worried': return '#f59e0b';
      case 'excited': return '#7f69ff';
      case 'calm':
      case 'peaceful': return '#06b6d4';
      default: return '#80eaff';
    }
  };

  const handleVoicePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isVoiceActive) {
      // Stop voice recording
      setIsVoiceActive(false);
      onVoiceEnd?.();
      
      Animated.spring(voiceAnimScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      // Start voice recording
      setIsVoiceActive(true);
      onVoiceStart?.();
      
      Animated.spring(voiceAnimScale, {
        toValue: 1.1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const handleSendPress = async () => {
    if (!canSend) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.spring(sendButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start(() => {
      Animated.spring(sendButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }).start();
    });

    // Process attachments if any are pending
    let finalAttachments = attachments;
    if (hasAttachments) {
      const pendingAttachments = attachments.filter(a => a.uploadStatus === 'pending');
      
      if (pendingAttachments.length > 0) {
        setIsUploading(true);
        
        try {
          const processedAttachments = await fileUploadService.uploadFiles(
            pendingAttachments,
            (overall, individual) => {
              setUploadProgress(individual);
            }
          );
          
          // Update attachments with processed versions
          finalAttachments = attachments.map(attachment => {
            const processed = processedAttachments.find(u => u.id === attachment.id);
            return processed || attachment;
          });
          
          onAttachmentsChange?.(finalAttachments);
          
          // Check if any uploads failed
          const failedUploads = finalAttachments.filter(a => a.uploadStatus === 'error');
          if (failedUploads.length > 0) {
            // Continue anyway - let the user decide
          } else {
          }
        } catch (error) {
          // Continue with message sending even if some uploads failed
        } finally {
          setIsUploading(false);
        }
      }
    }

    // Final validation: ensure no pending uploads (but allow errors through)
    const stillPending = finalAttachments.filter(a => a.uploadStatus === 'pending');
    if (stillPending.length > 0) {
      return;
    }
    
    // Log final attachment status
    const uploadedCount = finalAttachments.filter(a => a.uploadStatus === 'uploaded').length;
    const errorCount = finalAttachments.filter(a => a.uploadStatus === 'error').length;
    
    // Filter out failed attachments for sending
    const validAttachments = finalAttachments.filter(a => a.uploadStatus === 'uploaded');
    
    if (errorCount > 0 && uploadedCount === 0) {
    }

    onSend(validAttachments);
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    const newAttachments = attachments.filter(a => a.id !== attachmentId);
    onAttachmentsChange?.(newAttachments);
  };

  // Premium attachment handlers with instant performance
  const handleCameraPress = async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      // Request permissions before launching to avoid delays
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Camera Permission', 'Please enable camera access to take photos.');
        return;
      }

      // Launch camera with optimized settings
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Balance quality vs performance
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Camera Error', 'Unable to access camera. Please try again.');
    }
  };

  const handleGalleryPress = async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      // Launch gallery with optimized settings for speed
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Gallery Error', 'Unable to access photo library. Please try again.');
    }
  };

  const handleDocumentPress = async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Document Error', 'Unable to select document. Please try again.');
    }
  };

  const handleNewAttachment = async (asset: any) => {
    if (attachments.length >= maxAttachments) {
      Alert.alert('Maximum Attachments', `You can only attach up to ${maxAttachments} files.`);
      return;
    }

    const newAttachment: MessageAttachment = {
      id: Date.now().toString(),
      type: asset.type?.includes('image') ? 'image' : 'document',
      name: asset.name || `attachment_${Date.now()}`,
      uri: asset.uri,
      size: asset.fileSize || 0,
      uploadStatus: 'pending',
      mimeType: asset.mimeType || 'application/octet-stream',
    };

    onAttachmentsChange?.([...attachments, newAttachment]);
  };

  const toggleAttachmentButtons = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVisibility = !attachmentButtonsVisible;
    setAttachmentButtonsVisible(newVisibility);
    
    Animated.spring(attachmentButtonsAnim, {
      toValue: newVisibility ? 1 : 0,
      useNativeDriver: false,
      tension: 300,
      friction: 20,
    }).start();
  };
  
  // Animation effect for attachment buttons
  useEffect(() => {
    if (attachmentButtonsVisible) {
      Animated.spring(attachmentButtonsAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 300,
        friction: 20,
      }).start();
    } else {
      Animated.timing(attachmentButtonsAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [attachmentButtonsVisible]);
  
  const handleZapPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.spring(zapIconScale, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start(() => {
      Animated.spring(zapIconScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    });
    
    onToggleToolModal?.();
  };

  const handleInputFocus = () => {
    // Light haptic for input focus
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animation for focus (cannot use native driver due to borderWidth)
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false, // Required for borderWidth animation
    }).start();
  };

  const handleInputBlur = () => {
    // Animation for blur (cannot use native driver due to borderWidth)
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false, // Required for borderWidth animation
    }).start();
  };

  return (
    <View style={styles.container}>
      {/* Character Count */}
      {value.length > maxLength * 0.8 && (
        <View style={styles.characterCount}>
          <Text style={[
            TextStyles.caption,
            styles.characterCountText,
            {
              color: value.length >= maxLength 
                ? NuminaColors.chatGreen[200]
                : isDarkMode ? NuminaColors.darkMode[300] : NuminaColors.darkMode[400],
            }
          ]}>
            {value.length}/{maxLength}
          </Text>
        </View>
      )}

      {/* Floating Input Container */}
      <View style={[
        styles.floatingContainer,
        {
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
          borderColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
        }
      ]}>
        <View style={styles.inputRow}>
          {/* Text Input */}
          <Animated.View style={[
            styles.inputContainer,
            {
              backgroundColor: 'transparent',
              borderColor: inputFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  'transparent',
                  'rgba(134, 239, 173, 0)'
                ],
              }),
              borderWidth: inputFocusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            }
          ]}>
<TextInput
              style={[
                styles.textInput,
                {
                  height: 44,
                  minHeight: 44,
                  maxHeight: 44,
                  color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[500],
                }
              ]}
              value={value}
              onChangeText={(text) => {
                if (text.endsWith('\n')) {
                  const messageText = text.slice(0, -1);
                  onChangeText(messageText);
                  handleSendPress();
                } else {
                  onChangeText(text);
                }
              }}
              placeholder={placeholder}
              placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
              keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              multiline={false}
              numberOfLines={1}
              maxLength={maxLength}
              onSubmitEditing={handleSendPress}
              returnKeyType="send"
              blurOnSubmit={false}
              scrollEnabled={true}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              editable={!isLoading}
              textAlignVertical="center"
            />
          </Animated.View>


          {/* Attachment Button */}
          {enableFileUpload && (
            <TouchableOpacity
              style={styles.attachmentToggleButton}
              onPress={toggleAttachmentButtons}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name={attachmentButtonsVisible ? "times" : "paperclip"} 
                size={16} 
                color={isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[600]} 
              />
            </TouchableOpacity>
          )}

          {/* Tools Zap Button */}
          <View style={styles.zapButtonContainer}>
            <TouchableOpacity
              onPress={handleZapPress}
              activeOpacity={0.7}
              style={[
                styles.zapButton,
                hasActiveTools && {
                  shadowColor: '#10d9a3',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 6,
                }
              ]}
            >
              <Animated.View style={[
                styles.zapIconContainer,
                {
                  transform: [
                    { scale: zapIconScale },
                    { scale: zapPulseAnim }
                  ],
                }
              ]}>
                <Feather
                  name="zap"
                  size={18}
                  color={hasActiveTools 
                    ? (isDarkMode ? '#98fb98' : '#22c55e')
                    : (isDarkMode ? '#98fb98' : '#22c55e')
                  }
                />
                {toolCount > 0 && (
                  <View style={[
                    styles.toolBadge,
                    {
                      backgroundColor: hasActiveTools 
                        ? (isDarkMode ? '#fbbf24' : '#f59e0b')
                        : (isDarkMode ? '#6b7280' : '#9ca3af')
                    }
                  ]}>
                    <Text style={[
                      styles.toolBadgeText,
                      { color: isDarkMode ? '#1f2937' : '#ffffff' }
                    ]}>
                      {toolCount > 9 ? '9+' : toolCount}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
          
          {/* Send Button */}
          <View style={styles.sendButtonContainer}>
            <TouchableOpacity
              onPress={handleSendPress}
              disabled={!canSend}
              activeOpacity={0.7}
              style={styles.sendButtonContainer}
            >
              <Animated.View style={[
                styles.sendButton,
                {
                  backgroundColor: canSend
                    ? (isDarkMode ? 'rgba(255,255,255,0.95)' : '#6ec5ff')
                    : (isDarkMode ? 'rgba(255,255,255,0.5)' : '#acdcff'),
                  borderColor: isDarkMode ? (canSend ? '#87CEEB' : 'rgba(135,206,235,0.5)') : 'transparent',
                  borderWidth: isDarkMode ? 1 : 0,
                  shadowColor: isDarkMode ? '#87CEEB' : '#000',
                  shadowOffset: { width: 0, height: isDarkMode ? 0 : 2 },
                  shadowOpacity: isDarkMode ? (canSend ? 0.6 : 0.3) : 0.1,
                  shadowRadius: isDarkMode ? 8 : 4,
                  elevation: isDarkMode ? 8 : 4,
                  transform: [{ scale: sendButtonScale }],
                }
              ]}>
                {isLoading || isUploading ? (
                  <FastRingLoader 
                    size={18} 
                    color={isDarkMode ? '#1a1a1a' : '#616161'} 
                    strokeWidth={2}
                  />
                ) : (
                  <FontAwesome5
                    name="arrow-up"
                    size={18}
                    color={isDarkMode ? '#1a1a1a' : '#616161'}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Voice Recording Indicator */}
      {isVoiceActive && (
        <Animated.View style={[
          styles.voiceIndicator,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(20, 20, 20, 0.9)' 
              : 'rgba(255, 255, 255, 0.3)',
            borderColor: 'rgba(134, 239, 172, 0.4)',
          }
        ]}>
          <View style={styles.voiceIndicatorContent}>
            <Animated.View style={[
              styles.voiceRecordingDot,
              { transform: [{ scale: pulseAnim }] }
            ]} />
            <Text style={[
              TextStyles.caption,
              styles.voiceIndicatorText,
              { color: isDarkMode ? NuminaColors.darkMode[200] : NuminaColors.darkMode[50] }
            ]}>
              Listening...
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Tool Stream Notification w/ Priority over emotion */}
      {showToolStream && currentToolText && (
        <TouchableOpacity
          onPress={hideToolNotification}
          activeOpacity={0.8}
          style={styles.notificationWrapper}
        >
          <Animated.View style={[
            styles.emotionNotification,
            {
              backgroundColor: isDarkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
              opacity: emotionOpacityAnim,
              transform: [{ translateY: emotionSlideAnim }],
            }
          ]}>
            <View style={[
              styles.emotionDot,
              { 
                backgroundColor: isDarkMode ? '#22c55e' : '#16a34a',
                opacity: 0.8 
              }
            ]} />
            <Text 
              style={[
                styles.emotionText,
                { color: isDarkMode ? '#ccc' : '#666' }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {currentToolText}
            </Text>
            <Text style={[
              styles.tapHint,
              { color: isDarkMode ? '#888' : '#aaa' }
            ]}>
              Dismiss
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Emotion Notification */}
      {!showToolStream && showEmotionNotification && currentEmotion && (
        <TouchableOpacity
          onPress={handleNotificationPress}
          activeOpacity={0.8}
          style={styles.notificationWrapper}
        >
          <Animated.View style={[
            styles.emotionNotification,
            {
              backgroundColor: isDarkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              opacity: emotionOpacityAnim,
              transform: [{ translateY: emotionSlideAnim }],
            }
          ]}>
            <View style={[
              styles.emotionDot,
              { 
                backgroundColor: getMoodColor(currentEmotion),
                opacity: 0.7 
              }
            ]} />
            <Text style={[
              styles.emotionText,
              { color: isDarkMode ? '#ccc' : '#666' }
            ]}>
              Feeling {currentEmotion}
            </Text>
            <Text style={[
              styles.tapHint,
              { color: isDarkMode ? '#888' : '#aaa' }
            ]}>
              Dismiss
            </Text>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* Premium Attachment Buttons - Above Input */}
      {enableFileUpload && (
        <Animated.View style={[
          styles.attachmentButtonsContainer,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(20, 20, 20, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
            opacity: attachmentButtonsAnim,
            height: attachmentButtonsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            transform: [{
              scaleY: attachmentButtonsAnim,
            }],
            marginBottom: attachmentButtonsVisible ? 8 : 0,
          }
        ]}>
          {attachmentButtonsVisible && (
            <>
              {/* Camera Button */}
            <TouchableOpacity
              style={[
                styles.premiumPillButton,
                {
                  backgroundColor: 'rgba(100, 149, 237, 0.1)',
                  borderColor: 'rgba(100, 149, 237, 0.2)',
                }
              ]}
              onPress={handleCameraPress}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="camera" size={16} color="#6495ed" />
              <Text style={[
                styles.pillButtonText,
                { color: '#6495ed' }
              ]}>Camera</Text>
            </TouchableOpacity>

            {/* Gallery Button */}
            <TouchableOpacity
              style={[
                styles.premiumPillButton,
                {
                  backgroundColor: 'rgba(147, 112, 219, 0.1)',
                  borderColor: 'rgba(147, 112, 219, 0.2)',
                }
              ]}
              onPress={handleGalleryPress}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="image" size={16} color="#9370db" />
              <Text style={[
                styles.pillButtonText,
                { color: '#9370db' }
              ]}>Gallery</Text>
            </TouchableOpacity>

            {/* Document Button */}
            <TouchableOpacity
              style={[
                styles.premiumPillButton,
                {
                  backgroundColor: 'rgba(255, 140, 0, 0.1)',
                  borderColor: 'rgba(255, 140, 0, 0.2)',
                  }
                ]}
                onPress={handleDocumentPress}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="file-alt" size={16} color="#ff8c00" />
                <Text style={[
                  styles.pillButtonText,
                  { color: '#ff8c00' }
                ]}>Files</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}

      {/* Attachment Preview */}
      {hasAttachments && (
        <AttachmentPreview
          attachments={attachments}
          uploadProgress={uploadProgress}
          onRemoveAttachment={handleRemoveAttachment}
        />
      )}

    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingVertical: 0,
    paddingBottom: 0,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  characterCount: {
    alignItems: 'flex-end',
    paddingBottom: 8,
    paddingRight: 4,
  },
  characterCountText: {
    letterSpacing: -0.2,
  },
  floatingContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 12,
    position: 'relative',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 0,
    zIndex: 10, 
    height: 68, 
    minHeight: 68,
    maxHeight: 68,
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    position: 'relative',
    zIndex: 10,
  },
  voiceButtonContainer: {
    marginBottom: 2,
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 2,
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    justifyContent: 'center',
  },
  textInput: {
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    paddingVertical: 1,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  zapButtonContainer: {
    marginRight: -4,
  },
  zapButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  zapIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 14,
  },
  toolBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  sendButtonContainer: {
    marginBottom: 2,
  },
  sendButton: {
    width: 65,
    height: 43,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
  },
  enterHint: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
  },
  voiceIndicator: {
    position: 'absolute',
    top: -48,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  voiceIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  voiceRecordingDot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#86efac',
  },
  voiceIndicatorText: {
    letterSpacing: -0.2,
  },
  notificationWrapper: {
    position: 'absolute',
    bottom: 20, 
    left: 16,
    right: 16,
    zIndex: 5, 
  },
  emotionNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emotionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emotionText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Inter_500Medium',
  },
  tapHint: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  
  // Premium Attachment Button Styles
  attachmentToggleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
  },
  attachmentButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginHorizontal: 4,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  premiumPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: 90,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});