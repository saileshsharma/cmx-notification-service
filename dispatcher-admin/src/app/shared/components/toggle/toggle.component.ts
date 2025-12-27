import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Toggle Switch Component
 *
 * A premium toggle switch with smooth animations and visual feedback.
 */
@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="toggle-switch"
      [class.checked]="checked"
      [class.small]="size === 'small'"
      [class.large]="size === 'large'"
      [class.disabled]="disabled"
      [class.loading]="loading"
      [disabled]="disabled || loading"
      (click)="onToggle($event)"
      [attr.aria-checked]="checked"
      role="switch">
      <span class="toggle-track">
        <span class="toggle-thumb">
          <span class="thumb-icon" *ngIf="loading">
            <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32"/>
            </svg>
          </span>
          <span class="thumb-icon check" *ngIf="!loading && checked">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        </span>
      </span>
      <span class="toggle-label on" *ngIf="showLabels">ON</span>
      <span class="toggle-label off" *ngIf="showLabels">OFF</span>
    </button>
  `,
  styles: [`
    .toggle-switch {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 56px;
      height: 30px;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }

    .toggle-switch:focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: 2px;
      border-radius: 20px;
    }

    .toggle-switch.small {
      width: 44px;
      height: 24px;
    }

    .toggle-switch.large {
      width: 68px;
      height: 36px;
    }

    .toggle-switch.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle-track {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
      border-radius: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .toggle-switch:hover:not(.disabled) .toggle-track {
      background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
    }

    .toggle-switch.checked .toggle-track {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 12px rgba(16, 185, 129, 0.3);
    }

    .toggle-switch.checked:hover:not(.disabled) .toggle-track {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-switch.small .toggle-thumb {
      width: 18px;
      height: 18px;
      top: 3px;
      left: 3px;
    }

    .toggle-switch.large .toggle-thumb {
      width: 30px;
      height: 30px;
      top: 3px;
      left: 3px;
    }

    .toggle-switch.checked .toggle-thumb {
      transform: translateX(26px);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3), 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .toggle-switch.small.checked .toggle-thumb {
      transform: translateX(20px);
    }

    .toggle-switch.large.checked .toggle-thumb {
      transform: translateX(32px);
    }

    .toggle-switch:active:not(.disabled) .toggle-thumb {
      width: 28px;
    }

    .toggle-switch.small:active:not(.disabled) .toggle-thumb {
      width: 22px;
    }

    .toggle-switch.large:active:not(.disabled) .toggle-thumb {
      width: 34px;
    }

    .toggle-switch.checked:active:not(.disabled) .toggle-thumb {
      transform: translateX(22px);
    }

    .toggle-switch.small.checked:active:not(.disabled) .toggle-thumb {
      transform: translateX(16px);
    }

    .toggle-switch.large.checked:active:not(.disabled) .toggle-thumb {
      transform: translateX(28px);
    }

    .thumb-icon {
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-switch.small .thumb-icon {
      width: 10px;
      height: 10px;
    }

    .toggle-switch.large .thumb-icon {
      width: 18px;
      height: 18px;
    }

    .thumb-icon.check {
      color: #10b981;
    }

    .thumb-icon.check svg {
      width: 100%;
      height: 100%;
    }

    .spinner {
      width: 100%;
      height: 100%;
      animation: spin 1s linear infinite;
      color: #6366f1;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .toggle-label {
      position: absolute;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .toggle-switch.small .toggle-label {
      font-size: 7px;
    }

    .toggle-switch.large .toggle-label {
      font-size: 10px;
    }

    .toggle-label.on {
      left: 8px;
      color: white;
      opacity: 0;
    }

    .toggle-label.off {
      right: 7px;
      color: #64748b;
      opacity: 1;
    }

    .toggle-switch.checked .toggle-label.on {
      opacity: 1;
    }

    .toggle-switch.checked .toggle-label.off {
      opacity: 0;
    }

    .toggle-switch.loading .toggle-thumb {
      background: #f8fafc;
    }
  `]
})
export class ToggleComponent {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showLabels = false;

  @Output() toggle = new EventEmitter<boolean>();

  onToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled && !this.loading) {
      this.toggle.emit(!this.checked);
    }
  }
}
