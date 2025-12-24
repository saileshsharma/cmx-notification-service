import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { SurveyorService, AppointmentService, NotificationService } from '../../core/services';
import { DashboardWidget, DashboardStats } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-overlay" (click)="close.emit()">
      <div class="dashboard-panel" (click)="$event.stopPropagation()">
        <div class="dashboard-header">
          <h2>Dashboard</h2>
          <button class="close-btn" (click)="close.emit()">&#10005;</button>
        </div>

        <div class="dashboard-content">
          <!-- Stats Section -->
          <div class="stats-section">
            <div class="stat-card">
              <div class="stat-icon available">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{stats.availableCount}}</span>
                <span class="stat-label">Available</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon busy">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{stats.busyCount}}</span>
                <span class="stat-label">Busy</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon offline">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{stats.offlineCount}}</span>
                <span class="stat-label">Offline</span>
              </div>
            </div>

            <div class="stat-card total">
              <div class="stat-icon total">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{stats.totalSurveyors}}</span>
                <span class="stat-label">Total Surveyors</span>
              </div>
            </div>
          </div>

          <!-- Appointments Section -->
          <div class="appointments-section">
            <h3>Appointments</h3>
            <div class="appointment-stats">
              <div class="appt-stat">
                <span class="appt-value">{{stats.appointmentsToday}}</span>
                <span class="appt-label">Today</span>
              </div>
              <div class="appt-stat">
                <span class="appt-value">{{stats.appointmentsThisWeek}}</span>
                <span class="appt-label">This Week</span>
              </div>
            </div>
          </div>

          <!-- Widgets Section -->
          <div class="widgets-section" *ngIf="widgets.length > 0">
            <h3>Quick Stats</h3>
            <div class="widgets-grid">
              <div class="widget" *ngFor="let widget of widgets">
                <div class="widget-title">{{widget.title}}</div>
                <div class="widget-value">{{widget.value}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dashboard-panel {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #eee;
    }

    .dashboard-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 4px 12px;
      border-radius: 8px;
    }

    .close-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    .dashboard-content {
      padding: 24px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.available {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
      color: white;
    }

    .stat-icon.busy {
      background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
      color: white;
    }

    .stat-icon.offline {
      background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
      color: white;
    }

    .stat-icon.total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
      margin-top: 4px;
    }

    .appointments-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 24px;
      color: white;
      margin-bottom: 32px;
    }

    .appointments-section h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      opacity: 0.9;
    }

    .appointment-stats {
      display: flex;
      gap: 48px;
    }

    .appt-stat {
      display: flex;
      flex-direction: column;
    }

    .appt-value {
      font-size: 36px;
      font-weight: 700;
    }

    .appt-label {
      font-size: 14px;
      opacity: 0.8;
    }

    .widgets-section h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
    }

    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .widget {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .widget-title {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }

    .widget-value {
      font-size: 24px;
      font-weight: 600;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  stats: DashboardStats = {
    totalSurveyors: 0,
    availableCount: 0,
    busyCount: 0,
    offlineCount: 0,
    appointmentsToday: 0,
    appointmentsThisWeek: 0
  };

  widgets: DashboardWidget[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private surveyorService: SurveyorService,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      combineLatest([
        this.surveyorService.allSurveyors$,
        this.surveyorService.stats$
      ]).subscribe(([surveyors, stats]) => {
        this.stats = {
          totalSurveyors: surveyors.length,
          availableCount: stats.available,
          busyCount: stats.busy,
          offlineCount: stats.offline,
          appointmentsToday: 0,
          appointmentsThisWeek: 0
        };

        this.calculateAppointmentStats();
        this.buildWidgets();
      })
    );

    this.surveyorService.loadAllSurveyors().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private calculateAppointmentStats(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Load today's appointments
    this.appointmentService.loadEvents(today, tomorrow).subscribe(events => {
      this.stats.appointmentsToday = events.length;
    });

    // Load this week's appointments
    this.appointmentService.loadEvents(weekStart, weekEnd).subscribe(events => {
      this.stats.appointmentsThisWeek = events.length;
    });
  }

  private buildWidgets(): void {
    this.widgets = [
      {
        id: 'utilization',
        title: 'Utilization Rate',
        type: 'stat',
        value: this.stats.totalSurveyors > 0
          ? `${Math.round((this.stats.busyCount / this.stats.totalSurveyors) * 100)}%`
          : '0%'
      },
      {
        id: 'availability',
        title: 'Availability Rate',
        type: 'stat',
        value: this.stats.totalSurveyors > 0
          ? `${Math.round((this.stats.availableCount / this.stats.totalSurveyors) * 100)}%`
          : '0%'
      }
    ];
  }
}
