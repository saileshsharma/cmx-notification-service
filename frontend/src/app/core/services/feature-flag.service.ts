import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, catchError, map } from 'rxjs';
import { API_BASE } from './api-config';

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface VariantResponse {
  name: string;
  enabled: boolean;
  variantName: string;
  payload?: string;
}

export interface FeatureFlag {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  rolloutPercentage: number;
  variantName?: string;
  variantPayload?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private readonly apiBase = API_BASE;

  // Cache of feature flags
  private flagsCache = new BehaviorSubject<FeatureFlags>({});
  private userId: number | null = null;
  private initialized = false;

  // Public observable for components to subscribe to
  flags$ = this.flagsCache.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Initialize the feature flag service with user context.
   * Call this on app initialization after user login.
   */
  initialize(userId?: number): Observable<FeatureFlags> {
    this.userId = userId || null;
    return this.loadFlags([
      // Appointments
      'bulk-create-appointments',
      'recurring-appointments',
      'drag-drop-scheduling',
      'auto-assign-surveyor',
      'conflict-detection',
      'eta-tracking',

      // Surveyor Features
      'availability-calendar',
      'territory-management',
      'skills-matrix',
      'performance-metrics',
      'workload-balancing',

      // Notifications
      'push-notifications',
      'sms-notifications',
      'email-notifications',
      'in-app-notifications',
      'quiet-hours',

      // Chat
      'chat-v2',
      'chat-attachments',
      'voice-messages',
      'read-receipts',
      'typing-indicators',
      'group-chat',

      // Reports
      'pdf-export',
      'excel-export',
      'scheduled-reports',
      'custom-report-templates',
      'analytics-dashboard',

      // Location
      'real-time-tracking',
      'geofencing',
      'route-optimization',
      'traffic-integration',

      // UI/UX
      'dark-mode',
      'new-navigation',
      'compact-mode',
      'animations-enabled',
      'skeleton-loading',

      // Performance
      'lazy-loading',
      'image-optimization',
      'request-batching',
      'cache-first',

      // Security
      'session-timeout-warning',
      'audit-log-viewer',
      'two-factor-auth',

      // Integrations
      'google-maps-integration',
      'google-calendar-sync',
      'outlook-calendar-sync',
      'slack-integration',
      'webhook-notifications',

      // Experimental
      'ai-suggestions',
      'voice-commands',
    ]);
  }

  /**
   * Load multiple flags at once (batch request).
   */
  loadFlags(flagNames: string[]): Observable<FeatureFlags> {
    const body = {
      flags: flagNames,
      userId: this.userId
    };

    return this.http.post<{ flags: FeatureFlags }>(`${this.apiBase}/feature-flags/batch`, body).pipe(
      map(response => response.flags),
      tap(flags => {
        const current = this.flagsCache.value;
        this.flagsCache.next({ ...current, ...flags });
        this.initialized = true;
      }),
      catchError(error => {
        console.warn('Failed to load feature flags, using defaults (enabled)', error);
        // Default to true (enabled) so features work by default until explicitly disabled
        const defaults: FeatureFlags = {};
        flagNames.forEach(name => defaults[name] = true);
        return of(defaults);
      })
    );
  }

  /**
   * Check if a feature is enabled.
   * Returns cached value if available, otherwise fetches from server.
   */
  isEnabled(flagName: string, defaultValue = false): boolean {
    const cached = this.flagsCache.value[flagName];
    if (cached !== undefined) {
      return cached;
    }
    // If not cached, return default and fetch in background
    this.fetchFlag(flagName).subscribe();
    return defaultValue;
  }

  /**
   * Check if a feature is enabled (async version).
   */
  isEnabled$(flagName: string): Observable<boolean> {
    const cached = this.flagsCache.value[flagName];
    if (cached !== undefined) {
      return of(cached);
    }
    return this.fetchFlag(flagName);
  }

  /**
   * Fetch a single flag from the server.
   */
  private fetchFlag(flagName: string): Observable<boolean> {
    let url = `${this.apiBase}/feature-flags/${flagName}`;
    if (this.userId) {
      url += `?userId=${this.userId}`;
    }

    return this.http.get<{ name: string; enabled: boolean }>(url).pipe(
      map(response => response.enabled),
      tap(enabled => {
        const current = this.flagsCache.value;
        this.flagsCache.next({ ...current, [flagName]: enabled });
      }),
      catchError(error => {
        console.warn(`Failed to fetch flag ${flagName}`, error);
        // Default to true (enabled) so feature works by default
        return of(true);
      })
    );
  }

  /**
   * Get variant for A/B testing.
   */
  getVariant(flagName: string): Observable<VariantResponse> {
    let url = `${this.apiBase}/feature-flags/${flagName}/variant`;
    if (this.userId) {
      url += `?userId=${this.userId}`;
    }

    return this.http.get<VariantResponse>(url).pipe(
      catchError(error => {
        console.warn(`Failed to fetch variant for ${flagName}`, error);
        return of({
          name: flagName,
          enabled: false,
          variantName: 'disabled'
        });
      })
    );
  }

  /**
   * Set the user ID for user-specific flags.
   */
  setUserId(userId: number): void {
    if (this.userId !== userId) {
      this.userId = userId;
      if (this.initialized) {
        const flagNames = Object.keys(this.flagsCache.value);
        if (flagNames.length > 0) {
          this.loadFlags(flagNames).subscribe();
        }
      }
    }
  }

  /**
   * Clear user context (on logout).
   */
  clearUser(): void {
    this.userId = null;
    this.flagsCache.next({});
    this.initialized = false;
  }

  /**
   * Force refresh all cached flags.
   */
  refresh(): Observable<FeatureFlags> {
    const flagNames = Object.keys(this.flagsCache.value);
    if (flagNames.length === 0) {
      return of({});
    }
    return this.loadFlags(flagNames);
  }

  // ==================== Admin Methods ====================

  /**
   * Get all feature flags (admin).
   */
  getAllFlags(): Observable<FeatureFlag[]> {
    return this.http.get<FeatureFlag[]>(`${this.apiBase}/feature-flags`);
  }

  /**
   * Create a new flag (admin).
   */
  createFlag(flag: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.post<FeatureFlag>(`${this.apiBase}/feature-flags`, flag);
  }

  /**
   * Update a flag (admin).
   */
  updateFlag(id: number, flag: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.put<FeatureFlag>(`${this.apiBase}/feature-flags/${id}`, flag);
  }

  /**
   * Toggle a flag (admin).
   */
  toggleFlag(id: number): Observable<FeatureFlag> {
    return this.http.post<FeatureFlag>(`${this.apiBase}/feature-flags/${id}/toggle`, {});
  }
}
