/**
 * FeatureFlagContext - Centralized feature flag management for mobile
 * Provides feature flags from the backend and makes them available throughout the app
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

// Feature flag names - these match the backend flag names
export const FLAGS = {
  // Mobile-specific
  BIOMETRIC_LOGIN: 'mobile.biometric-login',
  OFFLINE_MODE: 'mobile.offline-mode',
  BACKGROUND_SYNC: 'mobile.background-sync',
  HAPTIC_FEEDBACK: 'mobile.haptic-feedback',
  PULL_TO_REFRESH: 'mobile.pull-to-refresh',
  SWIPE_ACTIONS: 'mobile.swipe-actions',

  // Location/GPS
  LIVE_TRACKING: 'location.live-tracking',
  GEOFENCING: 'location.geofencing',
  ROUTE_OPTIMIZATION: 'location.route-optimization',
  TRAFFIC_INTEGRATION: 'location.traffic-integration',

  // Media
  PHOTO_CAPTURE: 'media.photo-capture',
  PHOTO_ANNOTATION: 'media.photo-annotation',
  VIDEO_CAPTURE: 'media.video-capture',
  DOCUMENT_SCAN: 'media.document-scan',

  // Signatures
  SIGNATURE_CAPTURE: 'signature.capture',
  SIGNATURE_REQUIRED: 'signature.required',

  // Shared features
  DARK_MODE: 'dark-mode',
  PUSH_NOTIFICATIONS: 'notifications.push',
  SMS_NOTIFICATIONS: 'notifications.sms',
  EMAIL_NOTIFICATIONS: 'notifications.email',
  IN_APP_NOTIFICATIONS: 'notifications.in-app',
  QUIET_HOURS: 'notifications.quiet-hours',

  // Chat
  CHAT_V2: 'chat-v2',
  CHAT_ATTACHMENTS: 'chat.attachments',
  VOICE_MESSAGES: 'chat.voice-messages',
  READ_RECEIPTS: 'chat.read-receipts',
  TYPING_INDICATORS: 'chat.typing-indicators',
  GROUP_CHAT: 'chat.group-chat',

  // Performance
  LAZY_LOADING: 'perf.lazy-loading',
  IMAGE_OPTIMIZATION: 'perf.image-optimization',
  CACHE_FIRST: 'perf.cache-first',

  // Security
  SESSION_TIMEOUT: 'security.session-timeout',
  PIN_LOCK: 'security.pin-lock',
  TWO_FACTOR_AUTH: 'security.2fa',

  // UI
  SKELETON_LOADING: 'ui.skeleton-loading',
  ANIMATIONS: 'ui.animations',

  // Experimental
  AI_SUGGESTIONS: 'experimental.ai-suggestions',
  VOICE_COMMANDS: 'experimental.voice-commands',
  AR_NAVIGATION: 'experimental.ar-navigation',

  // Debug
  VERBOSE_LOGGING: 'debug.verbose-logging',
  PERFORMANCE_OVERLAY: 'debug.performance-overlay',
} as const;

type FlagName = typeof FLAGS[keyof typeof FLAGS];

interface FeatureFlags {
  [key: string]: boolean;
}

interface FeatureFlagContextType {
  flags: FeatureFlags;
  loading: boolean;
  error: string | null;
  isEnabled: (flagName: string) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

interface FeatureFlagProviderProps {
  children: ReactNode;
  userId?: number;
}

// Default flag values (used when API is unavailable)
const DEFAULT_FLAGS: FeatureFlags = {
  // All flags default to true for full functionality
  [FLAGS.BIOMETRIC_LOGIN]: true,
  [FLAGS.OFFLINE_MODE]: true,
  [FLAGS.BACKGROUND_SYNC]: true,
  [FLAGS.HAPTIC_FEEDBACK]: true,
  [FLAGS.PULL_TO_REFRESH]: true,
  [FLAGS.SWIPE_ACTIONS]: true,
  [FLAGS.LIVE_TRACKING]: true,
  [FLAGS.GEOFENCING]: true,
  [FLAGS.ROUTE_OPTIMIZATION]: true,
  [FLAGS.TRAFFIC_INTEGRATION]: true,
  [FLAGS.PHOTO_CAPTURE]: true,
  [FLAGS.PHOTO_ANNOTATION]: true,
  [FLAGS.VIDEO_CAPTURE]: true,
  [FLAGS.DOCUMENT_SCAN]: true,
  [FLAGS.SIGNATURE_CAPTURE]: true,
  [FLAGS.SIGNATURE_REQUIRED]: true,
  [FLAGS.DARK_MODE]: true,
  [FLAGS.PUSH_NOTIFICATIONS]: true,
  [FLAGS.SMS_NOTIFICATIONS]: true,
  [FLAGS.EMAIL_NOTIFICATIONS]: true,
  [FLAGS.IN_APP_NOTIFICATIONS]: true,
  [FLAGS.QUIET_HOURS]: true,
  [FLAGS.CHAT_V2]: true,
  [FLAGS.CHAT_ATTACHMENTS]: true,
  [FLAGS.VOICE_MESSAGES]: true,
  [FLAGS.READ_RECEIPTS]: true,
  [FLAGS.TYPING_INDICATORS]: true,
  [FLAGS.GROUP_CHAT]: true,
  [FLAGS.LAZY_LOADING]: true,
  [FLAGS.IMAGE_OPTIMIZATION]: true,
  [FLAGS.CACHE_FIRST]: true,
  [FLAGS.SESSION_TIMEOUT]: true,
  [FLAGS.PIN_LOCK]: true,
  [FLAGS.TWO_FACTOR_AUTH]: true,
  [FLAGS.SKELETON_LOADING]: true,
  [FLAGS.ANIMATIONS]: true,
  [FLAGS.AI_SUGGESTIONS]: false, // Experimental - off by default
  [FLAGS.VOICE_COMMANDS]: false, // Experimental - off by default
  [FLAGS.AR_NAVIGATION]: false, // Experimental - off by default
  [FLAGS.VERBOSE_LOGGING]: false, // Debug - off by default
  [FLAGS.PERFORMANCE_OVERLAY]: false, // Debug - off by default
};

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children, userId }) => {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const flagNames = Object.values(FLAGS);
      const response = await fetch(`${API_BASE_URL}/feature-flags/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flags: flagNames,
          userId: userId || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const loadedFlags = data.flags || {};

      // Merge with defaults (API flags take precedence)
      setFlags({ ...DEFAULT_FLAGS, ...loadedFlags });
    } catch (err) {
      console.warn('Failed to load feature flags, using defaults:', err);
      setError(err instanceof Error ? err.message : 'Failed to load flags');
      // Keep using default flags on error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const isEnabled = useCallback((flagName: string): boolean => {
    return flags[flagName] ?? false;
  }, [flags]);

  const refresh = useCallback(async () => {
    await loadFlags();
  }, [loadFlags]);

  return (
    <FeatureFlagContext.Provider value={{ flags, loading, error, isEnabled, refresh }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlagContext = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within a FeatureFlagProvider');
  }
  return context;
};

// Convenience hook for checking a single flag
export const useFeatureFlag = (flagName: string): boolean => {
  const { isEnabled } = useFeatureFlagContext();
  return isEnabled(flagName);
};
