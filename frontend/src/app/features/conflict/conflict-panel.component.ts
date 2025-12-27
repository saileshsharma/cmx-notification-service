import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConflictEvent {
  title: string;
  start: Date;
  end: Date;
}

export interface Conflict {
  event1: ConflictEvent;
  event2: ConflictEvent;
  overlapMinutes: number;
}

export interface ConflictWarning {
  surveyorId: number;
  surveyorName: string;
  conflictCount: number;
  conflicts: Conflict[];
}

/**
 * Conflict Panel Component
 *
 * Displays scheduling conflict analysis showing:
 * - Total conflict count summary
 * - Per-surveyor conflict breakdown
 * - Visual overlap indicators with severity colors
 */
@Component({
  selector: 'app-conflict-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="side-panel conflict-panel" *ngIf="isOpen">
      <div class="panel-header">
        <h3>Scheduling Conflicts</h3>
        <button class="close-btn" (click)="close.emit()">&#10005;</button>
      </div>
      <div class="panel-summary">
        <div class="summary-stat">
          <span class="summary-value" [class.warning]="totalConflicts > 0">{{totalConflicts}}</span>
          <span class="summary-label">Total Conflicts</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value">{{conflictWarnings.length}}</span>
          <span class="summary-label">Surveyors Affected</span>
        </div>
      </div>
      <div class="panel-content">
        <div *ngIf="conflictWarnings.length === 0" class="no-conflicts">
          <span class="success-icon">&#10003;</span>
          <p>No scheduling conflicts detected</p>
          <p class="hint">All appointments are properly scheduled without overlaps.</p>
        </div>
        <div *ngFor="let warning of conflictWarnings" class="conflict-group">
          <div class="conflict-surveyor">
            <div class="avatar small" [style.background-color]="getAvatarColor(warning.surveyorName)">
              {{getInitials(warning.surveyorName)}}
            </div>
            <span class="surveyor-name">{{warning.surveyorName}}</span>
            <span class="conflict-badge">{{warning.conflictCount}}</span>
          </div>
          <div class="conflict-list">
            <div *ngFor="let conflict of warning.conflicts" class="conflict-item" [style.border-left-color]="getConflictColor(conflict.overlapMinutes)">
              <div class="conflict-time">
                <span class="overlap-icon">&#9888;</span>
                {{conflict.overlapMinutes}} min overlap
              </div>
              <div class="conflict-events">
                <span class="event-name">{{getEventTitle(conflict.event1)}}</span>
                <span class="conflict-vs">vs</span>
                <span class="event-name">{{getEventTitle(conflict.event2)}}</span>
              </div>
              <div class="conflict-times">
                <span>{{formatEventTime(conflict.event1)}}</span>
                <span class="time-separator">|</span>
                <span>{{formatEventTime(conflict.event2)}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .side-panel {
      position: fixed;
      right: 0;
      top: 60px;
      width: 360px;
      height: calc(100vh - 60px);
      background: #fff;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .panel-summary {
      display: flex;
      gap: 20px;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .summary-value.warning {
      color: #ef4444;
    }

    .summary-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .panel-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }

    .no-conflicts {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .success-icon {
      display: block;
      font-size: 48px;
      color: #22c55e;
      margin-bottom: 16px;
    }

    .no-conflicts p {
      margin: 0 0 8px 0;
    }

    .no-conflicts .hint {
      font-size: 13px;
      color: #94a3b8;
    }

    .conflict-group {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .conflict-surveyor {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #fef2f2;
      border-bottom: 1px solid #fecaca;
    }

    .avatar.small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
    }

    .surveyor-name {
      font-weight: 600;
      color: #1e293b;
      flex: 1;
    }

    .conflict-badge {
      background: #ef4444;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .conflict-list {
      padding: 12px;
    }

    .conflict-item {
      padding: 12px;
      border-left: 4px solid #ef4444;
      background: #fff;
      border-radius: 0 8px 8px 0;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .conflict-item:last-child {
      margin-bottom: 0;
    }

    .conflict-time {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #ef4444;
      margin-bottom: 8px;
    }

    .overlap-icon {
      font-size: 12px;
    }

    .conflict-events {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .event-name {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conflict-vs {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
      text-transform: uppercase;
      padding: 2px 6px;
      background: #f1f5f9;
      border-radius: 4px;
    }

    .conflict-times {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #64748b;
    }

    .time-separator {
      color: #cbd5e1;
    }

    @media (max-width: 768px) {
      .side-panel {
        width: 100%;
        left: 0;
        right: 0;
      }
    }
  `]
})
export class ConflictPanelComponent {
  @Input() isOpen = false;
  @Input() conflictWarnings: ConflictWarning[] = [];

  @Output() close = new EventEmitter<void>();

  private readonly AVATAR_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  get totalConflicts(): number {
    return this.conflictWarnings.reduce((sum, w) => sum + w.conflictCount, 0);
  }

  getAvatarColor(name: string): string {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.AVATAR_COLORS[hash % this.AVATAR_COLORS.length];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getConflictColor(overlapMinutes: number): string {
    if (overlapMinutes < 15) return '#f59e0b';
    if (overlapMinutes < 30) return '#ea580c';
    return '#ef4444';
  }

  getEventTitle(event: ConflictEvent): string {
    if (!event?.title) return 'Appointment';
    // Extract event name from "SURVEYOR_NAME - EVENT_NAME" format
    const parts = event.title.split(' - ');
    return parts.length > 1 ? parts[1] : event.title;
  }

  formatEventTime(event: ConflictEvent): string {
    if (!event?.start) return '';
    const date = new Date(event.start);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
