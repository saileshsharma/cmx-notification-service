import { Component, OnInit, OnDestroy, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FullCalendarModule, FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventDropArg, EventApi } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { AppointmentService, SurveyorService, NotificationService, StorageService } from '../../core/services';
import { CalendarEvent, Surveyor } from '../../core/models';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  template: `
    <div class="calendar-container">
      <full-calendar #calendar [options]="calendarOptions"></full-calendar>
    </div>
  `,
  styles: [`
    .calendar-container {
      flex: 1;
      padding: 24px;
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 20px;
      margin: 20px;
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06),
        0 20px 25px -5px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(226, 232, 240, 0.8);
      transition: box-shadow 0.3s ease;
    }

    .calendar-container:hover {
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06),
        0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }

    :host ::ng-deep .fc {
      height: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    :host ::ng-deep .fc-toolbar {
      padding: 8px 0 20px 0;
      margin-bottom: 16px !important;
      border-bottom: 2px solid #f1f5f9;
    }

    :host ::ng-deep .fc-toolbar-title {
      font-size: 1.5em !important;
      font-weight: 700 !important;
      background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.025em;
    }

    :host ::ng-deep .fc-button-group {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    :host ::ng-deep .fc-button {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
      border: none !important;
      padding: 10px 16px !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      text-transform: capitalize !important;
      letter-spacing: 0.025em;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    :host ::ng-deep .fc-button:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
    }

    :host ::ng-deep .fc-button:active {
      transform: translateY(0);
    }

    :host ::ng-deep .fc-button-active {
      background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    :host ::ng-deep .fc-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host ::ng-deep .fc-today-button {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
      margin-right: 8px !important;
      border-radius: 10px !important;
    }

    :host ::ng-deep .fc-today-button:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
    }

    :host ::ng-deep .fc-prev-button,
    :host ::ng-deep .fc-next-button {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
      color: #475569 !important;
    }

    :host ::ng-deep .fc-prev-button:hover,
    :host ::ng-deep .fc-next-button:hover {
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%) !important;
      box-shadow: 0 4px 12px rgba(71, 85, 105, 0.2) !important;
    }

    :host ::ng-deep .fc-event {
      border-radius: 8px !important;
      border: none !important;
      padding: 4px 8px !important;
      font-weight: 500;
      font-size: 0.8rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
      cursor: pointer;
    }

    :host ::ng-deep .fc-event:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10 !important;
    }

    :host ::ng-deep .fc-event-main {
      padding: 2px 4px;
    }

    :host ::ng-deep .fc-event-title {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host ::ng-deep .fc-event-time {
      font-weight: 400;
      opacity: 0.9;
    }

    :host ::ng-deep .fc-timegrid-slot {
      height: 48px !important;
      border-color: #f1f5f9 !important;
    }

    :host ::ng-deep .fc-timegrid-slot-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #64748b;
      padding-right: 12px !important;
    }

    :host ::ng-deep .fc-col-header-cell {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      font-weight: 600;
      font-size: 0.875rem;
      color: #334155;
      padding: 14px 8px !important;
      border-bottom: 2px solid #e2e8f0 !important;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    :host ::ng-deep .fc-col-header-cell-cushion {
      padding: 8px !important;
    }

    :host ::ng-deep .fc-day-today {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%) !important;
    }

    :host ::ng-deep .fc-day-today .fc-col-header-cell-cushion {
      color: #6366f1 !important;
      font-weight: 700 !important;
    }

    :host ::ng-deep .fc-timegrid-now-indicator-line {
      border-color: #ef4444 !important;
      border-width: 2px !important;
    }

    :host ::ng-deep .fc-timegrid-now-indicator-arrow {
      border-color: #ef4444 !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
    }

    :host ::ng-deep .fc-daygrid-day-number {
      font-weight: 500;
      color: #475569;
      padding: 8px 12px !important;
      font-size: 0.9rem;
    }

    :host ::ng-deep .fc-daygrid-day-top {
      flex-direction: row !important;
    }

    :host ::ng-deep .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white !important;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 4px;
    }

    :host ::ng-deep .fc-scrollgrid {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0 !important;
    }

    :host ::ng-deep .fc-scrollgrid td,
    :host ::ng-deep .fc-scrollgrid th {
      border-color: #f1f5f9 !important;
    }

    :host ::ng-deep .fc-highlight {
      background: rgba(99, 102, 241, 0.15) !important;
      border-radius: 6px;
    }

    :host ::ng-deep .fc-daygrid-event-dot {
      border-color: currentColor !important;
    }

    :host ::ng-deep .fc-timegrid-col-events {
      margin: 0 4px !important;
    }

    :host ::ng-deep .fc-v-event {
      background: linear-gradient(180deg, var(--fc-event-bg-color, #6366f1) 0%, color-mix(in srgb, var(--fc-event-bg-color, #6366f1), #000 10%) 100%) !important;
    }

    :host ::ng-deep .fc-more-link {
      color: #6366f1 !important;
      font-weight: 600;
      font-size: 0.75rem;
    }

    :host ::ng-deep .fc-popover {
      border-radius: 12px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
      border: 1px solid #e2e8f0 !important;
    }

    :host ::ng-deep .fc-popover-header {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%) !important;
      border-radius: 12px 12px 0 0 !important;
      padding: 10px 14px !important;
      font-weight: 600;
    }
  `]
})
export class CalendarComponent implements OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  @Input() selectedSurveyorIds: number[] = [];

  @Output() dateSelect = new EventEmitter<DateSelectArg>();
  @Output() eventClick = new EventEmitter<EventClickArg>();
  @Output() eventDrop = new EventEmitter<EventDropArg>();
  @Output() eventResize = new EventEmitter<any>();

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    initialView: 'timeGridWeek',
    nowIndicator: true,
    weekends: true,
    selectable: true,
    selectMirror: true,
    editable: true,
    eventResizableFromStart: true,
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    scrollTime: '08:00:00',
    slotDuration: '00:30:00',
    events: [],
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventDrop: this.handleEventDrop.bind(this),
    eventResize: this.handleEventResize.bind(this),
    eventColor: '#3788d8'
  };

  private events: CalendarEvent[] = [];
  private subscriptions: Subscription[] = [];
  private surveyorColors: Map<number, string> = new Map();

  constructor(
    private appointmentService: AppointmentService,
    private surveyorService: SurveyorService,
    private notificationService: NotificationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.appointmentService.events$.subscribe(events => {
        this.events = events;
        this.updateCalendarEvents();
      }),
      this.storageService.colors$.subscribe(colors => {
        this.surveyorColors = colors;
        this.updateCalendarEvents();
      })
    );

    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadEvents(): void {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 30);

    this.appointmentService.loadEvents(from, to, this.selectedSurveyorIds.length > 0 ? this.selectedSurveyorIds : undefined)
      .subscribe();
  }

  private updateCalendarEvents(): void {
    let displayEvents = this.events;

    // Filter by selected surveyors if any
    if (this.selectedSurveyorIds.length > 0) {
      displayEvents = this.events.filter(e =>
        e.extendedProps?.surveyorId && this.selectedSurveyorIds.includes(e.extendedProps.surveyorId)
      );
    }

    // Apply custom colors
    const coloredEvents = displayEvents.map(event => {
      const surveyorId = event.extendedProps?.surveyorId;
      const customColor = surveyorId ? this.surveyorColors.get(surveyorId) : undefined;
      return {
        ...event,
        color: customColor || event.color
      };
    });

    this.calendarOptions = {
      ...this.calendarOptions,
      events: coloredEvents
    };
  }

  private handleDateSelect(selectInfo: DateSelectArg): void {
    this.dateSelect.emit(selectInfo);
  }

  private handleEventClick(clickInfo: EventClickArg): void {
    this.eventClick.emit(clickInfo);
  }

  private handleEventDrop(dropInfo: EventDropArg): void {
    this.eventDrop.emit(dropInfo);
  }

  private handleEventResize(resizeInfo: any): void {
    this.eventResize.emit(resizeInfo);
  }

  // Public methods for parent component
  refresh(): void {
    this.loadEvents();
  }

  goToDate(date: Date): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.gotoDate(date);
    }
  }

  changeView(view: string): void {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
    }
  }
}
