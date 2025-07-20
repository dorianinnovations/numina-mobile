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
    title: "Disconnected Tools",
    description: "Right now, your tools are disconnected. A weather app that doesn't know your travel plans. A music app that misses your mood. Each is a separate conversation, starting from scratch every time. It's digital noise.",
    icon: "shuffle"
  },
  {
    id: 2,
    title: "One Continuous Conversation",
    description: "Numina is different. It's one continuous conversation that gets smarter with every interaction.",
    icon: "message-circle"
  },
  {
    id: 3,
    title: "Seamless Integration",
    description: "Ask for a coffee shop recommendation and the weather for your walk there—in the same breath. It remembers, adapts, and works seamlessly, whether you're online or on a flight.",
    icon: "map-pin"
  },
  {
    id: 4,
    title: "Beyond Convenience",
    description: "This is about more than convenience; it's about clarity. By unifying your tasks, Numina provides a space to be more productive while also uncovering insights about how you think.",
    icon: "trending-up"
  },
  {
    id: 5,
    title: "Start Your Conversation",
    description: "Stop juggling apps and start a single conversation that's always on your side.",
    icon: "send"
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
  
  
  // Ambient background animations
  const ambientPulse1 = useRef(new Animated.Value(0)).current;
  const ambientPulse2 = useRef(new Animated.Value(0)).current;
  const ambientFloat = useRef(new Animated.Value(0)).current;

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
          toValue: 1.02,
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
          toValue: 1.15,
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

  // Focus effect to reinitialize animations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      initializeAnimations();
    }, [currentStep])
  );

  // entrance sequence
  useEffect(() => {
    initializeAnimations();
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
          toValue: 1.08,
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
      
    }
  }, [currentStep]);
  
  
  // Continuous ambient pleasure animations
  const startAmbientAnimations = () => {
    // Subtle card float
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, {
          toValue: 1,
          duration: 4000,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
        Animated.timing(cardFloat, {
          toValue: 0,
          duration: 4000,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Icon breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 2500,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 0,
          duration: 2500,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Ambient background pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse1, {
          toValue: 1,
          duration: 6000,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
        Animated.timing(ambientPulse1, {
          toValue: 0,
          duration: 6000,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse2, {
          toValue: 1,
          duration: 8000,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
        Animated.timing(ambientPulse2, {
          toValue: 0,
          duration: 8000,
          easing: PLEASURE_EASING.breathe,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Smooth button interactions
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      // Gentle tutorial haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Subtle scale animation
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
      
      // Step change
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 50);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      // Gentle back haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Subtle scale animation
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
      
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
      }, 50);
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

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

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
          showAuthOptions={false}
          onBackPress={() => {
            onNavigateHome();
          }}
          onTitlePress={onTitlePress}
          onMenuPress={onMenuPress}
        />

        {/* Numina Neural Background */}
        <Animated.View style={[styles.neuralBackground, { opacity: ambientPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] }) }]}>
          {/* Synaptic Network */}
          <Animated.View style={[
            styles.synapticNode,
            styles.synapticNode1,
            { 
              backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
              transform: [{
                scale: ambientPulse1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                })
              }]
            }
          ]} />
          <View style={[
            styles.synapticConnection,
            styles.connection1,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.3)' : 'rgba(59,130,246,0.3)' }
          ]} />
        </Animated.View>
        
        <Animated.View style={[styles.neuralBackground, { 
          opacity: ambientPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
          transform: [{
            translateY: ambientFloat.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -8],
            })
          }]
        }]}>
          {/* Emotional Wavelength */}
          <View style={[
            styles.emotionalWave,
            styles.emotionalWave1,
            { backgroundColor: isDarkMode ? 'rgba(173,213,250,0.2)' : 'rgba(59,130,246,0.2)' }
          ]} />
          <Animated.View style={[
            styles.emotionalWave,
            styles.emotionalWave2,
            { 
              backgroundColor: isDarkMode ? 'rgba(173,213,250,0.15)' : 'rgba(59,130,246,0.15)',
              transform: [{
                scaleX: ambientPulse2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.3],
                })
              }]
            }
          ]} />
        </Animated.View>
        
        <Animated.View style={[styles.neuralBackground, { 
          opacity: ambientPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] }),
          transform: [{
            rotate: ambientPulse1.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '15deg'],
            })
          }]
        }]}>
          {/* Memory Fragment */}
          <View style={[
            styles.memoryFragment,
            { 
              backgroundColor: isDarkMode ? 'rgba(173,213,250,0.1)' : 'rgba(59,130,246,0.1)',
              borderColor: isDarkMode ? 'rgba(173,213,250,0.2)' : 'rgba(59,130,246,0.2)',
            }
          ]} />
        </Animated.View>

        {/* Flexible Content Layout */}
        <Animated.View
          style={[
            styles.flexibleLayout,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
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
            <Text style={[
              styles.creativeTitle,
              { color: isDarkMode ? '#ffffff' : '#000000' }
            ]}>
              {step.title}
            </Text>

            {/* Description */}
            <Text style={[
              styles.creativeDescription,
              { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }
            ]}>
              {step.description}
            </Text>


          </Animated.View>

          {/* Visual Element - Positioned Absolutely */}
          <Animated.View
            style={[
              styles.visualElement,
              {
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

            {/* Progress Visualization */}
            <View style={styles.progressVisualization}>
              {tutorialSteps.map((_, index) => (
                <View key={index} style={styles.progressLine}>
                  <Animated.View
                    style={[
                      styles.progressSegment,
                      {
                        backgroundColor: index <= currentStep 
                          ? (isDarkMode ? '#add5fa' : '#3b82f6')
                          : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        transform: [{ scale: progressAnims[index] }],
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Connected Button Pair */}
          <View style={styles.connectedButtonContainer}>
            <View style={[
              styles.buttonPair,
              {
                borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              }
            ]}>
              {/* Left Button */}
              {currentStep > 0 ? (
                <TouchableOpacity
                  style={[
                    styles.leftButton,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
                    }
                  ]}
                  onPress={handlePrev}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }
                  ]}>
                    ← Back
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.leftButton,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onStartChat();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }
                  ]}>
                    Skip
                  </Text>
                </TouchableOpacity>
              )}

              {/* Right Button */}
              <TouchableOpacity
                style={[
                  styles.rightButton,
                  {
                    backgroundColor: '#add5fa',
                  }
                ]}
                onPress={() => {
                  if (isLastStep) {
                    handleFinish();
                  } else {
                    handleNext();
                  }
                }}
                activeOpacity={0.9}
              >
                <Text style={[
                  styles.buttonText,
                  { 
                    color: isDarkMode ? NuminaColors.darkMode[600] : '#ffffff',
                    fontWeight: '600'
                  }
                ]}>
                  {isLastStep ? 'Start Conversation' : 'Continue →'}
                </Text>
              </TouchableOpacity>
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
  // Numina Neural Background Elements
  neuralBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  
  // Synaptic Network
  synapticNode: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  synapticNode1: {
    top: '25%',
    left: '12%',
  },
  synapticConnection: {
    position: 'absolute',
    height: 1,
  },
  connection1: {
    top: '25%',
    left: '12%',
    width: 120,
    transform: [{ rotate: '35deg' }],
  },
  
  // Emotional Wavelengths
  emotionalWave: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  emotionalWave1: {
    top: '60%',
    right: '8%',
    width: 80,
    transform: [{ rotate: '-12deg' }],
  },
  emotionalWave2: {
    top: '62%',
    right: '10%',
    width: 60,
    transform: [{ rotate: '-12deg' }],
  },
  
  // Memory Fragments
  memoryFragment: {
    position: 'absolute',
    top: '45%',
    right: '25%',
    width: 32,
    height: 24,
    borderRadius: 3,
    borderWidth: 1,
    transform: [{ rotate: '8deg' }],
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
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
    fontFamily: 'Nunito_700Bold',
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
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
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  
  // Flexible Layout Styles
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
    paddingRight: 120,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    zIndex: 10,
    maxWidth: '100%',
  },
  visualElement: {
    position: 'absolute',
    top: '35%',
    right: 24,
    transform: [{ translateY: -60 }],
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  stepDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 8,
  },
  stepTotal: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  
  // Creative Content
  contextualHeading: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'CrimsonPro_600SemiBold',
    letterSpacing: -1,
    marginBottom: 24,
    textAlign: 'left',
    lineHeight: 34,
  },
  creativeTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'CrimsonPro_700Bold',
    letterSpacing: -1.2,
    marginBottom: 16,
    textAlign: 'left',
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
  },
  creativeDescription: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'left',
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    height: 120,
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
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  navSpacer: {
    flex: 1,
  },
  
  // Neural Processing Core (2055 Design)
  neuralCore: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 32,
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


});