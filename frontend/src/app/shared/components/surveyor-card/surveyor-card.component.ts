import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Surveyor } from '../../../core/models';
import { SurveyorService } from '../../../core/services';

@Component({
  selector: 'app-surveyor-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="surveyor-card"
         [class.selected]="isSelected"
         [class.compact]="compact"
         (click)="cardClick.emit(surveyor)">

      <!-- Avatar -->
      <div class="avatar" *ngIf="!avatarError; else initialsAvatar">
        <img [src]="avatarUrl" (error)="onAvatarError()" [alt]="surveyor.display_name">
      </div>
      <ng-template #initialsAvatar>
        <div class="avatar initials" [style.background-color]="avatarColor">
          {{initials}}
        </div>
      </ng-template>

      <!-- Info -->
      <div class="info" *ngIf="!compact">
        <div class="name" [innerHTML]="highlightedName"></div>
        <div class="meta">
          <span class="code">{{surveyor.code}}</span>
          <span class="type-badge" [class.external]="surveyor.surveyor_type === 'EXTERNAL'">
            {{surveyor.surveyor_type}}
          </span>
        </div>
      </div>

      <!-- Status indicator -->
      <div class="status-dot" [style.background-color]="statusColor" [title]="surveyor.current_status"></div>

      <!-- Actions slot -->
      <div class="actions" *ngIf="showActions">
        <ng-content select="[card-actions]"></ng-content>
      </div>

      <!-- Selection check -->
      <div class="selection-check" *ngIf="isSelected">&#10003;</div>
    </div>
  `,
  styles: [`
    .surveyor-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
    }

    .surveyor-card:hover {
      background: #f8f9fa;
      transform: translateX(4px);
    }

    .surveyor-card.selected {
      background: #e3f2fd;
      border-left: 3px solid #2196f3;
    }

    .surveyor-card.compact {
      padding: 8px;
      gap: 8px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .compact .avatar {
      width: 32px;
      height: 32px;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar.initials {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .info {
      flex: 1;
      min-width: 0;
    }

    .name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .type-badge {
      padding: 2px 6px;
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
    }

    .type-badge.external {
      background: #fff3e0;
      color: #e65100;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .actions {
      display: flex;
      gap: 4px;
    }

    .selection-check {
      position: absolute;
      right: 12px;
      color: #2196f3;
      font-weight: bold;
    }

    :host ::ng-deep .search-highlight {
      background: #fff59d;
      padding: 0 2px;
      border-radius: 2px;
    }
  `]
})
export class SurveyorCardComponent {
  @Input() surveyor!: Surveyor;
  @Input() isSelected = false;
  @Input() compact = false;
  @Input() showActions = false;
  @Input() searchQuery = '';

  @Output() cardClick = new EventEmitter<Surveyor>();

  avatarError = false;

  constructor(private surveyorService: SurveyorService) {}

  get avatarUrl(): string {
    return this.surveyorService.getAvatarUrl(this.surveyor.display_name);
  }

  get avatarColor(): string {
    return this.surveyorService.getAvatarColor(this.surveyor.display_name);
  }

  get initials(): string {
    return this.surveyorService.getInitials(this.surveyor.display_name);
  }

  get statusColor(): string {
    return this.surveyorService.getStatusColor(this.surveyor.current_status);
  }

  get highlightedName(): string {
    if (!this.searchQuery.trim()) {
      return this.surveyor.display_name;
    }
    const query = this.searchQuery.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return this.surveyor.display_name.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  onAvatarError(): void {
    this.avatarError = true;
  }
}
