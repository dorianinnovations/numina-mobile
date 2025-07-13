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
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { TextStyles } from '../utils/fonts';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';

const { width } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  description: string;
  type: 'mindfulness' | 'group_therapy' | 'workshop' | 'social';
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

const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Morning Mindfulness Circle',
    description: 'Start your day with guided meditation and positive intentions',
    type: 'mindfulness',
    date: 'Today',
    time: '8:00 AM',
    participants: 12,
    maxParticipants: 20,
    host: 'Sarah Chen',
    isJoined: true,
    photos: ['https://picsum.photos/400/300?random=1', 'https://picsum.photos/400/300?random=2'],
    fullDescription: 'Join us for a peaceful morning session focused on mindfulness and meditation. We\'ll practice breathing techniques, guided visualization, and set positive intentions for the day ahead. Perfect for beginners and experienced practitioners alike.',
    location: 'Zen Garden, Building A',
    duration: '45 minutes',
  },
  {
    id: '2',
    title: 'Anxiety Support Group',
    description: 'Safe space to share experiences and coping strategies',
    type: 'group_therapy',
    date: 'Tomorrow',
    time: '6:00 PM',
    participants: 8,
    maxParticipants: 15,
    host: 'Dr. Maya Patel',
    isJoined: false,
    photos: ['https://picsum.photos/400/300?random=3', 'https://picsum.photos/400/300?random=4'],
    fullDescription: 'A supportive community for individuals dealing with anxiety. Share your experiences, learn from others, and discover practical coping strategies in a judgment-free environment. Led by licensed therapist Dr. Maya Patel with over 10 years of experience in anxiety disorders.',
    location: 'Therapy Room B, Second Floor',
    duration: '60 minutes',
  },
  {
    id: '3',
    title: 'Creative Expression Workshop',
    description: 'Art therapy session for emotional processing',
    type: 'workshop',
    date: 'Dec 16',
    time: '3:00 PM',
    participants: 15,
    maxParticipants: 25,
    host: 'Alex Rivera',
    isJoined: false,
    photos: ['https://picsum.photos/400/300?random=5', 'https://picsum.photos/400/300?random=6', 'https://picsum.photos/400/300?random=7'],
    fullDescription: 'Explore your emotions through creative expression in this hands-on art therapy workshop. No artistic experience required - just bring your willingness to explore and express. We\'ll use various mediums including painting, drawing, and collage to process feelings and discover new insights about yourself.',
    location: 'Art Studio, Creative Wing',
    duration: '90 minutes',
  },
  {
    id: '4',
    title: 'Coffee & Connection',
    description: 'Casual social meetup for community building',
    type: 'social',
    date: 'Dec 18',
    time: '10:00 AM',
    participants: 6,
    maxParticipants: 12,
    host: 'Community Team',
    isJoined: true,
    photos: ['https://picsum.photos/400/300?random=8'],
    fullDescription: 'Join us for a relaxed morning of coffee, conversation, and connection. This informal gathering is perfect for meeting new people, sharing stories, and building meaningful relationships within our community. Light refreshments provided.',
    location: 'Community Lounge, Main Building',
    duration: '2 hours',
  },
  {
    id: '5',
    title: 'Evening Yoga & Reflection',
    description: 'Gentle yoga practice followed by group reflection',
    type: 'mindfulness',
    date: 'Dec 17',
    time: '7:30 PM',
    participants: 18,
    maxParticipants: 25,
    host: 'Luna Martinez',
    isJoined: false,
    photos: ['https://picsum.photos/400/300?random=9', 'https://picsum.photos/400/300?random=10'],
    fullDescription: 'Unwind after a long day with gentle yoga movements designed to release tension and promote relaxation. The session concludes with guided reflection and group sharing in a supportive environment. Suitable for all levels, mats provided.',
    location: 'Wellness Studio, Garden Level',
    duration: '75 minutes',
  },
  {
    id: '6',
    title: 'Stress Management Workshop',
    description: 'Learn practical techniques for managing daily stress',
    type: 'workshop',
    date: 'Dec 19',
    time: '2:00 PM',
    participants: 22,
    maxParticipants: 30,
    host: 'Dr. James Wilson',
    isJoined: false,
  },
  {
    id: '7',
    title: 'Depression Support Circle',
    description: 'Peer support for those dealing with depression',
    type: 'group_therapy',
    date: 'Dec 20',
    time: '11:00 AM',
    participants: 9,
    maxParticipants: 12,
    host: 'Michelle Roberts',
    isJoined: true,
  },
  {
    id: '8',
    title: 'Digital Detox Challenge',
    description: 'Group challenge to reduce screen time mindfully',
    type: 'social',
    date: 'Dec 21',
    time: '4:00 PM',
    participants: 14,
    maxParticipants: 20,
    host: 'Tech Wellness Team',
    isJoined: false,
  },
];

