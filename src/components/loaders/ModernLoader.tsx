import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaSpinner } from './NuminaSpinner';
import AppStateManager from '../../services/appStateManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ModernLoaderProps {
  visible: boolean;
  message?: string;
  showSpinner?: boolean;
  dynamicMessages?: string[];
}

export const ModernLoader: React.FC<ModernLoaderProps> = ({
  visible,
  message = "Processing your request...",
  showSpinner = true,
  dynamicMessages,
}) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  const messages = dynamicMessages || [message];

  useEffect(() => {
    const appStateManager = AppStateManager.getInstance();
    
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Text flip animation for dynamic feel - pausable in background
      const flipCallback = () => {
        Animated.sequence([
          Animated.timing(flipAnimation, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(flipAnimation, {
            toValue: 0,
            duration: 90,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (dynamicMessages && dynamicMessages.length > 1) {
            setCurrentMessageIndex(prev => (prev + 1) % messages.length);
          }
        });
      };
      
      // Register as pausable interval
      const intervalId = appStateManager.registerPausableInterval(
        'modern-loader-flip',
        flipCallback,
        1200
      );

      return () => {
        appStateManager.unregisterInterval('modern-loader-flip');
      };
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
      
      // Cleanup interval when not visible
      appStateManager.unregisterInterval('modern-loader-flip');
    }
  }, [visible, fadeAnim, flipAnimation, dynamicMessages, messages.length]);

  const rotateX = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });

  const opacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.7, 1],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: screenWidth,
        height: screenHeight,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
        zIndex: 10000,
        opacity: fadeAnim,
      }}
    >
      {showSpinner && (
        <NuminaSpinner 
          size={36} 
          visible={visible}
        />
      )}
      <Animated.Text
        style={{
          marginTop: showSpinner ? 16 : 0,
          fontSize: 16,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
          fontWeight: '400',
          textAlign: 'center',
          paddingHorizontal: 40,
          transform: [{ rotateX }],
          opacity,
          letterSpacing: 0.3,
          lineHeight: 22,
        }}
      >
        {messages[currentMessageIndex]}
      </Animated.Text>
    </Animated.View>
  );
};