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
  payloadType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private readonly apiBase = API_BASE;

  // Cache of feature flags
  private flagsCache = new BehaviorSubject<FeatureFlags>({});
  private userId: string | null = null;
  private initialized = false;

  // Public observable for components to subscribe to
  flags$ = this.flagsCache.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Initialize the feature flag service with user context.
   * Call this on app initialization after user login.
   */
  initialize(userId?: string): Observable<FeatureFlags> {
    this.userId = userId || null;
    return this.loadFlags([
      // Add your feature flags here
      'new-dashboard',
      'chat-v2',
      'real-time-tracking',
      'dark-mode',
      'export-reports',
      'bulk-assignment',
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
        console.warn('Failed to load feature flags, using defaults', error);
        // Return all flags as false on error
        const defaults: FeatureFlags = {};
        flagNames.forEach(name => defaults[name] = false);
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
      url += `?userId=${encodeURIComponent(this.userId)}`;
    }

    return this.http.get<{ name: string; enabled: boolean }>(url).pipe(
      map(response => response.enabled),
      tap(enabled => {
        const current = this.flagsCache.value;
        this.flagsCache.next({ ...current, [flagName]: enabled });
      }),
      catchError(error => {
        console.warn(`Failed to fetch flag ${flagName}`, error);
        return of(false);
      })
    );
  }

  /**
   * Get variant for A/B testing.
   */
  getVariant(flagName: string): Observable<VariantResponse> {
    let url = `${this.apiBase}/feature-flags/${flagName}/variant`;
    if (this.userId) {
      url += `?userId=${encodeURIComponent(this.userId)}`;
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
  setUserId(userId: string): void {
    if (this.userId !== userId) {
      this.userId = userId;
      // Refresh flags with new user context
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
}
