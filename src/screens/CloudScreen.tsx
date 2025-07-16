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
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { PageBackground } from '../components/PageBackground';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useRealTimeEvents } from '../hooks/useRealTimeEvents';
import { RealTimeEvent } from '../services/realTimeSync';

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
  aiMatchScore?: number;
  emotionalCompatibility?: string;
  personalizedReason?: string;
  moodBoostPotential?: number;
  location?: string;
  duration?: string;
}

interface CloudScreenProps {
  onNavigateBack: () => void;
}

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'ai-matched', label: 'For You', icon: 'sparkles' },
  { id: 'nearby', label: 'Nearby', icon: 'location-outline' },
  { id: 'today', label: 'Today', icon: 'calendar-today' },
  { id: 'joined', label: 'Joined', icon: 'checkmark-circle' },
];

const EVENT_TYPES = [
  { id: 'food_dining', label: 'Food & Dining', icon: 'restaurant', color: '#ff6b6b' },
  { id: 'tech_learning', label: 'Tech & Learning', icon: 'laptop', color: '#4ecdc4' },
  { id: 'outdoor_activity', label: 'Outdoor', icon: 'leaf', color: '#45b7d1' },
  { id: 'creative_arts', label: 'Creative Arts', icon: 'color-palette', color: '#f9ca24' },
  { id: 'fitness_wellness', label: 'Fitness', icon: 'fitness', color: '#f0932b' },
  { id: 'professional_networking', label: 'Networking', icon: 'people', color: '#eb4d4b' },
  { id: 'hobby_interest', label: 'Hobbies', icon: 'game-controller', color: '#6c5ce7' },
  { id: 'cultural_exploration', label: 'Culture', icon: 'globe', color: '#a29bfe' },
];

