/**
 * API Configuration
 * Centralized configuration with environment variable support
 * All sensitive keys are loaded from environment variables
 */
import Constants from 'expo-constants';

// Environment-based configuration
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Try Expo Constants extra (from app.config.js)
  const extraValue = Constants.expoConfig?.extra?.[key];
  if (extraValue) return extraValue;

  // Try process.env (for local development)
  const processValue = process.env[key];
  if (processValue) return processValue;

  return defaultValue;
};

// API Configuration
// Use EXPO_PUBLIC_ prefix for public environment variables in Expo
export const API_BASE_URL = getEnvVar(
  'EXPO_PUBLIC_API_BASE_URL',
  'https://cmx-notification-be-production.up.railway.app/api'
);

// QStash Configuration
export const QSTASH_TOKEN = getEnvVar('EXPO_PUBLIC_QSTASH_TOKEN', '');
export const QSTASH_DESTINATION_URL = getEnvVar(
  'EXPO_PUBLIC_QSTASH_DESTINATION_URL',
  'https://cmx-notification-be-production.up.railway.app/api/webhook/qstash/location'
);

// Image Upload Configuration (ImgBB)
export const IMGBB_API_KEY = getEnvVar('EXPO_PUBLIC_IMGBB_API_KEY', '');

// Feature flags
export const ENABLE_OFFLINE_MODE = getEnvVar('EXPO_PUBLIC_ENABLE_OFFLINE_MODE', 'true') === 'true';
export const ENABLE_BACKGROUND_SYNC = getEnvVar('EXPO_PUBLIC_ENABLE_BACKGROUND_SYNC', 'true') === 'true';

// API Timeouts (in milliseconds)
export const API_TIMEOUTS = {
  default: 30000,      // 30 seconds
  login: 15000,        // 15 seconds
  upload: 120000,      // 2 minutes
  location: 10000,     // 10 seconds
  chat: 10000,         // 10 seconds
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,     // 1 second
  maxDelay: 30000,     // 30 seconds
  jitterFactor: 0.3,   // 30% jitter
} as const;

// Circuit breaker configuration
export const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,      // Open circuit after 5 failures
  successThreshold: 2,      // Close circuit after 2 successes
  timeout: 30000,           // 30 seconds in open state before trying again
} as const;

// Validate required configuration
export const validateConfig = (): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];

  if (!QSTASH_TOKEN) {
    missing.push('EXPO_PUBLIC_QSTASH_TOKEN');
  }

  if (!IMGBB_API_KEY) {
    missing.push('EXPO_PUBLIC_IMGBB_API_KEY');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
};
