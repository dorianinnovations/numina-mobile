import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';
import { ReasoningTreeVisualization } from './ReasoningTreeVisualization';
import { useAuth } from '../contexts/SimpleAuthContext';
import ApiService from '../services/api';

const { width } = Dimensions.get('window');

interface Recommendation {
  level: number;
  title: string;
  description: string;
  reasoning: string;
  cascadeConnection: string;
  potentialOutcomes: string[];
  difficulty: number;
  timeframe: 'immediate' | 'short-term' | 'long-term';
  category: 'growth' | 'wellness' | 'creativity' | 'connection' | 'learning';
}

interface CascadingRecommendationsProps {
  userId: string;
  focusArea?: string;
  onRecommendationAction?: (recommendation: Recommendation, action: string) => void;
}

interface ReasoningData {
  explanation: string;
  methodology: string;
  confidence: number;
  primaryFactors: string[];
  alternativesConsidered: string[];
}

export const CascadingRecommendations: React.FC<CascadingRecommendationsProps> = ({
  userId,
  focusArea = 'general',
  onRecommendationAction
}) => {
  const { isDarkMode } = useTheme();
  const { user, authToken } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reasoningData, setReasoningData] = useState<ReasoningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showReasoningTree, setShowReasoningTree] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef<Animated.Value[]>([]).current;
  
  // Custom loader animations
  const loaderRotation = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0.3)).current;

  // Initialize animation values for recommendations
  useEffect(() => {
    const newSlideAnims = recommendations.map(() => new Animated.Value(50));
    slideAnims.splice(0, slideAnims.length, ...newSlideAnims);
  }, [recommendations.length]);

  // Load cascading recommendations with streaming
  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsStreaming(true);
    setStreamingProgress(0);
    setStreamingStatus('Initializing...');
    
    try {
      // Try streaming first, fall back to static if needed
      const streamingResponse = await ApiService.generateCascadingRecommendationsStreaming({
        depth: 3,
        focusArea,
        includeReasoningTree: true,
      }, (chunk) => {
        // Handle streaming chunks with progress updates
        if (chunk.type === 'status') {
          console.log(`📊 ${chunk.message} (${chunk.progress}%)`);
          setStreamingStatus(chunk.message);
          setStreamingProgress(chunk.progress || 0);
        } else if (chunk.type === 'recommendation_chunk') {
          console.log(`📝 Processing: ${chunk.content}`);
          setStreamingStatus('Processing recommendations...');
        } else if (chunk.type === 'complete') {
          // Final data received
          setStreamingStatus('Finalizing...');
          setStreamingProgress(100);
          
          const cascadingTree = chunk.data.cascadingTree || chunk.data;
          setRecommendations(cascadingTree.recommendations || []);
          setReasoningData(cascadingTree.reasoning || chunk.data.reasoningTree);
          
          // Small delay to show completion, then animate
          setTimeout(() => {
            setIsStreaming(false);
            
            // Animate recommendations in
            Animated.stagger(200, [
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              ...slideAnims.map(anim =>
                Animated.timing(anim, {
                  toValue: 0,
                  duration: 500,
                  useNativeDriver: true,
                })
              ),
            ]).start();
          }, 500);
        }
      });

      // Handle completion for any remaining processing
      if (streamingResponse.complete && streamingResponse.content) {
        const cascadingTree = streamingResponse.content.cascadingTree || streamingResponse.content;
        setRecommendations(cascadingTree.recommendations || []);
        setReasoningData(cascadingTree.reasoning || streamingResponse.content.reasoningTree);
        
        setIsStreaming(false);
        
        // Animate recommendations in
        Animated.stagger(200, [
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          ...slideAnims.map(anim =>
            Animated.timing(anim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            })
          ),
        ]).start();
      }
    } catch (error) {
      console.error('Error loading cascading recommendations:', error);
      setError('Failed to load recommendations. Please try again.');
      setIsStreaming(false);
      
      // Fallback to demo data
      setRecommendations(getDemoRecommendations());
      setReasoningData(getDemoReasoningData());
      
      // Still animate demo data
      Animated.stagger(200, [
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        ...slideAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } finally {
      setLoading(false);
    }
  }, [userId, focusArea]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRecommendationPress = (recommendation: Recommendation, action: string) => {
    NuminaAnimations.haptic.medium();
    setSelectedRecommendation(recommendation);
    
    if (action === 'view-reasoning') {
      setShowReasoningTree(true);
    } else if (onRecommendationAction) {
      onRecommendationAction(recommendation, action);
    }
  };

  const toggleCardExpansion = (index: number) => {
    NuminaAnimations.haptic.light();
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'growth': return 'trending-up';
      case 'wellness': return 'heart';
      case 'creativity': return 'edit-3';
      case 'connection': return 'users';
      case 'learning': return 'book-open';
      default: return 'circle';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'growth': return isDarkMode ? NuminaColors.chatGreen[400] : NuminaColors.chatGreen[500];
      case 'wellness': return isDarkMode ? NuminaColors.chatBlue[400] : NuminaColors.chatBlue[500];
      case 'creativity': return isDarkMode ? NuminaColors.chatPurple[400] : NuminaColors.chatPurple[500];
      case 'connection': return isDarkMode ? NuminaColors.chatYellow[400] : NuminaColors.chatYellow[500];
      case 'learning': return isDarkMode ? NuminaColors.chatBlue[400] : NuminaColors.chatBlue[500];
      default: return isDarkMode ? '#666666' : '#999999';
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 3) return isDarkMode ? NuminaColors.chatGreen[400] : NuminaColors.chatGreen[500];
    if (difficulty <= 6) return isDarkMode ? NuminaColors.chatYellow[400] : NuminaColors.chatYellow[500];
    return isDarkMode ? NuminaColors.chatRed[400] : NuminaColors.chatRed[500];
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 3) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    return 'Challenging';
  };

  const renderRecommendationCard = (recommendation: Recommendation, index: number) => {
    const isExpanded = expandedCards.has(index);
    const categoryColor = getCategoryColor(recommendation.category);
    const difficultyColor = getDifficultyColor(recommendation.difficulty);
    const slideAnim = slideAnims[index] || new Animated.Value(0);

    return (
      <Animated.View
        key={index}
        style={[
          styles.recommendationCard,
          {
            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderLeftColor: categoryColor,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Level Indicator */}
        <View style={[styles.levelIndicator, { backgroundColor: categoryColor }]}>
          <Text style={styles.levelText}>L{recommendation.level}</Text>
        </View>

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.categoryIcon}>
            <Feather
              name={getCategoryIcon(recommendation.category) as any}
              size={18}
              color={categoryColor}
            />
          </View>
          
          <Text style={[
            styles.recommendationTitle,
            { color: isDarkMode ? '#ffffff' : '#000000' }
          ]}>
            {recommendation.title}
          </Text>

          <TouchableOpacity
            onPress={() => toggleCardExpansion(index)}
            style={styles.expandButton}
          >
            <Feather
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={isDarkMode ? '#999999' : '#666666'}
            />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={[
          styles.recommendationDescription,
          { color: isDarkMode ? '#cccccc' : '#666666' }
        ]}>
          {recommendation.description}
        </Text>

        {/* Metadata */}
        <View style={styles.metadataRow}>
          <View style={[styles.metadataBadge, { backgroundColor: difficultyColor + '20' }]}>
            <Text style={[styles.metadataText, { color: difficultyColor }]}>
              {getDifficultyLabel(recommendation.difficulty)}
            </Text>
          </View>

          <View style={[styles.metadataBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.metadataText, { color: categoryColor }]}>
              {recommendation.timeframe}
            </Text>
          </View>

          <View style={[styles.metadataBadge, { backgroundColor: categoryColor + '15' }]}>
            <Text style={[styles.metadataText, { color: categoryColor }]}>
              {recommendation.category}
            </Text>
          </View>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <Animated.View style={styles.expandedContent}>
            {/* Reasoning */}
            <View style={styles.reasoningSection}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? NuminaColors.chatBlue[300] : NuminaColors.chatBlue[600] }
              ]}>
                Why this matters:
              </Text>
              <Text style={[
                styles.reasoningText,
                { color: isDarkMode ? '#dddddd' : '#555555' }
              ]}>
                {recommendation.reasoning}
              </Text>
            </View>

            {/* Potential Outcomes */}
            <View style={styles.outcomesSection}>
              <Text style={[
                styles.sectionTitle,
                { color: isDarkMode ? NuminaColors.chatGreen[300] : NuminaColors.chatGreen[600] }
              ]}>
                Potential outcomes:
              </Text>
              {recommendation.potentialOutcomes.map((outcome, idx) => (
                <Text key={idx} style={[
                  styles.outcomeItem,
                  { color: isDarkMode ? '#dddddd' : '#555555' }
                ]}>
                  ✓ {outcome}
                </Text>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => handleRecommendationPress(recommendation, 'accept')}
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  { backgroundColor: categoryColor }
                ]}
              >
                <Feather name="check" size={14} color="#ffffff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRecommendationPress(recommendation, 'view-reasoning')}
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: categoryColor + '40'
                  }
                ]}
              >
                <MaterialCommunityIcons name="brain" size={14} color={categoryColor} />
                <Text style={[styles.secondaryButtonText, { color: categoryColor }]}>
                  Why?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleRecommendationPress(recommendation, 'save')}
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: categoryColor + '40'
                  }
                ]}
              >
                <Feather name="bookmark" size={14} color={categoryColor} />
                <Text style={[styles.secondaryButtonText, { color: categoryColor }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Cascade Connection Indicator */}
        {index < recommendations.length - 1 && (
          <View style={styles.cascadeConnection}>
            <View style={[styles.connectionLine, { backgroundColor: categoryColor + '40' }]} />
            <View style={[styles.connectionArrow, { borderTopColor: categoryColor + '60' }]} />
          </View>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={isDarkMode ? NuminaColors.chatBlue[400] : NuminaColors.chatBlue[500]} 
        />
        <Text style={[
          styles.loadingText,
          { color: isDarkMode ? '#cccccc' : '#666666' }
        ]}>
          {isStreaming ? streamingStatus : 'Generating your personalized recommendations...'}
        </Text>
        
        {isStreaming && (
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressBar,
              { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }
            ]}>
              <View style={[
                styles.progressFill,
                { 
                  width: `${streamingProgress}%`,
                  backgroundColor: isDarkMode ? NuminaColors.chatBlue[400] : NuminaColors.chatBlue[500]
                }
              ]} />
            </View>
            <Text style={[
              styles.progressText,
              { color: isDarkMode ? '#999999' : '#666666' }
            ]}>
              {streamingProgress}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={isDarkMode 
            ? [NuminaColors.chatBlue[600], NuminaColors.chatPurple[600]]
            : [NuminaColors.chatBlue[500], NuminaColors.chatPurple[500]]
          }
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons name="auto-fix" size={24} color="#ffffff" />
          <Text style={styles.headerTitle}>Cascading Insights</Text>
          <TouchableOpacity
            onPress={loadRecommendations}
            style={styles.refreshButton}
          >
            <Feather name="refresh-cw" size={18} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Focus Area Indicator */}
      <View style={styles.focusAreaContainer}>
        <Text style={[
          styles.focusAreaText,
          { color: isDarkMode ? '#cccccc' : '#666666' }
        ]}>
          Focus: {focusArea.charAt(0).toUpperCase() + focusArea.slice(1)}
        </Text>
      </View>

      {/* Recommendations */}
      <ScrollView
        style={styles.recommendationsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recommendationsContent}>
          {recommendations.map(renderRecommendationCard)}
        </View>
      </ScrollView>

      {/* Reasoning Tree Modal */}
      {reasoningData && (
        <ReasoningTreeVisualization
          reasoningData={reasoningData}
          visible={showReasoningTree}
          onClose={() => setShowReasoningTree(false)}
          recommendationTitle={selectedRecommendation?.title}
        />
      )}
    </View>
  );
};

