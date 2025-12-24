import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { NotificationItem, NotificationType } from '../types';
import { storageService } from './storage';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Debug logger that stores messages for UI display
class DebugLogger {
  private logs: string[] = [];
  private listeners: ((logs: string[]) => void)[] = [];

  log(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log('[NotificationService]', message);
    this.logs.push(logEntry);
    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
    this.notifyListeners();
  }

  error(message: string, error?: unknown) {
    const errorStr = error instanceof Error ? error.message : String(error);
    this.log(`ERROR: ${message} - ${errorStr}`);
  }

  getLogs(): string[] {
    return [...this.logs];
  }

  subscribe(listener: (logs: string[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.getLogs()));
  }
}

export const debugLogger = new DebugLogger();

class NotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private onNotificationReceived: ((notification: NotificationItem) => void) | null = null;

  async requestPermissions(): Promise<boolean> {
    debugLogger.log(`Requesting permissions...`);
    debugLogger.log(`Is physical device: ${Device.isDevice}`);
    debugLogger.log(`Device brand: ${Device.brand}`);
    debugLogger.log(`Device model: ${Device.modelName}`);
    debugLogger.log(`Platform: ${Platform.OS} ${Platform.Version}`);

    if (!Device.isDevice) {
      debugLogger.log('WARNING: Not a physical device - push notifications will not work');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      debugLogger.log(`Existing permission status: ${existingStatus}`);

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        debugLogger.log('Requesting new permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        debugLogger.log(`New permission status: ${status}`);
      }

      const granted = finalStatus === 'granted';
      debugLogger.log(`Permissions granted: ${granted}`);
      return granted;
    } catch (error) {
      debugLogger.error('Failed to request permissions', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    debugLogger.log('Getting push token...');

    if (!Device.isDevice) {
      debugLogger.log('Cannot get token: not a physical device');
      return null;
    }

    // First try native FCM token
    debugLogger.log('Attempting to get native FCM token...');
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      debugLogger.log(`Native token type: ${tokenData.type}`);
      debugLogger.log(`Native token data: ${tokenData.data.substring(0, 50)}...`);

      await storageService.setPushToken(tokenData.data);
      debugLogger.log('FCM token saved to storage');

      return tokenData.data;
    } catch (error) {
      debugLogger.error('Failed to get native FCM token', error);
    }

    // Fallback to Expo push token
    debugLogger.log('Falling back to Expo Push Token...');
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      debugLogger.log(`Project ID: ${projectId || 'NOT FOUND'}`);

      if (!projectId) {
        debugLogger.log('WARNING: No project ID found in app config');
      }

      const expoTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      debugLogger.log(`Expo token: ${expoTokenData.data.substring(0, 30)}...`);
      await storageService.setPushToken(expoTokenData.data);
      debugLogger.log('Expo token saved to storage');

      return expoTokenData.data;
    } catch (expoError) {
      debugLogger.error('Failed to get Expo push token', expoError);
      return null;
    }
  }

  async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      debugLogger.log('Setting up Android notification channel...');
      try {
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1976D2',
        });
        debugLogger.log('Android channel created successfully');
      } catch (error) {
        debugLogger.error('Failed to create Android channel', error);
      }
    }
  }

  setOnNotificationReceived(callback: (notification: NotificationItem) => void): void {
    this.onNotificationReceived = callback;
  }

  startListening(): void {
    debugLogger.log('Starting notification listeners...');

    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        debugLogger.log(`Notification received: ${notification.request.content.title}`);
        const data = notification.request.content.data;

        const type: NotificationType =
          (data.type as NotificationType) || 'CREATED';

        const newNotification: NotificationItem = {
          id: notification.request.identifier,
          type,
          title: notification.request.content.title || 'Appointment Update',
          body: notification.request.content.body || '',
          appointmentId: data.appointmentId as number | undefined,
          timestamp: Date.now(),
        };

        // Save to storage
        await storageService.addNotification(newNotification);

        // Notify callback
        if (this.onNotificationReceived) {
          this.onNotificationReceived(newNotification);
        }
      }
    );

    // Listen for notification taps
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        debugLogger.log(`Notification tapped: ${response.notification.request.content.title}`);
      }
    );

    debugLogger.log('Notification listeners started');
  }

  stopListening(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    debugLogger.log('Notification listeners stopped');
  }

  getNotificationColor(type: NotificationType): string {
    switch (type) {
      case 'CREATED':
        return '#4CAF50';
      case 'RESCHEDULED':
        return '#FF9800';
      case 'DELETED':
        return '#F44336';
      default:
        return '#1976D2';
    }
  }
}

export const notificationService = new NotificationService();
