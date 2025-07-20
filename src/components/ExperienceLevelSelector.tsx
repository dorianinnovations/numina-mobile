import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { PageBackground } from './PageBackground';
import { AnimatedGradientBorder } from './AnimatedGradientBorder';

const { width } = Dimensions.get('window');

interface ExperienceLevelSelectorProps {
  onSelectionComplete: (level: 'private' | 'personal' | 'cloud_find_beta') => void;
  onSkip?: () => void;
}

type ExperienceLevel = 'private' | 'personal' | 'cloud_find_beta';

interface LevelOption {
  id: ExperienceLevel;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
  recommended?: boolean;
}

const EXPERIENCE_LEVELS: LevelOption[] = [
  {
    id: 'private',
    title: 'Private',
    subtitle: '100% On-Device',
    description: 'All data is stored locally and encrypted on your phone',
    features: [
      '100% On-Device storage',
      'Local encryption',
      'Offline First operation',
      'Works without internet',
      'Zero cloud dependency'
    ],
    icon: 'shield-checkmark',
    color: '#22C55E',
  },
  {
    id: 'personal',
    title: 'Personal',
    subtitle: 'Unlock Numina',
    description: 'Experience a truly adaptive companion that learns and grows with you through secure cloud sync',
    features: [
      'Adaptive companion learning',
      'Secure cloud sync',
      'Deeper Self-Discovery insights',
      'Advanced analytics',
      'For your eyes only'
    ],
    icon: 'trending-up',
    color: '#60A5FA',
    recommended: true,
  },
  {
    id: 'cloud_find_beta',
    title: 'Cloud Find (Beta)',
    subtitle: 'Social Discovery',
    description: 'Opt-in to find events and connect with people using anonymized emotional data',
    features: [
      'Social Discovery features',
      'Event finding and connection',
      'Anonymized Data matching',
      'Identity stays private',
      'Beta access features'
    ],
    icon: 'people',
    color: '#A78BFA',
  },
];

