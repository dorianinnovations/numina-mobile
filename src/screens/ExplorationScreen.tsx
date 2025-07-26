import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/ui/PageBackground';
import { NuminaColors } from '../utils/colors';
import { ShineEffect } from '../components/effects/ShineEffect';
import { LockParticles } from '../components/effects/LockParticles';

const { width, height } = Dimensions.get('window');

interface ExplorationScreenProps {
  onExplorationComplete: () => void;
  onSkip?: () => void;
}

interface FeatureBox {
  id: string;
  title: string;
  explanations: string[];
  position: { top: string; left?: string; right?: string };
  color: string;
}

interface CardState {
  isVisible: boolean;
  isAnimating: boolean;
  animationValue: Animated.Value;
}

const FEATURE_BOXES: FeatureBox[] = [
  {
    id: 'human-first',
    title: 'AI this AI that, what about humans?',
    explanations: [
      'In a world full of artificial intelligence, we started with a human question: what about you?'
    ],
    position: { top: '10%', left: '8%' },
    color: '#FFB6C1'
  },
  {
    id: 'personal-fit',
    title: 'Fits Your Way',
    explanations: [
      "Whether you're outlining a thesis or just thinking out loud, Numina adapts to you. There's no right way to begin, only your way."
    ],
    position: { top: '25%', right: '8%' },
    color: '#98FB98'
  },
  {
    id: 'synthubpm',
    title: 'How It Works: SynthUBPM',
    explanations: [
      "Notice how Numina remembers the little things? It's designed to weave the important threads of your thoughts together, creating a uniquely personal context."
    ],
    position: { top: '42%', left: '8%' },
    color: '#87CEEB'
  },
  {
    id: 'no-repetition',
    title: "Why It's Necessary",
    explanations: [
      "Your important thoughts shouldn't have an expiration date. Feel the freedom of a conversation that remembers, so you can always move forward."
    ],
    position: { top: '58%', right: '8%' },
    color: '#DDA0DD'
  },
  {
    id: 'built-for-humans',
    title: 'Built for Humans',
    explanations: [
      "Technology should serve humanity, not the other way around. Think of Numina as a mirror for your mind, here to amplify your own voice."
    ],
    position: { top: '74%', left: '8%' },
    color: '#F0E68C'
  },
  {
    id: 'your-journey',
    title: 'Your Journey Begins',
    explanations: [
      "This is more than a tool; it's a space for your thoughts to grow. Your journey starts with a single idea. What will yours be?"
    ],
    position: { top: '88%', right: '8%' },
    color: '#FFA07A'
  }
];

