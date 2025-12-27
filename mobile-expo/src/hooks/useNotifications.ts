/**
 * useNotifications Hook - Notification handling logic
 * Handles push notifications, notification panel, and notification history
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { notificationService } from '../services/notifications';
import { storageService } from '../services/storage';
import { NotificationItem } from '../types';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');

export interface UseNotificationsReturn {
  // State
  notifications: NotificationItem[];
  expoPushToken: string;
  showNotifications: boolean;
  unreadCount: number;

  // Animations
  slideAnim: Animated.Value;
  badgeScale: Animated.Value;

  // Actions
  setupPushNotifications: () => Promise<void>;
  toggleNotificationPanel: () => void;
  clearAllNotifications: () => void;
  addNotification: (notification: NotificationItem) => void;
}

export function useNotifications(
  onNewNotification?: () => void
): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(width)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;

  // Derived value: unread count (notifications from last 24 hours)
  const unreadCount = notifications.filter(n =>
    Date.now() - n.timestamp < 24 * 60 * 60 * 1000
  ).length;

  // Load saved notifications on mount
  useEffect(() => {
    loadSavedNotifications();
  }, []);

  // Setup notification listener
  useEffect(() => {
    notificationService.setOnNotificationReceived((notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onNewNotification?.();
    });

    notificationService.startListening();

    return () => {
      notificationService.stopListening();
    };
  }, [onNewNotification]);

  // Badge animation when notifications change
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(badgeScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [notifications.length]);

  const loadSavedNotifications = useCallback(async () => {
    try {
      const saved = await storageService.getNotifications();
      if (saved) {
        setNotifications(saved);
      }
    } catch (error) {
      logger.error('Error loading saved notifications:', error);
    }
  }, []);

  const setupPushNotifications = useCallback(async () => {
    logger.info('Setting up push notifications...');

    const granted = await notificationService.requestPermissions();
    if (!granted) {
      logger.warn('Push notification permissions not granted');
      return;
    }

    const token = await notificationService.getExpoPushToken();
    if (token) {
      setExpoPushToken(token);
      logger.info('Push token obtained:', token.substring(0, 30) + '...');
    }

    await notificationService.setupAndroidChannel();
  }, []);

  const toggleNotificationPanel = useCallback(() => {
    if (showNotifications) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowNotifications(false));
    } else {
      setShowNotifications(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showNotifications, slideAnim]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    storageService.clearNotifications();
  }, []);

  const addNotification = useCallback((notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    storageService.addNotification(notification);
  }, []);

  return {
    notifications,
    expoPushToken,
    showNotifications,
    unreadCount,
    slideAnim,
    badgeScale,
    setupPushNotifications,
    toggleNotificationPanel,
    clearAllNotifications,
    addNotification,
  };
}
