import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TravelEstimate {
  fromEvent: any;
  toEvent: any;
  travelMinutes: number;
  gapMinutes: number;
  isTight: boolean;
}

export interface TravelTimeSummary {
  surveyorId: number;
  surveyorName: string;
  estimates: TravelEstimate[];
}

/**
 * Travel Time Panel Component
 *
 * Displays travel time analysis for surveyors showing:
 * - Summary stats (surveyor count, tight schedules)
 * - Per-surveyor travel routes with timing gaps
 * - Warnings for tight schedules where travel time may not be sufficient
 */
@Component({
  selector: 'app-travel-time-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="side-panel travel-time-panel" *ngIf="isOpen">
      <div class="panel-header">
        <h3>Travel Time Analysis</h3>
        <button class="close-btn" (click)="close.emit()">&#10005;</button>
      </div>
      <div class="panel-summary">
        <div class="summary-stat">
          <span class="summary-value">{{summaryData.length}}</span>
          <span class="summary-label">Surveyors</span>
        </div>
        <div class="summary-stat">
          <span class="summary-value" [class.warning]="hasTightSchedules()">
            {{getTightScheduleCount()}}
          </span>
          <span class="summary-label">Tight Schedules</span>
        </div>
      </div>
      <div class="panel-content">
        <div *ngIf="summaryData.length === 0" class="empty-state">
          <p>No travel time data for today's appointments.</p>
          <p class="hint">Travel times are calculated based on surveyor schedules.</p>
        </div>
        <div *ngFor="let s of summaryData" class="travel-surveyor-section">
          <div class="travel-surveyor-header">
            <div class="avatar small" [style.background-color]="getAvatarColor(s.surveyorName)">
              {{getInitials(s.surveyorName)}}
            </div>
            <span class="surveyor-name">{{s.surveyorName}}</span>
            <span class="travel-warning-count" *ngIf="hasTightEstimates(s.estimates)">
              {{getTightEstimateCount(s.estimates)}} warning{{getTightEstimateCount(s.estimates) > 1 ? 's' : ''}}
            </span>
          </div>
          <div class="travel-routes">
            <div *ngFor="let est of s.estimates" class="travel-route" [class.tight]="est.isTight" [class.ok]="!est.isTight && est.gapMinutes > 0">
              <div class="route-info">
                <div class="route-from">
                  <span class="route-icon">&#128205;</span>
                  <span class="route-label">{{getEventTitle(est.fromEvent)}}</span>
                  <span class="route-time" *ngIf="est.fromEvent">ends {{formatEventTime(est.fromEvent)}}</span>
                </div>
                <div class="route-arrow">&#8594;</div>
                <div class="route-to">
                  <span class="route-icon">&#127919;</span>
                  <span class="route-label">{{getEventTitle(est.toEvent)}}</span>
                  <span class="route-time">starts {{formatEventTime(est.toEvent)}}</span>
                </div>
              </div>
              <div class="route-timing">
                <span class="travel-time">~{{est.travelMinutes}} min travel</span>
                <span class="gap-time" *ngIf="est.gapMinutes > 0" [class.tight]="est.isTight">
                  {{est.gapMinutes}} min gap
                  <span class="status-icon" *ngIf="est.isTight">&#9888;&#65039;</span>
                  <span class="status-icon" *ngIf="!est.isTight">&#10003;</span>
                </span>
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
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
      color: #ea580c;
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

    .travel-surveyor-section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .travel-surveyor-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
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

    .travel-warning-count {
      background: #fef3c7;
      color: #d97706;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .travel-routes {
      padding: 12px;
    }

    .travel-route {
      padding: 14px;
      border-radius: 10px;
      margin-bottom: 10px;
      border: 1px solid #e2e8f0;
      background: #fff;
      transition: all 0.2s;
    }

    .travel-route:last-child {
      margin-bottom: 0;
    }

    .travel-route.tight {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .travel-route.ok {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .route-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }

    .route-from,
    .route-to {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .route-icon {
      font-size: 14px;
      width: 20px;
      text-align: center;
    }

    .route-label {
      font-weight: 500;
      color: #1e293b;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .route-time {
      font-size: 12px;
      color: #64748b;
      white-space: nowrap;
    }

    .route-arrow {
      color: #94a3b8;
      font-size: 16px;
      text-align: center;
      padding: 4px 0;
    }

    .route-timing {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px dashed #e2e8f0;
    }

    .travel-time {
      font-size: 13px;
      color: #3b82f6;
      font-weight: 500;
    }

    .gap-time {
      font-size: 13px;
      color: #22c55e;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .gap-time.tight {
      color: #ea580c;
    }

    .status-icon {
      font-size: 12px;
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
export class TravelTimePanelComponent {
  @Input() isOpen = false;
  @Input() summaryData: TravelTimeSummary[] = [];

  @Output() close = new EventEmitter<void>();

  // Color palette for avatars
  private readonly AVATAR_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  hasTightSchedules(): boolean {
    return this.summaryData.some(s => s.estimates.some(e => e.isTight));
  }

  getTightScheduleCount(): number {
    return this.summaryData.reduce((sum, s) => sum + s.estimates.filter(e => e.isTight).length, 0);
  }

  hasTightEstimates(estimates: TravelEstimate[]): boolean {
    return estimates.some(e => e.isTight);
  }

  getTightEstimateCount(estimates: TravelEstimate[]): number {
    return estimates.filter(e => e.isTight).length;
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

  formatEventTime(event: any): string {
    if (!event) return 'Home';
    const date = new Date(event.start || event.end);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  getEventTitle(event: any): string {
    if (!event) return 'Starting from Home';
    return event.title || 'Appointment';
  }
}
