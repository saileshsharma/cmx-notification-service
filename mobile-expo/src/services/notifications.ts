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
    debugLogger.log(`Device.isDevice: ${Device.isDevice}`);
    debugLogger.log(`Device.brand: ${Device.brand}`);
    debugLogger.log(`Device.manufacturer: ${Device.manufacturer}`);
    debugLogger.log(`Device.osName: ${Device.osName}`);
    debugLogger.log(`Platform.OS: ${Platform.OS}`);

    if (!Device.isDevice) {
      debugLogger.log('Cannot get token: not a physical device (emulator/simulator)');
      debugLogger.log('NOTE: Push notifications only work on physical devices!');
      return null;
    }

    // For iOS, we need to use Expo push tokens which handle APNs
    // For Android, we can use native FCM tokens
    if (Platform.OS === 'ios') {
      debugLogger.log('iOS detected - using Expo Push Token for APNs...');
      return this.getExpoPushTokenInternal();
    }

    // Android - First try native FCM token
    debugLogger.log('Android detected - attempting to get native FCM token...');
    debugLogger.log('This requires google-services.json to be properly configured');
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      debugLogger.log(`SUCCESS: Native token type: ${tokenData.type}`);
      debugLogger.log(`Native token (first 50 chars): ${tokenData.data.substring(0, 50)}...`);
      debugLogger.log(`Native token length: ${tokenData.data.length}`);

      await storageService.setPushToken(tokenData.data);
      debugLogger.log('FCM token saved to storage');

      return tokenData.data;
    } catch (error) {
      debugLogger.error('Failed to get native FCM token', error);
      debugLogger.log('Falling back to Expo Push Token...');
      return this.getExpoPushTokenInternal();
    }
  }

  private async getExpoPushTokenInternal(): Promise<string | null> {
    try {
      debugLogger.log('Checking Constants.expoConfig...');
      debugLogger.log(`expoConfig exists: ${!!Constants.expoConfig}`);
      debugLogger.log(`expoConfig.extra exists: ${!!Constants.expoConfig?.extra}`);

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      debugLogger.log(`Project ID: ${projectId || 'NOT FOUND'}`);

      if (!projectId) {
        debugLogger.log('WARNING: No project ID found in app.json/app.config.js');
        debugLogger.log('Expo push tokens require a valid EAS project ID');
      }

      debugLogger.log('Calling getExpoPushTokenAsync...');
      const expoTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      debugLogger.log(`SUCCESS: Expo token: ${expoTokenData.data.substring(0, 30)}...`);
      debugLogger.log(`Expo token length: ${expoTokenData.data.length}`);
      await storageService.setPushToken(expoTokenData.data);
      debugLogger.log('Expo token saved to storage');

      return expoTokenData.data;
    } catch (expoError) {
      debugLogger.error('Failed to get Expo push token', expoError);
      debugLogger.log('CRITICAL: No push token could be obtained!');
      debugLogger.log('Possible causes:');
      debugLogger.log('1. Running on emulator (push only works on physical device)');
      debugLogger.log('2. google-services.json missing or misconfigured');
      debugLogger.log('3. No EAS project ID configured');
      debugLogger.log('4. Network connectivity issues');
      debugLogger.log('5. For iOS: APNs certificate/key not configured in EAS');
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

        // Map backend notification types to mobile types
        let type: NotificationType = 'CREATED';
        const backendType = data.type as string;
        if (backendType === 'APPOINTMENT_CREATED') {
          type = 'CREATED';
        } else if (backendType === 'APPOINTMENT_UPDATED') {
          type = 'RESCHEDULED';
        } else if (backendType === 'APPOINTMENT_DELETED') {
          type = 'DELETED';
        } else if (backendType === 'APPOINTMENT_RESPONSE') {
          type = 'RESPONSE';
        }

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
      case 'RESPONSE':
        return '#2196F3';
      default:
        return '#1976D2';
    }
  }
}

export const notificationService = new NotificationService();
