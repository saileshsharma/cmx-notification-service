import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NetworkService } from '../../../core/services/network.service';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offline-banner" *ngIf="!isOnline" [@slideDown]>
      <div class="offline-content">
        <svg class="offline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
        <span class="offline-text">You're offline. Some features may not be available.</span>
      </div>
      <button class="retry-btn" (click)="checkConnection()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Retry
      </button>
    </div>

    <div class="slow-connection-banner" *ngIf="isOnline && isSlowConnection" [@slideDown]>
      <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>Slow connection detected. Data may take longer to load.</span>
    </div>

    <div class="back-online-banner" *ngIf="showBackOnline" [@slideDown]>
      <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span>You're back online!</span>
    </div>
  `,
  styles: [`
    .offline-banner,
    .slow-connection-banner,
    .back-online-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px 20px;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .offline-banner {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
    }

    .slow-connection-banner {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #1e293b;
    }

    .back-online-banner {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }

    .offline-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .offline-icon,
    .warning-icon,
    .success-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .offline-text {
      font-size: 14px;
      font-weight: 500;
    }

    .retry-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .retry-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .retry-btn svg {
      width: 16px;
      height: 16px;
    }
  `]
})
export class OfflineBannerComponent implements OnInit, OnDestroy {
  isOnline = true;
  isSlowConnection = false;
  showBackOnline = false;

  private subscription?: Subscription;
  private wasOffline = false;

  constructor(private networkService: NetworkService) {}

  ngOnInit(): void {
    this.subscription = this.networkService.status$.subscribe(status => {
      const wasOnline = this.isOnline;
      this.isOnline = status.online;
      this.isSlowConnection = this.networkService.isSlowConnection();

      // Show "back online" message
      if (!wasOnline && status.online && this.wasOffline) {
        this.showBackOnline = true;
        setTimeout(() => {
          this.showBackOnline = false;
        }, 3000);
      }

      if (!status.online) {
        this.wasOffline = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  checkConnection(): void {
    // Try to fetch a small resource to check connection
    fetch('/api/health', { method: 'HEAD', cache: 'no-store' })
      .then(() => {
        // Connection restored
        window.dispatchEvent(new Event('online'));
      })
      .catch(() => {
        // Still offline
        console.log('Still offline');
      });
  }
}
