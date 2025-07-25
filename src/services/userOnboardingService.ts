import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'numina_onboarding_completed';
const FIRST_LOGIN_KEY = 'numina_first_login';

export class UserOnboardingService {
  static async markSignupCompleted(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${FIRST_LOGIN_KEY}_${userId}`, 'true');
      console.log('✅ User marked as new signup:', userId);
    } catch (error) {
      console.error('❌ Failed to mark signup completed:', error);
    }
  }

  static async isNewUser(userId: string): Promise<boolean> {
    try {
      const isFirstLogin = await AsyncStorage.getItem(`${FIRST_LOGIN_KEY}_${userId}`);
      return isFirstLogin === 'true';
    } catch (error) {
      console.error('❌ Failed to check if new user:', error);
      return false;
    }
  }

  static async markOnboardingCompleted(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${ONBOARDING_COMPLETED_KEY}_${userId}`, 'true');
      await AsyncStorage.removeItem(`${FIRST_LOGIN_KEY}_${userId}`);
      console.log('✅ Onboarding completed for user:', userId);
    } catch (error) {
      console.error('❌ Failed to mark onboarding completed:', error);
    }
  }

  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(`${ONBOARDING_COMPLETED_KEY}_${userId}`);
      return completed === 'true';
    } catch (error) {
      console.error('❌ Failed to check onboarding status:', error);
      return false;
    }
  }

  static async shouldShowExperienceLevel(userId: string): Promise<boolean> {
    const isNew = await this.isNewUser(userId);
    const hasCompletedOnboarding = await this.hasCompletedOnboarding(userId);
    
    return isNew && !hasCompletedOnboarding;
  }
}