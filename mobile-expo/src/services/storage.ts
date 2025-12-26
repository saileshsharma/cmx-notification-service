import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationItem } from '../types';

const KEYS = {
  SURVEYOR_ID: 'surveyor_id',
  SURVEYOR_NAME: 'surveyor_name',
  SURVEYOR_EMAIL: 'surveyor_email',
  SURVEYOR_PHONE: 'surveyor_phone',
  SURVEYOR_CODE: 'surveyor_code',
  PUSH_TOKEN: 'push_token',
  DEVICE_REGISTERED: 'device_registered',
  NOTIFICATIONS: 'notifications',
  INSPECTION_HISTORY: 'inspection_history',
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

  // Surveyor Email
  async getSurveyorEmail(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SURVEYOR_EMAIL);
  }

  async setSurveyorEmail(email: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SURVEYOR_EMAIL, email);
  }

  // Surveyor Phone
  async getSurveyorPhone(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SURVEYOR_PHONE);
  }

  async setSurveyorPhone(phone: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SURVEYOR_PHONE, phone);
  }

  // Surveyor Code
  async getSurveyorCode(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.SURVEYOR_CODE);
  }

  async setSurveyorCode(code: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.SURVEYOR_CODE, code);
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

  // Inspection History
  async getInspectionHistory(): Promise<any[]> {
    const json = await AsyncStorage.getItem(KEYS.INSPECTION_HISTORY);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  async addInspectionHistory(entry: any): Promise<any[]> {
    const history = await this.getInspectionHistory();
    const updated = [entry, ...history].slice(0, 100);
    await AsyncStorage.setItem(KEYS.INSPECTION_HISTORY, JSON.stringify(updated));
    return updated;
  }

  async clearInspectionHistory(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.INSPECTION_HISTORY);
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.SURVEYOR_ID,
      KEYS.SURVEYOR_NAME,
      KEYS.SURVEYOR_EMAIL,
      KEYS.SURVEYOR_PHONE,
      KEYS.SURVEYOR_CODE,
      KEYS.PUSH_TOKEN,
      KEYS.DEVICE_REGISTERED,
      KEYS.NOTIFICATIONS,
      KEYS.INSPECTION_HISTORY,
    ]);
  }
}

export const storageService = new StorageService();
