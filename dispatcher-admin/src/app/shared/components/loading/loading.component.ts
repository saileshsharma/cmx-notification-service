import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading Component
 *
 * Displays loading states with customizable appearance.
 */
@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (overlay) {
      <div class="loading-overlay">
        <ng-container *ngTemplateOutlet="loaderContent"></ng-container>
      </div>
    } @else {
      <ng-container *ngTemplateOutlet="loaderContent"></ng-container>
    }

    <ng-template #loaderContent>
      <div class="loader-container" [class]="size">
        <div class="loader">
          <div class="loader-ring"></div>
          <div class="loader-ring"></div>
          <div class="loader-ring"></div>
        </div>
        @if (message) {
          <p class="loader-message">{{ message }}</p>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      gap: 24px;
    }

    .loader-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loader {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .loader-container.small .loader {
      width: 32px;
      height: 32px;
    }

    .loader-container.large .loader {
      width: 80px;
      height: 80px;
    }

    .loader-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-top-color: var(--primary, #6366f1);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loader-ring:nth-child(2) {
      width: 80%;
      height: 80%;
      top: 10%;
      left: 10%;
      animation-delay: 0.15s;
      border-top-color: var(--primary-light, #818cf8);
    }

    .loader-ring:nth-child(3) {
      width: 60%;
      height: 60%;
      top: 20%;
      left: 20%;
      animation-delay: 0.3s;
      border-top-color: var(--primary-dark, #4f46e5);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .loader-message {
      color: var(--text-secondary, #475569);
      font-size: 14px;
      text-align: center;
    }
  `]
})
export class LoadingComponent {
  @Input() overlay = true;
  @Input() message = '';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
}
