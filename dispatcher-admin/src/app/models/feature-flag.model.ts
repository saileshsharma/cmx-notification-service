/**
 * Feature flag entity from the backend
 */
export interface FeatureFlag {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  environment: 'all' | 'production' | 'development';
  rolloutPercentage: number;
  variantName?: string;
  variantPayload?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extended flag with UI-specific state
 */
export interface FeatureFlagUI extends FeatureFlag {
  toggling: boolean;
  selected: boolean;
}

/**
 * Category grouping of flags
 */
export interface FlagCategory {
  name: string;
  prefix: string;
  icon: string;
  flags: FeatureFlagUI[];
  expanded: boolean;
  platform: Platform;
}

/**
 * Platform types for filtering
 */
export type Platform = 'frontend' | 'mobile' | 'shared';

/**
 * Platform tab for navigation
 */
export interface PlatformTab {
  id: 'all' | Platform;
  label: string;
  icon: string;
  count: number;
}

/**
 * View mode options
 */
export type ViewMode = 'grid' | 'list' | 'compact';

/**
 * Sort options
 */
export type SortBy = 'name' | 'updated' | 'status' | 'environment';

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: number;
  flagName: string;
  action: AuditAction;
  previousValue?: boolean;
  newValue?: boolean;
  timestamp: Date;
  user: string;
}

export type AuditAction = 'enabled' | 'disabled' | 'created' | 'updated' | 'deleted';

/**
 * System health status
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  apiLatency: number;
  lastCheck: Date;
  uptime: string;
}

/**
 * Toast notification
 */
export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

/**
 * Create flag request payload
 */
export interface CreateFlagRequest {
  name: string;
  description: string;
  environment: 'all' | 'production' | 'development';
  rolloutPercentage: number;
  enabled: boolean;
}

/**
 * Category configuration
 */
export interface CategoryConfig {
  prefix: string;
  name: string;
  icon: string;
  platform: Platform;
}
