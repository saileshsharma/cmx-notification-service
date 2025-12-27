import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  private globalLoadingSubject = new BehaviorSubject<boolean>(false);

  // Observable for global loading state
  loading$ = this.globalLoadingSubject.asObservable();

  // Pre-defined loading keys
  static readonly KEYS = {
    CALENDAR: 'calendar',
    SURVEYORS: 'surveyors',
    APPOINTMENTS: 'appointments',
    CHAT: 'chat',
    NOTIFICATIONS: 'notifications',
    SUBMIT: 'submit',
    DELETE: 'delete',
    EXPORT: 'export'
  } as const;

  /**
   * Start loading for a specific key
   */
  start(key: string): void {
    const current = this.loadingSubject.value;
    this.loadingSubject.next({ ...current, [key]: true });
    this.updateGlobal();
  }

  /**
   * Stop loading for a specific key
   */
  stop(key: string): void {
    const current = this.loadingSubject.value;
    this.loadingSubject.next({ ...current, [key]: false });
    this.updateGlobal();
  }

  /**
   * Check if a specific key is loading
   */
  isLoading(key: string): Observable<boolean> {
    return this.loadingSubject.pipe(
      map(state => state[key] || false),
      distinctUntilChanged()
    );
  }

  /**
   * Check if any of the specified keys are loading
   */
  isAnyLoading(keys: string[]): Observable<boolean> {
    return this.loadingSubject.pipe(
      map(state => keys.some(key => state[key])),
      distinctUntilChanged()
    );
  }

  /**
   * Get current loading state for a key (synchronous)
   */
  isLoadingNow(key: string): boolean {
    return this.loadingSubject.value[key] || false;
  }

  /**
   * Wrap an observable to automatically track loading state
   */
  wrap<T>(key: string, observable: Observable<T>): Observable<T> {
    this.start(key);
    return new Observable<T>(subscriber => {
      observable.subscribe({
        next: value => subscriber.next(value),
        error: err => {
          this.stop(key);
          subscriber.error(err);
        },
        complete: () => {
          this.stop(key);
          subscriber.complete();
        }
      });
    });
  }

  /**
   * Reset all loading states
   */
  reset(): void {
    this.loadingSubject.next({});
    this.globalLoadingSubject.next(false);
  }

  private updateGlobal(): void {
    const state = this.loadingSubject.value;
    const isAnyLoading = Object.values(state).some(v => v);
    this.globalLoadingSubject.next(isAnyLoading);
  }
}
