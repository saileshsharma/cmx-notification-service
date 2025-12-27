import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly STORAGE_PREFIX = 'fleetinspect_cache_';

  private statsSubject = new BehaviorSubject<CacheStats>({ hits: 0, misses: 0, size: 0 });
  stats$ = this.statsSubject.asObservable();

  /**
   * Get item from cache (memory first, then localStorage)
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.recordHit();
      return memoryEntry.data;
    }

    // Try localStorage
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (!this.isExpired(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          this.recordHit();
          return entry.data;
        } else {
          // Clean up expired entry
          localStorage.removeItem(this.STORAGE_PREFIX + key);
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }

    this.recordMiss();
    return null;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL_MS, persist: boolean = false): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs
    };

    // Evict old entries if cache is full
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.memoryCache.set(key, entry);
    this.updateStats();

    // Persist to localStorage if requested
    if (persist) {
      try {
        localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(entry));
      } catch (e) {
        console.warn('Cache persist error:', e);
        // If localStorage is full, try to clean up
        this.cleanupStorage();
      }
    }
  }

  /**
   * Get or fetch - returns cached value or fetches new one
   */
  getOrFetch<T>(
    key: string,
    fetchFn: () => Observable<T>,
    ttlMs: number = this.DEFAULT_TTL_MS,
    persist: boolean = false
  ): Observable<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return of(cached);
    }

    return fetchFn().pipe(
      tap(data => this.set(key, data, ttlMs, persist))
    );
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (e) {
      // Ignore
    }
    this.updateStats();
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);

    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // localStorage
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const cacheKey = key.replace(this.STORAGE_PREFIX, '');
          if (regex.test(cacheKey)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      // Ignore
    }

    this.updateStats();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // Ignore
    }

    this.statsSubject.next({ hits: 0, misses: 0, size: 0 });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.statsSubject.value;
  }

  /**
   * Preload data into cache
   */
  preload<T>(entries: { key: string; data: T; ttlMs?: number }[]): void {
    entries.forEach(({ key, data, ttlMs }) => {
      this.set(key, data, ttlMs);
    });
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  private cleanupStorage(): void {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keys.push(key);
        }
      }

      // Remove expired entries
      keys.forEach(key => {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '');
          if (this.isExpired(entry)) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // Ignore
    }
  }

  private recordHit(): void {
    const stats = this.statsSubject.value;
    this.statsSubject.next({
      ...stats,
      hits: stats.hits + 1,
      size: this.memoryCache.size
    });
  }

  private recordMiss(): void {
    const stats = this.statsSubject.value;
    this.statsSubject.next({
      ...stats,
      misses: stats.misses + 1,
      size: this.memoryCache.size
    });
  }

  private updateStats(): void {
    const stats = this.statsSubject.value;
    this.statsSubject.next({
      ...stats,
      size: this.memoryCache.size
    });
  }
}
