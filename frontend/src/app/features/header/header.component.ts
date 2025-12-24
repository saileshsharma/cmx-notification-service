import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, AppointmentService } from '../../core/services';
import { UpcomingAlert } from '../../core/models';

type ViewType = 'calendar' | 'timeline' | 'heatmap';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header>
      <div class="header-left">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <strong>Dispatcher Calendar</strong>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="header-center">
        <div class="view-toggle">
          <button [class.active]="currentView === 'calendar'" (click)="viewChange.emit('calendar')" title="Calendar View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>Calendar</span>
          </button>
          <button [class.active]="currentView === 'timeline'" (click)="viewChange.emit('timeline')" title="Timeline View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="12" x2="16" y2="12"></line>
              <line x1="4" y1="18" x2="12" y2="18"></line>
            </svg>
            <span>Timeline</span>
          </button>
          <button [class.active]="currentView === 'heatmap'" (click)="viewChange.emit('heatmap')" title="Heatmap View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Heatmap</span>
          </button>
        </div>
      </div>

      <div class="header-right">
        <!-- Alerts -->
        <div class="alerts-container">
          <button class="btn-icon" (click)="toggleAlertsPanel()" [class.has-alerts]="upcomingAlerts.length > 0" title="Tomorrow's Schedule">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="alerts-badge" *ngIf="upcomingAlerts.length > 0">{{upcomingAlerts.length}}</span>
          </button>
          <div class="alerts-panel" *ngIf="showAlertsPanel" (click)="$event.stopPropagation()">
            <div class="alerts-header">
              <strong>Tomorrow's Schedule</strong>
              <button class="close-btn" (click)="toggleAlertsPanel()">&#10005;</button>
            </div>
            <div class="alerts-list" *ngIf="upcomingAlerts.length > 0">
              <div *ngFor="let alert of upcomingAlerts" class="alert-item" [class.busy]="alert.state === 'BUSY'" [class.offline]="alert.state === 'OFFLINE'">
                <span class="alert-time">{{alert.startTime}}</span>
                <span class="alert-name">{{alert.surveyorName}}</span>
                <span class="alert-state">{{alert.state}}</span>
              </div>
            </div>
            <div class="no-alerts" *ngIf="upcomingAlerts.length === 0">
              No appointments scheduled for tomorrow
            </div>
          </div>
        </div>

        <div class="header-divider"></div>

        <!-- Dashboard Toggle -->
        <button class="btn-icon" (click)="dashboardToggle.emit()" title="Dashboard (D)" [class.active]="showDashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="9"></rect>
            <rect x="14" y="3" width="7" height="5"></rect>
            <rect x="14" y="12" width="7" height="9"></rect>
            <rect x="3" y="16" width="7" height="5"></rect>
          </svg>
        </button>

        <!-- Activity Log -->
        <button class="btn-icon" (click)="activityLogToggle.emit()" title="Activity Log" [class.active]="showActivityLog">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </button>

        <!-- Test Notifications -->
        <button class="btn-icon dev-btn" (click)="testNotificationClick.emit()" title="Test Notifications (Dev)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            <line x1="12" y1="2" x2="12" y2="5"></line>
          </svg>
        </button>

        <!-- Refresh -->
        <button class="btn-icon" (click)="refresh.emit()" title="Refresh (R)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" [class.spinning]="loading">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      </div>
    </header>
  `,
  styles: [`
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left, .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #667eea;
    }

    .logo strong {
      font-size: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-center {
      display: flex;
      align-items: center;
    }

    .view-toggle {
      display: flex;
      background: #f0f0f0;
      border-radius: 8px;
      padding: 4px;
    }

    .view-toggle button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      color: #666;
      transition: all 0.2s;
    }

    .view-toggle button:hover {
      color: #333;
    }

    .view-toggle button.active {
      background: white;
      color: #667eea;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-divider {
      width: 1px;
      height: 24px;
      background: #e0e0e0;
      margin: 0 8px;
    }

    .btn-icon {
      padding: 8px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: #666;
      transition: all 0.2s;
      position: relative;
    }

    .btn-icon:hover {
      background: #f0f0f0;
      color: #333;
    }

    .btn-icon.active {
      background: #e3f2fd;
      color: #2196f3;
    }

    .btn-icon.has-alerts {
      color: #e91e63;
    }

    .btn-icon.dev-btn {
      color: #ff9800;
    }

    .alerts-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background: #e91e63;
      color: white;
      font-size: 10px;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .alerts-container {
      position: relative;
    }

    .alerts-panel {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      z-index: 200;
    }

    .alerts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #eee;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      font-size: 16px;
    }

    .alerts-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .alert-item.busy { border-left: 3px solid #e91e63; }
    .alert-item.offline { border-left: 3px solid #9e9e9e; }

    .alert-time {
      font-weight: 500;
      color: #333;
    }

    .alert-name {
      flex: 1;
    }

    .alert-state {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f0f0f0;
    }

    .no-alerts {
      padding: 24px;
      text-align: center;
      color: #666;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .view-toggle span {
        display: none;
      }

      .logo strong {
        display: none;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() currentView: ViewType = 'calendar';
  @Input() showDashboard = false;
  @Input() showActivityLog = false;
  @Input() loading = false;

  @Output() viewChange = new EventEmitter<ViewType>();
  @Output() dashboardToggle = new EventEmitter<void>();
  @Output() activityLogToggle = new EventEmitter<void>();
  @Output() testNotificationClick = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  upcomingAlerts: UpcomingAlert[] = [];
  showAlertsPanel = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.appointmentService.upcomingAlerts$.subscribe(alerts => {
        this.upcomingAlerts = alerts;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  toggleAlertsPanel(): void {
    this.showAlertsPanel = !this.showAlertsPanel;
  }
}
