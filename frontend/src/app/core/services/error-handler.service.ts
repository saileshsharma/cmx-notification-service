import { Injectable, ErrorHandler, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface AppError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: Date;
  details?: string;
  retryable?: boolean;
  retryFn?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  private errorsSubject = new BehaviorSubject<AppError[]>([]);
  errors$ = this.errorsSubject.asObservable();

  private readonly MAX_ERRORS = 5;
  private readonly AUTO_DISMISS_MS = 8000;

  constructor(private zone: NgZone) {}

  handleError(error: Error | HttpErrorResponse): void {
    this.zone.run(() => {
      console.error('Global error caught:', error);

      if (error instanceof HttpErrorResponse) {
        this.handleHttpError(error);
      } else {
        this.handleClientError(error);
      }
    });
  }

  private handleHttpError(error: HttpErrorResponse): void {
    let message: string;
    let type: 'error' | 'warning' = 'error';
    let retryable = false;

    switch (error.status) {
      case 0:
        message = 'Unable to connect to server. Please check your internet connection.';
        type = 'warning';
        retryable = true;
        break;
      case 400:
        message = error.error?.message || 'Invalid request. Please check your input.';
        break;
      case 401:
        message = 'Session expired. Please log in again.';
        this.handleAuthError();
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 409:
        message = 'Conflict detected. The data may have been modified by another user.';
        retryable = true;
        break;
      case 422:
        message = error.error?.message || 'Validation failed. Please check your input.';
        break;
      case 429:
        message = 'Too many requests. Please wait a moment and try again.';
        type = 'warning';
        retryable = true;
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        message = 'Server error. Our team has been notified. Please try again later.';
        retryable = true;
        break;
      default:
        message = error.error?.message || `An error occurred (${error.status})`;
    }

    this.addError({
      id: this.generateId(),
      message,
      type,
      timestamp: new Date(),
      details: error.url || undefined,
      retryable
    });
  }

  private handleClientError(error: Error): void {
    // Filter out non-critical errors
    if (this.isIgnorableError(error)) {
      console.warn('Ignored error:', error.message);
      return;
    }

    this.addError({
      id: this.generateId(),
      message: 'An unexpected error occurred. Please refresh the page.',
      type: 'error',
      timestamp: new Date(),
      details: error.message
    });
  }

  private isIgnorableError(error: Error): boolean {
    const ignorablePatterns = [
      'ResizeObserver loop',
      'Loading chunk',
      'ChunkLoadError',
      'Script error',
      'Non-Error promise rejection'
    ];
    return ignorablePatterns.some(pattern =>
      error.message?.includes(pattern) || error.name?.includes(pattern)
    );
  }

  private handleAuthError(): void {
    // Clear any stored tokens and redirect to login
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    // You could emit an event here to trigger a login redirect
  }

  addError(error: AppError): void {
    const currentErrors = this.errorsSubject.value;

    // Prevent duplicate errors
    const isDuplicate = currentErrors.some(
      e => e.message === error.message &&
           Date.now() - e.timestamp.getTime() < 5000
    );

    if (isDuplicate) return;

    // Keep only the most recent errors
    const updatedErrors = [error, ...currentErrors].slice(0, this.MAX_ERRORS);
    this.errorsSubject.next(updatedErrors);

    // Auto-dismiss after timeout
    setTimeout(() => this.dismissError(error.id), this.AUTO_DISMISS_MS);
  }

  dismissError(id: string): void {
    const currentErrors = this.errorsSubject.value;
    this.errorsSubject.next(currentErrors.filter(e => e.id !== id));
  }

  clearAllErrors(): void {
    this.errorsSubject.next([]);
  }

  showSuccess(message: string): void {
    this.addError({
      id: this.generateId(),
      message,
      type: 'info',
      timestamp: new Date()
    });
  }

  showWarning(message: string): void {
    this.addError({
      id: this.generateId(),
      message,
      type: 'warning',
      timestamp: new Date()
    });
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
