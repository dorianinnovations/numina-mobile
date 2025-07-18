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
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';
import { Styling } from '../utils/styling';
import { TextStyles } from '../utils/fonts';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';


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
  
  const handleAppStorePress = () => {
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
        Linking.openURL('https://apps.apple.com/app/numina');
      });
    });
  };
  
  const handlePlayStorePress = () => {
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
        Linking.openURL('https://play.google.com/store/apps/details?id=com.numina');
      });
    });
  };

  return (
    <PageBackground>
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
          showAuthOptions={false}
          onBackPress={() => {
            onNavigateBack();
          }}
          onMenuPress={(key: string) => {}}
        />
      
      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
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
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.952)',
                  borderColor: isDarkMode ? '#23272b' : 'rgb(231, 231, 231)',
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
                  color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[500],
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
              Download the Numina mobile app to get started.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            {/* App Store Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: isDarkMode ? '#add5fa' : '#add5fa',
                    borderColor: isDarkMode ? '#add5fa' : 'rgb(238, 238, 238)',
                  }
                ]}
                onPress={handleAppStorePress}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <FontAwesome5 name="apple" size={16} color={isDarkMode ? '#000000' : '#ffffff'} />
                  <Text style={[
                    styles.primaryButtonText, 
                    { color: isDarkMode ? '#000000' : '#ffffff' }
                  ]}>
                    App Store
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Play Store Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255, 255, 255, 0.952)',
                    borderColor: isDarkMode ? '#23272b' : 'rgb(231, 231, 231)',
                  }
                ]}
                onPress={handlePlayStorePress}
                activeOpacity={0.7}
              >
                <View style={styles.buttonContent}>
                  <FontAwesome5 name="google-play" size={16} color={isDarkMode ? '#ffffff' : '#333333'} />
                  <Text style={[
                    styles.secondaryButtonText, 
                    { color: isDarkMode ? '#ffffff' : '#333333' }
                  ]}>
                    Play Store
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Small Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={onNavigateToSignIn}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.loginLinkText, 
                { color: isDarkMode ? '#999999' : '#666666' }
              ]}>
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </Animated.View>
      </SafeAreaView>
    </PageBackground>
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
    maxWidth: 400,
  },
  welcomeCard: {
    width: '100%',
    borderRadius: 16,
    padding: 40,
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
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#88c6ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.95,
    shadowRadius: 4,
  },
  characterImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'CrimsonPro_700Bold',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    width: '85%',
    fontFamily: 'Nunito_400Regular',
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
    fontFamily: 'Nunito_500Medium',
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
    fontFamily: 'Nunito_500Medium',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginLink: {
    marginTop: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.2,
    fontFamily: 'Nunito_400Regular',
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
    fontFamily: 'Nunito_500Medium',
  },

});