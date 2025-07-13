import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmotionLog {
  mood: string;
  intensity: number;
  notes: string;
  timestamp: string;
  date: string;
  time: string;
  dayOfWeek: number;
  id: string;
  synced?: boolean;
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

class OfflineEmotionStorage {
  private static getStorageKeys(userId?: string) {
    const currentUserId = userId || 'guest';
    return {
      EMOTIONS: `userLoggedEmotions_${currentUserId}`,
      LAST_EMOTION: `lastEmotionLogged_${currentUserId}`,
      SYNC_QUEUE: `emotionSyncQueue_${currentUserId}`,
    };
  }

  static async storeEmotion(emotionData: any, userId?: string): Promise<EmotionLog> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUserId = userId || (userData ? JSON.parse(userData).id : 'guest');
      const keys = this.getStorageKeys(currentUserId);

      const emotionLog: EmotionLog = {
        mood: emotionData.mood,
        intensity: emotionData.intensity,
        notes: emotionData.notes || '',
        timestamp: new Date().toISOString(),
        date: new Date().toDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dayOfWeek: new Date().getDay(),
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
      };

      // Get existing emotions
      const existing = await AsyncStorage.getItem(keys.EMOTIONS);
      const emotions: EmotionLog[] = existing ? JSON.parse(existing) : [];
      
      // Add new emotion
      emotions.unshift(emotionLog);
      
      // Keep only last 1000 emotions for performance
      const limitedEmotions = emotions.slice(0, 1000);
      
      // Save updated emotions
      await AsyncStorage.setItem(keys.EMOTIONS, JSON.stringify(limitedEmotions));
      await AsyncStorage.setItem(keys.LAST_EMOTION, JSON.stringify(emotionLog));
      
      // Add to sync queue
      await this.addToSyncQueue(emotionLog, currentUserId);
      
      return emotionLog;
    } catch (error) {
      console.error('Failed to store emotion:', error);
      throw error;
    }
  }

  static async markAsSynced(emotionId: string, userId?: string): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUserId = userId || (userData ? JSON.parse(userData).id : 'guest');
      const keys = this.getStorageKeys(currentUserId);

      // Update in main storage
      const existing = await AsyncStorage.getItem(keys.EMOTIONS);
      if (existing) {
        const emotions: EmotionLog[] = JSON.parse(existing);
        const index = emotions.findIndex(e => e.id === emotionId);
        if (index !== -1) {
          emotions[index].synced = true;
          await AsyncStorage.setItem(keys.EMOTIONS, JSON.stringify(emotions));
        }
      }

      // Remove from sync queue
      await this.removeFromSyncQueue(emotionId, currentUserId);
    } catch (error) {
      console.error('Failed to mark as synced:', error);
    }
  }

  static async getUnsyncedEmotions(userId?: string): Promise<EmotionLog[]> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUserId = userId || (userData ? JSON.parse(userData).id : 'guest');
      const keys = this.getStorageKeys(currentUserId);

      const queue = await AsyncStorage.getItem(keys.SYNC_QUEUE);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Failed to get unsynced emotions:', error);
      return [];
    }
  }

  static async getCurrentSession(userId?: string): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUserId = userId || (userData ? JSON.parse(userData).id : 'guest');
      const keys = this.getStorageKeys(currentUserId);

      const emotions = await AsyncStorage.getItem(keys.EMOTIONS);
      if (!emotions) return { recentEmotions: [] };

      const emotionList: EmotionLog[] = JSON.parse(emotions);
      return { recentEmotions: emotionList.slice(0, 5) };
    } catch (error) {
      console.error('Failed to get current session:', error);
      return { recentEmotions: [] };
    }
  }

  static async generateDayInsights(day: string, userId?: string): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUserId = userId || (userData ? JSON.parse(userData).id : 'guest');
      const keys = this.getStorageKeys(currentUserId);

      const emotions = await AsyncStorage.getItem(keys.EMOTIONS);
      if (!emotions) return { insights: [], total: 0 };

      const emotionList: EmotionLog[] = JSON.parse(emotions);
      const dayEmotions = emotionList.filter(e => {
        const emotionDate = new Date(e.timestamp);
        return emotionDate.toLocaleDateString() === day;
      });

      return {
        insights: dayEmotions,
        total: dayEmotions.length,
      };
    } catch (error) {
      console.error('Failed to generate day insights:', error);
      return { insights: [], total: 0 };
    }
  }

  static async generateWeeklyReport(userId?: string): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUserId = userId || (userData ? JSON.parse(userData).id : 'guest');
      const keys = this.getStorageKeys(currentUserId);

      const emotions = await AsyncStorage.getItem(keys.EMOTIONS);
      if (!emotions) return null;

      const emotionList: EmotionLog[] = JSON.parse(emotions);
      
      // Filter last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const weeklyEmotions = emotionList.filter(e => 
        new Date(e.timestamp) >= sevenDaysAgo
      );

      if (weeklyEmotions.length === 0) return null;

      // Calculate mood distribution
      const moodCounts: { [key: string]: number } = {};
      let totalIntensity = 0;

      weeklyEmotions.forEach(emotion => {
        moodCounts[emotion.mood] = (moodCounts[emotion.mood] || 0) + 1;
        totalIntensity += emotion.intensity;
      });

      const totalEmotions = weeklyEmotions.length;
      const moodDistribution = Object.entries(moodCounts)
        .map(([mood, count]) => ({
          mood,
          count,
          percentage: Math.round((count / totalEmotions) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      const mostFrequentEmotion = moodDistribution[0]?.mood || 'N/A';
      const avgIntensity = totalEmotions > 0 ? totalIntensity / totalEmotions : 0;

      return {
        report: {
          weeklyStats: {
            totalEmotions,
            mostFrequentEmotion,
            avgIntensity
          }
        },
        moodDistribution,
        insights: this.generateInsights(weeklyEmotions, moodDistribution)
      };
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      return null;
    }
  }

  static async getSessionHistory(limit: number, offset: number, userId?: string): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentUserId = userId || (userData ? JSON.parse(userData).id : 'guest');
      const keys = this.getStorageKeys(currentUserId);

      const emotions = await AsyncStorage.getItem(keys.EMOTIONS);
      if (!emotions) return { sessions: [], total: 0 };

      const emotionList: EmotionLog[] = JSON.parse(emotions);
      const sessions = emotionList.slice(offset, offset + limit);

      return {
        sessions,
        total: emotionList.length,
      };
    } catch (error) {
      console.error('Failed to get session history:', error);
      return { sessions: [], total: 0 };
    }
  }

  private static async addToSyncQueue(emotion: EmotionLog, userId: string): Promise<void> {
    try {
      const keys = this.getStorageKeys(userId);
      const queue = await AsyncStorage.getItem(keys.SYNC_QUEUE);
      const syncQueue: EmotionLog[] = queue ? JSON.parse(queue) : [];
      
      syncQueue.push(emotion);
      
      await AsyncStorage.setItem(keys.SYNC_QUEUE, JSON.stringify(syncQueue));
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }

  private static async removeFromSyncQueue(emotionId: string, userId: string): Promise<void> {
    try {
      const keys = this.getStorageKeys(userId);
      const queue = await AsyncStorage.getItem(keys.SYNC_QUEUE);
      if (!queue) return;

      const syncQueue: EmotionLog[] = JSON.parse(queue);
      const filtered = syncQueue.filter(e => e.id !== emotionId);
      
      await AsyncStorage.setItem(keys.SYNC_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from sync queue:', error);
    }
  }

  private static generateInsights(emotions: EmotionLog[], distribution: MoodDistribution[]): any[] {
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
  }

  // Clear user data on logout
  static async clearUserData(userId: string): Promise<void> {
    try {
      const keys = this.getStorageKeys(userId);
      await Promise.all([
        AsyncStorage.removeItem(keys.EMOTIONS),
        AsyncStorage.removeItem(keys.LAST_EMOTION),
        AsyncStorage.removeItem(keys.SYNC_QUEUE),
      ]);
    } catch (error) {
      console.error('Clear user data error:', error);
    }
  }
}

export const offlineEmotionStorage = OfflineEmotionStorage;