export const ExplorationScreen: React.FC<ExplorationScreenProps> = ({
  onExplorationComplete,
  onSkip,
}) => {
  const { isDarkMode } = useTheme();
  const [cardStates, setCardStates] = useState<{ [key: string]: CardState }>({});
  const [viewedCount, setViewedCount] = useState(0);
  
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const continueOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const animationTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Initialize card states
  useEffect(() => {
    const initialStates: { [key: string]: CardState } = {};
    FEATURE_BOXES.forEach(box => {
      initialStates[box.id] = {
        isVisible: false,
        isAnimating: false,
        animationValue: new Animated.Value(0)
      };
    });
    setCardStates(initialStates);

    // Start title animation
    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      // Cleanup timeouts
      Object.values(animationTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Show continue button when 3+ cards are viewed
  useEffect(() => {
    if (viewedCount >= 3) {
      Animated.timing(continueOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [viewedCount]);

  // Auto-animate first card on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      animateCard(FEATURE_BOXES[0].id);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Clean card animation function
  const animateCard = useCallback((boxId: string, delay: number = 0) => {
    const cardState = cardStates[boxId];
    if (!cardState || cardState.isVisible || cardState.isAnimating) return;

    // Clear any existing timeout for this card
    if (animationTimeouts.current[boxId]) {
      clearTimeout(animationTimeouts.current[boxId]);
    }

    animationTimeouts.current[boxId] = setTimeout(() => {
      setCardStates(prev => ({
        ...prev,
        [boxId]: { ...prev[boxId], isAnimating: true }
      }));

      Animated.timing(cardState.animationValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCardStates(prev => ({
          ...prev,
          [boxId]: {
            ...prev[boxId],
            isVisible: true,
            isAnimating: false
          }
        }));
        
        setViewedCount(prev => prev + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      });
    }, delay);
  }, [cardStates]);

  // Clean scroll handler with sequential animation
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const screenHeight = height;
    
    let cardsToAnimate: string[] = [];
    
    FEATURE_BOXES.forEach((box, index) => {
      const cardState = cardStates[box.id];
      if (!cardState || cardState.isVisible || cardState.isAnimating) return;
      
      // Calculate trigger point based on card index
      const cardPosition = index * 300; // Approximate card spacing
      const triggerPoint = currentScrollY + (screenHeight * 0.75);
      
      if (cardPosition <= triggerPoint) {
        cardsToAnimate.push(box.id);
      }
    });
    
    // Animate cards with sequential delay
    cardsToAnimate.forEach((boxId, index) => {
      const delay = index * 200; // 200ms stagger between cards
      animateCard(boxId, delay);
    });
  }, [cardStates, animateCard]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onExplorationComplete();
  };

  const renderFeatureBox = (box: FeatureBox) => {
    const cardState = cardStates[box.id];
    if (!cardState) return null;
    
    const isVisible = cardState.isVisible;
    const animValue = cardState.animationValue;
    
    return (
      <Animated.View
        style={[
          styles.featureBox,
          isDarkMode ? {
            backgroundColor: '#0a0a0a',
            borderColor: '#181818',
            borderWidth: 1.2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 15,
          } : {
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          },
          {
            borderLeftWidth: isVisible ? 4 : 0,
            borderLeftColor: isVisible ? '#add5fa' : 'transparent',
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                })
              },
              {
                scale: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                })
              }
            ],
            opacity: animValue.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0, 0, 1],
            }),
          }
        ]}
      >
        {!isDarkMode && <ShineEffect enabled={true} />}
        
        {isVisible && (
          <LockParticles 
            enabled={isVisible} 
            color={isDarkMode ? '#add5fa' : '#3b82f6'} 
          />
        )}
        
        <View style={styles.boxTouchable}>
          <View style={styles.boxContent}>
            <Text style={[styles.editorialNumber, { 
              color: isDarkMode ? '#add5fa' : '#3b82f6',
            }]}>
              {String(FEATURE_BOXES.findIndex(b => b.id === box.id) + 1).padStart(2, '0')}
            </Text>
            
            <Text style={[styles.editorialCategory, { 
              color: isDarkMode ? '#888888' : '#6b7280',
            }]}>
              {isVisible ? 'EXPLORED' : 'FEATURE'}
            </Text>
            
            <Text style={[styles.boxTitle, { 
              color: isDarkMode ? '#ffffff' : '#1f2937',
            }]}>
              {box.title}
            </Text>
            
            <View style={[styles.editorialDivider, { 
              backgroundColor: isDarkMode ? '#404040' : '#e5e7eb',
            }]} />
          </View>
        </View>
        
        <View style={styles.tooltipContainer}>
          <Text style={[styles.explanationText, {
            color: isDarkMode ? '#cccccc' : '#4b5563'
          }]}>
            {box.explanations[0]}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <PageBackground>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* Header */}
            <Animated.View 
              style={[
                styles.header,
                { opacity: titleOpacity }
              ]}
            >
              <Text
                style={[
                  styles.title,
                  { color: isDarkMode ? '#fff' : '#1a1a1a' }
                ]}
              >
                Discover Numina
              </Text>
              <Text 
                style={[
                  styles.subtitle,
                  { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(26,26,26,0.7)' }
                ]}
              >
                Scroll to reveal each card and watch the story unfold
              </Text>
            </Animated.View>

            {/* Cards with Timeline */}
            <View style={styles.explorationArea}>
              <View style={styles.hopscotchContainer}>
                <View style={[
                  styles.timelineLine,
                  { backgroundColor: isDarkMode ? '#333333' : '#e5e7eb' }
                ]} />
                
                {FEATURE_BOXES.map((box, index) => (
                  <React.Fragment key={box.id}>
                    <View style={styles.hopscotchItem}>
                      {renderFeatureBox(box)}
                      
                      <View style={styles.timelineNodeContainer}>
                        <View style={[
                          styles.timelineNode,
                          { 
                            backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
                            borderColor: isDarkMode ? '#add5fa' : '#3b82f6' 
                          }
                        ]}>
                          <View style={[
                            styles.timelineNodeInner,
                            { backgroundColor: isDarkMode ? '#add5fa' : '#3b82f6' }
                          ]} />
                        </View>
                      </View>
                    </View>
                    
                    {index < FEATURE_BOXES.length - 1 && (
                      <View style={[
                        styles.timelineSegment,
                        { backgroundColor: isDarkMode ? '#333333' : '#e5e7eb' }
                      ]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Continue button */}
            <Animated.View 
              style={[
                styles.continueContainer,
                { opacity: continueOpacity }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: viewedCount >= 3 
                      ? '#3b82f6' 
                      : (isDarkMode ? '#262626' : '#f9fafb'),
                    borderColor: 'transparent',
                    shadowColor: isDarkMode ? '#000' : '#000',
                  }
                ]}
                onPress={handleContinue}
                disabled={viewedCount < 3}
              >
                <Text style={[
                  styles.continueText,
                  { 
                    color: viewedCount >= 3 
                      ? '#ffffff'
                      : (isDarkMode ? '#666666' : '#9ca3af')
                  }
                ]}>
                  Continue ({viewedCount}/3)
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Skip button */}
            {onSkip && (
              <View style={styles.skipContainer}>
                <TouchableOpacity onPress={onSkip}>
                  <Text style={[
                    styles.skipText,
                    { color: isDarkMode ? '#888' : '#666' }
                  ]}>
                    Skip exploration
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
  },
  scrollContent: {
    minHeight: height * 4,
    paddingHorizontal: 16,
    paddingBottom: 300,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.12,
    paddingBottom: 56,
    zIndex: 10,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    fontFamily: 'Nunito_300Light',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.2,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    paddingHorizontal: 48,
    lineHeight: 22,
    opacity: 0.6,
  },
  explorationArea: {
    flex: 1,
    minHeight: height * 1.2,
    paddingHorizontal: 0,
  },
  hopscotchContainer: {
    flex: 1,
    position: 'relative',
    paddingVertical: 60,
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  hopscotchItem: {
    marginBottom: 150,
    width: '85%',
    marginLeft: 60,
    position: 'relative',
  },
  featureBox: {
    width: '100%',
    minHeight: 220,
    borderRadius: 16,
    padding: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'transparent',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    shadowColor: '#000',
    overflow: 'hidden',
  },
  boxTouchable: {
    width: '100%',
    zIndex: 2,
  },
  boxContent: {
    alignItems: 'flex-start',
    marginBottom: 0,
    justifyContent: 'flex-start',
    minHeight: 140,
    padding: 32,
    position: 'relative',
  },
  boxTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'left',
    fontFamily: 'CrimsonPro_700Bold',
    lineHeight: 36,
    letterSpacing: -0.8,
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 16,
    maxWidth: '75%',
  },
  tooltipContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
  },
  editorialNumber: {
    position: 'absolute',
    top: 20,
    left: 24,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  editorialCategory: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'CrimsonPro_700Bold',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  editorialDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginTop: 12,
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'Nunito_400Regular',
    letterSpacing: -0.2,
    color: '#4b5563',
    textAlign: 'left',
    paddingHorizontal: 32,
    paddingBottom: 16,
    fontStyle: 'italic',
  },
  continueContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    zIndex: 10,
    width: '100%',
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 180,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
  },
  
  // Timeline styles
  timelineLine: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 1,
  },
  timelineNodeContainer: {
    position: 'absolute',
    left: -48,
    top: 40,
    zIndex: 3,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  timelineNodeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineSegment: {
    position: 'absolute',
    left: 24,
    width: 2,
    height: 60,
    top: -30,
    zIndex: 1,
  },
});

export default ExplorationScreen;