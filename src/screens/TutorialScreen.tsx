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
// Removed OptimizedImage for simpler rendering

const { width, height } = Dimensions.get('window');

// Elegant opacity-based animation constants
const ANIMATION_TIMING = {
  INSTANT: 120,
  FAST: 200,
  SMOOTH: 300,
  ENTRANCE: 400,
};

const EASING_PRESETS = {
  entrance: NuminaEasing.smooth,
  exit: NuminaEasing.smooth,
  elegant: NuminaEasing.neumorphicEntrance,
  bounce: NuminaEasing.neumorphicBounce,
};

// Import character images for each tutorial step
const happyNuminaImage = require('../assets/images/happynumina.png');
const numinaPuzzledImage = require('../assets/images/numinapuzzled.png');
const numinaContentImage = require('../assets/images/numinacontent.png');
const numinaShadesImage = require('../assets/images/numinashades.png');

// Preload all tutorial images
const tutorialImages = [happyNuminaImage, numinaPuzzledImage, numinaContentImage, numinaShadesImage];

const tutorialSteps = [
  {
    id: 1,
    title: "Hi, I'm Numina",
    description: "I help you catch the emotional shifts you usually miss. Those subtle changes in mood and energy that slip by throughout your day? I notice them and bring them to your attention with just enough context to help you understand what's happening before it affects your focus or decisions.",
    image: happyNuminaImage,
    character: "Intro Numina",
    features: [
      { text: "Catch subtle mood shifts", icon: "zap" },
      { text: "Understand your patterns", icon: "bar-chart-2" },
      { text: "Stay ahead of your emotions", icon: "bell" }
    ],
    progress: { current: 1, total: 4 }
  },
  {
    id: 2,
    title: "I Focus on What Matters",
    description: "Instead of daily check-ins that become routine, I wait for meaningful patterns to emerge. When there's a real insight about your emotional landscape—something that could genuinely help you—that's when I reach out. Every notification earns its place.",
    image: numinaPuzzledImage,
    character: "Focused Numina",
    features: [
      { text: "Meaningful insights only", icon: "target" },
      { text: "Pattern-driven notifications", icon: "bar-chart-2" },
      { text: "Respect for your attention", icon: "shield" }
    ],
    progress: { current: 2, total: 4 }
  },
  {
    id: 3,
    title: "Blips: Effortless Emotional Check-ins",
    description: "Blips solve the biggest problem with mood tracking—actually doing it consistently. These gentle, well-timed moments capture your emotional state without interrupting your flow. No daily homework, just natural moments that build a complete picture over time.",
    image: numinaContentImage,
    character: "Gentle Numina",
    features: [
      { text: "Perfectly timed check-ins", icon: "zap" },
      { text: "No interruption to your flow", icon: "clock" },
      { text: "Consistent without effort", icon: "heart" }
    ],
    progress: { current: 3, total: 4 }
  },
  {
    id: 4,
    title: "Stratosphere: Where Insights Live",
    description: "This is where your emotional data becomes personal wisdom. Stratosphere transforms patterns into insights you can act on, provides conversations that help you reflect and grow, and offers support when you need it most. Think of it as your space for deeper self-understanding.",
    image: numinaShadesImage,
    character: "Wise Numina",
    features: [
      { text: "Actionable insights", icon: "trending-up" },
      { text: "Reflective conversations", icon: "message-circle" },
      { text: "Support when needed", icon: "shield" },
      { text: "Your space for growth", icon: "settings" }
    ],
    progress: { current: 4, total: 4 },
    interface: "stratosphere"
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

  // Elegant opacity-based animation values
  const masterFadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const contentOpacityAnim = useRef(new Animated.Value(0)).current;
  const characterOpacityAnim = useRef(new Animated.Value(0)).current;
  const characterScaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Individual bullet point animations - staggered roll-in from bottom
  const bulletPoint1Opacity = useRef(new Animated.Value(0)).current;
  const bulletPoint1Transform = useRef(new Animated.Value(20)).current;
  const bulletPoint2Opacity = useRef(new Animated.Value(0)).current;
  const bulletPoint2Transform = useRef(new Animated.Value(20)).current;
  const bulletPoint3Opacity = useRef(new Animated.Value(0)).current;
  const bulletPoint3Transform = useRef(new Animated.Value(20)).current;
  const bulletPoint4Opacity = useRef(new Animated.Value(0)).current;
  const bulletPoint4Transform = useRef(new Animated.Value(20)).current;
  
  // Feature animations - elegant stagger with opacity only
  const featuresOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Navigation button animations - subtle scale only
  const prevButtonScale = useRef(new Animated.Value(1)).current;
  const nextButtonScale = useRef(new Animated.Value(1)).current;
  
  // Content transform for subtle movement (maximum 8px)
  const contentTransformAnim = useRef(new Animated.Value(0)).current;

  // Removed complex image preloading for simpler approach

  // Elegant entrance animation - pure opacity with minimal scale
  useEffect(() => {
    const entranceSequence = Animated.sequence([
      // Master fade in
      Animated.timing(masterFadeAnim, {
        toValue: 1,
        duration: ANIMATION_TIMING.ENTRANCE,
        useNativeDriver: true,
        easing: EASING_PRESETS.entrance,
      }),
      
      // Content opacity with subtle scale
      Animated.parallel([
        Animated.timing(contentOpacityAnim, {
          toValue: 1,
          duration: ANIMATION_TIMING.FAST,
          useNativeDriver: true,
          easing: EASING_PRESETS.elegant,
        }),
        Animated.timing(contentTransformAnim, {
          toValue: 1,
          duration: ANIMATION_TIMING.FAST,
          useNativeDriver: true,
          easing: EASING_PRESETS.elegant,
        }),
      ]),
      
      // Character elegant appearance
      Animated.parallel([
        Animated.timing(characterOpacityAnim, {
          toValue: 1,
          duration: ANIMATION_TIMING.SMOOTH,
          useNativeDriver: true,
          easing: EASING_PRESETS.elegant,
        }),
        Animated.timing(characterScaleAnim, {
          toValue: 1,
          duration: ANIMATION_TIMING.SMOOTH,
          useNativeDriver: true,
          easing: EASING_PRESETS.elegant,
        }),
      ]),
      
    ]);

    entranceSequence.start(() => {
      // Start bullet point animations after main content is visible
      animateBulletPoints(tutorialSteps[currentStep]).start();
    });

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / tutorialSteps.length,
      duration: ANIMATION_TIMING.SMOOTH,
      useNativeDriver: false,
      easing: EASING_PRESETS.elegant,
    }).start();

    return () => {
      entranceSequence.stop();
    };
  }, []);

  // Staggered bullet point animations - roll in from bottom with 600ms duration
  const animateBulletPoints = useCallback((step: any) => {
    const bulletAnims = [
      { opacity: bulletPoint1Opacity, transform: bulletPoint1Transform },
      { opacity: bulletPoint2Opacity, transform: bulletPoint2Transform },
      { opacity: bulletPoint3Opacity, transform: bulletPoint3Transform },
      { opacity: bulletPoint4Opacity, transform: bulletPoint4Transform },
    ];

    // Reset all bullet points
    bulletAnims.forEach(anim => {
      anim.opacity.setValue(0);
      anim.transform.setValue(20);
    });

    // Create staggered animations for each bullet point
    const staggeredAnimations = step.features.map((_: any, index: number) => {
      if (index < bulletAnims.length) {
        return Animated.parallel([
          Animated.timing(bulletAnims[index].opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: EASING_PRESETS.elegant,
          }),
          Animated.timing(bulletAnims[index].transform, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
            easing: EASING_PRESETS.elegant,
          }),
        ]);
      }
      return null;
    }).filter(Boolean);

    // Stagger the animations with 150ms delay between each
    return Animated.stagger(150, staggeredAnimations);
  }, [bulletPoint1Opacity, bulletPoint1Transform, bulletPoint2Opacity, bulletPoint2Transform,
      bulletPoint3Opacity, bulletPoint3Transform, bulletPoint4Opacity, bulletPoint4Transform]);

  // Update progress when step changes - smooth and elegant
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / tutorialSteps.length,
      duration: ANIMATION_TIMING.FAST,
      useNativeDriver: false,
      easing: EASING_PRESETS.elegant,
    }).start();
  }, [currentStep]);

  // Elegant step transition - pure opacity crossfade with minimal movement
  const animateStepTransition = useCallback((direction: number) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    NuminaAnimations.haptic.light();

    // Elegant exit - fade out with subtle scale
    const exitSequence = Animated.parallel([
      Animated.timing(contentOpacityAnim, {
        toValue: 0,
        duration: ANIMATION_TIMING.FAST,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
      }),
      Animated.timing(characterOpacityAnim, {
        toValue: 0,
        duration: ANIMATION_TIMING.FAST,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
      }),
      Animated.timing(characterScaleAnim, {
        toValue: 0.95,
        duration: ANIMATION_TIMING.FAST,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
      }),
      Animated.timing(featuresOpacityAnim, {
        toValue: 0,
        duration: ANIMATION_TIMING.INSTANT,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
      }),
      // Subtle content movement (max 8px)
      Animated.timing(contentTransformAnim, {
        toValue: direction > 0 ? -0.2 : 1.2,
        duration: ANIMATION_TIMING.FAST,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
      }),
      // Reset all bullet points to hidden immediately
      Animated.parallel([
        Animated.timing(bulletPoint1Opacity, {
          toValue: 0,
          duration: ANIMATION_TIMING.INSTANT,
          useNativeDriver: true,
        }),
        Animated.timing(bulletPoint2Opacity, {
          toValue: 0,
          duration: ANIMATION_TIMING.INSTANT,
          useNativeDriver: true,
        }),
        Animated.timing(bulletPoint3Opacity, {
          toValue: 0,
          duration: ANIMATION_TIMING.INSTANT,
          useNativeDriver: true,
        }),
        Animated.timing(bulletPoint4Opacity, {
          toValue: 0,
          duration: ANIMATION_TIMING.INSTANT,
          useNativeDriver: true,
        }),
      ]),
    ]);

    exitSequence.start(() => {
      // Update step
      setCurrentStep(prev => prev + direction);
      
      // Reset for entrance
      contentTransformAnim.setValue(direction > 0 ? 1.2 : -0.2);
      
      // Elegant entrance - staggered opacity with smooth scale
      const entranceSequence = Animated.sequence([
        // Content fades in with smooth transform
        Animated.parallel([
          Animated.timing(contentOpacityAnim, {
            toValue: 1,
            duration: ANIMATION_TIMING.SMOOTH,
            useNativeDriver: true,
            easing: EASING_PRESETS.elegant,
          }),
          Animated.timing(contentTransformAnim, {
            toValue: 1,
            duration: ANIMATION_TIMING.SMOOTH,
            useNativeDriver: true,
            easing: EASING_PRESETS.elegant,
          }),
        ]),
        
        // Character elegant appearance
        Animated.parallel([
          Animated.timing(characterOpacityAnim, {
            toValue: 1,
            duration: ANIMATION_TIMING.SMOOTH,
            useNativeDriver: true,
            easing: EASING_PRESETS.elegant,
          }),
          Animated.timing(characterScaleAnim, {
            toValue: 1,
            duration: ANIMATION_TIMING.SMOOTH,
            useNativeDriver: true,
            easing: EASING_PRESETS.elegant,
          }),
        ]),
      ]);

      // Features elegant fade in
      const featuresSequence = Animated.timing(featuresOpacityAnim, {
        toValue: 1,
        duration: ANIMATION_TIMING.SMOOTH,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
      });

      entranceSequence.start(() => {
        // Start bullet point animations after main content transitions
        animateBulletPoints(tutorialSteps[currentStep]).start(() => {
          setIsTransitioning(false);
        });
      });
    });
  }, [isTransitioning, currentStep]);

  // Elegant button press animations
  const handleButtonPress = useCallback((button: 'prev' | 'next', action: () => void) => {
    const scaleAnim = button === 'prev' ? prevButtonScale : nextButtonScale;
    
    // Haptic feedback
    NuminaAnimations.haptic.light();
    
    // Elegant press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: ANIMATION_TIMING.INSTANT,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: ANIMATION_TIMING.FAST,
        useNativeDriver: true,
        easing: EASING_PRESETS.elegant,
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
    ScreenTransitions.fadeOutScale(masterFadeAnim, characterScaleAnim, () => {
      onStartChat();
    });
  }, [masterFadeAnim, characterScaleAnim, onStartChat]);

  const step = tutorialSteps[currentStep];

  // Elegant animation interpolations - pure opacity with minimal scale
  const characterTransforms = {
    opacity: characterOpacityAnim,
    transform: [
      {
        scale: characterScaleAnim,
      },
    ],
  };
  
  // Content transforms with subtle movement (max 8px)
  const contentTransforms = {
    opacity: contentOpacityAnim,
    transform: [
      {
        translateY: contentTransformAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };
  
  // Individual bullet point transforms - staggered roll-in from bottom
  const getBulletPointTransforms = (index: number) => {
    const bulletAnims = [
      { opacity: bulletPoint1Opacity, transform: bulletPoint1Transform },
      { opacity: bulletPoint2Opacity, transform: bulletPoint2Transform },
      { opacity: bulletPoint3Opacity, transform: bulletPoint3Transform },
      { opacity: bulletPoint4Opacity, transform: bulletPoint4Transform },
    ];
    
    const anim = bulletAnims[index];
    if (!anim) return { 
      opacity: 0,
      transform: [{ translateY: 20 }],
    };
    
    return {
      opacity: anim.opacity,
      transform: [
        {
          translateY: anim.transform,
        },
      ],
    };
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
          ScreenTransitions.slideOutRight(slideAnim, () => {
            onNavigateHome();
          });
        }}
        onTitlePress={onNavigateHome}
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
              transform: [{ translateX: slideAnim }],
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

            {/* Step Content with elegant animations */}
            <Animated.View style={[styles.stepContent, contentTransforms]}>
              {/* Enhanced Character Animation */}
              <Animated.View
                style={[styles.characterContainer, characterTransforms]}
              >
                <Image
                  source={step.image}
                  style={styles.characterImage}
                  resizeMode="contain"
                />
              </Animated.View>

              {/* Text Content */}
              <View style={styles.textContent}>
                <Text 
                  style={[
                    styles.stepTitle, 
                    { 
                      color: isDarkMode ? '#ffffff' : NuminaColors.darkMode[600],
                    }
                  ]}
                >
                  {step.title}
                </Text>

                <Text 
                  style={[
                    styles.stepDescription, 
                    { 
                      color: isDarkMode ? '#999999' : NuminaColors.darkMode[400],
                    }
                  ]}
                >
                  {step.description}
                </Text>

                {/* Elegant Features List with individual staggered animations */}
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
                        },
                        getBulletPointTransforms(index),
                      ]}
                    >
                      <View 
                        style={[
                          styles.featureFeather, 
                          { 
                            backgroundColor: isDarkMode 
                              ? NuminaColors.chatYellow[300] + '1A'
                              : NuminaColors.chatYellow[400] + '1A',
                          }
                        ]}
                      >
                        <Feather 
                          name={feature.icon as any} 
                          size={16} 
                          color={isDarkMode ? NuminaColors.chatYellow[300] : NuminaColors.chatYellow[400]} 
                        />
                      </View>
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
            </Animated.View>
          </View>

          {/* Navigation Controls  */}
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
                { backgroundColor: isDarkMode ? 'rgba(128, 128, 128, 0.527)' : NuminaColors.darkMode[300] }
              ]} />

              {/* Next/Finish Button */}
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
    marginBottom: 24, 
    borderWidth: 1,
    height: 600, 
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
    height: 596, 
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  textContent: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    maxHeight: 380, 
  },
  stepTitle: {
    fontSize: 28, 
    fontWeight: 'bold',
    marginBottom: 20, 
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: 'CrimsonPro_700Bold',
  },
  stepDescription: {
    fontSize: 17.5, 
    lineHeight: 28, 
    textAlign: 'center',
    marginBottom: 32, 
    maxWidth: width * 0.8,
    fontWeight: '400',
    letterSpacing: -0.3,
    fontFamily: 'CrimsonPro_400Regular',
    maxHeight: 160, 
    overflow: 'hidden', 
  },
  featuresList: {
    width: '100%',
    gap: 12,
    maxHeight: 200, 
    overflow: 'hidden', 
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, 
    paddingHorizontal: 8, 
    borderRadius: 8, 
    gap: 6, 
    borderWidth: 1,
  },
  featureFeather: {
    width: 16, // Reduced from 32 by 50%
    height: 16, // Reduced from 32 by 50%
    borderRadius: 4, // Reduced from 8 by 50%
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12.5, // Increased from original 10 by 25%
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.3,
    fontFamily: 'Inter_500Medium',
  },
  navigation: {
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  navigationContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    minHeight: 56, // Increased height for better visibility
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Increased from 8
    paddingHorizontal: 40, // Increased from 32
    gap: 12, // Increased from 8
    flex: 1, // Make buttons take equal space
    justifyContent: 'center', // Center content
  },
  prevButton: {},
  nextButton: {},
  navDivider: {
    width: 1,
    height: '100%',
  },
  navButtonText: {
    fontSize: 14, // Increased from 10
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily: 'Inter_600SemiBold',
  },
});