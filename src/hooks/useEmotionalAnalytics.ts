import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { emotionalAnalyticsAPI } from '../services/emotionalAnalyticsAPI';
import { userDataSync } from '../services/userDataSync';
import { offlineEmotionStorage } from '../services/offlineEmotionStorage';
import SecureAuthManager from '../services/secureAuthManager';

interface EmotionData {
  mood: string;
  intensity: number;
  notes: string;
  date: string;
}

interface EmotionLog {
  mood: string;
  intensity: number;
  notes: string;
  timestamp: string;
  date: string;
  time: string;
  dayOfWeek: number;
  id: number;
}

interface WeeklyStats {
  totalEmotions: number;
  mostFrequentEmotion: string;
  avgIntensity: number;
}

interface MoodDistribution {
  mood: string;
  count: number;
  percentage: number;
}

interface WeeklyReport {
  report: {
    weeklyStats: WeeklyStats;
  };
  moodDistribution: MoodDistribution[];
  insights: any[];
}

export const useEmotionalAnalytics = () => {
  // Set up auto-sync on mount
  useEffect(() => {
    userDataSync.setupAutoSync();
  }, []);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [dayInsights, setDayInsights] = useState<any>({});
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [sessionHistory, setSessionHistory] = useState<EmotionLog[]>([]);
  const [userLoggedEmotions, setUserLoggedEmotions] = useState<EmotionLog[]>([]);
  
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load user logged emotions from AsyncStorage on mount
  useEffect(() => {
    loadUserEmotions();
  }, []);

  const loadUserEmotions = async () => {
    try {
      // First try to fetch from API if online
      const netInfo = await NetInfo.fetch();
      const token = SecureAuthManager.getInstance().getCurrentToken();
      console.log('[useEmotionalAnalytics] Loading emotions, token available:', !!token);
      
      if (netInfo.isConnected && token) {
        try {
          // Fetch weekly report from API
          const report = await emotionalAnalyticsAPI.getWeeklyReport();
          if (report) {
            setWeeklyReport(report);
          }
          
          // Fetch session history
          const history = await emotionalAnalyticsAPI.getSessionHistory(100, 0);
          if (history && history.sessions) {
            setUserLoggedEmotions(history.sessions);
          }
          
          // Sync any offline data
          await emotionalAnalyticsAPI.syncOfflineData();
        } catch (apiError) {
          console.warn('API fetch failed, falling back to local:', apiError);
        }
      }
      
      // Always load local data as backup
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : 'guest';
      const storageKey = `userLoggedEmotions_${userId}`;
      
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const emotions = JSON.parse(stored);
        setUserLoggedEmotions(emotions);
        generateWeeklyReportFromUserData(emotions);
      }
    } catch (err) {
      console.error('Failed to load user emotions:', err);
    }
  };

  const generateWeeklyReportFromUserData = (emotions: EmotionLog[]) => {
    if (emotions.length === 0) {
      setWeeklyReport(null);
      return;
    }

    // Calculate mood distribution
    const moodCounts: { [key: string]: number } = {};
    let totalIntensity = 0;

    emotions.forEach(emotion => {
      moodCounts[emotion.mood] = (moodCounts[emotion.mood] || 0) + 1;
      totalIntensity += emotion.intensity;
    });

    const totalEmotions = emotions.length;
    const moodDistribution = Object.entries(moodCounts)
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / totalEmotions) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const mostFrequentEmotion = moodDistribution[0]?.mood || 'N/A';
    const avgIntensity = totalEmotions > 0 ? totalIntensity / totalEmotions : 0;

    setWeeklyReport({
      report: {
        weeklyStats: {
          totalEmotions,
          mostFrequentEmotion,
          avgIntensity
        }
      },
      moodDistribution,
      insights: generateInsights(emotions, moodDistribution)
    });
  };

  const generateInsights = (emotions: EmotionLog[], distribution: MoodDistribution[]) => {
    const insights = [];

    // Most frequent emotion insight
    if (distribution.length > 0 && distribution[0].percentage > 30) {
      insights.push({
        title: 'Dominant Emotion Pattern',
        description: `${distribution[0].mood} has been your most frequent emotion (${distribution[0].percentage}% of the time)`,
        trend: 'positive',
        confidence: 'high',
        dataPoints: distribution[0].count
      });
    }

    // Intensity pattern
    const avgIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length;
    if (avgIntensity > 7) {
      insights.push({
        title: 'High Emotional Intensity',
        description: 'Your emotions have been particularly intense this week. Consider mindfulness practices.',
        trend: 'neutral',
        confidence: 'medium',
        impact: 'high'
      });
    }

    // Variety insight
    const uniqueEmotions = new Set(emotions.map(e => e.mood)).size;
    if (uniqueEmotions >= 4) {
      insights.push({
        title: 'Emotional Diversity',
        description: 'You\'ve experienced a wide range of emotions, which shows healthy emotional awareness.',
        trend: 'positive',
        confidence: 'high',
        impact: 'medium'
      });
    }

    return insights;
  };

  const fetchDayInsights = useCallback(async (day: string) => {
    setIsLoadingInsights(true);
    setInsightsError(null);
    
    try {
      // Try API first
      const insights = await emotionalAnalyticsAPI.getDayInsights(day);
      if (insights) {
        setDayInsights((prev: any) => ({
          ...prev,
          [day]: insights
        }));
      } else {
        // Fallback to local data
        const dayEmotions = userLoggedEmotions.filter(emotion => {
          const emotionDate = new Date(emotion.timestamp);
          return emotionDate.toLocaleDateString() === day;
        });
        
        setDayInsights((prev: any) => ({
          ...prev,
          [day]: dayEmotions
        }));
      }
    } catch (err) {
      setInsightsError('Failed to fetch day insights');
    } finally {
      setIsLoadingInsights(false);
    }
  }, [userLoggedEmotions]);

  const fetchWeeklyReport = useCallback(async () => {
    setIsLoadingReport(true);
    setReportError(null);
    
    try {
      // Try to fetch from API first
      const report = await emotionalAnalyticsAPI.getWeeklyReport();
      if (report) {
        setWeeklyReport(report);
      } else {
        // Fallback to local generation
        generateWeeklyReportFromUserData(userLoggedEmotions);
      }
    } catch (err) {
      setReportError('Failed to generate weekly report');
      // Fallback to local generation
      generateWeeklyReportFromUserData(userLoggedEmotions);
    } finally {
      setIsLoadingReport(false);
    }
  }, [userLoggedEmotions]);

  const fetchCurrentSession = useCallback(async (forceRefresh?: boolean) => {
    setIsLoadingSession(true);
    setSessionError(null);
    
    try {
      // Try API first
      const session = await emotionalAnalyticsAPI.getCurrentSession(forceRefresh);
      if (session) {
        setCurrentSession(session);
      } else {
        // Fallback to local data
        const recentEmotions = userLoggedEmotions.slice(0, 5);
        setCurrentSession({ recentEmotions });
      }
    } catch (err) {
      setSessionError('Failed to fetch current session');
      // Fallback to local data
      const recentEmotions = userLoggedEmotions.slice(0, 5);
      setCurrentSession({ recentEmotions });
    } finally {
      setIsLoadingSession(false);
    }
  }, [userLoggedEmotions]);

  const submitEmotionalEntry = useCallback(async (emotionData: EmotionData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use the API which handles both offline and online storage
      const result = await emotionalAnalyticsAPI.submitEmotionalEntry(emotionData);
      
      // Create local emotion log for immediate UI update
      const emotionLog: EmotionLog = {
        mood: emotionData.mood,
        intensity: emotionData.intensity,
        notes: emotionData.notes,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dayOfWeek: new Date().getDay(),
        id: Date.now()
      };
      
      // Update local state immediately for UI responsiveness
      const updatedEmotions = [emotionLog, ...userLoggedEmotions];
      setUserLoggedEmotions(updatedEmotions);
      
      // Save to user-specific storage key
      const userData = await AsyncStorage.getItem('userData');
      const userId = userData ? JSON.parse(userData).id : 'guest';
      const storageKey = `lastEmotionLogged_${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(emotionLog));
      
      // Update weekly report
      generateWeeklyReportFromUserData(updatedEmotions);
      
      // If online sync was successful, update sync status
      if (!result.local) {
        console.log('🌐 Emotion successfully synced to server!', {
          mood: emotionData.mood,
          intensity: emotionData.intensity,
          syncStatus: 'online',
          userId: userId
        });
      } else {
        console.log('💾 Emotion saved locally (will sync when online)', {
          mood: emotionData.mood,
          intensity: emotionData.intensity,
          syncStatus: 'offline',
          userId: userId
        });
      }
      
      return { success: true };
    } catch (err) {
      setError('Failed to submit emotional entry');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [userLoggedEmotions]);

  const clearErrors = useCallback(() => {
    setSessionError(null);
    setInsightsError(null);
    setReportError(null);
    setError(null);
  }, []);

  return {
    currentSession,
    dayInsights,
    weeklyReport,
    sessionHistory,
    userLoggedEmotions,
    isLoadingSession,
    isLoadingInsights,
    isLoadingReport,
    isSubmitting,
    sessionError,
    insightsError,
    reportError,
    error,
    fetchDayInsights,
    fetchWeeklyReport,
    fetchCurrentSession,
    submitEmotionalEntry,
    clearErrors
  };
};