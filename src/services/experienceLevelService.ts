import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExperienceLevel = 'private' | 'personal' | 'cloud_find_beta' | null;

const EXPERIENCE_LEVEL_KEY = 'numina_experience_level';

export class ExperienceLevelService {
  static async setExperienceLevel(level: ExperienceLevel): Promise<void> {
    try {
      if (level) {
        await AsyncStorage.setItem(EXPERIENCE_LEVEL_KEY, level);
        console.log('✅ Experience level saved:', level);
      } else {
        await AsyncStorage.removeItem(EXPERIENCE_LEVEL_KEY);
        console.log('✅ Experience level cleared');
      }
    } catch (error) {
      console.error('❌ Failed to save experience level:', error);
    }
  }

  static async getExperienceLevel(): Promise<ExperienceLevel> {
    try {
      const level = await AsyncStorage.getItem(EXPERIENCE_LEVEL_KEY);
      return level as ExperienceLevel;
    } catch (error) {
      console.error('❌ Failed to get experience level:', error);
      return null;
    }
  }

  static async hasSetExperienceLevel(): Promise<boolean> {
    const level = await this.getExperienceLevel();
    return level !== null;
  }

  static async clearExperienceLevel(): Promise<void> {
    await this.setExperienceLevel(null);
  }

  static getExperienceLevelConfig(level: ExperienceLevel) {
    switch (level) {
      case 'private':
        return {
          name: 'Private Mode',
          dataCollection: false,
          cloudFeatures: false,
          analytics: false,
          socialMatching: false,
          offlineOnly: true,
          specialToSProtection: true,
        };
      
      case 'personal':
        return {
          name: 'Personal Growth',
          dataCollection: true,
          cloudFeatures: false,
          analytics: true,
          socialMatching: false,
          offlineOnly: false,
          specialToSProtection: false,
        };
      
      case 'cloud_find_beta':
        return {
          name: 'Cloud Find Beta',
          dataCollection: true,
          cloudFeatures: true,
          analytics: true,
          socialMatching: true,
          offlineOnly: false,
          specialToSProtection: false,
        };
      
      default:
        return {
          name: 'Not Set',
          dataCollection: false,
          cloudFeatures: false,
          analytics: false,
          socialMatching: false,
          offlineOnly: true,
          specialToSProtection: true,
        };
    }
  }
}