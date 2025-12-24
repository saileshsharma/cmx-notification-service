import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Surveyor } from '../../../core/models';
import { SurveyorService, StorageService } from '../../../core/services';
import { SurveyorCardComponent } from '../surveyor-card/surveyor-card.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, SurveyorCardComponent],
  template: `
    <aside class="sidebar" [class.collapsed]="isCollapsed">
      <div class="sidebar-header">
        <button class="toggle-btn" (click)="toggleCollapse()">
          {{isCollapsed ? '&#9654;' : '&#9664;'}}
        </button>
        <span *ngIf="!isCollapsed">Surveyors</span>
      </div>

      <div class="sidebar-content" *ngIf="!isCollapsed">
        <!-- Stats Bar -->
        <div class="stats-bar">
          <div class="stat" [class.active]="selectedStatus === 'AVAILABLE'" (click)="filterByStatus('AVAILABLE')">
            <span class="stat-count available">{{stats.available}}</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="stat" [class.active]="selectedStatus === 'BUSY'" (click)="filterByStatus('BUSY')">
            <span class="stat-count busy">{{stats.busy}}</span>
            <span class="stat-label">Busy</span>
          </div>
          <div class="stat" [class.active]="selectedStatus === 'OFFLINE'" (click)="filterByStatus('OFFLINE')">
            <span class="stat-count offline">{{stats.offline}}</span>
            <span class="stat-label">Offline</span>
          </div>
        </div>

        <!-- Search -->
        <div class="search-container">
          <input
            type="text"
            class="search-input"
            placeholder="Search surveyors..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()">
          <button class="clear-search" *ngIf="searchQuery" (click)="clearSearch()">&#10005;</button>
        </div>

        <!-- Filter Pills -->
        <div class="filter-pills">
          <button
            class="pill"
            [class.active]="selectedType === 'INTERNAL'"
            (click)="filterByType('INTERNAL')">
            Internal
          </button>
          <button
            class="pill"
            [class.active]="selectedType === 'EXTERNAL'"
            (click)="filterByType('EXTERNAL')">
            External
          </button>
          <button
            class="pill clear"
            *ngIf="hasActiveFilters"
            (click)="clearFilters()">
            Clear
          </button>
        </div>

        <!-- Selection Actions -->
        <div class="selection-actions" *ngIf="enableMultiSelect">
          <button class="btn-sm" (click)="selectAll()">Select All</button>
          <button class="btn-sm" (click)="clearSelection()">Clear</button>
          <span class="selection-count" *ngIf="selectedIds.length > 0">
            {{selectedIds.length}} selected
          </span>
        </div>

        <!-- Surveyor List -->
        <div class="surveyor-list" *ngIf="!loading">
          <ng-container *ngIf="groupByType">
            <!-- Internal Group -->
            <div class="surveyor-group" *ngIf="internalSurveyors.length > 0">
              <div class="group-header" (click)="toggleGroup('internal')">
                <span class="group-icon">{{isGroupCollapsed('internal') ? '&#9654;' : '&#9660;'}}</span>
                <span class="group-name">Internal</span>
                <span class="group-count">{{internalSurveyors.length}}</span>
              </div>
              <div class="group-content" *ngIf="!isGroupCollapsed('internal')">
                <app-surveyor-card
                  *ngFor="let s of internalSurveyors"
                  [surveyor]="s"
                  [isSelected]="isSurveyorSelected(s.id)"
                  [searchQuery]="searchQuery"
                  (cardClick)="onSurveyorClick($event)">
                </app-surveyor-card>
              </div>
            </div>

            <!-- External Group -->
            <div class="surveyor-group" *ngIf="externalSurveyors.length > 0">
              <div class="group-header" (click)="toggleGroup('external')">
                <span class="group-icon">{{isGroupCollapsed('external') ? '&#9654;' : '&#9660;'}}</span>
                <span class="group-name">External</span>
                <span class="group-count">{{externalSurveyors.length}}</span>
              </div>
              <div class="group-content" *ngIf="!isGroupCollapsed('external')">
                <app-surveyor-card
                  *ngFor="let s of externalSurveyors"
                  [surveyor]="s"
                  [isSelected]="isSurveyorSelected(s.id)"
                  [searchQuery]="searchQuery"
                  (cardClick)="onSurveyorClick($event)">
                </app-surveyor-card>
              </div>
            </div>
          </ng-container>

          <!-- Ungrouped List -->
          <ng-container *ngIf="!groupByType">
            <app-surveyor-card
              *ngFor="let s of filteredSurveyors"
              [surveyor]="s"
              [isSelected]="isSurveyorSelected(s.id)"
              [searchQuery]="searchQuery"
              (cardClick)="onSurveyorClick($event)">
            </app-surveyor-card>
          </ng-container>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <span>Loading surveyors...</span>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!loading && filteredSurveyors.length === 0">
          <span>No surveyors found</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 320px;
      background: #f8f9fa;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
    }

    .sidebar.collapsed {
      width: 48px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      font-weight: 600;
    }

    .toggle-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .toggle-btn:hover {
      background: #e0e0e0;
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .stats-bar {
      display: flex;
      justify-content: space-between;
      background: white;
      border-radius: 8px;
      padding: 12px;
    }

    .stat {
      text-align: center;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .stat:hover, .stat.active {
      background: #f0f0f0;
    }

    .stat-count {
      display: block;
      font-size: 24px;
      font-weight: 700;
    }

    .stat-count.available { color: #28a745; }
    .stat-count.busy { color: #dc3545; }
    .stat-count.offline { color: #6c757d; }

    .stat-label {
      font-size: 11px;
      color: #666;
    }

    .search-container {
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px 36px 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .clear-search {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
    }

    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .pill {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 20px;
      background: white;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pill:hover {
      border-color: #667eea;
    }

    .pill.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .pill.clear {
      color: #dc3545;
      border-color: #dc3545;
    }

    .selection-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }

    .selection-count {
      font-size: 12px;
      color: #666;
    }

    .surveyor-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .surveyor-group {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      cursor: pointer;
      font-weight: 500;
    }

    .group-header:hover {
      background: #f5f5f5;
    }

    .group-icon {
      font-size: 10px;
      color: #666;
    }

    .group-count {
      margin-left: auto;
      background: #e0e0e0;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }

    .group-content {
      padding: 0 8px 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 24px;
      color: #666;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #ddd;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() enableMultiSelect = true;
  @Input() groupByType = true;

  @Output() surveyorSelect = new EventEmitter<Surveyor>();
  @Output() selectionChange = new EventEmitter<number[]>();

  surveyors: Surveyor[] = [];
  filteredSurveyors: Surveyor[] = [];
  selectedIds: number[] = [];
  searchQuery = '';
  selectedType: string | null = null;
  selectedStatus: string | null = null;
  loading = false;
  isCollapsed = false;

  stats = { available: 0, busy: 0, offline: 0 };

  private subscriptions: Subscription[] = [];
  private searchDebounceTimer: any;

  constructor(
    private surveyorService: SurveyorService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    // Subscribe to surveyors (for display)
    this.subscriptions.push(
      this.surveyorService.surveyors$.subscribe(surveyors => {
        this.surveyors = surveyors;
        this.applyFilters();
      })
    );

    // Subscribe to stats
    this.subscriptions.push(
      this.surveyorService.stats$.subscribe(stats => {
        this.stats = stats;
      })
    );

    // Subscribe to loading state
    this.subscriptions.push(
      this.surveyorService.loading$.subscribe(loading => {
        this.loading = loading;
      })
    );

    // Subscribe to sidebar collapsed state
    this.subscriptions.push(
      this.storageService.sidebarCollapsed$.subscribe(collapsed => {
        this.isCollapsed = collapsed;
      })
    );

    // Load initial data
    this.surveyorService.loadAllSurveyors().subscribe();
    this.surveyorService.loadSurveyors().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  get internalSurveyors(): Surveyor[] {
    return this.filteredSurveyors.filter(s => s.surveyor_type === 'INTERNAL');
  }

  get externalSurveyors(): Surveyor[] {
    return this.filteredSurveyors.filter(s => s.surveyor_type === 'EXTERNAL');
  }

  get hasActiveFilters(): boolean {
    return !!this.selectedType || !!this.selectedStatus || !!this.searchQuery;
  }

  toggleCollapse(): void {
    this.storageService.toggleSidebar();
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.applyFilters();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  filterByType(type: string): void {
    this.selectedType = this.selectedType === type ? null : type;
    this.loadSurveyors();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = this.selectedStatus === status ? null : status;
    this.loadSurveyors();
  }

  clearFilters(): void {
    this.selectedType = null;
    this.selectedStatus = null;
    this.searchQuery = '';
    this.loadSurveyors();
  }

  private loadSurveyors(): void {
    this.surveyorService.loadSurveyors(
      this.selectedType || undefined,
      this.selectedStatus || undefined
    ).subscribe();
  }

  private applyFilters(): void {
    this.filteredSurveyors = this.surveyorService.filterSurveyors(this.surveyors, this.searchQuery);
  }

  onSurveyorClick(surveyor: Surveyor): void {
    if (this.enableMultiSelect) {
      this.toggleSelection(surveyor.id);
    } else {
      this.surveyorSelect.emit(surveyor);
    }
  }

  toggleSelection(id: number): void {
    const index = this.selectedIds.indexOf(id);
    if (index > -1) {
      this.selectedIds.splice(index, 1);
    } else {
      this.selectedIds.push(id);
    }
    this.selectionChange.emit([...this.selectedIds]);
  }

  isSurveyorSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  selectAll(): void {
    this.selectedIds = this.filteredSurveyors.map(s => s.id);
    this.selectionChange.emit([...this.selectedIds]);
  }

  clearSelection(): void {
    this.selectedIds = [];
    this.selectionChange.emit([]);
  }

  toggleGroup(groupId: string): void {
    this.storageService.toggleGroupCollapsed(groupId);
  }

  isGroupCollapsed(groupId: string): boolean {
    return this.storageService.isGroupCollapsed(groupId);
  }
}
