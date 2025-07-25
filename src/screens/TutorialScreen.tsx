import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { PageBackground } from '../components/ui/PageBackground';
import { areFontsLoaded } from '../utils/fonts';

const { width } = Dimensions.get('window');

interface TutorialScreenProps {
  onNavigateHome: () => void;
  onStartChat: () => void;
}

interface ActionOption {
  id: string;
  title: string;
  description: string;
  features: string[];
  icon: string;
  color: string;
  action: () => void;
}

const ACTION_OPTIONS: ActionOption[] = [
  {
    id: 'chat',
    title: 'Start Chatting',
    description: 'Jump right into conversation with your AI companion',
    features: [
      'Instant AI conversations',
      '25+ integrated tools',
      'Natural language processing',
      'Real-time responses',
      'Adaptive personality'
    ],
    icon: 'chat-bubble',
    color: '#4F46E5',
    action: () => {}
  },
  {
    id: 'explore',
    title: 'Explore Features',
    description: 'Browse analytics, tools, and advanced capabilities',
    features: [
      'Advanced analytics dashboard',
      'Emotional insights tracking',
      'Growth pattern analysis',
      'Comprehensive data views',
      'Personalized recommendations'
    ],
    icon: 'explore',
    color: '#7C3AED',
    action: () => {}
  },
  {
    id: 'learn',
    title: 'Learn More',
    description: 'Discover what Numina can do for your personal growth',
    features: [
      'AI-powered insights',
      'Personal growth tracking',
      'Emotional analytics',
      'Cloud sync capabilities',
      'Premium features overview'
    ],
    icon: 'lightbulb',
    color: '#10B981',
    action: () => {}
  },
];