// Demo data for fallback
function getDemoRecommendations(): Recommendation[] {
  return [
    {
      level: 1,
      title: "Daily Reflection Practice",
      description: "Start with 5 minutes of daily reflection to build self-awareness",
      reasoning: "Your interaction patterns show deep engagement with introspective conversations",
      cascadeConnection: "foundation",
      potentialOutcomes: ["Increased self-awareness", "Better decision-making", "Emotional clarity"],
      difficulty: 2,
      timeframe: "immediate",
      category: "growth"
    },
    {
      level: 2,
      title: "Creative Expression Sessions",
      description: "Build on your reflection practice with creative outlets for processing insights",
      reasoning: "Reflection provides raw material that creative expression can transform into breakthroughs",
      cascadeConnection: "amplification",
      potentialOutcomes: ["Enhanced creativity", "Deeper insights", "Stress relief"],
      difficulty: 4,
      timeframe: "short-term",
      category: "creativity"
    },
    {
      level: 3,
      title: "Community Connection",
      description: "Share your growth journey with like-minded individuals for mutual support",
      reasoning: "Creative expression builds confidence to share your authentic self with others",
      cascadeConnection: "expansion",
      potentialOutcomes: ["Meaningful relationships", "Mutual growth", "Support network"],
      difficulty: 6,
      timeframe: "long-term",
      category: "connection"
    }
  ];
}