export const ExperienceLevelSelector: React.FC<ExperienceLevelSelectorProps> = ({
  onSelectionComplete,
  onSkip,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>('personal');
  const [expandedCard, setExpandedCard] = useState<ExperienceLevel | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  
  // Premium light gradient colors for each option
  const premiumGradientColors = {
    private: isDarkMode ? [
      // Private - Light Green/Emerald Tech
      'rgba(15, 20, 15, 1)',       // Deep green-dark
      'rgba(20, 30, 25, 1)',       // Building green
      'rgba(25, 40, 30, 1)',       // Subtle green
      'rgba(34, 197, 94, 0.3)',    // Light emerald glow
      'rgba(52, 211, 153, 0.6)',   // Bright emerald
      'rgba(110, 231, 183, 0.8)',  // Light mint
      'rgba(167, 243, 208, 0.9)',  // Very light mint
      'rgba(209, 250, 229, 0.7)',  // Pale mint
      'rgba(167, 243, 208, 0.6)',  // Light mint fade
      'rgba(110, 231, 183, 0.4)',  // Emerald fade
      'rgba(52, 211, 153, 0.3)',   // Bright emerald fade
      'rgba(34, 197, 94, 0.2)',    // Light emerald fade
      'rgba(25, 40, 30, 1)',       // Back to green
      'rgba(20, 30, 25, 1)',       // Deep green
      'rgba(15, 20, 15, 1)',       // Back to start
    ] : [
      // Private Light Mode - Soft emerald pastels
      'rgba(247, 254, 251, 1)',    // Clean white-green
      'rgba(240, 253, 244, 1)',    // Very light green
      'rgba(220, 252, 231, 1)',    // Soft mint
      'rgba(187, 247, 208, 0.6)',  // Light emerald
      'rgba(134, 239, 172, 0.7)',  // Medium emerald
      'rgba(74, 222, 128, 0.5)',   // Bright emerald
      'rgba(34, 197, 94, 0.4)',    // Strong emerald
      'rgba(22, 163, 74, 0.3)',    // Deep emerald
      'rgba(34, 197, 94, 0.3)',    // Strong emerald fade
      'rgba(74, 222, 128, 0.4)',   // Bright emerald fade
      'rgba(134, 239, 172, 0.5)',  // Medium emerald fade
      'rgba(187, 247, 208, 0.4)',  // Light emerald fade
      'rgba(220, 252, 231, 1)',    // Soft mint
      'rgba(240, 253, 244, 1)',    // Very light green
      'rgba(247, 254, 251, 1)',    // Back to white-green
    ],
    personal: isDarkMode ? [
      // Personal - Light Blue/Sky Tech
      'rgba(15, 18, 25, 1)',       // Deep blue-dark
      'rgba(20, 25, 35, 1)',       // Building blue
      'rgba(30, 40, 55, 1)',       // Subtle blue
      'rgba(59, 130, 246, 0.3)',   // Light blue glow
      'rgba(96, 165, 250, 0.6)',   // Sky blue
      'rgba(147, 197, 253, 0.8)',  // Light sky
      'rgba(186, 230, 253, 0.9)',  // Very light blue
      'rgba(224, 242, 254, 0.7)',  // Pale blue
      'rgba(186, 230, 253, 0.6)',  // Light sky fade
      'rgba(147, 197, 253, 0.4)',  // Light sky fade
      'rgba(96, 165, 250, 0.3)',   // Sky blue fade
      'rgba(59, 130, 246, 0.2)',   // Light blue fade
      'rgba(30, 40, 55, 1)',       // Back to blue
      'rgba(20, 25, 35, 1)',       // Deep blue
      'rgba(15, 18, 25, 1)',       // Back to start
    ] : [
      // Personal Light Mode - Soft blue pastels
      'rgba(248, 250, 252, 1)',    // Clean white
      'rgba(241, 245, 249, 1)',    // Very light blue
      'rgba(226, 232, 240, 1)',    // Soft blue-gray
      'rgba(191, 219, 254, 0.6)',  // Light blue
      'rgba(147, 197, 253, 0.7)',  // Medium blue
      'rgba(96, 165, 250, 0.8)',   // Bright blue
      'rgba(59, 130, 246, 0.6)',   // Strong blue
      'rgba(37, 99, 235, 0.4)',    // Deep blue
      'rgba(59, 130, 246, 0.5)',   // Strong blue fade
      'rgba(96, 165, 250, 0.6)',   // Bright blue fade
      'rgba(147, 197, 253, 0.5)',  // Medium blue fade
      'rgba(191, 219, 254, 0.4)',  // Light blue fade
      'rgba(226, 232, 240, 1)',    // Soft blue-gray
      'rgba(241, 245, 249, 1)',    // Very light blue
      'rgba(248, 250, 252, 1)',    // Back to white
    ],
    cloud_find_beta: isDarkMode ? [
      // Cloud Find - Light Purple/Violet Tech
      'rgba(18, 15, 25, 1)',       // Deep purple-dark
      'rgba(25, 20, 35, 1)',       // Building purple
      'rgba(35, 30, 50, 1)',       // Subtle purple
      'rgba(139, 92, 246, 0.3)',   // Light purple glow
      'rgba(168, 139, 250, 0.6)',  // Medium purple
      'rgba(196, 181, 253, 0.8)',  // Light purple
      'rgba(221, 214, 254, 0.9)',  // Very light purple
      'rgba(237, 233, 254, 0.7)',  // Pale purple
      'rgba(221, 214, 254, 0.6)',  // Light purple fade
      'rgba(196, 181, 253, 0.4)',  // Light purple fade
      'rgba(168, 139, 250, 0.3)',  // Medium purple fade
      'rgba(139, 92, 246, 0.2)',   // Light purple fade
      'rgba(35, 30, 50, 1)',       // Back to purple
      'rgba(25, 20, 35, 1)',       // Deep purple
      'rgba(18, 15, 25, 1)',       // Back to start
    ] : [
      // Cloud Find Light Mode - Soft purple pastels
      'rgba(250, 248, 255, 1)',    // Clean white-purple
      'rgba(245, 243, 255, 1)',    // Very light purple
      'rgba(237, 233, 254, 1)',    // Soft purple
      'rgba(221, 214, 254, 0.6)',  // Light purple
      'rgba(196, 181, 253, 0.7)',  // Medium purple
      'rgba(168, 139, 250, 0.8)',  // Bright purple
      'rgba(139, 92, 246, 0.6)',   // Strong purple
      'rgba(124, 58, 237, 0.4)',   // Deep purple
      'rgba(139, 92, 246, 0.5)',   // Strong purple fade
      'rgba(168, 139, 250, 0.6)',  // Bright purple fade
      'rgba(196, 181, 253, 0.5)',  // Medium purple fade
      'rgba(221, 214, 254, 0.4)',  // Light purple fade
      'rgba(237, 233, 254, 1)',    // Soft purple
      'rgba(245, 243, 255, 1)',    // Very light purple
      'rgba(250, 248, 255, 1)',    // Back to white-purple
    ]
  };
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlideAnim = useRef(new Animated.Value(-30)).current;
  const cardScales = useRef(
    EXPERIENCE_LEVELS.map(() => new Animated.Value(1))
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Modal animation values - use useRef to prevent immutable value errors
  const modalAnimations = useRef({
    modalOpacity: new Animated.Value(0),
    modalScale: new Animated.Value(0.1),
    overlayOpacity: new Animated.Value(0),
    contentSlideAnim: new Animated.Value(80),
    contentOpacity: new Animated.Value(0),
  }).current;


  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(150, [
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        ...cardScales.map(scale => 
          Animated.spring(scale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          })
        ),
      ])
    ]).start();
    
    // Continuous pulse animation for selected card
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleLevelSelect = (level: ExperienceLevel, index: number) => {
    if (isExpanding) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLevel(level);
    
    // Reset all cards first
    cardScales.forEach((scale, i) => {
      if (i !== index) {
        Animated.spring(scale, {
          toValue: 0.98,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    });
    
    // Press-in animation effect
    Animated.sequence([
      Animated.timing(cardScales[index], {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(cardScales[index], {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handleCardExpand = (level: ExperienceLevel, index: number) => {
    if (isExpanding) return;
    
    setIsExpanding(true);
    setExpandedCard(level);
    setSelectedLevel(level); // Update selected level to reflect the long-pressed card
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Reset animations to initial values
    modalAnimations.modalOpacity.setValue(0);
    modalAnimations.modalScale.setValue(0.1);
    modalAnimations.overlayOpacity.setValue(0);
    modalAnimations.contentSlideAnim.setValue(80);
    modalAnimations.contentOpacity.setValue(0);
    
    // Fast and responsive modal animation
    Animated.parallel([
      // Card press effect
      Animated.spring(cardScales[index], {
        toValue: 0.9,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }),
      // Background and blur
      Animated.timing(modalAnimations.overlayOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      // Modal entrance with bounce
      Animated.spring(modalAnimations.modalScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnimations.modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Content reveal
      Animated.spring(modalAnimations.contentSlideAnim, {
        toValue: 0,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnimations.contentOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsExpanding(false);
    });
  };
  

  const handleModalClose = () => {
    if (isExpanding) return; // Prevent multiple rapid dismissals
    
    setIsExpanding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Lighter haptic for dismissal
    
    const expandedIndex = EXPERIENCE_LEVELS.findIndex(l => l.id === expandedCard);
    
    // Ultra-fast optimized exit animation
    Animated.parallel([
      // Instant content hide for snappier feel
      Animated.timing(modalAnimations.contentOpacity, {
        toValue: 0,
        duration: 60, // Faster content fade
        useNativeDriver: true,
      }),
      // Quick modal collapse with higher tension
      Animated.spring(modalAnimations.modalScale, {
        toValue: 0.05, // Smaller collapse for more dramatic effect
        tension: 350, // Higher tension for snappier animation
        friction: 5,   // Lower friction for faster response
        useNativeDriver: true,
      }),
      // Faster modal opacity fade
      Animated.timing(modalAnimations.modalOpacity, {
        toValue: 0,
        duration: 100, // Reduced from 150ms
        useNativeDriver: true,
      }),
      // Faster background fade
      Animated.timing(modalAnimations.overlayOpacity, {
        toValue: 0,
        duration: 100, // Reduced from 150ms
        useNativeDriver: true,
      }),
      // Immediate card restoration with bounce
      Animated.spring(cardScales[expandedIndex], {
        toValue: 1,
        tension: 300, // Higher tension for quicker bounce
        friction: 6,   // Lower friction for snappier response
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Optimized cleanup - batch state updates
      setExpandedCard(null);
      setIsExpanding(false);
      
      // Reset all modal animations to initial state for next use
      modalAnimations.modalOpacity.setValue(0);
      modalAnimations.modalScale.setValue(0.1);
      modalAnimations.overlayOpacity.setValue(0);
      modalAnimations.contentSlideAnim.setValue(80);
      modalAnimations.contentOpacity.setValue(0);
    });
  };


  const renderLevelCard = (level: LevelOption, index: number) => {
    const isSelected = selectedLevel === level.id;

    const lightGradientColors = {
      private: ['rgba(34, 197, 94, 0.08)', 'rgba(22, 163, 74, 0.05)', 'rgba(21, 128, 61, 0.03)'],
      personal: ['rgba(59, 130, 246, 0.08)', 'rgba(37, 99, 235, 0.05)', 'rgba(30, 58, 138, 0.03)'],
      cloud_find_beta: ['rgba(139, 92, 246, 0.08)', 'rgba(124, 58, 237, 0.05)', 'rgba(91, 33, 182, 0.03)']
    };
    
    // Premium dim color schemes
    const premiumDimColors = {
      private: {
        primary: 'rgba(34, 197, 94, 0.85)',
        secondary: 'rgba(22, 163, 74, 0.75)',
        accent: 'rgba(34, 197, 94, 0.65)',
        gradient: ['rgba(34, 197, 94, 0.18)', 'rgba(22, 163, 74, 0.12)', 'rgba(21, 128, 61, 0.08)', 'rgba(0, 0, 0, 0.95)'],
        glow: 'rgba(34, 197, 94, 0.35)',
        shadow: 'rgba(34, 197, 94, 0.25)',
        border: 'rgba(34, 197, 94, 0.45)',
        text: 'rgba(34, 197, 94, 0.95)',
        shimmer: 'rgba(34, 197, 94, 0.15)',
        highlight: 'rgba(34, 197, 94, 0.08)',
      },
      personal: {
        primary: 'rgba(59, 130, 246, 0.85)',
        secondary: 'rgba(37, 99, 235, 0.75)',
        accent: 'rgba(59, 130, 246, 0.65)',
        gradient: ['rgba(59, 130, 246, 0.18)', 'rgba(37, 99, 235, 0.12)', 'rgba(30, 58, 138, 0.08)', 'rgba(0, 0, 0, 0.95)'],
        glow: 'rgba(59, 130, 246, 0.35)',
        shadow: 'rgba(59, 130, 246, 0.25)',
        border: 'rgba(59, 130, 246, 0.45)',
        text: 'rgba(59, 130, 246, 0.95)',
        shimmer: 'rgba(59, 130, 246, 0.15)',
        highlight: 'rgba(59, 130, 246, 0.08)',
      },
      cloud_find_beta: {
        primary: 'rgba(139, 92, 246, 0.85)',
        secondary: 'rgba(124, 58, 237, 0.75)',
        accent: 'rgba(139, 92, 246, 0.65)',
        gradient: ['rgba(139, 92, 246, 0.18)', 'rgba(124, 58, 237, 0.12)', 'rgba(91, 33, 182, 0.08)', 'rgba(0, 0, 0, 0.95)'],
        glow: 'rgba(139, 92, 246, 0.35)',
        shadow: 'rgba(139, 92, 246, 0.25)',
        border: 'rgba(139, 92, 246, 0.45)',
        text: 'rgba(139, 92, 246, 0.95)',
        shimmer: 'rgba(139, 92, 246, 0.15)',
        highlight: 'rgba(139, 92, 246, 0.08)',
      },
    };

    const premiumColors = premiumDimColors[level.id];
    const darkBase = {
      unselectedCard: ['rgba(25, 25, 30, 0.8)', 'rgba(20, 20, 25, 0.6)', 'rgba(15, 15, 20, 0.4)'],
      border: 'rgba(255, 255, 255, 0.06)',
      textPrimary: 'rgba(248, 250, 252, 0.9)',
      textSecondary: 'rgba(248, 250, 252, 0.7)',
      textMuted: 'rgba(148, 163, 184, 0.7)',
      blur: 'rgba(255, 255, 255, 0.03)'
    };
    
    return (
      <Animated.View
        key={level.id}
        style={[
          styles.levelCard,
          {
            transform: [
              { translateY: slideAnim },
              { scale: cardScales[index] }
            ],
            opacity: fadeAnim,
          }
        ]}
      >
        <AnimatedGradientBorder
          isActive={isSelected}
          borderRadius={12}
          borderWidth={level.id === 'private' ? 1 : level.id === 'personal' ? 2 : 1}
          animationSpeed={level.id === 'private' ? 4000 : level.id === 'personal' ? 2000 : 3000}
          gradientColors={premiumGradientColors[level.id]}
        >
          <LinearGradient
            colors={isDarkMode ? 
              ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)'] as any :
              ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.015)', 'rgba(0, 0, 0, 0.01)'] as any
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={() => handleLevelSelect(level.id, index)}
            onLongPress={() => handleCardExpand(level.id, index)}
            delayLongPress={50}
            activeOpacity={0.85}
          >

            {/* Header - Title Only */}
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Text style={[
                  styles.levelTitle, 
                  { 
                    color: isDarkMode ? 
                      (isSelected ? '#ffffff' : darkBase.textPrimary) :
                      (isSelected ? '#1a1a1a' : '#1a1a1a')
                  }
                ]}>
                  {level.title}
                </Text>
              </View>
            </View>
            
            {/* Expansion Hint */}
            <View style={styles.expandHint}>
              <MaterialIcons 
                name="touch-app" 
                size={16} 
                color={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} 
              />
              <Text style={[
                styles.expandHintText,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }
              ]}>
                Hold to explore details
              </Text>
            </View>




          </TouchableOpacity>
          </LinearGradient>
        </AnimatedGradientBorder>
      </Animated.View>
    );
  };

  return (
    <>
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />

          {/* Minimal Header - Just spacing */}
          <View style={styles.headerSpacer} />

                  {/* Level Cards */}
        <ScrollView 
          style={styles.cardsContainer}
          contentContainerStyle={styles.cardsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsWrapper}>
            {EXPERIENCE_LEVELS.map((level, index) => renderLevelCard(level, index))}
          </View>
        </ScrollView>

          {/* Skip Option */}
          {onSkip && (
            <Animated.View 
              style={[
                styles.skipContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                <Text style={[styles.skipButtonText, { color: isDarkMode ? '#888' : '#666' }]}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>
      </PageBackground>
      
      {/* Expanded Modal */}
      {expandedCard && (
        <Modal
          visible={!!expandedCard}
          transparent={true}
          animationType="none"
          onRequestClose={handleModalClose}
        >
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          
          {/* Dark Overlay */}
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: modalAnimations.overlayOpacity }
            ]}
          >
            <TouchableWithoutFeedback onPress={handleModalClose}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
          </Animated.View>
          
          {/* Modal Content */}
          <View style={styles.modalContainer}>
            <Animated.View
              style={{
                opacity: modalAnimations.modalOpacity,
                transform: [
                  { scale: modalAnimations.modalScale }
                ],
              }}
            >
              <AnimatedGradientBorder
                isActive={true}
                borderRadius={24}
                borderWidth={expandedCard === 'private' ? 2 : expandedCard === 'personal' ? 3 : 2}
                animationSpeed={expandedCard === 'private' ? 3000 : expandedCard === 'personal' ? 1500 : 2500}
                gradientColors={premiumGradientColors[expandedCard!]}
              >
              <View
                style={styles.expandedModal}
              >
                <BlurView 
                  intensity={80} 
                  style={styles.modalGradient}
                  tint={isDarkMode ? 'dark' : 'light'}
                >
                <Animated.View 
                  style={[
                    styles.modalHeader,
                    {
                      opacity: modalAnimations.contentOpacity,
                      transform: [{ translateY: modalAnimations.contentSlideAnim }],
                    },
                  ]}
                >
                  <Text style={[
                    styles.modalTitle,
                    { color: isDarkMode ? '#F8FAFC' : '#1F2937' }
                  ]}>
                    {EXPERIENCE_LEVELS.find(l => l.id === expandedCard)?.title} Details
                  </Text>
                  <TouchableOpacity 
                    style={[
                      styles.modalCloseButton,
                      { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                    ]}
                    onPress={handleModalClose}
                  >
                    <MaterialIcons name="close" size={18} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  </TouchableOpacity>
                </Animated.View>
                
                <Animated.ScrollView 
                  style={[
                    styles.modalScrollView,
                    {
                      opacity: modalAnimations.contentOpacity,
                      transform: [{ translateY: modalAnimations.contentSlideAnim }],
                    },
                  ]}
                  showsVerticalScrollIndicator={false}
                >
                  {(() => {
                    const level = EXPERIENCE_LEVELS.find(l => l.id === expandedCard);
                    if (!level) return null;
                    
                    const premiumColors = {
                      private: { primary: '#34D399', secondary: '#10B981', accent: '#A7F3D0' },
                      personal: { primary: '#60A5FA', secondary: '#3B82F6', accent: '#BFDBFE' },
                      cloud_find_beta: { primary: '#A78BFA', secondary: '#8B5CF6', accent: '#DDD6FE' }
                    }[level.id];
                    
                    return (
                      <View style={styles.modalContentContainer}>
                        {/* Subtitle & Description */}
                        <View style={styles.modalIntroSection}>
                          <Text style={[
                            styles.modalSubtitle,
                            { color: isDarkMode ? premiumColors.primary : premiumColors.secondary }
                          ]}>
                            {level.subtitle}
                          </Text>
                          <Text style={[
                            styles.modalDescription,
                            { color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(31, 41, 55, 0.85)' }
                          ]}>
                            {level.description}
                          </Text>
                        </View>
                        
                        {/* Core Features */}
                        <View style={styles.modalSection}>
                          <Text style={[
                            styles.sectionTitle,
                            { color: isDarkMode ? premiumColors.accent : premiumColors.primary }
                          ]}>
                            Core Features
                          </Text>
                          {level.features.map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                              <View style={[
                                styles.featureIcon,
                                { backgroundColor: isDarkMode ? `${premiumColors.primary}20` : `${premiumColors.primary}15` }
                              ]}>
                                <MaterialIcons 
                                  name="check" 
                                  size={14} 
                                  color={premiumColors.primary} 
                                />
                              </View>
                              <Text style={[
                                styles.featureText,
                                { color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)' }
                              ]}>
                                {feature}
                              </Text>
                            </View>
                          ))}
                        </View>
                        
                        {/* Additional Details */}
                        <View style={styles.modalSection}>
                          <Text style={[
                            styles.sectionTitle,
                            { color: isDarkMode ? premiumColors.accent : premiumColors.primary }
                          ]}>
                            {level.id === 'private' ? 'Privacy Benefits' : 
                             level.id === 'personal' ? 'Growth Benefits' : 'Social Benefits'}
                          </Text>
                          {(
                            level.id === 'private' ? [
                              'Complete data ownership and control',
                              'No tracking, analytics, or profiling',
                              'Works entirely offline when needed',
                              'Military-grade local encryption'
                            ] :
                            level.id === 'personal' ? [
                              'Advanced learning algorithms adapt to you',
                              'Secure cloud sync across all devices',
                              'Deep insights into your patterns',
                              'Private analytics dashboard'
                            ] : [
                              'AI-powered social compatibility matching',
                              'Real-time event discovery and recommendations', 
                              'Anonymous emotional data for better matches',
                              'Beta access to cutting-edge social features'
                            ]
                          ).map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                              <MaterialIcons 
                                name={level.id === 'private' ? 'security' : level.id === 'personal' ? 'trending-up' : 'people'} 
                                size={16} 
                                color={premiumColors.secondary} 
                              />
                              <Text style={[
                                styles.benefitText,
                                { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)' }
                              ]}>
                                {benefit}
                              </Text>
                            </View>
                          ))}
                        </View>
                        
                        {/* Action Buttons */}
                        <View style={styles.modalActionContainer}>
                          <TouchableOpacity
                            style={[
                              styles.modalActionButton,
                              { 
                                backgroundColor: premiumColors.primary,
                              }
                            ]}
                            onPress={() => {
                              setSelectedLevel(level.id);
                              handleModalClose();
                              onSelectionComplete(level.id);
                            }}
                          >
                            <Text style={styles.modalActionText}>
                              Begin Your {level.title} Journey
                            </Text>
                            <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })()}
                </Animated.ScrollView>
              </BlurView>
              </View>
            </AnimatedGradientBorder>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 16,
  },
  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.8,
    maxWidth: width * 0.85,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  cardsContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardsWrapper: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  levelCard: {
    width: '95%',
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    position: 'relative',
    marginBottom: 4,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 18,
    zIndex: -1,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    opacity: 0.1,
  },
  cardGradient: {
    borderRadius: 12,
    padding: 18,
    position: 'relative',
  },
  cardTouchable: {
    width: '100%',
  },
  cardHeader: {
    marginBottom: 12,
    marginTop: 0,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  levelSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  levelDescription: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
    marginBottom: 20,
    opacity: 0.85,
  },


  actionContainer: {
    padding: 24,
    gap: 16,
  },
  buttonContainer: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 37,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.3,
    fontFamily: 'Nunito_500Medium',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    opacity: 0.7,
  },
  
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  expandedModal: {
    width: width * 0.95,
    height: 650,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  modalGradient: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  
  // Additional styles for new modal content
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  expandHintText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    opacity: 0.6,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContentContainer: {
    paddingBottom: 20,
  },
  modalIntroSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.9,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    flex: 1,
    lineHeight: 20,
  },
  modalActionContainer: {
    marginTop: 20,
  },
  modalActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 37,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  modalSecondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  skipContainer: {
    padding: 24,
    alignItems: 'center',
  },
  headerSpacer: {
    height: 20,
  },
});