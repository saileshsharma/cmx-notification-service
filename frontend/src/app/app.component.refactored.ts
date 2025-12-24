import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';

// Core
import {
  SurveyorService,
  AppointmentService,
  NotificationService,
  StorageService
} from './core/services';
import { Surveyor, Appointment, CalendarEvent, ActivityLogEntry } from './core/models';

// Shared Components
import { ToastComponent, ModalComponent, SidebarComponent } from './shared/components';

// Feature Components
import {
  HeaderComponent,
  CalendarComponent,
  TimelineComponent,
  HeatmapComponent,
  DashboardComponent
} from './features';

type ViewType = 'calendar' | 'timeline' | 'heatmap';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // Shared
    ToastComponent,
    ModalComponent,
    SidebarComponent,
    // Features
    HeaderComponent,
    CalendarComponent,
    TimelineComponent,
    HeatmapComponent,
    DashboardComponent
  ],
  template: `
    <!-- Toast Notifications -->
    <app-toast></app-toast>

    <!-- Header -->
    <app-header
      [currentView]="currentView"
      [showDashboard]="showDashboard"
      [showActivityLog]="showActivityLog"
      [loading]="loading"
      (viewChange)="setView($event)"
      (dashboardToggle)="toggleDashboard()"
      (activityLogToggle)="toggleActivityLog()"
      (testNotificationClick)="openTestNotificationModal()"
      (mobileMenuToggle)="toggleMobileSidebar()"
      (refresh)="refresh()">
    </app-header>

    <!-- Dashboard Overlay -->
    <app-dashboard *ngIf="showDashboard" (close)="toggleDashboard()"></app-dashboard>

    <!-- Activity Log Panel -->
    <div class="activity-log-panel" *ngIf="showActivityLog">
      <div class="activity-header">
        <h3>Activity Log</h3>
        <button class="close-btn" (click)="toggleActivityLog()">&#10005;</button>
      </div>
      <div class="activity-list">
        <div *ngFor="let entry of activityLog" class="activity-item">
          <span class="activity-icon">{{getActivityIcon(entry.action)}}</span>
          <div class="activity-content">
            <div class="activity-action">{{entry.action}}: {{entry.details}}</div>
            <div class="activity-meta">
              <span *ngIf="entry.surveyorName">{{entry.surveyorName}} &bull; </span>
              {{formatActivityTime(entry.timestamp)}}
            </div>
          </div>
        </div>
        <div *ngIf="activityLog.length === 0" class="no-activity">
          No activity yet
        </div>
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div class="sidebar-overlay" [class.visible]="mobileSidebarOpen" (click)="closeMobileSidebar()"></div>

    <!-- Main Layout -->
    <div class="main-layout">
      <!-- Sidebar -->
      <app-sidebar
        [enableMultiSelect]="true"
        [groupByType]="true"
        [class.mobile-open]="mobileSidebarOpen"
        (selectionChange)="onSurveyorSelectionChange($event)">
      </app-sidebar>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Calendar View -->
        <app-calendar
          *ngIf="currentView === 'calendar'"
          #calendarComponent
          [selectedSurveyorIds]="selectedSurveyorIds"
          (dateSelect)="onDateSelect($event)"
          (eventClick)="onEventClick($event)"
          (eventDrop)="onEventDrop($event)"
          (eventResize)="onEventResize($event)">
        </app-calendar>

        <!-- Timeline View -->
        <app-timeline
          *ngIf="currentView === 'timeline'"
          [selectedSurveyorIds]="selectedSurveyorIds">
        </app-timeline>

        <!-- Heatmap View -->
        <app-heatmap
          *ngIf="currentView === 'heatmap'"
          [selectedSurveyorIds]="selectedSurveyorIds">
        </app-heatmap>
      </main>
    </div>

    <!-- Create Appointment Modal -->
    <app-modal
      [isOpen]="showCreateModal"
      title="Create Appointment"
      (close)="closeCreateModal()">
      <div class="modal-form">
        <p><strong>Surveyor:</strong> {{modalSurveyorName}}</p>

        <label>
          <strong>Date</strong>
          <input type="date" [(ngModel)]="modalDate">
        </label>

        <div class="time-row">
          <label>
            <strong>Start Time</strong>
            <input type="time" [(ngModel)]="modalStartTime">
          </label>
          <label>
            <strong>End Time</strong>
            <input type="time" [(ngModel)]="modalEndTime">
          </label>
        </div>

        <label>
          <strong>Status</strong>
          <select [(ngModel)]="modalState">
            <option value="BUSY">Busy</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </label>

        <label>
          <strong>Title (optional)</strong>
          <input type="text" [(ngModel)]="modalTitle" placeholder="e.g., Client meeting">
        </label>

        <label>
          <strong>Description (optional)</strong>
          <textarea [(ngModel)]="modalDescription" placeholder="Additional notes..."></textarea>
        </label>
      </div>

      <div modal-footer>
        <button class="btn-cancel" (click)="closeCreateModal()">Cancel</button>
        <button class="btn-create" (click)="createAppointment()">Create</button>
      </div>
    </app-modal>

    <!-- Edit Appointment Modal -->
    <app-modal
      [isOpen]="showEditModal"
      title="Edit Appointment"
      (close)="closeEditModal()">
      <div class="modal-form">
        <p><strong>Surveyor:</strong> {{editSurveyorName}}</p>

        <label>
          <strong>Date</strong>
          <input type="date" [(ngModel)]="editDate" [disabled]="editIsPast">
        </label>

        <div class="time-row">
          <label>
            <strong>Start Time</strong>
            <input type="time" [(ngModel)]="editStartTime" [disabled]="editIsPast">
          </label>
          <label>
            <strong>End Time</strong>
            <input type="time" [(ngModel)]="editEndTime" [disabled]="editIsPast">
          </label>
        </div>

        <label>
          <strong>Status</strong>
          <select [(ngModel)]="editState" [disabled]="editIsPast">
            <option value="BUSY">Busy</option>
            <option value="OFFLINE">Offline</option>
            <option value="AVAILABLE">Available</option>
          </select>
        </label>

        <label>
          <strong>Title (optional)</strong>
          <input type="text" [(ngModel)]="editTitle" [disabled]="editIsPast">
        </label>

        <label>
          <strong>Description (optional)</strong>
          <textarea [(ngModel)]="editDescription" [disabled]="editIsPast"></textarea>
        </label>

        <p class="past-warning" *ngIf="editIsPast">This appointment is in the past and cannot be edited.</p>
      </div>

      <div modal-footer>
        <button class="btn-delete" (click)="deleteAppointment()" *ngIf="!editIsPast">Delete</button>
        <button class="btn-cancel" (click)="closeEditModal()">Cancel</button>
        <button class="btn-create" (click)="updateAppointment()" *ngIf="!editIsPast">Save</button>
      </div>
    </app-modal>

    <!-- Test Notification Modal -->
    <app-modal
      [isOpen]="showTestNotificationModal"
      title="Test Push Notifications"
      (close)="closeTestNotificationModal()">
      <div class="modal-form">
        <label>
          <strong>Title</strong>
          <input type="text" [(ngModel)]="testNotificationTitle">
        </label>

        <label>
          <strong>Message</strong>
          <textarea [(ngModel)]="testNotificationMessage"></textarea>
        </label>

        <div class="test-results" *ngIf="testNotificationResults">
          <h4>Results:</h4>
          <div *ngFor="let result of testNotificationResults" class="result-item">
            <strong>{{result.surveyorName}}</strong>:
            Push: {{result.pushNotificationsSent}},
            Email: {{result.emailSent ? 'Yes' : 'No'}},
            SMS: {{result.smsSent ? 'Yes' : 'No'}}
            <div class="errors" *ngIf="result.errors?.length">
              <span *ngFor="let err of result.errors">{{err}}</span>
            </div>
          </div>
        </div>
      </div>

      <div modal-footer>
        <button class="btn-cancel" (click)="closeTestNotificationModal()">Close</button>
        <button class="btn-create" (click)="sendTestNotification()" [disabled]="testNotificationSending">
          {{testNotificationSending ? 'Sending...' : 'Send Test'}}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .activity-log-panel {
      position: fixed;
      right: 16px;
      top: 70px;
      width: 350px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      z-index: 200;
      overflow: hidden;
    }

    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #eee;
    }

    .activity-header h3 {
      margin: 0;
      font-size: 16px;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: #666;
    }

    .activity-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .activity-icon {
      font-size: 18px;
    }

    .activity-content {
      flex: 1;
    }

    .activity-action {
      font-weight: 500;
    }

    .activity-meta {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .no-activity {
      padding: 24px;
      text-align: center;
      color: #666;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-form label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .modal-form input, .modal-form select, .modal-form textarea {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .modal-form textarea {
      min-height: 80px;
      resize: vertical;
    }

    .time-row {
      display: flex;
      gap: 16px;
    }

    .time-row label {
      flex: 1;
    }

    .btn-cancel, .btn-create, .btn-delete {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-cancel {
      background: #f0f0f0;
      color: #333;
    }

    .btn-create {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-delete {
      background: #dc3545;
      color: white;
      margin-right: auto;
    }

    .past-warning {
      color: #e91e63;
      font-style: italic;
    }

    .test-results {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-top: 8px;
    }

    .test-results h4 {
      margin: 0 0 12px 0;
    }

    .result-item {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .result-item:last-child {
      border-bottom: none;
    }

    .errors {
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
    }
  `]
})
export class AppComponentRefactored implements OnInit, OnDestroy {
  @ViewChild('calendarComponent') calendarComponent!: CalendarComponent;

