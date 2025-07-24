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
  
  // Dark mode toggle animations
  const toggleScale = useRef(new Animated.Value(1)).current;
  const toggleGlow = useRef(new Animated.Value(0)).current;
  const toggleRotate = useRef(new Animated.Value(0)).current;
  
  // Debounce ref to prevent rapid toggling issues
  const toggleDebounceRef = useRef(false);


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
    // Prevent rapid toggling to avoid rendering issues (500ms rate limit)
    if (toggleDebounceRef.current) return;
    
    toggleDebounceRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Toggle theme immediately
    toggleTheme();
    
    // Run animations in parallel without blocking theme change
    Animated.parallel([
      // Button press effect
      Animated.sequence([
        Animated.timing(toggleScale, {
          toValue: 0.92,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(toggleScale, {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Glow effect
      Animated.sequence([
        Animated.timing(toggleGlow, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(toggleGlow, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Icon rotation
      Animated.timing(toggleRotate, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Character change animation
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
        Animated.timing(characterOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Reset animation values and allow next toggle
      toggleRotate.setValue(0);
      rotateAnim.setValue(0);
      
      // Release debounce after animations complete (500ms rate limit)
      setTimeout(() => {
        toggleDebounceRef.current = false;
      }, 500);
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

  const toggleIconRotation = toggleRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const toggleGlowOpacity = toggleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
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
        <View style={[styles.darkModeOverlay, { backgroundColor: '#0a0a0a' }]}>
        </View>
      )}

      {/* Dark Mode Toggle Button - Top Right */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={handleToggleDarkMode}
          activeOpacity={0.8}
          style={styles.toggleButton}
        >
          <Animated.View
            style={[
              styles.toggleButtonInner,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                borderColor: isDarkMode ? '#404040' : '#e0e0e0',
                transform: [{ scale: toggleScale }],
              },
            ]}
          >
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.toggleGlow,
                {
                  opacity: toggleGlowOpacity,
                  backgroundColor: isDarkMode ? '#87ebde' : '#0099ff',
                },
              ]}
            />
            
            {/* Icon */}
            <Animated.View
              style={{
                transform: [{ rotate: toggleIconRotation }],
              }}
            >
              <Feather
                name={isDarkMode ? 'sun' : 'moon'}
                size={18}
                color={isDarkMode ? '#87ebde' : '#0099ff'}
              />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>





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
              style={[
                styles.primaryButtonContainer,
                isDarkMode ? {
                  width: '88%',
                  shadowColor: 'rgba(139, 92, 246, 0.8)', // Soft purple glow
                  shadowOpacity: 0.4,
                  shadowRadius: 40,
                  shadowOffset: { width: 0, height: 0 },
                } : {
                  width: '88%',
                  shadowColor: '#1f2937',
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 15,
                },
              ]}
              onPress={handleExploreButtonPress}
              activeOpacity={0.9}
            >
              {/* Professional layered depth */}
              <View style={[
                styles.shadowLayerContainer,
                isDarkMode ? {
                  shadowColor: 'rgba(139, 92, 246, 0.6)', // Inner purple glow
                  shadowOpacity: 0.3,
                  shadowRadius: 25,
                  shadowOffset: { width: 0, height: 0 },
                } : {
                  shadowColor: '#374151',
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                }
              ]}>
                <View style={[
                  styles.innerShadowLayer,
                  isDarkMode ? {
                    shadowColor: 'rgba(139, 92, 246, 0.4)', // Innermost purple glow
                    shadowOpacity: 0.2,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 0 },
                  } : {
                    shadowColor: '#6b7280',
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }
                ]}>
                  <View
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                        borderColor: isDarkMode ? '#262626' : '#e5e7eb',
                        borderWidth: isDarkMode ? 1 : 0.5,
                        shadowColor: isDarkMode ? '#000000' : '#f9fafb',
                        shadowOpacity: isDarkMode ? 0.3 : 0.4,
                        shadowRadius: isDarkMode ? 6 : 3,
                        shadowOffset: { width: 0, height: isDarkMode ? 2 : 1 },
                        elevation: isDarkMode ? 6 : 3,
                      }
                    ]}
                  >
                    <Text style={[
                      styles.primaryButtonText, 
                      { 
                        color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[500],
                        textShadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                        textShadowOffset: { width: 0, height: isDarkMode ? 1 : -1 },
                        textShadowRadius: isDarkMode ? 2 : 1,
                      }
                    ]}>
                      Explore
                    </Text>
                  </View>
                </View>
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
              style={[
                styles.primaryButtonContainer,
                isDarkMode ? {
                  width: '88%',
                  shadowColor: 'rgba(6, 182, 212, 0.8)', // Vibrant blue-green glow
                  shadowOpacity: 0.4,
                  shadowRadius: 40,
                  shadowOffset: { width: 0, height: 0 },
                } : {
                  width: '88%',
                  shadowColor: '#1f2937',
                  shadowOpacity: 0.15,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 15,
                },
              ]}
                onPress={handleSignUpButtonPress}
                activeOpacity={0.9}
              >
              {/* Beautiful glowing layers */}
              <View style={[
                styles.shadowLayerContainer,
                isDarkMode ? {
                  shadowColor: 'rgba(6, 182, 212, 0.6)', // Middle blue-green glow
                  shadowOpacity: 0.3,
                  shadowRadius: 25,
                  shadowOffset: { width: 0, height: 0 },
                } : {
                  shadowColor: '#374151',
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                }
              ]}>
                <View style={[
                  styles.innerShadowLayer,
                  isDarkMode ? {
                    shadowColor: 'rgba(6, 182, 212, 0.4)', // Innermost blue-green glow
                    shadowOpacity: 0.2,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 0 },
                  } : {
                    shadowColor: '#6b7280',
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }
                ]}>
                  <View
                    style={[
                      styles.primaryButton,
                      {
                        backgroundColor: isDarkMode ? '#0f0f0f' : '#ffffff',
                        borderColor: isDarkMode ? 'rgba(85, 85, 85, 0.4)' : '#e5e7eb',
                        borderWidth: isDarkMode ? 1 : 0.5,
                        shadowColor: isDarkMode ? '#34d399' : '#f9fafb', // Green accent border glow
                        shadowOpacity: isDarkMode ? 0.1 : 0.4,
                        shadowRadius: isDarkMode ? 8 : 3,
                        shadowOffset: { width: 0, height: isDarkMode ? 2 : 1 },
                        elevation: isDarkMode ? 8 : 3,
                      }
                    ]}
                  >
                    <Text style={[
                      styles.primaryButtonText, 
                      { 
                        color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[500],
                        textShadowColor: isDarkMode ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.8)',
                        textShadowOffset: { width: 0, height: isDarkMode ? 1 : -1 },
                        textShadowRadius: isDarkMode ? 3 : 1,
                      }
                    ]}>
                      Create Account
                    </Text>
                  </View>
                </View>
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
  shadowLayerContainer: {
    width: '100%',
    borderRadius: 12,
  },
  innerShadowLayer: {
    width: '100%',
    borderRadius: 12,
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

  // Dark Mode Toggle Styles
  toggleContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    right: 20,
    zIndex: 1000,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Neumorphic shadows following app style guide
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  toggleGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 8,
    shadowColor: 'currentColor',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },

});