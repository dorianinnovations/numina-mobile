import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { ScreenTransitions, NuminaAnimations, NuminaEasing } from '../utils/animations';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { OptimizedImage } from '../components/OptimizedImage';
import { imagePreloader } from '../utils/imagePreloader';

const { width, height } = Dimensions.get('window');

// Animation constants for consistency
const ANIMATION_TIMING = {
  QUICK: 200,
  NORMAL: 300,
  SLOW: 600,
  ENTRANCE: 800,
};

const EASING_PRESETS = {
  entrance: NuminaEasing.neumorphicEntrance,
  exit: NuminaEasing.neumorphicPress,
  smooth: NuminaEasing.smooth,
  bounce: NuminaEasing.neumorphicBounce,
};

// Import character images
const happyNuminaImage = require('../assets/images/happynumina.png');
const numinaContentImage = require('../assets/images/numinacontent.png');
const numinaShadesImage = require('../assets/images/numinashades.png');

// Preload all tutorial images
const tutorialImages = [happyNuminaImage, numinaContentImage, numinaShadesImage];

const tutorialSteps = [
  {
    id: 1,
    title: "Hi, I'm Numina",
    description: "I recognize shifts in your mood before you do. I track subtle changes in your emotions—even the ones you might miss. When something shifts, I surface it with just enough context to help you understand it before it affects your focus, your energy, or your decisions. Quiet. Consistent. Always here when it matters.",
    image: happyNuminaImage,
    character: "Intro Numina",
    features: [
      { text: "Track mood patterns", icon: "zap" },
      { text: "Behavior-based insight", icon: "bar-chart-2" },
      { text: "Signal, not noise", icon: "bell" }
    ],
    progress: { current: 1, total: 4 }
  },
  {
    id: 2,
    title: "Patience is my Job",
    description: "I don't ping you every morning. I patiently wait until I see something worth saying. When patterns emerge across your week, I deliver a focused emotional report — honest, grounded, and built from real signals that I identify.",
    image: happyNuminaImage,
    character: "Patient Numina",
    features: [
      { text: "Pattern-based insights", icon: "target" },
      { text: "Real signal reports", icon: "bar-chart-2" },
      { text: "Meaningful notifications", icon: "shield" }
    ],
    progress: { current: 2, total: 4 }
  },
  {
    id: 3,
    title: "Blips are our Link",
    description: "Blips are my pulses sent to you, well-timed check-ins that deepen your mood log without interrupting your flow.",
    image: numinaContentImage,
    character: "Gentle Numina",
    features: [
      { text: "Simple and concise", icon: "zap" },
      { text: "Randomized check-ins for added depth", icon: "clock" },
      { text: "Effortless emotion logging", icon: "heart" }
    ],
    progress: { current: 3, total: 4 }
  },
  {
    id: 4,
    title: "Chat",
    description: "Chat is where I turn signals into strategy. It's how I learn your context, help you reflect, and support your next move. You can log directly, talk it out, or switch modes anytime—whatever fits your mood.",
    image: numinaShadesImage,
    character: "Supportive Numina",
    features: [
      { text: "Insightful conversations", icon: "message-circle" },
      { text: "Personalized strategies", icon: "trending-up" },
      { text: "Flexible interaction", icon: "settings" },
      { text: "Critical support when you need it most", icon: "message-circle" }
    ],
    progress: { current: 4, total: 4 },
    interface: "chat"
  },
];

