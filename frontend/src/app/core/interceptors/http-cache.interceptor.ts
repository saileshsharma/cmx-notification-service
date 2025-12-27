import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay, finalize } from 'rxjs/operators';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
  expiresAt: number;
}

/**
 * HTTP Cache Interceptor
 *
 * Provides:
 * 1. Request deduplication - multiple identical GET requests share the same observable
 * 2. Response caching - caches GET responses with configurable TTL
 * 3. Cache invalidation - automatically clears stale entries
 *
 * Usage:
 * - All GET requests are eligible for caching
 * - POST/PUT/DELETE requests invalidate related cached entries
 * - Add 'X-Skip-Cache: true' header to bypass caching
 * - Default TTL is 30 seconds, configurable per request with 'X-Cache-TTL' header (in seconds)
 */
@Injectable()
export class HttpCacheInterceptor implements HttpInterceptor {
  // In-flight request deduplication map
  private inFlightRequests = new Map<string, Observable<HttpEvent<any>>>();

  // Response cache
  private cache = new Map<string, CacheEntry>();

  // Default cache TTL in milliseconds (30 seconds)
  private readonly DEFAULT_TTL = 30 * 1000;

  // Maximum cache size
  private readonly MAX_CACHE_SIZE = 100;

  // Endpoints that should not be cached
  private readonly NON_CACHEABLE_PATTERNS = [
    '/auth/',
    '/login',
    '/logout',
    '/token',
    '/health',
    '/activity'
  ];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (request.method !== 'GET') {
      // Invalidate cache for mutation requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        this.invalidateRelatedCache(request.url);
      }
      return next.handle(request);
    }

    // Check if caching should be skipped
    if (this.shouldSkipCache(request)) {
      return next.handle(request);
    }

    const cacheKey = this.getCacheKey(request);

    // Check for cached response
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      // Return cached response
      return of(cachedEntry.response.clone());
    }

    // Check for in-flight request (deduplication)
    const inFlight = this.inFlightRequests.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    // Get TTL from header or use default
    const ttl = this.getTTL(request);

    // Make the request and cache the response
    const request$ = next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cacheResponse(cacheKey, event, ttl);
        }
      }),
      shareReplay(1),
      finalize(() => {
        // Remove from in-flight map when complete
        this.inFlightRequests.delete(cacheKey);
      })
    );

    // Add to in-flight map
    this.inFlightRequests.set(cacheKey, request$);

    return request$;
  }

  /**
   * Generate a unique cache key for the request
   */
  private getCacheKey(request: HttpRequest<any>): string {
    // Include URL and sorted query params
    const params = request.params.toString();
    return `${request.urlWithParams}`;
  }

  /**
   * Check if the request should skip caching
   */
  private shouldSkipCache(request: HttpRequest<any>): boolean {
    // Skip if explicitly requested
    if (request.headers.has('X-Skip-Cache')) {
      return true;
    }

    // Skip non-cacheable endpoints
    const url = request.url.toLowerCase();
    return this.NON_CACHEABLE_PATTERNS.some(pattern => url.includes(pattern));
  }

  /**
   * Get the TTL for this request
   */
  private getTTL(request: HttpRequest<any>): number {
    const headerTTL = request.headers.get('X-Cache-TTL');
    if (headerTTL) {
      const ttlSeconds = parseInt(headerTTL, 10);
      if (!isNaN(ttlSeconds) && ttlSeconds > 0) {
        return ttlSeconds * 1000;
      }
    }
    return this.DEFAULT_TTL;
  }

  /**
   * Cache the response
   */
  private cacheResponse(key: string, response: HttpResponse<any>, ttl: number): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldestEntries();
    }

    const now = Date.now();
    this.cache.set(key, {
      response: response.clone(),
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  /**
   * Invalidate cache entries related to a URL
   */
  private invalidateRelatedCache(url: string): void {
    // Extract the base path (e.g., /api/surveyors from /api/surveyors/123)
    const basePath = url.split('?')[0];
    const pathSegments = basePath.split('/').filter(s => s);

    // Build patterns to match
    const patterns: string[] = [];

    // Add exact match
    patterns.push(basePath);

    // Add collection pattern (e.g., /api/surveyors for /api/surveyors/123)
    if (pathSegments.length > 0) {
      // Remove last segment if it looks like an ID
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (/^\d+$/.test(lastSegment) || /^[a-f0-9-]{36}$/i.test(lastSegment)) {
        pathSegments.pop();
        patterns.push('/' + pathSegments.join('/'));
      }
    }

    // Invalidate matching cache entries
    for (const [key] of this.cache) {
      if (patterns.some(pattern => key.includes(pattern))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Evict the oldest cache entries
   */
  private evictOldestEntries(): void {
    // First, remove expired entries
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }

    // If still over limit, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 20%
      const toRemove = Math.ceil(this.MAX_CACHE_SIZE * 0.2);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Clear all cache entries (useful for logout, etc.)
   */
  clearCache(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; inFlight: number } {
    return {
      size: this.cache.size,
      inFlight: this.inFlightRequests.size
    };
  }
}
