import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { AppointmentService, SurveyorService } from '../../core/services';
import { Surveyor, TimelineEvent } from '../../core/models';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <!-- Timeline Header -->
      <div class="timeline-header">
        <h2>Timeline View</h2>
        <div class="timeline-nav">
          <button class="nav-btn" (click)="prevDay()">&#9664;</button>
          <span class="current-date">{{formatDate(timelineDate)}}</span>
          <button class="nav-btn" (click)="nextDay()">&#9654;</button>
          <button class="nav-btn today" (click)="goToToday()">Today</button>
        </div>
      </div>

      <!-- Timeline Grid -->
      <div class="timeline-grid">
        <!-- Time axis -->
        <div class="time-axis">
          <div class="time-slot" *ngFor="let hour of timelineHours">
            {{hour}}
          </div>
        </div>

        <!-- Surveyor rows -->
        <div class="surveyor-rows">
          <div class="surveyor-row" *ngFor="let s of surveyors">
            <div class="surveyor-label">
              <div class="avatar" [style.background-color]="getAvatarColor(s.display_name)">
                {{getInitials(s.display_name)}}
              </div>
              <span class="name">{{s.display_name}}</span>
            </div>
            <div class="events-track">
              <!-- Time grid lines -->
              <div class="grid-line" *ngFor="let hour of timelineHours" [style.left.%]="getHourPosition(hour)"></div>

              <!-- Current time indicator -->
              <div class="current-time-line" [style.left]="currentTimePosition" *ngIf="isToday"></div>

              <!-- Events -->
              <div
                *ngFor="let event of getEventsForSurveyor(s.id)"
                class="timeline-event"
                [class]="event.state.toLowerCase()"
                [style.left]="event.left"
                [style.width]="event.width"
                [title]="event.title + ' (' + event.state + ')'">
                <span class="event-title">{{event.title}}</span>
              </div>
            </div>
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
    .timeline-container {
      flex: 1;
      padding: 20px;
      background: white;
      border-radius: 12px;
      margin: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .timeline-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .timeline-nav {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-btn {
      padding: 8px 12px;
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

    .nav-btn.today {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }

    .current-date {
      font-weight: 500;
      min-width: 150px;
      text-align: center;
    }

    .timeline-grid {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }

    .time-axis {
      display: flex;
      padding-left: 180px;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
    }

    .time-slot {
      flex: 1;
      padding: 8px;
      font-size: 12px;
      color: #666;
      text-align: center;
      min-width: 60px;
    }

    .surveyor-rows {
      flex: 1;
      overflow-y: auto;
    }

    .surveyor-row {
      display: flex;
      border-bottom: 1px solid #eee;
      min-height: 60px;
    }

    .surveyor-row:hover {
      background: #fafafa;
    }

    .surveyor-label {
      width: 180px;
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

    .events-track {
      flex: 1;
      position: relative;
      min-height: 50px;
    }

    .grid-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: #f0f0f0;
    }

    .current-time-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #dc3545;
      z-index: 10;
    }

    .current-time-line::before {
      content: '';
      position: absolute;
      top: 0;
      left: -4px;
      width: 10px;
      height: 10px;
      background: #dc3545;
      border-radius: 50%;
    }

    .timeline-event {
      position: absolute;
      top: 8px;
      bottom: 8px;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      color: white;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .timeline-event:hover {
      transform: scaleY(1.1);
      z-index: 5;
    }

    .timeline-event.busy {
      background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
    }

    .timeline-event.available {
      background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
    }

    .timeline-event.offline {
      background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
    }

    .event-title {
      font-weight: 500;
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
export class TimelineComponent implements OnInit, OnDestroy {
  @Input() selectedSurveyorIds: number[] = [];

  surveyors: Surveyor[] = [];
  timelineEvents: Map<number, TimelineEvent[]> = new Map();
  timelineHours: string[] = [];
  timelineDate = new Date();
  currentTimePosition = '0%';

  private subscriptions: Subscription[] = [];
  private timeUpdateInterval: any;

  constructor(
    private appointmentService: AppointmentService,
    private surveyorService: SurveyorService
  ) {
    this.initTimelineHours();
  }

  ngOnInit(): void {
    this.subscriptions.push(
      combineLatest([
        this.surveyorService.allSurveyors$,
        this.appointmentService.events$
      ]).subscribe(([surveyors, events]) => {
        this.surveyors = this.selectedSurveyorIds.length > 0
          ? surveyors.filter(s => this.selectedSurveyorIds.includes(s.id))
          : surveyors;
        this.processEvents(events);
      })
    );

    this.updateCurrentTimePosition();
    this.timeUpdateInterval = setInterval(() => {
      this.updateCurrentTimePosition();
    }, 60000);

    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  private initTimelineHours(): void {
    this.timelineHours = [];
    for (let i = 6; i <= 22; i++) {
      const hour = i % 12 || 12;
      const ampm = i < 12 ? 'AM' : 'PM';
      this.timelineHours.push(`${hour}${ampm}`);
    }
  }

  private loadData(): void {
    this.surveyorService.loadAllSurveyors().subscribe();

    const from = new Date(this.timelineDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(this.timelineDate);
    to.setHours(23, 59, 59, 999);

    this.appointmentService.loadEvents(from, to).subscribe();
  }

  private processEvents(events: any[]): void {
    this.timelineEvents.clear();
    const dayStart = new Date(this.timelineDate);
    dayStart.setHours(6, 0, 0, 0);

    events.forEach(event => {
      const surveyorId = event.extendedProps?.surveyorId;
      if (!surveyorId) return;

      const start = new Date(event.start);
      const end = new Date(event.end);

      // Only show events for the current timeline date
      if (start.toDateString() !== this.timelineDate.toDateString()) return;

      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end.getHours() + end.getMinutes() / 60;
      const dayHours = 16; // 6 AM to 10 PM

      const left = `${Math.max(0, (startHour - 6) / dayHours * 100)}%`;
      const width = `${Math.min(100, (endHour - startHour) / dayHours * 100)}%`;

      const timelineEvent: TimelineEvent = {
        id: event.id,
        surveyorId,
        title: event.title,
        start,
        end,
        state: event.extendedProps?.state || 'BUSY',
        left,
        width,
        color: event.color || '#3788d8'
      };

      if (!this.timelineEvents.has(surveyorId)) {
        this.timelineEvents.set(surveyorId, []);
      }
      this.timelineEvents.get(surveyorId)!.push(timelineEvent);
    });
  }

  private updateCurrentTimePosition(): void {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const position = ((hours - 6) / 16) * 100;
    this.currentTimePosition = `${Math.max(0, Math.min(100, position))}%`;
  }

  get isToday(): boolean {
    const today = new Date();
    return this.timelineDate.toDateString() === today.toDateString();
  }

  getEventsForSurveyor(surveyorId: number): TimelineEvent[] {
    return this.timelineEvents.get(surveyorId) || [];
  }

  getHourPosition(hour: string): number {
    const index = this.timelineHours.indexOf(hour);
    return (index / this.timelineHours.length) * 100;
  }

  getInitials(name: string): string {
    return this.surveyorService.getInitials(name);
  }

  getAvatarColor(name: string): string {
    return this.surveyorService.getAvatarColor(name);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  prevDay(): void {
    this.timelineDate = new Date(this.timelineDate.setDate(this.timelineDate.getDate() - 1));
    this.loadData();
  }

  nextDay(): void {
    this.timelineDate = new Date(this.timelineDate.setDate(this.timelineDate.getDate() + 1));
    this.loadData();
  }

  goToToday(): void {
    this.timelineDate = new Date();
    this.loadData();
  }
}
