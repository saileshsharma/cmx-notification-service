import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Modal Component
 *
 * A reusable modal dialog with customizable header, body, and footer.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="modal-overlay" (click)="closeOnBackdrop && close.emit()">
        <div class="modal" [class]="size" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">
              <h2>{{ title }}</h2>
              @if (subtitle) {
                <span class="modal-subtitle">{{ subtitle }}</span>
              }
            </div>
            <button class="close-btn" (click)="close.emit()" aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <ng-content></ng-content>
          </div>
          @if (showFooter) {
            <div class="modal-footer">
              <ng-content select="[modal-footer]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal {
      background: var(--bg-primary, #ffffff);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal.small { max-width: 400px; }
    .modal.medium { max-width: 500px; }
    .modal.large { max-width: 700px; }
    .modal.xlarge { max-width: 900px; }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
    }

    .modal-title h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }

    .modal-subtitle {
      font-size: 13px;
      color: var(--text-tertiary, #94a3b8);
      font-family: monospace;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--bg-tertiary, #f1f5f9);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary, #475569);
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: var(--bg-hover, #e2e8f0);
      color: var(--text-primary, #0f172a);
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid var(--border-color, #e2e8f0);
      background: var(--bg-secondary, #f8fafc);
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  @Input() showFooter = true;
  @Input() closeOnBackdrop = true;

  @Output() close = new EventEmitter<void>();
}
