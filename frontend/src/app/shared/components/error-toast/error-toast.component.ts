import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ErrorHandlerService, AppError } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-toast-container">
      <div
        *ngFor="let error of errors; trackBy: trackById"
        class="error-toast"
        [ngClass]="error.type"
        [@slideIn]
      >
        <div class="error-icon">
          <svg *ngIf="error.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <svg *ngIf="error.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <svg *ngIf="error.type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="16 12 12 8 8 12"/>
            <line x1="12" y1="16" x2="12" y2="8"/>
          </svg>
        </div>
        <div class="error-content">
          <p class="error-message">{{ error.message }}</p>
          <span class="error-time">{{ getTimeAgo(error.timestamp) }}</span>
        </div>
        <button class="error-dismiss" (click)="dismiss(error.id)" aria-label="Dismiss">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <button *ngIf="error.retryable && error.retryFn" class="error-retry" (click)="retry(error)">
          Retry
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    .error-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      background: #1e293b;
      border: 1px solid #334155;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      pointer-events: all;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .error-toast.error {
      border-left: 4px solid #ef4444;
    }

    .error-toast.warning {
      border-left: 4px solid #f59e0b;
    }

    .error-toast.info {
      border-left: 4px solid #22c55e;
    }

    .error-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
    }

    .error-toast.error .error-icon {
      color: #ef4444;
    }

    .error-toast.warning .error-icon {
      color: #f59e0b;
    }

    .error-toast.info .error-icon {
      color: #22c55e;
    }

    .error-content {
      flex: 1;
      min-width: 0;
    }

    .error-message {
      margin: 0;
      color: #f1f5f9;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .error-time {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: #64748b;
    }

    .error-dismiss {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      padding: 0;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: color 0.2s;
    }

    .error-dismiss:hover {
      color: #f1f5f9;
    }

    .error-retry {
      flex-shrink: 0;
      padding: 6px 12px;
      border: 1px solid #CCFF00;
      border-radius: 4px;
      background: transparent;
      color: #CCFF00;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .error-retry:hover {
      background: #CCFF00;
      color: #0f172a;
    }
  `]
})
export class ErrorToastComponent implements OnInit, OnDestroy {
  errors: AppError[] = [];
  private subscription?: Subscription;

  constructor(private errorHandler: ErrorHandlerService) {}

  ngOnInit(): void {
    this.subscription = this.errorHandler.errors$.subscribe(
      errors => this.errors = errors
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  dismiss(id: string): void {
    this.errorHandler.dismissError(id);
  }

  retry(error: AppError): void {
    if (error.retryFn) {
      error.retryFn();
      this.dismiss(error.id);
    }
  }

  trackById(index: number, error: AppError): string {
    return error.id;
  }

  getTimeAgo(timestamp: Date): string {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 120) return '1 minute ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return new Date(timestamp).toLocaleTimeString();
  }
}
