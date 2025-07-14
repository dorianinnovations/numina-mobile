import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { NuminaColors } from '../utils/colors';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSelector } from './ThemeSelector';

const { width: screenWidth } = Dimensions.get('window');

const getMenuActions = (isDarkMode: boolean) => [
  { icon: <MaterialCommunityIcons name="chat-outline" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Chat', key: 'chat' },
  { icon: <MaterialCommunityIcons name="account-group" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Sentiment', key: 'sentiment' },
  { icon: <Feather name="bar-chart-2" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Analytics', key: 'analytics' },
  { icon: <Feather name="cloud" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Cloud', key: 'cloud' },
  { icon: <MaterialCommunityIcons name="earth" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Stratosphere', key: 'stratosphere' },
  { icon: <Feather name="user" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Profile', key: 'profile' },
  { icon: <Feather name="settings" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Settings', key: 'settings' },
  { icon: <Feather name="info" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'About', key: 'about' },
  { icon: <FontAwesome5 name="sign-out-alt" size={16} color={isDarkMode ? "#fff" : NuminaColors.darkMode[600]} />, label: 'Sign Out', key: 'signout' },
];

interface HeaderMenuProps {
  visible: boolean;
  onClose: () => void;
  onAction: (key: string) => void;
  menuButtonPosition?: { x: number; y: number; width: number; height: number };
}

export const HeaderMenu: React.FC<HeaderMenuProps> = ({ 
  visible, 
  onClose, 
  onAction, 
  menuButtonPosition 
}) => {
  const { isDarkMode } = useTheme();
  const menuActions = getMenuActions(isDarkMode);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const textAnimations = useRef<Animated.Value[]>(menuActions.map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    if (visible) {
      // Fast container animation with no bounce
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Sequential text fade animations
        const textAnimationsArray = menuActions.map((_, index) => 
          Animated.timing(textAnimations[index], {
            toValue: 1,
            duration: 97,
            delay: index * 60,
            easing: Easing.out(Easing.sin),
            useNativeDriver: true,
          })
        );
        Animated.parallel(textAnimationsArray).start();
      });
    } else {
      // Fast exit
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 40,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 40,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -20,
          duration: 40,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        ...textAnimations.map(anim => 
          Animated.timing(anim, {
            toValue: 0,
            duration: 40,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [visible]);

  // Double haptic feedback function
  const triggerDoubleHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 50); // 50ms delay for quick succession
  };

  // Handle menu button press with double haptic
  const handleMenuButtonPress = (actionKey: string) => {
    triggerDoubleHaptic();
    onAction(actionKey);
  };

  if (!visible) return null;

  // Calculate position based on menu button
  const menuWidth = 280;
  const menuHeight = 280;
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
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: opacityAnim,
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)',
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
            backgroundColor: isDarkMode ? '#191919' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDarkMode ? '#23272b' : 'rgba(255, 255, 255, 0.9)',
            shadowColor: isDarkMode ? '#000' : '#000',
            shadowOffset: { width: 0, height: isDarkMode ? 8 : 12 },
            shadowOpacity: isDarkMode ? 0.25 : 0.3,
            shadowRadius: isDarkMode ? 24 : 32,
            elevation: isDarkMode ? 16 : 20,
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
            borderBottomColor: isDarkMode ? '#1f1f1f' : 'rgba(255, 255, 255, 0.98)',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
          }
        ]} />
        
        <View style={styles.menuContent}>
          
          {menuActions.map((action, index) => (
            <TouchableOpacity
              key={action.key}
              style={[
                styles.menuButton,
                {
                  backgroundColor: isDarkMode 
                    ? 'rgba(255,255,255,0.03)' 
                    : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDarkMode 
                    ? '#23272b' 
                    : 'rgba(0, 0, 0, 0.05)',
                }
              ]}
              onPress={() => handleMenuButtonPress(action.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>{action.icon}</View>
              <Animated.Text style={[
                styles.menuButtonText,
                { 
                  color: isDarkMode ? '#fff' : NuminaColors.darkMode[600],
                  opacity: textAnimations[index],
                }
              ]}>{action.label}</Animated.Text>
            </TouchableOpacity>
          ))}
          
          {/* Theme Selector */}
          <View style={[
            styles.themeSelectorContainer,
            {
              borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            }
          ]}>
            <ThemeSelector />
          </View>
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
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    zIndex: 1001,
  },
  arrow: {
    position: 'absolute',
    top: -8,
    right: 12,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderStyle: 'solid',
  },
  menuContent: {
    paddingTop: 32, 
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
    fontFamily: 'Inter_500Medium',
  },

  themeSelectorContainer: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
}); 