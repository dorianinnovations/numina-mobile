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
  Platform,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';

const { width, height } = Dimensions.get('window');

// Import character images
const numinaSmileImage = require('../assets/images/numinasmile.png');
const numinaMoonImage = require('../assets/images/numinamoonface.png');

interface HeroLandingScreenProps {
  onNavigateToTutorial: () => void;
  onNavigateToSignIn: () => void;
  onNavigateToSignUp: () => void;
}

export const HeroLandingScreen: React.FC<HeroLandingScreenProps> = ({
  onNavigateToTutorial,
  onNavigateToSignIn,
  onNavigateToSignUp,
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  // Main content animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const characterOpacity = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Gentle staggered button animations
  const exploreButtonOpacity = useRef(new Animated.Value(0)).current;
  const exploreButtonY = useRef(new Animated.Value(16)).current;
  
  const signUpButtonOpacity = useRef(new Animated.Value(0)).current;
  const signUpButtonY = useRef(new Animated.Value(16)).current;
  
  const signInButtonOpacity = useRef(new Animated.Value(0)).current;
  const signInButtonY = useRef(new Animated.Value(16)).current;
  
  // Subtle title animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(12)).current;
  
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(16)).current;
  
  // Button press animations (kept separate)
  const exploreButtonPressScale = useRef(new Animated.Value(1)).current;
  const signUpButtonPressScale = useRef(new Animated.Value(1)).current;
  const signInButtonPressScale = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    // IMMEDIATE VISIBILITY FIX: Set all elements visible first, then animate
    fadeAnim.setValue(1);
    scaleAnim.setValue(1);
    slideAnim.setValue(0);
    titleOpacity.setValue(1);
    titleY.setValue(0);
    brandOpacity.setValue(1);
    brandY.setValue(0);
    exploreButtonOpacity.setValue(1);
    exploreButtonY.setValue(0);
    signUpButtonOpacity.setValue(1);
    signUpButtonY.setValue(0);
    signInButtonOpacity.setValue(1);
    signInButtonY.setValue(0);
    characterOpacity.setValue(1);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(titleY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      
      Animated.timing(characterOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      
      Animated.stagger(200, [
        Animated.parallel([
          Animated.timing(exploreButtonOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(exploreButtonY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        
        // Sign Up button
        Animated.parallel([
          Animated.timing(signUpButtonOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(signUpButtonY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        
        // Sign In button
        Animated.parallel([
          Animated.timing(signInButtonOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(signInButtonY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleToggleDarkMode = () => {
    // Animate character change when toggling theme
    Animated.sequence([
      Animated.timing(characterOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      toggleTheme();
      rotateAnim.setValue(0);
      Animated.timing(characterOpacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleExploreButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate immediately, run animation in background
    onNavigateToTutorial();
    Animated.sequence([
      Animated.timing(exploreButtonPressScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(exploreButtonPressScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSignUpButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate immediately, run animation in background
    onNavigateToSignUp();
    Animated.sequence([
      Animated.timing(signUpButtonPressScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(signUpButtonPressScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSignInButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate immediately, run animation in background
    onNavigateToSignIn();
    Animated.sequence([
      Animated.timing(signInButtonPressScale, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(signInButtonPressScale, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
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





      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        {/* Enhanced Welcome Text with Professional Animation */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [
                { translateY: titleY }
              ],
            },
          ]}
        >
          <Text style={[styles.welcomeText, { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[600] }]}>
            <Text style={{ color: isDarkMode ? '#87ebde' : '#0099ff' }}>Decode </Text><Text style={{ color: isDarkMode ? '#a3c3ff' : '#6999ff' }}>your</Text> <Text style={{ color: isDarkMode ? '#c6ade6' : '#7972ff' }}>patterns</Text>
          </Text>
          
          {/* Enhanced Brand Text Animation */}
          <Animated.Text 
            style={[
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
                opacity: brandOpacity,
                transform: [
                  { translateY: brandY }
                ],
              }
            ]}
          >
            Numina
          </Animated.Text>
        </Animated.View>

    

        {/* Action Buttons - Stacked vertically */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Explore Button */}
          <Animated.View 
            style={[
              styles.stackedButtonContainer,
              { 
                opacity: exploreButtonOpacity,
                transform: [
                  { scale: exploreButtonPressScale },
                  { translateY: exploreButtonY }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.primaryButtonContainer, {
                shadowColor: isDarkMode ? '#add5fa' : '#000',
                shadowOpacity: isDarkMode ? 0.3 : 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }]}
              onPress={handleExploreButtonPress}
              activeOpacity={0.9}
            >
                <View
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: isDarkMode 
                        ? '#9fb9ff'
                        : '#ffffff',
                      borderColor: isDarkMode 
                        ? '#333333'
                        : 'rgba(255, 255, 255, 0.7)',
                      borderWidth: 1,
                    }
                  ]}
                >
                  <Text style={[
                    styles.primaryButtonText, 
                    { color: isDarkMode ? NuminaColors.darkMode[600] : NuminaColors.darkMode[500] }
                  ]}>
                    Explore
                  </Text>
                </View>
              </TouchableOpacity>
          </Animated.View>

          {/* Create Account Button */}
          <Animated.View 
            style={[
              styles.stackedButtonContainer,
              { 
                opacity: signUpButtonOpacity,
                transform: [
                  { scale: signUpButtonPressScale },
                  { translateY: signUpButtonY }
                ]
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.primaryButtonContainer, {
                shadowColor: isDarkMode ? '#add5fa' : '#000',
                shadowOpacity: isDarkMode ? 0.25 : 0.12,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 5,
              }]}
                onPress={handleSignUpButtonPress}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: isDarkMode 
                        ? '#9fb9ff'
                        : '#ffffff',
                      borderColor: isDarkMode 
                        ? '#333333'
                        : 'rgba(255, 255, 255, 0.7)',
                      borderWidth: 1,
                    }
                  ]}
                >
                  <Text style={[
                    styles.primaryButtonText, 
                    { color: isDarkMode ? NuminaColors.darkMode[600] : NuminaColors.darkMode[500] }
                  ]}>
                    Create Account
                  </Text>
                </View>
              </TouchableOpacity>
          </Animated.View>

          {/* Sign In Link - Underneath */}
          <Animated.View 
            style={{ 
              opacity: signInButtonOpacity,
              transform: [
                { translateY: signInButtonY }
              ]
            }}
          >
            <TouchableOpacity
              style={styles.loginLink}
              onPress={handleSignInButtonPress}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.loginLinkText, 
                { color: isDarkMode ? '#999999' : '#666666' }
              ]}>
                Already have an account? Sign in
              </Text>
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1400 : '100%',
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
    paddingHorizontal: Platform.OS === 'web' ? 60 : 24,
    paddingVertical: Platform.OS === 'web' ? 80 : 40,  
  },
  titleContainer: {
    maxWidth: Platform.OS === 'web' ? 800 : width * 0.9, 
    marginBottom: Platform.OS === 'web' ? 60 : 48,       
  },
  welcomeText: {
    fontSize: Platform.OS === 'web' ? 18 : (width < 350 ? 10 : width < 400 ? 14 : 16), 
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 24 : (width < 350 ? 14 : width < 400 ? 16 : 17), 
    letterSpacing: -1.2,
    opacity: 0.8,  
    paddingHorizontal: Platform.OS === 'web' ? 40 : 24, 
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
    alignItems: 'center',
    gap: 12,
  },
  stackedButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  halfWidth: {
    width: '50%',
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
    height: 37,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.5,
    fontFamily: 'Nunito_500Medium',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.5,
    fontFamily: 'Nunito_400Regular',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginLink: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.3,
    fontFamily: 'Nunito_400Regular',
  },

});