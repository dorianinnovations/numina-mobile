import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { PageBackground } from '../ui/PageBackground';
import { NuminaColors } from '../../utils/colors';

const { width, height } = Dimensions.get('window');

interface ExperienceLevelSelectorProps {
  onSelectionComplete: (level: 'private' | 'personal' | 'cloud_find_beta') => void;
  onSignUp: () => void;
  onSignIn: () => void;
  onSkip?: () => void;
}

type ExperienceLevel = 'private' | 'personal';

interface LevelOption {
  id: ExperienceLevel;
  title: string;
  description: string;
  color: string;
}

const EXPERIENCE_LEVELS: LevelOption[] = [
  {
    id: 'private',
    title: 'Lockdown',
    description: 'Keep personal data fully private ',
    color: '#FFD99F',
  },
  {
    id: 'personal',
    title: 'Cloud',
    description: 'Sync to cloud, access Discover, Find, and more with provacy protection still in place',
    color: '#B0E3C8',
  },
];

export const ExperienceLevelSelector: React.FC<ExperienceLevelSelectorProps> = ({
  onSelectionComplete,
  onSignUp,
  onSignIn,
  onSkip,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Pastel RGB moving glow animation
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start continuous RGB glow animation
    Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false, // Can't use native driver for color interpolation
      })
    ).start();
  }, []);

  const handleLevelSelect = (level: ExperienceLevel) => {
    setSelectedLevel(level);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleContinue = () => {
    if (selectedLevel) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onSelectionComplete(selectedLevel);
    }
  };

  // Create animated pastel RGB glow
  const getGlowColor = () => {
    return glowAnim.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [
        'rgba(255, 182, 193, 0.3)', // Pastel pink
        'rgba(173, 216, 230, 0.3)', // Pastel blue  
        'rgba(144, 238, 144, 0.3)', // Pastel green
        'rgba(255, 182, 193, 0.3)', // Back to pastel pink
      ],
    });
  };

  return (
    <View style={styles.container}>
      <PageBackground>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text
              style={[
                styles.title,
                isDarkMode
                  ? { color: '#fff', textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 }
                  : { color: '#1a1a1abf', textShadowColor: 'rgba(0,0,0,0.04)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }
              ]}
            >
              Welcome
            </Text>
            <Text style={[styles.subtitle, { color: isDarkMode ? '#ffffff' : '#1a1a1a7a' }]}>Choose your experience level</Text>
          </Animated.View>
          <Animated.View 
            style={[
              styles.optionsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {EXPERIENCE_LEVELS.map((option, index) => (
              <Animated.View key={option.id} style={[
                styles.optionCardContainer,
                {
                  shadowColor: getGlowColor(),
                  shadowRadius: 3,
                  shadowOpacity: 1,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 10,
                }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.optionCard,
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
                  onPress={() => handleLevelSelect(option.id)}
                  activeOpacity={0.8}
                >
                <BlurView 
                  intensity={isDarkMode ? 15 : 30}
                  style={styles.cardBlur}
                  tint={isDarkMode ? 'dark' : 'light'}
                >
                  <View style={styles.cardContent}>
                    <Text style={[
                      styles.optionTitle,
                      { 
                        color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[500],
                        fontWeight: selectedLevel === option.id ? '700' : '600'
                      }
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                </BlurView>
              </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
          <Animated.View 
            style={[
              styles.authButtonsContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.authButton,
                styles.signInButton,
                { 
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                }
              ]}
              onPress={onSignIn}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.authButtonText,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : '#1a1a1abf' }
              ]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.authButton,
                styles.signUpButton,
                { 
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: selectedLevel ? EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.color : 'transparent',
                  borderWidth: selectedLevel ? 2 : 0
                }
              ]}
              onPress={onSignUp}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.authButtonText,
                { color: isDarkMode ? '#fff' : '#1a1a1abf' }
              ]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </Animated.View>
          {onSkip && (
            <Animated.View 
              style={[
                styles.skipContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={[styles.skipText, { color: isDarkMode ? '#888' : '#666' }]}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>
      </PageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    
    paddingTop: height * 0.05,
    paddingBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Nunito_400Regular',
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 10,
  },
  optionCardContainer: {
    borderRadius: 12,
  },
  optionCard: {
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardBlur: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  optionTitle: {
    fontSize: 20,
    marginBottom: 4,
    letterSpacing: -0.3,
    fontFamily: 'Nunito_700Bold',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  continueContainer: {
    paddingVertical: 20,
  },
  continueButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  authButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  authButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signUpButton: {},
  signInButton: {},
  authButtonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: -0.2,
  },
  skipContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '400',
  },
});

export default ExperienceLevelSelector;