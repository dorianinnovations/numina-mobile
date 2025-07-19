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
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useRefresh } from '../contexts/RefreshContext';
import { HeaderMenu } from './HeaderMenu';
import { AnimatedHamburger } from './AnimatedHamburger';
import { AnimatedBackArrow } from './AnimatedBackArrow';
import { AnimatedConversationsIcon } from './AnimatedConversationsIcon';
import { ConversationHistory } from './ConversationHistory';
import { AnimatedGradientBorder } from './AnimatedGradientBorder';

const numinaLogo = require('../assets/images/happynumina.png');

interface HeaderProps {
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showConversationsButton?: boolean;
  showQuickAnalyticsButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: (key: string) => void;
  onTitlePress?: () => void;
  onConversationSelect?: (conversation: any) => void;
  onStartNewChat?: () => void;
  onQuickAnalyticsPress?: () => void;
  currentConversationId?: string;
  title?: string;
  subtitle?: string;
  isVisible?: boolean;
  isStreaming?: boolean;
  onRestoreHeader?: () => void;
  showAuthOptions?: boolean;
  isRefreshing?: boolean;
  refreshAnimationSpeed?: number;
}

export const Header: React.FC<HeaderProps> = ({
  showBackButton = false,
  showMenuButton = false,
  showConversationsButton = false,
  showQuickAnalyticsButton = false,
  onBackPress,
  onMenuPress,
  onTitlePress,
  onConversationSelect,
  onStartNewChat,
  onQuickAnalyticsPress,
  currentConversationId,
  title,
  subtitle,
  isVisible = true,
  isStreaming = false,
  onRestoreHeader,
  showAuthOptions = true,
  isRefreshing = false,
  refreshAnimationSpeed = 2000,
}) => {
  const { isDarkMode } = useTheme();
  const { isRefreshing: globalRefreshing } = useRefresh();
  const [menuVisible, setMenuVisible] = useState(false);
  const [conversationsVisible, setConversationsVisible] = useState(false);
  const [menuButtonPosition, setMenuButtonPosition] = useState({ x: 0, y: 0, width: 34, height: 34 });
  const [backArrowPressed, setBackArrowPressed] = useState(false);
  const [conversationsPressed, setConversationsPressed] = useState(false);
  const [menuPressed, setMenuPressed] = useState(false);
  const [brainPressed, setBrainPressed] = useState(false);
  
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;
  const conversationsButtonScale = useRef(new Animated.Value(1)).current;
  const brainButtonScale = useRef(new Animated.Value(1)).current;
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

  }, [showQuickAnalyticsButton]);
  
  useEffect(() => {
    const targetOpacity = isVisible ? 1 : 0.3;
    
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(backButtonScale, {
        toValue: 0.97,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    
    setBackArrowPressed(true);
    
    setTimeout(() => {
      setBackArrowPressed(false);
      if (onBackPress) onBackPress();
    }, 150);
  };

  const handleMenuButtonPress = (event: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(menuButtonScale, {
        toValue: 0.97,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(menuButtonScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuButtonPosition({ x: pageX, y: pageY, width, height });
      setMenuVisible(true);
    });
  };

  const handleConversationsButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setConversationsPressed(true);
    
    setTimeout(() => {
      setConversationsPressed(false);
      setConversationsVisible(true);
    }, 150);
  };

  const handleBrainButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(brainButtonScale, {
        toValue: 0.97,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(brainButtonScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    
    setBrainPressed(true);
    
    setTimeout(() => {
      setBrainPressed(false);
      if (onQuickAnalyticsPress) onQuickAnalyticsPress();
    }, 150);
  };

  const handleConversationSelect = (conversation: any) => {
    if (onConversationSelect) {
      onConversationSelect(conversation);
    }
    setConversationsVisible(false);
  };

  const headerContent = (
    <AnimatedGradientBorder
      isActive={isRefreshing || globalRefreshing}
      borderRadius={12}
      borderWidth={1}
      animationSpeed={refreshAnimationSpeed}
      style={{ flex: 1 }}
    >
      <BlurView
        intensity={isDarkMode ? 40 : 60}
        tint={isDarkMode ? 'dark' : 'default'}
        style={[
          styles.blurContainer,
          {
            borderWidth: 0,
          },
        ]}
      >
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={styles.logoContainer}
            onPress={onTitlePress}
            activeOpacity={onTitlePress ? 0.7 : 1}
            disabled={!onTitlePress}
          >
            <Image 
              source={numinaLogo} 
              style={[
                styles.logo,
                {
                  opacity: isDarkMode ? 1 : 0.9,
                }
              ]}
              resizeMode="contain"
              fadeDuration={0}
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
                <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
                  <TouchableOpacity
                      style={[
                        styles.iconButton,
                        {
                          backgroundColor: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(255, 255, 255, 1)',
                          borderColor: isDarkMode 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(255, 255, 255, 0.6)',
                          shadowColor: '#000000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isDarkMode ? 0.2 : 0.08,
                          shadowRadius: 1.5,
                          elevation: 1,
                        }
                      ]}
                      onPress={handleBackArrowPress}
                      activeOpacity={0.8}
                    >
                      <AnimatedBackArrow
                        color={isDarkMode ? '#6ec5ff' : '#4a5568'}
                        size={16}
                        isPressed={backArrowPressed}
                      />
                    </TouchableOpacity>
                </Animated.View>
              )}

              {showConversationsButton && (
                <Animated.View style={{ transform: [{ scale: conversationsButtonScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(255, 255, 255, 1)',
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(255, 255, 255, 0.6)',
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDarkMode ? 0.2 : 0.08,
                        shadowRadius: 1.5,
                        elevation: 1,
                        marginLeft: showBackButton ? 12 : 0,
                      }
                    ]}
                    onPress={handleConversationsButtonPress}
                    activeOpacity={0.8}
                  >
                    <AnimatedConversationsIcon
                      color={isDarkMode ? '#6ec5ff' : '#4a5568'}
                      size={16}
                      isPressed={conversationsPressed}
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {showQuickAnalyticsButton && (
                <Animated.View style={{ transform: [{ scale: brainButtonScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(255, 255, 255, 1)',
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(255, 255, 255, 0.6)',
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDarkMode ? 0.2 : 0.08,
                        shadowRadius: 1.5,
                        elevation: 1,
                        marginLeft: (showBackButton || showConversationsButton) ? 12 : 0,
                      }
                    ]}
                    onPress={handleBrainButtonPress}
                    activeOpacity={0.8}
                  >
                    <FontAwesome5
                      name="chart-line"
                      size={16}
                      color={isDarkMode ? '#6ec5ff' : '#4a5568'}
                      style={{
                        opacity: brainPressed ? 0.7 : 1,
                      }}
                    />
                  </TouchableOpacity>
                </Animated.View>
              )}

              {showMenuButton && (
                <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(255, 255, 255, 1)',
                        borderColor: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.08)' 
                          : 'rgba(255, 255, 255, 0.6)',
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDarkMode ? 0.2 : 0.08,
                        shadowRadius: 1.5,
                        elevation: 1,
                        marginLeft: (showBackButton || showConversationsButton || showQuickAnalyticsButton) ? 12 : 0,
                      }
                    ]}
                    onPress={handleMenuButtonPress}
                    activeOpacity={0.8}
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
    </AnimatedGradientBorder>
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
            activeOpacity={0.8}
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
        onStartNewChat={onStartNewChat}
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
    width: 44,  // Larger touch target
    height: 44,
    borderRadius: 12,  // More rounded for modern look
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'transparent',
    // Better interaction feedback
    overflow: 'hidden',
  },
});