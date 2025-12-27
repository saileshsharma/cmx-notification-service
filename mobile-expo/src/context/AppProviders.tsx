/**
 * AppProviders - Unified provider composition
 * Wraps all context providers in proper order for dependency injection
 */
import React, { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './AuthContext';
import { NetworkProvider } from './NetworkContext';
import { NotificationProvider } from './NotificationContext';
import { AppointmentProvider } from './AppointmentContext';
import { InspectionProvider } from './InspectionContext';
import { LocationProvider } from './LocationContext';
import { ChatProvider } from './ChatContext';
import { FeatureFlagProvider } from './FeatureFlagContext';

interface AppProvidersProps {
  children: ReactNode;
  onNewNotification?: () => void;
}

/**
 * Composes all providers in the correct order.
 * Order matters: inner providers can depend on outer providers.
 *
 * Provider hierarchy:
 * 0. SafeAreaProvider - Required for useSafeAreaInsets hook
 * 1. NetworkProvider - No dependencies, needed by all
 * 2. FeatureFlagProvider - No dependencies, provides feature flags
 * 3. AuthProvider - Needs network, provides auth state
 * 4. NotificationProvider - Needs auth for push tokens
 * 5. AppointmentProvider - Needs auth for surveyor ID
 * 6. InspectionProvider - Needs appointments
 * 7. LocationProvider - Needs auth and inspection
 * 8. ChatProvider - Needs auth for surveyor info
 */
export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  onNewNotification,
}) => {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <FeatureFlagProvider>
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
        </FeatureFlagProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
};

// Re-export all context hooks for convenience
export { useAuthContext } from './AuthContext';
export { useNetworkContext } from './NetworkContext';
export { useFeatureFlagContext, useFeatureFlag, FLAGS } from './FeatureFlagContext';
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
