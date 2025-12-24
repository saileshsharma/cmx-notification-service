import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SurveyorNote } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly NOTES_KEY = 'surveyorNotes';
  private readonly COLORS_KEY = 'surveyorColors';
  private readonly COLLAPSED_GROUPS_KEY = 'collapsedGroups';
  private readonly SIDEBAR_STATE_KEY = 'sidebarCollapsed';
  private readonly VIEW_PREFERENCE_KEY = 'currentView';

  // Notes
  private notesSubject = new BehaviorSubject<Map<number, SurveyorNote>>(new Map());
  notes$ = this.notesSubject.asObservable();

  // Colors
  private colorsSubject = new BehaviorSubject<Map<number, string>>(new Map());
  colors$ = this.colorsSubject.asObservable();

  // Collapsed groups
  private collapsedGroupsSubject = new BehaviorSubject<Set<string>>(new Set());
  collapsedGroups$ = this.collapsedGroupsSubject.asObservable();

  // Sidebar state
  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);
  sidebarCollapsed$ = this.sidebarCollapsedSubject.asObservable();

  constructor() {
    this.loadAllFromStorage();
  }

  private loadAllFromStorage(): void {
    this.loadNotes();
    this.loadColors();
    this.loadCollapsedGroups();
    this.loadSidebarState();
  }

  // Notes methods
  private loadNotes(): void {
    try {
      const saved = localStorage.getItem(this.NOTES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const notesMap = new Map<number, SurveyorNote>();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          notesMap.set(parseInt(key), {
            ...value,
            updatedAt: new Date(value.updatedAt)
          });
        });
        this.notesSubject.next(notesMap);
      }
    } catch (e) {
      console.warn('Failed to load notes:', e);
    }
  }

  saveNote(surveyorId: number, note: string): void {
    const notes = this.notesSubject.value;
    const noteEntry: SurveyorNote = {
      surveyorId,
      note,
      updatedAt: new Date()
    };
    notes.set(surveyorId, noteEntry);
    this.notesSubject.next(new Map(notes));
    this.persistNotes();
  }

  getNote(surveyorId: number): SurveyorNote | undefined {
    return this.notesSubject.value.get(surveyorId);
  }

  deleteNote(surveyorId: number): void {
    const notes = this.notesSubject.value;
    notes.delete(surveyorId);
    this.notesSubject.next(new Map(notes));
    this.persistNotes();
  }

  private persistNotes(): void {
    try {
      const notes = this.notesSubject.value;
      const obj: Record<string, SurveyorNote> = {};
      notes.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(this.NOTES_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save notes:', e);
    }
  }

  // Colors methods
  private loadColors(): void {
    try {
      const saved = localStorage.getItem(this.COLORS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const colorsMap = new Map<number, string>();
        Object.entries(parsed).forEach(([key, value]: [string, any]) => {
          colorsMap.set(parseInt(key), value);
        });
        this.colorsSubject.next(colorsMap);
      }
    } catch (e) {
      console.warn('Failed to load colors:', e);
    }
  }

  saveColor(surveyorId: number, color: string): void {
    const colors = this.colorsSubject.value;
    colors.set(surveyorId, color);
    this.colorsSubject.next(new Map(colors));
    this.persistColors();
  }

  getColor(surveyorId: number): string | undefined {
    return this.colorsSubject.value.get(surveyorId);
  }

  deleteColor(surveyorId: number): void {
    const colors = this.colorsSubject.value;
    colors.delete(surveyorId);
    this.colorsSubject.next(new Map(colors));
    this.persistColors();
  }

  private persistColors(): void {
    try {
      const colors = this.colorsSubject.value;
      const obj: Record<string, string> = {};
      colors.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(this.COLORS_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save colors:', e);
    }
  }

  // Collapsed groups methods
  private loadCollapsedGroups(): void {
    try {
      const saved = localStorage.getItem(this.COLLAPSED_GROUPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.collapsedGroupsSubject.next(new Set(parsed));
      }
    } catch (e) {
      console.warn('Failed to load collapsed groups:', e);
    }
  }

  toggleGroupCollapsed(groupId: string): void {
    const groups = this.collapsedGroupsSubject.value;
    if (groups.has(groupId)) {
      groups.delete(groupId);
    } else {
      groups.add(groupId);
    }
    this.collapsedGroupsSubject.next(new Set(groups));
    this.persistCollapsedGroups();
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroupsSubject.value.has(groupId);
  }

  private persistCollapsedGroups(): void {
    try {
      const groups = Array.from(this.collapsedGroupsSubject.value);
      localStorage.setItem(this.COLLAPSED_GROUPS_KEY, JSON.stringify(groups));
    } catch (e) {
      console.warn('Failed to save collapsed groups:', e);
    }
  }

  // Sidebar state
  private loadSidebarState(): void {
    try {
      const saved = localStorage.getItem(this.SIDEBAR_STATE_KEY);
      if (saved) {
        this.sidebarCollapsedSubject.next(saved === 'true');
      }
    } catch (e) {
      console.warn('Failed to load sidebar state:', e);
    }
  }

  toggleSidebar(): boolean {
    const newState = !this.sidebarCollapsedSubject.value;
    this.sidebarCollapsedSubject.next(newState);
    localStorage.setItem(this.SIDEBAR_STATE_KEY, String(newState));
    return newState;
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedSubject.next(collapsed);
    localStorage.setItem(this.SIDEBAR_STATE_KEY, String(collapsed));
  }

  // View preference
  getViewPreference(): string {
    return localStorage.getItem(this.VIEW_PREFERENCE_KEY) || 'calendar';
  }

  setViewPreference(view: string): void {
    localStorage.setItem(this.VIEW_PREFERENCE_KEY, view);
  }

  // Generic storage methods
  setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to save ${key}:`, e);
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
    this.notesSubject.next(new Map());
    this.colorsSubject.next(new Map());
    this.collapsedGroupsSubject.next(new Set());
    this.sidebarCollapsedSubject.next(false);
  }
}
