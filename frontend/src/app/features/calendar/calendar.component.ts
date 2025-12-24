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
      padding: 20px;
      background: white;
      border-radius: 12px;
      margin: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    :host ::ng-deep .fc {
      height: 100%;
    }

    :host ::ng-deep .fc-toolbar-title {
      font-size: 1.2em !important;
      font-weight: 600;
    }

    :host ::ng-deep .fc-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border: none !important;
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
    }

    :host ::ng-deep .fc-button:hover {
      opacity: 0.9;
    }

    :host ::ng-deep .fc-button-active {
      background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%) !important;
    }

    :host ::ng-deep .fc-event {
      border-radius: 4px;
      border: none;
      padding: 2px 4px;
    }

    :host ::ng-deep .fc-timegrid-slot {
      height: 40px;
    }

    :host ::ng-deep .fc-col-header-cell {
      background: #f8f9fa;
      font-weight: 500;
    }

    :host ::ng-deep .fc-day-today {
      background: rgba(102, 126, 234, 0.05) !important;
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
