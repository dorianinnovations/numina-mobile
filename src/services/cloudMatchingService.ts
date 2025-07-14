import ApiService from './api';
import AIPersonalityService, { UserEmotionalState } from './aiPersonalityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CloudEvent {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  location?: string;
  maxParticipants: number;
  currentParticipants: number;
  hostId: string;
  hostName: string;
  // AI Enhancement Features
  aiMatchScore?: number;
  emotionalCompatibility?: 'high' | 'medium' | 'low';
  personalizedReason?: string;
  moodBoostPotential?: number;
  communityVibe?: string;
  suggestedConnections?: string[];
  aiInsights?: string;
  growthOpportunity?: string;
}

interface CompatibilityAnalysis {
  aiMatchScore: number;
  emotionalCompatibility: 'high' | 'medium' | 'low';
  personalizedReason: string;
  moodBoostPotential: number;
  suggestedConnections: string[];
  communityVibe: string;
  aiInsights: string;
  growthOpportunity: string;
}

interface CompatibleUser {
  id: string;
  name: string;
  compatibilityScore: number;
  sharedInterests: string[];
  emotionalCompatibility: string;
  connectionReason: string;
}

const CACHE_KEYS = {
  events: '@cloud_events',
  compatibility: '@compatibility_analysis',
  userMatches: '@user_matches',
};

class CloudMatchingService {
  private static instance: CloudMatchingService;
  private aiPersonalityService: AIPersonalityService;
  private cachedEvents: CloudEvent[] = [];

  constructor() {
    this.aiPersonalityService = AIPersonalityService.getInstance();
  }

  static getInstance(): CloudMatchingService {
    if (!this.instance) {
      this.instance = new CloudMatchingService();
    }
    return this.instance;
  }

  // Get events with AI-powered matching and personalization
  async getAIMatchedEvents(filterMode?: string): Promise<CloudEvent[]> {
    try {
      const emotionalState = await this.aiPersonalityService.analyzeCurrentEmotionalState();
      
      // Get events from backend with emotional context
      const response = await ApiService.getCloudEvents({
        filter: filterMode,
        userEmotionalState: emotionalState,
        includeMatching: true,
      });

      if (response.success && response.data) {
        const enhancedEvents = await this.enhanceEventsWithAI(response.data, emotionalState);
        this.cachedEvents = enhancedEvents;
        await this.cacheEvents(enhancedEvents);
        return enhancedEvents;
      } else {
        // Fallback to mock data with AI enhancement
        return this.generateMockEventsWithAI(emotionalState);
      }
    } catch (error) {
      console.error('Error getting AI matched events:', error);
      // Return cached events or fallback
      const cached = await this.getCachedEvents();
      return cached.length > 0 ? cached : this.generateMockEventsWithAI();
    }
  }

  // Analyze compatibility for a specific event
  async analyzeEventCompatibility(eventId: string): Promise<CompatibilityAnalysis | null> {
    try {
      const emotionalState = await this.aiPersonalityService.analyzeCurrentEmotionalState();
      
      const response = await ApiService.analyzeEventCompatibility(eventId, emotionalState);
      
      if (response.success && response.data) {
        await this.cacheCompatibilityAnalysis(eventId, response.data);
        return response.data;
      } else {
        // Generate local compatibility analysis
        const event = this.cachedEvents.find(e => e.id === eventId);
        if (event) {
          return this.generateLocalCompatibilityAnalysis(event, emotionalState);
        }
      }
    } catch (error) {
      console.error('Error analyzing event compatibility:', error);
    }
    return null;
  }

  // Find compatible users for events or general matching
  async findCompatibleUsers(options: {
    eventId?: string;
    interests: string[];
    maxResults?: number;
  }): Promise<CompatibleUser[]> {
    try {
      const emotionalState = await this.aiPersonalityService.analyzeCurrentEmotionalState();
      
      const response = await ApiService.findCompatibleUsers({
        ...options,
        emotionalState,
        maxResults: options.maxResults || 10,
      });

      if (response.success && response.data?.users) {
        await this.cacheUserMatches(response.data.users);
        return response.data.users;
      } else {
        // Generate mock compatible users
        return this.generateMockCompatibleUsers(emotionalState, options.interests);
      }
    } catch (error) {
      console.error('Error finding compatible users:', error);
      return this.generateMockCompatibleUsers();
    }
  }

  // Filter events by AI-powered criteria
  filterEventsByAICriteria(events: CloudEvent[], criteria: string): CloudEvent[] {
    switch (criteria) {
      case 'ai-matched':
        return events.filter(event => event.aiMatchScore && event.aiMatchScore > 0.8);
      case 'mood-boost':
        return events.filter(event => event.moodBoostPotential && event.moodBoostPotential > 8.0);
      case 'growth':
        return events.filter(event => event.growthOpportunity && event.growthOpportunity.length > 0);
      case 'connections':
        return events.filter(event => event.suggestedConnections && event.suggestedConnections.length > 0);
      default:
        return events;
    }
  }

