import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { offlineEmotionStorage } from './offlineEmotionStorage';
import { userDataSync } from './userDataSync';
import SecureStorageService from './secureStorage';

const getBaseApiUrl = () => {
  // Always use production server for simplicity
  return 'https://server-a7od.onrender.com';
};

const createAuthHeaders = async (token?: string) => {
  const authToken = token || await SecureStorageService.getToken();
  // Only log if there's no token
  if (!authToken) {
    console.log('[emotionalAnalyticsAPI] Creating auth headers with token: No token found');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    'Accept': 'application/json'
  };
};

const getAuthToken = async () => {
  const token = await SecureStorageService.getToken();
  // Only log if there's no token
  if (!token) {
    console.log('[emotionalAnalyticsAPI] Retrieved auth token: No token found');
  }
  return token;
};

const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || 
      `API request failed: Server responded with status ${response.status}`
    );
  }
  const data = await response.json();
  // The API always returns { success: boolean, data: any } format
  return data;
};

// Check if online and have valid auth
const canUseOnlineAPI = async () => {
  const netInfo = await NetInfo.fetch();
  const token = await getAuthToken();
  const canUse = netInfo.isConnected && !!token;
  // Only log if there's an issue
  if (!canUse) {
    console.log('[emotionalAnalyticsAPI] Can use online API:', { isConnected: netInfo.isConnected, hasToken: !!token, canUse });
  }
  return canUse;
};

// Helper function to generate weekly report from emotions
const generateWeeklyReportFromEmotions = (emotions: any[]) => {
  const now = new Date();
  const weekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
  const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
  
  const weekEmotions = emotions.filter((emotion: any) => {
    const emotionDate = new Date(emotion.timestamp);
    return emotionDate >= weekStart && emotionDate <= weekEnd;
  });
  
  // Calculate weekly stats
  const totalEmotions = weekEmotions.length;
  const averageIntensity = weekEmotions.length > 0 
    ? weekEmotions.reduce((sum: number, emotion: any) => sum + emotion.intensity, 0) / weekEmotions.length 
    : 0;
  
  // Group by emotion type
  const emotionCounts: { [key: string]: number } = {};
  weekEmotions.forEach((emotion: any) => {
    emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1;
  });
  
  const mostFrequentEmotion = Object.keys(emotionCounts).reduce((a, b) => 
    emotionCounts[a] > emotionCounts[b] ? a : b, '');
  
  return {
    totalEmotions,
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    mostFrequentEmotion,
    emotionBreakdown: emotionCounts,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    emotions: weekEmotions
  };
};

/**
 * EMOTIONAL ANALYTICS API ENDPOINTS
 * Matches backend structure with offline support
 */

// Submit emotional entry - ALWAYS works offline, tries online sync
export const submitEmotionalEntry = async (emotionData: any) => {
  try {
    // ALWAYS store locally first (guarantees it works offline/online)
    const localResult = await offlineEmotionStorage.storeEmotion(emotionData);
    console.log('✅ Emotion stored locally:', localResult.id);

    // Attempt online sync if possible
    const canSync = await canUseOnlineAPI();
    if (!canSync) {
      const token = await getAuthToken();
      console.log('📡 Online sync not possible:', {
        hasToken: !!token,
        reason: !token ? 'Not authenticated - please log in to sync' : 'No network connection'
      });
    }
    if (canSync) {
      try {
        // Validate emotion data before sending
        if (!emotionData.mood || emotionData.mood.trim() === '') {
          throw new Error('Emotion mood is required and cannot be empty');
        }

        const userData = await SecureStorageService.getUserData();
        const userId = userData?.id || 'guest';

        const response = await fetch(`${getBaseApiUrl()}/emotions`, {
          method: 'POST',
          headers: await createAuthHeaders(),
          body: JSON.stringify({
            mood: emotionData.mood.trim(),
            intensity: emotionData.intensity,
            notes: emotionData.notes || '',
            date: emotionData.date
          })
        });
        
        const result = await handleApiResponse(response);
        console.log('✅ Emotion synced online successfully!', {
          mood: emotionData.mood,
          intensity: emotionData.intensity,
          timestamp: new Date().toISOString(),
          syncedToServer: true
        });
        
        // Mark as synced
        await offlineEmotionStorage.markAsSynced(localResult.id);
        
        return { ...result, local: false };
      } catch (onlineError) {
        console.warn('⚠️ Online sync failed, data saved locally:', onlineError);
      }
    }
    
    return { ...localResult, local: true };
  } catch (error) {
    console.error('❌ Failed to submit emotional entry:', error);
    throw error;
  }
};

// Get current session - uses local storage since backend only has POST /emotions
export const getCurrentSession = async (refresh = false) => {
  try {
    // Backend only has POST /emotions for submitting, not GET for retrieving
    // So we'll use local storage for session data
    return await offlineEmotionStorage.getCurrentSession();
  } catch (error) {
    console.error('❌ Failed to get current session:', error);
    // Return empty session on error
    return { recentEmotions: [], totalCount: 0 };
  }
};

