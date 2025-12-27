/**
 * AppProviders - Unified provider composition
 * Wraps all context providers in proper order for dependency injection
 */
import React, { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { NetworkProvider } from './NetworkContext';
import { NotificationProvider } from './NotificationContext';
import { AppointmentProvider } from './AppointmentContext';
import { InspectionProvider } from './InspectionContext';
import { LocationProvider } from './LocationContext';
import { ChatProvider } from './ChatContext';

interface AppProvidersProps {
  children: ReactNode;
  onNewNotification?: () => void;
}

/**
 * Composes all providers in the correct order.
 * Order matters: inner providers can depend on outer providers.
 *
 * Provider hierarchy:
 * 1. NetworkProvider - No dependencies, needed by all
 * 2. AuthProvider - Needs network, provides auth state
 * 3. NotificationProvider - Needs auth for push tokens
 * 4. AppointmentProvider - Needs auth for surveyor ID
 * 5. InspectionProvider - Needs appointments
 * 6. LocationProvider - Needs auth and inspection
 * 7. ChatProvider - Needs auth for surveyor info
 */
export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  onNewNotification,
}) => {
  return (
    <NetworkProvider>
      <AuthProvider>
        <NotificationProvider onNewNotification={onNewNotification}>
          <AppointmentProvider>
            <InspectionProvider>
              <LocationProvider>
                <ChatProvider>
                  {children}
                </ChatProvider>
              </LocationProvider>
            </InspectionProvider>
          </AppointmentProvider>
        </NotificationProvider>
      </AuthProvider>
    </NetworkProvider>
  );
};

// Re-export all context hooks for convenience
export { useAuthContext } from './AuthContext';
export { useNetworkContext } from './NetworkContext';
export { useNotificationContext } from './NotificationContext';
export { useAppointmentContext } from './AppointmentContext';
export { useInspectionContext } from './InspectionContext';
export { useLocationContext } from './LocationContext';
export { useChatContext } from './ChatContext';

// Re-export types
export type { AuthScreen, AuthState } from './AuthContext';
export type { TodayStats } from './AppointmentContext';
export type { JobState, InspectionStep, CompletedJob } from './InspectionContext';
export type { LocalChatMessage } from './ChatContext';
export type { QuickStatus, Location } from './LocationContext';
export type { NetworkState } from './NetworkContext';
