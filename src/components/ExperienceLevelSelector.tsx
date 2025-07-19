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
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { PageBackground } from './PageBackground';

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
    title: '🛡️ Private Mode',
    subtitle: 'Maximum Privacy',
    description: 'Complete offline experience with zero data collection',
    features: [
      'Zero data collection',
      'Completely offline',
      'Local chat only',
      'No cloud connectivity',
      'Special ToS protection'
    ],
    icon: 'shield-checkmark',
    color: NuminaColors.green,
  },
  {
    id: 'personal',
    title: '🧠 Personal Growth',
    subtitle: 'Individual Journey',
    description: 'Local UBPM analysis with enhanced chat features',
    features: [
      'Local UBPM analysis',
      'Adaptive AI personality',
      'Personal analytics',
      'Enhanced chat features',
      'Private growth tracking'
    ],
    icon: 'person',
    color: NuminaColors.blue,
    recommended: true,
  },
  {
    id: 'cloud_find_beta',
    title: '☁️ Cloud Find Beta',
    subtitle: 'Full Social Experience',
    description: 'Complete UBPM integration with social discovery',
    features: [
      'Full UBPM integration',
      'Live event discovery',
      'Intelligent people matching',
      'Collective intelligence',
      'Premium features (requires credits)'
    ],
    icon: 'cloud',
    color: NuminaColors.purple,
  },
];

export const ExperienceLevelSelector: React.FC<ExperienceLevelSelectorProps> = ({
  onSelectionComplete,
  onSkip,
}) => {
  const { isDarkMode } = useTheme();
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>('personal');
  const [showDetails, setShowDetails] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardScales = useRef(
    EXPERIENCE_LEVELS.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLevelSelect = (level: ExperienceLevel, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLevel(level);
    
    // Animate selected card
    Animated.sequence([
      Animated.timing(cardScales[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardScales[index], {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardScales[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSelectionComplete(selectedLevel);
  };

  const renderLevelCard = (level: LevelOption, index: number) => {
    const isSelected = selectedLevel === level.id;
    
    return (
      <Animated.View
        key={level.id}
        style={[
          styles.levelCard,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isSelected ? level.color : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
            borderWidth: isSelected ? 2 : 1,
            transform: [
              { translateY: slideAnim },
              { scale: cardScales[index] }
            ],
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => handleLevelSelect(level.id, index)}
          activeOpacity={0.9}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={[styles.levelTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                {level.title}
              </Text>
              {level.recommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: `${level.color}20` }]}>
                  <Text style={[styles.recommendedText, { color: level.color }]}>
                    RECOMMENDED
                  </Text>
                </View>
              )}
            </View>
            
            <View style={[styles.iconContainer, { backgroundColor: `${level.color}20` }]}>
              <Ionicons name={level.icon as any} size={24} color={level.color} />
            </View>
          </View>

          {/* Subtitle */}
          <Text style={[styles.levelSubtitle, { color: level.color }]}>
            {level.subtitle}
          </Text>

          {/* Description */}
          <Text style={[styles.levelDescription, { color: isDarkMode ? '#ccc' : '#666' }]}>
            {level.description}
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {level.features.slice(0, 3).map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.featureItem}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={14} 
                  color={level.color} 
                />
                <Text style={[styles.featureText, { color: isDarkMode ? '#ddd' : '#555' }]}>
                  {feature}
                </Text>
              </View>
            ))}
            {level.features.length > 3 && (
              <Text style={[styles.moreFeatures, { color: isDarkMode ? '#888' : '#999' }]}>
                +{level.features.length - 3} more features
              </Text>
            )}
          </View>

          {/* Selection Indicator */}
          {isSelected && (
            <View style={[styles.selectionIndicator, { backgroundColor: level.color }]}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <PageBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />

        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
            Choose Your Experience
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#ccc' : '#666' }]}>
            Select how you'd like to use Numina. You can change this later in settings.
          </Text>
        </Animated.View>

        {/* Level Cards */}
        <View style={styles.cardsContainer}>
          {EXPERIENCE_LEVELS.map((level, index) => renderLevelCard(level, index))}
        </View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.color || NuminaColors.blue }
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>
              Continue with {EXPERIENCE_LEVELS.find(l => l.id === selectedLevel)?.subtitle}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={[styles.skipButtonText, { color: isDarkMode ? '#888' : '#666' }]}>
                Skip for now
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  levelCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    position: 'relative',
  },
  cardTouchable: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    gap: 8,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  levelDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  moreFeatures: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 22,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContainer: {
    padding: 24,
    gap: 16,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});