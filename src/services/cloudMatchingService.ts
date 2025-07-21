import ApiService from './api';
import AIPersonalityService, { UserEmotionalState } from './aiPersonalityService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CloudAuth from './cloudAuth';

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

const getCacheKeys = (userId: string) => ({
  events: `@cloud_events_${userId}`,
  compatibility: `@compatibility_analysis_${userId}`,
  userMatches: `@user_matches_${userId}`,
});

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

  async getAIMatchedEvents(filterMode?: string): Promise<CloudEvent[]> {
    try {
      const emotionalState = await this.aiPersonalityService.analyzeCurrentEmotionalState();
      
      const response = await ApiService.getCloudEvents({
        filter: filterMode,
        userEmotionalState: emotionalState,
        includeMatching: true,
      });

      if (response.success && response.data) {
        const eventsArray = Array.isArray(response.data) ? response.data : [];
        const transformedEvents = this.transformServerEventsToCloudEvents(eventsArray);
        this.cachedEvents = transformedEvents;
        await this.cacheEvents(transformedEvents);
        return transformedEvents;
      } else {
        // console.log('Cloud events API response:', response);
        const cached = await this.getCachedEvents();
        if (cached.length > 0) {
          return cached;
        }
        // console.log('No cached events found, generating mock data as fallback');
        return this.generateMockEventsWithAI(emotionalState);
      }
    } catch (error) {
      console.error('Error getting AI matched events:', error);
      const cached = await this.getCachedEvents();
      return cached.length > 0 ? cached : this.generateMockEventsWithAI();
    }
  }

  private transformServerEventsToCloudEvents(serverEvents: any[]): CloudEvent[] {
    return serverEvents.map(serverEvent => {
      const event: CloudEvent = {
        id: serverEvent._id || serverEvent.id,
        title: serverEvent.title,
        description: serverEvent.description,
        type: this.mapCategoryToType(serverEvent.category),
        date: new Date(serverEvent.dateTime.start).toLocaleDateString(),
        time: new Date(serverEvent.dateTime.start).toLocaleTimeString(),
        location: serverEvent.location?.city || serverEvent.location?.address || 'Virtual',
        maxParticipants: serverEvent.maxParticipants || 50,
        currentParticipants: serverEvent.participantCount || 0,
        hostId: serverEvent.organizer?._id || serverEvent.organizer,
        hostName: serverEvent.organizer?.profile?.name || 'Event Host',
        aiMatchScore: serverEvent.compatibility?.compatibilityScore || 0,
        emotionalCompatibility: this.mapRecommendationToCompatibility(serverEvent.compatibility?.recommendationStrength),
        personalizedReason: serverEvent.compatibility?.reasons?.join(', ') || 'Good match for your interests',
        moodBoostPotential: serverEvent.compatibility?.moodBoostPrediction || serverEvent.emotionalContext?.moodBoostPotential || 5,
        communityVibe: this.getCommunityVibe(this.mapCategoryToType(serverEvent.category)),
        suggestedConnections: [],
        aiInsights: `${serverEvent.compatibility?.recommendationStrength || 'medium'} compatibility match`,
        growthOpportunity: this.getGrowthOpportunity(serverEvent.category),
      };
      return event;
    });
  }

  private mapCategoryToType(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'wellness': 'fitness_wellness',
      'social': 'food_dining',
      'creative': 'creative_arts',
      'outdoor': 'outdoor_activity',
      'learning': 'tech_learning',
      'fitness': 'fitness_wellness',
      'mindfulness': 'fitness_wellness',
      'community': 'cultural_exploration',
    };
    return categoryMap[category] || 'hobby_interest';
  }

  private mapRecommendationToCompatibility(strength?: string): 'high' | 'medium' | 'low' {
    switch (strength) {
      case 'high': return 'high';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private getGrowthOpportunity(category: string): string {
    const growthMap: { [key: string]: string } = {
      'wellness': 'Develop mindfulness and stress management skills',
      'social': 'Build meaningful connections and social confidence',
      'creative': 'Explore artistic expression and creative thinking',
      'outdoor': 'Challenge yourself physically and connect with nature',
      'learning': 'Expand knowledge and professional skills',
      'fitness': 'Improve physical health and energy levels',
      'mindfulness': 'Cultivate inner peace and emotional balance',
      'community': 'Contribute to your community and find purpose',
    };
    return growthMap[category] || 'Discover new interests and expand your horizons';
  }

  async analyzeEventCompatibility(eventId: string): Promise<CompatibilityAnalysis | null> {
    try {
      const emotionalState = await this.aiPersonalityService.analyzeCurrentEmotionalState();
      
      const response = await ApiService.analyzeEventCompatibility(eventId, emotionalState);
      
      if (response.success && response.data) {
        await this.cacheCompatibilityAnalysis(eventId, response.data);
        return response.data;
      } else {
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

      if (response.success && response.data) {
        // Transform server response to CompatibleUser format
        const users = Array.isArray(response.data) ? response.data : [];
        const compatibleUsers = this.transformServerUsersToCompatibleUsers(users);
        await this.cacheUserMatches(compatibleUsers);
        return compatibleUsers;
      } else {
        // console.log('Compatible users API response:', response);
        // Check cached matches first
        const cached = await this.getCachedUserMatches();
        if (cached.length > 0) {
          return cached;
        }
        // Fallback to mock data only if no cached data
        // console.log('No cached user matches, generating mock data as fallback');
        return this.generateMockCompatibleUsers(emotionalState, options.interests);
      }
    } catch (error) {
      console.error('Error finding compatible users:', error);
      const cached = await this.getCachedUserMatches();
      return cached.length > 0 ? cached : this.generateMockCompatibleUsers();
    }
  }

  // Transform server user compatibility results to CompatibleUser format
  private transformServerUsersToCompatibleUsers(serverUsers: any[]): CompatibleUser[] {
    return serverUsers.map(serverUser => {
      const compatibleUser: CompatibleUser = {
        id: serverUser.userId,
        name: serverUser.userProfile?.name || serverUser.userEmail?.split('@')[0] || 'Anonymous User',
        compatibilityScore: serverUser.compatibility.compatibilityScore || 0,
        sharedInterests: this.extractSharedInterests(serverUser.compatibility),
        emotionalCompatibility: this.formatEmotionalCompatibility(serverUser.compatibility),
        connectionReason: serverUser.compatibility.strengths?.join(', ') || 'Similar interests and values',
      };
      return compatibleUser;
    });
  }

  // Extract shared interests from compatibility analysis
  private extractSharedInterests(compatibility: any): string[] {
    const activities = compatibility.suggestedActivities || [];
    const strengths = compatibility.strengths || [];
    return [...activities, ...strengths].slice(0, 3); // Limit to 3 interests
  }

  // Format emotional compatibility for display
  private formatEmotionalCompatibility(compatibility: any): string {
    const harmony = compatibility.compatibilityFactors?.emotionalHarmony || 5;
    if (harmony >= 8) return 'Excellent emotional harmony';
    if (harmony >= 6) return 'Good emotional balance';
    return 'Complementary emotional styles';
  }

  // Add missing cache methods
  private async getCachedUserMatches(): Promise<CompatibleUser[]> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return [];
      
      const cacheKey = getCacheKeys(userId).userMatches;
      const cached = await AsyncStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached user matches:', error);
      return [];
    }
  }

  private async cacheUserMatches(users: CompatibleUser[]): Promise<void> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return;
      
      const cacheKey = getCacheKeys(userId).userMatches;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(users));
    } catch (error) {
      console.error('Error caching user matches:', error);
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
    if (!Array.isArray(events)) {
      // console.warn('enhanceEventsWithAI: events is not an array, returning empty array');
      return [];
    }
    
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
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) {
        // console.warn('No user ID found, cannot cache events');
        return;
      }
      
      const cacheKeys = getCacheKeys(userId);
      await AsyncStorage.setItem(cacheKeys.events, JSON.stringify({
        data: events,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching events:', error);
    }
  }

  private async getCachedEvents(): Promise<CloudEvent[]> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) {
        return [];
      }
      
      const cacheKeys = getCacheKeys(userId);
      const cached = await AsyncStorage.getItem(cacheKeys.events);
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
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return;
      
      const cacheKeys = getCacheKeys(userId);
      const existing = await AsyncStorage.getItem(cacheKeys.compatibility) || '{}';
      const cache = JSON.parse(existing);
      cache[eventId] = {
        data: analysis,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKeys.compatibility, JSON.stringify(cache));
    } catch (error) {
      console.error('Error caching compatibility analysis:', error);
    }
  }

  private async cacheUserMatches(users: CompatibleUser[]): Promise<void> {
    try {
      const userId = CloudAuth.getInstance().getCurrentUserId();
      if (!userId) return;
      
      const cacheKeys = getCacheKeys(userId);
      await AsyncStorage.setItem(cacheKeys.userMatches, JSON.stringify({
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