  // View state
  currentView: ViewType = 'calendar';
  showDashboard = false;
  showActivityLog = false;
  loading = false;
  mobileSidebarOpen = false;

  // Selection state
  selectedSurveyorIds: number[] = [];

  // Activity log
  activityLog: ActivityLogEntry[] = [];

  // Create modal state
  showCreateModal = false;
  modalSurveyorId = 0;
  modalSurveyorName = '';
  modalDate = '';
  modalStartTime = '';
  modalEndTime = '';
  modalState = 'BUSY';
  modalTitle = '';
  modalDescription = '';

  // Edit modal state
  showEditModal = false;
  editId = 0;
  editSurveyorId = 0;
  editSurveyorName = '';
  editDate = '';
  editStartTime = '';
  editEndTime = '';
  editState = 'BUSY';
  editTitle = '';
  editDescription = '';
  editIsPast = false;

  // Test notification modal
  showTestNotificationModal = false;
  testNotificationTitle = 'Test Notification';
  testNotificationMessage = 'This is a test push notification';
  testNotificationSending = false;
  testNotificationResults: any[] | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private surveyorService: SurveyorService,
    private appointmentService: AppointmentService,
    private notificationService: NotificationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    // Load initial data
    this.surveyorService.loadAllSurveyors().subscribe();
    this.surveyorService.loadSurveyors().subscribe();

