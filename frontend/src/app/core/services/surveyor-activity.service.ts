import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { API_BASE } from './api-config';

export interface SurveyorActivity {
  id: number;
  surveyorId: number;
  activityType: string;
  previousValue: string | null;
  newValue: string;
  appointmentId: number | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: string;
  // Enriched fields
  surveyorName?: string;
  surveyorCode?: string;
  appointmentTitle?: string;
}

export interface SurveyorActivityEvent {
  type: string;
  surveyorId: number;
  surveyorName: string;
  surveyorCode: string;
  activityType: string;
  newValue: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  appointmentId?: number;
  appointmentTitle?: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SurveyorActivityService implements OnDestroy {
  private readonly apiBase = API_BASE;

  // Activity log state
  private activitiesSubject = new BehaviorSubject<SurveyorActivity[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private connectedSubject = new BehaviorSubject<boolean>(false);

  activities$ = this.activitiesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  connected$ = this.connectedSubject.asObservable();

  // SSE event stream
  private liveEventSubject = new Subject<SurveyorActivityEvent>();
  liveEvent$ = this.liveEventSubject.asObservable();

  // SSE connection
  private eventSource: EventSource | null = null;
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly RECONNECT_DELAY = 3000;

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Connect to SSE dispatcher stream for real-time updates
   */
  connect(): void {
    if (this.eventSource) {
      return; // Already connected
    }

    try {
      this.eventSource = new EventSource(`${this.apiBase}/dispatcher/stream`);

      this.eventSource.onopen = () => {
        this.connectedSubject.next(true);
        this.reconnectAttempts = 0;
      };

      this.eventSource.addEventListener('connected', (_event: MessageEvent) => {
        // Connection confirmed
      });

      this.eventSource.addEventListener('surveyor-activity', (event: MessageEvent) => {
        try {
          const data: SurveyorActivityEvent = JSON.parse(event.data);
          this.liveEventSubject.next(data);

          // Add to the activities list
          const newActivity: SurveyorActivity = {
            id: Date.now(), // Temporary ID
            surveyorId: data.surveyorId,
            activityType: data.activityType,
            previousValue: null,
            newValue: data.newValue,
            appointmentId: data.appointmentId || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            notes: null,
            createdAt: data.timestamp,
            surveyorName: data.surveyorName,
            surveyorCode: data.surveyorCode,
            appointmentTitle: data.appointmentTitle
          };

          const current = this.activitiesSubject.value;
          this.activitiesSubject.next([newActivity, ...current.slice(0, 99)]);
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      });

      this.eventSource.onerror = () => {
        console.error('SSE connection error');
        this.connectedSubject.next(false);
        this.scheduleReconnect();
      };

    } catch (e) {
      console.error('Failed to create EventSource:', e);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.connectedSubject.next(false);
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnect attempts reached');
      return;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.RECONNECT_DELAY * Math.min(this.reconnectAttempts + 1, 5));
  }

  /**
   * Load activity log from backend (for modal/history view - does NOT update main subject)
   */
  loadActivities(
    surveyorId?: number,
    activityType?: string,
    hoursBack: number = 24,
    limit: number = 100,
    offset: number = 0
  ): Observable<SurveyorActivity[]> {
    let params = new HttpParams()
      .set('hoursBack', hoursBack.toString())
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (surveyorId) {
      params = params.set('surveyorId', surveyorId.toString());
    }
    if (activityType) {
      params = params.set('activityType', activityType);
    }

    return this.http.get<SurveyorActivity[]>(`${this.apiBase}/activity`, { params });
  }

  /**
   * Load recent activities
   */
  loadRecentActivities(hours: number = 4, limit: number = 50): Observable<SurveyorActivity[]> {
    this.loadingSubject.next(true);

    const params = new HttpParams()
      .set('hours', hours.toString())
      .set('limit', limit.toString());

    return this.http.get<SurveyorActivity[]>(`${this.apiBase}/activity/recent`, { params }).pipe(
      tap(activities => {
        this.activitiesSubject.next(activities);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Load activities for a specific appointment
   */
  loadAppointmentActivities(appointmentId: number): Observable<SurveyorActivity[]> {
    return this.http.get<SurveyorActivity[]>(`${this.apiBase}/activity/appointment/${appointmentId}`);
  }

  /**
   * Get activity type display info
   */
  getActivityTypeInfo(activityType: string, value: string): { icon: string; color: string; label: string } {
    switch (activityType) {
      case 'STATUS_CHANGE':
        return this.getStatusInfo(value);
      case 'JOB_UPDATE':
        return this.getJobUpdateInfo(value);
      case 'LOGIN':
        return { icon: 'login', color: '#4caf50', label: 'Logged In' };
      case 'LOGOUT':
        return { icon: 'logout', color: '#9e9e9e', label: 'Logged Out' };
      default:
        return { icon: 'info', color: '#2196f3', label: activityType };
    }
  }

  private getStatusInfo(status: string): { icon: string; color: string; label: string } {
    switch (status) {
      case 'AVAILABLE':
        return { icon: 'check_circle', color: '#4caf50', label: 'Available' };
      case 'BUSY':
        return { icon: 'do_not_disturb', color: '#e91e63', label: 'Busy' };
      case 'OFFLINE':
        return { icon: 'cloud_off', color: '#9e9e9e', label: 'Offline' };
      default:
        return { icon: 'help', color: '#2196f3', label: status };
    }
  }

  private getJobUpdateInfo(state: string): { icon: string; color: string; label: string } {
    switch (state) {
      case 'ON_WAY':
        return { icon: 'directions_car', color: '#2196f3', label: 'On the Way' };
      case 'ARRIVED':
        return { icon: 'location_on', color: '#4caf50', label: 'Arrived' };
      case 'INSPECTING':
        return { icon: 'search', color: '#ff9800', label: 'Inspecting' };
      case 'COMPLETED':
        return { icon: 'task_alt', color: '#4caf50', label: 'Completed' };
      default:
        return { icon: 'work', color: '#9c27b0', label: state };
    }
  }

  /**
   * Format timestamp for display (relative time)
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return 'Just now';
    }
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins}m ago`;
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /**
   * Format timestamp as full date and time
   */
  formatFullDateTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}
