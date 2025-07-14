import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { NuminaAnimations } from '../utils/animations';
import { TextStyles } from '../utils/fonts';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'food_dining' | 'tech_learning' | 'outdoor_activity' | 'creative_arts' | 'fitness_wellness' | 'professional_networking' | 'hobby_interest' | 'cultural_exploration';
  date: string;
  time: string;
  participants: number;
  maxParticipants: number;
  host: string;
  isJoined: boolean;
  photos?: string[];
  fullDescription?: string;
  location?: string;
  duration?: string;
  // AI Enhancement Features
  aiMatchScore?: number;
  emotionalCompatibility?: 'high' | 'medium' | 'low';
  personalizedReason?: string;
  suggestedConnections?: string[];
  moodBoostPotential?: number;
  communityVibe?: 'energetic' | 'calm' | 'creative' | 'supportive' | 'adventurous';
  aiInsights?: string;
  growthOpportunity?: string;
}

interface CloudScreenProps {
  onNavigateBack: () => void;
}

interface SearchFilters {
  timeOfDay: string[];
  eventType: string[];
  participantRange: string;
  dateRange: string;
  difficulty: string[];
  location: string;
}

// AI-Enhanced Sample Events with Personalization
const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Taco Tuesday at El Mariachi',
    description: 'Join fellow foodies for authentic Mexican cuisine and great conversation',
    type: 'food_dining',
    date: 'Today',
    time: '7:00 PM',
    participants: 8,
    maxParticipants: 15,
    host: 'Maria Garcia',
    isJoined: true,
    photos: ['https://picsum.photos/400/300?random=1', 'https://picsum.photos/400/300?random=2'],
    fullDescription: 'Looking for people who love authentic Mexican food! We\'ll be trying the best tacos in town at El Mariachi. Great opportunity to meet fellow food enthusiasts, share restaurant recommendations, and enjoy delicious cuisine together. All skill levels welcome - just bring your appetite!',
    location: 'El Mariachi Restaurant, Downtown',
    duration: '2 hours',
    // AI Enhancement Data
    aiMatchScore: 0.92,
    emotionalCompatibility: 'high',
    personalizedReason: 'Your stress levels drop 34% after social dining experiences',
    suggestedConnections: ['Alex (fellow foodie)', 'Sam (meditation buddy)'],
    moodBoostPotential: 8.5,
    communityVibe: 'supportive',
    aiInsights: 'Perfect for your Tuesday evening energy pattern',
    growthOpportunity: 'Build social confidence through shared interests'
  },
  {
    id: '2',
    title: 'Linux Command Line Workshop',
    description: 'Learn terminal basics with experienced developers',
    type: 'tech_learning',
    date: 'Tomorrow',
    time: '6:00 PM',
    participants: 12,
    maxParticipants: 20,
    host: 'David Chen',
    isJoined: false,
    photos: ['https://picsum.photos/400/300?random=3', 'https://picsum.photos/400/300?random=4'],
    fullDescription: 'Perfect for beginners and intermediate users! Learn essential Linux commands, file navigation, and basic scripting. Bring your laptop and questions. We\'ll cover practical examples and real-world scenarios. Great networking opportunity for tech professionals.',
    location: 'Tech Hub, Innovation Center',
    duration: '3 hours',
    // AI Enhancement Data
    aiMatchScore: 0.78,
    emotionalCompatibility: 'medium',
    personalizedReason: 'Learning new skills typically increases your confidence by 23%',
    suggestedConnections: ['Riley (coding enthusiast)', 'Jordan (career mentor)'],
    moodBoostPotential: 7.2,
    communityVibe: 'energetic',
    aiInsights: 'Challenges spark your growth mindset - perfect timing!',
    growthOpportunity: 'Expand technical confidence and professional network'
  },
  {
    id: '3',
    title: 'Sunset Hiking at Eagle Peak',
    description: 'Moderate hike with stunning sunset views',
    type: 'outdoor_activity',
    date: 'Dec 16',
    time: '4:00 PM',
    participants: 6,
    maxParticipants: 12,
    host: 'Alex Thompson',
    isJoined: false,
    photos: ['https://picsum.photos/400/300?random=5', 'https://picsum.photos/400/300?random=6'],
    fullDescription: 'Join us for a beautiful sunset hike! Moderate difficulty, 3-mile round trip with 800ft elevation gain. Perfect for nature lovers and photography enthusiasts. We\'ll take breaks to enjoy the views and get to know each other. Bring water, snacks, and good hiking shoes.',
    location: 'Eagle Peak Trailhead',
    duration: '3 hours',
    // AI Enhancement Data
    aiMatchScore: 0.95,
    emotionalCompatibility: 'high',
    personalizedReason: 'Nature activities create 89% improvement in your mood balance',
    suggestedConnections: ['Maya (mindfulness guide)', 'Chris (adventure buddy)'],
    moodBoostPotential: 9.1,
    communityVibe: 'adventurous',
    aiInsights: 'Golden hour perfectly matches your energy peaks!',
    growthOpportunity: 'Connect with nature while building meaningful friendships'
  },
  {
    id: '4',
    title: 'Watercolor Painting Meetup',
    description: 'Create beautiful landscapes with fellow artists',
    type: 'creative_arts',
    date: 'Dec 18',
    time: '2:00 PM',
    participants: 8,
    maxParticipants: 15,
    host: 'Sophie Williams',
    isJoined: true,
    photos: ['https://picsum.photos/400/300?random=7'],
    fullDescription: 'All skill levels welcome! We\'ll be painting landscapes inspired by local scenery. Materials provided for beginners. Great way to meet fellow artists, share techniques, and create something beautiful together. Coffee and snacks included.',
    location: 'Art Studio, Creative District',
    duration: '2.5 hours',
    // AI Enhancement Data
    aiMatchScore: 0.88,
    emotionalCompatibility: 'high',
    personalizedReason: 'Creative expression reduces your anxiety by 42%',
    suggestedConnections: ['Emma (fellow creator)', 'Kai (mindful artist)'],
    moodBoostPotential: 8.7,
    communityVibe: 'creative',
    aiInsights: 'Perfect afternoon flow activity for your creative soul',
    growthOpportunity: 'Express emotions through art while connecting with kindred spirits'
  },
  {
    id: '5',
    title: 'Morning CrossFit & Coffee',
    description: 'High-intensity workout followed by coffee and networking',
    type: 'fitness_wellness',
    date: 'Dec 17',
    time: '7:00 AM',
    participants: 10,
    maxParticipants: 20,
    host: 'Mike Rodriguez',
    isJoined: false,
    photos: ['https://picsum.photos/400/300?random=8'],
    fullDescription: 'Start your day with energy! 45-minute CrossFit session suitable for all fitness levels, followed by coffee and conversation. Great for meeting health-conscious professionals and fitness enthusiasts. Workout modifications available.',
    location: 'CrossFit Downtown',
    duration: '1.5 hours',
  },
  {
    id: '6',
    title: 'Startup Networking Mixer',
    description: 'Connect with entrepreneurs and investors',
    type: 'professional_networking',
    date: 'Dec 19',
    time: '6:30 PM',
    participants: 25,
    maxParticipants: 40,
    host: 'Sarah Johnson',
    isJoined: false,
  },
  {
    id: '7',
    title: 'Board Game Night',
    description: 'Strategic games and friendly competition',
    type: 'hobby_interest',
    date: 'Dec 20',
    time: '7:00 PM',
    participants: 8,
    maxParticipants: 12,
    host: 'Chris Lee',
    isJoined: true,
  },
  {
    id: '8',
    title: 'International Food Festival',
    description: 'Explore global cuisines and cultures',
    type: 'cultural_exploration',
    date: 'Dec 21',
    time: '5:00 PM',
    participants: 18,
    maxParticipants: 30,
    host: 'Cultural Exchange Team',
    isJoined: false,
  },
];

