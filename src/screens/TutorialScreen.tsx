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
const getFeatureDescription = (feature: string, stepId: number): string => {
  const descriptions: { [key: string]: string } = {
    "Real-time behavioral analysis": "AI learns your communication style, decision patterns, and preferences as you interact",
    "Adaptive AI personality": "Your assistant's tone and approach evolves to match your personality and mood",
    "Pattern recognition engine": "Identifies recurring themes in your conversations and behavioral tendencies",
    "Predictive insights": "Anticipates your needs and suggests relevant information before you ask",
    
    // AI Tools
    "Web search & research": "Access real-time information from across the internet with intelligent summarization",
    "Real-time data lookup": "Get live updates on stocks, crypto, weather, news, and market data instantly",
    "Content generation": "Create text, code, emails, and creative content with context-aware AI assistance",
    "Smart automation": "Automate repetitive tasks with natural language commands and intelligent workflows",
    
    // Emotional Analytics
    "Weekly emotion reports": "Comprehensive analysis of your emotional patterns with visual insights and trends",
    "Stress pattern detection": "Identify triggers, peak stress times, and environmental factors affecting your mood",
    "Growth recommendations": "Personalized suggestions for emotional wellness and personal development",
    "Mood correlation insights": "Understand how your emotions relate to activities, people, and life events"
  };
  
  return descriptions[feature] || "Advanced AI capabilities designed to enhance your digital experience";
};

