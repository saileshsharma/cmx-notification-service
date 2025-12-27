import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, tap } from 'rxjs';
import { Surveyor, SurveyorWorkload } from '../models';
import { API_BASE } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class SurveyorService {
  private readonly apiBase = API_BASE;

  // Angular Signals for state management
  private surveyorsSignal = signal<Surveyor[]>([]);
  private allSurveyorsSignal = signal<Surveyor[]>([]);
  private loadingSignal = signal<boolean>(false);
  private surveyorMapSignal = signal<Map<number, Surveyor>>(new Map());

  // Public signals (readonly)
  readonly surveyors = this.surveyorsSignal.asReadonly();
  readonly allSurveyors = this.allSurveyorsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly surveyorMap = this.surveyorMapSignal.asReadonly();

  // Computed signals for derived state
  readonly stats = computed(() => {
    const surveyors = this.allSurveyorsSignal();
    return {
      available: surveyors.filter(s => s.current_status === 'AVAILABLE').length,
      busy: surveyors.filter(s => s.current_status === 'BUSY').length,
      offline: surveyors.filter(s => s.current_status === 'OFFLINE').length
    };
  });

  readonly internalSurveyors = computed(() =>
    this.surveyorsSignal().filter(s => s.surveyor_type === 'INTERNAL')
  );

  readonly externalSurveyors = computed(() =>
    this.surveyorsSignal().filter(s => s.surveyor_type === 'EXTERNAL')
  );

  // Observable bridges for backward compatibility with RxJS consumers
  surveyors$ = toObservable(this.surveyors);
  allSurveyors$ = toObservable(this.allSurveyors);
  loading$ = toObservable(this.loading);
  surveyorMap$ = toObservable(this.surveyorMap);
  stats$ = toObservable(this.stats);

  constructor(private http: HttpClient) {}

  loadAllSurveyors(): Observable<Surveyor[]> {
    return this.http.get<Surveyor[]>(`${this.apiBase}/surveyors`).pipe(
      tap(surveyors => {
        this.allSurveyorsSignal.set(surveyors);
        const map = new Map<number, Surveyor>();
        surveyors.forEach(s => map.set(s.id, s));
        this.surveyorMapSignal.set(map);
        // Stats are now computed automatically via computed signal
      })
    );
  }

  loadSurveyors(type?: string, currentStatus?: string): Observable<Surveyor[]> {
    this.loadingSignal.set(true);
    let params = new HttpParams();
    if (type && type !== 'ALL') {
      params = params.set('type', type);
    }
    if (currentStatus && currentStatus !== 'ALL') {
      params = params.set('currentStatus', currentStatus);
    }

    return this.http.get<Surveyor[]>(`${this.apiBase}/surveyors`, { params }).pipe(
      tap(surveyors => {
        this.surveyorsSignal.set(surveyors);
        this.loadingSignal.set(false);
      })
    );
  }

  getSurveyor(id: number): Surveyor | undefined {
    return this.surveyorMapSignal().get(id);
  }

  getSurveyorName(id: number): string {
    const surveyor = this.getSurveyor(id);
    return surveyor?.display_name || `Surveyor ${id}`;
  }

  // Update a single surveyor in the state (for real-time updates)
  updateSurveyor(updatedSurveyor: Surveyor): void {
    // Update in all surveyors
    this.allSurveyorsSignal.update(surveyors =>
      surveyors.map(s => s.id === updatedSurveyor.id ? updatedSurveyor : s)
    );

    // Update in filtered surveyors
    this.surveyorsSignal.update(surveyors =>
      surveyors.map(s => s.id === updatedSurveyor.id ? updatedSurveyor : s)
    );

    // Update in map
    this.surveyorMapSignal.update(map => {
      const newMap = new Map(map);
      newMap.set(updatedSurveyor.id, updatedSurveyor);
      return newMap;
    });
  }

  // Utility methods
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

  getAvatarUrl(name: string, size: number = 40): string {
    const seed = encodeURIComponent(name);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&size=${size}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'AVAILABLE': return '#28a745';
      case 'BUSY': return '#dc3545';
      case 'OFF_DUTY': return '#6c757d';
      case 'ON_LEAVE': return '#fd7e14';
      case 'OFFLINE': return '#6c757d';
      default: return '#3788d8';
    }
  }

  filterSurveyors(surveyors: Surveyor[], searchQuery: string): Surveyor[] {
    if (!searchQuery.trim()) {
      return surveyors;
    }
    const query = searchQuery.toLowerCase();
    return surveyors.filter(s =>
      s.display_name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query)
    );
  }

  // Workload methods
  loadWorkloadBalance(): Observable<SurveyorWorkload[]> {
    return this.http.get<SurveyorWorkload[]>(`${this.apiBase}/surveyors/workload`);
  }
}