export const CloudScreen: React.FC<CloudScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState<string>('ai-matched');
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [exploreMode, setExploreMode] = useState<'matched' | 'discover' | 'grow'>('matched');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    timeOfDay: [],
    eventType: [],
    participantRange: 'any',
    dateRange: 'any',
    difficulty: [],
    location: 'any',
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [createEventForm, setCreateEventForm] = useState({
    title: '',
    description: '',
    type: 'food_dining' as Event['type'],
    date: '',
    time: '',
    location: '',
    duration: '',
    maxParticipants: 10,
  });
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  const getEventTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'food_dining':
        return 'utensils';
      case 'tech_learning':
        return 'laptop-code';
      case 'outdoor_activity':
        return 'mountain';
      case 'creative_arts':
        return 'palette';
      case 'fitness_wellness':
        return 'dumbbell';
      case 'professional_networking':
        return 'briefcase';
      case 'hobby_interest':
        return 'gamepad';
      case 'cultural_exploration':
        return 'globe';
      default:
        return 'calendar';
    }
  };

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'food_dining':
        return isDarkMode ? '#FFE4E1' : '#ef4444';
      case 'tech_learning':
        return isDarkMode ? '#E6F3FF' : '#3b82f6';
      case 'outdoor_activity':
        return isDarkMode ? '#B8E6B8' : '#10b981';
      case 'creative_arts':
        return isDarkMode ? '#FFF9C4' : '#f59e0b';
      case 'fitness_wellness':
        return isDarkMode ? '#FFB6C1' : '#ec4899';
      case 'professional_networking':
        return isDarkMode ? '#E6E6FA' : '#8b5cf6';
      case 'hobby_interest':
        return isDarkMode ? '#FFD700' : '#fbbf24';
      case 'cultural_exploration':
        return isDarkMode ? '#98FB98' : '#22c55e';
      default:
        return isDarkMode ? '#90CAF9' : '#6366f1';
    }
  };

  const getVibeColor = (vibe: string) => {
    switch (vibe) {
      case 'energetic': return '#FF6B9D';
      case 'calm': return '#6BCF7F';
      case 'creative': return '#AF52DE';
      case 'supportive': return '#4DABF7';
      case 'adventurous': return '#FFD93D';
      default: return '#8E8E93';
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCreateEventForm(prev => ({ 
      ...prev, 
      date: formatDate(date) 
    }));
    setShowDatePicker(false);
  };

  const handleTimeSelect = (date: Date) => {
    setSelectedTime(date);
    setCreateEventForm(prev => ({ 
      ...prev, 
      time: formatTime(date) 
    }));
    setShowTimePicker(false);
  };

  const handleJoinEvent = (eventId: string) => {
    NuminaAnimations.haptic.medium();
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, isJoined: !event.isJoined, participants: event.isJoined ? event.participants - 1 : event.participants + 1 }
          : event
      )
    );
  };

  // AI-Enhanced filtering logic
  const filteredEvents = events.filter(event => {
    // AI-powered smart filters
    if (activeFilter === 'ai-matched') {
      return event.aiMatchScore && event.aiMatchScore > 0.8;
    }
    if (activeFilter === 'mood-boost') {
      return event.moodBoostPotential && event.moodBoostPotential > 8.0;
    }
    if (activeFilter === 'growth') {
      return event.growthOpportunity && event.growthOpportunity.length > 0;
    }
    if (activeFilter === 'connections') {
      return event.suggestedConnections && event.suggestedConnections.length > 0;
    }
    
    // Basic type filter
    if (activeFilter !== 'all' && event.type !== activeFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(query);
      const matchesDescription = event.description.toLowerCase().includes(query);
      const matchesHost = event.host.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription && !matchesHost) {
        return false;
      }
    }

    // Advanced filters
    if (searchFilters.eventType.length > 0 && !searchFilters.eventType.includes(event.type)) {
      return false;
    }

    // Time of day filter
    if (searchFilters.timeOfDay.length > 0) {
      const hour = parseInt(event.time.split(':')[0]);
      const timeCategory = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      if (!searchFilters.timeOfDay.includes(timeCategory)) {
        return false;
      }
    }

    // Participant range filter
    if (searchFilters.participantRange !== 'any') {
      const participantCount = event.participants;
      switch (searchFilters.participantRange) {
        case 'small':
          if (participantCount > 10) return false;
          break;
        case 'medium':
          if (participantCount <= 10 || participantCount > 20) return false;
          break;
        case 'large':
          if (participantCount <= 20) return false;
          break;
      }
    }

    return true;
  });

  const handleEventPress = (event: Event) => {
    NuminaAnimations.haptic.light();
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEventAction = (action: 'like' | 'share' | 'save' | 'more') => {
    if (!selectedEvent) return;
    
    NuminaAnimations.haptic.selection();
    
    switch (action) {
      case 'like':
        // Handle like functionality
        console.log('Like event:', selectedEvent.title);
        setShowEventModal(false);
        break;
      case 'share':
        // Handle share functionality
        console.log('Share event:', selectedEvent.title);
        setShowEventModal(false);
        break;
      case 'save':
        // Handle save functionality
        console.log('Save event:', selectedEvent.title);
        setShowEventModal(false);
        break;
      case 'more':
        // Open detailed modal
        setShowEventModal(false);
        setShowDetailedModal(true);
        break;
    }
  };

  const renderEventFeedItem = ({ item: event }: { item: Event }) => (
    <Animated.View style={[
      styles.feedItem,
      {
        opacity: fadeAnim,
      }
    ]}>
      <TouchableOpacity
        onPress={() => handleEventPress(event)}
        activeOpacity={0.7}
        style={styles.feedItemTouchable}
      >
        {/* Host Header */}
        <View style={styles.feedHeader}>
          <View style={styles.hostInfo}>
            <View style={[
              styles.hostAvatar,
              { backgroundColor: getEventTypeColor(event.type) }
            ]}>
              <Text style={styles.hostInitial}>
                {event.host.charAt(0)}
              </Text>
            </View>
            <View style={styles.hostDetails}>
              <Text style={[
                styles.hostName,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                {event.host}
              </Text>
              <Text style={[
                styles.postTime,
                { color: isDarkMode ? '#888' : '#666' }
              ]}>
                {event.date} • {event.time}
              </Text>
            </View>
          </View>
        </View>

        {/* Event Content */}
        <View style={styles.feedContent}>
          <Text style={[
            styles.feedEventTitle,
            { color: isDarkMode ? '#fff' : '#000' }
          ]}>
            {event.title}
          </Text>
          <Text style={[
            styles.feedDescription,
            { color: isDarkMode ? '#ccc' : '#555' }
          ]}>
            {event.description}
          </Text>
          
          {/* AI Insights Section */}
          {event.aiMatchScore && event.aiMatchScore > 0.8 && (
            <View style={styles.aiInsightsContainer}>
              <View style={styles.aiMatchHeader}>
                <MaterialCommunityIcons
                  name="brain"
                  size={14}
                  color="#FF6B9D"
                />
                <Text style={[
                  styles.aiMatchScore,
                  { color: '#FF6B9D' }
                ]}>
                  {Math.round(event.aiMatchScore * 100)}% Match
                </Text>
                {event.emotionalCompatibility === 'high' && (
                  <View style={styles.compatibilityBadge}>
                    <Text style={styles.compatibilityText}>High Compatibility</Text>
                  </View>
                )}
              </View>
              
              {event.personalizedReason && (
                <Text style={[
                  styles.personalizedReason,
                  { color: isDarkMode ? '#e1bee7' : '#7b1fa2' }
                ]}>
                  ✨ {event.personalizedReason}
                </Text>
              )}
              
              {event.moodBoostPotential && event.moodBoostPotential > 8 && (
                <View style={styles.moodBoostIndicator}>
                  <MaterialCommunityIcons
                    name="emoticon-happy"
                    size={12}
                    color="#FFD93D"
                  />
                  <Text style={[styles.moodBoostText, { color: '#FFD93D' }]}>
                    +{event.moodBoostPotential}/10 Mood Boost
                  </Text>
                </View>
              )}
              
              {event.suggestedConnections && event.suggestedConnections.length > 0 && (
                <View style={styles.connectionsPreview}>
                  <MaterialCommunityIcons
                    name="account-heart"
                    size={12}
                    color="#4DABF7"
                  />
                  <Text style={[styles.connectionsText, { color: '#4DABF7' }]}>
                    Connect with {event.suggestedConnections[0]}
                    {event.suggestedConnections.length > 1 && ` +${event.suggestedConnections.length - 1} more`}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Event Tags */}
          <View style={styles.eventTags}>
            <View style={[
              styles.eventTag,
              { backgroundColor: getEventTypeColor(event.type) + '20' }
            ]}>
              <FontAwesome5
                name={getEventTypeIcon(event.type)}
                size={12}
                color={getEventTypeColor(event.type)}
              />
              <Text style={[
                styles.eventTagText,
                { color: getEventTypeColor(event.type) }
              ]}>
                {event.type.replace('_', ' ')}
              </Text>
            </View>
            
            {/* Community Vibe Indicator */}
            {event.communityVibe && (
              <View style={[
                styles.vibeTag,
                { backgroundColor: getVibeColor(event.communityVibe) + '20' }
              ]}>
                <Text style={[
                  styles.vibeText,
                  { color: getVibeColor(event.communityVibe) }
                ]}>
                  {event.communityVibe}
                </Text>
              </View>
            )}
            
            <Text style={[
              styles.participantCount,
              { color: isDarkMode ? '#888' : '#666' }
            ]}>
              {event.participants} going
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Bar */}
      <View style={styles.feedActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => NuminaAnimations.haptic.selection()}
        >
          <FontAwesome5
            name="heart"
            size={18}
            color={isDarkMode ? '#888' : '#666'}
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => NuminaAnimations.haptic.selection()}
        >
          <FontAwesome5
            name="comment"
            size={18}
            color={isDarkMode ? '#888' : '#666'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome5
            name="share"
            size={18}
            color={isDarkMode ? '#888' : '#666'}
          />
        </TouchableOpacity>
        <View style={styles.actionSpacer} />
        <TouchableOpacity
          style={[
            styles.joinFeedButton,
            {
              backgroundColor: event.isJoined
                ? (isDarkMode ? '#90CAF9' : '#E3F2FD')
                : 'transparent',
              borderColor: isDarkMode ? '#90CAF9' : '#3b82f6',
            }
          ]}
          onPress={() => handleJoinEvent(event.id)}
        >
          <Text style={[
            styles.joinFeedButtonText,
            {
              color: event.isJoined
                ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
                : (isDarkMode ? '#90CAF9' : '#3b82f6')
            }
          ]}>
            {event.isJoined ? 'Going' : 'Join'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const filterOptions = [
    { key: 'ai-matched', label: '✨ AI Matched', icon: 'brain', color: '#FF6B9D' },
    { key: 'mood-boost', label: '⚡ Mood Boost', icon: 'zap', color: '#FFD93D' },
    { key: 'growth', label: '🌱 Growth', icon: 'trending-up', color: '#6BCF7F' },
    { key: 'connections', label: '🤝 Connections', icon: 'users', color: '#4DABF7' },
    { key: 'all', label: 'All', icon: 'th-large', color: '#8E8E93' },
    { key: 'food_dining', label: 'Food & Dining', icon: 'utensils', color: '#FF9500' },
    { key: 'tech_learning', label: 'Tech & Learning', icon: 'laptop-code', color: '#007AFF' },
    { key: 'outdoor_activity', label: 'Outdoor & Adventure', icon: 'mountain', color: '#34C759' },
    { key: 'creative_arts', label: 'Creative Arts', icon: 'palette', color: '#AF52DE' },
    { key: 'fitness_wellness', label: 'Fitness & Wellness', icon: 'dumbbell', color: '#FF3B30' },
    { key: 'professional_networking', label: 'Professional', icon: 'briefcase', color: '#5856D6' },
    { key: 'hobby_interest', label: 'Hobbies & Games', icon: 'gamepad', color: '#FF9500' },
    { key: 'cultural_exploration', label: 'Cultural', icon: 'globe', color: '#30B0C7' },
  ];

  // Filter and search events
  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.host.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // Active filter
    if (activeFilter === 'ai-matched') {
      return event.aiMatchScore && event.aiMatchScore > 0.8;
    } else if (activeFilter === 'mood-boost') {
      return event.moodBoostPotential && event.moodBoostPotential > 8.0;
    } else if (activeFilter === 'growth') {
      return event.growthOpportunity && event.growthOpportunity.length > 0;
    } else if (activeFilter === 'connections') {
      return event.suggestedConnections && event.suggestedConnections.length > 0;
    } else if (activeFilter !== 'all') {
      return event.type === activeFilter;
    }

    return true;
  });

  // Render event item
  const renderEventFeedItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={[
        styles.eventItem,
        {
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      ]}
      onPress={() => {
        setSelectedEvent(item);
        setShowEventModal(true);
      }}
      activeOpacity={0.8}
    >
      {/* AI Match Score Badge */}
      {item.aiMatchScore && item.aiMatchScore > 0.8 && (
        <View style={[
          styles.aiMatchBadge,
          {
            backgroundColor: isDarkMode ? '#86efac' : '#10b981',
          }
        ]}>
          <FontAwesome5 name="brain" size={12} color="#ffffff" />
          <Text style={styles.aiMatchBadgeText}>
            {Math.round(item.aiMatchScore * 100)}% Match
          </Text>
        </View>
      )}

      {/* Event Header */}
      <View style={styles.eventHeader}>
        <View style={[
          styles.eventTypeIcon,
          { backgroundColor: getEventTypeColor(item.type) + '20' }
        ]}>
          <FontAwesome5 
            name={getEventTypeIcon(item.type)} 
            size={16} 
            color={getEventTypeColor(item.type)} 
          />
        </View>
        <View style={styles.eventHeaderText}>
          <Text style={[
            styles.eventTitle,
            { color: isDarkMode ? '#fff' : '#000' }
          ]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[
            styles.eventMeta,
            { color: isDarkMode ? '#888' : '#666' }
          ]}>
            {item.date} • {item.time} • by {item.host}
          </Text>
        </View>
        {item.isJoined && (
          <View style={[
            styles.joinedBadge,
            { backgroundColor: isDarkMode ? '#86efac' : '#10b981' }
          ]}>
            <FontAwesome5 name="check" size={10} color="#ffffff" />
          </View>
        )}
      </View>

      {/* Event Description */}
      <Text style={[
        styles.eventDescription,
        { color: isDarkMode ? '#ccc' : '#555' }
      ]} numberOfLines={2}>
        {item.description}
      </Text>

      {/* Event Stats */}
      <View style={styles.eventStats}>
        <View style={styles.eventStat}>
          <FontAwesome5 name="users" size={12} color={isDarkMode ? '#888' : '#666'} />
          <Text style={[
            styles.eventStatText,
            { color: isDarkMode ? '#888' : '#666' }
          ]}>
            {item.participants}/{item.maxParticipants}
          </Text>
        </View>
        {item.location && (
          <View style={styles.eventStat}>
            <FontAwesome5 name="map-marker-alt" size={12} color={isDarkMode ? '#888' : '#666'} />
            <Text style={[
              styles.eventStatText,
              { color: isDarkMode ? '#888' : '#666' }
            ]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
        {item.moodBoostPotential && (
          <View style={styles.eventStat}>
            <FontAwesome5 name="smile" size={12} color={isDarkMode ? '#86efac' : '#10b981'} />
            <Text style={[
              styles.eventStatText,
              { color: isDarkMode ? '#86efac' : '#10b981' }
            ]}>
              +{item.moodBoostPotential.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* AI Insights */}
      {item.aiInsights && (
        <View style={[
          styles.aiInsights,
          {
            backgroundColor: isDarkMode ? 'rgba(134, 239, 172, 0.1)' : 'rgba(134, 239, 172, 0.15)',
            borderColor: isDarkMode ? '#86efac' : '#10b981',
          }
        ]}>
          <FontAwesome5 name="lightbulb" size={10} color={isDarkMode ? '#86efac' : '#10b981'} />
          <Text style={[
            styles.aiInsightsText,
            { color: isDarkMode ? '#86efac' : '#10b981' }
          ]} numberOfLines={1}>
            {item.aiInsights}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Helper functions
  const getEventTypeIcon = (type: Event['type']) => {
    const icons = {
      food_dining: 'utensils',
      tech_learning: 'laptop-code',
      outdoor_activity: 'mountain',
      creative_arts: 'palette',
      fitness_wellness: 'dumbbell',
      professional_networking: 'briefcase',
      hobby_interest: 'gamepad',
      cultural_exploration: 'globe',
    };
    return icons[type] || 'calendar';
  };

  const getEventTypeColor = (type: Event['type']) => {
    const colors = {
      food_dining: '#FF9500',
      tech_learning: '#007AFF',
      outdoor_activity: '#34C759',
      creative_arts: '#AF52DE',
      fitness_wellness: '#FF3B30',
      professional_networking: '#5856D6',
      hobby_interest: '#FF9500',
      cultural_exploration: '#30B0C7',
    };
    return colors[type] || '#8E8E93';
  };

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Cloud"
      subtitle="Collaborative Events & Community"
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />

          <Animated.View style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }
          ]}>

            {/* Search Bar */}
            <View style={[
              styles.searchSection,
              {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }
            ]}>
              <View style={[
                styles.searchContainer,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }
              ]}>
                <FontAwesome5 
                  name="search" 
                  size={16} 
                  color={isDarkMode ? '#888' : '#666'} 
                  style={styles.searchIcon} 
                />
                <TextInput
                  style={[
                    styles.searchInput,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}
                  placeholder="Search events by name, type, or location..."
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                  >
                    <FontAwesome5 name="times" size={14} color={isDarkMode ? '#888' : '#666'} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: showFilters 
                      ? (isDarkMode ? '#86efac' : '#10b981')
                      : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  }
                ]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <FontAwesome5 
                  name="filter" 
                  size={16} 
                  color={showFilters ? '#fff' : (isDarkMode ? '#888' : '#666')} 
                />
              </TouchableOpacity>
            </View>

            {/* AI Exploration Modes */}
            <View style={styles.exploreModesSection}>
              <Text style={[
                styles.exploreModeTitle,
                { color: isDarkMode ? '#fff' : '#000' }
              ]}>
                🎆 Explore Your World
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exploreModeContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.exploreModeCard,
                    {
                      backgroundColor: exploreMode === 'matched' 
                        ? '#FF6B9D20' 
                        : (isDarkMode ? '#1a1a1a' : '#ffffff'),
                      borderColor: exploreMode === 'matched' ? '#FF6B9D' : (isDarkMode ? '#333' : '#e5e7eb'),
                    }
                  ]}
                  onPress={() => {
                    setExploreMode('matched');
                    setActiveFilter('ai-matched');
                  }}
                >
                  <MaterialCommunityIcons
                    name="brain"
                    size={24}
                    color={exploreMode === 'matched' ? '#FF6B9D' : (isDarkMode ? '#888' : '#666')}
                  />
                  <Text style={[
                    styles.exploreModeText,
                    { color: exploreMode === 'matched' ? '#FF6B9D' : (isDarkMode ? '#888' : '#666') }
                  ]}>
                    AI Matched
                  </Text>
                  <Text style={[
                    styles.exploreModeSubtext,
                    { color: isDarkMode ? '#666' : '#999' }
                  ]}>
                    Perfect for you
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.exploreModeCard,
                    {
                      backgroundColor: exploreMode === 'discover' 
                        ? '#FFD93D20' 
                        : (isDarkMode ? '#1a1a1a' : '#ffffff'),
                      borderColor: exploreMode === 'discover' ? '#FFD93D' : (isDarkMode ? '#333' : '#e5e7eb'),
                    }
                  ]}
                  onPress={() => {
                    setExploreMode('discover');
                    setActiveFilter('mood-boost');
                  }}
                >
                  <MaterialCommunityIcons
                    name="compass"
                    size={24}
                    color={exploreMode === 'discover' ? '#FFD93D' : (isDarkMode ? '#888' : '#666')}
                  />
                  <Text style={[
                    styles.exploreModeText,
                    { color: exploreMode === 'discover' ? '#FFD93D' : (isDarkMode ? '#888' : '#666') }
                  ]}>
                    Discover
                  </Text>
                  <Text style={[
                    styles.exploreModeSubtext,
                    { color: isDarkMode ? '#666' : '#999' }
                  ]}>
                    New adventures
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.exploreModeCard,
                    {
                      backgroundColor: exploreMode === 'grow' 
                        ? '#6BCF7F20' 
                        : (isDarkMode ? '#1a1a1a' : '#ffffff'),
                      borderColor: exploreMode === 'grow' ? '#6BCF7F' : (isDarkMode ? '#333' : '#e5e7eb'),
                    }
                  ]}
                  onPress={() => {
                    setExploreMode('grow');
                    setActiveFilter('growth');
                  }}
                >
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={24}
                    color={exploreMode === 'grow' ? '#6BCF7F' : (isDarkMode ? '#888' : '#666')}
                  />
                  <Text style={[
                    styles.exploreModeText,
                    { color: exploreMode === 'grow' ? '#6BCF7F' : (isDarkMode ? '#888' : '#666') }
                  ]}>
                    Grow
                  </Text>
                  <Text style={[
                    styles.exploreModeSubtext,
                    { color: isDarkMode ? '#666' : '#999' }
                  ]}>
                    Level up yourself
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            
            {/* Filter Section */}
            <View style={styles.filterSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
              >
                {filterOptions.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: activeFilter === filter.key
                          ? (filter.color ? filter.color + '20' : (isDarkMode ? '#90CAF9' : '#E3F2FD'))
                          : 'transparent',
                        borderColor: activeFilter === filter.key 
                          ? (filter.color || (isDarkMode ? '#90CAF9' : '#3b82f6')) 
                          : (isDarkMode ? '#333' : '#e5e7eb'),
                      }
                    ]}
                    onPress={() => {
                  NuminaAnimations.haptic.selection();
                  setActiveFilter(filter.key);
                }}
                    activeOpacity={0.8}
                  >
                    <FontAwesome5
                      name={filter.icon}
                      size={14}
                      color={activeFilter === filter.key
                        ? (filter.color || (isDarkMode ? '#1a1a1a' : '#1a1a1a'))
                        : (isDarkMode ? '#888' : '#666')
                      }
                    />
                    <Text style={[
                      styles.filterButtonText,
                      {
                        color: activeFilter === filter.key
                          ? (filter.color || (isDarkMode ? '#1a1a1a' : '#1a1a1a'))
                          : (isDarkMode ? '#888' : '#666')
                      }
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Events List */}
            <FlatList
              data={filteredEvents}
              renderItem={renderEventFeedItem}
              keyExtractor={(item) => item.id}
              style={styles.eventsList}
              contentContainerStyle={styles.eventsContent}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>

          {/* Floating Create Event Button */}
          <TouchableOpacity
            style={[
              styles.floatingCreateButton,
              {
                backgroundColor: isDarkMode ? '#6ec5ff' : '#83b2ff',
                shadowColor: isDarkMode ? '#6ec5ff' : '#7eafff',
              }
            ]}
            onPress={() => {
              NuminaAnimations.haptic.medium();
              setShowCreateEventModal(true);
            }}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="pencil-alt"
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* Create Event Modal */}
          <Modal
            visible={showCreateEventModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCreateEventModal(false)}
          >
            <BlurView style={styles.modalOverlay} intensity={20}>
              <View style={[
                styles.createEventModal,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderColor: isDarkMode ? '#333' : '#e5e7eb',
                }
              ]}>
                <View style={styles.createEventHeader}>
                  <Text style={[
                    styles.createEventTitle,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    Create New Event
                  </Text>
                  <TouchableOpacity
                    style={styles.closeCreateEventButton}
                    onPress={() => setShowCreateEventModal(false)}
                  >
                    <FontAwesome5 name="times" size={18} color={isDarkMode ? '#888' : '#666'} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.createEventContent}>
                  {/* Event Title */}
                  <View style={styles.createEventField}>
                    <Text style={[
                      styles.createEventFieldLabel,
                      { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                      Event Title
                    </Text>
                    <TextInput
                      style={[
                        styles.createEventInput,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          color: isDarkMode ? '#fff' : '#000',
                        }
                      ]}
                      placeholder="Enter event title..."
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      value={createEventForm.title}
                      onChangeText={(text) => setCreateEventForm(prev => ({ ...prev, title: text }))}
                    />
                  </View>

                  {/* Event Description */}
                  <View style={styles.createEventField}>
                    <Text style={[
                      styles.createEventFieldLabel,
                      { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                      Description
                    </Text>
                    <TextInput
                      style={[
                        styles.createEventInput,
                        styles.createEventTextArea,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          color: isDarkMode ? '#fff' : '#000',
                        }
                      ]}
                      placeholder="Tell us about your event..."
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      value={createEventForm.description}
                      onChangeText={(text) => setCreateEventForm(prev => ({ ...prev, description: text }))}
                      multiline={true}
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Event Type */}
                  <View style={styles.createEventField}>
                    <Text style={[
                      styles.createEventFieldLabel,
                      { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                      Event Type
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.eventTypeOptions}>
                        {eventTypeFilters.slice(1).map((filter) => (
                          <TouchableOpacity
                            key={filter.key}
                            style={[
                              styles.eventTypeOption,
                              {
                                backgroundColor: createEventForm.type === filter.key
                                  ? (filter.color + '20')
                                  : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                borderColor: createEventForm.type === filter.key
                                  ? filter.color
                                  : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                              }
                            ]}
                            onPress={() => setCreateEventForm(prev => ({ 
                              ...prev, 
                              type: filter.key as Event['type'] 
                            }))}
                          >
                            <FontAwesome5 
                              name={filter.icon} 
                              size={16} 
                              color={createEventForm.type === filter.key 
                                ? filter.color 
                                : (isDarkMode ? '#888' : '#666')
                              } 
                            />
                            <Text style={[
                              styles.eventTypeOptionText,
                              {
                                color: createEventForm.type === filter.key 
                                  ? filter.color 
                                  : (isDarkMode ? '#888' : '#666')
                              }
                            ]}>
                              {filter.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Location */}
                  <View style={styles.createEventField}>
                    <Text style={[
                      styles.createEventFieldLabel,
                      { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                      Location
                    </Text>
                    <TextInput
                      style={[
                        styles.createEventInput,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          color: isDarkMode ? '#fff' : '#000',
                        }
                      ]}
                      placeholder="Event location..."
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      value={createEventForm.location}
                      onChangeText={(text) => setCreateEventForm(prev => ({ ...prev, location: text }))}
                    />
                  </View>

                  {/* Date and Time */}
                  <View style={styles.dateTimeRow}>
                    <View style={[styles.createEventField, { flex: 1, marginRight: 8 }]}>
                      <Text style={[
                        styles.createEventFieldLabel,
                        { color: isDarkMode ? '#fff' : '#000' }
                      ]}>
                        Date
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.createEventInput,
                          styles.dateTimeButton,
                          {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          }
                        ]}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <FontAwesome5 name="calendar" size={16} color={isDarkMode ? '#86efac' : '#10b981'} />
                        <Text style={[
                          styles.dateTimeButtonText,
                          { color: isDarkMode ? '#fff' : '#000' }
                        ]}>
                          {createEventForm.date}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.createEventField, { flex: 1, marginLeft: 8 }]}>
                      <Text style={[
                        styles.createEventFieldLabel,
                        { color: isDarkMode ? '#fff' : '#000' }
                      ]}>
                        Time
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.createEventInput,
                          styles.dateTimeButton,
                          {
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          }
                        ]}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <FontAwesome5 name="clock" size={16} color={isDarkMode ? '#86efac' : '#10b981'} />
                        <Text style={[
                          styles.dateTimeButtonText,
                          { color: isDarkMode ? '#fff' : '#000' }
                        ]}>
                          {createEventForm.time}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Max Participants */}
                  <View style={styles.createEventField}>
                    <Text style={[
                      styles.createEventFieldLabel,
                      { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                      Max Participants
                    </Text>
                    <TextInput
                      style={[
                        styles.createEventInput,
                        {
                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                          color: isDarkMode ? '#fff' : '#000',
                        }
                      ]}
                      placeholder="Maximum number of participants"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      value={createEventForm.maxParticipants.toString()}
                      onChangeText={(text) => setCreateEventForm(prev => ({ 
                        ...prev, 
                        maxParticipants: parseInt(text) || 0 
                      }))}
                      keyboardType="numeric"
                    />
                  </View>
                </ScrollView>

                {/* Create Button */}
                <TouchableOpacity
                  style={[
                    styles.createEventSubmitButton,
                    {
                      backgroundColor: isDarkMode ? '#86efac' : '#10b981',
                      opacity: (createEventForm.title && createEventForm.description) ? 1 : 0.5,
                    }
                  ]}
                  onPress={() => {
                    if (createEventForm.title && createEventForm.description) {
                      // Add new event logic here
                      const newEvent: Event = {
                        id: Date.now().toString(),
                        title: createEventForm.title,
                        description: createEventForm.description,
                        type: createEventForm.type,
                        date: createEventForm.date,
                        time: createEventForm.time,
                        participants: 1,
                        maxParticipants: createEventForm.maxParticipants,
                        host: 'You',
                        isJoined: true,
                        location: createEventForm.location,
                        aiMatchScore: 0.95,
                        emotionalCompatibility: 'high',
                        personalizedReason: 'Perfect for your current interests',
                        moodBoostPotential: 9.0,
                        communityVibe: 'energetic',
                        aiInsights: 'Great opportunity to connect with like-minded people',
                        growthOpportunity: 'Expand your social circle and skills',
                      };
                      
                      setEvents(prev => [newEvent, ...prev]);
                      setShowCreateEventModal(false);
                      
                      // Reset form
                      setCreateEventForm({
                        title: '',
                        description: '',
                        type: 'food_dining',
                        date: 'Today',
                        time: '7:00 PM',
                        location: '',
                        maxParticipants: 10,
                      });
                    }
                  }}
                  disabled={!createEventForm.title || !createEventForm.description}
                >
                  <FontAwesome5 name="plus" size={18} color="#ffffff" />
                  <Text style={styles.createEventSubmitButtonText}>
                    Create Event
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Modal>
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
    paddingTop: 90,
  },
  headerSection: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#575757',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  filterToggle: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  filterChipsContainer: {
    maxHeight: 40,
  },
  filterChipsContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
    paddingBottom: 100,
  },
  feedItem: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  feedItemTouchable: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hostAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hostInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  hostDetails: {
    flex: 1,
  },
  hostName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  postTime: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  moreButton: {
    padding: 8,
  },
  feedContent: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  feedEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 6,
  },
  feedDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Nunito_400Regular',
  },
  eventTags: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  eventTagText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    textTransform: 'capitalize',
  },
  participantCount: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    padding: 8,
    marginRight: 16,
  },
  actionSpacer: {
    flex: 1,
  },
  joinFeedButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  joinFeedButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterGroup: {
    marginVertical: 20,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    letterSpacing: -0.2,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    letterSpacing: -0.2,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  applyFiltersButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  // Event Quick Actions Modal Styles
  eventModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  eventQuickCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  eventQuickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  eventQuickTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventQuickInfo: {
    flex: 1,
  },
  eventQuickTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 4,
    lineHeight: 22,
  },
  eventQuickMeta: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  eventQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  eventQuickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  eventQuickCloseButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Detailed Modal Styles
  detailedModalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  detailedModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailedModalCloseButton: {
    padding: 8,
  },
  detailedModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photosContainer: {
    marginBottom: 24,
  },
  photosContent: {
    paddingRight: 20,
    gap: 12,
  },
  photoContainer: {
    width: 200,
    height: 120,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailedModalHeaderSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  detailedModalTypeIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailedModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailedModalHost: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
  },
  detailedModalDetails: {
    marginBottom: 32,
    gap: 16,
  },
  detailedModalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailedModalDetailText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
  },
  detailedModalDescriptionSection: {
    marginBottom: 32,
  },
  detailedModalDescriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 12,
  },
  detailedModalDescription: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Nunito_400Regular',
  },
  detailedModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  detailedModalPrimaryButton: {
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedModalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  floatingCreateButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  // Create Event Modal Styles
  createEventModalContainer: {
    flex: 1,
    paddingTop: 50,
  },
  createEventModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  createEventModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  createEventModalCloseButton: {
    padding: 8,
  },
  createEventModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  createEventFormSection: {
    marginBottom: 20,
  },
  createEventFormRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  createEventFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 8,
  },
  createEventFormInput: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  createEventFormTextArea: {
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    textAlignVertical: 'top',
  },
  createEventTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  createEventTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  createEventTypeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  createEventModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  createEventCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createEventSubmitButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createEventButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  createEventPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 12,
  },
  createEventPickerText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  // AI Enhancement Styles
  exploreModesSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  exploreModeTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    marginBottom: 12,
  },
  exploreModeContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  exploreModeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    minWidth: 100,
    gap: 4,
  },
  exploreModeText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  exploreModeSubtext: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
  },
  aiInsightsContainer: {
    backgroundColor: 'rgba(255, 107, 157, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.2)',
  },
  aiMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  aiMatchScore: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  compatibilityBadge: {
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  compatibilityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  personalizedReason: {
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 4,
    lineHeight: 16,
  },
  moodBoostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  moodBoostText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  connectionsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionsText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  vibeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  vibeText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    textTransform: 'capitalize',
  },
  floatingSearchBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    zIndex: 1001,
  },
  floatingSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingFilterChipsContainer: {
    maxHeight: 40,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },

  // Search Section Styles
  searchSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Event Item Styles
  eventItem: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  aiMatchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  aiMatchBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Nunito_600SemiBold',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  eventTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventHeaderText: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  joinedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventStatText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  aiInsights: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  aiInsightsText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    flex: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  createEventModal: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  createEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  createEventTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
  closeCreateEventButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createEventContent: {
    maxHeight: 500,
    padding: 20,
    paddingTop: 0,
  },
  createEventField: {
    marginBottom: 16,
  },
  createEventFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
    marginBottom: 8,
  },
  createEventInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
  },
  createEventTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  eventTypeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  eventTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  eventTypeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 0,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Nunito_500Medium',
  },
  createEventSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  createEventSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Nunito_600SemiBold',
  },
});