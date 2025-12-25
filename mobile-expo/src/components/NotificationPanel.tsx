import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { NotificationItem } from '../types';

const { width } = Dimensions.get('window');

interface NotificationPanelProps {
  visible: boolean;
  notifications: NotificationItem[];
  slideAnim: Animated.Value;
  onClose: () => void;
  onClearAll: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  visible,
  notifications,
  slideAnim,
  onClose,
  onClearAll,
}) => {
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (title: string) => {
    if (title.toLowerCase().includes('appointment')) return 'calendar';
    if (title.toLowerCase().includes('message')) return 'chatbubble';
    if (title.toLowerCase().includes('urgent')) return 'warning';
    return 'notifications';
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
          <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.panelContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.headerActions}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={onClearAll} style={styles.clearButton}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.gray[400]} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Ionicons name="notifications-off-outline" size={48} color={colors.gray[600]} />
                  </View>
                  <Text style={styles.emptyTitle}>No notifications</Text>
                  <Text style={styles.emptySubtitle}>
                    You're all caught up! New notifications will appear here.
                  </Text>
                </View>
              ) : (
                notifications.map((notification, index) => (
                  <TouchableOpacity
                    key={notification.id || index}
                    style={styles.notificationItem}
                    activeOpacity={0.8}
                  >
                    <View style={styles.notificationIcon}>
                      <Ionicons
                        name={getNotificationIcon(notification.title) as any}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>
                        {notification.body}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTime(notification.timestamp)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    width: width * 0.85,
    maxWidth: 360,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  panelContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  clearButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  clearText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  closeButton: {
    padding: spacing.xs,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  notificationBody: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[400],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationPanel;