export const CloudScreen: React.FC<CloudScreenProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const { 
    events: realTimeEvents, 
    isLoading: eventsLoading, 
    error: eventsError 
  } = useRealTimeEvents();
  const [activeFilter, setActiveFilter] = useState('ai-matched');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSearchControls, setShowSearchControls] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const filterSlideAnim = useRef(new Animated.Value(-100)).current;
  const searchControlsHeight = useRef(new Animated.Value(0)).current;
  const searchControlsOpacity = useRef(new Animated.Value(0)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;

  // Process real-time events with proper type conversion
  const events = (realTimeEvents || []).filter((event, index, self) => 
    index === self.findIndex(e => e.id === event.id)
  ).map((event: RealTimeEvent) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    type: (event.type as Event['type']) || 'hobby_interest',
    date: event.date,
    time: event.time,
    participants: event.currentParticipants || 0,
    maxParticipants: event.maxParticipants || 10,
    host: event.hostName || 'Anonymous',
    isJoined: event.participants?.includes(event.hostId || '') || false,
    aiMatchScore: (event as any).aiMatchScore,
    emotionalCompatibility: (event as any).emotionalCompatibility,
    personalizedReason: (event as any).personalizedReason,
    moodBoostPotential: (event as any).moodBoostPotential,
    location: event.location,
    duration: (event as any).duration,
  })) as Event[];

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

  const filteredEvents = events.filter(event => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!event.title.toLowerCase().includes(query) && 
          !event.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Type filter
    if (selectedTypes.length > 0 && !selectedTypes.includes(event.type)) {
      return false;
    }

    // Category filter
    switch (activeFilter) {
      case 'ai-matched':
        return event.aiMatchScore && event.aiMatchScore > 0.7;
      case 'nearby':
        return event.location && event.location.includes('Downtown');
      case 'today':
        return event.date === 'Today';
      case 'joined':
        return event.isJoined;
      default:
        return true;
    }
  });

  const handleFilterPress = (filterId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filterId);
  };

  const handleTypeToggle = (typeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowFilters(!showFilters);
    Animated.timing(filterSlideAnim, {
      toValue: showFilters ? -100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleSearchControls = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newShowSearchControls = !showSearchControls;
    setShowSearchControls(newShowSearchControls);
    
    Animated.parallel([
      Animated.timing(searchControlsHeight, {
        toValue: newShowSearchControls ? 200 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(searchControlsOpacity, {
        toValue: newShowSearchControls ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(arrowRotation, {
        toValue: newShowSearchControls ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };


  const getTypeInfo = (type: string) => {
    return EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];
  };

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => {
    const typeInfo = getTypeInfo(item.type);
    
    return (
      <Animated.View 
        style={[
          styles.eventCard,
          {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }
        ]}
      >
        {/* Event Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}20` }]}>
          <Ionicons name={typeInfo.icon as any} size={16} color={typeInfo.color} />
          <Text style={[styles.typeText, { color: typeInfo.color }]}>
            {typeInfo.label}
          </Text>
        </View>

        {/* AI Match Score */}
        {item.aiMatchScore && item.aiMatchScore > 0.7 && (
          <View style={styles.aiMatchBadge}>
            <FontAwesome5 name="magic" size={12} color={NuminaColors.purple} />
            <Text style={[styles.aiMatchText, { color: NuminaColors.purple }]}>
              {Math.round(item.aiMatchScore * 100)}% match
            </Text>
          </View>
        )}

        {/* Event Content */}
        <View style={styles.eventContent}>
          <Text style={[
            styles.eventTitle, 
            { color: isDarkMode ? '#fff' : '#1a1a1a' }
          ]}>
            {item.title}
          </Text>
          
          <Text style={[
            styles.eventDescription,
            { color: isDarkMode ? '#bbb' : '#666' }
          ]}>
            {item.description}
          </Text>

          {/* Event Meta */}
          <View style={styles.eventMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#888' : '#999'} />
              <Text style={[styles.metaText, { color: isDarkMode ? '#888' : '#999' }]}>
                {item.date} • {item.time}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={isDarkMode ? '#888' : '#999'} />
              <Text style={[styles.metaText, { color: isDarkMode ? '#888' : '#999' }]}>
                {item.participants}/{item.maxParticipants}
              </Text>
            </View>

            {item.location && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={isDarkMode ? '#888' : '#999'} />
                <Text style={[styles.metaText, { color: isDarkMode ? '#888' : '#999' }]}>
                  {item.location}
                </Text>
              </View>
            )}
          </View>

          {/* Join Button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              {
                backgroundColor: item.isJoined 
                  ? `${NuminaColors.green}20` 
                  : `${typeInfo.color}20`,
                borderColor: item.isJoined ? NuminaColors.green : typeInfo.color,
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Handle join/leave logic
            }}
          >
            <Ionicons 
              name={item.isJoined ? "checkmark-circle" : "add-circle-outline"} 
              size={18} 
              color={item.isJoined ? NuminaColors.green : typeInfo.color} 
            />
            <Text style={[
              styles.joinButtonText,
              { color: item.isJoined ? NuminaColors.green : typeInfo.color }
            ]}>
              {item.isJoined ? 'Joined' : 'Join Event'}
            </Text>
          </TouchableOpacity>

          {/* Personalized Reason */}
          {item.personalizedReason && (
            <View style={styles.personalizedSection}>
              <FontAwesome5 name="lightbulb" size={12} color={NuminaColors.yellow} />
              <Text style={[
                styles.personalizedText,
                { color: isDarkMode ? '#ddd' : '#555' }
              ]}>
                {item.personalizedReason}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => {
    if (eventsError) {
      return (
        <View style={styles.emptyState}>
          <Ionicons 
            name="warning-outline" 
            size={64} 
            color={isDarkMode ? '#ff6b6b' : '#ff4757'} 
          />
          <Text style={[
            styles.emptyTitle,
            { color: isDarkMode ? '#ff6b6b' : '#ff4757' }
          ]}>
            Unable to load events
          </Text>
          <Text style={[
            styles.emptySubtitle,
            { color: isDarkMode ? '#666' : '#999' }
          ]}>
            Please check your connection and try again
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons 
          name="cloud-outline" 
          size={64} 
          color={isDarkMode ? '#444' : '#ccc'} 
        />
        <Text style={[
          styles.emptyTitle,
          { color: isDarkMode ? '#888' : '#666' }
        ]}>
          No events found
        </Text>
        <Text style={[
          styles.emptySubtitle,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          Try adjusting your filters or search
        </Text>
      </View>
    );
  };

  return (
    <ScreenWrapper
      showHeader={true}
      showBackButton={true}
      showMenuButton={true}
      title="Discover"
      subtitle="Find your tribe"
    >
      <PageBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar 
            barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
            backgroundColor="transparent"
            translucent={true}
          />

          {/* Search Header */}
          <Animated.View 
            style={[
              styles.searchHeader,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* Search Bar */}
            <View style={[
              styles.searchBar,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
              }
            ]}>
              <Ionicons name="search" size={20} color={isDarkMode ? '#888' : '#999'} />
              <TextInput
                style={[
                  styles.searchInput,
                  { color: isDarkMode ? '#fff' : '#333' }
                ]}
                placeholder="Search events..."
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={isDarkMode ? '#888' : '#999'} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Toggle */}
            <TouchableOpacity
              style={[
                styles.filterToggle,
                {
                  backgroundColor: showFilters 
                    ? `${NuminaColors.purple}20` 
                    : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'),
                }
              ]}
              onPress={toggleFilters}
            >
              <Ionicons 
                name="options" 
                size={20} 
                color={showFilters ? NuminaColors.purple : (isDarkMode ? '#888' : '#999')} 
              />
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Filters */}
          <Animated.View 
            style={[
              styles.quickFilters,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              {FILTER_CATEGORIES.map(filter => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: activeFilter === filter.id
                        ? `${NuminaColors.purple}20`
                        : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                      borderColor: activeFilter === filter.id
                        ? NuminaColors.purple
                        : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                    }
                  ]}
                  onPress={() => handleFilterPress(filter.id)}
                >
                  <Ionicons 
                    name={filter.icon as any} 
                    size={16} 
                    color={activeFilter === filter.id ? NuminaColors.purple : (isDarkMode ? '#888' : '#999')} 
                  />
                  <Text style={[
                    styles.filterText,
                    { 
                      color: activeFilter === filter.id 
                        ? NuminaColors.purple 
                        : (isDarkMode ? '#888' : '#999') 
                    }
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>


          {/* Advanced Filters Panel */}
          <Animated.View 
            style={[
              styles.advancedFilters,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                transform: [{ translateY: filterSlideAnim }],
              }
            ]}
          >
            <Text style={[
              styles.filtersTitle,
              { color: isDarkMode ? '#fff' : '#333' }
            ]}>
              Event Types
            </Text>
            <View style={styles.typeFilters}>
              {EVENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: selectedTypes.includes(type.id)
                        ? `${type.color}20`
                        : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                      borderColor: selectedTypes.includes(type.id)
                        ? type.color
                        : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
                    }
                  ]}
                  onPress={() => handleTypeToggle(type.id)}
                >
                  <Ionicons 
                    name={type.icon as any} 
                    size={14} 
                    color={selectedTypes.includes(type.id) ? type.color : (isDarkMode ? '#888' : '#999')} 
                  />
                  <Text style={[
                    styles.typeChipText,
                    { 
                      color: selectedTypes.includes(type.id) 
                        ? type.color 
                        : (isDarkMode ? '#888' : '#999') 
                    }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Events List */}
          <Animated.View 
            style={[
              styles.eventsContainer,
              { opacity: fadeAnim }
            ]}
          >
            {(loading || eventsLoading) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={NuminaColors.purple} />
                <Text style={[
                  styles.loadingText,
                  { color: isDarkMode ? '#888' : '#666' }
                ]}>
                  Finding perfect events for you...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredEvents}
                renderItem={renderEventCard}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.eventsList,
                  { paddingBottom: showFilters ? 140 : 100 }
                ]}
                ListEmptyComponent={renderEmptyState}
                onScroll={() => {
                  if (showFilters) {
                    setShowFilters(false);
                    Animated.timing(filterSlideAnim, {
                      toValue: -100,
                      duration: 300,
                      useNativeDriver: true,
                    }).start();
                  }
                }}
              />
            )}
          </Animated.View>
        </SafeAreaView>
      </PageBackground>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 100,
  },
  searchHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 240,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  filterToggle: {
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilters: {
    marginTop: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  advancedFilters: {
    position: 'absolute',
    top: 160,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  eventsContainer: {
    flex: 1,
    marginTop: 12,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  eventCard: {
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  aiMatchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 12,
    gap: 4,
    zIndex: 1,
  },
  aiMatchText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  eventContent: {
    padding: 20,
    paddingTop: 52,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    lineHeight: 24,
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 20,
  },
  eventMeta: {
    gap: 10,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  personalizedSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  personalizedText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});