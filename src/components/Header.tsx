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
  style?: any;
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
  style,
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
  const [menuButtonDisabled, setMenuButtonDisabled] = useState(false);
  
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;
  const conversationsButtonScale = useRef(new Animated.Value(1)).current;
  const brainButtonScale = useRef(new Animated.Value(1)).current;
  const visibilityAnim = useRef(new Animated.Value(1)).current;
  
  // Border color animations
  const backButtonBorderColor = useRef(new Animated.Value(0)).current;
  const conversationsButtonBorderColor = useRef(new Animated.Value(0)).current;
  const menuButtonBorderColor = useRef(new Animated.Value(0)).current;
  const brainButtonBorderColor = useRef(new Animated.Value(0)).current;
  
  // Shadow animations
  const backButtonShadow = useRef(new Animated.Value(0)).current;
  const conversationsButtonShadow = useRef(new Animated.Value(0)).current;
  const menuButtonShadow = useRef(new Animated.Value(0)).current;
  const brainButtonShadow = useRef(new Animated.Value(0)).current;

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
    
    Animated.parallel([
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
      ]),
      Animated.sequence([
        Animated.timing(backButtonBorderColor, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(backButtonBorderColor, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(backButtonShadow, {
          toValue: 1,
          duration: 50,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(backButtonShadow, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
    
    setBackArrowPressed(true);
    
    setTimeout(() => {
      setBackArrowPressed(false);
      if (onBackPress) onBackPress();
    }, 150);
  };

  const handleMenuButtonPress = (event: any) => {
    if (menuButtonDisabled) {
      return;
    }
    
    setMenuButtonDisabled(true);
    
    setTimeout(() => {
      setMenuButtonDisabled(false);
    }, 500);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
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
      ]),
      Animated.sequence([
        Animated.timing(menuButtonBorderColor, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(menuButtonBorderColor, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(menuButtonShadow, {
          toValue: 1,
          duration: 50,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(menuButtonShadow, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start();

    // Toggle menu visibility immediately
    if (menuVisible) {
      setMenuVisible(false);
    } else {
      // Set menu visible immediately, then measure for position
      setMenuVisible(true);
      event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setMenuButtonPosition({ x: pageX, y: pageY, width, height });
      });
    }
  };

  const handleConversationsButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.sequence([
        Animated.timing(conversationsButtonBorderColor, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(conversationsButtonBorderColor, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(conversationsButtonShadow, {
          toValue: 1,
          duration: 50,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(conversationsButtonShadow, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
    
    setConversationsPressed(true);
    
    setTimeout(() => {
      setConversationsPressed(false);
      setConversationsVisible(true);
    }, 150);
  };

  const handleBrainButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
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
      ]),
      Animated.sequence([
        Animated.timing(brainButtonBorderColor, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(brainButtonBorderColor, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(brainButtonShadow, {
          toValue: 1,
          duration: 50,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(brainButtonShadow, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
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

  // Interpolated border colors
  const backButtonBorder = backButtonBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
      '#87CEEB' // Light blue
    ],
  });

  const conversationsButtonBorder = conversationsButtonBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
      '#87CEEB' // Light blue
    ],
  });

  const menuButtonBorder = menuButtonBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
      '#87CEEB' // Light blue
    ],
  });

  const brainButtonBorder = brainButtonBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
      '#87CEEB' // Light blue
    ],
  });

  // Interpolated shadow properties
  const backButtonShadowRadius = backButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 8],
  });

  const backButtonShadowOpacity = backButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? 0.2 : 0.08, 0.4],
  });

  const conversationsButtonShadowRadius = conversationsButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 8],
  });

  const conversationsButtonShadowOpacity = conversationsButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? 0.2 : 0.08, 0.4],
  });

  const menuButtonShadowRadius = menuButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 8],
  });

  const menuButtonShadowOpacity = menuButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? 0.2 : 0.08, 0.4],
  });

  const brainButtonShadowRadius = brainButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [1.5, 8],
  });

  const brainButtonShadowOpacity = brainButtonShadow.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? 0.2 : 0.08, 0.4],
  });

  const headerContent = (
    <BlurView
      intensity={isDarkMode ? 15 : 1}
      tint={isDarkMode ? 'dark' : 'light'}
      style={[
        styles.blurContainer,
        {
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.3)',
          backgroundColor: isDarkMode ? 'rgb(9, 9, 9)' : 'rgb(255, 255, 255)',
          shadowColor: isDarkMode ? 'transparent' : '#000000',
          shadowOffset: isDarkMode ? { width: 0, height: 0 } : { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0 : 0.1,
          shadowRadius: isDarkMode ? 0 : 4,
          elevation: isDarkMode ? 0 : 3,
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
                  <Animated.View
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: 'transparent',
                        shadowColor: '#87CEEB',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: backButtonShadowOpacity,
                        shadowRadius: backButtonShadowRadius,
                        elevation: 1,
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                      onPress={handleBackArrowPress}
                      activeOpacity={0.8}
                    >
                      <AnimatedBackArrow
                        color={isDarkMode ? '#87ebde' : '#00d4ff'}
                        size={16}
                        isPressed={backArrowPressed}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}

              {showConversationsButton && (
                <Animated.View style={{ transform: [{ scale: conversationsButtonScale }] }}>
                  <Animated.View
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: 'transparent',
                        shadowColor: '#87CEEB',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: conversationsButtonShadowOpacity,
                        shadowRadius: conversationsButtonShadowRadius,
                        elevation: 1,
                        marginLeft: showBackButton ? 8 : 0,
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                      onPress={handleConversationsButtonPress}
                      activeOpacity={0.8}
                    >
                      <AnimatedConversationsIcon
                        color={isDarkMode ? '#b4a7d6' : '#a78bfa'}
                        size={16}
                        isPressed={conversationsPressed}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}

              {showQuickAnalyticsButton && (
                <Animated.View style={{ transform: [{ scale: brainButtonScale }] }}>
                  <Animated.View
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: 'transparent',
                        shadowColor: '#87CEEB',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: brainButtonShadowOpacity,
                        shadowRadius: brainButtonShadowRadius,
                        elevation: 1,
                        marginLeft: (showBackButton || showConversationsButton) ? 8 : 0,
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                      onPress={handleBrainButtonPress}
                      activeOpacity={0.8}
                    >
                      <FontAwesome5
                        name="chart-line"
                        size={16}
                        color={isDarkMode ? '#ff9ff3' : '#ec4899'}
                        style={{
                          opacity: brainPressed ? 0.7 : 1,
                        }}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                </Animated.View>
              )}

              {showMenuButton && (
                <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
                  <Animated.View
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: 'transparent',
                        shadowColor: '#87CEEB',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: menuButtonShadowOpacity,
                        shadowRadius: menuButtonShadowRadius,
                        elevation: 1,
                        marginLeft: (showBackButton || showConversationsButton || showQuickAnalyticsButton) ? 8 : 0,
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                      onPress={handleMenuButtonPress}
                      activeOpacity={0.8}
                    >
                      <AnimatedHamburger
                        isOpen={menuVisible}
                        color={isDarkMode ? '#98fb98' : '#22c55e'}
                        size={16}
                      />
                    </TouchableOpacity>
                  </Animated.View>
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
          style,
        ]}
      >
        {!isVisible && onRestoreHeader ? (
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={onRestoreHeader}
          >
            <BlurView
                intensity={isDarkMode ? 15 : 1}
                tint={isDarkMode ? 'dark' : 'light'}
                style={[
                  styles.blurContainer,
                  {
                    borderWidth: 1,
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.02)' : 'rgb(255, 255, 255)',
                    shadowColor: isDarkMode ? 'transparent' : '#000000',
                    shadowOffset: isDarkMode ? { width: 0, height: 0 } : { width: 0, height: 2 },
                    shadowOpacity: isDarkMode ? 0 : 0.1,
                    shadowRadius: isDarkMode ? 0 : 4,
                    elevation: isDarkMode ? 0 : 3,
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
                          <Animated.View
                            style={[
                              styles.iconButton,
                              {
                                backgroundColor: 'transparent',
                                shadowColor: '#87CEEB',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: backButtonShadowOpacity,
                                shadowRadius: backButtonShadowRadius,
                                elevation: 1,
                              }
                            ]}
                          >
                            <TouchableOpacity
                              style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                              onPress={handleBackArrowPress}
                              activeOpacity={0.8}
                            >
                              <AnimatedBackArrow
                                color={isDarkMode ? '#87ebde' : '#00d4ff'}
                                size={16}
                                isPressed={backArrowPressed}
                              />
                            </TouchableOpacity>
                          </Animated.View>
                        </Animated.View>
                      )}

                      {showConversationsButton && (
                        <Animated.View style={{ transform: [{ scale: conversationsButtonScale }] }}>
                          <Animated.View
                            style={[
                              styles.iconButton,
                              {
                                backgroundColor: 'transparent',
                                shadowColor: '#87CEEB',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: conversationsButtonShadowOpacity,
                                shadowRadius: conversationsButtonShadowRadius,
                                elevation: 1,
                                marginLeft: showBackButton ? 8 : 0,
                              }
                            ]}
                          >
                            <TouchableOpacity
                              style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                              onPress={handleConversationsButtonPress}
                              activeOpacity={0.8}
                            >
                              <AnimatedConversationsIcon
                                color={isDarkMode ? '#b4a7d6' : '#a78bfa'}
                                size={16}
                                isPressed={conversationsPressed}
                              />
                            </TouchableOpacity>
                          </Animated.View>
                        </Animated.View>
                      )}

                      {showQuickAnalyticsButton && (
                        <Animated.View style={{ transform: [{ scale: brainButtonScale }] }}>
                          <Animated.View
                            style={[
                              styles.iconButton,
                              {
                                backgroundColor: 'transparent',
                                shadowColor: '#87CEEB',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: brainButtonShadowOpacity,
                                shadowRadius: brainButtonShadowRadius,
                                elevation: 1,
                                marginLeft: (showBackButton || showConversationsButton) ? 8 : 0,
                              }
                            ]}
                          >
                            <TouchableOpacity
                              style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                              onPress={handleBrainButtonPress}
                              activeOpacity={0.8}
                            >
                              <FontAwesome5
                                name="chart-line"
                                size={16}
                                color={isDarkMode ? '#ff9ff3' : '#ec4899'}
                                style={{
                                  opacity: brainPressed ? 0.7 : 1,
                                }}
                              />
                            </TouchableOpacity>
                          </Animated.View>
                        </Animated.View>
                      )}

                      {showMenuButton && (
                        <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
                          <Animated.View
                            style={[
                              styles.iconButton,
                              {
                                backgroundColor: 'transparent',
                                shadowColor: '#87CEEB',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: menuButtonShadowOpacity,
                                shadowRadius: menuButtonShadowRadius,
                                elevation: 1,
                                marginLeft: (showBackButton || showConversationsButton || showQuickAnalyticsButton) ? 8 : 0,
                              }
                            ]}
                          >
                            <TouchableOpacity
                              style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                              onPress={handleMenuButtonPress}
                              activeOpacity={0.8}
                            >
                              <AnimatedHamburger
                                isOpen={menuVisible}
                                color={isDarkMode ? '#98fb98' : '#22c55e'}
                                size={16}
                              />
                            </TouchableOpacity>
                          </Animated.View>
                        </Animated.View>
                      )}
                    </View>
                </View>
              </BlurView>
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
    backgroundColor: 'transparent',
    borderRadius: 12,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
});