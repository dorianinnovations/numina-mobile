import { useState, useEffect, useCallback } from 'react';
import CloudMatchingService, { CloudEvent, CompatibilityAnalysis, CompatibleUser } from '../services/cloudMatchingService';

interface UseCloudMatchingReturn {
  // State
  events: CloudEvent[];
  compatibilityAnalysis: { [eventId: string]: CompatibilityAnalysis };
  compatibleUsers: CompatibleUser[];
  isLoading: boolean;
  
  // Methods
  loadAIMatchedEvents: (filter?: string) => Promise<void>;
  analyzeEventCompatibility: (eventId: string) => Promise<CompatibilityAnalysis | null>;
  findCompatibleUsers: (options: { eventId?: string; interests: string[] }) => Promise<void>;
  createEvent: (eventData: any) => Promise<CloudEvent | null>;
  joinEvent: (eventId: string) => Promise<boolean>;
  leaveEvent: (eventId: string) => Promise<boolean>;
  getPersonalizedRecommendations: () => Promise<any>;
  filterEvents: (criteria: string) => CloudEvent[];
  refreshEvents: () => Promise<void>;
  
  // Error handling
  error: string | null;
  retryLoad: () => Promise<void>;
}

export const useCloudMatching = (userEmotionalState?: any): UseCloudMatchingReturn => {
  const [events, setEvents] = useState<CloudEvent[]>([]);
  const [compatibilityAnalysis, setCompatibilityAnalysis] = useState<{ [eventId: string]: CompatibilityAnalysis }>({});
  const [compatibleUsers, setCompatibleUsers] = useState<CompatibleUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cloudMatchingService = CloudMatchingService.getInstance();

  const loadAIMatchedEvents = useCallback(async (filter?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const matchedEvents = await cloudMatchingService.getAIMatchedEvents(filter);
      setEvents(matchedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to load AI matched events');
      console.error('Error loading AI matched events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeEventCompatibility = useCallback(async (eventId: string): Promise<CompatibilityAnalysis | null> => {
    try {
      const analysis = await cloudMatchingService.analyzeEventCompatibility(eventId);
      if (analysis) {
        setCompatibilityAnalysis(prev => ({
          ...prev,
          [eventId]: analysis,
        }));
      }
      return analysis;
    } catch (err: any) {
      setError(err.message || 'Failed to analyze event compatibility');
      console.error('Error analyzing event compatibility:', err);
      return null;
    }
  }, []);

  const findCompatibleUsers = useCallback(async (options: { 
    eventId?: string; 
    interests: string[];
    maxResults?: number;
  }): Promise<void> => {
    try {
      const users = await cloudMatchingService.findCompatibleUsers(options);
      setCompatibleUsers(users);
    } catch (err: any) {
      setError(err.message || 'Failed to find compatible users');
      console.error('Error finding compatible users:', err);
    }
  }, []);

  const createEvent = useCallback(async (eventData: {
    title: string;
    description: string;
    type: string;
    date: string;
    time: string;
    location?: string;
    maxParticipants: number;
    duration?: string;
  }): Promise<CloudEvent | null> => {
    try {
      const newEvent = await cloudMatchingService.createEvent(eventData);
      if (newEvent) {
        setEvents(prev => [newEvent, ...prev]);
      }
      return newEvent;
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
      console.error('Error creating event:', err);
      return null;
    }
  }, []);

  const joinEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await cloudMatchingService.joinEvent(eventId);
      if (success) {
        setEvents(prev => prev.map(event =>
          event.id === eventId
            ? { ...event, currentParticipants: event.currentParticipants + 1 }
            : event
        ));
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to join event');
      console.error('Error joining event:', err);
      return false;
    }
  }, []);

  const leaveEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await cloudMatchingService.leaveEvent(eventId);
      if (success) {
        setEvents(prev => prev.map(event =>
          event.id === eventId
            ? { ...event, currentParticipants: Math.max(0, event.currentParticipants - 1) }
            : event
        ));
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to leave event');
      console.error('Error leaving event:', err);
      return false;
    }
  }, []);

  const getPersonalizedRecommendations = useCallback(async (): Promise<any> => {
    try {
      return await cloudMatchingService.getPersonalizedRecommendations();
    } catch (err: any) {
      setError(err.message || 'Failed to get personalized recommendations');
      console.error('Error getting personalized recommendations:', err);
      return { insights: [], cloudRecommendations: [], personalityAdaptations: [] };
    }
  }, []);

  const filterEvents = useCallback((criteria: string): CloudEvent[] => {
    return cloudMatchingService.filterEventsByAICriteria(events, criteria);
  }, [events]);

  const refreshEvents = useCallback(async (): Promise<void> => {
    await loadAIMatchedEvents();
  }, [loadAIMatchedEvents]);

  const retryLoad = useCallback(async (): Promise<void> => {
    await loadAIMatchedEvents();
  }, [loadAIMatchedEvents]);

  // Auto-analyze compatibility for high-match events
  useEffect(() => {
    const autoAnalyzeCompatibility = async () => {
      const highMatchEvents = events.filter(event => 
        event.aiMatchScore && event.aiMatchScore > 0.9 && !compatibilityAnalysis[event.id]
      );

      for (const event of highMatchEvents.slice(0, 3)) { // Limit to top 3
        await analyzeEventCompatibility(event.id);
      }
    };

    if (events.length > 0) {
      autoAnalyzeCompatibility();
    }
  }, [events, compatibilityAnalysis, analyzeEventCompatibility]);

  // Initialize with AI-matched events
  useEffect(() => {
    loadAIMatchedEvents('ai-matched');
  }, [loadAIMatchedEvents]);

  return {
    events,
    compatibilityAnalysis,
    compatibleUsers,
    isLoading,
    loadAIMatchedEvents,
    analyzeEventCompatibility,
    findCompatibleUsers,
    createEvent,
    joinEvent,
    leaveEvent,
    getPersonalizedRecommendations,
    filterEvents,
    refreshEvents,
    error,
    retryLoad,
  };
};