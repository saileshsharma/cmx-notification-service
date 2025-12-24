import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationItem } from '../types';

const KEYS = {
  SURVEYOR_ID: 'surveyor_id',
  SURVEYOR_NAME: 'surveyor_name',
  PUSH_TOKEN: 'push_token',
  DEVICE_REGISTERED: 'device_registered',
  NOTIFICATIONS: 'notifications',
};

const MAX_NOTIFICATIONS = 50;

class StorageService {
  // Surveyor ID
  async getSurveyorId(): Promise<number | null> {
    const value = await AsyncStorage.getItem(KEYS.SURVEYOR_ID);
    return value ? parseInt(value, 10) : null;
  }

  async setSurveyorId(id: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.SURVEYOR_ID, id.toString());
  }

  // Surveyor Name
  async getSurveyorName(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SURVEYOR_NAME);
  }

  async setSurveyorName(name: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SURVEYOR_NAME, name);
  }

  // Push Token
  async getPushToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.PUSH_TOKEN);
  }

  async setPushToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.PUSH_TOKEN, token);
  }

  // Device Registration Status
  async isDeviceRegistered(): Promise<boolean> {
    const value = await AsyncStorage.getItem(KEYS.DEVICE_REGISTERED);
    return value === 'true';
  }

  async setDeviceRegistered(registered: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.DEVICE_REGISTERED, registered.toString());
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const json = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  async addNotification(notification: NotificationItem): Promise<NotificationItem[]> {
    const notifications = await this.getNotifications();
    const updated = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS);
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  }

  async clearNotifications(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.NOTIFICATIONS);
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.SURVEYOR_ID,
      KEYS.SURVEYOR_NAME,
      KEYS.PUSH_TOKEN,
      KEYS.DEVICE_REGISTERED,
      KEYS.NOTIFICATIONS,
    ]);
  }
}

export const storageService = new StorageService();