  // Create a new event
  async createEvent(eventData: {
    title: string;
    description: string;
    type: string;
    date: string;
    time: string;
    location?: string;
    maxParticipants: number;
    duration?: string;
  }): Promise<CloudEvent | null> {
    try {
      const response = await ApiService.createCloudEvent(eventData);
      
      if (response.success && response.data) {
        // Add to cached events
        this.cachedEvents.unshift(response.data);
        await this.cacheEvents(this.cachedEvents);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
    return null;
  }

  // Join an event
  async joinEvent(eventId: string): Promise<boolean> {
    try {
      const response = await ApiService.joinEvent(eventId);
      
      if (response.success) {
        // Update local cache
        this.cachedEvents = this.cachedEvents.map(event =>
          event.id === eventId
            ? { ...event, currentParticipants: event.currentParticipants + 1 }
            : event
        );
        await this.cacheEvents(this.cachedEvents);
        return true;
      }
    } catch (error) {
      console.error('Error joining event:', error);
    }
    return false;
  }

  // Leave an event
  async leaveEvent(eventId: string): Promise<boolean> {
    try {
      const response = await ApiService.leaveEvent(eventId);
      
      if (response.success) {
        // Update local cache
        this.cachedEvents = this.cachedEvents.map(event =>
          event.id === eventId
            ? { ...event, currentParticipants: Math.max(0, event.currentParticipants - 1) }
            : event
        );
        await this.cacheEvents(this.cachedEvents);
        return true;
      }
    } catch (error) {
      console.error('Error leaving event:', error);
    }
    return false;
  }

  // Get personalized event recommendations
  async getPersonalizedRecommendations(): Promise<{
    insights: any[];
    cloudRecommendations: CloudEvent[];
    personalityAdaptations: any[];
  }> {
    try {
      const emotionalState = await this.aiPersonalityService.analyzeCurrentEmotionalState();
      
      const response = await ApiService.getPersonalizedInsights({
        timeRange: '7d',
        emotionalState,
        includeCloudRecommendations: true,
      });

      if (response.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
    }

    // Fallback to local recommendations
    const events = await this.getAIMatchedEvents();
    return {
      insights: [],
      cloudRecommendations: events.slice(0, 5),
      personalityAdaptations: [],
    };
  }

  // Private helper methods
  private async enhanceEventsWithAI(events: CloudEvent[], emotionalState: UserEmotionalState): Promise<CloudEvent[]> {
    return Promise.all(events.map(async (event) => {
      // Add AI matching scores and insights locally if not provided by backend
      if (!event.aiMatchScore) {
        const compatibility = this.generateLocalCompatibilityAnalysis(event, emotionalState);
        return {
          ...event,
          ...compatibility,
        };
      }
      return event;
    }));
  }

  private generateLocalCompatibilityAnalysis(event: CloudEvent, emotionalState: UserEmotionalState): CompatibilityAnalysis {
    let aiMatchScore = 0.5;
    let personalizedReason = '';
    let moodBoostPotential = 5;
    let emotionalCompatibility: 'high' | 'medium' | 'low' = 'medium';
    
    // Analyze based on event type and user's emotional state
    if (emotionalState.mood === 'anxious' || emotionalState.mood === 'stressed') {
      if (event.type === 'creative_arts' || event.type === 'fitness_wellness') {
        aiMatchScore = 0.9;
        emotionalCompatibility = 'high';
        personalizedReason = `Creative activities help reduce your ${emotionalState.mood} levels by 40%`;
        moodBoostPotential = 8.5;
      }
    } else if (emotionalState.mood === 'happy' || emotionalState.mood === 'excited') {
      if (event.type === 'food_dining' || event.type === 'outdoor_activity') {
        aiMatchScore = 0.92;
        emotionalCompatibility = 'high';
        personalizedReason = `Social activities amplify your positive energy`;
        moodBoostPotential = 9.2;
      }
    }

    // Time-based adjustments
    if (emotionalState.timeOfDay === 'evening' && event.time.includes('PM')) {
      aiMatchScore += 0.1;
      personalizedReason += '. Perfect timing for your evening energy pattern';
    }

    return {
      aiMatchScore: Math.min(0.95, aiMatchScore),
      emotionalCompatibility,
      personalizedReason,
      moodBoostPotential,
      suggestedConnections: ['Alex (fellow enthusiast)', 'Sam (similar interests)'],
      communityVibe: this.getCommunityVibe(event.type),
      aiInsights: `Great match for your ${emotionalState.mood} mood!`,
      growthOpportunity: 'Build confidence through shared experiences',
    };
  }

  private getCommunityVibe(eventType: string): string {
    const vibes: { [key: string]: string } = {
      'food_dining': 'supportive',
      'tech_learning': 'energetic',
      'outdoor_activity': 'adventurous',
      'creative_arts': 'creative',
      'fitness_wellness': 'energetic',
      'professional_networking': 'supportive',
      'hobby_interest': 'calm',
      'cultural_exploration': 'creative',
    };
    return vibes[eventType] || 'supportive';
  }

  private generateMockEventsWithAI(emotionalState?: UserEmotionalState): CloudEvent[] {
    const mockEvents: CloudEvent[] = [
      {
        id: '1',
        title: 'Mindful Art Therapy Session',
        description: 'Express emotions through creative art in a supportive group setting',
        type: 'creative_arts',
        date: 'Today',
        time: '6:00 PM',
        location: 'Wellness Center, Downtown',
        maxParticipants: 12,
        currentParticipants: 8,
        hostId: 'host1',
        hostName: 'Sarah Chen',
        aiMatchScore: 0.94,
        emotionalCompatibility: 'high',
        personalizedReason: 'Art therapy perfectly matches your need for emotional expression',
        moodBoostPotential: 9.1,
        communityVibe: 'supportive',
        suggestedConnections: ['Maya (therapist)', 'Alex (artist)'],
        aiInsights: 'Ideal for processing emotions creatively',
        growthOpportunity: 'Develop emotional intelligence through art',
      },
      {
        id: '2',
        title: 'Tech Meetup: AI & Mental Health',
        description: 'Discuss the intersection of technology and emotional wellness',
        type: 'tech_learning',
        date: 'Tomorrow',
        time: '7:00 PM',
        location: 'Innovation Hub',
        maxParticipants: 25,
        currentParticipants: 18,
        hostId: 'host2',
        hostName: 'David Park',
        aiMatchScore: 0.87,
        emotionalCompatibility: 'high',
        personalizedReason: 'Your interest in personal growth aligns with this topic',
        moodBoostPotential: 8.3,
        communityVibe: 'energetic',
        suggestedConnections: ['Riley (developer)', 'Sam (researcher)'],
        aiInsights: 'Perfect blend of technology and wellness',
        growthOpportunity: 'Learn cutting-edge approaches to mental health',
      },
    ];

    if (emotionalState) {
      // Adjust mock data based on emotional state
      return mockEvents.map(event => ({
        ...event,
        ...this.generateLocalCompatibilityAnalysis(event, emotionalState),
      }));
    }

    return mockEvents;
  }

  private generateMockCompatibleUsers(emotionalState?: UserEmotionalState, interests: string[] = []): CompatibleUser[] {
    return [
      {
        id: 'user1',
        name: 'Alex Rivera',
        compatibilityScore: 0.92,
        sharedInterests: ['mindfulness', 'creativity', 'personal growth'],
        emotionalCompatibility: 'high',
        connectionReason: 'Similar emotional patterns and growth mindset',
      },
      {
        id: 'user2',
        name: 'Sam Chen',
        compatibilityScore: 0.88,
        sharedInterests: ['technology', 'wellness', 'community'],
        emotionalCompatibility: 'high',
        connectionReason: 'Complementary skills and supportive nature',
      },
      {
        id: 'user3',
        name: 'Maya Johnson',
        compatibilityScore: 0.85,
        sharedInterests: ['art', 'meditation', 'helping others'],
        emotionalCompatibility: 'medium',
        connectionReason: 'Shared creative outlets and empathetic communication',
      },
    ];
  }

  // Caching methods
  private async cacheEvents(events: CloudEvent[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.events, JSON.stringify({
        data: events,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching events:', error);
    }
  }

  private async getCachedEvents(): Promise<CloudEvent[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.events);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cached data if less than 30 minutes old
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error getting cached events:', error);
    }
    return [];
  }

  private async cacheCompatibilityAnalysis(eventId: string, analysis: CompatibilityAnalysis): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(CACHE_KEYS.compatibility) || '{}';
      const cache = JSON.parse(existing);
      cache[eventId] = {
        data: analysis,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEYS.compatibility, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching compatibility analysis:', error);
    }
  }

  private async cacheUserMatches(users: CompatibleUser[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.userMatches, JSON.stringify({
        data: users,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching user matches:', error);
    }
  }
}

export default CloudMatchingService;
export type { CloudEvent, CompatibilityAnalysis, CompatibleUser };