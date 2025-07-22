import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { NuminaColors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSelector } from './ThemeSelector';

const { width: screenWidth } = Dimensions.get('window');

const getAllMenuActions = (isDarkMode: boolean) => [
  { icon: <MaterialCommunityIcons name="chat-outline" size={16} color={isDarkMode ? "#87ebde" : "#00d4ff"} />, label: 'Chat', key: 'chat', requiresAuth: true },
  { icon: <Feather name="bar-chart-2" size={16} color={isDarkMode ? "#ff9ff3" : "#ec4899"} />, label: 'Analytics', key: 'analytics', requiresAuth: true },
  { icon: <Feather name="compass" size={16} color={isDarkMode ? "#b4a7d6" : "#a78bfa"} />, label: 'Discover', key: 'cloud', requiresAuth: true },
  { icon: <MaterialCommunityIcons name="credit-card-outline" size={16} color={isDarkMode ? "#98fb98" : "#22c55e"} />, label: 'Wallet', key: 'wallet', requiresAuth: true },
  { icon: <Feather name="user" size={16} color={isDarkMode ? "#ffd700" : "#f59e0b"} />, label: 'Profile', key: 'profile', requiresAuth: true },
  { icon: <Feather name="settings" size={16} color={isDarkMode ? "#ffa07a" : "#f97316"} />, label: 'Settings', key: 'settings', requiresAuth: false },
  { icon: <Feather name="info" size={16} color={isDarkMode ? "#dda0dd" : "#8b5cf6"} />, label: 'About', key: 'about', requiresAuth: false },
  { icon: <FontAwesome5 name="sign-out-alt" size={16} color={isDarkMode ? "#ff6b6b" : "#ef4444"} />, label: 'Sign Out', key: 'signout', requiresAuth: true },
];

const getMenuActions = (isDarkMode: boolean, showAuthOptions: boolean = true) => {
  const allActions = getAllMenuActions(isDarkMode);
  return showAuthOptions ? allActions : allActions.filter(action => !action.requiresAuth);
};

interface HeaderMenuProps {
  visible: boolean;
  onClose: () => void;
  onAction: (key: string) => void;
  menuButtonPosition?: { x: number; y: number; width: number; height: number };
  showAuthOptions?: boolean;
}

