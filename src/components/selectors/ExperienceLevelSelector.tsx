import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaColors } from '../../utils/colors';
import { PageBackground } from '../ui/PageBackground';
import { HeaderGradient } from '../ui/HeaderGradient';

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
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerSlideAnim = useRef(new Animated.Value(-30)).current;
  const cardScales = useRef(
    EXPERIENCE_LEVELS.map(() => new Animated.Value(1))
  ).current;
  
  // Expansion animations
  const expansionHeight = useRef(new Animated.Value(0)).current;
  const expansionOpacity = useRef(new Animated.Value(0)).current;
  
  // Content fade animations for ladder effect
  const contentAnimations = useRef({
    descriptionOpacity: new Animated.Value(0),
    featuresOpacity: new Animated.Value(0),
    benefitsOpacity: new Animated.Value(0),
    actionOpacity: new Animated.Value(0),
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
    
    if (expandedCard === level) {
      // Collapse if already expanded
      handleCardCollapse();
      return;
    }
    
    setIsExpanding(true);
    setExpandedCard(level);
    setSelectedLevel(level);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Reset all content animations
    contentAnimations.descriptionOpacity.setValue(0);
    contentAnimations.featuresOpacity.setValue(0);
    contentAnimations.benefitsOpacity.setValue(0);
    contentAnimations.actionOpacity.setValue(0);
    
    // Expand animation
    Animated.parallel([
      // Height expansion
      Animated.timing(expansionHeight, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      // Overall opacity
      Animated.timing(expansionOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start ladder fade-in from top down
      Animated.stagger(150, [
        Animated.timing(contentAnimations.descriptionOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnimations.featuresOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnimations.benefitsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnimations.actionOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      
      setIsExpanding(false);
    });
  };
  
  const handleCardCollapse = () => {
    if (isExpanding) return;
    
    setIsExpanding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Collapse animation
    Animated.parallel([
      // Content fade out quickly
      Animated.timing(contentAnimations.descriptionOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimations.featuresOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimations.benefitsOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimations.actionOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      // Height collapse
      Animated.timing(expansionHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      // Overall opacity
      Animated.timing(expansionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setExpandedCard(null);
      setIsExpanding(false);
      
      // Reset animations
      expansionHeight.setValue(0);
      expansionOpacity.setValue(0);
      contentAnimations.descriptionOpacity.setValue(0);
      contentAnimations.featuresOpacity.setValue(0);
      contentAnimations.benefitsOpacity.setValue(0);
      contentAnimations.actionOpacity.setValue(0);
    });
  };

  const renderLevelCard = ({ item: level, index }: { item: LevelOption; index: number }) => {
    const isSelected = selectedLevel === level.id;
    const isExpanded = expandedCard === level.id;
    
    return (
      <Animated.View
        style={[
          styles.flatListItem,
          {
            transform: [
              { translateY: slideAnim },
              { scale: cardScales[index] }
            ],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Main Card */}
        <TouchableOpacity
          style={[
            styles.brickButton,
            {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? level.color : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
            }
          ]}
          onPress={() => handleLevelSelect(level.id, index)}
          onLongPress={() => handleCardExpand(level.id, index)}
          delayLongPress={200}
          activeOpacity={0.7}
        >
          <BlurView 
            intensity={isDarkMode ? 20 : 40}
            style={styles.blurContainer}
            tint={isDarkMode ? 'dark' : 'light'}
          >
            <View style={styles.brickContent}>
              <View style={styles.brickHeader}>
                <MaterialIcons 
                  name={level.icon as any}
                  size={20} 
                  color={level.color} 
                />
                <Text style={[
                  styles.brickTitle,
                  { 
                    color: isDarkMode ? '#ffffff' : '#1a1a1a',
                    fontWeight: isSelected ? '700' : '600'
                  }
                ]}>
                  {level.title}
                </Text>
                {isSelected && (
                  <MaterialIcons 
                    name="check-circle" 
                    size={16} 
                    color={level.color} 
                  />
                )}
              </View>
              <View style={styles.expandHint}>
                <MaterialIcons 
                  name="touch-app" 
                  size={12} 
                  color={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} 
                />
                <Text style={[
                  styles.expandHintText,
                  { color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }
                ]}>
                  press & hold
                </Text>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
        
        {/* Expanded Content */}
        {isExpanded && (
          <Animated.View
            style={[
              styles.expandedContent,
              {
                height: expansionHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400],
                }),
                opacity: expansionOpacity,
              }
            ]}
          >
            <View style={[
              styles.expandedInner,
              { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.8)' }
            ]}>
              
              {/* Description Section */}
              <Animated.View 
                style={[
                  styles.expandedSection,
                  { opacity: contentAnimations.descriptionOpacity }
                ]}
              >
                <Text style={[
                  styles.expandedSubtitle,
                  { color: level.color }
                ]}>
                  {level.subtitle}
                </Text>
                <Text style={[
                  styles.expandedDescription,
                  { color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(31, 41, 55, 0.85)' }
                ]}>
                  {level.description}
                </Text>
              </Animated.View>
              
              {/* Features Section */}
              <Animated.View 
                style={[
                  styles.expandedSection,
                  { opacity: contentAnimations.featuresOpacity }
                ]}
              >
                <Text style={[
                  styles.expandedSectionTitle,
                  { color: level.color }
                ]}>
                  Core Features
                </Text>
                {level.features.slice(0, 3).map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <View style={[
                      styles.featureDot,
                      { backgroundColor: level.color }
                    ]} />
                    <Text style={[
                      styles.featureText,
                      { color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(31, 41, 55, 0.9)' }
                    ]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </Animated.View>
              
              {/* Action Button */}
              <Animated.View 
                style={[
                  styles.expandedActionContainer,
                  { opacity: contentAnimations.actionOpacity }
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.expandedActionButton,
                    { backgroundColor: level.color }
                  ]}
                  onPress={() => {
                    setSelectedLevel(level.id);
                    handleCardCollapse();
                    onSelectionComplete(level.id);
                  }}
                >
                  <Text style={styles.expandedActionText}>
                    Choose {level.title}
                  </Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
              
            </View>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <>
      <PageBackground>
        <View style={styles.container}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />

          {/* Minimal Header - Just spacing */}
          <View style={styles.headerSpacer} />

          {/* FlatList Cards */}
          <FlatList
            data={EXPERIENCE_LEVELS}
            renderItem={renderLevelCard}
            keyExtractor={(item) => item.id}
            style={styles.flatListContainer}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          />
          
          {/* Continue Button */}
          <Animated.View
            style={[
              styles.continueButtonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.continueButton,
                { backgroundColor: EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.color || '#4F46E5' }
              ]}
              onPress={() => onSelectionComplete(selectedLevel)}
              activeOpacity={0.9}
            >
              <Text style={styles.continueButtonText}>
                Continue with {EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.title}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

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
        </View>
      </PageBackground>
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
  flatListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  flatListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  flatListItem: {
    marginBottom: 16,
  },
  continueButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  brickButton: {
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  brickContent: {
    alignItems: 'center',
  },
  brickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  brickTitle: {
    fontSize: 16,
    letterSpacing: -0.2,
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
  
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandHintText: {
    fontSize: 10,
    opacity: 0.6,
  },
  skipContainer: {
    padding: 24,
    alignItems: 'center',
  },
  headerSpacer: {
    height: 20,
  },
  
  // Expanded content styles
  expandedContent: {
    overflow: 'hidden',
    marginTop: 8,
    borderRadius: 12,
  },
  expandedInner: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandedSection: {
    marginBottom: 16,
  },
  expandedSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  expandedDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.9,
  },
  expandedSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 10,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  expandedActionContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  expandedActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  expandedActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});