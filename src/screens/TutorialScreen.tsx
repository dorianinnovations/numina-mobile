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
    title: "Intelligent Conversations",
    description: "Meet Numina, your AI companion that thinks like you do. Every conversation creates new connections, helping you discover insights you never knew existed. It's like having a brilliant friend who remembers everything and helps you see patterns in your thoughts.",
    image: happyNuminaImage,
    character: "Friendly Numina",
    features: [
      { text: "Smart conversation memory", icon: "cpu" },
      { text: "Context-aware responses", icon: "layers" },
      { text: "Personalized insights", icon: "map" },
      { text: "Natural language understanding", icon: "brain" }
    ],
    progress: { current: 1, total: 5 }
  },
  {
    id: 2,
    title: "Predictive Intelligence",
    description: "Numina doesn't just respond—it anticipates. By understanding your patterns and preferences, it can suggest ideas and solutions before you even think to ask. It's like having a crystal ball that actually works.",
    image: numinaPuzzledImage,
    character: "Focused Numina",
    features: [
      { text: "Smart suggestions", icon: "clock" },
      { text: "Pattern recognition", icon: "trending-up" },
      { text: "Proactive assistance", icon: "grid" },
      { text: "Personalized predictions", icon: "target" }
    ],
    progress: { current: 2, total: 5 }
  },
  {
    id: 3,
    title: "Creative Discovery",
    description: "Unlock new ways of thinking with Numina's creative engine. It combines your ideas with vast knowledge to reveal connections and possibilities you might never discover alone. Every chat becomes a journey of discovery.",
    image: numinaContentImage,
    character: "Creative Numina",
    features: [
      { text: "Creative brainstorming", icon: "compass" },
      { text: "Knowledge synthesis", icon: "shuffle" },
      { text: "Innovation catalyst", icon: "award" },
      { text: "Deep research assistant", icon: "search" }
    ],
    progress: { current: 3, total: 5 }
  },
  {
    id: 4,
    title: "Global Intelligence Network",
    description: "Connect with the collective wisdom of humanity through Numina's global network. Your conversations contribute to and benefit from a living knowledge base that grows smarter with every interaction worldwide.",
    image: numinaShadesImage,
    character: "Wise Numina",
    features: [
      { text: "Global knowledge access", icon: "globe" },
      { text: "Community insights", icon: "users" },
      { text: "Real-time learning", icon: "server" },
      { text: "Collaborative intelligence", icon: "wifi" }
    ],
    progress: { current: 4, total: 5 }
  },
  {
    id: 5,
    title: "Your AI Partner",
    description: "Ready to start your journey with Numina? This is where AI meets human creativity in perfect harmony. Your thoughts and Numina's intelligence will work together to unlock possibilities you've only dreamed of.",
    image: happyNuminaImage,
    character: "Ready Numina",
    features: [
      { text: "Seamless collaboration", icon: "heart" },
      { text: "Natural conversations", icon: "message-circle" },
      { text: "Creative partnership", icon: "edit-3" },
      { text: "Endless possibilities", icon: "navigation" }
    ],
    progress: { current: 5, total: 5 },
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
  const [interactionCount, setInteractionCount] = useState(0);
  const [discoveredFeatures, setDiscoveredFeatures] = useState<Set<string>>(new Set());
  const [completedInteractions, setCompletedInteractions] = useState<Set<string>>(new Set());
  
  // Dynamic background animations
  const backgroundPulse1 = useRef(new Animated.Value(0)).current;
  const backgroundPulse2 = useRef(new Animated.Value(0)).current;
  const backgroundPulse3 = useRef(new Animated.Value(0)).current;
  const backgroundRotate = useRef(new Animated.Value(0)).current;
  const particleFloat1 = useRef(new Animated.Value(0)).current;
  const particleFloat2 = useRef(new Animated.Value(0)).current;
  const particleFloat3 = useRef(new Animated.Value(0)).current;

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

  // Ultra-smooth button press animations
  const handleButtonPress = useCallback((button: 'prev' | 'next', action: () => void) => {
    const scaleAnim = button === 'prev' ? prevButtonScale : nextButtonScale;
    
    // Haptic feedback
    NuminaAnimations.haptic.light();
    
    // Ultra-smooth press animation with bounce
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.92,
          duration: 80,
          useNativeDriver: true,
          easing: EASING_PRESETS.elegant,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 120,
          useNativeDriver: true,
          easing: EASING_PRESETS.bounce,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
          easing: EASING_PRESETS.elegant,
        }),
      ]),
    ]).start();

    // Execute action with slight delay for better feel
    setTimeout(() => {
      action();
    }, 100);
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

  // Interactive feature handlers
  const handleFeaturePress = useCallback((feature: any, index: number) => {
    NuminaAnimations.haptic.light();
    setInteractionCount(prev => prev + 1);
    setDiscoveredFeatures(prev => new Set([...prev, feature.text]));
    setCompletedInteractions(prev => new Set([...prev, `feature-${currentStep}-${index}`]));
    
    // Animate feature interaction
    const scaleAnim = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    console.log(`✨ Feature discovered: ${feature.text}`);
  }, [currentStep]);

  const handleShakeGesture = useCallback(() => {
    if (currentStep === 2) { // Discovery Engine step
      NuminaAnimations.haptic.medium();
      const randomFeatures = ['Smart Suggestions', 'Pattern Discovery', 'Adaptive UI', 'Learning Insights'];
      const randomFeature = randomFeatures[Math.floor(Math.random() * randomFeatures.length)];
      setDiscoveredFeatures(prev => new Set([...prev, randomFeature]));
      setCompletedInteractions(prev => new Set([...prev, 'shake-discovery']));
      console.log(`🎲 Random discovery: ${randomFeature}`);
    }
  }, [currentStep]);

  const handleLongPressFeature = useCallback((feature: any) => {
    NuminaAnimations.haptic.heavy();
    setCompletedInteractions(prev => new Set([...prev, `saved-${feature.text}`]));
    console.log(`💾 Saved feature: ${feature.text}`);
  }, []);

  // Dynamic background animation loop
  useEffect(() => {
    // Continuous pulsing animations with different timings
    const pulse1Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse1, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPulse1, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    const pulse2Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse2, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPulse2, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: true,
        }),
      ])
    );

    const pulse3Loop = Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse3, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPulse3, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    );

    // Slow rotation
    const rotateLoop = Animated.loop(
      Animated.timing(backgroundRotate, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: true,
      })
    );

    // Floating particles
    const floatLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloat1, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        }),
        Animated.timing(particleFloat1, {
          toValue: 0,
          duration: 10000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloat2, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(particleFloat2, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(particleFloat3, {
          toValue: 1,
          duration: 14000,
          useNativeDriver: true,
        }),
        Animated.timing(particleFloat3, {
          toValue: 0,
          duration: 14000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse1Loop.start();
    pulse2Loop.start();
    pulse3Loop.start();
    rotateLoop.start();
    floatLoop1.start();
    floatLoop2.start();
    floatLoop3.start();

    return () => {
      pulse1Loop.stop();
      pulse2Loop.stop();
      pulse3Loop.stop();
      rotateLoop.stop();
      floatLoop1.stop();
      floatLoop2.stop();
      floatLoop3.stop();
    };
  }, []);

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
        onMenuPress={(key: string) => {}}
      />

      {/* Dynamic Living Background */}
      <View style={styles.backgroundEffects}>
        {/* Neural Network Pulses */}
        <Animated.View 
          style={[
            styles.neuralPulse1, 
            { 
              backgroundColor: isDarkMode 
                ? NuminaColors.chatYellow[400] + '12'
                : NuminaColors.chatYellow[300] + '18',
              opacity: backgroundPulse1.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              transform: [{
                scale: backgroundPulse1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              }],
            }
          ]} 
        />
        
        <Animated.View 
          style={[
            styles.neuralPulse2, 
            { 
              backgroundColor: isDarkMode 
                ? NuminaColors.chatBlue[400] + '15'
                : NuminaColors.chatBlue[300] + '20',
              opacity: backgroundPulse2.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.7],
              }),
              transform: [{
                scale: backgroundPulse2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.0, 1.4],
                }),
              }],
            }
          ]} 
        />

        <Animated.View 
          style={[
            styles.neuralPulse3, 
            { 
              backgroundColor: isDarkMode 
                ? NuminaColors.chatGreen[400] + '10'
                : NuminaColors.chatGreen[300] + '15',
              opacity: backgroundPulse3.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.6],
              }),
              transform: [{
                scale: backgroundPulse3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1.0],
                }),
              }],
            }
          ]} 
        />

        {/* Rotating Consciousness Grid */}
        <Animated.View
          style={[
            styles.consciousnessGrid,
            {
              transform: [{
                rotate: backgroundRotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              }],
            }
          ]}
        >
          <LinearGradient
            colors={isDarkMode 
              ? [NuminaColors.chatBlue[500] + '08', NuminaColors.chatYellow[500] + '08', NuminaColors.chatGreen[500] + '08']
              : [NuminaColors.chatBlue[400] + '12', NuminaColors.chatYellow[400] + '12', NuminaColors.chatGreen[400] + '12']
            }
            style={styles.gridGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Floating Thought Particles */}
        <Animated.View 
          style={[
            styles.thoughtParticle1,
            {
              opacity: particleFloat1.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 0.9],
              }),
              transform: [
                {
                  translateY: particleFloat1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height * 0.8, -height * 0.2],
                  }),
                },
                {
                  translateX: particleFloat1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width * 0.3],
                  }),
                }
              ],
            }
          ]}
        >
          <LinearGradient
            colors={[NuminaColors.chatYellow[400] + '80', NuminaColors.chatYellow[600] + '40']}
            style={styles.particleGradient}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.thoughtParticle2,
            {
              opacity: particleFloat2.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              transform: [
                {
                  translateY: particleFloat2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height * 0.9, -height * 0.1],
                  }),
                },
                {
                  translateX: particleFloat2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width * 0.7, width * 0.1],
                  }),
                }
              ],
            }
          ]}
        >
          <LinearGradient
            colors={[NuminaColors.chatBlue[400] + '70', NuminaColors.chatBlue[600] + '30']}
            style={styles.particleGradient}
          />
        </Animated.View>

        <Animated.View 
          style={[
            styles.thoughtParticle3,
            {
              opacity: particleFloat3.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.7],
              }),
              transform: [
                {
                  translateY: particleFloat3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height * 0.6, -height * 0.4],
                  }),
                },
                {
                  translateX: particleFloat3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width * 0.2, width * 0.8],
                  }),
                }
              ],
            }
          ]}
        >
          <LinearGradient
            colors={[NuminaColors.chatGreen[400] + '60', NuminaColors.chatGreen[600] + '20']}
            style={styles.particleGradient}
          />
        </Animated.View>
      </View>

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
                ? 'rgba(18, 18, 18, 1)'
                : 'rgba(255, 255, 255, 0.3)',
              borderColor: isDarkMode 
                ? 'rgba(40, 40, 40, 1)'
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
                {/* Character glow effect */}
                <View style={[
                  styles.characterGlow,
                  { 
                    backgroundColor: isDarkMode 
                      ? 'transparent'
                      : NuminaColors.chatYellow[300] + '30',
                  }
                ]} />
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

                {/* Interactive Features List with discovery elements */}
                <View style={styles.featuresList}>
                  {step.features.map((feature, index) => {
                    const isDiscovered = discoveredFeatures.has(feature.text);
                    const isInteracted = completedInteractions.has(`feature-${currentStep}-${index}`);
                    
                    return (
                      <TouchableOpacity
                        key={feature.text}
                        onPress={() => handleFeaturePress(feature, index)}
                        onLongPress={() => handleLongPressFeature(feature)}
                        activeOpacity={0.8}
                      >
                        <Animated.View
                          style={[
                            styles.featureItem,
                            { 
                              backgroundColor: isInteracted 
                                ? (isDarkMode ? NuminaColors.chatBlue[900] + '40' : NuminaColors.chatBlue[100] + '60')
                                : (isDarkMode ? 'rgba(40, 40, 40, 1)' : 'rgba(255, 255, 255, 0.6)'),
                              borderColor: isInteracted
                                ? (isDarkMode ? NuminaColors.chatBlue[500] + '60' : NuminaColors.chatBlue[300] + '60')
                                : (isDarkMode ? 'rgba(50, 50, 50, 1)' : 'rgba(255, 255, 255, 0.6)'),
                              borderWidth: isInteracted ? 2 : 1,
                            },
                            getBulletPointTransforms(index),
                          ]}
                        >
                          <View 
                            style={[
                              styles.featureFeather, 
                              { 
                                backgroundColor: isInteracted
                                  ? (isDarkMode ? NuminaColors.chatBlue[400] + '30' : NuminaColors.chatBlue[300] + '30')
                                  : (isDarkMode ? NuminaColors.chatYellow[300] + '1A' : NuminaColors.chatYellow[400] + '1A'),
                              }
                            ]}
                          >
                            <Feather 
                              name={feature.icon as any} 
                              size={16} 
                              color={isInteracted 
                                ? (isDarkMode ? NuminaColors.chatBlue[300] : NuminaColors.chatBlue[500])
                                : (isDarkMode ? NuminaColors.chatYellow[300] : NuminaColors.chatYellow[400])
                              } 
                            />
                          </View>
                          <Text style={[
                            styles.featureText, 
                            { 
                              color: isInteracted 
                                ? (isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[700])
                                : (isDarkMode ? '#ffffff' : NuminaColors.darkMode[700]),
                              fontWeight: isInteracted ? '600' : '500'
                            }
                          ]}>
                            {feature.text}
                          </Text>
                          {isInteracted && (
                            <View style={styles.discoveryBadge}>
                              <Feather 
                                name="check-circle" 
                                size={12} 
                                color={isDarkMode ? NuminaColors.chatBlue[300] : NuminaColors.chatBlue[500]} 
                              />
                            </View>
                          )}
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })}
                  
                  {/* Discovery Counter */}
                  {discoveredFeatures.size > 0 && (
                    <Animated.View 
                      style={[
                        styles.discoveryCounter,
                        { 
                          backgroundColor: isDarkMode 
                            ? NuminaColors.chatGreen[900] + '40'
                            : NuminaColors.chatGreen[100] + '80',
                          borderColor: isDarkMode 
                            ? NuminaColors.chatGreen[500] + '60'
                            : NuminaColors.chatGreen[300] + '60',
                        }
                      ]}
                    >
                      <Feather 
                        name="compass" 
                        size={14} 
                        color={isDarkMode ? NuminaColors.chatGreen[300] : NuminaColors.chatGreen[600]} 
                      />
                      <Text style={[
                        styles.discoveryText,
                        { color: isDarkMode ? NuminaColors.chatGreen[200] : NuminaColors.chatGreen[700] }
                      ]}>
                        {discoveredFeatures.size} discoveries made
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </View>
            </Animated.View>
          </View>


          {/* Enhanced Navigation with Share */}
          <View style={styles.navigation}>


            <LinearGradient
              colors={isDarkMode 
                ? [NuminaColors.chatBlue[300], NuminaColors.chatBlue[400]]
                : [NuminaColors.chatBlue[200], NuminaColors.chatBlue[300]]
              }
              style={styles.navigationContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {/* Previous Button */}
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
                    color="#ffffff" 
                  />
                  <Text style={[
                    styles.navButtonText, 
                    { color: '#ffffff' }
                  ]}>
                    Previous
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={[
                styles.navDivider, 
                { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
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
                      { color: '#ffffff' }
                    ]}>
                      Next
                    </Text>
                    <Feather 
                      name="chevron-right" 
                      size={20} 
                      color="#ffffff" 
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
                      color="#ffffff" 
                    />
                    <Text style={[
                      styles.navButtonText, 
                      { color: '#ffffff' }
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
    zIndex: 0,
  },
  // Neural Network Pulses
  neuralPulse1: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
  },
  neuralPulse2: {
    position: 'absolute',
    top: height * 0.4,
    right: width * 0.05,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
  },
  neuralPulse3: {
    position: 'absolute',
    bottom: height * 0.2,
    left: width * 0.15,
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
  },
  // Consciousness Grid
  consciousnessGrid: {
    position: 'absolute',
    top: height * 0.3,
    left: width * 0.3,
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
  },
  gridGradient: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.2,
  },
  // Floating Thought Particles
  thoughtParticle1: {
    position: 'absolute',
    left: width * 0.1,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  thoughtParticle2: {
    position: 'absolute',
    right: width * 0.15,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  thoughtParticle3: {
    position: 'absolute',
    left: width * 0.6,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  particleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    marginBottom: 20, 
    borderWidth: 1,
    height: 540, 
    position: 'relative',
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
    padding: 24,
    height: 516, 
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  characterContainer: {
    marginBottom: 24,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 1,
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
    maxHeight: 380, 
  },
  stepTitle: {
    fontSize: 26, 
    fontWeight: 'bold',
    marginBottom: 20, 
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: 'CrimsonPro_700Bold',
  },
  stepDescription: {
    fontSize: 16, 
    lineHeight: 24, 
    textAlign: 'center',
    marginBottom: 24, 
    maxWidth: width * 0.85,
    fontWeight: '400',
    letterSpacing: -0.3,
    fontFamily: 'CrimsonPro_400Regular',
    maxHeight: 140, 
    overflow: 'hidden', 
  },
  featuresList: {
    width: '100%',
    gap: 10,
    maxHeight: 180, 
    overflow: 'hidden', 
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    borderRadius: 10, 
    gap: 6, 
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featureFeather: {
    width: 18, 
    height: 18, 
    borderRadius: 5, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13, 
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.2,
    fontFamily: 'Inter_500Medium',
  },
  navigation: {
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
    width: '100%',
  },
  navigationContainer: {
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    minHeight: 44,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9.2, 
    paddingHorizontal: 24,
    gap: 8, 
    flex: 1, 
    justifyContent: 'center', 
  },
  prevButton: {},
  nextButton: {},
  navDivider: {
    width: 1,
    height: '100%',
  },
  navButtonText: {
    fontSize: 16, 
    fontWeight: '500',
    letterSpacing: -0.5, 
    fontFamily: 'Nunito_500Medium', 
  },
  // Interactive elements styles
  discoveryCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  discoveryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontFamily: 'Inter_600SemiBold',
  },
  discoveryBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});