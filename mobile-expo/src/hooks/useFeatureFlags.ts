import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface VariantResponse {
  name: string;
  enabled: boolean;
  variantName: string;
  payload?: string;
}

// Default feature flags to load on initialization
const DEFAULT_FLAGS = [
  // Appointments
  'bulk-create-appointments',
  'recurring-appointments',
  'eta-tracking',

  // Surveyor Features
  'availability-calendar',
  'performance-metrics',

  // Notifications
  'push-notifications',
  'sms-notifications',
  'in-app-notifications',
  'quiet-hours',

  // Chat
  'chat-v2',
  'chat-attachments',
  'voice-messages',
  'read-receipts',
  'typing-indicators',

  // Reports
  'pdf-export',

  // Location
  'real-time-tracking',
  'geofencing',
  'route-optimization',

  // Photos/Media
  'photo-capture',
  'photo-annotation',
  'video-capture',
  'document-scan',

  // Signatures
  'signature-capture',
  'signature-required',

  // UI/UX
  'dark-mode',
  'new-navigation',
  'animations-enabled',
  'skeleton-loading',

  // Mobile Specific
  'biometric-login',
  'offline-mode',
  'background-sync',
  'haptic-feedback',
  'pull-to-refresh',
  'swipe-actions',

  // Performance
  'lazy-loading',
  'image-optimization',
  'cache-first',

  // Security
  'session-timeout-warning',
  'pin-lock-enabled',

  // Experimental
  'ai-suggestions',
  'voice-commands',
  'ar-navigation',

  // Debug (usually disabled in production)
  'verbose-logging',
  'performance-overlay',
];

let flagsCache: FeatureFlags = {};
let isInitialized = false;

/**
 * Hook for accessing feature flags in React Native components.
 *
 * Usage:
 * const { isEnabled, getVariant, refresh } = useFeatureFlags(userId);
 *
 * if (isEnabled('dark-mode')) {
 *   // Apply dark theme
 * }
 */
export function useFeatureFlags(userId?: number) {
  const [flags, setFlags] = useState<FeatureFlags>(flagsCache);
  const [loading, setLoading] = useState(!isInitialized);
  const [error, setError] = useState<string | null>(null);

  // Load flags on mount
  useEffect(() => {
    if (!isInitialized) {
      loadFlags(DEFAULT_FLAGS, userId)
        .then(loadedFlags => {
          flagsCache = { ...flagsCache, ...loadedFlags };
          setFlags(flagsCache);
          isInitialized = true;
          setLoading(false);
        })
        .catch(err => {
          console.warn('Failed to load feature flags:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [userId]);

  // Reload flags when userId changes
  useEffect(() => {
    if (isInitialized && userId) {
      loadFlags(Object.keys(flagsCache), userId)
        .then(loadedFlags => {
          flagsCache = loadedFlags;
          setFlags(flagsCache);
        })
        .catch(console.warn);
    }
  }, [userId]);

  /**
   * Check if a feature is enabled.
   */
  const isEnabled = useCallback((flagName: string, defaultValue = false): boolean => {
    if (flags[flagName] !== undefined) {
      return flags[flagName];
    }
    return defaultValue;
  }, [flags]);

  /**
   * Check if a feature is enabled (async version that fetches if not cached).
   */
  const isEnabledAsync = useCallback(async (flagName: string): Promise<boolean> => {
    if (flags[flagName] !== undefined) {
      return flags[flagName];
    }

    try {
      let url = `${API_BASE_URL}/feature-flags/${flagName}`;
      if (userId) {
        url += `?userId=${userId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Update cache
      flagsCache[flagName] = data.enabled;
      setFlags({ ...flagsCache });

      return data.enabled;
    } catch (err) {
      console.warn(`Failed to fetch flag ${flagName}:`, err);
      return false;
    }
  }, [flags, userId]);

  /**
   * Get variant for A/B testing.
   */
  const getVariant = useCallback(async (flagName: string): Promise<VariantResponse> => {
    try {
      let url = `${API_BASE_URL}/feature-flags/${flagName}/variant`;
      if (userId) {
        url += `?userId=${userId}`;
      }

      const response = await fetch(url);
      return await response.json();
    } catch (err) {
      console.warn(`Failed to fetch variant for ${flagName}:`, err);
      return {
        name: flagName,
        enabled: false,
        variantName: 'disabled',
      };
    }
  }, [userId]);

  /**
   * Force refresh all cached flags.
   */
  const refresh = useCallback(async (): Promise<void> => {
    const flagNames = Object.keys(flagsCache);
    if (flagNames.length === 0) return;

    try {
      const loadedFlags = await loadFlags(flagNames, userId);
      flagsCache = loadedFlags;
      setFlags(flagsCache);
    } catch (err) {
      console.warn('Failed to refresh flags:', err);
    }
  }, [userId]);

  return {
    flags,
    loading,
    error,
    isEnabled,
    isEnabledAsync,
    getVariant,
    refresh,
  };
}

/**
 * Load multiple flags at once (batch request).
 */
async function loadFlags(flagNames: string[], userId?: number): Promise<FeatureFlags> {
  try {
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

    const data = await response.json();
    return data.flags || {};
  } catch (err) {
    console.warn('Failed to load feature flags, using defaults (enabled):', err);
    // Default to true (enabled) so features work by default until explicitly disabled
    const defaults: FeatureFlags = {};
    flagNames.forEach(name => defaults[name] = true);
    return defaults;
  }
}

/**
 * Clear all cached flags (call on logout).
 */
export function clearFeatureFlagsCache(): void {
  flagsCache = {};
  isInitialized = false;
}
