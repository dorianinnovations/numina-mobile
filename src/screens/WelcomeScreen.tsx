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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations, ScreenTransitions } from '../utils/animations';
import { Styling } from '../utils/styling';
import { TextStyles } from '../utils/fonts';
import { Header } from '../components/Header';
import { GradientBackground } from '../components/GradientBackground';


const { width, height } = Dimensions.get('window');

// Import the cloud character image
const happyNuminaImage = require('../assets/images/happynumina.png');

interface WelcomeScreenProps {
  onNavigateBack: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToSignIn: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateBack,
  onNavigateToSignUp,
  onNavigateToSignIn,
}) => {
  const { theme, isDarkMode } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const characterOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale1 = useRef(new Animated.Value(1)).current;
  const buttonScale2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simple entry animation
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start(() => {
      Animated.timing(characterOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    });
  }, []);
  
  const handleSignUpPress = () => {
    Animated.spring(buttonScale1, {
      toValue: 1.02,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start(() => {
      Animated.spring(buttonScale1, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }).start(() => {
        ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
          onNavigateToSignUp();
        });
      });
    });
  };
  
  const handleSignInPress = () => {
    Animated.spring(buttonScale2, {
      toValue: 1.02,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start(() => {
      Animated.spring(buttonScale2, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 8,
      }).start(() => {
        ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
          onNavigateToSignIn();
        });
      });
    });
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
      
        {/* Light mode gradient background */}
        {!isDarkMode && (
          <LinearGradient
            colors={[
              '#ffffff',  
              '#f0f8ff',  
              '#c2e2ff',  
              '#f5f8ff',  
              '#f0f4f8',  
            ]}
            style={styles.lightModeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
      
        {/* Header */}
        <Header 
          title="Numina"
          showBackButton={true}
          showMenuButton={true}
          onBackPress={() => {
            ScreenTransitions.fadeOutScale(fadeAnim, scaleAnim, () => {
              onNavigateBack();
            });
          }}
          onMenuPress={() => {}}
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
        {/* Neumorphic Welcome Card */}
        <View style={styles.welcomeWrapper}>
          <View style={[
            styles.welcomeCard, 
            isDarkMode ? {
              backgroundColor: '#111111',
              borderColor: '#222222',
            } : styles.glassmorphic
          ]}>
            
            {/* Header Section */}
          <View style={styles.header}>
            {/* Character Container */}
            <Animated.View
              style={[
                styles.characterContainer,
                {
                  opacity: characterOpacity,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[
                styles.characterFrame,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
                }
              ]}>
                <Image
                  source={happyNuminaImage}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.Text
              style={[
                TextStyles.h1,
                styles.title,
                {
                  color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[600],
                  letterSpacing: -1.2,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              Welcome to Numina
            </Animated.Text>

            <Text style={[
              TextStyles.reading,
              styles.subtitle, 
              { 
                color: isDarkMode ? '#999999' : NuminaColors.darkMode[400],
                letterSpacing: -0.4,
              }
            ]}>
              Create an account or sign in to explore the world of Numina.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Create Account Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: isDarkMode ? '#ffffff' : '#000000',
                  }
                ]}
                onPress={handleSignUpPress}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.primaryButtonText, 
                  { color: isDarkMode ? '#000000' : '#ffffff' }
                ]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isDarkMode ? '#23272b' : 'rgba(0, 0, 0, 0.05)',
                  }
                ]}
                onPress={handleSignInPress}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.secondaryButtonText, 
                  { color: isDarkMode ? '#ffffff' : '#333333' }
                ]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          </View>
        </View>
      </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightModeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  welcomeWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 380,
  },
  welcomeCard: {
    width: '100%',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  glassmorphic: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
    zIndex: 10,
  },
  characterContainer: {
    marginBottom: 24,
  },
  characterFrame: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  characterImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Nunito_700Bold',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    fontWeight: '400',
    width: '85%',
    fontFamily: 'Inter_400Regular',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    position: 'relative',
    zIndex: 10,
  },
  primaryButton: {
    width: '100%',
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: 'Inter_600SemiBold',
  },
  secondaryButton: {
    width: '100%',
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
    fontFamily: 'Inter_500Medium',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily: 'Inter_600SemiBold',
  },

});