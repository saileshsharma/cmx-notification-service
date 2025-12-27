/**
 * Storage Service - Enhanced with:
 * - Secure storage for sensitive data (expo-secure-store)
 * - Regular AsyncStorage for non-sensitive data
 * - Migration utilities
 * - Type-safe storage operations
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { NotificationItem } from '../types';
import { logger } from '../utils/logger';

// Storage keys - organized by sensitivity
const KEYS = {
  // Sensitive data (stored in SecureStore)
  AUTH_TOKEN: 'auth_token',
  SURVEYOR_ID: 'surveyor_id',
  SURVEYOR_EMAIL: 'surveyor_email',
  SURVEYOR_PHONE: 'surveyor_phone',
  SURVEYOR_CODE: 'surveyor_code',

  // Non-sensitive data (stored in AsyncStorage)
  SURVEYOR_NAME: 'surveyor_name',
  PUSH_TOKEN: 'push_token',
  DEVICE_REGISTERED: 'device_registered',
  NOTIFICATIONS: 'notifications',
  INSPECTION_HISTORY: 'inspection_history',
  APP_SETTINGS: 'app_settings',
  LAST_SYNC_TIME: 'last_sync_time',
};

// Sensitive keys that use SecureStore
const SENSITIVE_KEYS = new Set([
  KEYS.AUTH_TOKEN,
  KEYS.SURVEYOR_ID,
  KEYS.SURVEYOR_EMAIL,
  KEYS.SURVEYOR_PHONE,
  KEYS.SURVEYOR_CODE,
]);

const MAX_NOTIFICATIONS = 50;
const MAX_INSPECTION_HISTORY = 100;

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  locationTrackingMode: 'high' | 'balanced' | 'low';
  debugMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  notificationsEnabled: true,
  locationTrackingMode: 'balanced',
  debugMode: false,
};

class StorageService {
  private isSecureStoreAvailable: boolean = true;

  constructor() {
    this.checkSecureStoreAvailability();
  }

  private async checkSecureStoreAvailability(): Promise<void> {
    try {
      const available = await SecureStore.isAvailableAsync();
      this.isSecureStoreAvailable = available;
      if (!available) {
        logger.warn('[Storage] SecureStore not available, falling back to AsyncStorage');
      }
    } catch (error) {
      this.isSecureStoreAvailable = false;
      logger.warn('[Storage] Failed to check SecureStore availability');
    }
  }

  // ==================== Core Storage Methods ====================

  /**
   * Get a value from storage (automatically uses SecureStore for sensitive keys)
   */
  private async getValue(key: string): Promise<string | null> {
    try {
      if (SENSITIVE_KEYS.has(key) && this.isSecureStoreAvailable) {
        return await SecureStore.getItemAsync(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      logger.error(`[Storage] Failed to get ${key}`, error);
      return null;
    }
  }

  /**
   * Set a value in storage (automatically uses SecureStore for sensitive keys)
   */
  private async setValue(key: string, value: string): Promise<void> {
    try {
      if (SENSITIVE_KEYS.has(key) && this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      logger.error(`[Storage] Failed to set ${key}`, error);
      throw error;
    }
  }

  /**
   * Remove a value from storage
   */
  private async removeValue(key: string): Promise<void> {
    try {
      if (SENSITIVE_KEYS.has(key) && this.isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      logger.error(`[Storage] Failed to remove ${key}`, error);
    }
  }

  // ==================== Auth Token ====================

  async getAuthToken(): Promise<string | null> {
    return this.getValue(KEYS.AUTH_TOKEN);
  }

  async setAuthToken(token: string): Promise<void> {
    await this.setValue(KEYS.AUTH_TOKEN, token);
  }

  async clearAuthToken(): Promise<void> {
    await this.removeValue(KEYS.AUTH_TOKEN);
  }

  // ==================== Surveyor Data ====================

  async getSurveyorId(): Promise<number | null> {
    const value = await this.getValue(KEYS.SURVEYOR_ID);
    return value ? parseInt(value, 10) : null;
  }

  async setSurveyorId(id: number): Promise<void> {
    await this.setValue(KEYS.SURVEYOR_ID, id.toString());
  }

  async getSurveyorName(): Promise<string | null> {
    return this.getValue(KEYS.SURVEYOR_NAME);
  }

  async setSurveyorName(name: string): Promise<void> {
    await this.setValue(KEYS.SURVEYOR_NAME, name);
  }

  async getSurveyorEmail(): Promise<string | null> {
    return this.getValue(KEYS.SURVEYOR_EMAIL);
  }

  async setSurveyorEmail(email: string): Promise<void> {
    await this.setValue(KEYS.SURVEYOR_EMAIL, email);
  }

  async getSurveyorPhone(): Promise<string | null> {
    return this.getValue(KEYS.SURVEYOR_PHONE);
  }

  async setSurveyorPhone(phone: string): Promise<void> {
    await this.setValue(KEYS.SURVEYOR_PHONE, phone);
  }

  async getSurveyorCode(): Promise<string | null> {
    return this.getValue(KEYS.SURVEYOR_CODE);
  }

  async setSurveyorCode(code: string): Promise<void> {
    await this.setValue(KEYS.SURVEYOR_CODE, code);
  }

  /**
   * Get all surveyor data at once (for login restoration)
   */
  async getSurveyorData(): Promise<{
    id: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    code: string | null;
  }> {
    const [id, name, email, phone, code] = await Promise.all([
      this.getSurveyorId(),
      this.getSurveyorName(),
      this.getSurveyorEmail(),
      this.getSurveyorPhone(),
      this.getSurveyorCode(),
    ]);
    return { id, name, email, phone, code };
  }

  /**
   * Save all surveyor data at once (after login)
   */
  async setSurveyorData(data: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    code?: string;
  }): Promise<void> {
    await Promise.all([
      this.setSurveyorId(data.id),
      this.setSurveyorName(data.name),
      data.email ? this.setSurveyorEmail(data.email) : Promise.resolve(),
      data.phone ? this.setSurveyorPhone(data.phone) : Promise.resolve(),
      data.code ? this.setSurveyorCode(data.code) : Promise.resolve(),
    ]);
  }

  // ==================== Push Token & Registration ====================

  async getPushToken(): Promise<string | null> {
    return this.getValue(KEYS.PUSH_TOKEN);
  }

  async setPushToken(token: string): Promise<void> {
    await this.setValue(KEYS.PUSH_TOKEN, token);
  }

  async isDeviceRegistered(): Promise<boolean> {
    const value = await this.getValue(KEYS.DEVICE_REGISTERED);
    return value === 'true';
  }

  async setDeviceRegistered(registered: boolean): Promise<void> {
    await this.setValue(KEYS.DEVICE_REGISTERED, registered.toString());
  }

  // ==================== Notifications ====================

  async getNotifications(): Promise<NotificationItem[]> {
    const json = await this.getValue(KEYS.NOTIFICATIONS);
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
    await this.setValue(KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  }

  async clearNotifications(): Promise<void> {
    await this.removeValue(KEYS.NOTIFICATIONS);
  }

  async markNotificationRead(id: string): Promise<void> {
    const notifications = await this.getNotifications();
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    await this.setValue(KEYS.NOTIFICATIONS, JSON.stringify(updated));
  }

  // ==================== Inspection History ====================

  async getInspectionHistory(): Promise<any[]> {
    const json = await this.getValue(KEYS.INSPECTION_HISTORY);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  async addInspectionHistory(entry: any): Promise<any[]> {
    const history = await this.getInspectionHistory();
    const updated = [entry, ...history].slice(0, MAX_INSPECTION_HISTORY);
    await this.setValue(KEYS.INSPECTION_HISTORY, JSON.stringify(updated));
    return updated;
  }

  async clearInspectionHistory(): Promise<void> {
    await this.removeValue(KEYS.INSPECTION_HISTORY);
  }

  // ==================== App Settings ====================

  async getSettings(): Promise<AppSettings> {
    const json = await this.getValue(KEYS.APP_SETTINGS);
    if (!json) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async setSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.setValue(KEYS.APP_SETTINGS, JSON.stringify(updated));
  }

  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  async setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    await this.setSettings({ [key]: value } as Partial<AppSettings>);
  }

  // ==================== Sync Tracking ====================

  async getLastSyncTime(): Promise<number | null> {
    const value = await this.getValue(KEYS.LAST_SYNC_TIME);
    return value ? parseInt(value, 10) : null;
  }

  async setLastSyncTime(timestamp: number = Date.now()): Promise<void> {
    await this.setValue(KEYS.LAST_SYNC_TIME, timestamp.toString());
  }

  // ==================== Clear Data ====================

  /**
   * Clear all sensitive data (for logout)
   */
  async clearSensitiveData(): Promise<void> {
    const sensitiveKeys = Array.from(SENSITIVE_KEYS);
    await Promise.all(sensitiveKeys.map(key => this.removeValue(key)));
    await this.removeValue(KEYS.SURVEYOR_NAME);
    await this.removeValue(KEYS.PUSH_TOKEN);
    await this.removeValue(KEYS.DEVICE_REGISTERED);
    logger.info('[Storage] Sensitive data cleared');
  }

  /**
   * Clear all data (full reset)
   */
  async clearAll(): Promise<void> {
    // Clear SecureStore
    const sensitiveKeys = Array.from(SENSITIVE_KEYS);
    await Promise.all(sensitiveKeys.map(key => this.removeValue(key)));

    // Clear AsyncStorage
    await AsyncStorage.multiRemove([
      KEYS.SURVEYOR_NAME,
      KEYS.PUSH_TOKEN,
      KEYS.DEVICE_REGISTERED,
      KEYS.NOTIFICATIONS,
      KEYS.INSPECTION_HISTORY,
      KEYS.APP_SETTINGS,
      KEYS.LAST_SYNC_TIME,
    ]);

    logger.info('[Storage] All data cleared');
  }

  // ==================== Migration ====================

  /**
   * Migrate data from AsyncStorage to SecureStore
   * Call this on app start to migrate existing installations
   */
  async migrateToSecureStorage(): Promise<void> {
    if (!this.isSecureStoreAvailable) {
      logger.debug('[Storage] SecureStore not available, skipping migration');
      return;
    }

    for (const key of SENSITIVE_KEYS) {
      try {
        // Check if already in SecureStore
        const secureValue = await SecureStore.getItemAsync(key);
        if (secureValue !== null) continue;

        // Check if exists in AsyncStorage
        const asyncValue = await AsyncStorage.getItem(key);
        if (asyncValue === null) continue;

        // Migrate to SecureStore
        await SecureStore.setItemAsync(key, asyncValue);
        await AsyncStorage.removeItem(key);
        logger.info(`[Storage] Migrated ${key} to SecureStore`);
      } catch (error) {
        logger.error(`[Storage] Failed to migrate ${key}`, error);
      }
    }
  }

  // ==================== Utility ====================

  /**
   * Check if user is logged in (has surveyor ID)
   */
  async isLoggedIn(): Promise<boolean> {
    const surveyorId = await this.getSurveyorId();
    return surveyorId !== null;
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    notificationCount: number;
    inspectionHistoryCount: number;
    isSecureStoreAvailable: boolean;
  }> {
    const [notifications, history] = await Promise.all([
      this.getNotifications(),
      this.getInspectionHistory(),
    ]);

    return {
      notificationCount: notifications.length,
      inspectionHistoryCount: history.length,
      isSecureStoreAvailable: this.isSecureStoreAvailable,
    };
  }
}

export const storageService = new StorageService();
export { KEYS as STORAGE_KEYS };
export type { AppSettings };
