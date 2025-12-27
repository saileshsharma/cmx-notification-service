import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { NotificationItem } from '../types';
import { notificationService } from '../services/notifications';

interface Props {
  notifications: NotificationItem[];
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NotificationListItem: React.FC<{ item: NotificationItem }> = React.memo(({ item }) => (
  <View style={styles.notificationItem}>
    <View
      style={[
        styles.notificationIndicator,
        { backgroundColor: notificationService.getNotificationColor(item.type) },
      ]}
    />
    <View style={styles.notificationContent}>
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationBody}>{item.body}</Text>
      <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
    </View>
  </View>
));

export const NotificationList: React.FC<Props> = ({ notifications }) => {
  if (notifications.length === 0) {
    return <Text style={styles.emptyText}>No notifications yet</Text>;
  }

  return (
    <FlatList
      data={notifications}
      renderItem={({ item }) => <NotificationListItem item={item} />}
      keyExtractor={(item) => item.id}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 20,
  },
});
