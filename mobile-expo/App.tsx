/**
 * App.tsx - Refactored main entry point
 * Clean architecture with separated concerns:
 * - Hooks for logic
 * - Contexts for state management
 * - Containers for screen orchestration
 * - Services for API/external communication
 *
 * This file is now ~100 lines instead of 1,200+ lines
 */
import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// Sentry - Initialize as early as possible
import { initSentry, withSentryErrorBoundary } from './src/config/sentry';
initSentry();

// Context Providers
import { AppProviders } from './src/context/AppProviders';

// Containers
import { AuthContainer } from './src/containers/AuthContainer';
import { MainContainer } from './src/containers/MainContainer';

// Components
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Context hooks
import { useAuthContext } from './src/context/AuthContext';
import { useNotificationContext } from './src/context/NotificationContext';
import { useAppointmentContext } from './src/context/AppointmentContext';

// Utils
import { logger } from './src/utils/logger';

// Keep splash screen visible during initialization
SplashScreen.preventAutoHideAsync();

/**
 * AppContent - Main app content with auth flow
 * Separated from App to allow context access
 */
const AppContent: React.FC = () => {
  const { isRegistered, isLoading, setExpoPushToken } = useAuthContext();
  const { setupPushNotifications, expoPushToken } = useNotificationContext();
  const { loadAppointments } = useAppointmentContext();

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Update auth context with push token
  useEffect(() => {
    if (expoPushToken) {
      setExpoPushToken(expoPushToken);
    }
  }, [expoPushToken, setExpoPushToken]);

  const initializeApp = async () => {
    try {
      logger.info('Initializing app...');

      // Setup push notifications
      await setupPushNotifications();

      logger.info('App initialized successfully');
    } catch (error) {
      logger.error('Error initializing app:', error);
    } finally {
      // Hide splash screen
      await SplashScreen.hideAsync();
    }
  };

  // Show loading or auth screens
  if (!isRegistered) {
    return <AuthContainer />;
  }

  // Show main app
  return <MainContainer />;
};

/**
 * App - Root component with providers and error boundary
 */
function App() {
  // Handle notification-triggered data refresh
  const handleNewNotification = () => {
    logger.debug('New notification received, triggering data refresh');
    // Data refresh is handled within contexts
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('Uncaught error in app:', {
          message: error.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <AppProviders onNewNotification={handleNewNotification}>
        <AppContent />
      </AppProviders>
    </ErrorBoundary>
  );
}

// Wrap with Sentry for native crash handling
export default withSentryErrorBoundary(App);