interface TutorialScreenProps {
  onNavigateHome: () => void;
  onStartChat: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({
  onNavigateHome,
  onStartChat,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Primary animation values - optimized set
  const masterFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(50)).current;
  const characterAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Feature animations - single value for staggered effect
  const featuresAnim = useRef(new Animated.Value(0)).current;
  
  // Navigation button animations
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;

  // Preload images on mount for instant loading
  useEffect(() => {
    imagePreloader.preloadImages(tutorialImages);
  }, []);

  // Optimized entrance animation
  useEffect(() => {
    const entranceSequence = Animated.sequence([
      // Initial fade and slide
      Animated.parallel([
        Animated.timing(masterFadeAnim, {
          toValue: 1,
          duration: ANIMATION_TIMING.ENTRANCE,
          useNativeDriver: true,
          easing: EASING_PRESETS.entrance,
        }),
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: ANIMATION_TIMING.ENTRANCE,
          useNativeDriver: true,
          easing: EASING_PRESETS.entrance,
        }),
      ]),
      
      // Character entrance with bounce
      Animated.timing(characterAnim, {
        toValue: 1,
        duration: ANIMATION_TIMING.SLOW,
        useNativeDriver: true,
        easing: EASING_PRESETS.bounce,
      }),
      
      // Features staggered entrance
      Animated.timing(featuresAnim, {
        toValue: 1,
        duration: ANIMATION_TIMING.SLOW,
        useNativeDriver: true,
        easing: EASING_PRESETS.smooth,
      }),
    ]);

    entranceSequence.start();

    // Progress bar animation (separate as it uses different interpolation)
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / tutorialSteps.length,
      duration: ANIMATION_TIMING.SLOW,
      useNativeDriver: false, // Width interpolation requires layout
      easing: EASING_PRESETS.smooth,
    }).start();

    return () => {
      entranceSequence.stop();
    };
  }, []);

  // Update progress when step changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / tutorialSteps.length,
      duration: ANIMATION_TIMING.NORMAL,
      useNativeDriver: false,
      easing: EASING_PRESETS.smooth,
    }).start();
  }, [currentStep]);

  // Optimized step transition animation
  const animateStepTransition = useCallback((direction: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    NuminaAnimations.haptic.light();

    const exitDistance = direction > 0 ? -50 : 50;
    const enterDistance = direction > 0 ? 50 : -50;

    const exitSequence = Animated.parallel([
      Animated.timing(characterAnim, {
        toValue: 0,
        duration: ANIMATION_TIMING.QUICK,
        useNativeDriver: true,
        easing: EASING_PRESETS.exit,
      }),
      Animated.timing(contentSlideAnim, {
        toValue: exitDistance,
        duration: ANIMATION_TIMING.NORMAL,
        useNativeDriver: true,
        easing: EASING_PRESETS.exit,
      }),
      Animated.timing(featuresAnim, {
        toValue: 0,
        duration: ANIMATION_TIMING.QUICK,
        useNativeDriver: true,
        easing: EASING_PRESETS.exit,
      }),
    ]);

    exitSequence.start(() => {
      // Update step
      setCurrentStep(prev => prev + direction);
      
      // Reset positions for entrance
      contentSlideAnim.setValue(enterDistance);
      characterAnim.setValue(0);
      featuresAnim.setValue(0);
      
      // Entrance sequence with staggered timing
      const entranceSequence = Animated.sequence([
        // Content slides in first
        Animated.timing(contentSlideAnim, {
          toValue: 0,
          duration: ANIMATION_TIMING.NORMAL,
          useNativeDriver: true,
          easing: EASING_PRESETS.entrance,
        }),
        
        // Character bounces in
        Animated.timing(characterAnim, {
          toValue: 1,
          duration: ANIMATION_TIMING.SLOW,
          useNativeDriver: true,
          easing: EASING_PRESETS.bounce,
        }),
      ]);

      // Features animate in parallel after character starts
      const featuresSequence = Animated.timing(featuresAnim, {
        toValue: 1,
        duration: ANIMATION_TIMING.SLOW,
        useNativeDriver: true,
        easing: EASING_PRESETS.smooth,
      });

      entranceSequence.start();
      
      // Start features animation with slight delay
      setTimeout(() => {
        featuresSequence.start(() => {
          setIsTransitioning(false);
        });
      }, ANIMATION_TIMING.QUICK);
    });
  }, [isTransitioning, currentStep]);

  // Enhanced button press animations
  const handleButtonPress = useCallback((button: 'prev' | 'next', action: () => void) => {
    const scaleAnim = button === 'prev' ? prevButtonScale : nextButtonScale;
    
    // Haptic feedback
    NuminaAnimations.haptic.medium();
    
    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
        easing: EASING_PRESETS.exit,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: EASING_PRESETS.bounce,
      }),
    ]).start();

    // Execute action with slight delay for better feel
    setTimeout(() => {
      action();
    }, 150);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1 && !isTransitioning) {
      animateStepTransition(1);
    }
  }, [currentStep, isTransitioning, animateStepTransition]);

  const prevStep = useCallback(() => {
    if (currentStep > 0 && !isTransitioning) {
      animateStepTransition(-1);
    }
  }, [currentStep, isTransitioning, animateStepTransition]);

  const handleFinishTutorial = useCallback(() => {
    NuminaAnimations.haptic.success();
    ScreenTransitions.fadeOutScale(masterFadeAnim, contentSlideAnim, () => {
      onStartChat();
    });
  }, [masterFadeAnim, contentSlideAnim, onStartChat]);

  const step = tutorialSteps[currentStep];

  // Animation interpolations
  const characterTransforms = {
    opacity: characterAnim,
    transform: [
      {
        scale: characterAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
      {
        translateY: characterAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
      <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
      
      {/* Header */}
      <Header 
        title="Numina"
        showBackButton={true}
        showMenuButton={true}
        onBackPress={() => {
          ScreenTransitions.fadeOutScale(masterFadeAnim, contentSlideAnim, () => {
            onNavigateHome();
          });
        }}
        onMenuPress={() => {}}
      />

      {/* Background Effects */}
      {isDarkMode && (
        <View style={styles.backgroundEffects}>
          <Animated.View 
            style={[
              styles.gradientCircle1, 
              { 
                backgroundColor: NuminaColors.chatYellow[200] + '0D',
                opacity: masterFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.gradientCircle2, 
              { 
                backgroundColor: NuminaColors.chatBlue[200] + '08',
                opacity: masterFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              }
            ]} 
          />
        </View>
      )}

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: masterFadeAnim,
              transform: [{ translateY: contentSlideAnim }],
            },
          ]}
        >
          {/* Tutorial Card */}
          <View style={[
            styles.tutorialCard, 
            { 
              backgroundColor: isDarkMode 
                ? 'rgba(28, 28, 28, 1)'
                : 'rgba(255, 255, 255, 0.3)',
              borderColor: isDarkMode 
                ? 'rgba(50, 50, 50, 1)'
                : 'rgba(255, 255, 255, 0.2)',
            }
          ]}>
            {/* Enhanced Progress Bar */}
            <View style={[
              styles.progressBarContainer, 
              { backgroundColor: isDarkMode ? NuminaColors.darkMode[800] : NuminaColors.darkMode[100] }
            ]}>
              <Animated.View
                style={[
                  styles.progressBar,
                  { width: progressWidth },
                ]}
              >
                <LinearGradient
                  colors={[NuminaColors.chatYellow[300], NuminaColors.chatBlue[300]]}
                  style={styles.progressGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>

            {/* Step Content */}
            <View style={styles.stepContent}>
              {/* Enhanced Character Animation */}
              <Animated.View
                style={[styles.characterContainer, characterTransforms]}
              >
                <OptimizedImage
                  source={step.image}
                  style={styles.characterImage}
                  resizeMode="contain"
                  showLoader={true}
                  preload={true}
                />
                <Animated.View 
                  style={[
                    styles.characterGlow,
                    { 
                      backgroundColor: NuminaColors.chatYellow[200] + '1A',
                      opacity: characterAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    }
                  ]} 
                />
              </Animated.View>

              {/* Text Content */}
              <View style={styles.textContent}>
                <Animated.Text 
                  style={[
                    styles.stepTitle, 
                    { 
                      color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[600],
                      opacity: masterFadeAnim,
                      transform: [{
                        translateY: masterFadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      }],
                    }
                  ]}
                >
                  {step.title}
                </Animated.Text>

                <Animated.Text 
                  style={[
                    styles.stepDescription, 
                    { 
                      color: isDarkMode ? '#999999' : NuminaColors.darkMode[400],
                      opacity: masterFadeAnim,
                      transform: [{
                        translateY: masterFadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      }],
                    }
                  ]}
                >
                  {step.description}
                </Animated.Text>

                {/* Enhanced Features List with Staggered Animation */}
                <View style={styles.featuresList}>
                  {step.features.map((feature, index) => (
                    <Animated.View
                      key={feature.text}
                      style={[
                        styles.featureItem,
                        { 
                          backgroundColor: isDarkMode 
                            ? 'rgba(40, 40, 40, 1)'
                            : 'rgba(255, 255, 255, 0.6)',
                          borderColor: isDarkMode 
                            ? 'rgba(50, 50, 50, 1)'
                            : 'rgba(255, 255, 255, 0.6)',
                          opacity: featuresAnim,
                          transform: [{
                            translateY: featuresAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [30, 0],
                            }),
                          }, {
                            scale: featuresAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                            }),
                          }],
                        },
                      ]}
                    >
                      <Animated.View 
                        style={[
                          styles.featureFeather, 
                          { 
                            backgroundColor: isDarkMode 
                              ? NuminaColors.chatYellow[300] + '1A'
                              : NuminaColors.chatYellow[400] + '1A',
                            transform: [{
                              rotate: featuresAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['-10deg', '0deg'],
                              }),
                            }],
                          }
                        ]}
                      >
                        <Feather 
                          name={feature.icon as any} 
                          size={16} 
                          color={isDarkMode ? NuminaColors.chatYellow[300] : NuminaColors.chatYellow[400]} 
                        />
                      </Animated.View>
                      <Text style={[
                        styles.featureText, 
                        { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[700] }
                      ]}>
                        {feature.text}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              </View>
            </View>

            {/* Enhanced Navigation Controls */}
            <View style={styles.navigation}>
              <LinearGradient
                colors={isDarkMode 
                  ? [NuminaColors.chatYellow[200], NuminaColors.chatBlue[200]]
                  : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 1)']
                }
                style={styles.navigationContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {/* Enhanced Previous Button */}
                <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
                  <TouchableOpacity
                    style={[
                      styles.navButton,
                      styles.prevButton,
                      { opacity: currentStep === 0 ? 0.5 : 1 },
                    ]}
                    onPress={() => handleButtonPress('prev', prevStep)}
                    disabled={currentStep === 0 || isTransitioning}
                    activeOpacity={0.7}
                  >
                    <Feather 
                      name="chevron-left" 
                      size={20} 
                      color={isDarkMode ? '#ffffff' : NuminaColors.darkMode[900]} 
                    />
                    <Text style={[
                      styles.navButtonText, 
                      { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[900] }
                    ]}>
                      Previous
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Divider */}
                <View style={[
                  styles.navDivider, 
                  { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : NuminaColors.darkMode[300] }
                ]} />

                {/* Enhanced Next/Finish Button */}
                <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
                  {currentStep < tutorialSteps.length - 1 ? (
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={() => handleButtonPress('next', nextStep)}
                      disabled={isTransitioning}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.navButtonText, 
                        { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[900] }
                      ]}>
                        Next
                      </Text>
                      <Feather 
                        name="chevron-right" 
                        size={20} 
                        color={isDarkMode ? '#ffffff' : NuminaColors.darkMode[900]} 
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.navButton, styles.nextButton]}
                      onPress={() => handleButtonPress('next', handleFinishTutorial)}
                      disabled={isTransitioning}
                      activeOpacity={0.7}
                    >
                      <Feather 
                        name="message-circle" 
                        size={20} 
                        color={isDarkMode ? '#ffffff' : NuminaColors.darkMode[900]} 
                      />
                      <Text style={[
                        styles.navButtonText, 
                        { color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[900] }
                      ]}>
                        Start Chat
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundEffects: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientCircle1: {
    position: 'absolute',
    top: height * 0.25,
    left: width * 0.25,
    width: 600,
    height: 600,
    borderRadius: 300,
    transform: [{ translateX: -300 }, { translateY: -300 }],
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: height * 0.25,
    right: width * 0.25,
    width: 800,
    height: 800,
    borderRadius: 400,
    transform: [{ translateX: 400 }, { translateY: 400 }],
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    minHeight: height - 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
  },
  progressBarContainer: {
    height: 4,
    position: 'relative',
  },
  progressBar: {
    height: 4,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  stepContent: {
    padding: 32,
    minHeight: 450,
    alignItems: 'center',
  },
  characterContainer: {
    marginBottom: 32,
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterImage: {
    width: 100,
    height: 100,
    zIndex: 2,
  },
  characterGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 120,
    height: 120,
    borderRadius: 60,
    transform: [{ translateX: -60 }, { translateY: -60 }],
    zIndex: 1,
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: 'Nunito_700Bold',
  },
  stepDescription: {
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: width * 0.8,
    fontWeight: '400',
    letterSpacing: -0.3,
    fontFamily: 'Inter_400Regular',
  },
  featuresList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
  },
  featureFeather: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 10,
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.3,
    fontFamily: 'Inter_500Medium',
  },
  navigation: {
    paddingTop: 32,
    paddingBottom: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  navigationContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 32,
    gap: 8,
  },
  prevButton: {},
  nextButton: {},
  navDivider: {
    width: 1,
    height: '100%',
  },
  navButtonText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily: 'Inter_600SemiBold',
  },
});