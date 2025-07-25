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
  RefreshControl,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { NuminaColors } from '../utils/colors';
import { PageBackground } from '../components/ui/PageBackground';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useRealTimeEvents } from '../hooks/useRealTimeEvents';
import { RealTimeEvent } from '../services/realTimeSync';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

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

interface CloudFindProps {
  onNavigateBack: () => void;
}

const FILTER_CATEGORIES = [
  { id: 'ai-matched', label: 'Explore', icon: 'compass-outline' },
  { id: 'today', label: 'Events', icon: 'calendar-outline' },
  { id: 'all', label: 'Home', icon: 'home-outline' },
  { id: 'nearby', label: 'Map', icon: 'map-outline' },
  { id: 'joined', label: 'Me', icon: 'person-outline' },
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

export const CloudFind: React.FC<CloudFindProps> = ({ onNavigateBack }) => {
  const { isDarkMode } = useTheme();
  const { 
    events: realTimeEvents, 
    isLoading: eventsLoading, 
    error: eventsError 
  } = useRealTimeEvents();
  
  // Pull-to-refresh functionality
  const { refreshControl } = usePullToRefresh(async () => {
    // Refresh events data
    console.log('Refreshing events...');
  });
  
  const [activeFilter, setActiveFilter] = useState('all');
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
      case 'all':
        return true;
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

  const renderTallPostCard = ({ item, index, data }: { item: Event; index: number; data: Event[] }) => {
    const typeInfo = getTypeInfo(item.type);
    const isFirst = index === 0;
    const isLast = index === data.length - 1;
    
    return (
      <View style={[
        styles.tallPostCard,
        {
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.98)',
          borderTopLeftRadius: isFirst ? 20 : 0,
          borderTopRightRadius: isFirst ? 20 : 0,
          borderBottomLeftRadius: isLast ? 20 : 0,
          borderBottomRightRadius: isLast ? 20 : 0,
          marginHorizontal: 16,
          marginTop: isFirst ? 8 : 0,
          marginBottom: isLast ? 8 : 4,
        }
      ]}>
        {/* Photo Area - Tall Instagram Style */}
        <View style={[
          styles.photoArea,
          { backgroundColor: `${typeInfo.color}15` }
        ]}>
          {/* Gradient Overlay */}
          <View style={styles.photoGradient} />
          
          {/* AI Match Badge - Top Right */}
          {item.aiMatchScore && item.aiMatchScore > 0.7 && (
            <View style={styles.topRightBadge}>
              <FontAwesome5 name="magic" size={10} color={NuminaColors.purple} />
              <Text style={styles.matchPercentText}>
                {Math.round(item.aiMatchScore * 100)}%
              </Text>
            </View>
          )}
          
          {/* Category Icon - Top Left */}
          <View style={[styles.categoryIcon, { backgroundColor: `${typeInfo.color}30` }]}>
            <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
          </View>
          
          {/* Content Overlay */}
          <View style={styles.photoContent}>
            <Text style={styles.tallPostTitle}>
              {item.title}
            </Text>
            <Text style={styles.tallPostDescription}>
              {item.description}
            </Text>
            
            {/* Meta Row */}
            <View style={styles.tallPostMeta}>
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={12} color="#fff" />
                <Text style={styles.metaChipText}>{item.date}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons name="people-outline" size={12} color="#fff" />
                <Text style={styles.metaChipText}>{item.participants}/{item.maxParticipants}</Text>
              </View>
              {item.location && (
                <View style={styles.metaChip}>
                  <Ionicons name="location-outline" size={12} color="#fff" />
                  <Text style={styles.metaChipText}>{item.location}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {/* Action Bar - Tiny Icons */}
        <View style={styles.actionBar}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.tinyActionButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="heart-outline" size={18} color={NuminaColors.red} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tinyActionButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="chatbubble-outline" size={18} color={NuminaColors.blue} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tinyActionButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="paper-plane-outline" size={18} color={NuminaColors.green} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.rightActions}>
            <TouchableOpacity 
              style={[
                styles.joinActionButton,
                {
                  backgroundColor: item.isJoined 
                    ? `${NuminaColors.green}20` 
                    : `${typeInfo.color}20`,
                }
              ]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <Ionicons 
                name={item.isJoined ? "checkmark-circle" : "add-circle-outline"} 
                size={16} 
                color={item.isJoined ? NuminaColors.green : typeInfo.color} 
              />
              <Text style={[
                styles.joinActionText,
                { color: item.isJoined ? NuminaColors.green : typeInfo.color }
              ]}>
                {item.isJoined ? 'Joined' : 'Join'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tinyActionButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="bookmark-outline" size={18} color={NuminaColors.yellow} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Personalized Insight */}
        {item.personalizedReason && (
          <View style={styles.insightRow}>
            <FontAwesome5 name="lightbulb" size={10} color={NuminaColors.yellow} />
            <Text style={[
              styles.insightText,
              { color: isDarkMode ? '#999' : '#666' }
            ]}>
              {item.personalizedReason}
            </Text>
          </View>
        )}
      </View>
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
    <View style={styles.container}>
      <PageBackground>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />
        
        {/* Compact Fixed Header */}
        <View style={[
          styles.compactHeader,
          {
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }
        ]}>
          <Text style={[
            styles.headerTitle,
            { color: isDarkMode ? '#fff' : '#1a1a1a' }
          ]}>Home</Text>
          
          {/* Mini Search */}
          <TouchableOpacity style={[
            styles.miniSearch,
            {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }
          ]}>
            <Ionicons name="search" size={16} color={isDarkMode ? '#888' : '#999'} />
          </TouchableOpacity>
        </View>

        <SafeAreaView style={styles.feedContainer}>

          {/* Instagram-Style Feed */}
          <FlatList
            data={filteredEvents}
            renderItem={({ item, index }) => renderTallPostCard({ item, index, data: filteredEvents })}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedList}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl {...refreshControl} />
            }
            snapToInterval={undefined}
            decelerationRate="fast"
          />
        </SafeAreaView>
        
        {/* Bottom Nav Pills */}
        <View style={[
          styles.bottomNavPills,
          {
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }
        ]}>
          {FILTER_CATEGORIES.slice(0, 5).map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.navPill,
                {
                  backgroundColor: activeFilter === filter.id
                    ? `${NuminaColors.purple}20`
                    : 'transparent',
                }
              ]}
              onPress={() => handleFilterPress(filter.id)}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={20} 
                color={activeFilter === filter.id ? NuminaColors.purple : (isDarkMode ? '#666' : '#999')} 
              />
              <Text style={[
                styles.navPillText,
                { 
                  color: activeFilter === filter.id 
                    ? NuminaColors.purple 
                    : (isDarkMode ? '#666' : '#999') 
                }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </PageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  miniSearch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContainer: {
    flex: 1,
    paddingTop: 100,
  },
  feedList: {
    paddingBottom: 120,
    paddingHorizontal: 0,
  },
  tallPostCard: {
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  photoArea: {
    height: 480,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topRightBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(138, 43, 226, 0.9)',
    borderRadius: 12,
    gap: 4,
  },
  matchPercentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
  },
  categoryIcon: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContent: {
    padding: 20,
    paddingTop: 40,
  },
  tallPostTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tallPostDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tallPostMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    gap: 4,
  },
  metaChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  tinyActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  joinActionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic',
    fontFamily: 'Inter_400Regular',
    lineHeight: 14,
  },
  bottomNavPills: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navPill: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    gap: 4,
  },
  navPillText: {
    fontSize: 10,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
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
});

export default CloudFind;