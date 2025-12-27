import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, of, tap, catchError, map } from 'rxjs';
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

  // Angular Signals for state management
  private flagsCacheSignal = signal<FeatureFlags>({});
  private userIdSignal = signal<number | null>(null);
  private initializedSignal = signal<boolean>(false);

  // Public signals (readonly)
  readonly flags = this.flagsCacheSignal.asReadonly();
  readonly userId = this.userIdSignal.asReadonly();
  readonly initialized = this.initializedSignal.asReadonly();

  // Computed signals for specific feature checks
  readonly isDarkModeEnabled = computed(() => this.flagsCacheSignal()['dark-mode'] ?? false);
  readonly isAnalyticsDashboardEnabled = computed(() => this.flagsCacheSignal()['analytics-dashboard'] ?? false);
  readonly isChatV2Enabled = computed(() => this.flagsCacheSignal()['chat-v2'] ?? false);
  readonly isPushNotificationsEnabled = computed(() => this.flagsCacheSignal()['push-notifications'] ?? false);

  // Observable bridge for backward compatibility
  flags$ = toObservable(this.flags);

  constructor(private http: HttpClient) {}

  /**
   * Initialize the feature flag service with user context.
   * Call this on app initialization after user login.
   */
  initialize(userId?: number): Observable<FeatureFlags> {
    this.userIdSignal.set(userId || null);
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
      userId: this.userIdSignal()
    };

    return this.http.post<{ flags: FeatureFlags }>(`${this.apiBase}/feature-flags/batch`, body).pipe(
      map(response => response.flags),
      tap(flags => {
        this.flagsCacheSignal.update(current => ({ ...current, ...flags }));
        this.initializedSignal.set(true);
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
   * Check if a feature is enabled (signal-based).
   * Returns cached value if available.
   */
  isEnabled(flagName: string, defaultValue = false): boolean {
    const cached = this.flagsCacheSignal()[flagName];
    if (cached !== undefined) {
      return cached;
    }
    // If not cached, return default and fetch in background
    this.fetchFlag(flagName).subscribe();
    return defaultValue;
  }

  /**
   * Get a computed signal for a specific feature flag.
   * Use this in templates with signal-based components.
   */
  isEnabledSignal(flagName: string): () => boolean {
    return computed(() => this.flagsCacheSignal()[flagName] ?? false);
  }

  /**
   * Check if a feature is enabled (async version).
   */
  isEnabled$(flagName: string): Observable<boolean> {
    const cached = this.flagsCacheSignal()[flagName];
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
    const userId = this.userIdSignal();
    if (userId) {
      url += `?userId=${userId}`;
    }

    return this.http.get<{ name: string; enabled: boolean }>(url).pipe(
      map(response => response.enabled),
      tap(enabled => {
        this.flagsCacheSignal.update(current => ({ ...current, [flagName]: enabled }));
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
    const userId = this.userIdSignal();
    if (userId) {
      url += `?userId=${userId}`;
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
    const currentUserId = this.userIdSignal();
    if (currentUserId !== userId) {
      this.userIdSignal.set(userId);
      if (this.initializedSignal()) {
        const flagNames = Object.keys(this.flagsCacheSignal());
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
    this.userIdSignal.set(null);
    this.flagsCacheSignal.set({});
    this.initializedSignal.set(false);
  }

  /**
   * Force refresh all cached flags.
   */
  refresh(): Observable<FeatureFlags> {
    const flagNames = Object.keys(this.flagsCacheSignal());
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
