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
    title: "Learn from your patterns",
    description: "Start chatting naturally, Numina learns your communication style in real-time—adapting its responses to match your pace and preferences while intelligently keeping track of the important context",
    icon: "grid"
  },
  {
    id: 2,
    title: "UBPM",
    description: "The User Behavior Profile Model empowers already exceptional AI platforms like GPT-4o and Claude Opus to intelligently understand your unique patterns, preferences, and behavioral nuances in a profound way.",
    icon: "layers"
  },
  {
    id: 3,
    title: "Analytics",
    description: "Take a peek at your analytics at any time to see what is being added to the contextual pool of your important data.",
    icon: "bar-chart-2"
  },
  {
    id: 4,
    title: "Connect",
    description: "Using real context you create, get connected with other users who share your interests and preferences, or discover potential new matches through intelligent compatibility patterns that reveal unexpected connections.",
    icon: "users"
  },
  {
    id: 5,
    title: "Privacy & Data",
    description: "Your data, your call, end of story. We value your privacy, and make it our mission to never sell your data to anyone. ",
    icon: "map"
  },
  {
    id: 6,
    title: "Start for free",
    description: "Start collecting insights, explore new connections, and begin to meet your true self.",
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
  
  // Text content animations
  const textOpacity = useRef(new Animated.Value(1)).current;
  const textScale = useRef(new Animated.Value(1)).current;
  
  // Ambient background animations with locked initial state
  const ambientPulse1 = useRef(new Animated.Value(0.4)).current;
  const ambientPulse2 = useRef(new Animated.Value(0.6)).current;
  const ambientFloat = useRef(new Animated.Value(0)).current;
  
  // Flag to track if animations have been initialized to prevent re-initialization
  const [isInitialized, setIsInitialized] = useState(false);


  // Initialize animations function
  const initializeAnimations = () => {
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

  // Focus effect - only initialize once, don't reset on focus to prevent layout shifts
  useFocusEffect(
    React.useCallback(() => {
      if (!isInitialized) {
        initializeAnimations();
        setIsInitialized(true);
      }
    }, [isInitialized, currentStep])
  );

  // entrance sequence - only run once
  useEffect(() => {
    if (!isInitialized) {
      initializeAnimations();
      setIsInitialized(true);
    }
  }, [isInitialized]);

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
  
  
  // Locked ambient animations for stable layout
  const startAmbientAnimations = () => {
    // Only set values if not already initialized to prevent layout shifts
    if (!isInitialized) {
      cardFloat.setValue(0);
      iconPulse.setValue(0.5);
      ambientPulse1.setValue(0.4);
      ambientPulse2.setValue(0.6);
      cardGlow.setValue(0.3);
      
      // Disabled liquid animations to prevent overheating
      liquidWave.setValue(0);
      liquidShimmer.setValue(0);
    }
  };

  // Smooth button interactions with streaming text
  const handleNext = async () => {
    if (currentStep < tutorialSteps.length - 1) {
      // Check if advancing to the last step for success haptics
      const nextStep = currentStep + 1;
      if (nextStep === tutorialSteps.length - 1) {
        // Success haptic when reaching final step
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Gentle tutorial haptic for other steps
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      // Gentle back haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
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
    // Success haptic for completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
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
          backgroundColor="transparent"
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
          <View style={[
            styles.centralNode,
            { 
              backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
            }
          ]} />
          
          {/* Radial Connections */}
          <View style={[styles.radialConnection, styles.connectionTop,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.25)' : 'rgba(59,130,246,0.25)' }]} />
          <View style={[styles.radialConnection, styles.connectionTopRight,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.2)' : 'rgba(59,130,246,0.2)' }]} />
          <View style={[styles.radialConnection, styles.connectionRight,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.3)' : 'rgba(59,130,246,0.3)' }]} />
          <View style={[styles.radialConnection, styles.connectionBottomRight,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.15)' : 'rgba(59,130,246,0.15)' }]} />
          <View style={[styles.radialConnection, styles.connectionBottom,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.2)' : 'rgba(59,130,246,0.2)' }]} />
          <View style={[styles.radialConnection, styles.connectionBottomLeft,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.25)' : 'rgba(59,130,246,0.25)' }]} />
          
          {/* Satellite Nodes - STATIC */}
          <View style={[
            styles.satelliteNode, styles.nodeTop,
            { 
              backgroundColor: isDarkMode ? 'rgba(173,213,250,0.8)' : 'rgba(59,130,246,0.8)',
            }
          ]} />
          <View style={[
            styles.satelliteNode, styles.nodeTopRight,
            { 
              backgroundColor: isDarkMode ? 'rgba(173,213,250,0.6)' : 'rgba(59,130,246,0.6)',
            }
          ]} />
          <View style={[
            styles.satelliteNode, styles.nodeBottomRight,
            { 
              backgroundColor: isDarkMode ? 'rgba(173,213,250,0.7)' : 'rgba(59,130,246,0.7)',
            }
          ]} />
          <View style={[
            styles.satelliteNode, styles.nodeBottomLeft,
            { 
              backgroundColor: isDarkMode ? 'rgba(173,213,250,0.5)' : 'rgba(59,130,246,0.5)',
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
            <View style={styles.stepBadge}>
              <Text style={[
                styles.stepNumber,
                { color: isDarkMode ? '#add5fa' : '#3b82f6' }
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
                  letterSpacing: -0.5,
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
              {/* Scanning Grid */}
              <View style={[
                styles.scanningGrid,
                {
                  borderColor: isDarkMode ? 'rgba(173, 213, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                }
              ]}>
                {/* Grid Lines */}
                <View style={[styles.gridLine, styles.gridHorizontal, { backgroundColor: isDarkMode ? 'rgba(173, 213, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]} />
                <View style={[styles.gridLine, styles.gridVertical, { backgroundColor: isDarkMode ? 'rgba(173, 213, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)' }]} />
              </View>
              
              {/* Core Processing Unit */}
              <Animated.View
                style={[
                  styles.processingCore,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.9)',
                    borderColor: isDarkMode ? 'rgba(173, 213, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                    transform: [
                      { scale: iconScale },
                      { 
                        translateY: iconFloat.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -1],
                        })
                      },
                    ],
                  },
                ]}
              >
                <Feather
                  name={step.icon as any}
                  size={28}
                  color={isDarkMode ? '#add5fa' : '#3b82f6'}
                />
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

          {/* Floating Chevron Buttons */}
          <View style={styles.floatingButtonContainer}>
            {/* Left Button */}
            <TouchableOpacity
              style={styles.glowingChevron}
              onPress={currentStep > 0 ? handlePrev : onNavigateHome}
              activeOpacity={0.6}
            >
              <Feather
                name={currentStep > 0 ? "chevron-left" : "arrow-left"}
                size={36}
                color={isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'}
                style={{
                  shadowColor: isDarkMode ? '#ffffff' : '#000000',
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              />
            </TouchableOpacity>

            {/* Right Button */}
            <TouchableOpacity
              style={styles.glowingChevron}
              onPress={() => {
                if (isLastStep) {
                  handleFinish();
                } else {
                  handleNext();
                }
              }}
              activeOpacity={0.6}
            >
              {isLastStep ? (
                <Text style={[
                  styles.finishButtonText,
                  { 
                    color: isDarkMode ? '#add5fa' : '#add5fa',
                    fontWeight: '600',
                    shadowColor: '#add5fa',
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                  }
                ]}>
                  Start
                </Text>
              ) : (
                <Feather
                  name="chevron-right"
                  size={36}
                  color="#add5fa"
                  style={{
                    shadowColor: '#add5fa',
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                />
              )}
            </TouchableOpacity>
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
    fontSize: 35,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
    fontFamily: 'Nunito_700Bold',
  },
  stepDescription: {
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
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
  floatingButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 200,
    paddingHorizontal: 40,
  },
  glowingChevron: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(173, 213, 250, 0.1)',
    position: 'absolute',
    top: 60,
    left: 0,
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
    fontSize: 35,
    fontWeight: '600',
    fontFamily: 'CrimsonPro_600SemiBold',
    letterSpacing: -1,
    marginBottom: 24,
    textAlign: 'left',
    lineHeight: 34,
  },
  creativeTitle: {
    fontSize: 45,
    fontWeight: '700',
    fontFamily: 'CrimsonPro_700Bold',
    letterSpacing: -1.2,
    lineHeight: 50,
    marginBottom: 16,
    textAlign: 'left',
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
  },
  creativeDescription: {
    fontSize: 21,
    lineHeight: 28,
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
  scanningGrid: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderWidth: 1,
    borderRadius: 2,
  },
  gridLine: {
    position: 'absolute',
  },
  gridHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
    left: 0,
  },
  gridVertical: {
    width: 1,
    height: '100%',
    top: 0,
    left: '50%',
  },
  processingCore: {
    width: 56,
    height: 56,
    borderRadius: 4,
    borderWidth: 1,
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