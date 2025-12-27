/**
 * Environment configuration
 * Enterprise-grade environment management
 */

export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  healthCheckInterval: number;
  cacheTimeout: number;
  maxAuditLogEntries: number;
  toastDuration: number;
}

/**
 * Detect if running in local development
 */
function isLocalDevelopment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Production environment configuration
 */
const productionConfig: Environment = {
  production: true,
  apiBaseUrl: 'https://cmx-notification-be-production.up.railway.app/api',
  healthCheckInterval: 30000,
  cacheTimeout: 300000, // 5 minutes
  maxAuditLogEntries: 100,
  toastDuration: 5000,
};

/**
 * Development environment configuration
 */
const developmentConfig: Environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  healthCheckInterval: 30000,
  cacheTimeout: 60000, // 1 minute
  maxAuditLogEntries: 50,
  toastDuration: 5000,
};

/**
 * Get the current environment configuration
 */
export function getEnvironment(): Environment {
  return isLocalDevelopment() ? developmentConfig : productionConfig;
}

/**
 * Application-wide configuration constants
 */
export const APP_CONFIG = {
  appName: 'Dispatcher Admin',
  version: '3.0.0',

  // Feature flag categories
  categories: [
    { prefix: 'ui', name: 'UI/UX', icon: '\u{1F3A8}', platform: 'frontend' as const },
    { prefix: 'reports', name: 'Reports', icon: '\u{1F4CA}', platform: 'frontend' as const },
    { prefix: 'mobile', name: 'Mobile Features', icon: '\u{1F4F1}', platform: 'mobile' as const },
    { prefix: 'location', name: 'Location/GPS', icon: '\u{1F4CD}', platform: 'mobile' as const },
    { prefix: 'media', name: 'Photos/Media', icon: '\u{1F4F7}', platform: 'mobile' as const },
    { prefix: 'signature', name: 'Signatures', icon: '\u{270D}', platform: 'mobile' as const },
    { prefix: 'appointments', name: 'Appointments', icon: '\u{1F4C5}', platform: 'shared' as const },
    { prefix: 'surveyor', name: 'Surveyor Features', icon: '\u{1F477}', platform: 'shared' as const },
    { prefix: 'notifications', name: 'Notifications', icon: '\u{1F514}', platform: 'shared' as const },
    { prefix: 'chat', name: 'Chat', icon: '\u{1F4AC}', platform: 'shared' as const },
    { prefix: 'perf', name: 'Performance', icon: '\u{26A1}', platform: 'shared' as const },
    { prefix: 'security', name: 'Security', icon: '\u{1F512}', platform: 'shared' as const },
    { prefix: 'api', name: 'API/Backend', icon: '\u{1F5A5}', platform: 'shared' as const },
    { prefix: 'integration', name: 'Integrations', icon: '\u{1F517}', platform: 'shared' as const },
    { prefix: 'experimental', name: 'Experimental', icon: '\u{1F9EA}', platform: 'shared' as const },
    { prefix: 'debug', name: 'Debug', icon: '\u{1F41E}', platform: 'shared' as const },
    { prefix: 'maintenance', name: 'Maintenance', icon: '\u{1F527}', platform: 'shared' as const },
  ],

  // Platform tabs
  platformTabs: [
    { id: 'all' as const, label: 'All Platforms', icon: '&#127760;' },
    { id: 'frontend' as const, label: 'Frontend', icon: '&#128421;' },
    { id: 'mobile' as const, label: 'Mobile', icon: '&#128241;' },
    { id: 'shared' as const, label: 'Shared', icon: '&#128279;' },
  ],

  // External links
  frontendAppUrl: 'https://cmx-notification-fe-production.up.railway.app',
} as const;

export const environment = getEnvironment();