export const CloudScreen: React.FC<CloudScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [events, setEvents] = useState(SAMPLE_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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
      case 'mindfulness':
        return 'brain';
      case 'group_therapy':
        return 'users';
      case 'workshop':
        return 'tools';
      case 'social':
        return 'coffee';
      default:
        return 'calendar';
    }
  };

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'mindfulness':
        return isDarkMode ? '#B8E6B8' : '#10b981';
      case 'group_therapy':
        return isDarkMode ? '#E6F3FF' : '#3b82f6';
      case 'workshop':
        return isDarkMode ? '#FFF9C4' : '#f59e0b';
      case 'social':
        return isDarkMode ? '#FFE4E1' : '#ef4444';
      default:
        return isDarkMode ? '#90CAF9' : '#6366f1';
    }
  };

  const handleJoinEvent = (eventId: string) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { ...event, isJoined: !event.isJoined, participants: event.isJoined ? event.participants - 1 : event.participants + 1 }
          : event
      )
    );
  };

  // Advanced filtering logic
  const filteredEvents = events.filter(event => {
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
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEventAction = (action: 'like' | 'share' | 'save' | 'more') => {
    if (!selectedEvent) return;
    
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
        <TouchableOpacity
          onPress={() => handleEventPress(event)}
          style={styles.moreButton}
        >
          <FontAwesome5
            name="ellipsis-h"
            size={16}
            color={isDarkMode ? '#888' : '#666'}
          />
        </TouchableOpacity>
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
          <Text style={[
            styles.participantCount,
            { color: isDarkMode ? '#888' : '#666' }
          ]}>
            {event.participants} going
          </Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.feedActions}>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome5
            name="heart"
            size={18}
            color={isDarkMode ? '#888' : '#666'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
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
    { key: 'all', label: 'All', icon: 'th-large' },
    { key: 'mindfulness', label: 'Mindfulness', icon: 'brain' },
    { key: 'group_therapy', label: 'Support', icon: 'users' },
    { key: 'workshop', label: 'Workshops', icon: 'tools' },
    { key: 'social', label: 'Social', icon: 'coffee' },
  ];

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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={[
                styles.statsCard,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderColor: isDarkMode ? '#333' : '#e5e7eb',
                }
              ]}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={15}
                      color={isDarkMode ? '#90CAF9' : '#3b82f6'}
                    />
                    <Text style={[
                      styles.statNumber,
                      { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
                    ]}>
                      47
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: isDarkMode ? '#888' : '#666' }
                    ]}>
                      Active Members
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="calendar-heart"
                      size={15}
                      color={isDarkMode ? '#B8E6B8' : '#10b981'}
                    />
                    <Text style={[
                      styles.statNumber,
                      { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
                    ]}>
                      12
                    </Text>
                    <Text style={[
                      styles.statLabel,
                      { color: isDarkMode ? '#888' : '#666' }
                    ]}>
                      Events This Week
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
              <View style={[
                styles.searchContainer,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderColor: isDarkMode ? '#333' : '#e5e7eb',
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
                    { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
                  ]}
                  placeholder="Search events, hosts, or topics..."
                  placeholderTextColor={isDarkMode ? '#666' : '#999'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
                <TouchableOpacity
                  style={[
                    styles.filterToggle,
                    {
                      backgroundColor: showFilters
                        ? (isDarkMode ? '#90CAF9' : '#E3F2FD')
                        : 'transparent',
                    }
                  ]}
                  onPress={() => setShowFilters(!showFilters)}
                  activeOpacity={0.8}
                >
                  <FontAwesome5
                    name="sliders-h"
                    size={14}
                    color={showFilters
                      ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
                      : (isDarkMode ? '#888' : '#666')
                    }
                  />
                </TouchableOpacity>
              </View>

              {/* Active Filters Chips */}
              {(searchFilters.eventType.length > 0 || searchFilters.timeOfDay.length > 0 || searchFilters.participantRange !== 'any') && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filterChipsContainer}
                  contentContainerStyle={styles.filterChipsContent}
                >
                  {searchFilters.eventType.map((type) => (
                    <View key={type} style={[
                      styles.filterChip,
                      { backgroundColor: isDarkMode ? '#333' : '#f3f4f6' }
                    ]}>
                      <Text style={[
                        styles.filterChipText,
                        { color: isDarkMode ? '#fff' : '#374151' }
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSearchFilters(prev => ({
                            ...prev,
                            eventType: prev.eventType.filter(t => t !== type)
                          }));
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <FontAwesome5
                          name="times"
                          size={10}
                          color={isDarkMode ? '#888' : '#666'}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {searchFilters.timeOfDay.map((time) => (
                    <View key={time} style={[
                      styles.filterChip,
                      { backgroundColor: isDarkMode ? '#333' : '#f3f4f6' }
                    ]}>
                      <Text style={[
                        styles.filterChipText,
                        { color: isDarkMode ? '#fff' : '#374151' }
                      ]}>
                        {time.charAt(0).toUpperCase() + time.slice(1)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSearchFilters(prev => ({
                            ...prev,
                            timeOfDay: prev.timeOfDay.filter(t => t !== time)
                          }));
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <FontAwesome5
                          name="times"
                          size={10}
                          color={isDarkMode ? '#888' : '#666'}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {searchFilters.participantRange !== 'any' && (
                    <View style={[
                      styles.filterChip,
                      { backgroundColor: isDarkMode ? '#333' : '#f3f4f6' }
                    ]}>
                      <Text style={[
                        styles.filterChipText,
                        { color: isDarkMode ? '#fff' : '#374151' }
                      ]}>
                        {searchFilters.participantRange.charAt(0).toUpperCase() + searchFilters.participantRange.slice(1)} group
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSearchFilters(prev => ({
                            ...prev,
                            participantRange: 'any'
                          }));
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <FontAwesome5
                          name="times"
                          size={10}
                          color={isDarkMode ? '#888' : '#666'}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              )}
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
                          ? (isDarkMode ? '#90CAF9' : '#E3F2FD')
                          : 'transparent',
                        borderColor: isDarkMode ? '#333' : '#e5e7eb',
                      }
                    ]}
                    onPress={() => setActiveFilter(filter.key)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome5
                      name={filter.icon}
                      size={14}
                      color={activeFilter === filter.key
                        ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
                        : (isDarkMode ? '#888' : '#666')
                      }
                    />
                    <Text style={[
                      styles.filterButtonText,
                      {
                        color: activeFilter === filter.key
                          ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
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

          {/* Filter Modal */}
          <Modal
            visible={showFilters}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowFilters(false)}
          >
            <View style={[
              styles.modalContainer,
              { backgroundColor: isDarkMode ? '#111' : '#fff' }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#fff' : '#000' }
                ]}>
                  Filter Events
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFilters(false)}
                  style={styles.modalCloseButton}
                >
                  <FontAwesome5
                    name="times"
                    size={18}
                    color={isDarkMode ? '#888' : '#666'}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Event Type Filter */}
                <View style={styles.filterGroup}>
                  <Text style={[
                    styles.filterGroupTitle,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    Event Type
                  </Text>
                  <View style={styles.filterOptions}>
                    {['mindfulness', 'group_therapy', 'workshop', 'social'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.filterOption,
                          {
                            backgroundColor: searchFilters.eventType.includes(type)
                              ? (isDarkMode ? '#90CAF9' : '#E3F2FD')
                              : (isDarkMode ? '#222' : '#f9fafb'),
                            borderColor: isDarkMode ? '#333' : '#e5e7eb',
                          }
                        ]}
                        onPress={() => {
                          setSearchFilters(prev => ({
                            ...prev,
                            eventType: prev.eventType.includes(type)
                              ? prev.eventType.filter(t => t !== type)
                              : [...prev.eventType, type]
                          }));
                        }}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          {
                            color: searchFilters.eventType.includes(type)
                              ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
                              : (isDarkMode ? '#fff' : '#374151')
                          }
                        ]}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Time of Day Filter */}
                <View style={styles.filterGroup}>
                  <Text style={[
                    styles.filterGroupTitle,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    Time of Day
                  </Text>
                  <View style={styles.filterOptions}>
                    {['morning', 'afternoon', 'evening'].map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.filterOption,
                          {
                            backgroundColor: searchFilters.timeOfDay.includes(time)
                              ? (isDarkMode ? '#90CAF9' : '#E3F2FD')
                              : (isDarkMode ? '#222' : '#f9fafb'),
                            borderColor: isDarkMode ? '#333' : '#e5e7eb',
                          }
                        ]}
                        onPress={() => {
                          setSearchFilters(prev => ({
                            ...prev,
                            timeOfDay: prev.timeOfDay.includes(time)
                              ? prev.timeOfDay.filter(t => t !== time)
                              : [...prev.timeOfDay, time]
                          }));
                        }}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          {
                            color: searchFilters.timeOfDay.includes(time)
                              ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
                              : (isDarkMode ? '#fff' : '#374151')
                          }
                        ]}>
                          {time.charAt(0).toUpperCase() + time.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Group Size Filter */}
                <View style={styles.filterGroup}>
                  <Text style={[
                    styles.filterGroupTitle,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    Group Size
                  </Text>
                  <View style={styles.filterOptions}>
                    {[
                      { key: 'any', label: 'Any Size' },
                      { key: 'small', label: 'Small (1-10)' },
                      { key: 'medium', label: 'Medium (11-20)' },
                      { key: 'large', label: 'Large (21+)' }
                    ].map((size) => (
                      <TouchableOpacity
                        key={size.key}
                        style={[
                          styles.filterOption,
                          {
                            backgroundColor: searchFilters.participantRange === size.key
                              ? (isDarkMode ? '#90CAF9' : '#E3F2FD')
                              : (isDarkMode ? '#222' : '#f9fafb'),
                            borderColor: isDarkMode ? '#333' : '#e5e7eb',
                          }
                        ]}
                        onPress={() => {
                          setSearchFilters(prev => ({
                            ...prev,
                            participantRange: size.key
                          }));
                        }}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          {
                            color: searchFilters.participantRange === size.key
                              ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
                              : (isDarkMode ? '#fff' : '#374151')
                          }
                        ]}>
                          {size.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Suggested Searches */}
                <View style={styles.filterGroup}>
                  <Text style={[
                    styles.filterGroupTitle,
                    { color: isDarkMode ? '#fff' : '#000' }
                  ]}>
                    Suggested Searches
                  </Text>
                  <View style={styles.filterOptions}>
                    {[
                      'meditation',
                      'anxiety support',
                      'stress relief',
                      'depression help',
                      'mindful breathing',
                      'art therapy',
                      'peer support',
                      'wellness workshop'
                    ].map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={[
                          styles.suggestionChip,
                          {
                            backgroundColor: isDarkMode ? '#222' : '#f9fafb',
                            borderColor: isDarkMode ? '#333' : '#e5e7eb',
                          }
                        ]}
                        onPress={() => {
                          setSearchQuery(suggestion);
                          setShowFilters(false);
                        }}
                      >
                        <FontAwesome5
                          name="search"
                          size={12}
                          color={isDarkMode ? '#888' : '#666'}
                        />
                        <Text style={[
                          styles.suggestionText,
                          { color: isDarkMode ? '#fff' : '#374151' }
                        ]}>
                          {suggestion}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={[
                styles.modalFooter,
                { borderTopColor: isDarkMode ? '#333' : '#e5e7eb' }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.clearFiltersButton,
                    {
                      backgroundColor: isDarkMode ? '#333' : '#f3f4f6',
                    }
                  ]}
                  onPress={() => {
                    setSearchFilters({
                      timeOfDay: [],
                      eventType: [],
                      participantRange: 'any',
                      dateRange: 'any',
                      difficulty: [],
                      location: 'any',
                    });
                    setSearchQuery('');
                  }}
                >
                  <Text style={[
                    styles.clearFiltersText,
                    { color: isDarkMode ? '#fff' : '#374151' }
                  ]}>
                    Clear All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.applyFiltersButton,
                    { backgroundColor: isDarkMode ? '#90CAF9' : '#3b82f6' }
                  ]}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={[
                    styles.applyFiltersText,
                    { color: isDarkMode ? '#1a1a1a' : '#fff' }
                  ]}>
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Event Quick Actions Modal */}
          <Modal
            visible={showEventModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowEventModal(false)}
          >
            <TouchableOpacity 
              style={styles.eventModalOverlay}
              activeOpacity={1}
              onPress={() => setShowEventModal(false)}
            >
              <View style={[
                styles.eventQuickCard,
                {
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
                  borderColor: isDarkMode ? '#333' : '#e5e7eb',
                }
              ]}>
                {selectedEvent && (
                  <>
                    {/* Event Preview */}
                    <View style={styles.eventQuickHeader}>
                      <View style={[
                        styles.eventQuickTypeIcon,
                        { backgroundColor: getEventTypeColor(selectedEvent.type) + '20' }
                      ]}>
                        <FontAwesome5
                          name={getEventTypeIcon(selectedEvent.type)}
                          size={16}
                          color={getEventTypeColor(selectedEvent.type)}
                        />
                      </View>
                      <View style={styles.eventQuickInfo}>
                        <Text style={[
                          styles.eventQuickTitle,
                          { color: isDarkMode ? '#fff' : '#000' }
                        ]}>
                          {selectedEvent.title}
                        </Text>
                        <Text style={[
                          styles.eventQuickMeta,
                          { color: isDarkMode ? '#888' : '#666' }
                        ]}>
                          {selectedEvent.date} • {selectedEvent.time}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.eventQuickActions}>
                      <TouchableOpacity
                        style={styles.eventQuickActionButton}
                        onPress={() => handleEventAction('like')}
                      >
                        <FontAwesome5
                          name="heart"
                          size={18}
                          color={isDarkMode ? '#FFE4E1' : '#ef4444'}
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.eventQuickActionButton}
                        onPress={() => handleEventAction('save')}
                      >
                        <FontAwesome5
                          name="bookmark"
                          size={18}
                          color={isDarkMode ? '#FFF9C4' : '#f59e0b'}
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.eventQuickActionButton}
                        onPress={() => handleEventAction('share')}
                      >
                        <FontAwesome5
                          name="share"
                          size={18}
                          color={isDarkMode ? '#90CAF9' : '#3b82f6'}
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.eventQuickActionButton}
                        onPress={() => handleEventAction('more')}
                      >
                        <FontAwesome5
                          name="ellipsis-h"
                          size={18}
                          color={isDarkMode ? '#888' : '#666'}
                        />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Detailed Event Modal */}
          <Modal
            visible={showDetailedModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowDetailedModal(false)}
          >
            <View style={[
              styles.detailedModalContainer,
              { backgroundColor: isDarkMode ? '#111' : '#fff' }
            ]}>
              <View style={styles.detailedModalHeader}>
                <TouchableOpacity
                  onPress={() => setShowDetailedModal(false)}
                  style={styles.detailedModalCloseButton}
                >
                  <FontAwesome5
                    name="times"
                    size={18}
                    color={isDarkMode ? '#888' : '#666'}
                  />
                </TouchableOpacity>
              </View>

              {selectedEvent && (
                <ScrollView style={styles.detailedModalContent}>
                  {/* Event Photos */}
                  {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.photosContainer}
                      contentContainerStyle={styles.photosContent}
                    >
                      {selectedEvent.photos.map((photo, index) => (
                        <View key={index} style={styles.photoContainer}>
                          <View style={[
                            styles.photoPlaceholder,
                            { backgroundColor: isDarkMode ? '#333' : '#f3f4f6' }
                          ]}>
                            <FontAwesome5
                              name="image"
                              size={24}
                              color={isDarkMode ? '#666' : '#9ca3af'}
                            />
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {/* Event Header */}
                  <View style={styles.detailedModalHeaderSection}>
                    <View style={[
                      styles.detailedModalTypeIcon,
                      { backgroundColor: getEventTypeColor(selectedEvent.type) + '20' }
                    ]}>
                      <FontAwesome5
                        name={getEventTypeIcon(selectedEvent.type)}
                        size={16}
                        color={getEventTypeColor(selectedEvent.type)}
                      />
                    </View>
                    <Text style={[
                      styles.detailedModalTitle,
                      { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                      {selectedEvent.title}
                    </Text>
                    <Text style={[
                      styles.detailedModalHost,
                      { color: isDarkMode ? '#888' : '#666' }
                    ]}>
                      Hosted by {selectedEvent.host}
                    </Text>
                  </View>

                  {/* Event Details */}
                  <View style={styles.detailedModalDetails}>
                    <View style={styles.detailedModalDetailRow}>
                      <MaterialCommunityIcons
                        name="calendar-clock"
                        size={20}
                        color={isDarkMode ? '#90CAF9' : '#3b82f6'}
                      />
                      <Text style={[
                        styles.detailedModalDetailText,
                        { color: isDarkMode ? '#fff' : '#000' }
                      ]}>
                        {selectedEvent.date} at {selectedEvent.time}
                      </Text>
                    </View>
                    <View style={styles.detailedModalDetailRow}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={20}
                        color={isDarkMode ? '#B8E6B8' : '#10b981'}
                      />
                      <Text style={[
                        styles.detailedModalDetailText,
                        { color: isDarkMode ? '#fff' : '#000' }
                      ]}>
                        {selectedEvent.participants}/{selectedEvent.maxParticipants} participants
                      </Text>
                    </View>
                    {selectedEvent.location && (
                      <View style={styles.detailedModalDetailRow}>
                        <FontAwesome5
                          name="map-marker-alt"
                          size={20}
                          color={isDarkMode ? '#FFE4E1' : '#ef4444'}
                        />
                        <Text style={[
                          styles.detailedModalDetailText,
                          { color: isDarkMode ? '#fff' : '#000' }
                        ]}>
                          {selectedEvent.location}
                        </Text>
                      </View>
                    )}
                    {selectedEvent.duration && (
                      <View style={styles.detailedModalDetailRow}>
                        <FontAwesome5
                          name="clock"
                          size={20}
                          color={isDarkMode ? '#FFF9C4' : '#f59e0b'}
                        />
                        <Text style={[
                          styles.detailedModalDetailText,
                          { color: isDarkMode ? '#fff' : '#000' }
                        ]}>
                          {selectedEvent.duration}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Full Description */}
                  <View style={styles.detailedModalDescriptionSection}>
                    <Text style={[
                      styles.detailedModalDescriptionTitle,
                      { color: isDarkMode ? '#fff' : '#000' }
                    ]}>
                      About this event
                    </Text>
                    <Text style={[
                      styles.detailedModalDescription,
                      { color: isDarkMode ? '#ccc' : '#555' }
                    ]}>
                      {selectedEvent.fullDescription || selectedEvent.description}
                    </Text>
                  </View>
                </ScrollView>
              )}

              {/* Action Buttons */}
              <View style={[
                styles.detailedModalFooter,
                { borderTopColor: isDarkMode ? '#333' : '#e5e7eb' }
              ]}>
                <TouchableOpacity
                  style={[
                    styles.detailedModalPrimaryButton,
                    {
                      backgroundColor: selectedEvent?.isJoined
                        ? (isDarkMode ? '#90CAF9' : '#E3F2FD')
                        : (isDarkMode ? '#90CAF9' : '#3b82f6'),
                    }
                  ]}
                  onPress={() => {
                    if (selectedEvent) {
                      handleJoinEvent(selectedEvent.id);
                    }
                    setShowDetailedModal(false);
                  }}
                >
                  <Text style={[
                    styles.detailedModalPrimaryButtonText,
                    {
                      color: selectedEvent?.isJoined
                        ? (isDarkMode ? '#1a1a1a' : '#1a1a1a')
                        : (isDarkMode ? '#1a1a1a' : '#fff')
                    }
                  ]}>
                    {selectedEvent?.isJoined ? 'Leave Event' : 'Join Event'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    paddingHorizontal: 16,
  },
  headerSection: {
    marginBottom: 8,
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
  searchSection: {
    marginBottom: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
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
    paddingBottom: 20,
  },
  feedItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontFamily: 'CrimsonPro_400Regular',
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
    fontFamily: 'CrimsonPro_600SemiBold',
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
    fontFamily: 'CrimsonPro_700Bold',
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
    fontFamily: 'CrimsonPro_400Regular',
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
});