export const TutorialScreen: React.FC<TutorialScreenProps> = ({
  onNavigateHome,
  onStartChat,
}) => {
  const { isDarkMode } = useTheme();
  const [fontsReady, setFontsReady] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  
  // Set up action functions
  ACTION_OPTIONS[0].action = onStartChat;
  ACTION_OPTIONS[1].action = onNavigateHome;
  ACTION_OPTIONS[2].action = onNavigateHome;
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnimations = useRef(
    ACTION_OPTIONS.map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(20),
      translateY: new Animated.Value(0),
    }))
  ).current;
  
  // Text expansion animations
  const textAnimations = useRef({
    descriptionOpacity: new Animated.Value(0),
    featuresOpacity: new Animated.Value(0),
    actionOpacity: new Animated.Value(0),
  }).current;

  useEffect(() => {
    const checkFonts = () => {
      if (areFontsLoaded()) {
        setFontsReady(true);
      } else {
        setTimeout(checkFonts, 100);
      }
    };
    checkFonts();
  }, []);

  useEffect(() => {
    if (fontsReady) {
      // Header animation
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
      ]).start(() => {
        // Stagger card animations
        Animated.stagger(150, 
          cardAnimations.map(anim => 
            Animated.parallel([
              Animated.timing(anim.opacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(anim.translateX, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
            ])
          )
        ).start();
      });
    }
  }, [fontsReady]);

  const handleCardPress = (option: ActionOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    option.action();
  };
  
  const handleCardExpand = (option: ActionOption, index: number) => {
    if (expandedCard === option.id) {
      // Collapse
      setExpandedCard(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Reset text animations
      textAnimations.descriptionOpacity.setValue(0);
      textAnimations.featuresOpacity.setValue(0);
      textAnimations.actionOpacity.setValue(0);
      
      // Move boxes back up
      ACTION_OPTIONS.forEach((_, i) => {
        if (i > index) {
          Animated.timing(cardAnimations[i].translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      });
    } else {
      setExpandedCard(option.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Calculate expansion height (approximately 200px)
      const expansionHeight = 200;
      
      // Move boxes below the expanded one down
      ACTION_OPTIONS.forEach((_, i) => {
        if (i > index) {
          Animated.timing(cardAnimations[i].translateY, {
            toValue: expansionHeight,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      });
      
      // Sequential text fade-in after boxes move
      setTimeout(() => {
        Animated.stagger(200, [
          Animated.timing(textAnimations.descriptionOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(textAnimations.featuresOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(textAnimations.actionOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);
    }
  };
  
  const renderActionCard = ({ item: option, index }: { item: ActionOption; index: number }) => {
    const isExpanded = expandedCard === option.id;
    
    return (
      <View style={styles.cardContainer}>
        {/* Brick Button */}
        <Animated.View
          style={[
            styles.brickCard,
            {
              opacity: cardAnimations[index].opacity,
              transform: [
                { translateX: cardAnimations[index].translateX },
                { translateY: cardAnimations[index].translateY }
              ],
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.brickButton,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }
            ]}
            onPress={() => handleCardPress(option)}
            onLongPress={() => handleCardExpand(option, index)}
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
                    name={option.icon as any}
                    size={20} 
                    color={option.color} 
                  />
                  <Text style={[
                    styles.brickTitle,
                    { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
                  ]}>
                    {option.title}
                  </Text>
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
        </Animated.View>
        
        {/* Expanded Text Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <Animated.View
              style={[
                styles.textSection,
                { opacity: textAnimations.descriptionOpacity }
              ]}
            >
              <Text style={[
                styles.expandedDescription,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)' }
              ]}>
                {option.description}
              </Text>
            </Animated.View>
            
            <Animated.View
              style={[
                styles.textSection,
                { opacity: textAnimations.featuresOpacity }
              ]}
            >
              <Text style={[
                styles.featuresTitle,
                { color: option.color }
              ]}>
                Key Features:
              </Text>
              {option.features.slice(0, 3).map((feature, idx) => (
                <Text key={idx} style={[
                  styles.featureText,
                  { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }
                ]}>
                  • {feature}
                </Text>
              ))}
            </Animated.View>
            
            <Animated.View
              style={[
                styles.textSection,
                { opacity: textAnimations.actionOpacity }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.expandedActionButton,
                  { backgroundColor: option.color }
                ]}
                onPress={() => {
                  handleCardExpand(option, index); // Close expansion
                  option.action();
                }}
              >
                <Text style={styles.expandedActionText}>
                  {option.title === 'Start Chatting' ? 'Begin Chatting' : 
                   option.title === 'Explore Features' ? 'Explore Now' : 'Learn More'}
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </View>
    );
  };

  if (!fontsReady) {
    return (
      <View style={styles.loadingContainer}>
        <PageBackground />
      </View>
    );
  }

  return (
    <>
      <PageBackground>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={[styles.title, { fontFamily: fontsReady ? 'Nunito_700Bold' : 'System' }]}>
              Get Started
            </Text>
            <Text style={[styles.subtitle, { fontFamily: fontsReady ? 'Nunito_400Regular' : 'System' }]}>
              Choose how you want to begin
            </Text>
          </Animated.View>

          {/* FlatList Cards */}
          <FlatList
            data={ACTION_OPTIONS}
            renderItem={renderActionCard}
            keyExtractor={(item) => item.id}
            style={styles.flatListContainer}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
          />

          {/* Primary Action */}
          <Animated.View
            style={[
              styles.primaryButtonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={onStartChat}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={[styles.primaryButtonText, { fontFamily: fontsReady ? 'Nunito_600SemiBold' : 'System' }]}>
                  Start Conversation
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </PageBackground>
      
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
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
  cardContainer: {
    marginBottom: 16,
  },
  brickCard: {
    width: '100%',
  },
  brickButton: {
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
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
    fontWeight: '600',
    letterSpacing: -0.2,
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
  expandedContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  textSection: {
    marginBottom: 16,
  },
  expandedDescription: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    paddingLeft: 8,
  },
  expandedActionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
    alignSelf: 'center',
  },
  expandedActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  primaryButtonContainer: {
    marginTop: 20,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  
});

export default TutorialScreen;