/**
 * Custom Hooks - Centralized exports
 * Clean architecture with separated concerns
 */

// Auth hook - Authentication and session management
export { useAuth } from './useAuth';
export type { AuthScreen, AuthState, UseAuthReturn } from './useAuth';

// Appointments hook - Appointment management
export { useAppointments } from './useAppointments';
export type { TodayStats, UseAppointmentsReturn } from './useAppointments';

// Inspection hook - Inspection workflow
export { useInspection } from './useInspection';
export type {
  JobState,
  InspectionStep,
  CompletedJob,
  UseInspectionReturn,
} from './useInspection';

// Chat hook - Messaging and WebSocket
export { useChat } from './useChat';
export type { LocalChatMessage, UseChatReturn } from './useChat';

// Location hook - GPS tracking and navigation
export { useLocation } from './useLocation';
export type { QuickStatus, Location, UseLocationReturn } from './useLocation';

// Notifications hook - Push notifications
export { useNotifications } from './useNotifications';
export type { UseNotificationsReturn } from './useNotifications';

// Network hook - Online/offline detection
export { useNetwork } from './useNetwork';
export type { NetworkState, UseNetworkReturn } from './useNetwork';

// Async state hook - Loading/error state management
export { useAsyncState, useAsyncOperations } from './useAsyncState';
