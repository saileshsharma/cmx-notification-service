import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZoneChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';

/**
 * Application Bootstrap
 *
 * Initializes the Angular application with:
 * - Zone.js change detection with event coalescing
 * - HTTP client with error interceptor
 */
bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(
      withInterceptors([errorInterceptor])
    )
  ]
}).catch(err => console.error('Application bootstrap error:', err));
