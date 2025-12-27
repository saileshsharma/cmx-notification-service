/**
 * NotificationContext - Notification state management
 * Handles push notifications and notification panel
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications, UseNotificationsReturn } from '../hooks/useNotifications';

const NotificationContext = createContext<UseNotificationsReturn | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  onNewNotification?: () => void;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  onNewNotification,
}) => {
  const notifications = useNotifications(onNewNotification);

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): UseNotificationsReturn => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