export const HeaderMenu: React.FC<HeaderMenuProps> = ({ 
  visible, 
  onClose, 
  onAction, 
  menuButtonPosition,
  showAuthOptions = true 
}) => {
  const { isDarkMode } = useTheme();
  const menuActions = getMenuActions(isDarkMode, showAuthOptions);
  
  // State to prevent multiple rapid presses
  const [isAnimating, setIsAnimating] = useState(false);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  
  // Main menu animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-8)).current;
  
  // Item stagger animations
  const itemAnims = useRef(menuActions.map(() => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(10),
    scale: new Animated.Value(0.9),
  }))).current;
  
  // Button press animations
  const buttonAnims = useRef(menuActions.map(() => ({
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
  }))).current;

  // Cleanup function to reset all animations
  const resetAnimations = useCallback(() => {
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    translateYAnim.setValue(-8);
    
    itemAnims.forEach(anim => {
      anim.opacity.setValue(0);
      anim.translateY.setValue(10);
      anim.scale.setValue(0.9);
    });
    
    buttonAnims.forEach(anim => {
      anim.scale.setValue(1);
      anim.opacity.setValue(1);
    });
    
    setIsAnimating(false);
    setPressedIndex(null);
  }, [scaleAnim, opacityAnim, translateYAnim, itemAnims, buttonAnims]);

  // Show animation
  const showMenu = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    resetAnimations();
    
    // Fast container animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Gentle ladder falling haptic sequence - each menu item gets softer haptic as it animates
      menuActions.forEach((_, index) => {
        setTimeout(() => {
          // Increasingly gentle haptics as we go down the ladder
          if (index < 3) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (index < 6) {
            Haptics.selectionAsync(); // Even softer for middle items
          } else {
            // Barely perceptible for last items - like feathers falling
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }, index * 25); // Slightly slower than animation for gentle trailing effect
      });
      
      // Faster staggered item animations
      const itemAnimations = itemAnims.map((anim, index) => 
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 100,
            delay: index * 15,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 100,
            delay: index * 15,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 100,
            delay: index * 15,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      
      Animated.stagger(15, itemAnimations).start(() => {
        setIsAnimating(false);
      });
    });
  }, [isAnimating, resetAnimations, scaleAnim, opacityAnim, translateYAnim, itemAnims]);

  // Hide animation
  const hideMenu = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Ultra-fast exit animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -8,
        duration: 100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      // Hide all items instantly
      ...itemAnims.map(anim => 
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      resetAnimations();
    });
  }, [isAnimating, scaleAnim, opacityAnim, translateYAnim, itemAnims, resetAnimations]);

  // Effect to handle visibility changes
  useEffect(() => {
    if (visible) {
      showMenu();
    } else {
      hideMenu();
    }
  }, [visible, showMenu, hideMenu]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAnimations();
    };
  }, [resetAnimations]);

      // Button press handler
  const handleMenuButtonPress = useCallback((actionKey: string, index: number) => {
    if (isAnimating || pressedIndex !== null) return;
    
    setPressedIndex(index);
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const scaleAnim = buttonAnims[index].scale;
    const opacityAnim = buttonAnims[index].opacity;
    
    // Fast press animation
    Animated.sequence([
      // Press down
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.96,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 60,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Release
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 80,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setPressedIndex(null);
      // Execute action immediately
      onAction(actionKey);
    });
  }, [isAnimating, pressedIndex, buttonAnims, onAction]);

  if (!visible) return null;

  // Calculate position based on menu button
  const menuWidth = 280;
  const rightMargin = 1;
  const topMargin = 80;
  
  const menuRight = rightMargin + 20;
  const menuTop = topMargin + 50;

  return (
    <View style={styles.overlay}>
      {/* Background overlay that handles dismissal */}
      <TouchableOpacity 
        style={styles.backgroundOverlay}
        activeOpacity={1} 
        onPress={onClose}
        disabled={isAnimating}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: opacityAnim,
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            }
          ]}
        />
      </TouchableOpacity>
      
      <Animated.View
        style={[
          styles.menuContainer,
          {
            position: 'absolute',
            top: menuTop,
            right: menuRight,
            width: menuWidth,
            backgroundColor: isDarkMode ? '#1a1a1a' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDarkMode ? '#333' : 'rgba(0, 0, 0, 0.1)',
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ],
          }
        ]}
      >
        {/* Arrow pointing to menu button */}
        <View style={[
          styles.arrow,
          {
            borderBottomColor: isDarkMode ? '#1a1a1a' : 'rgba(255, 255, 255, 0.98)',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
          }
        ]} />
        
        <View style={styles.menuContent}>
          {menuActions.map((action, index) => (
            <Animated.View
              key={action.key}
              style={[
                styles.menuButton,
                {
                  backgroundColor: isDarkMode 
                    ? (pressedIndex === index ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)') 
                    : (pressedIndex === index ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.03)'),
                  borderColor: isDarkMode 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0, 0, 0, 0.08)',
                  opacity: itemAnims[index].opacity,
                  transform: [
                    { translateY: itemAnims[index].translateY },
                    { scale: Animated.multiply(itemAnims[index].scale, buttonAnims[index].scale) },
                  ],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.buttonTouchable}
                onPress={() => handleMenuButtonPress(action.key, index)}
                activeOpacity={0.8}
                disabled={isAnimating || pressedIndex !== null}
              >
                <View style={styles.iconContainer}>
                  {action.icon}
                </View>
                <Text style={[
                  styles.menuButtonText,
                  { 
                    color: isDarkMode ? '#fff' : NuminaColors.darkMode[600],
                  }
                ]}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
          
          {/* Theme Selector */}
          <Animated.View 
            style={[
              styles.themeSelectorContainer,
              {
                borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                opacity: itemAnims[itemAnims.length - 1]?.opacity || 1,
              }
            ]}
          >
            <ThemeSelector />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  menuContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    zIndex: 1001,
    overflow: 'visible',
  },
  arrow: {
    position: 'absolute',
    top: -8,
    right: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderStyle: 'solid',
  },
  menuContent: {
    paddingTop: 8,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  buttonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 14,
  },
  menuButtonText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
    fontFamily: 'Inter_500Medium',
  },
  themeSelectorContainer: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
    paddingHorizontal: 8,
  },
});