import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
  Easing,
  StatusBar,
  Platform,
} from 'react-native';
// Desktop: No haptics needed for web
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { HeaderMenu } from './HeaderMenu';
import { OptimizedImage } from './OptimizedImage';
import { AnimatedHamburger } from './AnimatedHamburger';
import { AnimatedBackArrow } from './AnimatedBackArrow';
import { ConversationHistory } from './ConversationHistory';

const numinaLogo = require('../assets/images/happynumina.png');

interface HeaderProps {
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showConversationsButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: (key: string) => void;
  onTitlePress?: () => void;
  onConversationSelect?: (conversation: any) => void;
  currentConversationId?: string;
  title?: string;
  subtitle?: string;
  isVisible?: boolean;
  isStreaming?: boolean;
  onRestoreHeader?: () => void;
  showAuthOptions?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  showBackButton = false,
  showMenuButton = false,
  showConversationsButton = false,
  onBackPress,
  onMenuPress,
  onTitlePress,
  onConversationSelect,
  currentConversationId,
  title,
  subtitle,
  isVisible = true,
  isStreaming = false,
  onRestoreHeader,
  showAuthOptions = true,
}) => {
  const { isDarkMode } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [conversationsVisible, setConversationsVisible] = useState(false);
  const [menuButtonPosition, setMenuButtonPosition] = useState({ x: 0, y: 0, width: 34, height: 34 });
  const [backArrowPressed, setBackArrowPressed] = useState(false);
  
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;
  const conversationsButtonScale = useRef(new Animated.Value(1)).current;
  const visibilityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(visibilityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  useEffect(() => {
    const targetOpacity = isVisible ? 1 : 0.05;
    
    // Stop any ongoing animation to prevent conflicts
    visibilityAnim.stopAnimation();
    
    Animated.timing(visibilityAnim, {
      toValue: targetOpacity,
      duration: isStreaming ? 200 : 400,
      useNativeDriver: true,
    }).start();
  }, [isVisible, isStreaming]);

  const handleMenuAction = (key: string) => {
    setMenuVisible(false);
    if (onMenuPress) onMenuPress(key);
  };

  const handleBackArrowPress = () => {
    // Haptic feedback for premium feel
    // Desktop: No haptics needed for web
    
    // Trigger press animation
    setBackArrowPressed(true);
    
    // Call the original onBackPress after a short delay
    setTimeout(() => {
      setBackArrowPressed(false);
      if (onBackPress) onBackPress();
    }, 150);
  };

  const handleMenuButtonPress = (event: any) => {
    // Haptic feedback for premium feel
    // Desktop: No haptics needed for web
    
    // Elegant press animation with better timing and easing
    Animated.sequence([
      // Press down with smooth easing
      Animated.timing(menuButtonScale, {
        toValue: 0.92,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Spring back with satisfying bounce
      Animated.timing(menuButtonScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();

    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuButtonPosition({ x: pageX, y: pageY, width, height });
      setMenuVisible(true);
    });
  };

  const handleConversationsButtonPress = () => {
    // Haptic feedback for premium feel
    // Desktop: No haptics needed for web
    
    // Elegant press animation with better timing and easing
    Animated.sequence([
      // Press down with smooth easing
      Animated.timing(conversationsButtonScale, {
        toValue: 0.92,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Spring back with satisfying bounce
      Animated.timing(conversationsButtonScale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();

    setConversationsVisible(true);
  };

  const handleConversationSelect = (conversation: any) => {
    if (onConversationSelect) {
      onConversationSelect(conversation);
    }
    setConversationsVisible(false);
  };

  const headerContent = (
    <BlurView
      intensity={isDarkMode ? 40 : 60}
      tint={isDarkMode ? 'dark' : 'default'}
      style={[
        styles.blurContainer,
        {
          borderColor: isDarkMode 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
        },
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={onTitlePress}
            activeOpacity={Platform.OS === 'web' ? 1 : (onTitlePress ? 0.7 : 1)}
            disabled={!onTitlePress}
          >
            <OptimizedImage 
              source={numinaLogo} 
              style={[
                styles.logo,
                {
                  opacity: isDarkMode ? 1 : 0.9,
                }
              ]}
              resizeMode="contain"
              showLoader={false}
              preload={false}
            />
            <Text style={[
              styles.numinaText,
              {
                color: isDarkMode ? '#ffffff' : '#586266eb',
              }
            ]}>
              {title || 'Numina'}
            </Text>
          </TouchableOpacity>
          {subtitle && (
            <Text style={[
              styles.headerSubtitle,
              { 
                color: isDarkMode ? '#888888' : '#666666',
                marginLeft: 4,
              }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.rightSection}>

              {showBackButton && (
                                  <TouchableOpacity
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      backgroundColor: isDarkMode 
                        ? 'rgba(173, 216, 230, 0.3)' 
                        : 'rgba(173, 216, 230, 0.8)',
                      borderColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.4)',
                      ...(Platform.OS === 'web' && {
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        // Firefox-specific fixes
                        MozBackgroundClip: 'padding-box',
                        backgroundClip: 'padding-box',
                      }),
                    }}
                    onPress={handleBackArrowPress}
                    activeOpacity={Platform.OS === 'web' ? 1 : 0.7}
                  >
                    <AnimatedBackArrow
                      color={isDarkMode ? '#6ec5ff' : '#4a5568'}
                      size={16}
                      isPressed={backArrowPressed}
                    />
                  </TouchableOpacity>
              )}

              {showConversationsButton && (
                <Animated.View style={{ transform: [{ scale: conversationsButtonScale }] }}>
                  <TouchableOpacity
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      backgroundColor: isDarkMode 
                        ? 'rgba(173, 216, 230, 0.3)' 
                        : 'rgba(173, 216, 230, 0.8)',
                      borderColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.4)',
                      marginLeft: showBackButton ? 12 : 0,
                      ...(Platform.OS === 'web' && {
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        // Firefox-specific fixes
                        MozBackgroundClip: 'padding-box',
                        backgroundClip: 'padding-box',
                      }),
                    }}
                    onPress={handleConversationsButtonPress}
                    activeOpacity={Platform.OS === 'web' ? 1 : 0.7}
                  >
                    <MaterialCommunityIcons
                      name="forum-outline"
                      size={16}
                      color={isDarkMode ? '#6ec5ff' : '#4a5568'}
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {showMenuButton && (
                <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
                  <TouchableOpacity
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      backgroundColor: isDarkMode 
                        ? 'rgba(173, 216, 230, 0.3)' 
                        : 'rgba(173, 216, 230, 0.8)',
                      borderColor: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.4)',
                      marginLeft: (showBackButton || showConversationsButton) ? 12 : 0,
                      ...(Platform.OS === 'web' && {
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                        // Firefox-specific fixes
                        MozBackgroundClip: 'padding-box',
                        backgroundClip: 'padding-box',
                      }),
                    }}
                    onPress={handleMenuButtonPress}
                    activeOpacity={Platform.OS === 'web' ? 1 : 0.7}
                  >
                    <AnimatedHamburger
                      isOpen={menuVisible}
                      color={isDarkMode ? '#6ec5ff' : '#4a5568'}
                      size={16}
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
        </View>
      </BlurView>
    );

  return (
    <>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: visibilityAnim,
          },
        ]}
      >
        {!isVisible && onRestoreHeader ? (
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={Platform.OS === 'web' ? 1 : 0.8}
            onPress={onRestoreHeader}
          >
            {headerContent}
          </TouchableOpacity>
        ) : (
          headerContent
        )}
      </Animated.View>
      
      <HeaderMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
        menuButtonPosition={menuButtonPosition}
        showAuthOptions={showAuthOptions}
      />
      
      <ConversationHistory
        visible={conversationsVisible}
        onClose={() => setConversationsVisible(false)}
        onSelectConversation={handleConversationSelect}
        currentConversationId={currentConversationId}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  logo: {
    width: 36,
    borderRadius: 100,
    height: 36,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numinaText: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -1.5,
    fontFamily: 'CrimsonPro_700Bold',
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent', // Default transparent background
    // Web-compatible shadows (no white box glitch)
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 2,
      elevation: 3,
    }),
  },
});