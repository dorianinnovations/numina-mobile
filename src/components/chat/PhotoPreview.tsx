import React, { useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { MessageAttachment } from '../../types/message';

const { width } = Dimensions.get('window');

interface PhotoPreviewProps {
  attachment: MessageAttachment;
  isUser: boolean;
  onPress?: () => void;
}

// Three dots processing indicator component
const ProcessingIndicator: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1Loop = createDotAnimation(dot1Anim, 0);
    const dot2Loop = createDotAnimation(dot2Anim, 200);
    const dot3Loop = createDotAnimation(dot3Anim, 400);

    dot1Loop.start();
    dot2Loop.start();
    dot3Loop.start();

    return () => {
      dot1Loop.stop();
      dot2Loop.stop();
      dot3Loop.stop();
    };
  }, []);

  return (
    <View style={styles.processingIndicator}>
      <Animated.View
        style={[
          styles.processingDot,
          {
            backgroundColor: isDarkMode ? '#ffffff' : '#000000',
            opacity: dot1Anim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.processingDot,
          {
            backgroundColor: isDarkMode ? '#ffffff' : '#000000',
            opacity: dot2Anim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.processingDot,
          {
            backgroundColor: isDarkMode ? '#ffffff' : '#000000',
            opacity: dot3Anim,
          },
        ]}
      />
    </View>
  );
};

export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  attachment,
  isUser,
  onPress,
}) => {
  const { theme, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const isProcessing = attachment.uploadStatus === 'uploading' || attachment.uploadStatus === 'pending';
  const hasError = attachment.uploadStatus === 'error';
  const isCompleted = attachment.uploadStatus === 'uploaded';

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const getImageDimensions = () => {
    const maxWidth = width * 0.6; // Max 60% of screen width
    const maxHeight = 200;
    
    if (attachment.width && attachment.height) {
      const aspectRatio = attachment.width / attachment.height;
      
      if (aspectRatio > 1) {
        // Landscape
        const calcWidth = Math.min(maxWidth, attachment.width);
        const calcHeight = calcWidth / aspectRatio;
        return {
          width: calcWidth,
          height: Math.min(maxHeight, calcHeight),
        };
      } else {
        // Portrait or square
        const calcHeight = Math.min(maxHeight, attachment.height);
        const calcWidth = calcHeight * aspectRatio;
        return {
          width: Math.min(maxWidth, calcWidth),
          height: calcHeight,
        };
      }
    }
    
    // Default dimensions
    return { width: maxWidth, height: 150 };
  };

  const { width: imageWidth, height: imageHeight } = getImageDimensions();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        disabled={isProcessing}
      >
        {isUser ? (
          // User photo with beautiful neumorphic gradient like user messages
          <LinearGradient
            colors={isDarkMode 
              ? ['#2d2d2d', '#262626', '#232323'] 
              : [theme.colors.chat.userMessage.background, theme.colors.chat.userMessage.background]
            }
            style={[
              styles.photoContainer,
              styles.userPhotoContainer,
              {
                width: imageWidth,
                height: imageHeight,
                borderWidth: 1,
                borderColor: isDarkMode ? '#404040' : 'rgba(0, 0, 0, 0.1)',
                shadowColor: isDarkMode ? '#000000' : '#000000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: isDarkMode ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 2,
              }
            ]}
          >
            <Image
              source={{ uri: attachment.uri }}
              style={[
                styles.photo,
                {
                  width: imageWidth - 4, // Account for gradient padding
                  height: imageHeight - 4,
                },
              ]}
              resizeMode="cover"
            />
            
            {/* Processing overlay for user photos */}
            {isProcessing && (
              <View style={[styles.overlay, styles.processingOverlay]}>
                <ProcessingIndicator isDarkMode={isDarkMode} />
              </View>
            )}
            
            {/* Error overlay */}
            {hasError && (
              <View style={[styles.overlay, styles.errorOverlay]}>
                <View style={styles.errorIndicator}>
                  <View style={[styles.errorDot, { backgroundColor: '#ef4444' }]} />
                </View>
              </View>
            )}
          </LinearGradient>
        ) : (
          // AI photo - simpler style to match AI message styling (no bubble)
          <View
            style={[
              styles.photoContainer,
              styles.aiPhotoContainer,
              {
                width: imageWidth,
                height: imageHeight,
                backgroundColor: isDarkMode ? 'transparent' : 'transparent',
              }
            ]}
          >
            <Image
              source={{ uri: attachment.uri }}
              style={[
                styles.photo,
                styles.aiPhoto,
                {
                  width: imageWidth,
                  height: imageHeight,
                },
              ]}
              resizeMode="cover"
            />
            
            {/* Processing overlay for AI photos */}
            {isProcessing && (
              <View style={[styles.overlay, styles.processingOverlay]}>
                <ProcessingIndicator isDarkMode={isDarkMode} />
              </View>
            )}
            
            {/* Error overlay */}
            {hasError && (
              <View style={[styles.overlay, styles.errorOverlay]}>
                <View style={styles.errorIndicator}>
                  <View style={[styles.errorDot, { backgroundColor: '#ef4444' }]} />
                </View>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignItems: 'flex-start',
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  userPhotoContainer: {
    // Matches user message bubble styling
    borderRadius: 8,
    padding: 2, // Small padding for gradient effect
  },
  aiPhotoContainer: {
    // Matches AI message styling (no bubble)
    borderRadius: 12,
  },
  photo: {
    borderRadius: 6, // Slightly smaller radius for inner image
  },
  aiPhoto: {
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  errorOverlay: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  processingIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  processingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  errorIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  errorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});