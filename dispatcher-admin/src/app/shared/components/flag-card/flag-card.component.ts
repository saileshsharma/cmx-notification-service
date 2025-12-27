import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToggleComponent } from '../toggle/toggle.component';
import { FeatureFlagUI } from '../../../models';

/**
 * Flag Card Component
 *
 * Displays a single feature flag in card format.
 */
@Component({
  selector: 'app-flag-card',
  standalone: true,
  imports: [CommonModule, ToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flag-card"
      [class.enabled]="flag.enabled"
      [class.disabled]="!flag.enabled"
      [class.selected]="flag.selected"
      [class.toggling]="flag.toggling">

      <div class="flag-select" (click)="onSelect($event)">
        <input type="checkbox" [checked]="flag.selected" (change)="select.emit()">
      </div>

      <div class="flag-content" (click)="details.emit()">
        <div class="flag-header">
          <span class="flag-name">{{ displayName }}</span>
          <div class="flag-badges">
            <span class="env-badge" [class]="flag.environment">{{ flag.environment }}</span>
            @if (flag.rolloutPercentage < 100) {
              <span class="rollout-badge">{{ flag.rolloutPercentage }}%</span>
            }
          </div>
        </div>
        <p class="flag-description">{{ flag.description }}</p>
        <div class="flag-footer">
          <span class="flag-updated" [title]="flag.updatedAt">
            Updated {{ getRelativeTime(flag.updatedAt) }}
          </span>
        </div>
      </div>

      <div class="flag-toggle">
        <app-toggle
          [checked]="flag.enabled"
          [loading]="flag.toggling"
          (toggle)="onToggle($event)">
        </app-toggle>
      </div>
    </div>
  `,
  styles: [`
    .flag-card {
      display: flex;
      align-items: stretch;
      background: var(--bg-secondary, #f8fafc);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      overflow: hidden;
      transition: all 0.2s ease;
    }

    .flag-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      border-color: var(--primary, #6366f1);
    }

    .flag-card.selected {
      border-color: var(--primary, #6366f1);
      background: rgba(99, 102, 241, 0.05);
    }

    .flag-card.toggling {
      opacity: 0.7;
    }

    .flag-select {
      display: flex;
      align-items: center;
      padding: 0 12px;
      background: var(--bg-tertiary, #f1f5f9);
      cursor: pointer;
    }

    .flag-select input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary, #6366f1);
    }

    .flag-content {
      flex: 1;
      padding: 16px;
      cursor: pointer;
    }

    .flag-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .flag-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary, #0f172a);
    }

    .flag-badges {
      display: flex;
      gap: 6px;
    }

    .env-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .env-badge.all {
      background: var(--bg-tertiary, #f1f5f9);
      color: var(--text-tertiary, #94a3b8);
    }

    .env-badge.production {
      background: #fef3c7;
      color: #92400e;
    }

    .env-badge.development {
      background: #d1fae5;
      color: #065f46;
    }

    .rollout-badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .flag-description {
      font-size: 13px;
      color: var(--text-secondary, #475569);
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .flag-footer {
      display: flex;
      align-items: center;
    }

    .flag-updated {
      font-size: 11px;
      color: var(--text-tertiary, #94a3b8);
    }

    .flag-toggle {
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-left: 1px solid var(--border-color, #e2e8f0);
    }

    :host-context(.dark-mode) .env-badge.production {
      background: #451a03;
      color: #fcd34d;
    }

    :host-context(.dark-mode) .env-badge.development {
      background: #064e3b;
      color: #6ee7b7;
    }
  `]
})
export class FlagCardComponent {
  @Input({ required: true }) flag!: FeatureFlagUI;

  @Output() toggle = new EventEmitter<boolean>();
  @Output() select = new EventEmitter<void>();
  @Output() details = new EventEmitter<void>();

  get displayName(): string {
    const parts = this.flag.name.split('.');
    if (parts.length > 1) {
      return parts.slice(1).join(' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return this.flag.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }

  onSelect(event: Event): void {
    event.stopPropagation();
    this.select.emit();
  }

  onToggle(enabled: boolean): void {
    this.toggle.emit(enabled);
  }
}