function getDemoReasoningData(): ReasoningData {
  return {
    explanation: "Based on analysis of your interaction patterns, emotional expressions, and engagement metrics, these recommendations build upon each other to create sustainable growth.",
    methodology: "Multi-factor cascading analysis with confidence weighting",
    confidence: 0.87,
    primaryFactors: [
      "High engagement with reflective conversations",
      "Positive response to structured approaches",
      "Growth-oriented emotional expressions"
    ],
    alternativesConsidered: [
      "Direct action-based approach",
      "Social-first strategy",
      "Skill-building focus"
    ]
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  header: {
    height: 60,
    marginBottom: 16,
  },
  headerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  refreshButton: {
    padding: 8,
  },
  focusAreaContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  focusAreaText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  recommendationsContainer: {
    flex: 1,
  },
  recommendationsContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  recommendationCard: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    position: 'relative',
  },
  levelIndicator: {
    position: 'absolute',
    top: -8,
    left: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    gap: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  expandButton: {
    padding: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    letterSpacing: -0.1,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metadataBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metadataText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  reasoningSection: {
    marginBottom: 16,
  },
  outcomesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  reasoningText: {
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  outcomeItem: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    elevation: 4,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.1,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  cascadeConnection: {
    position: 'absolute',
    bottom: -16,
    left: '50%',
    transform: [{ translateX: -1 }],
    alignItems: 'center',
  },
  connectionLine: {
    width: 2,
    height: 16,
  },
  connectionArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  progressContainer: {
    marginTop: 24,
    width: '80%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});