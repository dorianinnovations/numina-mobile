import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '../utils/logger';

export type UserChoice = 'cloud' | 'just_for_me' | null;

const USER_CHOICE_KEY = 'numina_user_choice';

export class UserChoiceService {
  private static choice: UserChoice = null;

  static async setUserChoice(choice: UserChoice): Promise<void> {
    try {
      this.choice = choice;
      if (choice) {
        await AsyncStorage.setItem(USER_CHOICE_KEY, choice);
        log.info('User choice saved', { choice }, 'UserChoiceService');
      } else {
        await AsyncStorage.removeItem(USER_CHOICE_KEY);
        log.info('User choice cleared', null, 'UserChoiceService');
      }
    } catch (error) {
      log.error('Failed to save user choice', error, 'UserChoiceService');
    }
  }

  static async getUserChoice(): Promise<UserChoice> {
    try {
      if (this.choice === null) {
        const stored = await AsyncStorage.getItem(USER_CHOICE_KEY);
        this.choice = stored as UserChoice;
      }
      return this.choice;
    } catch (error) {
      log.error('Failed to get user choice', error, 'UserChoiceService');
      return null;
    }
  }

  static async clearUserChoice(): Promise<void> {
    await this.setUserChoice(null);
  }

  static async isCloudUser(): Promise<boolean> {
    const choice = await this.getUserChoice();
    return choice === 'cloud';
  }

  static async isJustForMeUser(): Promise<boolean> {
    const choice = await this.getUserChoice();
    return choice === 'just_for_me';
  }
}