    // Subscribe to activity log
    this.subscriptions.push(
      this.notificationService.activityLog$.subscribe(log => {
        this.activityLog = log;
      }),
      this.appointmentService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );

    // Restore view preference
    const savedView = this.storageService.getViewPreference();
    if (savedView && ['calendar', 'timeline', 'heatmap'].includes(savedView)) {
      this.currentView = savedView as ViewType;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'r':
        this.refresh();
        break;
      case 'd':
        this.toggleDashboard();
        break;
      case 'escape':
        this.closeAllModals();
        break;
    }
  }

  // View management
  setView(view: ViewType): void {
    this.currentView = view;
    this.storageService.setViewPreference(view);
  }

  toggleDashboard(): void {
    this.showDashboard = !this.showDashboard;
  }

  toggleActivityLog(): void {
    this.showActivityLog = !this.showActivityLog;
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen = !this.mobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  refresh(): void {
    if (this.calendarComponent) {
      this.calendarComponent.refresh();
    }
    this.surveyorService.loadAllSurveyors().subscribe();
    this.notificationService.success('Data refreshed');
  }

  // Surveyor selection
  onSurveyorSelectionChange(ids: number[]): void {
    this.selectedSurveyorIds = ids;
    if (this.calendarComponent) {
      this.calendarComponent.refresh();
    }
  }

  // Calendar event handlers
  onDateSelect(selectInfo: DateSelectArg): void {
    // If surveyors are selected, use the first one
    if (this.selectedSurveyorIds.length > 0) {
      const surveyor = this.surveyorService.getSurveyor(this.selectedSurveyorIds[0]);
      if (surveyor) {
        this.openCreateModal(surveyor, selectInfo.start, selectInfo.end);
      }
    } else {
      this.notificationService.warning('Please select a surveyor first');
    }
  }

  onEventClick(clickInfo: EventClickArg): void {
    const event = clickInfo.event;
    const surveyorId = event.extendedProps['surveyorId'];
    const surveyor = this.surveyorService.getSurveyor(surveyorId);

    this.editId = parseInt(event.id);
    this.editSurveyorId = surveyorId;
    this.editSurveyorName = surveyor?.display_name || `Surveyor ${surveyorId}`;
    this.editDate = event.start!.toISOString().split('T')[0];
    this.editStartTime = event.start!.toTimeString().slice(0, 5);
    this.editEndTime = event.end!.toTimeString().slice(0, 5);
    this.editState = event.extendedProps['state'] || 'BUSY';
    this.editTitle = event.title;
    this.editDescription = event.extendedProps['description'] || '';
    this.editIsPast = event.start! < new Date();

    this.showEditModal = true;
  }

  onEventDrop(dropInfo: EventDropArg): void {
    const event = dropInfo.event;
    const id = parseInt(event.id);

    this.appointmentService.updateAppointment(id, {
      startTime: event.start!.toISOString(),
      endTime: event.end!.toISOString(),
      state: event.extendedProps['state'] || 'BUSY',
      title: event.title,
      description: event.extendedProps['description']
    }).subscribe({
      next: () => {
        this.notificationService.success('Appointment rescheduled');
        this.notificationService.logActivity('Rescheduled', event.title);
      },
      error: (e) => {
        this.notificationService.error('Failed to reschedule');
        dropInfo.revert();
      }
    });
  }

  onEventResize(resizeInfo: any): void {
    const event = resizeInfo.event;
    const id = parseInt(event.id);

    this.appointmentService.updateAppointment(id, {
      startTime: event.start!.toISOString(),
      endTime: event.end!.toISOString(),
      state: event.extendedProps['state'] || 'BUSY',
      title: event.title,
      description: event.extendedProps['description']
    }).subscribe({
      next: () => {
        this.notificationService.success('Appointment duration updated');
      },
      error: (e) => {
        this.notificationService.error('Failed to update');
        resizeInfo.revert();
      }
    });
  }

  // Create appointment
  openCreateModal(surveyor: Surveyor, start: Date, end: Date): void {
    this.modalSurveyorId = surveyor.id;
    this.modalSurveyorName = surveyor.display_name;
    this.modalDate = start.toISOString().split('T')[0];
    this.modalStartTime = start.toTimeString().slice(0, 5);
    this.modalEndTime = end.toTimeString().slice(0, 5);
    this.modalState = 'BUSY';
    this.modalTitle = '';
    this.modalDescription = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createAppointment(): void {
    const startTime = new Date(`${this.modalDate}T${this.modalStartTime}`);
    const endTime = new Date(`${this.modalDate}T${this.modalEndTime}`);

    this.appointmentService.createAppointment({
      surveyorId: this.modalSurveyorId,
      blocks: [{
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        state: this.modalState as any,
        title: this.modalTitle || undefined,
        description: this.modalDescription || undefined
      }]
    }).subscribe({
      next: () => {
        this.notificationService.success('Appointment created');
        this.notificationService.logActivity('Created', this.modalTitle || this.modalState, this.modalSurveyorName);
        this.closeCreateModal();
        this.refresh();
      },
      error: (e) => {
        this.notificationService.error('Failed to create appointment');
      }
    });
  }

  // Edit appointment
  closeEditModal(): void {
    this.showEditModal = false;
  }

  updateAppointment(): void {
    const startTime = new Date(`${this.editDate}T${this.editStartTime}`);
    const endTime = new Date(`${this.editDate}T${this.editEndTime}`);

    this.appointmentService.updateAppointment(this.editId, {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      state: this.editState as any,
      title: this.editTitle || undefined,
      description: this.editDescription || undefined
    }).subscribe({
      next: () => {
        this.notificationService.success('Appointment updated');
        this.notificationService.logActivity('Updated', this.editTitle || this.editState, this.editSurveyorName);
        this.closeEditModal();
        this.refresh();
      },
      error: (e) => {
        this.notificationService.error('Failed to update appointment');
      }
    });
  }

  deleteAppointment(): void {
    if (!confirm('Are you sure you want to delete this appointment?')) {
      return;
    }

    this.appointmentService.deleteAppointment(this.editId).subscribe({
      next: () => {
        this.notificationService.success('Appointment deleted');
        this.notificationService.logActivity('Deleted', this.editTitle || this.editState, this.editSurveyorName);
        this.closeEditModal();
        this.refresh();
      },
      error: (e) => {
        this.notificationService.error('Failed to delete appointment');
      }
    });
  }

  // Test notifications
  openTestNotificationModal(): void {
    this.testNotificationResults = null;
    this.showTestNotificationModal = true;
  }

  closeTestNotificationModal(): void {
    this.showTestNotificationModal = false;
  }

  sendTestNotification(): void {
    this.testNotificationSending = true;
    this.notificationService.sendTestNotification({
      title: this.testNotificationTitle,
      message: this.testNotificationMessage
    }).subscribe({
      next: (results) => {
        this.testNotificationResults = results;
        this.testNotificationSending = false;
      },
      error: (e) => {
        this.notificationService.error('Failed to send test notification');
        this.testNotificationSending = false;
      }
    });
  }

  // Activity log helpers
  getActivityIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'created': return '➕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      case 'rescheduled': return '📅';
      default: return '📝';
    }
  }

  formatActivityTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return new Date(timestamp).toLocaleDateString();
  }

  // Close all modals
  private closeAllModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showTestNotificationModal = false;
    this.showDashboard = false;
    this.showActivityLog = false;
  }
}
