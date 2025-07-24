import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenTransitions } from '../utils/animations';
import { Header } from '../components/Header';
import { PageBackground } from '../components/PageBackground';
import { StarField } from '../components/StarField';
import { ShootingStars } from '../components/ShootingStars';
import { LiquidProgress } from '../components/LiquidProgress';
import { SimpleStreamingText } from '../components/SimpleStreamingText';
import { NuminaColors } from '../utils/colors';

const { width } = Dimensions.get('window');

const PLEASURE_TIMINGS = {
  INSTANT: 50,
  SNAP: 80,
  SMOOTH: 120,
  ELEGANT: 180,
  BREATHE: 300,
};

const PLEASURE_EASING = {
  snap: Easing.out(Easing.quad),
  bounce: Easing.out(Easing.back(1.7)),
  elastic: Easing.out(Easing.back(2)),
  smooth: Easing.out(Easing.quad),
  breathe: Easing.inOut(Easing.quad),
};

// Learn steps
const tutorialSteps = [
  {
    id: 1,
    title: "Build Your Digital Twin",
    description: "As you chat, Numina builds a dynamic model of your mind—your User Behavior Profile (UBPM). This isn't just context; it's your digital DNA, capturing how you think, create, and connect ideas.",
    icon: "grid"
  },
  {
    id: 2,
    title: "Chat With Your Second Brain",
    description: "Access the Sandbox—a private space where you can have conversations with your personal AI. Ask questions about your projects, explore ideas, and get insights tailored specifically to how you think and work.",
    icon: "layers"
  },
  {
    id: 3,
    title: "Discover New Worlds",
    description: "Connect with people on a deeper level. Numina finds your tribe by matching the core of your UBPM with others, revealing profound compatibilities and opening doors to new worlds and unexpected friendships.",
    icon: "users"
  },
  {
    id: 4,
    title: "Audit Your Second Brain",
    description: "Your insights are always yours to command. Instantly access and understand the analytics that shape your digital twin. You have full transparency and control over your most valuable asset: your own mind.",
    icon: "bar-chart-2"
  },
  {
    id: 5,
    title: "Your Mind is Not for Sale",
    description: "Our commitment is absolute: Your data is yours alone. We operate on a foundation of total privacy, funded by a community that values security, not by selling access to your thoughts.",
    icon: "shield"
  },
  {
    id: 6,
    title: "Begin Your Advantage",
    description: "Start building your second brain for free. Gain an unparalleled intellectual edge, discover new connections, and unlock a deeper understanding of yourself.",
    icon: "message-circle"
  }
];