// Get day insights
export const getDayInsights = async (day: string) => {
  try {
    // DISABLED: emotion-history endpoint removed from server
    // if (await canUseOnlineAPI()) {
    //   const response = await fetch(`${getBaseApiUrl()}/emotion-history`, {
    //     headers: await createAuthHeaders()
    //   });
    //   const result = await handleApiResponse(response);
    //   // Filter emotions for the specific day
    //   const dayEmotions = (result.data || []).filter((emotion: any) => {
    //     const emotionDate = new Date(emotion.timestamp).toLocaleDateString();
    //     return emotionDate === day;
    //   });
    //   return dayEmotions;
    // }
    
    // Fallback to local generation
    return await offlineEmotionStorage.generateDayInsights(day);
  } catch (error) {
    console.error('❌ Failed to get day insights:', error);
    return await offlineEmotionStorage.generateDayInsights(day);
  }
};

// Get weekly report
export const getWeeklyReport = async () => {
  try {
    // DISABLED: emotion-history endpoint removed from server
    // if (await canUseOnlineAPI()) {
    //   const response = await fetch(`${getBaseApiUrl()}/emotion-history`, {
    //     headers: await createAuthHeaders()
    //   });
    //   const result = await handleApiResponse(response);
    //   // Generate weekly report from emotion history
    //   const emotions = result.data || [];
    //   const weeklyData = generateWeeklyReportFromEmotions(emotions);
    //   return weeklyData;
    // }
    
    // Fallback to local generation
    return await offlineEmotionStorage.generateWeeklyReport();
  } catch (error) {
    console.error('❌ Failed to get weekly report:', error);
    return await offlineEmotionStorage.generateWeeklyReport();
  }
};

// Get session history
export const getSessionHistory = async (limit = 50, offset = 0) => {
  try {
    // DISABLED: emotion-history endpoint removed from server
    // if (await canUseOnlineAPI()) {
    //   const response = await fetch(
    //     `${getBaseApiUrl()}/emotion-history`,
    //     { headers: await createAuthHeaders() }
    //   );
    //   const result = await handleApiResponse(response);
    //   // Apply limit and offset to the response
    //   const emotions = result.data || [];
    //   const paginatedEmotions = emotions.slice(offset, offset + limit);
    //   return {
    //     sessions: paginatedEmotions,
    //     totalCount: emotions.length
    //   };
    // }
    
    return await offlineEmotionStorage.getSessionHistory(limit, offset);
  } catch (error) {
    console.error('❌ Failed to get session history:', error);
    return await offlineEmotionStorage.getSessionHistory(limit, offset);
  }
};

// Sync offline data when back online
export const syncOfflineData = async () => {
  if (!(await canUseOnlineAPI())) {
    return { synced: 0, failed: 0 };
  }
  
  try {
    const userData = await SecureStorageService.getUserData();
    const userId = userData?.id || 'guest';
    
    // Start sync
    const canSync = await userDataSync.startSync(userId);
    if (!canSync) {
      return { synced: 0, failed: 0 };
    }
    
    const unsyncedEmotions = await offlineEmotionStorage.getUnsyncedEmotions();
    
    // Filter out invalid emotions before syncing
    const validEmotions = unsyncedEmotions.filter(emotion => {
      const isValid = emotion.mood && emotion.mood.trim() !== '';
      if (!isValid) {
        console.warn('Filtering out invalid emotion:', emotion.id, 'mood:', emotion.mood);
      }
      return isValid;
    });
    
    // Only log if there's actually data to sync
    if (validEmotions.length > 0) {
      console.log(`[emotionalAnalyticsAPI] Found ${unsyncedEmotions.length} unsynced emotions, ${validEmotions.length} valid`);
    }
    
    let synced = 0;
    let failed = 0;
    
    for (const emotion of validEmotions) {
      try {

        const response = await fetch(`${getBaseApiUrl()}/emotions`, {
          method: 'POST',
          headers: await createAuthHeaders(),
          body: JSON.stringify({
            mood: emotion.mood.trim(),
            intensity: emotion.intensity,
            notes: emotion.notes || '',
            date: emotion.timestamp
          })
        });
        
        await handleApiResponse(response);
        await offlineEmotionStorage.markAsSynced(emotion.id);
        synced++;
      } catch (error) {
        console.error('Failed to sync emotion:', emotion.id, error);
        failed++;
      }
    }
    
    // Update sync status
    await userDataSync.updateSyncStatus({
      lastSync: new Date().toISOString(),
      pending: unsyncedEmotions.length - synced, // Use original count for pending
      failed: failed
    }, userId);
    
    userDataSync.endSync();
    
    return { synced, failed };
  } catch (error) {
    console.error('❌ Sync failed:', error);
    userDataSync.endSync();
    throw error;
  }
};

export const emotionalAnalyticsAPI = {
  submitEmotionalEntry,
  getCurrentSession,
  getDayInsights,
  getWeeklyReport,
  getSessionHistory,
  syncOfflineData
};