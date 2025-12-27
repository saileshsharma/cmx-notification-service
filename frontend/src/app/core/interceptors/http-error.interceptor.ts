import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError, timeout } from 'rxjs/operators';
import { ErrorHandlerService } from '../services/error-handler.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(private errorHandler: ErrorHandlerService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add timestamp for request tracking
    const startTime = Date.now();

    // Clone request and add headers
    const modifiedRequest = request.clone({
      setHeaders: {
        'X-Request-ID': this.generateRequestId(),
        'X-Client-Version': '1.0.0'
      }
    });

    return next.handle(modifiedRequest).pipe(
      // Add timeout
      timeout(this.DEFAULT_TIMEOUT),

      // Retry logic for specific errors
      retry({
        count: this.shouldRetry(request) ? this.MAX_RETRIES : 0,
        delay: (error, retryCount) => {
          if (!this.isRetryableError(error)) {
            throw error;
          }
          console.log(`Retry attempt ${retryCount} for ${request.url}`);
          // Exponential backoff
          return timer(this.RETRY_DELAY * Math.pow(2, retryCount - 1));
        }
      }),

      catchError((error: HttpErrorResponse) => {
        const duration = Date.now() - startTime;
        console.error(`Request failed after ${duration}ms:`, request.url, error);

        // Log to analytics/monitoring (if needed)
        this.logError(request, error, duration);

        return throwError(() => error);
      })
    );
  }

  private shouldRetry(request: HttpRequest<any>): boolean {
    // Only retry GET requests by default
    return request.method === 'GET';
  }

  private isRetryableError(error: HttpErrorResponse): boolean {
    // Retry on network errors and specific server errors
    return (
      error.status === 0 || // Network error
      error.status === 408 || // Request timeout
      error.status === 429 || // Too many requests
      error.status === 502 || // Bad gateway
      error.status === 503 || // Service unavailable
      error.status === 504    // Gateway timeout
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private logError(request: HttpRequest<any>, error: HttpErrorResponse, duration: number): void {
    // This could send to an analytics service
    const errorLog = {
      url: request.url,
      method: request.method,
      status: error.status,
      message: error.message,
      duration,
      timestamp: new Date().toISOString()
    };

    // Store in localStorage for debugging (keep last 50 errors)
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.unshift(errorLog);
      localStorage.setItem('errorLogs', JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      // Ignore storage errors
    }
  }
}
