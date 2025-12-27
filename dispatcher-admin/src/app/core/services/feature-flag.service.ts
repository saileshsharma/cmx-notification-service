import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, tap, map, BehaviorSubject, retry, shareReplay } from 'rxjs';
import {
  FeatureFlag,
  FeatureFlagUI,
  FlagCategory,
  CreateFlagRequest,
  Platform,
  SortBy,
  CategoryConfig
} from '../../models';
import { environment, APP_CONFIG } from '../config/environment';

/**
 * Enterprise-grade Feature Flag Service
 *
 * Responsibilities:
 * - CRUD operations for feature flags
 * - Caching and state management
 * - Category organization
 * - Error handling with retry logic
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private readonly apiUrl = `${environment.apiBaseUrl}/feature-flags`;

  // Reactive state using Angular signals
  private readonly _flags = signal<FeatureFlagUI[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _lastSync = signal<Date>(new Date());

  // Public readonly signals
  readonly flags = this._flags.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly lastSync = this._lastSync.asReadonly();

  // Computed values
  readonly totalCount = computed(() => this._flags().length);
  readonly enabledCount = computed(() => this._flags().filter(f => f.enabled).length);
  readonly disabledCount = computed(() => this._flags().filter(f => !f.enabled).length);

  // Categories computed from flags
  readonly categories = computed(() => this.organizeByCategory(this._flags()));

  // Cache for API responses
  private flagsCache$: Observable<FeatureFlag[]> | null = null;
  private cacheTime: number = 0;

  constructor(private http: HttpClient) {}

  /**
   * Load all feature flags from the backend
   */
  loadFlags(forceRefresh = false): Observable<FeatureFlag[]> {
    // Return cached response if valid
    const now = Date.now();
    if (!forceRefresh && this.flagsCache$ && (now - this.cacheTime) < environment.cacheTimeout) {
      return this.flagsCache$;
    }

    this._loading.set(true);
    this._error.set(null);

    this.flagsCache$ = this.http.get<FeatureFlag[]>(this.apiUrl).pipe(
      retry({ count: 2, delay: 1000 }),
      tap(flags => {
        const uiFlags: FeatureFlagUI[] = flags.map(f => ({
          ...f,
          toggling: false,
          selected: false
        }));
        this._flags.set(uiFlags);
        this._loading.set(false);
        this._lastSync.set(new Date());
        this.cacheTime = Date.now();
      }),
      catchError(error => {
        this._loading.set(false);
        this._error.set(this.getErrorMessage(error));
        this.flagsCache$ = null;
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    return this.flagsCache$;
  }

  /**
   * Toggle a feature flag on/off
   */
  toggleFlag(flag: FeatureFlagUI): Observable<FeatureFlag> {
    // Optimistic update
    this.updateFlagState(flag.id, { toggling: true });

    return this.http.post<FeatureFlag>(`${this.apiUrl}/${flag.id}/toggle`, {}).pipe(
      tap(updated => {
        this.updateFlagState(flag.id, {
          enabled: updated.enabled,
          updatedAt: updated.updatedAt,
          toggling: false
        });
        this.invalidateCache();
      }),
      catchError(error => {
        this.updateFlagState(flag.id, { toggling: false });
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new feature flag
   */
  createFlag(request: CreateFlagRequest): Observable<FeatureFlag> {
    return this.http.post<FeatureFlag>(this.apiUrl, request).pipe(
      tap(created => {
        const uiFlag: FeatureFlagUI = {
          ...created,
          toggling: false,
          selected: false
        };
        this._flags.update(flags => [...flags, uiFlag]);
        this.invalidateCache();
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a feature flag
   */
  updateFlag(id: number, updates: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.put<FeatureFlag>(`${this.apiUrl}/${id}`, updates).pipe(
      tap(updated => {
        this.updateFlagState(id, updated);
        this.invalidateCache();
      })
    );
  }

  /**
   * Delete a feature flag
   */
  deleteFlag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._flags.update(flags => flags.filter(f => f.id !== id));
        this.invalidateCache();
      })
    );
  }

  /**
   * Toggle selection state for a flag
   */
  toggleSelection(flagId: number): void {
    this.updateFlagState(flagId, flag => ({ selected: !flag.selected }));
  }

  /**
   * Select all visible flags
   */
  selectAll(flagIds: number[]): void {
    this._flags.update(flags =>
      flags.map(f => ({
        ...f,
        selected: flagIds.includes(f.id)
      }))
    );
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this._flags.update(flags =>
      flags.map(f => ({ ...f, selected: false }))
    );
  }

  /**
   * Get selected flags
   */
  getSelectedFlags(): FeatureFlagUI[] {
    return this._flags().filter(f => f.selected);
  }

  /**
   * Filter flags by platform and search query
   */
  filterFlags(
    platform: 'all' | Platform,
    searchQuery: string,
    quickFilter: string | null,
    sortBy: SortBy
  ): FlagCategory[] {
    let categories = this.categories();

    // Filter by platform
    if (platform !== 'all') {
      categories = categories.filter(c => c.platform === platform);
    }

    // Apply quick filter
    if (quickFilter) {
      categories = categories.map(category => ({
        ...category,
        flags: category.flags.filter(f => {
          switch (quickFilter) {
            case 'enabled': return f.enabled;
            case 'disabled': return !f.enabled;
            case 'production': return f.environment === 'production';
            case 'development': return f.environment === 'development';
            default: return true;
          }
        })
      })).filter(c => c.flags.length > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      categories = categories.map(category => ({
        ...category,
        flags: category.flags.filter(f =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
        )
      })).filter(c => c.flags.length > 0);
    }

    // Apply sorting
    categories = categories.map(category => ({
      ...category,
      flags: this.sortFlagsArray(category.flags, sortBy)
    }));

    return categories;
  }

  /**
   * Get platform counts
   */
  getPlatformCounts(): Record<string, number> {
    const categories = this.categories();
    return {
      all: this._flags().length,
      frontend: categories.filter(c => c.platform === 'frontend').reduce((sum, c) => sum + c.flags.length, 0),
      mobile: categories.filter(c => c.platform === 'mobile').reduce((sum, c) => sum + c.flags.length, 0),
      shared: categories.filter(c => c.platform === 'shared').reduce((sum, c) => sum + c.flags.length, 0)
    };
  }

  /**
   * Health check - ping the API
   */
  healthCheck(): Observable<{ latency: number; healthy: boolean }> {
    const startTime = Date.now();
    return this.http.get<FeatureFlag[]>(this.apiUrl).pipe(
      map(() => ({
        latency: Date.now() - startTime,
        healthy: true
      })),
      catchError(() => {
        return [{
          latency: Date.now() - startTime,
          healthy: false
        }] as unknown as Observable<{ latency: number; healthy: boolean }>;
      })
    );
  }

  /**
   * Organize flags into categories
   *
   * Supports both:
   * - Prefixed names: ui.dark-mode, mobile.offline-sync
   * - Simple names: dark-mode, offline-sync (matched by keywords)
   */
  private organizeByCategory(flags: FeatureFlagUI[]): FlagCategory[] {
    // Keyword-based category matching for flags without prefixes
    const categoryKeywords: Record<string, string[]> = {
      'ui': ['dark-mode', 'navigation', 'theme', 'compact', 'animation', 'skeleton', 'loading'],
      'reports': ['report', 'export', 'pdf', 'excel', 'analytics', 'dashboard'],
      'mobile': ['mobile', 'offline', 'biometric', 'haptic', 'swipe', 'pull-to-refresh', 'background-sync'],
      'location': ['location', 'gps', 'tracking', 'geofencing', 'route', 'traffic', 'eta', 'real-time-tracking'],
      'media': ['photo', 'image', 'video', 'camera', 'media', 'document-scan', 'capture'],
      'signature': ['signature'],
      'appointments': ['appointment', 'scheduling', 'calendar', 'recurring', 'bulk-create', 'drag-drop', 'conflict'],
      'surveyor': ['surveyor', 'availability', 'territory', 'skills', 'workload', 'performance-metrics'],
      'notifications': ['notification', 'push', 'sms', 'email', 'in-app', 'quiet-hours'],
      'chat': ['chat', 'message', 'voice-messages', 'typing', 'read-receipts', 'attachments'],
      'perf': ['lazy-loading', 'cache', 'optimization', 'batching', 'performance'],
      'security': ['session', 'timeout', 'audit', 'two-factor', 'auth', 'login', 'pin-lock'],
      'api': ['api', 'webhook', 'endpoint'],
      'integration': ['integration', 'google', 'outlook', 'slack', 'calendar-sync'],
      'experimental': ['experimental', 'ai', 'voice-commands', 'ar-navigation'],
      'debug': ['debug', 'verbose', 'logging', 'overlay'],
      'maintenance': ['maintenance'],
    };

    const categoryConfigs = APP_CONFIG.categories;
    const categorizedFlags = new Set<number>();

    const categories: FlagCategory[] = categoryConfigs.map(config => {
      const matchedFlags = flags.filter(f => {
        // First check prefix match
        if (f.name.startsWith(config.prefix + '.')) {
          return true;
        }
        // Then check keyword match for non-prefixed names
        const keywords = categoryKeywords[config.prefix] || [];
        const flagLower = f.name.toLowerCase();
        return keywords.some(kw => flagLower.includes(kw.toLowerCase()));
      });

      // Mark these flags as categorized
      matchedFlags.forEach(f => categorizedFlags.add(f.id));

      return {
        ...config,
        flags: matchedFlags,
        expanded: true
      };
    });

    // Handle uncategorized flags
    const otherFlags = flags.filter(f => !categorizedFlags.has(f.id));

    if (otherFlags.length > 0) {
      categories.push({
        name: 'Other',
        prefix: 'other',
        icon: '\u{1F4E6}',
        flags: otherFlags,
        expanded: true,
        platform: 'shared'
      });
    }

    return categories.filter(c => c.flags.length > 0);
  }

  /**
   * Sort flags array
   */
  private sortFlagsArray(flags: FeatureFlagUI[], sortBy: SortBy): FeatureFlagUI[] {
    return [...flags].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'status':
          return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0);
        case 'environment':
          return a.environment.localeCompare(b.environment);
        default:
          return 0;
      }
    });
  }

  /**
   * Update flag state in the signal
   */
  private updateFlagState(
    id: number,
    updates: Partial<FeatureFlagUI> | ((flag: FeatureFlagUI) => Partial<FeatureFlagUI>)
  ): void {
    this._flags.update(flags =>
      flags.map(f => {
        if (f.id !== id) return f;
        const patch = typeof updates === 'function' ? updates(f) : updates;
        return { ...f, ...patch };
      })
    );
  }

  /**
   * Invalidate the cache
   */
  private invalidateCache(): void {
    this.flagsCache$ = null;
    this.cacheTime = 0;
  }

  /**
   * Extract error message from HTTP error
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your network connection.';
    }
    if (error.status === 401) {
      return 'Authentication required. Please log in.';
    }
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.message || 'An unexpected error occurred.';
  }
}
