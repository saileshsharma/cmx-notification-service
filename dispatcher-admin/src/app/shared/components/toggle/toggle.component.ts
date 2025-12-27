import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Toggle Switch Component
 *
 * A reusable toggle switch with multiple sizes and states.
 */
@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="toggle-switch" [class.small]="size === 'small'" [class.large]="size === 'large'" [class.disabled]="disabled">
      <input
        type="checkbox"
        [checked]="checked"
        [disabled]="disabled"
        (change)="onToggle($event)">
      <span class="toggle-slider">
        <span class="toggle-icon on" *ngIf="showIcons">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        <span class="toggle-icon off" *ngIf="showIcons">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
      </span>
    </label>
  `,
  styles: [`
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 52px;
      height: 28px;
      cursor: pointer;
    }

    .toggle-switch.small {
      width: 40px;
      height: 22px;
    }

    .toggle-switch.large {
      width: 64px;
      height: 34px;
    }

    .toggle-switch.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--bg-tertiary, #f1f5f9);
      transition: 0.3s;
      border-radius: 28px;
      border: 2px solid var(--border-color, #e2e8f0);
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: calc(100% - 4px);
      aspect-ratio: 1;
      left: 2px;
      top: 2px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    input:checked + .toggle-slider {
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      border-color: #10b981;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }

    .toggle-switch.small input:checked + .toggle-slider:before {
      transform: translateX(18px);
    }

    .toggle-switch.large input:checked + .toggle-slider:before {
      transform: translateX(30px);
    }

    input:disabled + .toggle-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle-icon {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      transition: opacity 0.2s;
    }

    .toggle-icon.on {
      right: 8px;
      color: white;
      opacity: 0;
    }

    .toggle-icon.off {
      left: 8px;
      color: var(--text-tertiary, #94a3b8);
      opacity: 1;
    }

    input:checked + .toggle-slider .toggle-icon.on { opacity: 1; }
    input:checked + .toggle-slider .toggle-icon.off { opacity: 0; }
  `]
})
export class ToggleComponent {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showIcons = true;

  @Output() toggle = new EventEmitter<boolean>();

  onToggle(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    this.toggle.emit(input.checked);
  }
}
