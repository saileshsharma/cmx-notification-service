import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

/**
 * Toast Container Component
 *
 * Displays toast notifications from the notification service.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="dismiss(toast.id)">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              @default {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            }
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="dismiss(toast.id); $event.stopPropagation()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 2000;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--bg-primary, #ffffff);
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
      border-left: 4px solid var(--primary, #6366f1);
      min-width: 320px;
      max-width: 420px;
      animation: slideIn 0.3s ease;
      cursor: pointer;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast.success { border-left-color: #10b981; }
    .toast.error { border-left-color: #ef4444; }
    .toast.warning { border-left-color: #f59e0b; }
    .toast.info { border-left-color: #6366f1; }

    .toast-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .toast.success .toast-icon { color: #10b981; }
    .toast.error .toast-icon { color: #ef4444; }
    .toast.warning .toast-icon { color: #f59e0b; }
    .toast.info .toast-icon { color: #6366f1; }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary, #0f172a);
      margin-bottom: 4px;
    }

    .toast-message {
      font-size: 13px;
      color: var(--text-secondary, #475569);
    }

    .toast-close {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--text-tertiary, #94a3b8);
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover {
      color: var(--text-primary, #0f172a);
    }

    .toast-close svg {
      width: 16px;
      height: 16px;
    }
  `]
})
export class ToastContainerComponent {
  protected notificationService = inject(NotificationService);

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
