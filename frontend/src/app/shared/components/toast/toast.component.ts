import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services';
import { Toast } from '../../../core/models';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" class="toast" [class]="toast.type" (click)="removeToast(toast.id)">
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">&#10003;</span>
          <span *ngIf="toast.type === 'error'">&#10007;</span>
          <span *ngIf="toast.type === 'warning'">&#9888;</span>
          <span *ngIf="toast.type === 'info'">&#8505;</span>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{toast.title}}</div>
          <div class="toast-message">{{toast.message}}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      animation: slideIn 0.3s ease;
      min-width: 300px;
      max-width: 400px;
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

    .toast.success {
      border-left: 4px solid #28a745;
    }

    .toast.error {
      border-left: 4px solid #dc3545;
    }

    .toast.warning {
      border-left: 4px solid #ffc107;
    }

    .toast.info {
      border-left: 4px solid #17a2b8;
    }

    .toast-icon {
      font-size: 18px;
    }

    .toast.success .toast-icon { color: #28a745; }
    .toast.error .toast-icon { color: #dc3545; }
    .toast.warning .toast-icon { color: #ffc107; }
    .toast.info .toast-icon { color: #17a2b8; }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .toast-message {
      font-size: 14px;
      color: #666;
    }
  `]
})
export class ToastComponent implements OnDestroy {
  toasts: Toast[] = [];
  private subscription: Subscription;

  constructor(private notificationService: NotificationService) {
    this.subscription = this.notificationService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  removeToast(id: number): void {
    this.notificationService.removeToast(id);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
