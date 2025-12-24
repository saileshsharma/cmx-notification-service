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

class NotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private onNotificationReceived: ((notification: NotificationItem) => void) | null = null;

  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      // Save the token
      await storageService.setPushToken(tokenData.data);

      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  async setupAndroidChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Appointments',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1976D2',
      });
    }
  }

  setOnNotificationReceived(callback: (notification: NotificationItem) => void): void {
    this.onNotificationReceived = callback;
  }

  startListening(): void {
    // Listen for incoming notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
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
        console.log('Notification tapped:', response);
        // Handle notification tap - could navigate to appointment details
      }
    );
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
