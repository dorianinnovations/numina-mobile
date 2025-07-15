import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { ScreenTransitions } from '../utils/animations';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';

const { width, height } = Dimensions.get('window');

// Import your character images
const numinaSmileImage = require('../assets/images/numinasmile.png');
const numinaMoonImage = require('../assets/images/numinamoonface.png');

interface HeroLandingScreenProps {
  onNavigateToTutorial: () => void;
  onNavigateToLogin: () => void;
}

export const HeroLandingScreen: React.FC<HeroLandingScreenProps> = ({
  onNavigateToTutorial,
  onNavigateToLogin,
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const characterOpacity = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const primaryButtonScale = useRef(new Animated.Value(1)).current;
  const secondaryButtonScale = useRef(new Animated.Value(1)).current;
  const primaryButtonOpacity = useRef(new Animated.Value(1)).current;
  const secondaryButtonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(characterOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const handleToggleDarkMode = () => {
    // Animate character change when toggling theme
    Animated.sequence([
      Animated.timing(characterOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start(() => {
      toggleTheme();
      rotateAnim.setValue(0);
      Animated.timing(characterOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });
  };

  const handlePrimaryButtonPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(primaryButtonScale, {
          toValue: 0.92,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(primaryButtonOpacity, {
          toValue: 0.7,
          duration: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(primaryButtonScale, {
          toValue: 1.05,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(primaryButtonOpacity, {
          toValue: 0.9,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(primaryButtonScale, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(primaryButtonOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Add exit animation before navigation
      ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
        onNavigateToTutorial();
      });
    });
  };

  const handleSecondaryButtonPress = () => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(secondaryButtonScale, {
          toValue: 0.92,
          duration: 40,
          useNativeDriver: true,
        }),
        Animated.timing(secondaryButtonOpacity, {
          toValue: 0.7,
          duration: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(secondaryButtonScale, {
          toValue: 1.05,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(secondaryButtonOpacity, {
          toValue: 0.9,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(secondaryButtonScale, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(secondaryButtonOpacity, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Add exit animation before navigation
      ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
        onNavigateToLogin();
      });
    });
  };

  const iconRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
      
      {/* Dark mode overlay effect */}
      {isDarkMode && (
        <View style={styles.darkModeOverlay}>
        </View>
      )}

      {/* Header */}
      <Header 
        title="Numina"
        showMenuButton={true}
        onMenuPress={(key: string) => handleToggleDarkMode()}
        onTitlePress={() => {
          // Already on Hero screen - could scroll to top or refresh animations
          console.log('Numina title pressed on Hero screen');
        }}
      />

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Welcome Text */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={[styles.welcomeText, { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[600] }]}>
            <Text style={{ color: isDarkMode ? '#87CEEB' : '#0099ff' }}>Search</Text>, <Text style={{ color: isDarkMode ? '#B0E0E6' : '#9f75ff' }}>connect</Text>, <Text style={{ color: isDarkMode ? '#ADD8E6' : '#ffb172' }}>experience</Text>.
          </Text>
            <Text style={[
              styles.brandText,
              { 
                color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[500],
                fontSize: 68,
                fontWeight: 'bold',
                fontFamily: 'CrimsonPro_700Bold',
                letterSpacing: -4.5,
                textAlign: 'center',
                marginTop: 8,
                marginBottom: 8,
              }
            ]}>Numina</Text>
        </Animated.View>

    

        {/* Action Buttons - styled exactly like your web version */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Explore Numina Button */}
          <Animated.View style={{ transform: [{ scale: primaryButtonScale }], opacity: primaryButtonOpacity }}>
            <TouchableOpacity
              style={styles.primaryButtonContainer}
              onPress={handlePrimaryButtonPress}
              activeOpacity={1}
            >
              <View
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: isDarkMode 
                      ? '#2a2a2a'
                      : 'rgba(255,255,255,0.9)',
                    borderColor: isDarkMode 
                      ? '#343333'
                      : 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={[
                  styles.primaryButtonText, 
                  { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[500] }
                ]}>
                  Explore Numina
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up / Log In Button */}
          <Animated.View style={{ transform: [{ scale: secondaryButtonScale }], opacity: secondaryButtonOpacity }}>
            <TouchableOpacity
              style={styles.primaryButtonContainer}
              onPress={handleSecondaryButtonPress}
              activeOpacity={1}
            >
              <View
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: isDarkMode 
                      ? '#2a2a2a'
                      : 'rgba(255,255,255,0.9)',
                    borderColor: isDarkMode 
                      ? '#343333'
                      : 'rgba(255, 255, 255, 0.7)',
                    borderWidth: 1,
                  }
                ]}
              >
                <Text style={[
                  styles.primaryButtonText, 
                  { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[500] }
                ]}>
                  Sign Up / Log In
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      </Animated.View>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkModeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
 

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  titleContainer: {
    maxWidth: width * 0.9,
    marginBottom: 48,
  },
  welcomeText: {
    fontSize: width < 350 ? 10 : width < 400 ? 14 : 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: width < 350 ? 14 : width < 400 ? 16 : 17,
    letterSpacing: -1.2,
    opacity: 0.8,  
    paddingHorizontal: 24,
    fontFamily: 'Nunito_400Regular',
  },
  brandText: {
    fontSize: width < 350 ? 42 : width < 400 ? 48 : 54,
    fontWeight: 'bold',
    fontFamily: 'CrimsonPro_700Bold',
    letterSpacing: -4.5,
    textAlign: 'center',
    marginTop: 12,
  },
  characterContainer: {
    marginBottom: 64,
    position: 'relative',
  },
  characterImage: {
    width: width < 350 ? 60 : width < 400 ? 70 : 80,
    height: width < 350 ? 60 : width < 400 ? 70 : 80,
    zIndex: 2,
  },

  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
  },
  primaryButtonContainer: {
    width: '100%',
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 9.2,
    paddingHorizontal: 100.4,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.5,
    fontFamily: 'Nunito_500Medium',
  },

});