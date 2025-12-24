import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import {
  Appointment,
  AppointmentState,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  CalendarEvent,
  WorkloadDay,
  UpcomingAlert,
  ConflictWarning
} from '../models';
import { API_BASE } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly apiBase = API_BASE;
  private readonly CACHE_KEY = 'appointmentCache';
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  // State management
  private eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private upcomingAlertsSubject = new BehaviorSubject<UpcomingAlert[]>([]);
  private conflictWarningsSubject = new BehaviorSubject<ConflictWarning[]>([]);

  // Public observables
  events$ = this.eventsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  upcomingAlerts$ = this.upcomingAlertsSubject.asObservable();
  conflictWarnings$ = this.conflictWarningsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadEvents(from: Date, to: Date, surveyorIds?: number[]): Observable<CalendarEvent[]> {
    this.loadingSubject.next(true);
    let url = `${this.apiBase}/availability?from=${from.toISOString()}&to=${to.toISOString()}`;

    if (surveyorIds && surveyorIds.length > 0) {
      url += `&surveyorIds=${surveyorIds.join(',')}`;
    }

    return this.http.get<Appointment[]>(url).pipe(
      map(rows => this.mapToCalendarEvents(rows)),
      tap(events => {
        this.eventsSubject.next(events);
        this.loadingSubject.next(false);
        this.cacheEvents(events);
      })
    );
  }

  private mapToCalendarEvents(appointments: Appointment[]): CalendarEvent[] {
    return appointments.map(a => ({
      id: String(a.id),
      title: a.title || a.state,
      start: a.start_time,
      end: a.end_time,
      color: this.getStateColor(a.state),
      extendedProps: {
        surveyorId: a.surveyor_id,
        state: a.state,
        description: a.description
      }
    }));
  }

  getStateColor(state: string): string {
    switch (state) {
      case 'AVAILABLE': return '#28a745';
      case 'BUSY': return '#dc3545';
      case 'OFFLINE': return '#6c757d';
      default: return '#3788d8';
    }
  }

  createAppointment(request: AppointmentCreateRequest): Observable<any> {
    return this.http.post(`${this.apiBase}/availability`, request);
  }

  updateAppointment(id: number, request: AppointmentUpdateRequest): Observable<any> {
    return this.http.put(`${this.apiBase}/availability/${id}`, request);
  }

  deleteAppointment(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}/availability/${id}`);
  }

  // Conflict detection
  checkConflict(surveyorId: number, start: Date, end: Date, excludeEventId?: string): boolean {
    const events = this.eventsSubject.value;
    return events.some(e => {
      if (excludeEventId && e.id === excludeEventId) return false;
      if (e.extendedProps?.surveyorId !== surveyorId) return false;
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      return (start < eEnd && end > eStart);
    });
  }

  detectAllConflicts(surveyorMap: Map<number, { display_name: string }>): ConflictWarning[] {
    const events = this.eventsSubject.value;
    const conflictMap = new Map<number, { conflicts: Appointment[]; name: string }>();

    events.forEach(event => {
      const surveyorId = event.extendedProps?.surveyorId;
      if (!surveyorId) return;

      const overlapping = events.filter(other => {
        if (other.id === event.id) return false;
        if (other.extendedProps?.surveyorId !== surveyorId) return false;
        const eStart = new Date(event.start);
        const eEnd = new Date(event.end);
        const oStart = new Date(other.start);
        const oEnd = new Date(other.end);
        return eStart < oEnd && eEnd > oStart;
      });

      if (overlapping.length > 0) {
        const surveyor = surveyorMap.get(surveyorId);
        if (!conflictMap.has(surveyorId)) {
          conflictMap.set(surveyorId, { conflicts: [], name: surveyor?.display_name || `Surveyor ${surveyorId}` });
        }
        // Add this event as a conflict if not already added
        const existing = conflictMap.get(surveyorId)!;
        if (!existing.conflicts.find(c => c.id === parseInt(event.id))) {
          existing.conflicts.push({
            id: parseInt(event.id),
            surveyor_id: surveyorId,
            start_time: event.start,
            end_time: event.end,
            state: (event.extendedProps?.state || 'BUSY') as AppointmentState
          });
        }
      }
    });

    const warnings: ConflictWarning[] = [];
    conflictMap.forEach((value, key) => {
      warnings.push({
        surveyorId: key,
        surveyorName: value.name,
        conflictCount: value.conflicts.length,
        conflicts: value.conflicts
      });
    });

    this.conflictWarningsSubject.next(warnings);
    return warnings;
  }

  // Upcoming alerts
  loadUpcomingAlerts(surveyorMap: Map<number, { display_name: string }>): Observable<UpcomingAlert[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    return this.http.get<Appointment[]>(`${this.apiBase}/availability?from=${tomorrow.toISOString()}&to=${dayAfter.toISOString()}`).pipe(
      map(rows => rows.map(r => {
        const surveyor = surveyorMap.get(r.surveyor_id);
        return {
          surveyorName: surveyor?.display_name || `Surveyor ${r.surveyor_id}`,
          state: r.state,
          startTime: new Date(r.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
      })),
      tap(alerts => this.upcomingAlertsSubject.next(alerts))
    );
  }

  // Workload data for heatmap
  loadWorkloadData(weekStart: Date, surveyors: { id: number }[]): Observable<Map<number, WorkloadDay[]>> {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return this.http.get<Appointment[]>(`${this.apiBase}/availability?from=${start.toISOString()}&to=${end.toISOString()}`).pipe(
      map(rows => {
        const workloadMap = new Map<number, Map<string, number>>();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        rows.forEach(r => {
          const dateKey = new Date(r.start_time).toISOString().split('T')[0];
          if (!workloadMap.has(r.surveyor_id)) {
            workloadMap.set(r.surveyor_id, new Map());
          }
          const surveyorMap = workloadMap.get(r.surveyor_id)!;
          surveyorMap.set(dateKey, (surveyorMap.get(dateKey) || 0) + 1);
        });

        const result = new Map<number, WorkloadDay[]>();
        surveyors.forEach(s => {
          const days: WorkloadDay[] = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            const dateKey = date.toISOString().split('T')[0];
            const count = workloadMap.get(s.id)?.get(dateKey) || 0;
            days.push({ date: dateKey, dayName: dayNames[i], count });
          }
          result.set(s.id, days);
        });

        return result;
      })
    );
  }

  // Cache management
  private cacheEvents(events: CalendarEvent[]): void {
    try {
      const cacheData = {
        events,
        timestamp: Date.now()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Failed to cache events:', e);
    }
  }

  getCachedEvents(): CalendarEvent[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { events, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.CACHE_EXPIRY_MS) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }
      return events;
    } catch (e) {
      return null;
    }
  }

  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  // Helper methods
  getHeatmapColor(count: number): string {
    if (count === 0) return '#e8f5e9';
    if (count === 1) return '#c8e6c9';
    if (count === 2) return '#a5d6a7';
    if (count === 3) return '#81c784';
    if (count >= 4) return '#66bb6a';
    return '#e8f5e9';
  }

  calculateDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0 && diffMins > 0) {
      return `${diffHours}h ${diffMins}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return `${diffMins}m`;
    }
  }
}
