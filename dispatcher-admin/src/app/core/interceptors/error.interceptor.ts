import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Global HTTP Error Interceptor
 *
 * Catches all HTTP errors and provides consistent error handling:
 * - Shows toast notifications for user-facing errors
 * - Logs errors for debugging
 * - Provides meaningful error messages
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't show notifications for health check failures
      const isHealthCheck = req.url.includes('/feature-flags') && req.method === 'GET';

      if (!isHealthCheck || error.status !== 0) {
        const message = getErrorMessage(error);

        // Only show notification for non-silent errors
        if (!req.headers.has('X-Silent-Error')) {
          switch (error.status) {
            case 0:
              notificationService.error('Connection Error', message);
              break;
            case 401:
              notificationService.warning('Authentication Required', message);
              break;
            case 403:
              notificationService.error('Access Denied', message);
              break;
            case 404:
              // Usually handled by the component
              break;
            case 429:
              notificationService.warning('Rate Limited', 'Please wait before trying again.');
              break;
            default:
              if (error.status >= 500) {
                notificationService.error('Server Error', message);
              }
          }
        }
      }

      // Log error for debugging
      console.error(`[HTTP Error] ${req.method} ${req.url}:`, error);

      return throwError(() => error);
    })
  );
};

/**
 * Extract a user-friendly error message from the HTTP error
 */
function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to connect to the server. Please check your network connection.';
  }

  if (error.error?.message) {
    return error.error.message;
  }

  switch (error.status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred. The resource may have been modified.';
    case 422:
      return 'The request could not be processed. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    case 502:
      return 'The server is temporarily unavailable. Please try again later.';
    case 503:
      return 'The service is currently unavailable. Please try again later.';
    case 504:
      return 'The server took too long to respond. Please try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}
