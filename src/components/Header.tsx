import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { HeaderMenu } from './HeaderMenu';
import { OptimizedImage } from './OptimizedImage';

const numinaLogo = require('../assets/images/happynumina.png');

interface HeaderProps {
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: (key: string) => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  showBackButton = false,
  showMenuButton = false,
  onBackPress,
  onMenuPress,
  title,
  subtitle,
}) => {
  const { isDarkMode } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuButtonPosition, setMenuButtonPosition] = useState({ x: 0, y: 0, width: 34, height: 34 });

  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const menuButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleMenuAction = (key: string) => {
    setMenuVisible(false);
    if (onMenuPress) onMenuPress(key);
  };

  const handleMenuButtonPress = (event: any) => {
    Animated.sequence([
      Animated.timing(menuButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(menuButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    event.target.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setMenuButtonPosition({ x: pageX, y: pageY, width, height });
      setMenuVisible(true);
    });
  };


  return (
    <>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: opacityAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <OptimizedImage 
              source={numinaLogo} 
              style={styles.logo}
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
          </View>
          
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
              style={[
                styles.iconButton,
                {
                  backgroundColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : '#ffffff',
                  borderColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(0, 0, 0, 0.1)',
                }
              ]}
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="arrow-left" 
                size={16} 
                color={isDarkMode ? '#ffffff' : '#586266eb'} 
              />
            </TouchableOpacity>
          )}

          {showMenuButton && (
            <Animated.View style={{ transform: [{ scale: menuButtonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : '#ffffff',
                    borderColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(0, 0, 0, 0.1)',
                    marginLeft: showBackButton ? 12 : 0,
                  }
                ]}
                onPress={handleMenuButtonPress}
                activeOpacity={0.7}
              >
                <FontAwesome5
                  name="bars"
                  size={16}
                  color={isDarkMode ? '#ffffff' : '#586266eb'}
                />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Animated.View>
      
      <HeaderMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
        menuButtonPosition={menuButtonPosition}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
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
    width: 40,
    borderRadius: 100,
    height: 40,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numinaText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1.5,
    fontFamily: 'Nunito_800ExtraBold',
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
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});