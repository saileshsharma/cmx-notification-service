import { Injectable, signal } from '@angular/core';
import { Toast } from '../../models';
import { environment } from '../config/environment';

/**
 * Notification Service
 *
 * Manages toast notifications throughout the application.
 * Features:
 * - Multiple notification types (success, error, info, warning)
 * - Auto-dismiss with configurable duration
 * - Queue management
 * - Manual dismiss support
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _toasts = signal<Toast[]>([]);
  private toastIdCounter = 0;
  private readonly maxToasts = 5;

  readonly toasts = this._toasts.asReadonly();

  /**
   * Show a success notification
   */
  success(title: string, message: string, duration?: number): void {
    this.show({ type: 'success', title, message, duration });
  }

  /**
   * Show an error notification
   */
  error(title: string, message: string, duration?: number): void {
    this.show({ type: 'error', title, message, duration });
  }

  /**
   * Show an info notification
   */
  info(title: string, message: string, duration?: number): void {
    this.show({ type: 'info', title, message, duration });
  }

  /**
   * Show a warning notification
   */
  warning(title: string, message: string, duration?: number): void {
    this.show({ type: 'warning', title, message, duration });
  }

  /**
   * Show a notification
   */
  private show(options: Omit<Toast, 'id'>): void {
    const id = ++this.toastIdCounter;
    const duration = options.duration ?? environment.toastDuration;

    const toast: Toast = { ...options, id, duration };

    // Limit the number of toasts
    this._toasts.update(toasts => {
      const updated = [...toasts, toast];
      if (updated.length > this.maxToasts) {
        return updated.slice(-this.maxToasts);
      }
      return updated;
    });

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this._toasts.set([]);
  }
}
