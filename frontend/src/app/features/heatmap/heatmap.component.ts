import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { AppointmentService, SurveyorService } from '../../core/services';
import { Surveyor, WorkloadDay } from '../../core/models';

@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="heatmap-container">
      <!-- Header -->
      <div class="heatmap-header">
        <h2>Workload Heatmap</h2>
        <div class="heatmap-nav">
          <button class="nav-btn" (click)="prevWeek()">&#9664; Previous</button>
          <span class="week-label">{{getWeekLabel()}}</span>
          <button class="nav-btn" (click)="nextWeek()">Next &#9654;</button>
        </div>
      </div>

      <!-- Legend -->
      <div class="heatmap-legend">
        <span class="legend-label">Less</span>
        <div class="legend-scale">
          <div class="legend-item" style="background: #e8f5e9;"></div>
          <div class="legend-item" style="background: #c8e6c9;"></div>
          <div class="legend-item" style="background: #a5d6a7;"></div>
          <div class="legend-item" style="background: #81c784;"></div>
          <div class="legend-item" style="background: #66bb6a;"></div>
        </div>
        <span class="legend-label">More</span>
      </div>

      <!-- Heatmap Grid -->
      <div class="heatmap-grid">
        <!-- Day Headers -->
        <div class="heatmap-row header-row">
          <div class="surveyor-cell"></div>
          <div class="day-cell" *ngFor="let day of dayLabels">{{day}}</div>
        </div>

        <!-- Surveyor Rows -->
        <div class="heatmap-row" *ngFor="let s of surveyors">
          <div class="surveyor-cell">
            <div class="avatar" [style.background-color]="getAvatarColor(s.display_name)">
              {{getInitials(s.display_name)}}
            </div>
            <span class="name">{{s.display_name}}</span>
          </div>
          <div
            class="day-cell heatmap-cell"
            *ngFor="let day of getWorkloadForSurveyor(s.id)"
            [style.background-color]="getHeatmapColor(day.count)"
            [title]="day.count + ' appointments on ' + day.date">
            <span class="cell-count" *ngIf="day.count > 0">{{day.count}}</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="surveyors.length === 0">
        <p>No surveyors to display</p>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-container {
      flex: 1;
      padding: 20px;
      background: white;
      border-radius: 12px;
      margin: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
    }

    .heatmap-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .heatmap-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .heatmap-nav {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-btn:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }

    .week-label {
      font-weight: 500;
      min-width: 200px;
      text-align: center;
    }

    .heatmap-legend {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
    }

    .legend-label {
      font-size: 12px;
      color: #666;
    }

    .legend-scale {
      display: flex;
      gap: 2px;
    }

    .legend-item {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }

    .heatmap-grid {
      flex: 1;
      overflow: auto;
    }

    .heatmap-row {
      display: flex;
      border-bottom: 1px solid #eee;
    }

    .heatmap-row.header-row {
      background: #f8f9fa;
      font-weight: 500;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .surveyor-cell {
      width: 200px;
      padding: 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-right: 1px solid #eee;
      flex-shrink: 0;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 12px;
    }

    .name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .day-cell {
      flex: 1;
      padding: 12px;
      text-align: center;
      min-width: 80px;
    }

    .heatmap-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .heatmap-cell:hover {
      transform: scale(1.05);
      z-index: 1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .cell-count {
      font-weight: 600;
      font-size: 14px;
      color: #2e7d32;
    }

    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }
  `]
})
export class HeatmapComponent implements OnInit, OnDestroy {
  @Input() selectedSurveyorIds: number[] = [];

  surveyors: Surveyor[] = [];
  workloadData: Map<number, WorkloadDay[]> = new Map();
  heatmapWeekStart = new Date();
  dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  private subscriptions: Subscription[] = [];

  constructor(
    private appointmentService: AppointmentService,
    private surveyorService: SurveyorService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.surveyorService.allSurveyors$.subscribe(surveyors => {
        this.surveyors = this.selectedSurveyorIds.length > 0
          ? surveyors.filter(s => this.selectedSurveyorIds.includes(s.id))
          : surveyors;
        this.loadWorkloadData();
      })
    );

    this.surveyorService.loadAllSurveyors().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private loadWorkloadData(): void {
    if (this.surveyors.length === 0) return;

    this.appointmentService.loadWorkloadData(this.heatmapWeekStart, this.surveyors)
      .subscribe(data => {
        this.workloadData = data;
      });
  }

  getWorkloadForSurveyor(surveyorId: number): WorkloadDay[] {
    return this.workloadData.get(surveyorId) || this.getEmptyWeek();
  }

  private getEmptyWeek(): WorkloadDay[] {
    return this.dayLabels.map((dayName, i) => {
      const date = new Date(this.heatmapWeekStart);
      date.setDate(date.getDate() - date.getDay() + i);
      return {
        date: date.toISOString().split('T')[0],
        dayName,
        count: 0
      };
    });
  }

  getHeatmapColor(count: number): string {
    return this.appointmentService.getHeatmapColor(count);
  }

  getInitials(name: string): string {
    return this.surveyorService.getInitials(name);
  }

  getAvatarColor(name: string): string {
    return this.surveyorService.getAvatarColor(name);
  }

  getWeekLabel(): string {
    const start = new Date(this.heatmapWeekStart);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  prevWeek(): void {
    this.heatmapWeekStart.setDate(this.heatmapWeekStart.getDate() - 7);
    this.heatmapWeekStart = new Date(this.heatmapWeekStart);
    this.loadWorkloadData();
  }

  nextWeek(): void {
    this.heatmapWeekStart.setDate(this.heatmapWeekStart.getDate() + 7);
    this.heatmapWeekStart = new Date(this.heatmapWeekStart);
    this.loadWorkloadData();
  }
}
