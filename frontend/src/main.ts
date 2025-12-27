import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideZoneChangeDetection, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { Router } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { AppComponent } from './app/app.component';
import { HttpErrorInterceptor, HttpCacheInterceptor } from './app/core/interceptors';

// Initialize Sentry for error monitoring (only in production)
const isProduction = !window.location.hostname.includes('localhost');

if (isProduction) {
  Sentry.init({
    dsn: '', // Add your Sentry DSN here when ready
    integrations: [
      // Capture console errors
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
      // Track browser performance
      Sentry.browserTracingIntegration(),
    ],
    // Performance monitoring sample rate (0.0 to 1.0)
    tracesSampleRate: 0.2,
    // Session replay sample rate
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Environment
    environment: isProduction ? 'production' : 'development',
    // Release version
    release: 'cmx-surveyor-calendar@1.1.0',
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /Loading chunk \d+ failed/,
    ],
    // Before sending, filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },
  });
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    // Sentry Error Handler - captures and reports errors
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false, // Don't show error dialog to users
        logErrors: true,   // Still log to console
      }),
    },
    // Sentry Trace Service - for performance monitoring
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
    // HTTP Cache Interceptor - runs first to check cache before making requests
    { provide: HTTP_INTERCEPTORS, useClass: HttpCacheInterceptor, multi: true },
    // HTTP Error Interceptor - runs last to handle errors
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ]
}).catch(err => {
  console.error('Application bootstrap error:', err);
  // Report bootstrap errors to Sentry
  if (isProduction) {
    Sentry.captureException(err);
  }
});
