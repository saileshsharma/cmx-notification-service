/**
 * Sentry Configuration
 * Error tracking and performance monitoring
 */
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Sentry DSN - Replace with your actual DSN from sentry.io
// Get this from: https://sentry.io -> Project Settings -> Client Keys (DSN)
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

// Environment detection
const getEnvironment = (): string => {
  if (__DEV__) return 'development';
  // Check for EAS build profile
  const easProfile = Constants.expoConfig?.extra?.eas?.buildProfile;
  if (easProfile === 'preview') return 'staging';
  return 'production';
};

// App version info
const getRelease = (): string => {
  const version = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ||
                      Constants.expoConfig?.android?.versionCode?.toString() || '1';
  return `fleetinspect-pro@${version}+${buildNumber}`;
};

/**
 * Initialize Sentry
 * Should be called as early as possible in app lifecycle
 */
export const initSentry = (): void => {
  // Skip initialization if no DSN configured
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.log('[Sentry] DSN not configured, skipping initialization');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment and release tracking
    environment: getEnvironment(),
    release: getRelease(),
    dist: Constants.expoConfig?.ios?.buildNumber ||
          Constants.expoConfig?.android?.versionCode?.toString() || '1',

    // Enable native crash handling
    enableNative: true,
    enableNativeCrashHandling: true,

    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in prod
    profilesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in prod

    // Session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 seconds

    // Attachments
    attachStacktrace: true,
    attachScreenshot: true,
    attachViewHierarchy: true,

    // Breadcrumbs
    maxBreadcrumbs: 100,
    enableAutoPerformanceTracing: true,

    // Debug mode for development
    debug: __DEV__,

    // Filtering
    beforeSend: (event, hint) => {
      // Filter out certain errors in production
      if (!__DEV__) {
        // Skip network errors that are expected (e.g., offline state)
        const errorMessage = event.exception?.values?.[0]?.value || '';
        if (errorMessage.includes('Network request failed') ||
            errorMessage.includes('Failed to fetch')) {
          // Add breadcrumb but don't send as error
          Sentry.addBreadcrumb({
            category: 'network',
            message: 'Network request failed (expected offline behavior)',
            level: 'warning',
          });
          return null;
        }
      }
      return event;
    },

    // Integrations
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
  });
};

/**
 * Set user context for error tracking
 */
export const setSentryUser = (user: {
  id: string | number;
  email?: string;
  name?: string;
}): void => {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.name,
  });
};

/**
 * Clear user context (on logout)
 */
export const clearSentryUser = (): void => {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
};

/**
 * Set extra context data
 */
export const setSentryContext = (key: string, context: Record<string, unknown>): void => {
  if (!SENTRY_DSN) return;
  Sentry.setContext(key, context);
};

/**
 * Set tags for filtering
 */
export const setSentryTag = (key: string, value: string): void => {
  if (!SENTRY_DSN) return;
  Sentry.setTag(key, value);
};

/**
 * Add a breadcrumb for debugging
 */
export const addSentryBreadcrumb = (breadcrumb: {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}): void => {
  if (!SENTRY_DSN) return;
  Sentry.addBreadcrumb({
    category: breadcrumb.category,
    message: breadcrumb.message,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  });
};

/**
 * Capture an exception
 */
export const captureException = (
  error: Error,
  context?: Record<string, unknown>
): string => {
  if (!SENTRY_DSN) {
    console.error('[Sentry disabled]', error, context);
    return '';
  }

  return Sentry.captureException(error, {
    extra: context,
  });
};

/**
 * Capture a message
 */
export const captureMessage = (
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, unknown>
): string => {
  if (!SENTRY_DSN) {
    console.log(`[Sentry disabled] [${level}]`, message, context);
    return '';
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
};

/**
 * Start a performance transaction
 */
export const startTransaction = (
  name: string,
  op: string
): Sentry.Span | undefined => {
  if (!SENTRY_DSN) return undefined;
  return Sentry.startInactiveSpan({ name, op });
};

/**
 * Wrap a component with Sentry error boundary
 */
export const withSentryErrorBoundary = Sentry.wrap;

// Re-export Sentry for direct access if needed
export { Sentry };
