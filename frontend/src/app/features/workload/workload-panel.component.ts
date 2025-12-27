import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WorkloadItem {
  surveyorId: number;
  surveyorName: string;
  hoursToday: number;
  hoursWeek: number;
  appointmentsToday: number;
  appointmentsWeek: number;
}

/**
 * Workload Panel Component
 *
 * Displays workload balance analysis for surveyors showing:
 * - Average weekly hours
 * - Workload distribution variance
 * - Per-surveyor breakdown with visual bars
 */
@Component({
  selector: 'app-workload-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="side-panel workload-panel" *ngIf="isOpen">
      <div class="panel-header">
        <h3>Workload Balance</h3>
        <button class="close-btn" (click)="close.emit()">&#10005;</button>
      </div>
      <div class="panel-summary">
        <div class="summary-stat">
          <span class="summary-value">{{getAverageWorkload()}}h</span>
          <span class="summary-label">Avg Weekly</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value" [class]="getWorkloadVariance().toLowerCase()">{{getWorkloadVariance()}}</span>
          <span class="summary-label">Distribution</span>
        </div>
      </div>
      <div class="panel-content">
        <div *ngIf="workloadData.length === 0" class="empty-state">
          <p>No workload data available.</p>
          <p class="hint">Workload is calculated from scheduled appointments.</p>
        </div>
        <div *ngFor="let w of workloadData" class="workload-row">
          <div class="workload-surveyor">
            <div class="avatar small" [style.background-color]="getAvatarColor(w.surveyorName)">
              {{getInitials(w.surveyorName)}}
            </div>
            <div class="workload-info">
              <span class="workload-name">{{w.surveyorName}}</span>
              <span class="workload-stats">{{w.appointmentsToday}} today | {{w.appointmentsWeek}} this week</span>
            </div>
          </div>
          <div class="workload-bar-container">
            <div class="workload-bar" [style.width.%]="getWorkloadBarWidth(w.hoursWeek)" [style.background-color]="getWorkloadColor(w.hoursWeek)"></div>
            <span class="workload-hours">{{w.hoursWeek}}h</span>
          </div>
          <span class="workload-status" [style.color]="getWorkloadColor(w.hoursWeek)">{{getWorkloadStatus(w.hoursWeek)}}</span>
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
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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

    .summary-value.balanced { color: #22c55e; }
    .summary-value.uneven { color: #f59e0b; }
    .summary-value.imbalanced { color: #ef4444; }

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

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .empty-state p {
      margin: 0 0 8px 0;
    }

    .empty-state .hint {
      font-size: 13px;
      color: #94a3b8;
    }

    .workload-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 10px;
      transition: all 0.2s;
    }

    .workload-row:hover {
      border-color: #cbd5e1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .workload-surveyor {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
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
      flex-shrink: 0;
    }

    .workload-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .workload-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .workload-stats {
      font-size: 11px;
      color: #64748b;
    }

    .workload-bar-container {
      width: 80px;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .workload-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .workload-hours {
      position: absolute;
      right: -32px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      width: 28px;
    }

    .workload-status {
      font-size: 11px;
      font-weight: 600;
      width: 60px;
      text-align: right;
      flex-shrink: 0;
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
export class WorkloadPanelComponent {
  @Input() isOpen = false;
  @Input() workloadData: WorkloadItem[] = [];

  @Output() close = new EventEmitter<void>();

  private readonly AVATAR_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

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

  getAverageWorkload(): number {
    if (this.workloadData.length === 0) return 0;
    const total = this.workloadData.reduce((sum, w) => sum + w.hoursWeek, 0);
    return Math.round((total / this.workloadData.length) * 10) / 10;
  }

  getWorkloadVariance(): string {
    if (this.workloadData.length < 2) return 'N/A';
    const avg = this.getAverageWorkload();
    const variance = this.workloadData.reduce((sum, w) => sum + Math.pow(w.hoursWeek - avg, 2), 0) / this.workloadData.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 5) return 'Balanced';
    if (stdDev < 10) return 'Uneven';
    return 'Imbalanced';
  }

  getWorkloadBarWidth(hours: number, maxHours: number = 40): number {
    return Math.min((hours / maxHours) * 100, 100);
  }

  getWorkloadColor(hoursWeek: number): string {
    if (hoursWeek < 20) return '#22c55e';
    if (hoursWeek < 35) return '#f59e0b';
    return '#ef4444';
  }

  getWorkloadStatus(hoursWeek: number): string {
    if (hoursWeek < 20) return 'Light';
    if (hoursWeek < 35) return 'Normal';
    if (hoursWeek < 45) return 'Heavy';
    return 'Overloaded';
  }
}