interface TutorialScreenProps {
  onNavigateHome: () => void;
  onStartChat: () => void;
  onTitlePress?: () => void;
  onMenuPress?: (key: string) => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({
  onNavigateHome,
  onStartChat,
  onTitlePress,
  onMenuPress,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Core animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Card animations with rich pleasure effects
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;
  const cardGlow = useRef(new Animated.Value(0)).current;
  
  // Icon pleasure animations
  const iconScale = useRef(new Animated.Value(0.7)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(0)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;
  
  // Button micro-interactions
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonGlow = useRef(new Animated.Value(0)).current;
  const buttonPress = useRef(new Animated.Value(0)).current;
  
  // Navigation brick animations
  const leftBrickPress = useRef(new Animated.Value(0)).current;
  const rightBrickPress = useRef(new Animated.Value(0)).current;
  
  // Progress dot animations
  const progressAnims = useRef(tutorialSteps.map(() => new Animated.Value(0))).current;
  
  // Liquid progress animations
  const liquidFlow = useRef(new Animated.Value(0)).current;
  const liquidBubbles = useRef(tutorialSteps.map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;
  const liquidWave = useRef(new Animated.Value(0)).current;
  const liquidShimmer = useRef(new Animated.Value(0)).current;
  const stepBadgeGlow = useRef(new Animated.Value(0)).current;
  
  // Text content animations
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textScale = useRef(new Animated.Value(1)).current;
  
  // Ambient background animations with locked initial state
  const ambientPulse1 = useRef(new Animated.Value(0.4)).current;
  const ambientPulse2 = useRef(new Animated.Value(0.6)).current;
  const ambientFloat = useRef(new Animated.Value(0)).current;
  const centralNodePulse = useRef(new Animated.Value(0)).current;
  const satelliteNodePulse = useRef(new Animated.Value(0)).current;
  const connectionShimmer = useRef(new Animated.Value(0)).current;
  
  // Flag to track if animations have been initialized to prevent re-initialization
  const [isInitialized, setIsInitialized] = useState(false);


  // Reset all animation values for proper re-initialization
  const resetAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    cardScale.setValue(0.92);
    cardOpacity.setValue(0);
    cardFloat.setValue(0);
    cardGlow.setValue(0);
    iconScale.setValue(0.7);
    iconRotate.setValue(0);
    iconPulse.setValue(0);
    iconFloat.setValue(0);
    buttonScale.setValue(1);
    buttonGlow.setValue(0);
    buttonPress.setValue(0);
    leftBrickPress.setValue(0);
    rightBrickPress.setValue(0);
    liquidFlow.setValue(0);
    textOpacity.setValue(1);
    textScale.setValue(1);
    
    stepBadgeGlow.setValue(0);
    
    // Reset progress animations
    progressAnims.forEach(anim => anim.setValue(0));
    
    // Reset liquid bubble animations
    liquidBubbles.forEach(bubble => {
      bubble.x.setValue(0);
      bubble.y.setValue(0);
      bubble.scale.setValue(0);
      bubble.opacity.setValue(0);
    });
  };

  // Initialize animations function
  const initializeAnimations = () => {
    resetAnimations();
    
    fadeAnim.setValue(1);
    ScreenTransitions.slideInLeft(slideAnim);
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: PLEASURE_TIMINGS.INSTANT,
          easing: PLEASURE_EASING.snap,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 0.98,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      Animated.sequence([
        Animated.spring(iconScale, {
          toValue: 0.85,
          tension: 150,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, PLEASURE_TIMINGS.SNAP);
    
    progressAnims.forEach((anim, index) => {
      if (index === currentStep) {
        setTimeout(() => {
          Animated.spring(anim, {
            toValue: 1,
            tension: 120,
            friction: 6,
            useNativeDriver: true,
          }).start();
        }, PLEASURE_TIMINGS.SMOOTH + index * 30);
      }
    });
    
    startAmbientAnimations();
  };

  // Focus effect - reinitialize on each focus for proper back navigation
  useFocusEffect(
    React.useCallback(() => {
      // Reset to first step and ensure fresh initialization on each focus
      setCurrentStep(0);
      setIsInitialized(false);
      // Small delay to ensure proper state reset
      setTimeout(() => {
        initializeAnimations();
        setIsInitialized(true);
      }, 50);
    }, [])
  );

  // entrance sequence - run on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeAnimations();
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 0.85,
          duration: PLEASURE_TIMINGS.INSTANT,
          easing: PLEASURE_EASING.snap,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 0.92,
          tension: 140,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      progressAnims.forEach((anim, index) => {
        if (index === currentStep) {
          Animated.spring(anim, {
            toValue: 1,
            tension: 150,
            friction: 6,
            useNativeDriver: true,
          }).start();
        } else if (index === currentStep - 1) {
          Animated.timing(anim, {
            toValue: 0.6,
            duration: PLEASURE_TIMINGS.SMOOTH,
            easing: PLEASURE_EASING.smooth,
            useNativeDriver: true,
          }).start();
        }
      });
      
      // Animate liquid flow with equal discrete steps
      Animated.timing(liquidFlow, {
        toValue: currentStep / (tutorialSteps.length - 1),
        duration: 150,
        useNativeDriver: false,
      }).start();
      
      // Animate liquid bubbles for current step
      if (currentStep < liquidBubbles.length) {
        const bubble = liquidBubbles[currentStep];
        Animated.sequence([
          Animated.delay(50),
          Animated.parallel([
            Animated.timing(bubble.scale, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(bubble.opacity, {
              toValue: 1,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(bubble.y, {
              toValue: -15,
              duration: 120,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(bubble.opacity, {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }),
        ]).start(() => {
          bubble.y.setValue(0);
          bubble.scale.setValue(0);
        });
      }
      
    }
  }, [currentStep]);
  
  
  // Ambient animations for stable layout
  const startAmbientAnimations = () => {
    // Always set initial values for proper re-initialization
    cardFloat.setValue(0);
    iconPulse.setValue(0.5);
    ambientPulse1.setValue(0.4);
    ambientPulse2.setValue(0.6);
    cardGlow.setValue(0.3);
    centralNodePulse.setValue(0);
    satelliteNodePulse.setValue(0);
    connectionShimmer.setValue(0);
    stepBadgeGlow.setValue(0);

    // Disabled liquid animations to prevent overheating
    liquidWave.setValue(0);
    liquidShimmer.setValue(0);

    // Central Node Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(centralNodePulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(centralNodePulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Satellite Node Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(satelliteNodePulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(satelliteNodePulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Connection Shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(connectionShimmer, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(connectionShimmer, {
          toValue: 0,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Step Badge Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(stepBadgeGlow, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(stepBadgeGlow, {
          toValue: 0,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Smooth button interactions with streaming text
  const handleNext = async () => {
    if (currentStep < tutorialSteps.length - 1) {
      // Heavy haptic feedback for luxury feel per style guide
      const nextStep = currentStep + 1;
      if (nextStep === tutorialSteps.length - 1) {
        // Success haptic when reaching final step
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
      } else {
        // Heavy tutorial haptic for snappy feel
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      
      // Button animation
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.96,
          duration: 80,
          easing: PLEASURE_EASING.snap,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 120,
          easing: PLEASURE_EASING.smooth,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Change step and stream new content
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = async () => {
    if (currentStep > 0) {
      // Heavy back haptic for luxury feel
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Button animation
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.96,
          duration: 80,
          easing: PLEASURE_EASING.snap,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 120,
          easing: PLEASURE_EASING.smooth,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Change step and stream previous content
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    // Heavy success haptic sequence for completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 50);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 150);
    
    // Gentle completion animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 80,
        easing: PLEASURE_EASING.snap,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 120,
        easing: PLEASURE_EASING.smooth,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Smooth exit transition
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: PLEASURE_EASING.smooth,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.95,
          duration: 200,
          easing: PLEASURE_EASING.smooth,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onStartChat();
      });
    });
  };

  const step = tutorialSteps[currentStep] || tutorialSteps[0];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <PageBackground>
      <StarField 
        density="low" 
        animated={false} 
        interactive={false}
        constellation={false}
      />
      
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={isDarkMode ? '#0a0a0a' : 'transparent'}
          translucent={true}
        />
      
        {/* Header */}
        <Header 
          title="Numina"
          showBackButton={true}
          showMenuButton={true}
          showAuthOptions={false}
          onBackPress={() => {
            onNavigateHome();
          }}
          onTitlePress={onTitlePress}
          onMenuPress={onMenuPress}
        />

        {/* LOCKED Neural Network Background - No animations */}
        <View style={[styles.neuralNetworkBackground, { 
          opacity: 0.4
        }]}>
          {/* Central Hub Node - STATIC */}
          <Animated.View style={[
            styles.centralNode,
            {
              backgroundColor: isDarkMode ? '#98fb98' : '#22c55e',
              shadowColor: isDarkMode ? '#98fb98' : '#22c55e',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: centralNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 0.9, 0.6],
              }),
              shadowRadius: centralNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [8, 12, 8],
              }),
              elevation: 4,
              transform: [{
                scale: centralNodePulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              }],
            }
          ]} />
          
          {/* Radial Connections */}
          <Animated.View style={[styles.radialConnection, styles.connectionTop,
            { 
              backgroundColor: isDarkMode ? 'rgba(110,231,183,0.3)' : 'rgba(16,185,129,0.3)',
              opacity: connectionShimmer.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.6, 0.3],
              }),
            }
          ]} />
          <Animated.View style={[styles.radialConnection, styles.connectionTopRight,
            { 
              backgroundColor: isDarkMode ? 'rgba(196,181,253,0.25)' : 'rgba(139,92,246,0.25)',
              opacity: connectionShimmer.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.25, 0.5, 0.25],
              }),
            }
          ]} />
          <Animated.View style={[styles.radialConnection, styles.connectionRight,
            { 
              backgroundColor: isDarkMode ? 'rgba(252,165,165,0.3)' : 'rgba(239,68,68,0.3)',
              opacity: connectionShimmer.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.6, 0.3],
              }),
            }
          ]} />
          <Animated.View style={[styles.radialConnection, styles.connectionBottomRight,
            { 
              backgroundColor: isDarkMode ? 'rgba(251,207,232,0.2)' : 'rgba(236,72,153,0.2)',
              opacity: connectionShimmer.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.4, 0.2],
              }),
            }
          ]} />
          <Animated.View style={[styles.radialConnection, styles.connectionBottom,
            { 
              backgroundColor: isDarkMode ? 'rgba(196,181,253,0.25)' : 'rgba(139,92,246,0.25)',
              opacity: connectionShimmer.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.25, 0.5, 0.25],
              }),
            }
          ]} />
          <Animated.View style={[styles.radialConnection, styles.connectionBottomLeft,
            { 
              backgroundColor: isDarkMode ? 'rgba(110,231,183,0.3)' : 'rgba(16,185,129,0.3)',
              opacity: connectionShimmer.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.3, 0.6, 0.3],
              }),
            }
          ]} />
          
          {/* Satellite Nodes - STATIC */}
          <Animated.View style={[
            styles.satelliteNode, styles.nodeTop,
            { 
              backgroundColor: isDarkMode ? 'rgba(152,251,152,0.9)' : 'rgba(34,197,94,0.9)',
              shadowColor: isDarkMode ? '#98fb98' : '#22c55e',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.8, 1, 0.8],
              }),
              shadowRadius: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [4, 6, 4],
              }),
              transform: [{
                scale: satelliteNodePulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              }],
            }
          ]} />
          <Animated.View style={[
            styles.satelliteNode, styles.nodeTopRight,
            { 
              backgroundColor: isDarkMode ? 'rgba(196,181,253,0.7)' : 'rgba(139,92,246,0.7)',
              shadowColor: isDarkMode ? '#c4b5fd' : '#8b5cf6',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.6, 0.9, 0.6],
              }),
              shadowRadius: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [3, 5, 3],
              }),
              transform: [{
                scale: satelliteNodePulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              }],
            }
          ]} />
          <Animated.View style={[
            styles.satelliteNode, styles.nodeBottomRight,
            { 
              backgroundColor: isDarkMode ? 'rgba(252,165,165,0.8)' : 'rgba(239,68,68,0.8)',
              shadowColor: isDarkMode ? '#fca5a5' : '#ef4444',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.7, 1, 0.7],
              }),
              shadowRadius: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [3, 5, 3],
              }),
              transform: [{
                scale: satelliteNodePulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              }],
            }
          ]} />
          <Animated.View style={[
            styles.satelliteNode, styles.nodeBottomLeft,
            { 
              backgroundColor: isDarkMode ? 'rgba(165,243,252,0.6)' : 'rgba(6,182,212,0.6)',
              shadowColor: isDarkMode ? '#a5f3fc' : '#06b6d4',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 0.8, 0.5],
              }),
              shadowRadius: satelliteNodePulse.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [3, 5, 3],
              }),
              transform: [{
                scale: satelliteNodePulse.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              }],
            }
          ]} />
        </View>

        {/* Flexible Content Layout */}
        <Animated.View
          style={[
            styles.flexibleLayout,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Content Area with Text Wrapping */}
          <Animated.View
            style={[
              styles.contentArea,
              {
                opacity: cardOpacity,
                shadowColor: isDarkMode ? 'rgba(173, 213, 250, 0.4)' : 'rgba(59, 130, 246, 0.1)', // More pronounced glow
                shadowOffset: { width: 0, height: 0 }, // No offset for diffused glow
                shadowOpacity: isDarkMode ? 0.6 : 0.3,
                shadowRadius: isDarkMode ? 20 : 8, // Larger radius for diffused glow
                transform: [
                  { scale: cardScale },
                  { 
                    translateY: cardFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -2],
                    })
                  },
                ],
              },
            ]}
          >
            {/* Step Number Badge */}
            <View style={[
              styles.stepBadge,
              {
                shadowColor: isDarkMode ? 'rgba(152, 251, 152, 0.8)' : 'rgba(34, 197, 94, 0.6)',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: stepBadgeGlow.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.8, 0.3],
                }),
                shadowRadius: stepBadgeGlow.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [4, 10, 4],
                }),
                elevation: 2,
              }
            ]}>
              <Text style={[
                styles.stepNumber,
                { 
                  color: isDarkMode ? '#98fb98' : '#22c55e',
                  textShadowColor: isDarkMode ? 'rgba(152,251,152,0.5)' : 'rgba(34,197,94,0.3)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 4,
                }
              ]}>
                {String(currentStep + 1).padStart(2, '0')}
              </Text>
              <View style={[
                styles.stepDivider,
                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]} />
              <Text style={[
                styles.stepTotal,
                { color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }
              ]}>
                {String(tutorialSteps.length).padStart(2, '0')}
              </Text>
            </View>


            {/* Step Title */}
            <SimpleStreamingText
              text={step.title}
              style={[
                styles.creativeTitle,
                { 
                  color: isDarkMode ? '#ffffff' : '#000000',
                  fontFamily: 'CrimsonPro_600SemiBold',
                  letterSpacing: 0.2,
                }
              ]}
              speed={2}
            />

            {/* Step Description */}
            <SimpleStreamingText
              text={step.description}
              style={[
                styles.creativeDescription,
                { 
                  color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  fontFamily: 'Nunito_400Regular',
                  fontSize: 20,
                  letterSpacing: -0.1,
                  marginTop: 12,
                }
              ]}
              speed={2}
            />


          </Animated.View>

          {/* Icon Container - LOCKED Top Right Position */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                position: 'absolute',
                top: 160,
                right: 24,
                zIndex: 10,
                opacity: cardOpacity,
              },
            ]}
          >
            {/* Neural Processing Core for all steps */}
            <View style={styles.neuralCore}>
              {/* Core Processing Unit */}
              <Animated.View
                style={[
                  styles.processingCore,
                  {
                    transform: [
                      { scale: iconScale },
                      { 
                        translateY: iconFloat.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -1],
                        })
                      },
                    ],
                  }
                ]}
              >
                {currentStep === 0 ? (
                  <LottieView
                    source={require('../../assets/user.json')}
                    autoPlay
                    loop
                    style={{
                      width: 90,
                      height: 90,
                    }}
                  />
                ) : currentStep === 1 ? (
                  <LottieView
                    source={require('../../assets/bubble.json')}
                    autoPlay
                    loop
                    style={{
                      width: 90,
                      height: 90,
                    }}
                  />
                ) : currentStep === 2 ? (
                  <LottieView
                    source={require('../../assets/Green eco earth animation.json')}
                    autoPlay
                    loop
                    style={{
                      width: 90,
                      height: 90,
                    }}
                  />
                ) : currentStep === 3 ? (
                  <LottieView
                    source={require('../../assets/Radar.json')}
                    autoPlay
                    loop
                    style={{
                      width: 90,
                      height: 90,
                    }}
                  />
                ) : currentStep === 4 ? (
                  <LottieView
                    source={require('../../assets/alien.json')}
                    autoPlay
                    loop
                    style={{
                      width: 90,
                      height: 90,
                    }}
                  />
                ) : currentStep === 5 ? (
                  <LottieView
                    source={require('../../assets/stepfinal.json')}
                    autoPlay
                    loop
                    style={{
                      width: 90,
                      height: 90,
                    }}
                  />
                ) : (
                  <Feather
                    name={step.icon as any}
                    size={60}
                    color={isDarkMode ? '#98fb98' : '#22c55e'}
                  />
                )}
              </Animated.View>

              {/* Data Points */}
              <Animated.View style={[
                styles.dataPoint,
                styles.dataPoint1,
                {
                  backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
                  opacity: iconPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.8],
                  }),
                }
              ]} />
              
              <Animated.View style={[
                styles.dataPoint,
                styles.dataPoint2,
                {
                  backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
                  opacity: iconPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 0.6],
                  }),
                  transform: [{
                    scale: iconPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }],
                }
              ]} />
            </View>

            {/* Step-specific Interactive Elements */}
            <View style={styles.stepInteractives}>
              {currentStep === 0 && (
                <Animated.View
                  style={[
                    styles.pulsingOrb,
                    {
                      opacity: iconPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.8],
                      }),
                      transform: [{
                        scale: iconPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        })
                      }],
                    },
                  ]}
                >
                  <View style={[
                    styles.orbCore,
                    { 
                      backgroundColor: isDarkMode ? 'rgba(173, 213, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)',
                      shadowColor: isDarkMode ? '#add5fa' : '#3b82f6',
                    }
                  ]} />
                </Animated.View>
              )}
              
              {currentStep === 1 && (
                <View style={styles.dataNodes}>
                  {[0, 1, 2].map((index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.dataNode,
                        {
                          opacity: ambientPulse1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 0.9],
                          }),
                          transform: [{
                            translateY: ambientPulse1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -5 * (index + 1)],
                            })
                          }],
                          left: 20 + index * 15,
                          top: 10 + index * 8,
                        },
                      ]}
                    >
                      <View style={[
                        styles.nodePoint,
                        { backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6' }
                      ]} />
                    </Animated.View>
                  ))}
                </View>
              )}
              
              {currentStep === 2 && (
                <Animated.View
                  style={[
                    styles.analyticsWave,
                    {
                      opacity: ambientPulse2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 0.9],
                      }),
                      transform: [{
                        scaleX: ambientPulse2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.4],
                        })
                      }],
                    },
                  ]}
                >
                  <View style={[
                    styles.waveBar,
                    { backgroundColor: isDarkMode ? 'rgba(173, 213, 250, 0.6)' : 'rgba(59, 130, 246, 0.5)' }
                  ]} />
                </Animated.View>
              )}
              
              {currentStep === 3 && (
                <View style={styles.connectionWeb}>
                  {[0, 1, 2, 3].map((index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.connectionNode,
                        {
                          opacity: iconPulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 0.8],
                          }),
                          transform: [{
                            rotate: iconPulse.interpolate({
                              inputRange: [0, 1],
                              outputRange: [`${index * 90}deg`, `${index * 90 + 15}deg`],
                            })
                          }],
                          top: 30 + Math.sin(index) * 20,
                          left: 30 + Math.cos(index) * 20,
                        },
                      ]}
                    >
                      <View style={[
                        styles.connectionDot,
                        { backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6' }
                      ]} />
                      <View style={[
                        styles.connectionLine,
                        { backgroundColor: isDarkMode ? 'rgba(173, 213, 250, 0.3)' : 'rgba(59, 130, 246, 0.2)' }
                      ]} />
                    </Animated.View>
                  ))}
                </View>
              )}
              
              {currentStep === 4 && (
                <Animated.View
                  style={[
                    styles.finalGlow,
                    {
                      opacity: cardGlow,
                      transform: [{
                        scale: cardGlow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.5],
                        })
                      }],
                    },
                  ]}
                >
                  <View style={[
                    styles.glowRing,
                    { 
                      borderColor: isDarkMode ? 'rgba(173, 213, 250, 0.8)' : 'rgba(59, 130, 246, 0.6)',
                      shadowColor: isDarkMode ? '#add5fa' : '#3b82f6',
                    }
                  ]} />
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Neumorphic Navigation Bricks */}
          <View style={styles.navigationBrickContainer}>
            {/* Left Brick */}
            <View style={[
              styles.brickShadowContainer,
              isDarkMode ? {
                shadowColor: 'rgba(139, 92, 246, 0.6)', // Purple glow
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
              } : {
                shadowColor: '#000000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
            ]}>
              <Animated.View
                style={[
                  styles.navigationBrick,
                  {
                    backgroundColor: leftBrickPress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        isDarkMode ? '#111111' : '#f0f2f5',
                        isDarkMode ? '#0f1419' : '#eef5ff'
                      ]
                    }),
                  },
                  isDarkMode ? {
                    shadowColor: leftBrickPress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        'rgba(139, 92, 246, 0.8)', // Default glow
                        'rgba(139, 92, 246, 0.4)', // Pressed glow
                      ],
                    }),
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    elevation: 12,
                  } : {
                    shadowColor: '#d1d5db',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  },
                  !isDarkMode && {
                    shadowColor: '#ffffff',
                    shadowOffset: { width: -4, height: -4 },
                    shadowOpacity: 0.7,
                    shadowRadius: 12,
                  }
                ]}
              >
                <TouchableOpacity
                  style={{ width: '100%', height: '100%' }}
                  onPressIn={() => {
                    Animated.timing(leftBrickPress, {
                      toValue: 1,
                      duration: 120,
                      useNativeDriver: false,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.timing(leftBrickPress, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: false,
                    }).start();
                  }}
                  onPress={currentStep > 0 ? handlePrev : onNavigateHome}
                  activeOpacity={1}
                >
                  <View style={[
                    styles.brickRingBorder,
                    {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      shadowColor: isDarkMode ? leftBrickPress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['rgba(255, 255, 255, 0.1)', 'rgba(139, 92, 246, 0.8)'],
                      }) : 'rgba(0, 0, 0, 0.1)',
                      shadowOffset: { width: -2, height: -2 },
                      shadowOpacity: isDarkMode ? leftBrickPress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.4],
                      }) : 1,
                      shadowRadius: isDarkMode ? leftBrickPress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 15],
                      }) : 4,
                    }
                  ]}>
                    <Feather
                      name={currentStep > 0 ? "chevron-left" : "arrow-left"}
                      size={24}
                      color={isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Right Brick */}
            <View style={[
              styles.brickShadowContainer,
              isDarkMode ? {
                shadowColor: 'rgba(139, 92, 246, 0.6)', // Purple glow
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
              } : {
                shadowColor: '#000000',
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
            ]}>
              <Animated.View
                style={[
                  styles.navigationBrick,
                  {
                    backgroundColor: rightBrickPress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        isDarkMode ? '#111111' : '#f0f2f5',
                        isDarkMode ? '#0f1419' : '#eef5ff'
                      ]
                    }),
                  },
                  isDarkMode ? {
                    shadowColor: leftBrickPress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        'rgba(139, 92, 246, 0.8)', // Default glow
                        'rgba(139, 92, 246, 0.4)', // Pressed glow
                      ],
                    }),
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 20,
                    elevation: 12,
                  } : {
                    shadowColor: '#d1d5db',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  },
                  !isDarkMode && {
                    shadowColor: '#ffffff',
                    shadowOffset: { width: -4, height: -4 },
                    shadowOpacity: 0.7,
                    shadowRadius: 12,
                  }
                ]}
              >
                <TouchableOpacity
                  style={{ width: '100%', height: '100%' }}
                  onPressIn={() => {
                    Animated.timing(rightBrickPress, {
                      toValue: 1,
                      duration: 120,
                      useNativeDriver: false,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.timing(rightBrickPress, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: false,
                    }).start();
                  }}
                  onPress={() => {
                    if (isLastStep) {
                      handleFinish();
                    } else {
                      handleNext();
                    }
                  }}
                  activeOpacity={1}
                >
                  <View style={[
                    styles.brickRingBorder,
                    {
                      borderColor: isDarkMode ? 'rgba(110, 197, 255, 0.4)' : 'rgba(59, 130, 246, 0.3)',
                      shadowColor: isDarkMode ? rightBrickPress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#add5fa', '#3b82f6'],
                      }) : '#add5fa',
                      shadowOffset: { width: -2, height: -2 },
                      shadowOpacity: isDarkMode ? rightBrickPress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 0.8],
                      }) : 0.3,
                      shadowRadius: isDarkMode ? rightBrickPress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [6, 15],
                      }) : 6,
                    }
                  ]}>
                    {isLastStep ? (
                      <Text style={[
                        styles.brickText,
                        { 
                          color: isDarkMode ? '#98fb98' : '#22c55e',
                  textShadowColor: isDarkMode ? 'rgba(152,251,152,0.3)' : 'rgba(34,197,94,0.2)',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 2,
                          fontWeight: '600',
                        }
                      ]}>
                        Start
                      </Text>
                    ) : (
                      <Feather
                        name="chevron-right"
                        size={24}
                        color={isDarkMode ? '#98fb98' : '#22c55e'}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
        
        {/* Bottom Liquid Bar - Absolute positioning */}
        <Animated.View style={[styles.bottomLiquidBar, { opacity: fadeAnim }]}>
          <LiquidProgress
            currentStep={currentStep}
            totalSteps={tutorialSteps.length}
            liquidFlow={liquidFlow}
            liquidBubbles={liquidBubbles}
            liquidWave={liquidWave}
            liquidShimmer={liquidShimmer}
          />
        </Animated.View>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Organized Neural Network Background
  neuralNetworkBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Central Hub Node
  centralNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Radial Connections
  radialConnection: {
    position: 'absolute',
    height: 1,
    borderRadius: 0.5,
  },
  connectionTop: {
    width: 60,
    top: -30,
    left: -30,
    transform: [{ rotate: '90deg' }],
  },
  connectionTopRight: {
    width: 50,
    top: -25,
    left: 10,
    transform: [{ rotate: '45deg' }],
  },
  connectionRight: {
    width: 70,
    top: -0.5,
    left: 4,
    transform: [{ rotate: '0deg' }],
  },
  connectionBottomRight: {
    width: 55,
    top: 20,
    left: 15,
    transform: [{ rotate: '-45deg' }],
  },
  connectionBottom: {
    width: 45,
    top: 30,
    left: -22.5,
    transform: [{ rotate: '90deg' }],
  },
  connectionBottomLeft: {
    width: 65,
    top: 15,
    left: -50,
    transform: [{ rotate: '135deg' }],
  },
  
  // Satellite Nodes
  satelliteNode: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  nodeTop: {
    top: -60,
    left: -2,
  },
  nodeTopRight: {
    top: -35,
    left: 35,
  },
  nodeBottomRight: {
    top: 35,
    left: 40,
  },
  nodeBottomLeft: {
    top: 25,
    left: -65,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tutorialContainer: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    width: 108,
    height: 108,
    justifyContent: 'center',
    alignItems: 'center',
    // Position is now set inline to be absolute
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'left',
    letterSpacing: -1,
    fontFamily: 'Nunito_700Bold',
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    marginBottom: 24,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  featuresList: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Nunito_500Medium',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.5,
    fontFamily: 'Nunito_500Medium',
  },
  secondaryButton: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flex: 0.4,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  
  // LOCKED Layout Styles - Fixed positioning
  flexibleLayout: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 200,
    paddingBottom: 32,
    position: 'relative',
    justifyContent: 'flex-start',
  },
  contentArea: {
    height: 280,
    width: '70%', // Fixed width instead of padding
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    zIndex: 5,
    position: 'relative',
  },
  navigationBrickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 200,
    paddingHorizontal: 20,
  },
  brickShadowContainer: {
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navigationBrick: {
    width: 120,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  brickRingBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brickText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: -0.2,
  },
  finishButton: {
    width: 80,
    paddingHorizontal: 16,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily: 'Nunito_600SemiBold',
  },
  connectedButtonContainer: {
    width: '100%',
    marginTop: 60,
  },
  buttonPair: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  leftButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  rightButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.3,
    fontFamily: 'Nunito_500Medium',
  },
  
  // Step Badge
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(173, 213, 250, 0.15)',
    position: 'absolute',
    top: 60,
    left: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(152, 251, 152, 0.6)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  stepDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
  },
  stepTotal: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  
  // Creative Content
  contextualHeading: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'CrimsonPro_600SemiBold',
    letterSpacing: -0.6,
    marginBottom: 24,
    textAlign: 'left',
    lineHeight: 32,
  },
  creativeTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'CrimsonPro_700Bold',
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 16,
    textAlign: 'left',
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
  },
  creativeDescription: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'left',
    position: 'absolute',
    top: 220,
    left: 0,
    right: 0,
    minHeight: 120,
  },
  
  // Creative Buttons
  creativeButtonContainer: {
    width: '100%',
    gap: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  navSpacer: {
    flex: 1,
  },
  
  // Neural Processing Core - LOCKED position
  neuralCore: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Removed marginBottom to prevent layout shifts
  },
  processingCore: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  
  // Data Processing Points
  dataPoint: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  dataPoint1: {
    top: 16,
    right: 18,
  },
  dataPoint2: {
    bottom: 20,
    left: 14,
  },
  
  // Progress Visualization
  progressVisualization: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  progressLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressSegment: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },

  // Step-specific Interactive Elements
  stepInteractives: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 100,
    height: 100,
    zIndex: 1,
  },
  
  // Step 0: Pulsing Orb
  pulsingOrb: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 20,
    right: 20,
  },
  orbCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Step 1: Data Nodes
  dataNodes: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 80,
    height: 60,
  },
  dataNode: {
    position: 'absolute',
    width: 6,
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  
  // Step 2: Analytics Wave
  analyticsWave: {
    position: 'absolute',
    top: 40,
    right: 10,
    width: 60,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBar: {
    width: 50,
    height: 3,
    borderRadius: 2,
  },
  
  // Step 3: Connection Web
  connectionWeb: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 80,
    height: 80,
  },
  connectionNode: {
    position: 'absolute',
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  connectionLine: {
    position: 'absolute',
    width: 20,
    height: 1,
    top: 1,
    left: 3,
    borderRadius: 0.5,
  },
  
  // Step 4: Final Glow
  finalGlow: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
  },
  
  // Bottom Liquid Bar - Absolute positioning
  bottomLiquidBar: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    transform: [{ translateX: -width * 0.5 }],
    height: 16,
    width: width * 1.6,
    zIndex: 15,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});