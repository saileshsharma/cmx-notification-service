/**
 * Context - Centralized exports
 * Clean architecture with separated state management
 */

// Main provider composition
export { AppProviders } from './AppProviders';

// Individual providers (for testing or custom composition)
export { AuthProvider, useAuthContext } from './AuthContext';
export { NetworkProvider, useNetworkContext } from './NetworkContext';
export { NotificationProvider, useNotificationContext } from './NotificationContext';
export { AppointmentProvider, useAppointmentContext } from './AppointmentContext';
export { InspectionProvider, useInspectionContext } from './InspectionContext';
export { LocationProvider, useLocationContext } from './LocationContext';
export { ChatProvider, useChatContext } from './ChatContext';

// Legacy AppContext (for backward compatibility during migration)
export { AppProvider, useApp } from './AppContext';

// Re-export types
export type { AuthScreen, AuthState } from './AuthContext';
export type { TodayStats } from './AppointmentContext';
export type { JobState, InspectionStep, CompletedJob } from './InspectionContext';
export type { LocalChatMessage } from './ChatContext';
export type { QuickStatus, Location } from './LocationContext';
export type { NetworkState } from './NetworkContext';
