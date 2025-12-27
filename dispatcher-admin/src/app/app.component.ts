import { Component } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/**
 * Root Application Component
 *
 * Enterprise Feature Flag Management System
 *
 * Architecture:
 * - Modular Angular 17+ structure with standalone components
 * - Reactive state management using Angular Signals
 * - Type-safe models and interfaces
 * - Service-based architecture with dependency injection
 * - HTTP interceptors for global error handling
 * - Environment-based configuration
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: `<app-dashboard></app-dashboard>`
})
export class AppComponent {}
