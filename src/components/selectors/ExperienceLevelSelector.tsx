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
    title: 'Just for me',
    description: 'Keep everything private and secure on your device',
    color: '#FFD99F',
  },
  {
    id: 'personal',
    title: 'Share & discover',
    description: 'Connect to the cloud for enhanced features while staying protected',
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Staggered load-in animations
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const optionsOpacity = useRef(new Animated.Value(0)).current;
  const instructionOpacity = useRef(new Animated.Value(0)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Pastel RGB moving glow animation
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered load-in sequence
    const animateSequence = () => {
      // Title first (200ms delay)
      setTimeout(() => {
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Options second (500ms delay)
      setTimeout(() => {
        Animated.timing(optionsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 500);

      // Instruction third (800ms delay)
      setTimeout(() => {
        Animated.timing(instructionOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 800);

      // Skip button last (1100ms delay)
      setTimeout(() => {
        Animated.timing(skipOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }, 1100);
    };

    animateSequence();
    
    // Set legacy animations for compatibility
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
    
    // Start continuous RGB glow animation with cleanup
    const glowAnimation = Animated.loop(
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false, // Can't use native driver for color interpolation
      })
    );
    glowAnimation.start();
    
    return () => {
      // Stop glow animation on unmount to prevent memory leaks
      glowAnimation.stop();
    };
  }, []);

  const handleLevelSelect = (level: ExperienceLevel) => {
    setSelectedLevel(level);
    setShowConfirmModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleConfirm = () => {
    if (selectedLevel) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      onSelectionComplete(selectedLevel);
    }
  };

  const handleCancel = () => {
    setSelectedLevel(null);
    setShowConfirmModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                opacity: titleOpacity,
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
              Let's get you started
            </Text>
            <Text style={[styles.subtitle, { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 26, 26, 0.7)' }]}>
              How would you like to use Numina?
            </Text>
          </Animated.View>
          <Animated.View 
            style={[
              styles.optionsContainer,
              {
                opacity: optionsOpacity,
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
                      backgroundColor: selectedLevel === option.id 
                        ? (isDarkMode ? '#1a1a2e' : '#f0f8ff')
                        : (isDarkMode ? '#0f0f0f' : '#ffffff'),
                      borderColor: selectedLevel === option.id 
                        ? option.color
                        : (isDarkMode ? '#262626' : '#e5e7eb'),
                      borderWidth: selectedLevel === option.id ? 2 : (isDarkMode ? 1 : 0.5),
                      shadowColor: selectedLevel === option.id 
                        ? option.color
                        : (isDarkMode ? '#000000' : '#f9fafb'),
                      shadowOpacity: selectedLevel === option.id ? 0.6 : (isDarkMode ? 0.3 : 0.4),
                      shadowRadius: selectedLevel === option.id ? 12 : (isDarkMode ? 6 : 3),
                      shadowOffset: { width: 0, height: selectedLevel === option.id ? 4 : (isDarkMode ? 2 : 1) },
                      elevation: selectedLevel === option.id ? 10 : (isDarkMode ? 6 : 3),
                      transform: selectedLevel === option.id ? [{ scale: 1.02 }] : [{ scale: 1 }],
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
                        color: selectedLevel === option.id 
                          ? option.color
                          : (isDarkMode ? '#ffffff' : NuminaColors.darkMode[500]),
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
              styles.instructionContainer,
              { opacity: instructionOpacity, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Text style={[
              styles.instructionText,
              { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }
            ]}>
              Choose your preferred experience
            </Text>
          </Animated.View>
          {onSkip && (
            <Animated.View 
              style={[
                styles.skipContainer,
                { opacity: skipOpacity, transform: [{ translateY: slideAnim }] }
              ]}
            >
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={[styles.skipText, { color: isDarkMode ? '#888' : '#666' }]}>
                  Maybe later
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>
      </PageBackground>
      
      {/* Confirmation Modal */}
      {showConfirmModal && selectedLevel && (
        <View style={styles.modalOverlay}>
          <View style={[
            styles.confirmModal,
            { backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff' }
          ]}>
            <Text style={[
              styles.modalTitle,
              { color: EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.color }
            ]}>
              {EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.title}
            </Text>
            <Text style={[
              styles.modalDescription,
              { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)' }
            ]}>
              {EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.description}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }
                ]}
                onPress={handleCancel}
              >
                <Text style={[
                  styles.modalButtonText,
                  { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }
                ]}>
                  Change
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.color }
                ]}
                onPress={handleConfirm}
              >
                <Text style={styles.modalButtonText}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    paddingTop: height * 0.08,
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Nunito_400Regular',
    paddingHorizontal: 20,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    gap: 16,
    paddingTop: 20,
  },
  optionCardContainer: {
    borderRadius: 12,
  },
  optionCard: {
    minHeight: 90,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBlur: {
    flex: 1,
    justifyContent: 'center',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  optionTitle: {
    fontSize: 18,
    marginBottom: 6,
    letterSpacing: -0.2,
    fontFamily: 'Nunito_700Bold',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular',
  },
  instructionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  instructionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Nunito_500Medium',
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
    paddingHorizontal: 16,
    marginBottom: 16,
    marginTop: 20,
  },
  authButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    paddingBottom: 30,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  confirmModal: {
    borderRadius: 16,
    padding: 24,
    minWidth: width * 0.8,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: '#ffffff',
  },
});

export default ExperienceLevelSelector;