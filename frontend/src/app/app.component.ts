// CMX Surveyor Calendar v1.0.3 - QStash Integration
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { API_BASE } from './core/services/api-config';
import { SurveyorActivityService, SurveyorActivity } from './core/services/surveyor-activity.service';
import { ChatService, ChatMessage, ChatConversation, TypingIndicator } from './core/services/chat.service';

import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core';

type Surveyor = { id: number; code: string; display_name: string; surveyor_type: string; current_status: string; home_lat?: number; home_lng?: number; current_lat?: number; current_lng?: number; last_location_update?: string; email?: string; phone?: string; };

type Toast = { id: number; type: 'success' | 'error' | 'warning' | 'info' | 'surveyor'; message: string; title?: string; };

type WorkloadDay = { date: string; dayName: string; count: number; };

type UpcomingAlert = { surveyorName: string; state: string; startTime: string; };

type ActivityLogEntry = { id: number; action: string; details: string; timestamp: Date; surveyorName?: string; };

type AppointmentTemplate = { id: number; name: string; duration: number; state: string; color: string; };

type SurveyorNote = { surveyorId: number; note: string; updatedAt: Date; };

type DashboardWidget = { id: string; title: string; type: 'stat' | 'chart' | 'list'; value?: number | string; data?: any[]; };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  apiBase = API_BASE;

  surveyors: Surveyor[] = [];
  allSurveyors: Surveyor[] = []; // All surveyors without status filter
  filteredSurveyors: Surveyor[] = [];
  selectedSurveyorId: number | 'ALL' = 'ALL';
  selectedSurveyorIds: number[] = [];
  selectedType: 'ALL' | 'INTERNAL' | 'EXTERNAL' = 'ALL';
  selectedCurrentStatus: 'ALL' | 'AVAILABLE' | 'BUSY' | 'OFFLINE' = 'ALL';
  surveyorMap: Map<number, Surveyor> = new Map();
  showSurveyorPicker = false;

  // Sidebar state
  sidebarCollapsed = false;
  searchQuery = '';

  // Loading states
  loadingSurveyors = true;
  loadingEvents = true;

  // Stats
  statsAvailable = 0;
  statsBusy = 0;
  statsOffline = 0;

  // Create Modal state
  showCreateModal = false;
  modalSurveyorName = '';
  modalDate = '';
  modalStartTime = '';
  modalEndTime = '';
  modalDuration = '';
  modalState = 'BUSY';
  modalTitle = '';
  modalDescription = '';
  private pendingStart = '';
  private pendingEnd = '';

  // Edit Modal state
  showEditModal = false;
  editId = 0;
  editSurveyorName = '';
  editDate = '';
  editStartTime = '';
  editEndTime = '';
  editDuration = '';
  editState = 'BUSY';
  editTitle = '';
  editDescription = '';
  editIsPast = false;
  private editPendingStart = '';
  private editPendingEnd = '';

  // Reschedule Confirmation Modal state
  showRescheduleModal = false;
  rescheduleEventId = '';
  rescheduleSurveyorName = '';
  rescheduleOldDate = '';
  rescheduleOldTime = '';
  rescheduleNewDate = '';
  rescheduleNewTime = '';
  rescheduleNewDuration = '';
  private reschedulePayload: any = null;
  private rescheduleRevertFn: (() => void) | null = null;

  // Success Confirmation Modal state
  showSuccessModal = false;
  successTitle = '';
  successMessage = '';
  successSurveyorName = '';
  successDate = '';
  successTime = '';
  successState = '';

  // Toast notifications
  toasts: Toast[] = [];
  private toastId = 0;

  // View toggle
  currentView: 'calendar' | 'timeline' | 'heatmap' | 'map' = 'calendar';

  // Upcoming alerts
  upcomingAlerts: UpcomingAlert[] = [];
  showAlertsPanel = false;

  // Workload heatmap data
  workloadData: Map<number, WorkloadDay[]> = new Map();
  heatmapWeekStart = new Date();

  // Map view
  mapSurveyors: Surveyor[] = [];

  // Recurring appointments
  modalRecurring = false;
  modalRecurringType: 'daily' | 'weekly' = 'weekly';
  modalRecurringCount = 4;

  // Conflict detection
  existingEvents: any[] = [];

  // Quick Add Button
  showQuickAddMenu = false;

  // Surveyor Grouping
  groupByType = true;
  collapsedGroups: Set<string> = new Set();

  // Appointment Templates
  templates: AppointmentTemplate[] = [
    { id: 1, name: 'Half Day', duration: 4, state: 'BUSY', color: '#e91e63' },
    { id: 2, name: 'Full Day', duration: 8, state: 'BUSY', color: '#9c27b0' },
    { id: 3, name: 'Quick Meeting', duration: 1, state: 'BUSY', color: '#2196f3' },
    { id: 4, name: 'Day Off', duration: 8, state: 'OFFLINE', color: '#607d8b' },
  ];
  showTemplateModal = false;
  selectedTemplate: AppointmentTemplate | null = null;

  // Mini Calendar Navigator
  miniCalendarDate = new Date();
  miniCalendarDays: { date: Date; isCurrentMonth: boolean; isToday: boolean; hasEvents: boolean; }[] = [];

  // Activity Log
  activityLog: ActivityLogEntry[] = [];
  showActivityLog = true;  // Show activity panel by default for better visibility
  private activityLogId = 0;

  // Surveyor Activity (Real-time from Backend)
  surveyorActivities: SurveyorActivity[] = [];
  sseConnected = false;
  activityFilter: 'ALL' | 'STATUS_CHANGE' | 'JOB_UPDATE' | 'LOGIN' = 'ALL';
  loadingActivities = false;
  private activitySubscriptions: Subscription[] = [];

  // Activity History Modal
  showActivityHistoryModal = false;
  activityHistoryPage = 0;
  activityHistoryPageSize = 20;
  activityHistoryTotal = 0;
  activityHistoryItems: SurveyorActivity[] = [];
  loadingActivityHistory = false;

  // Chat
  showChatPanel = false;
  chatConnected = false;
  chatConversations: ChatConversation[] = [];
  chatMessages: ChatMessage[] = [];
  activeConversationId: string | null = null;
  activeConversationName = '';
  chatMessageInput = '';
  chatUnreadCount = 0;
  chatTypingUser: string | null = null;
  showNewConversationPicker = false;
  chatSurveyorSearch = '';
  private chatSubscriptions: Subscription[] = [];
  private typingTimeout: any;

  // Export
  showExportModal = false;
  exportFormat: 'pdf' | 'excel' | 'csv' = 'pdf';
  exportRange: 'week' | 'month' | 'custom' = 'week';

  // Real-time Updates
  lastSyncTime = new Date();
  isLiveSync = true;
  private syncInterval: any;

  // Debounce timer for search
  private searchDebounceTimer: any;
  private readonly SEARCH_DEBOUNCE_MS = 300;

  // Appointment Cache
  private readonly CACHE_KEY = 'appointmentCache';
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  // Capacity Indicators
  surveyorCapacity: Map<number, number> = new Map();
  maxDailyCapacity = 8; // hours

  // Bulk Assign Modal
  showBulkAssignModal = false;
  bulkAssignSurveyorIds: number[] = [];
  bulkAssignDate = '';
  bulkAssignStartTime = '09:00';
  bulkAssignEndTime = '17:00';
  bulkAssignState = 'BUSY';
  bulkAssignTitle = '';
  bulkAssignDescription = '';

  // Availability Overview
  showAvailabilityOverview = false;
  overviewDate = new Date();
  overviewSurveyors: { surveyor: Surveyor; slots: { hour: number; status: string }[] }[] = [];

  // Surveyor Contact Info
  showContactInfo: number | null = null;

  // Keyboard Shortcuts
  showKeyboardHelp = false;

  // Copy Appointment Modal (Drag to Copy)
  showCopyModal = false;
  copySurveyorId = 0;
  copySurveyorName = '';
  copyOriginalDate = '';
  copyOriginalTime = '';
  copyNewDate = '';
  copyNewTime = '';
  copyNewDuration = '';
  copyState = '';
  copyTitle = '';
  copyDescription = '';
  private copyNewStartIso = '';
  private copyNewEndIso = '';
  private copyRevertFn: (() => void) | null = null;

  // Reassign Modal (Drag to different surveyor)
  showReassignModal = false;
  showReassignPicker = false;
  reassignEventId = '';
  reassignFromSurveyorId = 0;
  reassignFromSurveyorName = '';
  reassignToSurveyorId = 0;
  reassignToSurveyorName = '';
  reassignDate = '';
  reassignTime = '';
  reassignDuration = '';
  reassignState = '';
  reassignTitle = '';
  reassignDescription = '';
  private reassignStartIso = '';
  private reassignEndIso = '';
  private reassignRevertFn: (() => void) | null = null;

  // Conflict Detection & Warnings
  conflictWarnings: { surveyorId: number; surveyorName: string; conflictCount: number; conflicts: any[] }[] = [];
  showConflictPanel = false;

  // Travel Time Estimation (based on surveyor home location)
  travelTimeEstimates: Map<number, { fromEvent: any; toEvent: any; travelMinutes: number }[]> = new Map();
  showTravelTimes = true;

  // Workload Balance
  workloadBalance: { surveyorId: number; surveyorName: string; hoursToday: number; hoursWeek: number; appointmentsToday: number; appointmentsWeek: number }[] = [];
  showWorkloadPanel = false;

  // Resource Timeline
  timelineHours: string[] = [];
  timelineEvents: Map<number, any[]> = new Map();
  timelineDate = new Date();
  currentTimePosition = 0;

  // Dashboard
  showDashboard = false;
  dashboardWidgets: DashboardWidget[] = [];

  // Web Push Notifications
  webPushEnabled = false;
  webPushToken: string | null = null;
  webPushPermission: NotificationPermission = 'default';
  showPushRegistrationModal = false;
  pushRegistrationSurveyorId: number | null = null;
  pushRegistrationSurveyorSearch = '';
  registeredPushSurveyorId: number | null = null;

  // Appointment Coloring
  surveyorColors: Map<number, string> = new Map();
  showColorPicker = false;
  colorPickerSurveyorId = 0;
  customColors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548'];

  // Surveyor Notes
  surveyorNotes: Map<number, SurveyorNote> = new Map();
  showNotesModal = false;
  notesModalSurveyorId = 0;
  notesModalSurveyorName = '';
  notesModalContent = '';

  // Map View - Surveyor Locations
  loadingLocations = false;
  lastLocationRefresh: Date | null = null;
  selectedMapSurveyorId: number | null = null;
  private leafletMap: any = null;
  private mapMarkers: Map<number, any> = new Map();

  // Real-time Location Tracking via SSE
  private locationEventSource: EventSource | null = null;
  locationStreamConnected = false;
  locationStreamError = false;
  private surveyorTrails: Map<number, { lat: number; lng: number; timestamp: number }[]> = new Map();
  private trailPolylines: Map<number, any> = new Map();
  showTrails = true;
  private readonly MAX_TRAIL_POINTS = 20;

  // Confirmation/Alert Modal
  showConfirmModal = false;
  confirmModalType: 'confirm' | 'alert' | 'error' | 'warning' = 'confirm';
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalConfirmText = 'Confirm';
  confirmModalCancelText = 'Cancel';
  private confirmModalCallback: (() => void) | null = null;

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

  constructor(
    private http: HttpClient,
    private surveyorActivityService: SurveyorActivityService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.loadAllSurveyors();
    this.loadSurveyors();
    this.refreshEvents();
    this.loadUpcomingAlerts();
    this.loadWorkloadData();
    this.buildMiniCalendar();
    this.initTimelineHours();
    this.initDashboard();
    this.loadSavedNotes();
    this.loadSavedColors();
    this.initWebPushNotifications();
    this.initSurveyorActivity();
    this.initChat();
  }

  ngOnDestroy(): void {
    this.surveyorActivityService.disconnect();
    this.activitySubscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
    this.chatSubscriptions.forEach(sub => sub.unsubscribe());
  }

  // Load all surveyors for stats calculation
  loadAllSurveyors() {
    this.http.get<Surveyor[]>(`${this.apiBase}/surveyors`).subscribe({
      next: (rows) => {
        this.allSurveyors = rows;
        this.mapSurveyors = rows;
        // Populate surveyorMap with all surveyors for lookups
        rows.forEach(s => this.surveyorMap.set(s.id, s));
        this.calculateStats();
      },
      error: (e) => console.error(e)
    });
  }

  calculateStats() {
    this.statsAvailable = this.allSurveyors.filter(s => s.current_status === 'AVAILABLE').length;
    this.statsBusy = this.allSurveyors.filter(s => s.current_status === 'BUSY').length;
    this.statsOffline = this.allSurveyors.filter(s => s.current_status === 'OFFLINE').length;
  }

  // ============ TOAST NOTIFICATIONS ============
  showToast(type: 'success' | 'error' | 'warning' | 'info' | 'surveyor', message: string, title?: string) {
    const toast: Toast = { id: ++this.toastId, type, message, title };
    this.toasts.push(toast);
    // Surveyor notifications stay longer (6s) for visibility
    const duration = type === 'surveyor' ? 6000 : 4000;
    setTimeout(() => this.removeToast(toast.id), duration);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // ============ CONFIRMATION/ALERT MODAL ============
  showConfirm(title: string, message: string, onConfirm: () => void, confirmText = 'Confirm', cancelText = 'Cancel') {
    this.confirmModalType = 'confirm';
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalConfirmText = confirmText;
    this.confirmModalCancelText = cancelText;
    this.confirmModalCallback = onConfirm;
    this.showConfirmModal = true;
  }

  showAlert(title: string, message: string, type: 'alert' | 'error' | 'warning' = 'alert') {
    this.confirmModalType = type;
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalConfirmText = 'OK';
    this.confirmModalCallback = null;
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmModalCallback = null;
  }

  confirmModalAction() {
    if (this.confirmModalCallback) {
      this.confirmModalCallback();
    }
    this.closeConfirmModal();
  }

  // ============ VIEW TOGGLE ============
  setView(view: 'calendar' | 'timeline' | 'heatmap' | 'map') {
    this.currentView = view;
    if (view === 'heatmap') {
      this.loadWorkloadData();
    }
    if (view === 'timeline') {
      this.refreshEvents();
      this.loadAllSurveyors();
    }
    if (view === 'map') {
      this.refreshSurveyorLocations();
      setTimeout(() => this.initializeMap(), 100);
      this.connectLocationStream();
    } else {
      // Disconnect SSE when leaving map view to save resources
      this.disconnectLocationStream();
    }
  }

  // ============ MAP VIEW - SURVEYOR LOCATIONS ============
  refreshSurveyorLocations() {
    this.loadingLocations = true;
    this.http.get<Surveyor[]>(`${this.apiBase}/surveyors`).subscribe({
      next: (surveyors) => {
        this.allSurveyors = surveyors;
        this.surveyorMap.clear();
        surveyors.forEach(s => this.surveyorMap.set(s.id, s));
        this.lastLocationRefresh = new Date();
        this.loadingLocations = false;
        this.updateMapMarkers();
      },
      error: (e) => {
        console.error('Failed to load surveyors:', e);
        this.loadingLocations = false;
      }
    });
  }

  initializeMap() {
    const mapContainer = document.getElementById('surveyor-map');
    if (!mapContainer) return;

    // If map already exists, just update markers
    if (this.leafletMap) {
      this.updateMapMarkers();
      return;
    }

    // Dynamically load Leaflet
    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => this.createMap();
      document.head.appendChild(script);
    } else {
      this.createMap();
    }
  }

  private createMap() {
    const L = (window as any).L;
    if (!L) return;

    const mapContainer = document.getElementById('surveyor-map');
    if (!mapContainer) return;

    // Default center (can be updated based on surveyors with location)
    let center: [number, number] = [40.7128, -74.0060]; // NYC default
    let zoom = 10;

    const surveyorsWithLoc = this.getSurveyorsWithLocation();
    if (surveyorsWithLoc.length > 0) {
      const avgLat = surveyorsWithLoc.reduce((sum, s) => sum + (s.current_lat || 0), 0) / surveyorsWithLoc.length;
      const avgLng = surveyorsWithLoc.reduce((sum, s) => sum + (s.current_lng || 0), 0) / surveyorsWithLoc.length;
      center = [avgLat, avgLng];
    }

    this.leafletMap = L.map('surveyor-map').setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.leafletMap);

    this.updateMapMarkers();
  }

  private updateMapMarkers() {
    const L = (window as any).L;
    if (!L || !this.leafletMap) return;

    // Clear existing markers
    this.mapMarkers.forEach(marker => this.leafletMap.removeLayer(marker));
    this.mapMarkers.clear();

    // Add markers for surveyors with location
    const surveyorsWithLoc = this.getSurveyorsWithLocation();
    surveyorsWithLoc.forEach(s => {
      const color = this.getStatusMarkerColor(s.current_status);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">${this.getInitials(s.display_name)}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([s.current_lat, s.current_lng], { icon })
        .addTo(this.leafletMap)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>${s.display_name}</strong><br>
            <span style="color: ${color}; font-weight: bold;">${s.current_status}</span><br>
            <small>Last update: ${this.formatLocationTime(s.last_location_update)}</small>
          </div>
        `);

      marker.on('click', () => {
        this.selectedMapSurveyorId = s.id;
      });

      this.mapMarkers.set(s.id, marker);
    });

    // Fit bounds if we have markers
    if (surveyorsWithLoc.length > 0) {
      const group = L.featureGroup(Array.from(this.mapMarkers.values()));
      this.leafletMap.fitBounds(group.getBounds().pad(0.1));
    }
  }

  getSurveyorsWithLocation(): Surveyor[] {
    return this.allSurveyors.filter(s => s.current_lat && s.current_lng);
  }

  selectSurveyorOnMap(surveyor: Surveyor) {
    this.selectedMapSurveyorId = surveyor.id;

    if (surveyor.current_lat && surveyor.current_lng && this.leafletMap) {
      this.leafletMap.setView([surveyor.current_lat, surveyor.current_lng], 14);
      const marker = this.mapMarkers.get(surveyor.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }

  getStatusMarkerColor(status: string): string {
    switch (status) {
      case 'AVAILABLE': return '#28a745';
      case 'BUSY': return '#dc3545';
      case 'OFFLINE': return '#6c757d';
      default: return '#999';
    }
  }

  formatLocationTime(timestamp: string | Date | null | undefined): string {
    if (!timestamp) return 'Unknown';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  }

  // ============ REAL-TIME LOCATION STREAMING (SSE) ============
  connectLocationStream() {
    if (this.locationEventSource) {
      return; // Already connected
    }

    this.locationStreamError = false;
    const streamUrl = `${this.apiBase}/locations/stream`;

    try {
      this.locationEventSource = new EventSource(streamUrl);

      this.locationEventSource.addEventListener('connected', (_event: any) => {
        this.locationStreamConnected = true;
        this.locationStreamError = false;
        this.loadInitialTrails();
      });

      this.locationEventSource.addEventListener('location', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.handleLocationUpdate(data);
        } catch (e) {
          console.error('[LocationStream] Failed to parse location event:', e);
        }
      });

      this.locationEventSource.addEventListener('status', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          this.handleStatusUpdate(data);
        } catch (e) {
          console.error('[LocationStream] Failed to parse status event:', e);
        }
      });

      this.locationEventSource.onerror = (error) => {
        console.error('[LocationStream] Connection error:', error);
        this.locationStreamConnected = false;
        this.locationStreamError = true;
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.currentView === 'map') {
            this.disconnectLocationStream();
            this.connectLocationStream();
          }
        }, 5000);
      };

    } catch (e) {
      console.error('[LocationStream] Failed to connect:', e);
      this.locationStreamError = true;
    }
  }

  disconnectLocationStream() {
    if (this.locationEventSource) {
      this.locationEventSource.close();
      this.locationEventSource = null;
      this.locationStreamConnected = false;
    }
  }

  loadInitialTrails() {
    this.http.get<{ [key: string]: { lat: number; lng: number; timestamp: number }[] }>(
      `${this.apiBase}/locations/trails`
    ).subscribe({
      next: (trails) => {
        Object.entries(trails).forEach(([surveyorIdStr, trail]) => {
          const surveyorId = parseInt(surveyorIdStr, 10);
          this.surveyorTrails.set(surveyorId, trail);
          this.updateTrailPolyline(surveyorId);
        });
      },
      error: (e) => console.error('[LocationStream] Failed to load initial trails:', e)
    });
  }

  handleLocationUpdate(data: { surveyorId: number; lat: number; lng: number; status: string; displayName: string; timestamp: number; trail?: { lat: number; lng: number; timestamp: number }[] }) {
    const { surveyorId, lat, lng, status, displayName, timestamp, trail } = data;

    // Update surveyor in local data
    const surveyor = this.surveyorMap.get(surveyorId);
    if (surveyor) {
      surveyor.current_lat = lat;
      surveyor.current_lng = lng;
      surveyor.current_status = status;
      surveyor.last_location_update = new Date(timestamp).toISOString();
    }

    // Update trail data
    if (trail) {
      this.surveyorTrails.set(surveyorId, trail);
    } else {
      // Append to existing trail
      let existingTrail = this.surveyorTrails.get(surveyorId) || [];
      existingTrail.push({ lat, lng, timestamp });
      // Keep only last N points
      if (existingTrail.length > this.MAX_TRAIL_POINTS) {
        existingTrail = existingTrail.slice(-this.MAX_TRAIL_POINTS);
      }
      this.surveyorTrails.set(surveyorId, existingTrail);
    }

    // Animate marker to new position
    this.animateMarkerTo(surveyorId, lat, lng, status, displayName);

    // Update trail polyline
    if (this.showTrails) {
      this.updateTrailPolyline(surveyorId);
    }

    this.lastLocationRefresh = new Date();
    this.calculateStats();
  }

  handleStatusUpdate(data: { surveyorId: number; status: string; displayName: string; timestamp: number }) {
    const { surveyorId, status, displayName } = data;

    // Update surveyor status
    const surveyor = this.surveyorMap.get(surveyorId);
    if (surveyor) {
      surveyor.current_status = status;
    }

    // Update marker color
    const marker = this.mapMarkers.get(surveyorId);
    if (marker && this.leafletMap) {
      const L = (window as any).L;
      const color = this.getStatusMarkerColor(status);
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">${this.getInitials(displayName || surveyor?.display_name || '')}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      marker.setIcon(icon);
    }

    this.calculateStats();
  }

  animateMarkerTo(surveyorId: number, newLat: number, newLng: number, status: string, displayName: string) {
    const L = (window as any).L;
    if (!L || !this.leafletMap) return;

    const marker = this.mapMarkers.get(surveyorId);
    if (!marker) {
      // Create new marker if doesn't exist
      const color = this.getStatusMarkerColor(status);
      const icon = L.divIcon({
        className: 'custom-marker animated-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white; transition: all 0.5s ease-out;">${this.getInitials(displayName)}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const newMarker = L.marker([newLat, newLng], { icon })
        .addTo(this.leafletMap)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>${displayName}</strong><br>
            <span style="color: ${color}; font-weight: bold;">${status}</span><br>
            <small>Last update: Just now</small>
          </div>
        `);

      newMarker.on('click', () => {
        this.selectedMapSurveyorId = surveyorId;
      });

      this.mapMarkers.set(surveyorId, newMarker);
      return;
    }

    // Animate existing marker to new position
    const currentLatLng = marker.getLatLng();
    const startLat = currentLatLng.lat;
    const startLng = currentLatLng.lng;
    const duration = 1000; // 1 second animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentLat = startLat + (newLat - startLat) * easeOut;
      const currentLng = startLng + (newLng - startLng) * easeOut;

      marker.setLatLng([currentLat, currentLng]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Update popup when animation completes
        const color = this.getStatusMarkerColor(status);
        marker.setPopupContent(`
          <div style="text-align: center;">
            <strong>${displayName}</strong><br>
            <span style="color: ${color}; font-weight: bold;">${status}</span><br>
            <small>Last update: Just now</small>
          </div>
        `);
      }
    };

    requestAnimationFrame(animate);

    // Update marker icon color
    const color = this.getStatusMarkerColor(status);
    const icon = L.divIcon({
      className: 'custom-marker animated-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">${this.getInitials(displayName)}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    marker.setIcon(icon);
  }

  updateTrailPolyline(surveyorId: number) {
    const L = (window as any).L;
    if (!L || !this.leafletMap) return;

    // Remove existing polyline
    const existingPolyline = this.trailPolylines.get(surveyorId);
    if (existingPolyline) {
      this.leafletMap.removeLayer(existingPolyline);
    }

    const trail = this.surveyorTrails.get(surveyorId);
    if (!trail || trail.length < 2) return;

    // Get surveyor color
    const surveyor = this.surveyorMap.get(surveyorId);
    const color = surveyor ? this.getStatusMarkerColor(surveyor.current_status || 'AVAILABLE') : '#3388ff';

    // Create polyline with trail points
    const latLngs = trail.map(p => [p.lat, p.lng]);
    const polyline = L.polyline(latLngs, {
      color: color,
      weight: 3,
      opacity: 0.6,
      dashArray: '5, 10',
      className: 'surveyor-trail'
    }).addTo(this.leafletMap);

    // Add subtle animation dots along the trail
    this.trailPolylines.set(surveyorId, polyline);
  }

  toggleTrails() {
    this.showTrails = !this.showTrails;

    if (this.showTrails) {
      // Show all trails
      this.surveyorTrails.forEach((_, surveyorId) => {
        this.updateTrailPolyline(surveyorId);
      });
    } else {
      // Hide all trails
      this.trailPolylines.forEach(polyline => {
        if (this.leafletMap) {
          this.leafletMap.removeLayer(polyline);
        }
      });
      this.trailPolylines.clear();
    }
  }

  clearTrails() {
    this.surveyorTrails.clear();
    this.trailPolylines.forEach(polyline => {
      if (this.leafletMap) {
        this.leafletMap.removeLayer(polyline);
      }
    });
    this.trailPolylines.clear();
  }

  // ============ UPCOMING ALERTS ============
  loadUpcomingAlerts() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    this.http.get<any[]>(`${this.apiBase}/availability?from=${tomorrow.toISOString()}&to=${dayAfter.toISOString()}`).subscribe({
      next: (rows) => {
        this.upcomingAlerts = rows.map(r => {
          const surveyor = this.surveyorMap.get(r.surveyor_id) || this.allSurveyors.find(s => s.id === r.surveyor_id);
          return {
            surveyorName: surveyor?.display_name || `Surveyor ${r.surveyor_id}`,
            state: r.state,
            startTime: new Date(r.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
        });
      },
      error: (e) => console.error(e)
    });
  }

  toggleAlertsPanel() {
    this.showAlertsPanel = !this.showAlertsPanel;
  }

  // ============ WORKLOAD HEATMAP ============
  loadWorkloadData() {
    const weekStart = new Date(this.heatmapWeekStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    this.http.get<any[]>(`${this.apiBase}/availability?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`).subscribe({
      next: (rows) => {
        const workloadMap = new Map<number, Map<string, number>>();

        rows.forEach(r => {
          const dateKey = new Date(r.start_time).toISOString().split('T')[0];
          if (!workloadMap.has(r.surveyor_id)) {
            workloadMap.set(r.surveyor_id, new Map());
          }
          const surveyorMap = workloadMap.get(r.surveyor_id)!;
          surveyorMap.set(dateKey, (surveyorMap.get(dateKey) || 0) + 1);
        });

        this.workloadData = new Map();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        this.allSurveyors.forEach(s => {
          const days: WorkloadDay[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const count = workloadMap.get(s.id)?.get(dateKey) || 0;
            days.push({ date: dateKey, dayName: dayNames[i], count });
          }
          this.workloadData.set(s.id, days);
        });
      },
      error: (e) => console.error(e)
    });
  }

  getHeatmapColor(count: number): string {
    if (count === 0) return '#e8f5e9';
    if (count === 1) return '#c8e6c9';
    if (count === 2) return '#a5d6a7';
    if (count === 3) return '#81c784';
    if (count >= 4) return '#66bb6a';
    return '#e8f5e9';
  }

  prevHeatmapWeek() {
    this.heatmapWeekStart.setDate(this.heatmapWeekStart.getDate() - 7);
    this.loadWorkloadData();
  }

  nextHeatmapWeek() {
    this.heatmapWeekStart.setDate(this.heatmapWeekStart.getDate() + 7);
    this.loadWorkloadData();
  }

  getHeatmapWeekLabel(): string {
    const start = new Date(this.heatmapWeekStart);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  // ============ CONFLICT DETECTION ============
  checkConflict(surveyorId: number, start: Date, end: Date): boolean {
    return this.existingEvents.some(e => {
      if (e.extendedProps?.surveyorId !== surveyorId) return false;
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      return (start < eEnd && end > eStart);
    });
  }

  loadSurveyors() {
    this.loadingSurveyors = true;
    let params: string[] = [];
    if (this.selectedType !== 'ALL') {
      params.push(`type=${this.selectedType}`);
    }
    if (this.selectedCurrentStatus !== 'ALL') {
      params.push(`currentStatus=${this.selectedCurrentStatus}`);
    }
    const queryString = params.length > 0 ? `?${params.join('&')}` : '';

    this.http.get<Surveyor[]>(`${this.apiBase}/surveyors${queryString}`).subscribe({
      next: (rows) => {
        this.surveyors = rows;
        this.applySearchFilter();
        this.surveyorMap = new Map(rows.map(s => [s.id, s]));
        // Reset selection when filters change
        this.selectedSurveyorIds = [];
        this.selectedSurveyorId = 'ALL';
        this.loadingSurveyors = false;
      },
      error: (e) => {
        console.error(e);
        this.loadingSurveyors = false;
      }
    });
  }

  applySearchFilter() {
    if (!this.searchQuery.trim()) {
      this.filteredSurveyors = this.surveyors;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredSurveyors = this.surveyors.filter(s =>
        s.display_name.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query)
      );
    }
  }

  onSearchChange() {
    // Debounce search to reduce processing on every keystroke
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.applySearchFilter();
    }, this.SEARCH_DEBOUNCE_MS);
  }

  // Generate avatar initials and color
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Generate avatar URL using DiceBear API
  getAvatarUrl(name: string, size: number = 40): string {
    const seed = encodeURIComponent(name);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  // Track avatar loading errors
  avatarErrors: Set<number> = new Set();

  onAvatarError(surveyorId: number) {
    this.avatarErrors.add(surveyorId);
  }

  hasAvatarError(surveyorId: number): boolean {
    return this.avatarErrors.has(surveyorId);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  // Quick filter pills
  quickFilterAvailable() {
    this.selectedCurrentStatus = 'AVAILABLE';
    this.loadSurveyors();
  }

  quickFilterInternal() {
    if (this.selectedType === 'INTERNAL') {
      this.selectedType = 'ALL';
    } else {
      this.selectedType = 'INTERNAL';
    }
    this.loadSurveyors();
  }

  quickFilterExternal() {
    if (this.selectedType === 'EXTERNAL') {
      this.selectedType = 'ALL';
    } else {
      this.selectedType = 'EXTERNAL';
    }
    this.loadSurveyors();
  }

  clearFilters() {
    this.selectedType = 'ALL';
    this.selectedCurrentStatus = 'ALL';
    this.searchQuery = '';
    this.loadSurveyors();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applySearchFilter();
  }

  toggleStatusFilter(status: string) {
    if (this.selectedCurrentStatus === status) {
      this.selectedCurrentStatus = 'ALL';
    } else {
      this.selectedCurrentStatus = status as any;
    }
    this.loadSurveyors();
  }

  highlightSearchTerm(text: string): string {
    if (!this.searchQuery.trim()) {
      return text;
    }
    const query = this.searchQuery.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  hasActiveFilters(): boolean {
    return this.selectedType !== 'ALL' || this.selectedCurrentStatus !== 'ALL' || this.searchQuery.trim() !== '';
  }

  // Select surveyor from sidebar
  selectSurveyor(id: number) {
    this.toggleSurveyorSelection(id);
  }

  onTypeChange(type: string) {
    this.selectedType = type as 'ALL' | 'INTERNAL' | 'EXTERNAL';
    this.loadSurveyors();
  }

  onCurrentStatusChange(status: string) {
    this.selectedCurrentStatus = status as 'ALL' | 'AVAILABLE' | 'BUSY' | 'OFFLINE';
    this.loadSurveyors();
  }

  getCurrentStatusColor(status: string): string {
    switch (status) {
      case 'AVAILABLE': return '#28a745';
      case 'BUSY': return '#dc3545';
      case 'OFF_DUTY': return '#6c757d';
      case 'ON_LEAVE': return '#fd7e14';
      case 'OFFLINE': return '#6c757d';
      default: return '#3788d8';
    }
  }

  toggleSurveyorPicker() {
    this.showSurveyorPicker = !this.showSurveyorPicker;
  }

  closeSurveyorPicker() {
    this.showSurveyorPicker = false;
  }

  toggleSurveyorSelection(id: number) {
    const index = this.selectedSurveyorIds.indexOf(id);
    if (index > -1) {
      this.selectedSurveyorIds.splice(index, 1);
    } else {
      this.selectedSurveyorIds.push(id);
    }
    this.selectedSurveyorId = 'ALL'; // Reset single selection when multi-selecting
    this.refreshEvents();
  }

  isSurveyorSelected(id: number): boolean {
    return this.selectedSurveyorIds.includes(id);
  }

  selectAllSurveyors() {
    this.selectedSurveyorIds = this.filteredSurveyors.map(s => s.id);
    this.selectedSurveyorId = 'ALL';
    this.refreshEvents();
  }

  clearAllSurveyors() {
    this.selectedSurveyorIds = [];
    this.selectedSurveyorId = 'ALL';
    this.refreshEvents();
  }

  getSelectedSurveyorNames(): string {
    if (this.selectedSurveyorIds.length === 0) {
      return 'All Surveyors';
    }
    if (this.selectedSurveyorIds.length <= 3) {
      return this.selectedSurveyorIds
        .map(id => this.surveyorMap.get(id)?.display_name || `Surveyor ${id}`)
        .join(', ');
    }
    return `${this.selectedSurveyorIds.length} surveyors selected`;
  }

  refreshEvents() {
    this.loadingEvents = true;
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 30);

    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    // Build cache key based on selected surveyors
    const cacheKey = this.buildCacheKey();

    // Try to load from cache first for instant display
    const cachedData = this.loadFromCache(cacheKey);
    if (cachedData) {
      const allEvs = this.processEvents(cachedData);
      this.existingEvents = allEvs;

      // Apply same filtering to cached events
      let displayEvents = allEvs;
      if (this.selectedSurveyorIds.length > 0) {
        displayEvents = allEvs.filter(e =>
          e.extendedProps?.surveyorId && this.selectedSurveyorIds.includes(e.extendedProps.surveyorId)
        );
      } else if (this.selectedSurveyorId !== 'ALL') {
        displayEvents = allEvs.filter(e =>
          e.extendedProps?.surveyorId === this.selectedSurveyorId
        );
      }

      this.calendarOptions = { ...this.calendarOptions, events: displayEvents };
      this.loadingEvents = false;
    }

    // Always fetch ALL events - filtering is done client-side for display
    // This prevents losing other surveyors' appointments when selecting a surveyor
    let q = `${this.apiBase}/availability?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;

    this.http.get<any[]>(q).subscribe({
      next: (rows) => {
        // Save to cache
        this.saveToCache(cacheKey, rows);

        const allEvs = this.processEvents(rows);
        this.existingEvents = allEvs; // Store ALL events for conflict detection

        // Filter for display based on selected surveyors
        let displayEvents = allEvs;
        if (this.selectedSurveyorIds.length > 0) {
          displayEvents = allEvs.filter(e =>
            e.extendedProps?.surveyorId && this.selectedSurveyorIds.includes(e.extendedProps.surveyorId)
          );
        } else if (this.selectedSurveyorId !== 'ALL') {
          displayEvents = allEvs.filter(e =>
            e.extendedProps?.surveyorId === this.selectedSurveyorId
          );
        }

        this.calendarOptions = { ...this.calendarOptions, events: displayEvents };
        this.loadingEvents = false;
        this.lastSyncTime = new Date();
        // Refresh stats after events load
        this.loadAllSurveyors();
      },
      error: (e) => {
        console.error(e);
        this.loadingEvents = false;
      }
    });
  }

  // Process raw event data into calendar events
  private processEvents(rows: any[]): any[] {
    return rows.map(r => {
      const surveyor = this.surveyorMap.get(r.surveyor_id);
      const name = surveyor ? surveyor.display_name : `Surveyor ${r.surveyor_id}`;
      const isPast = new Date(r.end_time) < new Date();
      return {
        id: String(r.id),
        title: `${name} - ${r.state}`,
        start: r.start_time,
        end: r.end_time,
        backgroundColor: isPast ? this.getPastStateColor(r.state) : this.getStateColor(r.state),
        borderColor: isPast ? this.getPastStateColor(r.state) : this.getStateColor(r.state),
        editable: !isPast,
        extendedProps: { state: r.state, source: r.source, surveyorId: r.surveyor_id, isPast, title: r.title, description: r.description }
      };
    });
  }

  // Build unique cache key - always cache all events
  private buildCacheKey(): string {
    return `${this.CACHE_KEY}_all`;
  }

  // Save events to localStorage cache
  private saveToCache(key: string, data: any[]) {
    try {
      const cacheEntry = {
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (e) {
      console.warn('Failed to save to cache:', e);
    }
  }

  // Load events from localStorage cache if valid
  private loadFromCache(key: string): any[] | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const age = Date.now() - cacheEntry.timestamp;

      // Check if cache is still valid
      if (age < this.CACHE_EXPIRY_MS) {
        return cacheEntry.data;
      }

      // Cache expired, remove it
      localStorage.removeItem(key);
      return null;
    } catch (e) {
      console.warn('Failed to load from cache:', e);
      return null;
    }
  }

  // Clear all appointment caches (silent = no toast)
  clearAppointmentCache(silent: boolean = false) {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(this.CACHE_KEY));
      keys.forEach(k => localStorage.removeItem(k));
      if (!silent) {
        this.showToast('info', 'Cache cleared');
      }
    } catch (e) {
      console.warn('Failed to clear cache:', e);
    }
  }

  getStateColor(state: string): string {
    switch (state) {
      case 'BUSY': return '#dc3545';
      case 'OFFLINE': return '#6c757d';
      default: return '#3788d8';
    }
  }

  getPastStateColor(state: string): string {
    switch (state) {
      case 'BUSY': return '#cd5c5c';
      case 'OFFLINE': return '#a9a9a9';
      default: return '#87ceeb';
    }
  }

  isPastDate(date: Date): boolean {
    const now = new Date();
    return date < now;
  }

  // CREATE MODAL
  handleDateSelect(selectInfo: DateSelectArg) {
    // Require exactly one surveyor selected for creation
    if (this.selectedSurveyorIds.length === 0 && this.selectedSurveyorId === 'ALL') {
      this.showToast('warning', 'Please select exactly one surveyor to create an appointment.');
      selectInfo.view.calendar.unselect();
      return;
    }

    if (this.selectedSurveyorIds.length > 1) {
      this.showToast('warning', 'Please select only one surveyor to create an appointment.');
      selectInfo.view.calendar.unselect();
      return;
    }

    const startDate = selectInfo.start;

    // Check if trying to create in the past
    if (this.isPastDate(startDate)) {
      this.showToast('error', 'Cannot create appointments in the past.');
      selectInfo.view.calendar.unselect();
      return;
    }

    // Determine which surveyor to use
    const surveyorIdToUse = this.selectedSurveyorIds.length === 1
      ? this.selectedSurveyorIds[0]
      : this.selectedSurveyorId as number;

    const surveyor = this.surveyorMap.get(surveyorIdToUse);
    this.modalSurveyorName = surveyor ? surveyor.display_name : `Surveyor ${surveyorIdToUse}`;

    let endDate = selectInfo.end;

    const durationMs = endDate.getTime() - startDate.getTime();
    if (durationMs < 60 * 60 * 1000) {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    // Check for conflicts
    if (this.checkConflict(surveyorIdToUse, startDate, endDate)) {
      this.showToast('warning', 'This time slot overlaps with an existing appointment. You can still create it if needed.');
    }

    this.pendingStart = startDate.toISOString();
    this.pendingEnd = endDate.toISOString();

    this.modalDate = this.formatDate(startDate);
    this.modalStartTime = this.formatTime(startDate);
    this.modalEndTime = this.formatTime(endDate);
    this.modalDuration = this.formatDuration(startDate, endDate);
    this.modalState = 'BUSY';
    this.modalTitle = '';
    this.modalDescription = '';
    this.modalRecurring = false;
    this.modalRecurringType = 'weekly';
    this.modalRecurringCount = 4;

    this.showCreateModal = true;
    selectInfo.view.calendar.unselect();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.modalRecurring = false;
  }

  confirmCreate() {
    const surveyorIdToUse = this.selectedSurveyorIds.length === 1
      ? this.selectedSurveyorIds[0]
      : this.selectedSurveyorId as number;

    if (this.modalRecurring) {
      this.createRecurringAvailability(
        surveyorIdToUse,
        this.pendingStart,
        this.pendingEnd,
        this.modalState,
        this.modalRecurringType,
        this.modalRecurringCount,
        this.modalTitle,
        this.modalDescription
      );
    } else {
      this.createAvailability(
        surveyorIdToUse,
        this.pendingStart,
        this.pendingEnd,
        this.modalState,
        this.modalTitle,
        this.modalDescription
      );
    }
    this.showCreateModal = false;
  }

  createRecurringAvailability(surveyorId: number, start: string, end: string, state: string, recurringType: 'daily' | 'weekly', count: number, title?: string, description?: string) {
    const blocks: { startTime: string; endTime: string; state: string; title?: string | null; description?: string | null }[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const dayIncrement = recurringType === 'daily' ? 1 : 7;

    for (let i = 0; i < count; i++) {
      const blockStart = new Date(startDate.getTime() + (i * dayIncrement * 24 * 60 * 60 * 1000));
      const blockEnd = new Date(blockStart.getTime() + durationMs);
      blocks.push({
        startTime: blockStart.toISOString(),
        endTime: blockEnd.toISOString(),
        state: state,
        title: title || null,
        description: description || null
      });
    }

    const payload = { surveyorId, blocks };
    const surveyor = this.surveyorMap.get(surveyorId);
    const surveyorName = surveyor ? surveyor.display_name : `Surveyor ${surveyorId}`;

    this.http.post(`${this.apiBase}/mobile/availability`, payload).subscribe({
      next: () => {
        this.clearAppointmentCache(true); // Clear FE cache to sync with BE
        this.refreshEvents();
        this.loadUpcomingAlerts();
        this.showToast('success', `Created ${count} recurring ${state.toLowerCase()} appointments for ${surveyorName}`);
      },
      error: (e) => {
        console.error(e);
        this.showToast('error', 'Failed to create recurring appointments');
      }
    });
  }

  createAvailability(surveyorId: number, start: string, end: string, state: string, title?: string, description?: string) {
    const payload = {
      surveyorId: surveyorId,
      blocks: [{ startTime: start, endTime: end, state: state, title: title || null, description: description || null }]
    };

    const surveyor = this.surveyorMap.get(surveyorId);
    const surveyorName = surveyor ? surveyor.display_name : `Surveyor ${surveyorId}`;
    const startDate = new Date(start);
    const endDate = new Date(end);

    this.http.post(`${this.apiBase}/mobile/availability`, payload).subscribe({
      next: () => {
        this.clearAppointmentCache(true); // Clear FE cache to sync with BE
        this.refreshEvents();
        this.loadUpcomingAlerts();
        // Show success modal
        this.successTitle = 'Appointment Created';
        this.successMessage = 'The appointment has been successfully created.';
        this.successSurveyorName = surveyorName;
        this.successDate = this.formatDate(startDate);
        this.successTime = `${this.formatTime(startDate)} - ${this.formatTime(endDate)}`;
        this.successState = state;
        this.showSuccessModal = true;
      },
      error: (e) => {
        console.error(e);
        this.showToast('error', 'Failed to create appointment', 'Error');
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  // EDIT MODAL
  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event;
    const surveyorId = event.extendedProps['surveyorId'];
    const surveyor = this.surveyorMap.get(surveyorId);
    const isPast = event.extendedProps['isPast'] || false;

    this.editId = Number(event.id);
    this.editSurveyorName = surveyor ? surveyor.display_name : `Surveyor ${surveyorId}`;
    this.editState = event.extendedProps['state'];
    this.editTitle = event.extendedProps['title'] || '';
    this.editDescription = event.extendedProps['description'] || '';
    this.editIsPast = isPast;

    const startDate = event.start!;
    const endDate = event.end!;

    this.editPendingStart = startDate.toISOString();
    this.editPendingEnd = endDate.toISOString();

    this.editDate = this.formatDate(startDate);
    this.editStartTime = this.formatTime(startDate);
    this.editEndTime = this.formatTime(endDate);
    this.editDuration = this.formatDuration(startDate, endDate);

    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  confirmUpdate() {
    if (this.editIsPast) {
      this.showToast('warning', 'Cannot modify past appointments', 'Warning');
      return;
    }

    const payload = {
      startTime: this.editPendingStart,
      endTime: this.editPendingEnd,
      state: this.editState,
      title: this.editTitle || null,
      description: this.editDescription || null
    };

    this.http.put(`${this.apiBase}/availability/${this.editId}`, payload).subscribe({
      next: () => {
        this.showEditModal = false;
        this.clearAppointmentCache(true); // Clear FE cache to sync with BE
        this.refreshEvents();
        this.showToast('success', 'Appointment updated successfully', 'Updated');
      },
      error: (e) => {
        console.error(e);
        this.showToast('error', 'Failed to update appointment', 'Error');
      }
    });
  }

  confirmDelete() {
    if (this.editIsPast) {
      this.showToast('warning', 'Cannot delete past appointments', 'Warning');
      return;
    }

    this.showConfirm(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      () => {
        this.http.delete(`${this.apiBase}/availability/${this.editId}`).subscribe({
          next: () => {
            this.showEditModal = false;
            this.clearAppointmentCache(true); // Clear FE cache to sync with BE
            this.refreshEvents();
            this.showToast('success', 'Appointment deleted successfully', 'Deleted');
          },
          error: (e) => {
            console.error(e);
            this.showToast('error', 'Failed to delete appointment', 'Error');
          }
        });
      },
      'Delete',
      'Cancel'
    );
  }

  // DRAG & RESIZE with Confirmation (Alt+Drag to Copy)
  handleEventDrop(dropInfo: EventDropArg) {
    const event = dropInfo.event;
    const oldEvent = dropInfo.oldEvent;
    const jsEvent = dropInfo.jsEvent as MouseEvent;

    // Check if Alt key was held - this means COPY instead of MOVE
    const isCopyMode = jsEvent && jsEvent.altKey;

    // Check if this is a past event
    if (event.extendedProps['isPast']) {
      dropInfo.revert();
      this.showToast('warning', 'Cannot reschedule past appointments', 'Warning');
      return;
    }

    // Check if trying to move/copy to past
    if (this.isPastDate(event.start!)) {
      dropInfo.revert();
      this.showToast('warning', 'Cannot ' + (isCopyMode ? 'copy' : 'reschedule') + ' appointment to a past date/time', 'Warning');
      return;
    }

    const surveyorId = event.extendedProps['surveyorId'];
    const surveyor = this.surveyorMap.get(surveyorId);

    if (isCopyMode) {
      // COPY MODE: Show copy confirmation modal
      this.copySurveyorId = surveyorId;
      this.copySurveyorName = surveyor ? surveyor.display_name : `Surveyor ${surveyorId}`;
      this.copyOriginalDate = this.formatDate(oldEvent.start!);
      this.copyOriginalTime = `${this.formatTime(oldEvent.start!)} - ${this.formatTime(oldEvent.end!)}`;
      this.copyNewDate = this.formatDate(event.start!);
      this.copyNewTime = `${this.formatTime(event.start!)} - ${this.formatTime(event.end!)}`;
      this.copyNewDuration = this.formatDuration(event.start!, event.end!);
      this.copyState = event.extendedProps['state'];
      this.copyTitle = event.extendedProps['title'] || '';
      this.copyDescription = event.extendedProps['description'] || '';
      // Store ISO dates for API call
      this.copyNewStartIso = event.start!.toISOString();
      this.copyNewEndIso = event.end!.toISOString();
      this.copyRevertFn = () => dropInfo.revert();

      this.showCopyModal = true;
    } else {
      // MOVE MODE: Show reschedule confirmation modal
      this.rescheduleEventId = event.id;
      this.rescheduleSurveyorName = surveyor ? surveyor.display_name : `Surveyor ${surveyorId}`;
      this.rescheduleOldDate = this.formatDate(oldEvent.start!);
      this.rescheduleOldTime = `${this.formatTime(oldEvent.start!)} - ${this.formatTime(oldEvent.end!)}`;
      this.rescheduleNewDate = this.formatDate(event.start!);
      this.rescheduleNewTime = `${this.formatTime(event.start!)} - ${this.formatTime(event.end!)}`;
      this.rescheduleNewDuration = this.formatDuration(event.start!, event.end!);

      this.reschedulePayload = {
        startTime: event.start!.toISOString(),
        endTime: event.end!.toISOString(),
        state: event.extendedProps['state']
      };
      this.rescheduleRevertFn = () => dropInfo.revert();

      this.showRescheduleModal = true;
    }
  }

  handleEventResize(resizeInfo: any) {
    const event = resizeInfo.event;
    const oldEvent = resizeInfo.oldEvent;

    // Check if this is a past event
    if (event.extendedProps['isPast']) {
      resizeInfo.revert();
      this.showToast('warning', 'Cannot resize past appointments', 'Warning');
      return;
    }

    const surveyorId = event.extendedProps['surveyorId'];
    const surveyor = this.surveyorMap.get(surveyorId);

    this.rescheduleEventId = event.id;
    this.rescheduleSurveyorName = surveyor ? surveyor.display_name : `Surveyor ${surveyorId}`;
    this.rescheduleOldDate = this.formatDate(oldEvent.start!);
    this.rescheduleOldTime = `${this.formatTime(oldEvent.start!)} - ${this.formatTime(oldEvent.end!)}`;
    this.rescheduleNewDate = this.formatDate(event.start!);
    this.rescheduleNewTime = `${this.formatTime(event.start!)} - ${this.formatTime(event.end!)}`;
    this.rescheduleNewDuration = this.formatDuration(event.start!, event.end!);

    this.reschedulePayload = {
      startTime: event.start!.toISOString(),
      endTime: event.end!.toISOString(),
      state: event.extendedProps['state']
    };
    this.rescheduleRevertFn = () => resizeInfo.revert();

    this.showRescheduleModal = true;
  }

  closeRescheduleModal() {
    if (this.rescheduleRevertFn) {
      this.rescheduleRevertFn();
    }
    this.showRescheduleModal = false;
    this.reschedulePayload = null;
    this.rescheduleRevertFn = null;
  }

  confirmReschedule() {
    if (!this.reschedulePayload) return;

    this.http.put(`${this.apiBase}/availability/${this.rescheduleEventId}`, this.reschedulePayload).subscribe({
      next: () => {
        this.showRescheduleModal = false;
        this.reschedulePayload = null;
        this.rescheduleRevertFn = null;
        this.clearAppointmentCache(true); // Clear FE cache to sync with BE
        this.refreshEvents();
        this.showToast('success', 'Appointment rescheduled successfully', 'Rescheduled');
      },
      error: (e) => {
        console.error(e);
        if (this.rescheduleRevertFn) {
          this.rescheduleRevertFn();
        }
        this.showRescheduleModal = false;
        this.reschedulePayload = null;
        this.rescheduleRevertFn = null;
        this.showToast('error', 'Failed to reschedule appointment', 'Error');
      }
    });
  }

  // COPY MODAL (Alt+Drag to Copy)
  closeCopyModal() {
    if (this.copyRevertFn) {
      this.copyRevertFn();
    }
    this.showCopyModal = false;
    this.copyRevertFn = null;
  }

  confirmCopy() {
    // Always revert the drag first (keep original in place)
    if (this.copyRevertFn) {
      this.copyRevertFn();
      this.copyRevertFn = null;
    }

    // Create a new appointment at the new location using ISO dates
    const payload = {
      surveyorId: this.copySurveyorId,
      blocks: [{
        startTime: this.copyNewStartIso,
        endTime: this.copyNewEndIso,
        state: this.copyState,
        title: this.copyTitle || null,
        description: this.copyDescription || null
      }]
    };

    this.http.post(`${this.apiBase}/mobile/availability`, payload).subscribe({
      next: () => {
        this.showCopyModal = false;
        this.clearAppointmentCache(true);
        this.refreshEvents();
        this.showToast('success', `Appointment copied for ${this.copySurveyorName}`);
        this.addActivityLog('Copied', 'Appointment', this.copySurveyorName);
      },
      error: (e) => {
        console.error(e);
        this.showCopyModal = false;
        this.showToast('error', 'Failed to copy appointment');
      }
    });
  }

  // HELPERS
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  formatDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
    return `${hours}h ${minutes}m`;
  }

  onSurveyorChange(val: string) {
    this.selectedSurveyorId = val === 'ALL' ? 'ALL' : Number(val);
    this.refreshEvents();
  }

  // ============ QUICK ADD BUTTON ============
  toggleQuickAddMenu() {
    this.showQuickAddMenu = !this.showQuickAddMenu;
  }

  quickAddFromTemplate(template: AppointmentTemplate) {
    if (this.selectedSurveyorIds.length !== 1) {
      this.showToast('warning', 'Please select exactly one surveyor first');
      this.showQuickAddMenu = false;
      return;
    }

    const surveyorId = this.selectedSurveyorIds[0];
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);

    const start = now.toISOString();
    const end = new Date(now.getTime() + template.duration * 60 * 60 * 1000).toISOString();

    this.createAvailability(surveyorId, start, end, template.state);
    this.addActivityLog('Created', `${template.name} appointment`);
    this.showQuickAddMenu = false;
  }

  openQuickAddModal() {
    if (this.selectedSurveyorIds.length !== 1) {
      this.showToast('warning', 'Please select exactly one surveyor first');
      return;
    }
    this.showTemplateModal = true;
    this.showQuickAddMenu = false;
  }

  // ============ SURVEYOR GROUPING ============
  toggleGrouping() {
    this.groupByType = !this.groupByType;
  }

  toggleGroup(group: string) {
    if (this.collapsedGroups.has(group)) {
      this.collapsedGroups.delete(group);
    } else {
      this.collapsedGroups.add(group);
    }
  }

  isGroupCollapsed(group: string): boolean {
    return this.collapsedGroups.has(group);
  }

  getGroupedSurveyors(): { type: string; surveyors: Surveyor[] }[] {
    if (!this.groupByType) {
      return [{ type: 'ALL', surveyors: this.filteredSurveyors }];
    }
    const groups: { [key: string]: Surveyor[] } = {};
    this.filteredSurveyors.forEach(s => {
      const type = s.surveyor_type || 'OTHER';
      if (!groups[type]) groups[type] = [];
      groups[type].push(s);
    });
    return Object.keys(groups).sort().map(type => ({ type, surveyors: groups[type] }));
  }

  // Get internal surveyors (filtered)
  getInternalSurveyors(): Surveyor[] {
    return this.filteredSurveyors.filter(s => s.surveyor_type === 'INTERNAL');
  }

  // Get external surveyors (filtered)
  getExternalSurveyors(): Surveyor[] {
    return this.filteredSurveyors.filter(s => s.surveyor_type === 'EXTERNAL');
  }

  // ============ APPOINTMENT TEMPLATES ============
  selectTemplate(template: AppointmentTemplate) {
    this.selectedTemplate = template;
  }

  applyTemplate() {
    if (!this.selectedTemplate) return;
    this.quickAddFromTemplate(this.selectedTemplate);
    this.showTemplateModal = false;
    this.selectedTemplate = null;
  }

  closeTemplateModal() {
    this.showTemplateModal = false;
    this.selectedTemplate = null;
  }

  // ============ MINI CALENDAR NAVIGATOR ============
  buildMiniCalendar() {
    const year = this.miniCalendarDate.getFullYear();
    const month = this.miniCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; hasEvents: boolean }[] = [];

    // Previous month days
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false, isToday: false, hasEvents: false });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const isToday = date.getTime() === today.getTime();
      days.push({ date, isCurrentMonth: true, isToday, hasEvents: false });
    }

    // Next month days to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isToday: false, hasEvents: false });
    }

    this.miniCalendarDays = days;
  }

  prevMiniMonth() {
    this.miniCalendarDate = new Date(this.miniCalendarDate.getFullYear(), this.miniCalendarDate.getMonth() - 1, 1);
    this.buildMiniCalendar();
  }

  nextMiniMonth() {
    this.miniCalendarDate = new Date(this.miniCalendarDate.getFullYear(), this.miniCalendarDate.getMonth() + 1, 1);
    this.buildMiniCalendar();
  }

  getMiniMonthLabel(): string {
    return this.miniCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  navigateToDate(date: Date) {
    // This would navigate the main calendar to the selected date
    this.calendarOptions = {
      ...this.calendarOptions,
      initialDate: date
    };
    this.showToast('info', `Navigated to ${this.formatDate(date)}`);
  }

  // ============ ACTIVITY LOG ============
  addActivityLog(action: string, details: string, surveyorName?: string) {
    const entry: ActivityLogEntry = {
      id: ++this.activityLogId,
      action,
      details,
      timestamp: new Date(),
      surveyorName
    };
    this.activityLog.unshift(entry);
    if (this.activityLog.length > 100) {
      this.activityLog = this.activityLog.slice(0, 100);
    }
  }

  toggleActivityLog() {
    this.showActivityLog = !this.showActivityLog;
  }

  getActivityIcon(action: string): string {
    switch (action.toLowerCase()) {
      case 'created': return '➕';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      case 'rescheduled': return '📅';
      default: return '📋';
    }
  }

  formatActivityTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  // ============ EXPORT ============
  openExportModal() {
    this.showExportModal = true;
  }

  closeExportModal() {
    this.showExportModal = false;
  }

  exportSchedule() {
    const data = this.prepareExportData();

    if (this.exportFormat === 'csv') {
      this.exportAsCSV(data);
    } else if (this.exportFormat === 'excel') {
      this.exportAsExcel(data);
    } else {
      this.exportAsPDF(data);
    }

    this.showExportModal = false;
    this.addActivityLog('Exported', `Schedule as ${this.exportFormat.toUpperCase()}`);
    this.showToast('success', `Schedule exported as ${this.exportFormat.toUpperCase()}`);
  }

  prepareExportData(): any[] {
    return this.existingEvents.map(e => ({
      surveyor: e.title.split(' - ')[0],
      status: e.extendedProps.state,
      start: new Date(e.start).toLocaleString(),
      end: new Date(e.end).toLocaleString(),
    }));
  }

  exportAsCSV(data: any[]) {
    const headers = ['Surveyor', 'Status', 'Start', 'End'];
    const rows = data.map(d => [d.surveyor, d.status, d.start, d.end]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadFile(csv, 'schedule.csv', 'text/csv');
  }

  exportAsExcel(data: any[]) {
    // Simple HTML table that Excel can open
    let html = '<table><tr><th>Surveyor</th><th>Status</th><th>Start</th><th>End</th></tr>';
    data.forEach(d => {
      html += `<tr><td>${d.surveyor}</td><td>${d.status}</td><td>${d.start}</td><td>${d.end}</td></tr>`;
    });
    html += '</table>';
    this.downloadFile(html, 'schedule.xls', 'application/vnd.ms-excel');
  }

  exportAsPDF(data: any[]) {
    // Create printable HTML
    let html = `<html><head><title>Schedule Export</title>
      <style>body{font-family:Arial;} table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#3949ab;color:white;}</style>
      </head><body><h1>Surveyor Schedule</h1><p>Exported: ${new Date().toLocaleString()}</p>
      <table><tr><th>Surveyor</th><th>Status</th><th>Start</th><th>End</th></tr>`;
    data.forEach(d => {
      html += `<tr><td>${d.surveyor}</td><td>${d.status}</td><td>${d.start}</td><td>${d.end}</td></tr>`;
    });
    html += '</table></body></html>';

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  }

  downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============ REAL-TIME UPDATES ============
  startLiveSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => {
      if (this.isLiveSync) {
        this.refreshEvents();
        this.lastSyncTime = new Date();
      }
    }, 30000); // Sync every 30 seconds
  }

  toggleLiveSync() {
    this.isLiveSync = !this.isLiveSync;
    this.showToast('info', this.isLiveSync ? 'Live sync enabled' : 'Live sync disabled');
  }

  getLastSyncLabel(): string {
    const diff = new Date().getTime() - this.lastSyncTime.getTime();
    if (diff < 60000) return 'Just now';
    return `${Math.floor(diff / 60000)}m ago`;
  }

  // ============ CAPACITY INDICATORS ============
  calculateCapacity() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.surveyorCapacity.clear();

    this.existingEvents.forEach(e => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      if (start >= today && start < tomorrow) {
        const surveyorId = e.extendedProps.surveyorId;
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const current = this.surveyorCapacity.get(surveyorId) || 0;
        this.surveyorCapacity.set(surveyorId, current + hours);
      }
    });
  }

  getCapacityPercent(surveyorId: number): number {
    const hours = this.surveyorCapacity.get(surveyorId) || 0;
    return Math.min(100, (hours / this.maxDailyCapacity) * 100);
  }

  getCapacityColor(surveyorId: number): string {
    const percent = this.getCapacityPercent(surveyorId);
    if (percent < 50) return '#4caf50';
    if (percent < 80) return '#ff9800';
    return '#f44336';
  }

  getCapacityLabel(surveyorId: number): string {
    const hours = this.surveyorCapacity.get(surveyorId) || 0;
    return `${hours.toFixed(1)}h / ${this.maxDailyCapacity}h`;
  }

  // ============ RESOURCE TIMELINE ============
  initTimelineHours() {
    this.timelineHours = [];
    for (let h = 6; h <= 22; h++) {
      this.timelineHours.push(`${h.toString().padStart(2, '0')}:00`);
    }
    this.updateCurrentTimePosition();
    // Update current time position every minute
    setInterval(() => this.updateCurrentTimePosition(), 60000);
  }

  updateCurrentTimePosition() {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    this.currentTimePosition = ((hours - 6) / 16) * 100;
  }

  getCurrentTimeIndicatorStyle(): string {
    // 220px is the surveyor column width, rest is event area
    // Calculate position as: surveyor_width + (percentage * events_area_width)
    return `calc(220px + ${this.currentTimePosition}% * (100% - 220px) / 100)`;
  }

  isTimelineToday(): boolean {
    const today = new Date();
    return this.timelineDate.toDateString() === today.toDateString();
  }

  getTimelineDateLabel(): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.timelineDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (this.timelineDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (this.timelineDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return this.timelineDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  prevTimelineDay() {
    this.timelineDate = new Date(this.timelineDate.getTime() - 24 * 60 * 60 * 1000);
  }

  nextTimelineDay() {
    this.timelineDate = new Date(this.timelineDate.getTime() + 24 * 60 * 60 * 1000);
  }

  goToTimelineToday() {
    this.timelineDate = new Date();
  }

  getTimelinePosition(time: string): number {
    const date = new Date(time);
    const hours = date.getHours() + date.getMinutes() / 60;
    return ((hours - 6) / 16) * 100; // 6am to 10pm = 16 hours
  }

  getTimelineWidth(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return (duration / 16) * 100;
  }

  getTimelineEventsForSurveyor(surveyorId: number): any[] {
    const dayStart = new Date(this.timelineDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return this.existingEvents.filter(e => {
      if (e.extendedProps.surveyorId !== surveyorId) return false;
      const start = new Date(e.start);
      return start >= dayStart && start < dayEnd;
    });
  }

  getTimelineEventCount(): number {
    let count = 0;
    for (const s of this.allSurveyors) {
      count += this.getTimelineEventsForSurveyor(s.id).length;
    }
    return count;
  }

  formatTimelineEventTime(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${formatTime(startDate)} - ${formatTime(endDate)}`;
  }

  // ============ DASHBOARD ============
  initDashboard() {
    this.dashboardWidgets = [
      { id: 'total', title: 'Total Surveyors', type: 'stat', value: 0 },
      { id: 'available', title: 'Available Now', type: 'stat', value: 0 },
      { id: 'appointments', title: 'Today\'s Appointments', type: 'stat', value: 0 },
      { id: 'utilization', title: 'Avg Utilization', type: 'stat', value: '0%' },
    ];
  }

  toggleDashboard() {
    this.showDashboard = !this.showDashboard;
    if (this.showDashboard) {
      this.updateDashboard();
    }
  }

  updateDashboard() {
    this.calculateCapacity();

    const totalCapacity = this.allSurveyors.length * this.maxDailyCapacity;
    let usedHours = 0;
    this.surveyorCapacity.forEach(h => usedHours += h);
    const utilization = totalCapacity > 0 ? Math.round((usedHours / totalCapacity) * 100) : 0;

    const todayEvents = this.existingEvents.filter(e => {
      const start = new Date(e.start);
      const today = new Date();
      return start.toDateString() === today.toDateString();
    });

    this.dashboardWidgets = [
      { id: 'total', title: 'Total Surveyors', type: 'stat', value: this.allSurveyors.length },
      { id: 'available', title: 'Available Now', type: 'stat', value: this.statsAvailable },
      { id: 'appointments', title: 'Today\'s Appointments', type: 'stat', value: todayEvents.length },
      { id: 'utilization', title: 'Avg Utilization', type: 'stat', value: `${utilization}%` },
    ];
  }

  // ============ APPOINTMENT COLORING ============
  openColorPicker(surveyorId: number) {
    this.colorPickerSurveyorId = surveyorId;
    this.showColorPicker = true;
  }

  closeColorPicker() {
    this.showColorPicker = false;
    this.colorPickerSurveyorId = 0;
  }

  selectColor(color: string) {
    this.surveyorColors.set(this.colorPickerSurveyorId, color);
    this.saveColors();
    this.refreshEvents();
    this.showColorPicker = false;
    this.showToast('success', 'Color updated');
  }

  getSurveyorColor(surveyorId: number): string {
    return this.surveyorColors.get(surveyorId) || this.getAvatarColor(this.surveyorMap.get(surveyorId)?.display_name || '');
  }

  saveColors() {
    const colors: { [key: number]: string } = {};
    this.surveyorColors.forEach((v, k) => colors[k] = v);
    localStorage.setItem('surveyorColors', JSON.stringify(colors));
  }

  loadSavedColors() {
    const saved = localStorage.getItem('surveyorColors');
    if (saved) {
      const colors = JSON.parse(saved);
      Object.keys(colors).forEach(k => {
        this.surveyorColors.set(Number(k), colors[k]);
      });
    }
  }

  // ============ SURVEYOR NOTES ============
  openNotesModal(surveyorId: number) {
    const surveyor = this.surveyorMap.get(surveyorId) || this.allSurveyors.find(s => s.id === surveyorId);
    this.notesModalSurveyorId = surveyorId;
    this.notesModalSurveyorName = surveyor?.display_name || `Surveyor ${surveyorId}`;
    this.notesModalContent = this.surveyorNotes.get(surveyorId)?.note || '';
    this.showNotesModal = true;
  }

  closeNotesModal() {
    this.showNotesModal = false;
    this.notesModalSurveyorId = 0;
    this.notesModalContent = '';
  }

  saveNote() {
    if (this.notesModalSurveyorId) {
      this.surveyorNotes.set(this.notesModalSurveyorId, {
        surveyorId: this.notesModalSurveyorId,
        note: this.notesModalContent,
        updatedAt: new Date()
      });
      this.saveNotes();
      this.showToast('success', 'Note saved');
      this.addActivityLog('Updated', 'Surveyor note', this.notesModalSurveyorName);
    }
    this.closeNotesModal();
  }

  hasNote(surveyorId: number): boolean {
    const note = this.surveyorNotes.get(surveyorId);
    return note ? note.note.trim().length > 0 : false;
  }

  saveNotes() {
    const notes: { [key: number]: { note: string; updatedAt: string } } = {};
    this.surveyorNotes.forEach((v, k) => {
      notes[k] = { note: v.note, updatedAt: v.updatedAt.toISOString() };
    });
    localStorage.setItem('surveyorNotes', JSON.stringify(notes));
  }

  loadSavedNotes() {
    const saved = localStorage.getItem('surveyorNotes');
    if (saved) {
      const notes = JSON.parse(saved);
      Object.keys(notes).forEach(k => {
        this.surveyorNotes.set(Number(k), {
          surveyorId: Number(k),
          note: notes[k].note,
          updatedAt: new Date(notes[k].updatedAt)
        });
      });
    }
  }

  // ============ CHARACTER COUNTER UTILITIES ============
  getTitleCharCount(): string {
    const len = this.modalTitle.length;
    return `${len}/100`;
  }

  getDescriptionCharCount(): string {
    const len = this.modalDescription.length;
    return `${len}/255`;
  }

  getTitleCharClass(): string {
    const len = this.modalTitle.length;
    if (len >= 100) return 'danger';
    if (len >= 90) return 'warning';
    return '';
  }

  getDescriptionCharClass(): string {
    const len = this.modalDescription.length;
    if (len >= 255) return 'danger';
    if (len >= 230) return 'warning';
    return '';
  }

  getEditTitleCharCount(): string {
    const len = this.editTitle.length;
    return `${len}/100`;
  }

  getEditDescriptionCharCount(): string {
    const len = this.editDescription.length;
    return `${len}/255`;
  }

  getEditTitleCharClass(): string {
    const len = this.editTitle.length;
    if (len >= 100) return 'danger';
    if (len >= 90) return 'warning';
    return '';
  }

  getEditDescriptionCharClass(): string {
    const len = this.editDescription.length;
    if (len >= 255) return 'danger';
    if (len >= 230) return 'warning';
    return '';
  }

  // ============ FORM VALIDATION ============
  isCreateFormValid(): boolean {
    return this.modalTitle.trim().length > 0 && this.modalDescription.trim().length > 0;
  }

  isEditFormValid(): boolean {
    return this.editTitle.trim().length > 0 && this.editDescription.trim().length > 0;
  }

  // ============ KEYBOARD SHORTCUTS ============
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    // Ignore shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // ? or Shift+/ - Show keyboard shortcuts help
    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      this.showKeyboardHelp = !this.showKeyboardHelp;
      return;
    }

    // Escape - Close any open modal
    if (event.key === 'Escape') {
      this.closeAllModals();
      return;
    }

    // B - Open Bulk Assign (with selected surveyors)
    if (event.key === 'b' || event.key === 'B') {
      if (this.selectedSurveyorIds.length > 0) {
        event.preventDefault();
        this.openBulkAssignModal();
      }
      return;
    }

    // O - Switch to Resource Timeline view
    if (event.key === 'o' || event.key === 'O') {
      event.preventDefault();
      this.currentView = this.currentView === 'timeline' ? 'calendar' : 'timeline';
      return;
    }

    // R - Refresh events
    if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.clearAppointmentCache(true);
      this.refreshEvents();
      this.showToast('info', 'Refreshed');
      return;
    }

    // A - Select all surveyors
    if (event.key === 'a' || event.key === 'A') {
      event.preventDefault();
      this.selectAllSurveyors();
      return;
    }

    // C - Clear selection
    if (event.key === 'c' || event.key === 'C') {
      event.preventDefault();
      this.clearAllSurveyors();
      return;
    }

    // S - Toggle sidebar
    if (event.key === 's' || event.key === 'S') {
      event.preventDefault();
      this.toggleSidebar();
      return;
    }

    // D - Toggle Dashboard
    if (event.key === 'd' || event.key === 'D') {
      event.preventDefault();
      this.toggleDashboard();
      return;
    }

    // T - Today (navigate to today)
    if (event.key === 't' || event.key === 'T') {
      event.preventDefault();
      this.navigateToDate(new Date());
      return;
    }

    // E - Export
    if (event.key === 'e' || event.key === 'E') {
      event.preventDefault();
      this.openExportModal();
      return;
    }
  }

  closeAllModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showRescheduleModal = false;
    this.showSuccessModal = false;
    this.showTemplateModal = false;
    this.showExportModal = false;
    this.showNotesModal = false;
    this.showBulkAssignModal = false;
    this.showAvailabilityOverview = false;
    this.showKeyboardHelp = false;
    this.showColorPicker = false;
    this.showContactInfo = null;
    this.showCopyModal = false;
    this.showReassignModal = false;
    this.showReassignPicker = false;
    this.showConflictPanel = false;
    this.showWorkloadPanel = false;
    if (this.copyRevertFn) {
      this.copyRevertFn();
      this.copyRevertFn = null;
    }
    if (this.reassignRevertFn) {
      this.reassignRevertFn();
      this.reassignRevertFn = null;
    }
  }

  toggleKeyboardHelp() {
    this.showKeyboardHelp = !this.showKeyboardHelp;
  }

  // ============ BULK ASSIGN ============
  openBulkAssignModal() {
    if (this.selectedSurveyorIds.length === 0) {
      this.showToast('warning', 'Please select at least one surveyor first');
      return;
    }
    this.bulkAssignSurveyorIds = [...this.selectedSurveyorIds];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.bulkAssignDate = tomorrow.toISOString().split('T')[0];
    this.bulkAssignStartTime = '09:00';
    this.bulkAssignEndTime = '17:00';
    this.bulkAssignState = 'BUSY';
    this.bulkAssignTitle = '';
    this.bulkAssignDescription = '';
    this.showBulkAssignModal = true;
  }

  closeBulkAssignModal() {
    this.showBulkAssignModal = false;
    this.bulkAssignSurveyorIds = [];
  }

  toggleBulkSurveyorSelection(id: number) {
    const index = this.bulkAssignSurveyorIds.indexOf(id);
    if (index > -1) {
      this.bulkAssignSurveyorIds.splice(index, 1);
    } else {
      this.bulkAssignSurveyorIds.push(id);
    }
  }

  isBulkSurveyorSelected(id: number): boolean {
    return this.bulkAssignSurveyorIds.includes(id);
  }

  confirmBulkAssign() {
    if (this.bulkAssignSurveyorIds.length === 0) {
      this.showToast('error', 'Please select at least one surveyor');
      return;
    }

    if (!this.bulkAssignTitle.trim() || !this.bulkAssignDescription.trim()) {
      this.showToast('error', 'Title and Description are required');
      return;
    }

    const startDateTime = new Date(`${this.bulkAssignDate}T${this.bulkAssignStartTime}:00`);
    const endDateTime = new Date(`${this.bulkAssignDate}T${this.bulkAssignEndTime}:00`);

    if (endDateTime <= startDateTime) {
      this.showToast('error', 'End time must be after start time');
      return;
    }

    // Create appointments for all selected surveyors
    let successCount = 0;
    let errorCount = 0;
    const totalCount = this.bulkAssignSurveyorIds.length;

    this.bulkAssignSurveyorIds.forEach(surveyorId => {
      const payload = {
        surveyorId: surveyorId,
        blocks: [{
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          state: this.bulkAssignState,
          title: this.bulkAssignTitle,
          description: this.bulkAssignDescription
        }]
      };

      this.http.post(`${this.apiBase}/mobile/availability`, payload).subscribe({
        next: () => {
          successCount++;
          if (successCount + errorCount === totalCount) {
            this.onBulkAssignComplete(successCount, errorCount);
          }
        },
        error: () => {
          errorCount++;
          if (successCount + errorCount === totalCount) {
            this.onBulkAssignComplete(successCount, errorCount);
          }
        }
      });
    });

    this.showBulkAssignModal = false;
  }

  onBulkAssignComplete(successCount: number, errorCount: number) {
    this.clearAppointmentCache(true);
    this.refreshEvents();
    this.loadUpcomingAlerts();

    if (errorCount === 0) {
      this.showToast('success', `Created ${successCount} appointments successfully`);
    } else {
      this.showToast('warning', `Created ${successCount} appointments, ${errorCount} failed`);
    }

    this.addActivityLog('Bulk Assigned', `${successCount} appointments`);
  }

  getBulkAssignSurveyorNames(): string {
    return this.bulkAssignSurveyorIds
      .map(id => this.surveyorMap.get(id)?.display_name || `Surveyor ${id}`)
      .join(', ');
  }

  isBulkAssignFormValid(): boolean {
    return this.bulkAssignTitle.trim().length > 0 &&
           this.bulkAssignDescription.trim().length > 0 &&
           this.bulkAssignSurveyorIds.length > 0;
  }

  // ============ AVAILABILITY OVERVIEW ============
  toggleAvailabilityOverview() {
    this.showAvailabilityOverview = !this.showAvailabilityOverview;
    if (this.showAvailabilityOverview) {
      this.loadAvailabilityOverview();
    }
  }

  loadAvailabilityOverview() {
    const dateStart = new Date(this.overviewDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);

    this.http.get<any[]>(`${this.apiBase}/availability?from=${dateStart.toISOString()}&to=${dateEnd.toISOString()}`).subscribe({
      next: (rows) => {
        this.buildOverviewData(rows);
      },
      error: (e) => console.error(e)
    });
  }

  buildOverviewData(appointments: any[]) {
    const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6 AM to 6 PM

    this.overviewSurveyors = this.allSurveyors.map(surveyor => {
      const surveyorAppointments = appointments.filter(a => a.surveyor_id === surveyor.id);

      const slots = hours.map(hour => {
        const slotStart = new Date(this.overviewDate);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1);

        // Check if any appointment overlaps with this hour
        const overlapping = surveyorAppointments.find(a => {
          const aStart = new Date(a.start_time);
          const aEnd = new Date(a.end_time);
          return aStart < slotEnd && aEnd > slotStart;
        });

        return {
          hour,
          status: overlapping ? overlapping.state : 'AVAILABLE'
        };
      });

      return { surveyor, slots };
    });
  }

  prevOverviewDay() {
    this.overviewDate = new Date(this.overviewDate.getTime() - 24 * 60 * 60 * 1000);
    this.loadAvailabilityOverview();
  }

  nextOverviewDay() {
    this.overviewDate = new Date(this.overviewDate.getTime() + 24 * 60 * 60 * 1000);
    this.loadAvailabilityOverview();
  }

  getOverviewDateLabel(): string {
    return this.overviewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  getOverviewHours(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 6); // 6 AM to 6 PM
  }

  formatOverviewHour(hour: number): string {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}${suffix}`;
  }

  getOverviewSlotColor(status: string): string {
    switch (status) {
      case 'BUSY': return '#dc3545';
      case 'OFFLINE': return '#6c757d';
      case 'AVAILABLE': return '#28a745';
      default: return '#e9ecef';
    }
  }

  closeAvailabilityOverview() {
    this.showAvailabilityOverview = false;
  }

  // ============ SURVEYOR CONTACT INFO ============
  toggleContactInfo(surveyorId: number) {
    if (this.showContactInfo === surveyorId) {
      this.showContactInfo = null;
    } else {
      this.showContactInfo = surveyorId;
    }
  }

  getSurveyorEmail(surveyorId: number): string {
    const surveyor = this.surveyorMap.get(surveyorId) || this.allSurveyors.find(s => s.id === surveyorId);
    return surveyor?.email || 'No email';
  }

  getSurveyorPhone(surveyorId: number): string {
    const surveyor = this.surveyorMap.get(surveyorId) || this.allSurveyors.find(s => s.id === surveyorId);
    return surveyor?.phone || 'No phone';
  }

  callSurveyor(phone: string) {
    if (phone && phone !== 'No phone') {
      window.open(`tel:${phone}`, '_self');
    }
  }

  emailSurveyor(email: string) {
    if (email && email !== 'No email') {
      window.open(`mailto:${email}`, '_self');
    }
  }

  // ============ DRAG TO REASSIGN ============
  // Open reassign picker from edit modal
  openReassignFromEdit() {
    // Store the current edit modal data for reassignment
    this.reassignEventId = String(this.editId);
    this.reassignFromSurveyorId = this.getEditSurveyorId();
    this.reassignFromSurveyorName = this.editSurveyorName;
    this.reassignState = this.editState;
    this.reassignTitle = this.editTitle;
    this.reassignDescription = this.editDescription;
    this.reassignStartIso = this.editPendingStart;
    this.reassignEndIso = this.editPendingEnd;
    this.reassignToSurveyorId = 0; // Reset selection

    this.showEditModal = false;
    this.showReassignPicker = true;
  }

  private getEditSurveyorId(): number {
    const event = this.existingEvents.find(e => e.id === String(this.editId));
    return event?.extendedProps?.surveyorId || 0;
  }

  getReassignableSurveyors(): Surveyor[] {
    // Return all surveyors except the current one
    return this.allSurveyors.filter(s => s.id !== this.reassignFromSurveyorId);
  }

  selectReassignSurveyor(surveyorId: number) {
    this.reassignToSurveyorId = surveyorId;
    const surveyor = this.surveyorMap.get(surveyorId);
    this.reassignToSurveyorName = surveyor?.display_name || `Surveyor ${surveyorId}`;
  }

  closeReassignPicker() {
    this.showReassignPicker = false;
    this.reassignToSurveyorId = 0;
  }

  confirmReassignFromPicker() {
    if (this.reassignToSurveyorId === 0) {
      this.showToast('warning', 'Please select a surveyor to reassign to');
      return;
    }

    // Check for conflicts
    const startDate = new Date(this.reassignStartIso);
    const endDate = new Date(this.reassignEndIso);
    const hasConflict = this.checkConflict(this.reassignToSurveyorId, startDate, endDate);
    if (hasConflict) {
      this.showToast('warning', `${this.reassignToSurveyorName} has a conflicting appointment at this time`);
    }

    // Close picker and show confirmation modal
    this.showReassignPicker = false;
    this.reassignDate = this.formatDate(startDate);
    this.reassignTime = `${this.formatTime(startDate)} - ${this.formatTime(endDate)}`;
    this.reassignDuration = this.formatDuration(startDate, endDate);
    this.showReassignModal = true;
  }

  openReassignModal(event: any, newSurveyorId: number, revertFn: () => void) {
    const oldSurveyorId = event.extendedProps['surveyorId'];
    const oldSurveyor = this.surveyorMap.get(oldSurveyorId);
    const newSurveyor = this.surveyorMap.get(newSurveyorId);

    this.reassignEventId = event.id;
    this.reassignFromSurveyorId = oldSurveyorId;
    this.reassignFromSurveyorName = oldSurveyor?.display_name || `Surveyor ${oldSurveyorId}`;
    this.reassignToSurveyorId = newSurveyorId;
    this.reassignToSurveyorName = newSurveyor?.display_name || `Surveyor ${newSurveyorId}`;
    this.reassignDate = this.formatDate(event.start!);
    this.reassignTime = `${this.formatTime(event.start!)} - ${this.formatTime(event.end!)}`;
    this.reassignDuration = this.formatDuration(event.start!, event.end!);
    this.reassignState = event.extendedProps['state'];
    this.reassignTitle = event.extendedProps['title'] || '';
    this.reassignDescription = event.extendedProps['description'] || '';
    this.reassignStartIso = event.start!.toISOString();
    this.reassignEndIso = event.end!.toISOString();
    this.reassignRevertFn = revertFn;

    // Check for conflicts with new surveyor
    const hasConflict = this.checkConflict(newSurveyorId, event.start!, event.end!);
    if (hasConflict) {
      this.showToast('warning', `${this.reassignToSurveyorName} has a conflicting appointment at this time`);
    }

    this.showReassignModal = true;
  }

  closeReassignModal() {
    if (this.reassignRevertFn) {
      this.reassignRevertFn();
    }
    this.showReassignModal = false;
    this.reassignRevertFn = null;
  }

  confirmReassign() {
    // Delete old appointment and create new one for different surveyor
    this.http.delete(`${this.apiBase}/availability/${this.reassignEventId}`).subscribe({
      next: () => {
        // Create new appointment for the new surveyor
        const payload = {
          surveyorId: this.reassignToSurveyorId,
          blocks: [{
            startTime: this.reassignStartIso,
            endTime: this.reassignEndIso,
            state: this.reassignState,
            title: this.reassignTitle || null,
            description: this.reassignDescription || null
          }]
        };

        this.http.post(`${this.apiBase}/mobile/availability`, payload).subscribe({
          next: () => {
            this.showReassignModal = false;
            this.reassignRevertFn = null;
            this.clearAppointmentCache(true);
            this.refreshEvents();
            this.showToast('success', `Reassigned from ${this.reassignFromSurveyorName} to ${this.reassignToSurveyorName}`);
            this.addActivityLog('Reassigned', `${this.reassignFromSurveyorName} → ${this.reassignToSurveyorName}`);
          },
          error: (e) => {
            console.error(e);
            this.showToast('error', 'Failed to create reassigned appointment');
            if (this.reassignRevertFn) this.reassignRevertFn();
            this.showReassignModal = false;
            this.reassignRevertFn = null;
          }
        });
      },
      error: (e) => {
        console.error(e);
        this.showToast('error', 'Failed to delete original appointment');
        if (this.reassignRevertFn) this.reassignRevertFn();
        this.showReassignModal = false;
        this.reassignRevertFn = null;
      }
    });
  }

  // ============ CONFLICT DETECTION & WARNINGS ============
  detectConflicts() {
    this.conflictWarnings = [];
    const surveyorEvents: Map<number, any[]> = new Map();

    // Group events by surveyor
    this.existingEvents.forEach(e => {
      const surveyorId = e.extendedProps?.surveyorId;
      if (!surveyorId) return;
      if (!surveyorEvents.has(surveyorId)) {
        surveyorEvents.set(surveyorId, []);
      }
      surveyorEvents.get(surveyorId)!.push(e);
    });

    // Check for overlaps within each surveyor
    surveyorEvents.forEach((events, surveyorId) => {
      const conflicts: any[] = [];
      const sortedEvents = events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = sortedEvents[i];
        const next = sortedEvents[i + 1];
        const currentEnd = new Date(current.end);
        const nextStart = new Date(next.start);

        if (currentEnd > nextStart) {
          conflicts.push({ event1: current, event2: next, overlapMinutes: Math.round((currentEnd.getTime() - nextStart.getTime()) / 60000) });
        }
      }

      if (conflicts.length > 0) {
        const surveyor = this.surveyorMap.get(surveyorId);
        this.conflictWarnings.push({
          surveyorId,
          surveyorName: surveyor?.display_name || `Surveyor ${surveyorId}`,
          conflictCount: conflicts.length,
          conflicts
        });
      }
    });

    // Show toast if conflicts found
    if (this.conflictWarnings.length > 0) {
      const totalConflicts = this.conflictWarnings.reduce((sum, w) => sum + w.conflictCount, 0);
      this.showToast('warning', `${totalConflicts} scheduling conflict(s) detected`);
    }
  }

  toggleConflictPanel() {
    this.showConflictPanel = !this.showConflictPanel;
    if (this.showConflictPanel) {
      this.detectConflicts();
    }
  }

  getConflictColor(overlapMinutes: number): string {
    if (overlapMinutes >= 60) return '#dc3545'; // Red - severe
    if (overlapMinutes >= 30) return '#fd7e14'; // Orange - moderate
    return '#ffc107'; // Yellow - minor
  }

  // ============ TRAVEL TIME ESTIMATION ============
  calculateTravelTimes() {
    this.travelTimeEstimates.clear();
    const surveyorEvents: Map<number, any[]> = new Map();

    // Group today's events by surveyor
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.existingEvents.forEach(e => {
      const surveyorId = e.extendedProps?.surveyorId;
      const startDate = new Date(e.start);
      if (!surveyorId || startDate < today || startDate >= tomorrow) return;
      if (!surveyorEvents.has(surveyorId)) {
        surveyorEvents.set(surveyorId, []);
      }
      surveyorEvents.get(surveyorId)!.push(e);
    });

    // Calculate travel times between consecutive events
    surveyorEvents.forEach((events, surveyorId) => {
      const surveyor = this.surveyorMap.get(surveyorId);
      if (!surveyor?.home_lat || !surveyor?.home_lng) return;

      const sortedEvents = events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      const estimates: { fromEvent: any; toEvent: any; travelMinutes: number }[] = [];

      // Travel from home to first event
      if (sortedEvents.length > 0) {
        const firstEvent = sortedEvents[0];
        // Assume 30 min average travel time (could be enhanced with actual location data)
        estimates.push({ fromEvent: null, toEvent: firstEvent, travelMinutes: 30 });
      }

      // Travel between consecutive events
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = sortedEvents[i];
        const next = sortedEvents[i + 1];
        const currentEnd = new Date(current.end);
        const nextStart = new Date(next.start);
        const gapMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60000;

        // Estimate travel time (simplified - could use real geocoding)
        const estimatedTravel = Math.min(45, Math.max(15, Math.random() * 30 + 15));
        const isTight = gapMinutes < estimatedTravel;

        estimates.push({
          fromEvent: current,
          toEvent: next,
          travelMinutes: Math.round(estimatedTravel)
        });
      }

      if (estimates.length > 0) {
        this.travelTimeEstimates.set(surveyorId, estimates);
      }
    });
  }

  toggleTravelTimes() {
    this.showTravelTimes = !this.showTravelTimes;
    if (this.showTravelTimes) {
      this.calculateTravelTimes();
    }
  }

  getTravelTimeWarning(surveyorId: number): { warning: boolean; message: string } | null {
    const estimates = this.travelTimeEstimates.get(surveyorId);
    if (!estimates) return null;

    for (const est of estimates) {
      if (est.fromEvent && est.toEvent) {
        const fromEnd = new Date(est.fromEvent.end);
        const toStart = new Date(est.toEvent.start);
        const gapMinutes = (toStart.getTime() - fromEnd.getTime()) / 60000;

        if (gapMinutes < est.travelMinutes) {
          return {
            warning: true,
            message: `Only ${Math.round(gapMinutes)} min gap, needs ~${est.travelMinutes} min travel`
          };
        }
      }
    }
    return null;
  }

  // ============ WORKLOAD BALANCE ============
  calculateWorkloadBalance() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const workloadMap: Map<number, { hoursToday: number; hoursWeek: number; appointmentsToday: number; appointmentsWeek: number }> = new Map();

    // Initialize all surveyors with zero
    this.allSurveyors.forEach(s => {
      workloadMap.set(s.id, { hoursToday: 0, hoursWeek: 0, appointmentsToday: 0, appointmentsWeek: 0 });
    });

    // Calculate workload from events
    this.existingEvents.forEach(e => {
      const surveyorId = e.extendedProps?.surveyorId;
      if (!surveyorId || !workloadMap.has(surveyorId)) return;

      const start = new Date(e.start);
      const end = new Date(e.end);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const workload = workloadMap.get(surveyorId)!;

      // Check if event is today
      if (start >= today && start < tomorrow) {
        workload.hoursToday += hours;
        workload.appointmentsToday++;
      }

      // Check if event is this week
      if (start >= weekStart && start < weekEnd) {
        workload.hoursWeek += hours;
        workload.appointmentsWeek++;
      }
    });

    // Convert to array and sort by workload
    this.workloadBalance = Array.from(workloadMap.entries()).map(([surveyorId, workload]) => {
      const surveyor = this.surveyorMap.get(surveyorId);
      return {
        surveyorId,
        surveyorName: surveyor?.display_name || `Surveyor ${surveyorId}`,
        hoursToday: Math.round(workload.hoursToday * 10) / 10,
        hoursWeek: Math.round(workload.hoursWeek * 10) / 10,
        appointmentsToday: workload.appointmentsToday,
        appointmentsWeek: workload.appointmentsWeek
      };
    }).sort((a, b) => b.hoursWeek - a.hoursWeek);
  }

  toggleWorkloadPanel() {
    this.showWorkloadPanel = !this.showWorkloadPanel;
    if (this.showWorkloadPanel) {
      this.calculateWorkloadBalance();
    }
  }

  getWorkloadBarWidth(hours: number, maxHours: number = 40): number {
    return Math.min(100, (hours / maxHours) * 100);
  }

  getWorkloadColor(hoursWeek: number): string {
    if (hoursWeek >= 40) return '#dc3545'; // Overloaded
    if (hoursWeek >= 30) return '#fd7e14'; // High
    if (hoursWeek >= 20) return '#ffc107'; // Medium
    if (hoursWeek >= 10) return '#28a745'; // Good
    return '#6c757d'; // Low
  }

  getWorkloadStatus(hoursWeek: number): string {
    if (hoursWeek >= 40) return 'Overloaded';
    if (hoursWeek >= 30) return 'High';
    if (hoursWeek >= 20) return 'Medium';
    if (hoursWeek >= 10) return 'Good';
    return 'Available';
  }

  getAverageWorkload(): number {
    if (this.workloadBalance.length === 0) return 0;
    const total = this.workloadBalance.reduce((sum, w) => sum + w.hoursWeek, 0);
    return Math.round((total / this.workloadBalance.length) * 10) / 10;
  }

  getWorkloadVariance(): string {
    if (this.workloadBalance.length < 2) return 'N/A';
    const avg = this.getAverageWorkload();
    const variance = this.workloadBalance.reduce((sum, w) => sum + Math.pow(w.hoursWeek - avg, 2), 0) / this.workloadBalance.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 5) return 'Balanced';
    if (stdDev < 10) return 'Moderate';
    return 'Uneven';
  }

  // ============ WEB PUSH NOTIFICATIONS ============
  async initWebPushNotifications() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      // Register service worker
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      // Get current permission status
      this.webPushPermission = Notification.permission;

      if (this.webPushPermission === 'granted') {
        await this.setupWebPushMessaging();
      }
    } catch (error) {
      console.error('Error initializing web push:', error);
    }
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      this.webPushPermission = permission;

      if (permission === 'granted') {
        await this.setupWebPushMessaging();
        this.showToast('success', 'Push notifications enabled!');
      } else if (permission === 'denied') {
        this.showToast('warning', 'Notification permission denied. You can enable it in browser settings.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.showToast('error', 'Failed to request notification permission');
    }
  }

  async setupWebPushMessaging() {
    try {
      const firebaseApp = (window as any).firebaseApp;
      if (!firebaseApp) {
        console.error('Firebase not initialized');
        this.showToast('error', 'Firebase not initialized');
        return;
      }

      const messaging = firebaseApp.messaging();

      // Wait for service worker to be ready
      let swReg = await navigator.serviceWorker.getRegistration();
      if (!swReg) {
        // If no registration exists, wait a bit for Angular's SW to register
        await new Promise(resolve => setTimeout(resolve, 1000));
        swReg = await navigator.serviceWorker.ready;
      }

      // VAPID key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
      // This key is required for web push notifications
      const vapidKey = 'BAYcu5baiUBreHeDOYBA7gl_NRGH1gDZtUGQX-NapJpk7bNGfUHZa5XBMNkDDzy0zXw7E2hZ9iYHZ5UZR85kxII';

      // Get FCM token with VAPID key
      let token = null;
      try {
        token = await messaging.getToken({
          serviceWorkerRegistration: swReg,
          vapidKey: vapidKey
        });
      } catch (e: any) {
        console.error('FCM getToken error:', e);
        // Common errors:
        // - messaging/permission-blocked: User denied notification permission
        // - messaging/unsupported-browser: Browser doesn't support push
        // - messaging/failed-service-worker-registration: SW registration failed
        if (e.code === 'messaging/permission-blocked') {
          this.showToast('error', 'Notifications blocked. Please enable in browser settings.');
        } else if (e.code === 'messaging/unsupported-browser') {
          this.showToast('error', 'This browser does not support push notifications.');
        } else {
          this.showToast('warning', 'Push setup failed. Check browser console for details.');
        }
        throw e;
      }

      if (token) {
        this.webPushToken = token;
        // Note: webPushEnabled should only be true when registered with a surveyor
        // Check if we have a stored surveyorId - if so, we're already registered
        const storedSurveyorId = localStorage.getItem('fcmSurveyorId');
        if (storedSurveyorId) {
          this.webPushEnabled = true;
          this.registeredPushSurveyorId = parseInt(storedSurveyorId);
        }

        // Store token locally
        localStorage.setItem('fcmToken', token);

        // Handle foreground messages
        messaging.onMessage((payload: any) => {
          this.handleForegroundMessage(payload);
        });

        this.addActivityLog('Push Enabled', 'Web push notifications enabled for this browser');
      } else {
        console.error('No token received');
        this.showToast('error', 'Could not get push notification token');
      }
    } catch (error) {
      console.error('Error setting up FCM:', error);
      // Don't show duplicate toast if already shown above
    }
  }

  handleForegroundMessage(payload: any) {
    const title = payload.notification?.title || 'CMX Calendar';
    const body = payload.notification?.body || 'You have a new notification';
    const type = payload.data?.type || 'info';

    // Show toast notification
    if (type === 'APPOINTMENT_CREATED') {
      this.showToast('success', body, title);
    } else if (type === 'APPOINTMENT_UPDATED') {
      this.showToast('info', body, title);
    } else if (type === 'APPOINTMENT_DELETED') {
      this.showToast('warning', body, title);
    } else {
      this.showToast('info', body, title);
    }

    // Refresh events to show updated data
    this.refreshEvents();

    // Add to activity log
    this.addActivityLog(title, body);
  }

  toggleWebPushNotifications() {
    if (this.webPushEnabled) {
      // Disable notifications (just clear local state, browser permission persists)
      this.webPushEnabled = false;
      this.webPushToken = null;
      this.registeredPushSurveyorId = null;
      localStorage.removeItem('fcmToken');
      localStorage.removeItem('fcmSurveyorId');
      this.showToast('info', 'Push notifications disabled');
    } else {
      // Show the surveyor selection modal
      this.showPushRegistrationModal = true;
      this.pushRegistrationSurveyorId = null;
      this.pushRegistrationSurveyorSearch = '';
    }
  }

  closePushRegistrationModal() {
    this.showPushRegistrationModal = false;
    this.pushRegistrationSurveyorId = null;
    this.pushRegistrationSurveyorSearch = '';
  }

  getFilteredPushSurveyors(): Surveyor[] {
    if (!this.pushRegistrationSurveyorSearch) {
      return this.allSurveyors.slice(0, 10);
    }
    const search = this.pushRegistrationSurveyorSearch.toLowerCase();
    return this.allSurveyors
      .filter(s => s.display_name.toLowerCase().includes(search) || s.code.toLowerCase().includes(search))
      .slice(0, 10);
  }

  selectPushSurveyor(surveyorId: number) {
    this.pushRegistrationSurveyorId = surveyorId;
  }

  async confirmPushRegistration() {
    if (!this.pushRegistrationSurveyorId) {
      this.showToast('error', 'Please select a surveyor');
      return;
    }

    // Request notification permission first
    await this.requestNotificationPermission();

    // If permission granted, register the token with the selected surveyor
    if (this.webPushEnabled && this.webPushToken) {
      this.registerTokenForSurveyor(this.pushRegistrationSurveyorId);
      this.registeredPushSurveyorId = this.pushRegistrationSurveyorId;
      localStorage.setItem('fcmSurveyorId', String(this.pushRegistrationSurveyorId));
    } else {
      // Try to get token from localStorage as fallback
      const storedToken = localStorage.getItem('fcmToken');
      if (storedToken) {
        this.registerTokenForSurveyor(this.pushRegistrationSurveyorId);
        this.registeredPushSurveyorId = this.pushRegistrationSurveyorId;
        localStorage.setItem('fcmSurveyorId', String(this.pushRegistrationSurveyorId));
        this.webPushEnabled = true;
      }
    }

    this.closePushRegistrationModal();
  }

  getRegisteredSurveyorName(): string {
    const surveyorId = this.pushRegistrationSurveyorId || this.registeredPushSurveyorId;
    if (!surveyorId) return '';
    const surveyor = this.allSurveyors.find(s => s.id === surveyorId);
    return surveyor ? surveyor.display_name : '';
  }

  registerTokenForSurveyor(surveyorId: number) {
    const token = this.webPushToken || localStorage.getItem('fcmToken');

    if (!token) {
      this.showToast('error', 'No push token available. Enable notifications first.');
      return;
    }

    const payload = {
      surveyorId: surveyorId,
      token: token,
      platform: 'WEB'
    };

    this.http.post(`${this.apiBase}/mobile/device-token`, payload).subscribe({
      next: () => {
        this.showToast('success', `Push notifications registered for surveyor`);
        this.webPushEnabled = true;
      },
      error: (e) => {
        console.error('Failed to register push token:', e);
        this.showToast('error', 'Failed to register push token');
      }
    });
  }

  // ============ SURVEYOR ACTIVITY (REAL-TIME) ============
  initSurveyorActivity(): void {
    // Subscribe to activities from service
    this.activitySubscriptions.push(
      this.surveyorActivityService.activities$.subscribe(activities => {
        this.surveyorActivities = activities;
      }),
      this.surveyorActivityService.connected$.subscribe(connected => {
        this.sseConnected = connected;
      }),
      this.surveyorActivityService.loading$.subscribe(loading => {
        this.loadingActivities = loading;
      }),
      this.surveyorActivityService.liveEvent$.subscribe(event => {
        // Show prominent toast for real-time surveyor activity events
        this.showToast('surveyor', event.message, 'Surveyor Activity');
        // Also refresh surveyor stats as status may have changed
        this.loadAllSurveyors();
      })
    );

    // Connect to SSE stream
    this.surveyorActivityService.connect();

    // Load initial activities (with retry logic for first load)
    this.loadSurveyorActivity(true);
  }

  loadSurveyorActivity(isInitialLoad: boolean = false, retryCount: number = 0): void {
    this.surveyorActivityService.loadRecentActivities(24, 100).subscribe({
      error: (e) => {
        console.error('Failed to load surveyor activity:', e);
        // Retry up to 3 times on initial load with exponential backoff
        if (isInitialLoad && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => this.loadSurveyorActivity(true, retryCount + 1), delay);
        } else if (!isInitialLoad) {
          // Only show error toast for user-initiated refreshes, not initial load
          this.showToast('error', 'Failed to load activity log');
        }
      }
    });
  }

  onActivityFilterChange(): void {
    this.loadSurveyorActivity();
  }

  getActivityClass(activityType: string): string {
    switch (activityType) {
      case 'STATUS_CHANGE': return 'status-change';
      case 'JOB_UPDATE': return 'job-update';
      case 'LOGIN': return 'login';
      case 'LOGOUT': return 'logout';
      default: return '';
    }
  }

  getSurveyorActivityIcon(activityType: string, value: string): string {
    const info = this.surveyorActivityService.getActivityTypeInfo(activityType, value);
    return info.icon;
  }

  getSurveyorActivityColor(activityType: string, value: string): string {
    const info = this.surveyorActivityService.getActivityTypeInfo(activityType, value);
    return info.color;
  }

  getSurveyorActivityLabel(activityType: string, value: string): string {
    const info = this.surveyorActivityService.getActivityTypeInfo(activityType, value);
    return info.label;
  }

  formatActivityTimestamp(timestamp: string): string {
    return this.surveyorActivityService.formatTimestamp(timestamp);
  }

  formatActivityFullDateTime(timestamp: string): string {
    return this.surveyorActivityService.formatFullDateTime(timestamp);
  }

  getFilteredActivities(): SurveyorActivity[] {
    let activities = this.surveyorActivities;
    if (this.activityFilter !== 'ALL') {
      activities = activities.filter(a => a.activityType === this.activityFilter);
    }
    // Return only the last 20 activities, already sorted by createdAt DESC from backend
    return activities.slice(0, 20);
  }

  // ============ ACTIVITY HISTORY MODAL ============
  openActivityHistory(): void {
    this.showActivityHistoryModal = true;
    this.activityHistoryPage = 0;
    this.loadActivityHistoryPage();
  }

  closeActivityHistory(): void {
    this.showActivityHistoryModal = false;
  }

  loadActivityHistoryPage(): void {
    this.loadingActivityHistory = true;
    const offset = this.activityHistoryPage * this.activityHistoryPageSize;

    this.surveyorActivityService.loadActivities(
      undefined,
      this.activityFilter === 'ALL' ? undefined : this.activityFilter,
      168, // Last 7 days
      this.activityHistoryPageSize,
      offset
    ).subscribe({
      next: (activities) => {
        this.activityHistoryItems = activities;
        // Estimate total from current results
        if (activities.length < this.activityHistoryPageSize) {
          this.activityHistoryTotal = offset + activities.length;
        } else {
          this.activityHistoryTotal = offset + activities.length + 1; // At least one more page
        }
        this.loadingActivityHistory = false;
      },
      error: (e) => {
        console.error('Failed to load activity history:', e);
        this.loadingActivityHistory = false;
        this.showToast('error', 'Failed to load activity history');
      }
    });
  }

  activityHistoryNextPage(): void {
    this.activityHistoryPage++;
    this.loadActivityHistoryPage();
  }

  activityHistoryPrevPage(): void {
    if (this.activityHistoryPage > 0) {
      this.activityHistoryPage--;
      this.loadActivityHistoryPage();
    }
  }

  hasMoreActivityHistory(): boolean {
    const currentEnd = (this.activityHistoryPage + 1) * this.activityHistoryPageSize;
    return currentEnd < this.activityHistoryTotal;
  }

  // ============ CHAT FUNCTIONALITY ============
  initChat(): void {
    // Subscribe to chat observables
    this.chatSubscriptions.push(
      this.chatService.connected$.subscribe(connected => {
        this.chatConnected = connected;
      }),
      this.chatService.conversations$.subscribe(conversations => {
        this.chatConversations = conversations;
      }),
      this.chatService.messages$.subscribe(messages => {
        this.chatMessages = messages;
      }),
      this.chatService.unreadCount$.subscribe(count => {
        this.chatUnreadCount = count;
      }),
      this.chatService.typing$.subscribe(indicator => {
        if (indicator.conversationId === this.activeConversationId && indicator.isTyping) {
          this.chatTypingUser = indicator.userName;
          // Clear typing indicator after 3 seconds
          if (this.typingTimeout) clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.chatTypingUser = null;
          }, 3000);
        } else if (indicator.conversationId === this.activeConversationId && !indicator.isTyping) {
          this.chatTypingUser = null;
        }
      })
    );

    // Connect as dispatcher (ID 1 by default)
    this.chatService.connectAsDispatcher(1, 'Dispatcher');
  }

  toggleChatPanel(): void {
    this.showChatPanel = !this.showChatPanel;
    if (this.showChatPanel) {
      this.showNewConversationPicker = false;
    }
  }

  closeChatPanel(): void {
    this.showChatPanel = false;
    this.activeConversationId = null;
    this.activeConversationName = '';
    this.showNewConversationPicker = false;
  }

  openConversation(conversation: ChatConversation): void {
    this.activeConversationId = conversation.conversationId;
    this.activeConversationName = conversation.otherPartyName;
    this.showNewConversationPicker = false;

    // Load messages for this conversation
    this.chatService.loadMessages(conversation.conversationId).subscribe({
      next: (messages) => {
        this.chatMessages = messages;
      },
      error: (e) => console.error('Failed to load messages:', e)
    });

    // Mark as read
    this.chatService.setActiveConversation(conversation.conversationId);
  }

  backToConversations(): void {
    this.activeConversationId = null;
    this.activeConversationName = '';
    this.chatService.setActiveConversation(null);
  }

  showNewConversation(): void {
    this.showNewConversationPicker = true;
    this.chatSurveyorSearch = '';
  }

  cancelNewConversation(): void {
    this.showNewConversationPicker = false;
    this.chatSurveyorSearch = '';
  }

  startConversationWith(surveyor: Surveyor): void {
    this.chatService.startConversation(surveyor.id).subscribe({
      next: (result) => {
        this.activeConversationId = result.conversationId;
        this.activeConversationName = surveyor.display_name;
        this.showNewConversationPicker = false;
        this.chatMessages = [];
        this.chatService.setActiveConversation(result.conversationId);

        // Add conversation to list if not exists (for new conversations)
        if (!this.chatConversations.find(c => c.conversationId === result.conversationId)) {
          this.chatConversations.unshift({
            conversationId: result.conversationId,
            otherPartyId: surveyor.id,
            otherPartyName: surveyor.display_name,
            otherPartyType: 'SURVEYOR',
            lastMessage: '',
            lastMessageAt: new Date().toISOString(),
            unreadCount: 0
          });
        }
      },
      error: (e) => {
        console.error('Failed to start conversation:', e);
        this.showToast('error', 'Failed to start conversation');
      }
    });
  }

  getFilteredChatSurveyors(): Surveyor[] {
    if (!this.chatSurveyorSearch) {
      return this.allSurveyors;
    }
    const search = this.chatSurveyorSearch.toLowerCase();
    return this.allSurveyors.filter(s =>
      s.display_name.toLowerCase().includes(search) ||
      s.code.toLowerCase().includes(search)
    );
  }

  sendChatMessage(): void {
    if (!this.chatMessageInput.trim() || !this.activeConversationId) return;

    // Find the recipient from the active conversation
    const conversation = this.chatConversations.find(c => c.conversationId === this.activeConversationId);
    if (!conversation) return;

    this.chatService.sendMessage(
      conversation.otherPartyId,
      conversation.otherPartyType,
      this.chatMessageInput.trim()
    );

    this.chatMessageInput = '';
  }

  onChatInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChatMessage();
    }

    // Send typing indicator
    if (this.activeConversationId) {
      this.chatService.sendTypingIndicator(this.activeConversationId, true);
    }
  }

  getChatAvatarColor(name: string): string {
    return this.getAvatarColor(name);
  }

  getChatInitials(name: string): string {
    return this.getInitials(name);
  }

  formatChatTime(timestamp: string): string {
    return this.chatService.formatTimestamp(timestamp);
  }

  isChatMessageSent(message: ChatMessage): boolean {
    return message.senderType === 'DISPATCHER';
  }

  getChatMessageStatusIcon(message: ChatMessage): string {
    if (message.readAt) return 'done_all'; // Double check
    if (message.deliveredAt) return 'done_all';
    if (message.status === 'SENT') return 'done';
    return 'schedule';
  }
}