// Tutorial steps with authentic mass-appeal messaging
const tutorialSteps = [
  {
    id: 1,
    title: "Numina Actually Knows You",
    description: "While others track surface metrics, Numina learns how you really think. Not invasive—just observant. Like a good friend who remembers what matters.",
    icon: "activity",
    features: [
      "Real personality understanding",
      "Privacy-first intelligence",
      "Growth insights that matter"
    ]
  },
  {
    id: 2,
    title: "Just Talk Normally",
    description: "No commands to learn. Say 'find pizza and check the weather'—Numina handles both in one response. 25+ tools working invisibly.",
    icon: "tool",
    features: [
      "Natural conversation works",
      "25+ tools, zero syntax",
      "Real-time streaming results"
    ]
  },
  {
    id: 3,
    title: "Remembers What Matters",
    description: "Every conversation builds on the last. Your preferences, goals, context—remembered smartly while keeping costs low for everyone.",
    icon: "clock",
    features: [
      "Context that helps",
      "Smart cost optimization",
      "Memory that grows with you"
    ]
  },
  {
    id: 4,
    title: "Fast Enough to Keep Up",
    description: "Enterprise-grade performance, personal pricing. Sub-second responses because waiting kills conversations.",
    icon: "zap",
    features: [
      "Under 1-second responses",
      "Enterprise performance",
      "85% instant cache hits"
    ]
  },
  {
    id: 5,
    title: "Your Thinking Partner",
    description: "Not replacing human connection—supporting it. Real intelligence, real help, whenever you're ready to begin.",
    icon: "heart",
    features: [
      "Always here, never pushy",
      "Real conversations, real results",
      "Ready when you are"
    ]
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
  
  // Feature list stagger animations with flying neural connectors
  const featureAnims = useRef([0, 1, 2].map((_, index) => ({
    opacity: new Animated.Value(0),
    translateY: new Animated.Value(15),
    scale: new Animated.Value(0.95),
    connectorGlow: new Animated.Value(0),
    connectorPulse: new Animated.Value(0),
    connectorWidth: new Animated.Value(0),
    neuralSpark: new Animated.Value(0),
    // Orderly erratic values - each connector has unique behavior
    erraticFlicker: new Animated.Value(0),
    erraticPulse: new Animated.Value(0),
    erraticGlow: new Animated.Value(0),
    // Flying and movement animations
    flyingX: new Animated.Value(0),
    flyingY: new Animated.Value(0),
    flyingRotate: new Animated.Value(0),
    flyingScale: new Animated.Value(1),
    neuralFlow: new Animated.Value(0),
    orbitAngle: new Animated.Value(0),
    dimensionalShift: new Animated.Value(0),
    particleTrail: new Animated.Value(0),
    waveRipple: new Animated.Value(0),
    // Unique timing per connector based on index
    baseDelay: 800 + (index * 400), // 800ms, 1200ms, 1600ms, 2000ms
    flickerInterval: 1500 + (index * 300), // Varying flicker speeds
    pulseOffset: index * 0.25, // Phase offset for wave effect
    flyingPattern: index % 4, // 0=circular, 1=figure8, 2=spiral, 3=chaotic
  }))).current;
  
  // Ambient background animations
  const ambientPulse1 = useRef(new Animated.Value(0)).current;
  const ambientPulse2 = useRef(new Animated.Value(0)).current;
  const ambientFloat = useRef(new Animated.Value(0)).current;

  // Ultra-smooth entrance sequence
  useEffect(() => {
    fadeAnim.setValue(1);
    ScreenTransitions.slideInLeft(slideAnim);
    
    // Instant card appearance with pleasure bounce
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
    
    // Instant icon with elastic pleasure
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
    
    // Animate progress dots with stagger
    progressAnims.forEach((anim, index) => {
      if (index === 0) {
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
    
    // Stagger feature animations
    setTimeout(() => {
      animateFeatures();
    }, PLEASURE_TIMINGS.ELEGANT);
    
    // Start ambient animations
    startAmbientAnimations();
  }, []);

  // Pleasure-focused step transition
  useEffect(() => {
    if (currentStep > 0) {
      // Instant icon transition with micro-bounce
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
      
      // Progress dot animation
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
      
      // Re-animate features
      setTimeout(() => {
        animateFeatures();
      }, PLEASURE_TIMINGS.SNAP);
    }
  }, [currentStep]);
  
      // Neural feature animation with connector effects
  const animateFeatures = () => {
    featureAnims.forEach((anim, index) => {
      // Reset all animations
      anim.opacity.setValue(0);
      anim.translateY.setValue(15);
      anim.scale.setValue(0.95);
      anim.connectorGlow.setValue(0);
      anim.connectorPulse.setValue(0);
      anim.connectorWidth.setValue(0);
      anim.neuralSpark.setValue(0);
      
      // Animate with advanced stagger
      setTimeout(() => {
        // Main feature animation
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: PLEASURE_TIMINGS.SMOOTH,
            easing: PLEASURE_EASING.smooth,
            useNativeDriver: true,
          }),
          Animated.spring(anim.translateY, {
            toValue: 0,
            tension: 120,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            tension: 140,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
        
        // Neural connector sequence
        setTimeout(() => {
          // 1. Width expansion
          Animated.timing(anim.connectorWidth, {
            toValue: 1,
            duration: 200,
            easing: PLEASURE_EASING.snap,
            useNativeDriver: false,
          }).start();
          
          // 2. Glow activation
          setTimeout(() => {
            Animated.timing(anim.connectorGlow, {
              toValue: 1,
              duration: 150,
              easing: PLEASURE_EASING.smooth,
              useNativeDriver: false,
            }).start();
            
            // 3. Neural spark
            setTimeout(() => {
              Animated.sequence([
                Animated.timing(anim.neuralSpark, {
                  toValue: 1,
                  duration: 300,
                  easing: PLEASURE_EASING.smooth,
                  useNativeDriver: true,
                }),
                Animated.timing(anim.neuralSpark, {
                  toValue: 0,
                  duration: 200,
                  easing: PLEASURE_EASING.smooth,
                  useNativeDriver: true,
                }),
              ]).start();
              
              // 4. Start orderly erratic behaviors
              // Base pulse with unique timing per connector
              Animated.loop(
                Animated.sequence([
                  Animated.timing(anim.connectorPulse, {
                    toValue: 1,
                    duration: 1200 + (index * 200), // Varying speeds
                    easing: PLEASURE_EASING.breathe,
                    useNativeDriver: false,
                  }),
                  Animated.timing(anim.connectorPulse, {
                    toValue: 0,
                    duration: 1200 + (index * 200),
                    easing: PLEASURE_EASING.breathe,
                    useNativeDriver: false,
                  }),
                ])
              ).start();
              
              // Erratic flicker - random intensity bursts
              const startErraticFlicker = () => {
                const nextFlicker = () => {
                  const delay = 500 + Math.random() * 2500;
                  setTimeout(() => {
                    Animated.sequence([
                      Animated.timing(anim.erraticFlicker, {
                        toValue: 0.3 + Math.random() * 0.7,
                        duration: 80 + Math.random() * 120,
                        easing: PLEASURE_EASING.snap,
                        useNativeDriver: false,
                      }),
                      Animated.timing(anim.erraticFlicker, {
                        toValue: 0,
                        duration: 200 + Math.random() * 300,
                        easing: PLEASURE_EASING.smooth,
                        useNativeDriver: false,
                      }),
                    ]).start(() => nextFlicker());
                  }, delay);
                };
                setTimeout(nextFlicker, anim.baseDelay);
              };
              
              // Erratic glow surges
              const startErraticGlow = () => {
                const nextGlow = () => {
                  const delay = 1000 + Math.random() * 4000;
                  setTimeout(() => {
                    Animated.sequence([
                      Animated.timing(anim.erraticGlow, {
                        toValue: 0.6 + Math.random() * 0.4,
                        duration: 150 + Math.random() * 200,
                        easing: PLEASURE_EASING.snap,
                        useNativeDriver: false,
                      }),
                      Animated.timing(anim.erraticGlow, {
                        toValue: 0,
                        duration: 400 + Math.random() * 600,
                        easing: PLEASURE_EASING.breathe,
                        useNativeDriver: false,
                      }),
                    ]).start(() => nextGlow());
                  }, delay);
                };
                setTimeout(nextGlow, anim.baseDelay + 300);
              };
              
              // Erratic pulse variations - sometimes double pulses
              const startErraticPulse = () => {
                const nextPulse = () => {
                  const delay = 2000 + Math.random() * 3000;
                  setTimeout(() => {
                    const isDouble = Math.random() > 0.7;
                    if (isDouble) {
                      // Double pulse
                      Animated.sequence([
                        Animated.timing(anim.erraticPulse, {
                          toValue: 0.6,
                          duration: 120,
                          easing: PLEASURE_EASING.snap,
                          useNativeDriver: false,
                        }),
                        Animated.timing(anim.erraticPulse, {
                          toValue: 0,
                          duration: 80,
                          easing: PLEASURE_EASING.smooth,
                          useNativeDriver: false,
                        }),
                        Animated.timing(anim.erraticPulse, {
                          toValue: 0.8,
                          duration: 100,
                          easing: PLEASURE_EASING.snap,
                          useNativeDriver: false,
                        }),
                        Animated.timing(anim.erraticPulse, {
                          toValue: 0,
                          duration: 200,
                          easing: PLEASURE_EASING.breathe,
                          useNativeDriver: false,
                        }),
                      ]).start(() => nextPulse());
                    } else {
                      // Single pulse with random intensity
                      Animated.sequence([
                        Animated.timing(anim.erraticPulse, {
                          toValue: 0.4 + Math.random() * 0.4,
                          duration: 100 + Math.random() * 100,
                          easing: PLEASURE_EASING.snap,
                          useNativeDriver: false,
                        }),
                        Animated.timing(anim.erraticPulse, {
                          toValue: 0,
                          duration: 200 + Math.random() * 200,
                          easing: PLEASURE_EASING.smooth,
                          useNativeDriver: false,
                        }),
                      ]).start(() => nextPulse());
                    }
                  }, delay);
                };
                setTimeout(nextPulse, anim.baseDelay + 600);
              };
              
              // Flying and movement behaviors
              const startFlyingAnimations = () => {
                // Continuous orbital movement with unique patterns per connector
                const flyingPattern = anim.flyingPattern;
                
                if (flyingPattern === 0) {
                  // Circular orbit
                  Animated.loop(
                    Animated.timing(anim.orbitAngle, {
                      toValue: 1,
                      duration: 8000 + (index * 1000), // Varying orbit speeds
                      easing: Easing.linear,
                      useNativeDriver: true,
                    })
                  ).start();
                } else if (flyingPattern === 1) {
                  // Figure-8 pattern
                  Animated.loop(
                    Animated.sequence([
                      Animated.timing(anim.flyingX, {
                        toValue: 3,
                        duration: 2000,
                        easing: PLEASURE_EASING.breathe,
                        useNativeDriver: true,
                      }),
                      Animated.timing(anim.flyingX, {
                        toValue: -3,
                        duration: 4000,
                        easing: PLEASURE_EASING.breathe,
                        useNativeDriver: true,
                      }),
                      Animated.timing(anim.flyingX, {
                        toValue: 0,
                        duration: 2000,
                        easing: PLEASURE_EASING.breathe,
                        useNativeDriver: true,
                      }),
                    ])
                  ).start();
                  
                  Animated.loop(
                    Animated.sequence([
                      Animated.timing(anim.flyingY, {
                        toValue: -2,
                        duration: 4000,
                        easing: PLEASURE_EASING.breathe,
                        useNativeDriver: true,
                      }),
                      Animated.timing(anim.flyingY, {
                        toValue: 2,
                        duration: 4000,
                        easing: PLEASURE_EASING.breathe,
                        useNativeDriver: true,
                      }),
                    ])
                  ).start();
                } else if (flyingPattern === 2) {
                  // Spiral pattern
                  Animated.loop(
                    Animated.parallel([
                      Animated.timing(anim.orbitAngle, {
                        toValue: 1,
                        duration: 6000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                      }),
                      Animated.sequence([
                        Animated.timing(anim.flyingScale, {
                          toValue: 1.5,
                          duration: 3000,
                          easing: PLEASURE_EASING.breathe,
                          useNativeDriver: true,
                        }),
                        Animated.timing(anim.flyingScale, {
                          toValue: 0.5,
                          duration: 3000,
                          easing: PLEASURE_EASING.breathe,
                          useNativeDriver: true,
                        }),
                      ]),
                    ])
                  ).start();
                } else {
                  // Chaotic movement
                  const chaosMove = () => {
                    const randomX = (Math.random() - 0.5) * 8;
                    const randomY = (Math.random() - 0.5) * 4;
                    const randomRotate = Math.random() * 360;
                    const duration = 1000 + Math.random() * 2000;
                    
                    Animated.parallel([
                      Animated.timing(anim.flyingX, {
                        toValue: randomX,
                        duration: duration,
                        easing: PLEASURE_EASING.elastic,
                        useNativeDriver: true,
                      }),
                      Animated.timing(anim.flyingY, {
                        toValue: randomY,
                        duration: duration,
                        easing: PLEASURE_EASING.elastic,
                        useNativeDriver: true,
                      }),
                      Animated.timing(anim.flyingRotate, {
                        toValue: randomRotate,
                        duration: duration,
                        easing: PLEASURE_EASING.smooth,
                        useNativeDriver: true,
                      }),
                    ]).start(() => chaosMove());
                  };
                  setTimeout(chaosMove, 500 + (index * 200));
                }
                
                // Neural flow animation
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(anim.neuralFlow, {
                      toValue: 1,
                      duration: 2000 + (index * 300),
                      easing: PLEASURE_EASING.smooth,
                      useNativeDriver: true,
                    }),
                    Animated.timing(anim.neuralFlow, {
                      toValue: 0,
                      duration: 2000 + (index * 300),
                      easing: PLEASURE_EASING.smooth,
                      useNativeDriver: true,
                    }),
                  ])
                ).start();
                
                // Dimensional shift effect
                const dimensionalShift = () => {
                  const nextShift = () => {
                    const delay = 3000 + Math.random() * 5000;
                    setTimeout(() => {
                      Animated.sequence([
                        Animated.timing(anim.dimensionalShift, {
                          toValue: 1,
                          duration: 300,
                          easing: PLEASURE_EASING.snap,
                          useNativeDriver: true,
                        }),
                        Animated.timing(anim.dimensionalShift, {
                          toValue: 0,
                          duration: 500,
                          easing: PLEASURE_EASING.breathe,
                          useNativeDriver: true,
                        }),
                      ]).start(() => nextShift());
                    }, delay);
                  };
                  nextShift();
                };
                
                // Particle trail effect
                Animated.loop(
                  Animated.sequence([
                    Animated.timing(anim.particleTrail, {
                      toValue: 1,
                      duration: 1500,
                      easing: Easing.linear,
                      useNativeDriver: true,
                    }),
                    Animated.timing(anim.particleTrail, {
                      toValue: 0,
                      duration: 100,
                      easing: Easing.linear,
                      useNativeDriver: true,
                    }),
                  ])
                ).start();
                
                // Wave ripple effect
                const waveRipple = () => {
                  const nextRipple = () => {
                    const delay = 2000 + Math.random() * 4000;
                    setTimeout(() => {
                      Animated.timing(anim.waveRipple, {
                        toValue: 1,
                        duration: 800,
                        easing: PLEASURE_EASING.smooth,
                        useNativeDriver: true,
                      }).start(() => {
                        anim.waveRipple.setValue(0);
                        nextRipple();
                      });
                    }, delay);
                  };
                  nextRipple();
                };
                
                setTimeout(dimensionalShift, 1000 + (index * 500));
                setTimeout(waveRipple, 1500 + (index * 300));
              };
              
              // Start all behaviors with offsets
              setTimeout(startErraticFlicker, 200 + (index * 100));
              setTimeout(startErraticGlow, 800 + (index * 150));
              setTimeout(startErraticPulse, 1200 + (index * 200));
              setTimeout(startFlyingAnimations, 1600 + (index * 250));
            }, 100);
          }, 50);
        }, index * 20);
      }, index * 60); // Staggered entry
    });
  };
  
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

  // Ultra-responsive button interactions
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      // Satisfying haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Instant pleasure response
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.92,
          duration: PLEASURE_TIMINGS.INSTANT,
          easing: PLEASURE_EASING.snap,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1.02,
          tension: 150,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Instant step change for maximum responsiveness
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, PLEASURE_TIMINGS.INSTANT);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      // Light haptic for backward navigation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Quick reverse animation
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.94,
          duration: PLEASURE_TIMINGS.INSTANT,
          easing: PLEASURE_EASING.snap,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          tension: 140,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
      
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
      }, PLEASURE_TIMINGS.INSTANT);
    }
  };

  const handleFinish = () => {
    // Success haptic for completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Ultra-fast completion animation
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 30, // Ultra fast
        easing: PLEASURE_EASING.snap,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1.05,
        duration: 40, // Ultra fast
        easing: PLEASURE_EASING.snap,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 30, // Ultra fast
        easing: PLEASURE_EASING.smooth,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Instant exit transition
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 60, // Much faster
          easing: PLEASURE_EASING.snap,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.9,
          duration: 60, // Much faster
          easing: PLEASURE_EASING.snap,
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

            {/* Main Title */}
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

            {/* Neural Interface Display */}
            {/* Neural Interface Display */}
            <View style={styles.neuralInterface}>
              {step.features.map((feature, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.neuralNode,
                    {
                      opacity: featureAnims[index]?.opacity || 1,
                      transform: [
                        { translateY: featureAnims[index]?.translateY || 0 },
                        { scale: featureAnims[index]?.scale || 1 },
                      ],
                    }
                  ]}
                >
                  {/* Flying Neural Connector Container */}
                  <Animated.View style={[
                    styles.neuralConnectorContainer,
                    {
                      transform: [
                        // Flying movements based on pattern
                        { 
                          translateX: featureAnims[index]?.flyingPattern === 0 
                            ? featureAnims[index]?.orbitAngle.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 360],
                              }).interpolate({
                                inputRange: [0, 90, 180, 270, 360],
                                outputRange: [0, 1, 0, -1, 0],
                              }) || 0
                            : Animated.multiply(
                                featureAnims[index]?.flyingX || 0,
                                0.5
                              )
                        },
                        { 
                          translateY: featureAnims[index]?.flyingPattern === 0
                            ? featureAnims[index]?.orbitAngle.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 360],
                              }).interpolate({
                                inputRange: [0, 90, 180, 270, 360],
                                outputRange: [0, -0.5, 0, 0.5, 0],
                              }) || 0
                            : Animated.multiply(
                                featureAnims[index]?.flyingY || 0,
                                0.5
                              )
                        },
                        { 
                          rotate: featureAnims[index]?.flyingRotate.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                          }) || '0deg'
                        },
                        { 
                          scale: Animated.multiply(
                            featureAnims[index]?.flyingScale || 1,
                            Animated.add(
                              1,
                              Animated.multiply(
                                featureAnims[index]?.dimensionalShift || 0,
                                0.3
                              )
                            )
                          )
                        },
                      ],
                    }
                  ]}>
                    {/* Base connector with width animation */}
                    <Animated.View style={[
                      styles.baseConnector,
                      {
                        backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
                        width: featureAnims[index]?.connectorWidth.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 2],
                        }) || 2,
                      }
                    ]} />
                    
                    {/* Glow layer with erratic surges */}
                    <Animated.View style={[
                      styles.connectorGlow,
                      {
                        backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
                        opacity: Animated.add(
                          featureAnims[index]?.connectorGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.4],
                          }) || 0,
                          Animated.multiply(
                            featureAnims[index]?.erraticGlow || 0,
                            0.3
                          )
                        ),
                        width: Animated.add(
                          featureAnims[index]?.connectorGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [2, 6],
                          }) || 2,
                          featureAnims[index]?.erraticGlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 3],
                          }) || 0
                        ),
                      }
                    ]} />
                    
                    {/* Pulse layer with erratic variations */}
                    <Animated.View style={[
                      styles.connectorPulse,
                      {
                        backgroundColor: isDarkMode ? '#ffffff' : '#ffffff',
                        opacity: Animated.add(
                          featureAnims[index]?.connectorPulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.6],
                          }) || 0,
                          featureAnims[index]?.erraticPulse || 0
                        ),
                      }
                    ]} />
                    
                    {/* Erratic flicker overlay */}
                    <Animated.View style={[
                      styles.connectorFlicker,
                      {
                        backgroundColor: isDarkMode ? '#ffffff' : '#ffffff',
                        opacity: featureAnims[index]?.erraticFlicker || 0,
                      }
                    ]} />
                    
                    {/* Neural spark */}
                    <Animated.View style={[
                      styles.neuralSpark,
                      {
                        backgroundColor: isDarkMode ? '#ffffff' : '#ffffff',
                        opacity: featureAnims[index]?.neuralSpark || 0,
                        transform: [{
                          translateY: featureAnims[index]?.neuralSpark.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, -8],
                          }) || 0,
                        }],
                      }
                    ]} />
                    
                    {/* Data points */}
                    <Animated.View style={[
                      styles.connectorDataPoint,
                      styles.dataPointTop,
                      {
                        backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
                        opacity: featureAnims[index]?.connectorGlow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.7],
                        }) || 0,
                      }
                    ]} />
                    
                    <Animated.View style={[
                      styles.connectorDataPoint,
                      styles.dataPointBottom,
                      {
                        backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
                        opacity: featureAnims[index]?.connectorPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.5],
                        }) || 0,
                      }
                    ]} />
                    
                    {/* Flying particle trails */}
                    <Animated.View style={[
                      styles.particleTrail,
                      {
                        backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6',
                        opacity: featureAnims[index]?.particleTrail.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.6],
                        }) || 0,
                        transform: [{
                          translateY: featureAnims[index]?.particleTrail.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -20],
                          }) || 0,
                        }],
                      }
                    ]} />
                    
                    {/* Neural flow streams */}
                    <Animated.View style={[
                      styles.neuralFlowStream,
                      {
                        backgroundColor: isDarkMode ? '#ffffff' : '#ffffff',
                        opacity: featureAnims[index]?.neuralFlow.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.8],
                        }) || 0,
                        transform: [{
                          scaleY: featureAnims[index]?.neuralFlow.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1.5],
                          }) || 1,
                        }],
                      }
                    ]} />
                    
                    {/* Wave ripple effect */}
                    <Animated.View style={[
                      styles.waveRipple,
                      {
                        borderColor: isDarkMode ? '#add5fa' : '#3b82f6',
                        opacity: featureAnims[index]?.waveRipple.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 0],
                        }) || 0,
                        transform: [{
                          scale: featureAnims[index]?.waveRipple.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 3],
                          }) || 1,
                        }],
                      }
                    ]} />
                  </Animated.View>
                  <View style={styles.nodeContent}>
                    <Text style={[
                      styles.nodeLabel,
                      { color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)' }
                    ]}>
                      {feature}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>

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
            {/* Neural Processing Core */}
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

          {/* Action Buttons - Full Width */}
          <View style={styles.fullWidthButtonContainer}>
            <Animated.View 
              style={{ 
                transform: [{ scale: buttonScale }],
                width: '100%',
              }}
            >
              <View style={styles.primaryButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: '#add5fa',
                    }
                  ]}
                  onPress={() => {
                    console.log('Button pressed!');
                    if (isLastStep) {
                      handleFinish();
                    } else {
                      handleNext();
                    }
                  }}
                  activeOpacity={0.95}
                >
                  <Text style={[
                    styles.primaryButtonText, 
                    { color: isDarkMode ? NuminaColors.darkMode[600] : '#ffffff' }
                  ]}>
                    {isLastStep ? 'Start Your Journey' : 'Continue →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Navigation Row */}
            <View style={styles.navigationRow}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={handlePrev}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.navButtonText,
                    { color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
                  ]}>
                    ← Back
                  </Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.navSpacer} />
              
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => {
                  // Light haptic for starting chat
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onStartChat();
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.navButtonText,
                  { color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
                ]}>
                  Skip
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
    justifyContent: 'center', // Center vertically
  },
  contentArea: {
    flex: 1,
    paddingRight: 120,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 10,
    maxWidth: '100%',
  },
  visualElement: {
    position: 'absolute',
    top: '50%',
    right: 24,
    transform: [{ translateY: -60 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthButtonContainer: {
    width: '100%',
    gap: 16,
    marginTop: 32,
  },
  
  // Step Badge
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(173, 213, 250, 0.1)',
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
  creativeTitle: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'CrimsonPro_700Bold',
    letterSpacing: -1.2,
    marginBottom: 16,
    textAlign: 'left',
  },
  creativeDescription: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 24,
    textAlign: 'left',
  },
  
  // Neural Interface (2055 Future Design)
  neuralInterface: {
    gap: 8,
    marginBottom: 32,
    marginLeft: 4,
    width: '100%', // Full width container
    flex: 1, // Take available space
  },
  neuralNode: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
    width: '100%', // Ensure full width
    maxWidth: '100%', // Prevent overflow
  },
  // Neural Connector System
  neuralConnectorContainer: {
    position: 'relative',
    width: 8,
    height: 16,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 1,
    flexShrink: 0, // Don't shrink this container
    flexGrow: 0, // Don't grow this container
  },
  baseConnector: {
    position: 'absolute',
    height: 16,
    borderRadius: 1,
  },
  connectorGlow: {
    position: 'absolute',
    height: 14,
    borderRadius: 3,
    shadowColor: '#add5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 2,
  },
  connectorPulse: {
    position: 'absolute',
    width: 1,
    height: 8,
    borderRadius: 0.5,
    top: 4,
  },
  connectorFlicker: {
    position: 'absolute',
    width: 0.5,
    height: 12,
    borderRadius: 0.25,
    top: 2,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 1,
    elevation: 2,
  },
  neuralSpark: {
    position: 'absolute',
    width: 1,
    height: 2,
    borderRadius: 0.5,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 3,
  },
  connectorDataPoint: {
    position: 'absolute',
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
  },
  dataPointTop: {
    top: 1,
    right: -1,
  },
  dataPointBottom: {
    bottom: 1,
    left: -1,
  },
  
  // Flying and Movement Effects
  particleTrail: {
    position: 'absolute',
    width: 0.5,
    height: 8,
    borderRadius: 0.25,
    right: -2,
    top: 4,
    shadowColor: '#add5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 3,
  },
  neuralFlowStream: {
    position: 'absolute',
    width: 0.8,
    height: 12,
    borderRadius: 0.4,
    left: -3,
    top: 2,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 4,
  },
  waveRipple: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    top: 0,
    left: -4,
  },
  nodeContent: {
    flex: 1,
    zIndex: 5,
    position: 'relative',
    minWidth: 0, // Allow text to wrap
    width: '100%', // Take remaining space
  },
  nodeLabel: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    letterSpacing: -0.2,
    lineHeight: 20,
    zIndex: 10,
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