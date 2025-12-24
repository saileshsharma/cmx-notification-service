import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Surveyor, SurveyorWorkload } from '../models';
import { API_BASE } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class SurveyorService {
  private readonly apiBase = API_BASE;

  // State management
  private surveyorsSubject = new BehaviorSubject<Surveyor[]>([]);
  private allSurveyorsSubject = new BehaviorSubject<Surveyor[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private surveyorMapSubject = new BehaviorSubject<Map<number, Surveyor>>(new Map());

  // Public observables
  surveyors$ = this.surveyorsSubject.asObservable();
  allSurveyors$ = this.allSurveyorsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  surveyorMap$ = this.surveyorMapSubject.asObservable();

  // Stats
  private statsSubject = new BehaviorSubject<{ available: number; busy: number; offline: number }>({
    available: 0,
    busy: 0,
    offline: 0
  });
  stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadAllSurveyors(): Observable<Surveyor[]> {
    return this.http.get<Surveyor[]>(`${this.apiBase}/surveyors`).pipe(
      tap(surveyors => {
        this.allSurveyorsSubject.next(surveyors);
        const map = new Map<number, Surveyor>();
        surveyors.forEach(s => map.set(s.id, s));
        this.surveyorMapSubject.next(map);
        this.calculateStats(surveyors);
      })
    );
  }

  loadSurveyors(type?: string, currentStatus?: string): Observable<Surveyor[]> {
    this.loadingSubject.next(true);
    let params = new HttpParams();
    if (type && type !== 'ALL') {
      params = params.set('type', type);
    }
    if (currentStatus && currentStatus !== 'ALL') {
      params = params.set('currentStatus', currentStatus);
    }

    return this.http.get<Surveyor[]>(`${this.apiBase}/surveyors`, { params }).pipe(
      tap(surveyors => {
        this.surveyorsSubject.next(surveyors);
        this.loadingSubject.next(false);
      })
    );
  }

  getSurveyor(id: number): Surveyor | undefined {
    return this.surveyorMapSubject.value.get(id);
  }

  getSurveyorName(id: number): string {
    const surveyor = this.getSurveyor(id);
    return surveyor?.display_name || `Surveyor ${id}`;
  }

  private calculateStats(surveyors: Surveyor[]): void {
    const stats = {
      available: surveyors.filter(s => s.current_status === 'AVAILABLE').length,
      busy: surveyors.filter(s => s.current_status === 'BUSY').length,
      offline: surveyors.filter(s => s.current_status === 'OFFLINE').length
    };
    this.statsSubject.next(stats);
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
