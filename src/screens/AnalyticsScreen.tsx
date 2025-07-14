import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Feather, 
  MaterialCommunityIcons, 
  FontAwesome5,
  Ionicons 
} from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useEmotionalAnalytics } from '../hooks/useEmotionalAnalytics';

const { width: screenWidth } = Dimensions.get('window');

interface AnalyticsScreenProps {
  onNavigateBack: () => void;
}

interface Mood {
  emoji: string;
  label: string;
  color: string;
  intensity: string;
}

const moods: Mood[] = [
  { emoji: "😊", label: "Happy", color: "#fef08aa5", intensity: "high" },
  { emoji: "😔", label: "Sad", color: "#93c4fda4", intensity: "low" },
  { emoji: "😡", label: "Angry", color: "#fca5a596", intensity: "high" },
  { emoji: "😰", label: "Anxious", color: "#c084fc79", intensity: "medium" },
  { emoji: "😌", label: "Calm", color: "#86efad81", intensity: "low" },
  { emoji: "😴", label: "Tired", color: "#d1d5db88", intensity: "low" },
  { emoji: "🤔", label: "Thoughtful", color: "#a5b4fc81", intensity: "medium" },
  { emoji: "😍", label: "Excited", color: "#fbcfe884", intensity: "high" },
  { emoji: "😣", label: "Stressed", color: "#fed7aa7c", intensity: "high" },
];

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Use emotional analytics hook
  const {
    weeklyReport,
    userLoggedEmotions,
    isLoadingReport,
    isSubmitting,
    error,
    submitEmotionalEntry,
    fetchWeeklyReport,
    clearErrors,
  } = useEmotionalAnalytics();

  // Local state
  const [showInput, setShowInput] = useState(false);
  const [currentMood, setCurrentMood] = useState('');
  const [moodIntensity, setMoodIntensity] = useState(5);
  const [notes, setNotes] = useState('');
  const [lastSubmittedEmotion, setLastSubmittedEmotion] = useState<any>(null);

  useEffect(() => {
    // Load last emotion from storage
    loadLastEmotion();
    
    // Animate content
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

    // Clear errors on mount
    clearErrors();
  }, []);

  const loadLastEmotion = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : 'guest';
      const storageKey = `lastEmotionLogged_${userId}`;
      
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setLastSubmittedEmotion(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load last emotion:', err);
    }
  };

  const handleSubmitEmotionalEntry = async () => {
    if (!currentMood) return;

    const emotionData = {
      mood: currentMood,
      intensity: moodIntensity,
      notes: notes,
      date: new Date().toISOString(),
    };

    try {
      await submitEmotionalEntry(emotionData);

      const emotionLog = {
        mood: currentMood,
        intensity: moodIntensity,
        notes: notes,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setLastSubmittedEmotion(emotionLog);
      
      // Success haptic feedback
      NuminaAnimations.haptic.success();
      
      // Reset form
      setCurrentMood('');
      setMoodIntensity(5);
      setNotes('');
      setShowInput(false);
      
      // Refresh report
      await fetchWeeklyReport();
    } catch (err) {
      console.error('Failed to submit emotional entry:', err);
      NuminaAnimations.haptic.error();
    }
  };

  const getColorForMood = (moodName: string) => {
    const mood = moods.find(m => m.label.toLowerCase() === moodName.toLowerCase());
    return mood?.color || '#6B7280';
  };

  const renderMetricCard = (label: string, value: string, change: string, icon: any, color: string, index: number) => (
    <Animated.View
      key={label}
      style={[
        styles.metricCard,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          opacity: fadeAnim,
          transform: [{ translateY: Animated.multiply(slideAnim, index * 0.2) }],
        },
      ]}
    >
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: isDarkMode ? '#888' : '#666' }]}>
        {label}
      </Text>
      <Text style={[styles.metricChange, { color }]}>
        {change}
      </Text>
    </Animated.View>
  );

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Analytics"
      subtitle="Track your emotional journey"
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Success Message */}
              {lastSubmittedEmotion && (
                <Animated.View
                  style={[
                    styles.successCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(102,183,255,0.1)' : 'rgba(102,183,255,0.05)',
                      borderColor: isDarkMode ? 'rgba(102,183,255,0.3)' : 'rgba(102,183,255,0.2)',
                      opacity: fadeAnim,
                    },
                  ]}
                >
                  <View style={styles.successHeader}>
                    <Feather name="check-circle" size={20} color={isDarkMode ? NuminaColors.chatBlue[300] : NuminaColors.chatBlue[400]} />
                    <Text style={[styles.successTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                      Emotion Logged Successfully!
                    </Text>
                    <TouchableOpacity
                      onPress={async () => {
                        NuminaAnimations.haptic.light();
                        setLastSubmittedEmotion(null);
                        const userData = await AsyncStorage.getItem('userData');
                        const userId = userData ? JSON.parse(userData).id : 'guest';
                        AsyncStorage.removeItem(`lastEmotionLogged_${userId}`);
                      }}
                    >
                      <Feather name="x" size={20} color={isDarkMode ? '#888' : '#666'} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.emotionSummary}>
                    <Text style={styles.emotionEmoji}>
                      {moods.find(m => m.label === lastSubmittedEmotion.mood)?.emoji || '😊'}
                    </Text>
                    <View style={styles.emotionDetails}>
                      <Text style={[styles.emotionMood, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                        {lastSubmittedEmotion.mood}
                      </Text>
                      <Text style={[styles.emotionMeta, { color: isDarkMode ? '#888' : '#666' }]}>
                        Intensity: {lastSubmittedEmotion.intensity}/10 • {lastSubmittedEmotion.time}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Track Button */}
              <TouchableOpacity
                style={[
                  styles.trackButton,
                  { backgroundColor: isDarkMode ? NuminaColors.chatBlue[200] : NuminaColors.chatBlue[200] }
                ]}
                onPress={() => {
                  NuminaAnimations.haptic.light();
                  setShowInput(!showInput);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={24} color={isDarkMode ? '#fff' : '#1a1a1a'} />
                <Text style={[styles.trackButtonText, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Track New Emotion</Text>
              </TouchableOpacity>

              {/* Key Metrics */}
              <View style={styles.metricsGrid}>
                {renderMetricCard(
                  "Total Emotions",
                  weeklyReport?.report?.weeklyStats?.totalEmotions?.toString() || "0",
                  userLoggedEmotions.length > 0 ? "Active tracking" : "Start logging",
                  <Feather name="heart" size={20} color="#EC4899" />,
                  "#EC4899",
                  1
                )}
                {renderMetricCard(
                  "Most Frequent",
                  weeklyReport?.report?.weeklyStats?.mostFrequentEmotion || "--",
                  weeklyReport?.moodDistribution?.[0]?.count 
                    ? `${weeklyReport.moodDistribution[0].count} times` 
                    : "--",
                  <Feather name="trending-up" size={20} color="#10B981" />,
                  "#10B981",
                  2
                )}
                {renderMetricCard(
                  "Avg Intensity",
                  weeklyReport?.report?.weeklyStats?.avgIntensity 
                    ? weeklyReport.report.weeklyStats.avgIntensity.toFixed(1) 
                    : "--",
                  weeklyReport?.report?.weeklyStats?.avgIntensity && weeklyReport.report.weeklyStats.avgIntensity > 5
                    ? "High engagement" 
                    : "Moderate",
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F59E0B" />,
                  "#F59E0B",
                  3
                )}
                {renderMetricCard(
                  "Unique Moods",
                  userLoggedEmotions.length > 0
                    ? [...new Set(userLoggedEmotions.map(e => e.mood))].length.toString()
                    : "0",
                  "Emotional diversity",
                  <MaterialCommunityIcons name="palette" size={20} color="#8B5CF6" />,
                  "#8B5CF6",
                  4
                )}
              </View>

              {/* Weekly Emotional Timeline */}
              <Animated.View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                  Weekly Emotional Timeline
                </Text>
                
                {userLoggedEmotions.length > 0 ? (
                  <View style={styles.timelineContainer}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => {
                      const dayEmotions = userLoggedEmotions.filter(emotion => {
                        const emotionDate = new Date(emotion.timestamp);
                        const targetDate = new Date();
                        targetDate.setDate(targetDate.getDate() - (6 - dayIndex));
                        return emotionDate.toDateString() === targetDate.toDateString();
                      });

                      return (
                        <View key={day} style={styles.dayContainer}>
                          <Text style={[styles.dayLabel, { color: isDarkMode ? '#888' : '#666' }]}>
                            {day}
                          </Text>
                          <View style={styles.emotionsContainer}>
                            {dayEmotions.length > 0 ? (
                              <View style={styles.emotionsGrid}>
                                {dayEmotions.slice(0, 4).map((emotion, idx) => {
                                  const moodData = moods.find(m => m.label === emotion.mood);
                                  return (
                                    <View
                                      key={idx}
                                      style={[
                                        styles.emotionBubble,
                                        { backgroundColor: moodData?.color || '#6B7280' }
                                      ]}
                                    >
                                      <Text style={styles.emotionBubbleEmoji}>
                                        {moodData?.emoji || '😊'}
                                      </Text>
                                    </View>
                                  );
                                })}
                                {dayEmotions.length > 4 && (
                                  <View style={styles.moreEmotionsIndicator}>
                                    <Text style={styles.moreEmotionsText}>
                                      +{dayEmotions.length - 4}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            ) : (
                              <View style={styles.emptyDayIndicator}>
                                <Text style={[styles.emptyDayText, { color: isDarkMode ? '#666' : '#ccc' }]}>
                                  —
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons 
                      name="chart-timeline" 
                      size={48} 
                      color={isDarkMode ? '#666' : '#ccc'} 
                    />
                    <Text style={[styles.emptyStateText, { color: isDarkMode ? '#888' : '#666' }]}>
                      No emotions tracked yet
                    </Text>
                    <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#666' : '#999' }]}>
                      Start tracking to see your timeline
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* Mood Distribution */}
              {weeklyReport?.moodDistribution && weeklyReport.moodDistribution.length > 0 && (
                <Animated.View
                  style={[
                    styles.distributionCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      opacity: fadeAnim,
                    },
                  ]}
                >
                  <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                    Mood Distribution
                  </Text>
                  {weeklyReport.moodDistribution.map((mood, index) => (
                    <View key={mood.mood} style={styles.moodBar}>
                      <View style={styles.moodBarHeader}>
                        <Text style={[styles.moodBarLabel, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                          {mood.mood}
                        </Text>
                        <Text style={[styles.moodBarPercentage, { color: isDarkMode ? '#888' : '#666' }]}>
                          {mood.percentage}%
                        </Text>
                      </View>
                      <View style={[styles.moodBarTrack, { backgroundColor: isDarkMode ? '#333' : '#e5e5e5' }]}>
                        <Animated.View
                          style={[
                            styles.moodBarFill,
                            {
                              width: `${mood.percentage}%`,
                              backgroundColor: getColorForMood(mood.mood),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </Animated.View>
              )}

              {/* Insights */}
              {weeklyReport?.insights && weeklyReport.insights.length > 0 && (
                <Animated.View
                  style={[
                    styles.insightsCard,
                    {
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      opacity: fadeAnim,
                    },
                  ]}
                >
                  <Text style={[styles.chartTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                    Key Insights
                  </Text>
                  {weeklyReport.insights.map((insight, index) => (
                    <View
                      key={index}
                      style={[
                        styles.insightItem,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          borderColor: insight.trend === 'positive' 
                            ? 'rgba(34,197,94,0.3)' 
                            : 'rgba(239,68,68,0.3)',
                        },
                      ]}
                    >
                      <View style={styles.insightHeader}>
                        {insight.trend === 'positive' ? (
                          <Feather name="trending-up" size={16} color="#22C55E" />
                        ) : (
                          <Feather name="info" size={16} color="#F59E0B" />
                        )}
                        <Text style={[styles.insightTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                          {insight.title}
                        </Text>
                      </View>
                      <Text style={[styles.insightDescription, { color: isDarkMode ? '#aaa' : '#666' }]}>
                        {insight.description}
                      </Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </ScrollView>

            {/* Emotional Input Modal */}
            <Modal
              visible={showInput}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowInput(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={[
                  styles.modalContent,
                  { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }
                ]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                      How are you feeling?
                    </Text>
                    <TouchableOpacity onPress={() => {
                      NuminaAnimations.haptic.light();
                      setShowInput(false);
                    }}>
                      <Feather name="x" size={24} color={isDarkMode ? '#888' : '#666'} />
                    </TouchableOpacity>
                  </View>

                  {/* Mood Selection */}
                  <View style={styles.moodGrid}>
                    {moods.map((mood) => (
                                              <TouchableOpacity
                          key={mood.label}
                          style={[
                            styles.moodButton,
                            {
                              backgroundColor: currentMood === mood.label ? mood.color : 'transparent',
                              borderColor: currentMood === mood.label ? mood.color : isDarkMode ? '#333' : '#e5e5e5',
                            },
                          ]}
                          onPress={() => {
                            NuminaAnimations.haptic.selection();
                            setCurrentMood(mood.label);
                          }}
                        >
                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                        <Text style={[
                          styles.moodLabel,
                          { 
                            color: currentMood === mood.label 
                              ? '#1a1a1a' 
                              : isDarkMode ? '#fff' : '#1a1a1a' 
                          }
                        ]}>
                          {mood.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Intensity Slider */}
                  <View style={styles.sliderContainer}>
                    <Text style={[styles.sliderLabel, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>
                      Intensity: {moodIntensity}/10
                    </Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={10}
                      value={moodIntensity}
                      onValueChange={setMoodIntensity}
                      step={1}
                      minimumTrackTintColor={isDarkMode ? NuminaColors.chatBlue[400] : NuminaColors.chatBlue[300]}
                      maximumTrackTintColor={isDarkMode ? '#333' : '#e5e5e5'}
                      thumbTintColor={isDarkMode ? NuminaColors.chatBlue[300] : NuminaColors.chatBlue[400]}
                    />
                  </View>

                  {/* Notes Input */}
                  <TextInput
                    style={[
                      styles.notesInput,
                      {
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        borderColor: isDarkMode ? '#333' : '#e5e5e5',
                        color: isDarkMode ? '#fff' : '#1a1a1a',
                      },
                    ]}
                    placeholder="Add notes (optional)..."
                    placeholderTextColor={isDarkMode ? '#666' : '#999'}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: currentMood 
                          ? (isDarkMode ? NuminaColors.chatBlue[400] : NuminaColors.chatBlue[200]) 
                          : '#ccc',
                      },
                    ]}
                    onPress={() => {
                      if (currentMood && !isSubmitting) {
                        NuminaAnimations.haptic.medium();
                        handleSubmitEmotionalEntry();
                      }
                    }}
                    disabled={!currentMood || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={isDarkMode ? '#fff' : '#1a1a1a'} />
                    ) : (
                      <>
                        <Feather name="save" size={20} color={isDarkMode ? '#fff' : '#1a1a1a'} />
                        <Text style={[styles.submitButtonText, { color: isDarkMode ? '#fff' : '#1a1a1a' }]}>Save Emotional Entry</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </PageBackground>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  successCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  emotionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emotionEmoji: {
    fontSize: 24,
  },
  emotionDetails: {
    flex: 1,
  },
  emotionMood: {
    fontSize: 14,
    fontWeight: '600',
  },
  emotionMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: (screenWidth - 36) / 2,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 11,
    fontWeight: '500',
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 40,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emotionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    maxWidth: 60,
  },
  emotionBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emotionBubbleEmoji: {
    fontSize: 12,
  },
  moreEmotionsIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreEmotionsText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#666',
  },
  emptyDayIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayText: {
    fontSize: 16,
    fontWeight: '300',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  distributionCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  moodBar: {
    marginBottom: 16,
  },
  moodBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  moodBarLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  moodBarPercentage: {
    fontSize: 14,
  },
  moodBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  moodBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  insightItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  moodScroll: {
    marginBottom: 24,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  moodButton: {
    width: '48%',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});