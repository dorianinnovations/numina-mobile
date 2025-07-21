import { useState, useEffect, useCallback, useRef } from 'react';
import RealTimeSyncService, { RealTimeEvent, EventComment } from '../services/realTimeSync';
import { useAuth } from '../contexts/SimpleAuthContext';
import * as Haptics from 'expo-haptics';
import { log } from '../utils/logger';

export interface UseRealTimeEventsReturn {
  events: RealTimeEvent[];
  comments: { [eventId: string]: EventComment[] };
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  // Event operations
  createEvent: (eventData: any) => Promise<RealTimeEvent>;
  updateEvent: (eventId: string, updates: Partial<RealTimeEvent>) => Promise<RealTimeEvent | null>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  joinEvent: (eventId: string) => Promise<boolean>;
  leaveEvent: (eventId: string) => Promise<boolean>;
  addComment: (eventId: string, message: string) => Promise<EventComment>;
  // Utility functions
  getEvent: (eventId: string) => RealTimeEvent | null;
  refreshEvents: () => Promise<void>;
  clearError: () => void;
}

export const useRealTimeEvents = (): UseRealTimeEventsReturn => {
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [comments, setComments] = useState<{ [eventId: string]: EventComment[] }>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  
  const { userData } = useAuth();
  const syncService = RealTimeSyncService.getInstance();

  // Initialize service and event listeners
  useEffect(() => {
    if (userData?.id) {
      syncService.initialize(userData.id);
      
      // Set up event listeners
      const handleConnected = () => {
        setIsConnected(true);
        setError(null);
        // Haptic feedback for connection
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      };

      const handleDisconnected = () => {
        setIsConnected(false);
        setError('Connection lost. Attempting to reconnect...');
      };

      const handleError = (err: any) => {
        setError(err.message || 'Connection error');
        setIsConnected(false);
      };

      const handleEventCreated = (event: RealTimeEvent) => {
        setEvents(prev => {
          const exists = prev.find(e => e.id === event.id);
          if (exists) return prev;
          
          // Haptic feedback for new event
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return [event, ...prev];
        });
      };

      const handleEventUpdated = (event: RealTimeEvent) => {
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
      };

      const handleEventDeleted = (eventId: string) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setComments(prev => {
          const newComments = { ...prev };
          delete newComments[eventId];
          return newComments;
        });
      };

      const handleUserJoined = (data: { eventId: string; userId: string; userName: string }) => {
        setEvents(prev => prev.map(event => {
          if (event.id === data.eventId && !event.participants.includes(data.userId)) {
            // Haptic feedback for user join
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return {
              ...event,
              participants: [...event.participants, data.userId],
              currentParticipants: event.currentParticipants + 1,
            };
          }
          return event;
        }));
      };

      const handleUserLeft = (data: { eventId: string; userId: string }) => {
        setEvents(prev => prev.map(event => {
          if (event.id === data.eventId) {
            return {
              ...event,
              participants: event.participants.filter(id => id !== data.userId),
              currentParticipants: Math.max(0, event.currentParticipants - 1),
            };
          }
          return event;
        }));
      };

      const handleCommentAdded = (comment: EventComment) => {
        setComments(prev => ({
          ...prev,
          [comment.eventId]: [...(prev[comment.eventId] || []), comment],
        }));
        
        // Haptic feedback for new comment
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      };

      const handleSyncResponse = (data: { success: boolean; eventId: string; error?: string }) => {
        if (!data.success && data.error) {
          setError(`Sync failed: ${data.error}`);
        }
        
        // Update event sync status
        setEvents(prev => prev.map(event => {
          if (event.id === data.eventId) {
            return {
              ...event,
              syncStatus: data.success ? 'synced' : 'failed',
            };
          }
          return event;
        }));
      };

      // Register event listeners
      syncService.on('connected', handleConnected);
      syncService.on('disconnected', handleDisconnected);
      syncService.on('error', handleError);
      syncService.on('eventCreated', handleEventCreated);
      syncService.on('eventUpdated', handleEventUpdated);
      syncService.on('eventDeleted', handleEventDeleted);
      syncService.on('userJoined', handleUserJoined);
      syncService.on('userLeft', handleUserLeft);
      syncService.on('commentAdded', handleCommentAdded);
      syncService.on('syncResponse', handleSyncResponse);

      // Load initial data
      loadInitialData();

      // Cleanup listeners on unmount
      return () => {
        syncService.off('connected', handleConnected);
        syncService.off('disconnected', handleDisconnected);
        syncService.off('error', handleError);
        syncService.off('eventCreated', handleEventCreated);
        syncService.off('eventUpdated', handleEventUpdated);
        syncService.off('eventDeleted', handleEventDeleted);
        syncService.off('userJoined', handleUserJoined);
        syncService.off('userLeft', handleUserLeft);
        syncService.off('commentAdded', handleCommentAdded);
        syncService.off('syncResponse', handleSyncResponse);
      };
    }
  }, [userData?.id]);

  // Load initial data from cache and server
  const loadInitialData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    try {
      // Load from cache first
      const cachedEvents = syncService.getAllEvents();
      if (isMountedRef.current) {
        setEvents(cachedEvents);
      }
      
      // Load comments for each event
      const allComments: { [eventId: string]: EventComment[] } = {};
      cachedEvents.forEach(event => {
        allComments[event.id] = syncService.getEventComments(event.id);
      });
      
      if (isMountedRef.current) {
        setComments(allComments);
        setIsConnected(syncService.isConnectedToServer());
      }
    } catch (error) {
      log.error('Error loading initial data', error, 'useRealTimeEvents');
      if (isMountedRef.current) {
        setError('Failed to load events');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Event operations
  const createEvent = useCallback(async (eventData: any): Promise<RealTimeEvent> => {
    try {
      const event = await syncService.createEvent(eventData);
      setEvents(prev => [event, ...prev]);
      
      // Haptic feedback for event creation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      return event;
    } catch (error) {
      // console.error('Error creating event:', error);
      setError('Failed to create event');
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<RealTimeEvent>): Promise<RealTimeEvent | null> => {
    try {
      const updatedEvent = await syncService.updateEvent(eventId, updates);
      if (updatedEvent) {
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      }
      return updatedEvent;
    } catch (error) {
      // console.error('Error updating event:', error);
      setError('Failed to update event');
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await syncService.deleteEvent(eventId);
      if (success) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setComments(prev => {
          const newComments = { ...prev };
          delete newComments[eventId];
          return newComments;
        });
      }
      return success;
    } catch (error) {
      // console.error('Error deleting event:', error);
      setError('Failed to delete event');
      throw error;
    }
  }, []);

  const joinEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await syncService.joinEvent(eventId);
      if (success) {
        // Optimistically update UI
        setEvents(prev => prev.map(event => {
          if (event.id === eventId && !event.participants.includes(userData?.id || '')) {
            return {
              ...event,
              participants: [...event.participants, userData?.id || ''],
              currentParticipants: event.currentParticipants + 1,
            };
          }
          return event;
        }));
        
        // Haptic feedback for joining
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return success;
    } catch (error) {
      // console.error('Error joining event:', error);
      setError('Failed to join event');
      throw error;
    }
  }, [userData?.id]);

  const leaveEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      const success = await syncService.leaveEvent(eventId);
      if (success) {
        // Optimistically update UI
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return {
              ...event,
              participants: event.participants.filter(id => id !== userData?.id),
              currentParticipants: Math.max(0, event.currentParticipants - 1),
            };
          }
          return event;
        }));
        
        // Haptic feedback for leaving
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      return success;
    } catch (error) {
      // console.error('Error leaving event:', error);
      setError('Failed to leave event');
      throw error;
    }
  }, [userData?.id]);

  const addComment = useCallback(async (eventId: string, message: string): Promise<EventComment> => {
    try {
      const comment = await syncService.addComment(eventId, message);
      setComments(prev => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), comment],
      }));
      
      // Haptic feedback for comment
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      return comment;
    } catch (error) {
      // console.error('Error adding comment:', error);
      setError('Failed to add comment');
      throw error;
    }
  }, []);

  // Utility functions
  const getEvent = useCallback((eventId: string): RealTimeEvent | null => {
    return events.find(e => e.id === eventId) || null;
  }, [events]);

  const refreshEvents = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    events,
    comments,
    isConnected,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    addComment,
    getEvent,
    refreshEvents,
    clearError,
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
};