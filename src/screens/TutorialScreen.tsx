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
import { SimpleStreamingText } from '../components/SimpleStreamingText';
import { NuminaColors } from '../utils/colors';
import { BlurView } from 'expo-blur';
import { ShineEffect } from '../components/ShineEffect';

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

  // --- MAIN RENDER ---
  const mainChildren = (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={isDarkMode ? '#0a0a0a' : 'transparent'}
          translucent={true}
        />
        <Header 
          title="Numina"
          showBackButton={true}
          showMenuButton={true}
          showAuthOptions={false}
          onBackPress={onNavigateHome}
          onTitlePress={onTitlePress}
          onMenuPress={onMenuPress}
        />
        {/* Main Content Area - Only step title/description and navigation */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {/* Glassy mysterious card with shine, border, and neumorphic shadow, matching sign up card, no fixed height */}
          <View style={{
            width: '100%',
            maxWidth: 420,
            minHeight: width > 600 ? 500 : 420,
            borderRadius: 16,
            overflow: 'visible',
            borderWidth: isDarkMode ? 1.3 : 1,
            borderColor: isDarkMode ? '#181818' : 'rgba(255,255,255,0.35)',
            shadowColor: '#000',
            shadowOffset: isDarkMode ? { width: 0, height: 6 } : { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.7 : 0.06,
            shadowRadius: isDarkMode ? 16 : 8,
            elevation: isDarkMode ? 18 : 3,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}>
            <BlurView intensity={40} tint={isDarkMode ? 'dark' : 'light'} style={{
              width: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? '#0a0a0a' : 'rgba(255,255,255,0.22)',
              padding: 16,
            }}>
              {/* Shine shimmer effect overlay */}
              <ShineEffect enabled />
              {/* Step indicator (minimalistic maximism) */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 0, marginBottom: 18, gap: 10 }}>
                {tutorialSteps.map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: currentStep === idx ? 22 : 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: currentStep === idx
                        ? (isDarkMode ? '#1e2d24' : '#1bb98a')
                        : (isDarkMode ? 'rgba(180,200,200,0.18)' : '#e0e0e0'),
                      marginHorizontal: 2,
                    }}
                  />
                ))}
              </View>
              {/* Lottie animation with mysterious glow */}
              <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 0, marginBottom: 0 }}>
                <View style={{
                  position: 'absolute',
                  top: 10,
                  left: '50%',
                  marginLeft: -60,
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: isDarkMode ? 'rgba(44,54,50,0.18)' : 'rgba(27,185,138,0.08)',
                  shadowColor: isDarkMode ? '#23272b' : '#1bb98a',
                  shadowOpacity: 0.18,
                  shadowRadius: 32,
                  shadowOffset: { width: 0, height: 0 },
                  zIndex: 0,
                }} />
                {currentStep === 0 && (
                  <LottieView
                    source={require('../../assets/user.json')}
                    autoPlay
                    loop
                    style={{ width: 132, height: 132, zIndex: 1 }}
                  />
                )}
                {currentStep === 1 && (
                  <LottieView
                    source={require('../../assets/bubble.json')}
                    autoPlay
                    loop
                    style={{ width: 132, height: 132, zIndex: 1 }}
                  />
                )}
                {currentStep === 2 && (
                  <LottieView
                    source={require('../../assets/Green eco earth animation.json')}
                    autoPlay
                    loop
                    style={{ width: 132, height: 132, zIndex: 1 }}
                  />
                )}
                {currentStep === 3 && (
                  <LottieView
                    source={require('../../assets/Radar.json')}
                    autoPlay
                    loop
                    style={{ width: 132, height: 132, zIndex: 1 }}
                  />
                )}
                {currentStep === 4 && (
                  <LottieView
                    source={require('../../assets/alien.json')}
                    autoPlay
                    loop
                    style={{ width: 132, height: 132, zIndex: 1 }}
                  />
                )}
                {currentStep === 5 && (
                  <LottieView
                    source={require('../../assets/stepfinal.json')}
                    autoPlay
                    loop
                    style={{ width: 132, height: 132, zIndex: 1 }}
                  />
                )}
              </View>
              {/* Divider between Lottie and title */}
              <View style={{ width: '100%', height: 1, backgroundColor: isDarkMode ? 'rgba(180,200,200,0.10)' : '#e0e0e0', marginVertical: 24 }} />
              {/* Accent bar and left-aligned title/description */}
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, marginTop: 0, paddingHorizontal: 32 }}>
                <View style={{ width: 6, height: 60, borderRadius: 4, backgroundColor: isDarkMode ? '#1e2d24' : '#1bb98a', marginRight: 18, marginTop: 2 }} />
                <Text style={{
                  fontSize: 29,
                  fontWeight: '800',
                  color: isDarkMode ? '#e6e6e6' : '#23272b',
                  textAlign: 'left',
                  fontFamily: 'CrimsonPro_700Bold',
                  letterSpacing: -0.5,
                  flex: 1,
                  textShadowColor: isDarkMode ? 'rgba(30,30,30,0.32)' : 'rgba(200,255,220,0.08)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                  marginTop: 2,
                }}>
                  {tutorialSteps[currentStep].title}
                </Text>
              </View>
              <Text style={{
                fontSize: 17,
                color: isDarkMode ? '#b0b8c6' : '#8a939b',
                textAlign: 'left',
                fontWeight: '400',
                fontFamily: 'Nunito_400Regular',
                lineHeight: 26,
                width: '100%',
                paddingHorizontal: 16,
                marginBottom: 24,
                marginLeft: 0,
              }}>
                {tutorialSteps[currentStep].description}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', gap: 18, paddingHorizontal: 32, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (currentStep === 0) {
                      onNavigateHome();
                    } else {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: currentStep === 0 ? (isDarkMode ? '#23272b' : '#e5e7eb') : (isDarkMode ? '#23272b' : '#e0e0e0'),
                    borderRadius: 8,
                    paddingVertical: 14,
                    alignItems: 'center',
                    shadowColor: isDarkMode ? '#23272b' : '#1bb98a',
                    shadowOpacity: currentStep === 0 ? 0.08 : 0.16,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    opacity: currentStep === 0 ? 0.5 : 1,
                    minWidth: 110,
                    maxWidth: 180,
                  }}
                  disabled={currentStep === 0}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: currentStep === 0 ? (isDarkMode ? '#666' : '#888') : (isDarkMode ? '#e6e6e6' : '#23272b'), fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (currentStep === tutorialSteps.length - 1) {
                      onStartChat();
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: isDarkMode ? '#1e2d24' : '#1bb98a',
                    borderRadius: 8,
                    paddingVertical: 14,
                    alignItems: 'center',
                    shadowColor: isDarkMode ? '#23272b' : '#1bb98a',
                    shadowOpacity: 0.16,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    minWidth: 110,
                    maxWidth: 180,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: isDarkMode ? '#e6e6e6' : '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 }}>
                    {currentStep === tutorialSteps.length - 1 ? 'Start' : 'Next'}
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  // Log the type and value of what is being passed as children
  let isValidNode = React.isValidElement(mainChildren) || typeof mainChildren === 'string' || typeof mainChildren === 'number' || Array.isArray(mainChildren);
  if (!isValidNode) {
    console.warn('TutorialScreen: mainChildren is not a valid React node. Rendering fallback error UI.', mainChildren);
    return (
      <PageBackground style={{ flex: 1, position: 'relative' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red', fontSize: 18 }}>TutorialScreen: Invalid content. Please contact support.</Text>
        </View>
      </PageBackground>
    );
  }

  return (
    <PageBackground style={{ flex: 1, position: 'relative' }}>
      {mainChildren}
    </PageBackground>
  );
};

export default TutorialScreen;

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