import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';

// API Configuration
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = isLocal
  ? 'http://localhost:8080/api'
  : 'https://cmx-notification-be-production.up.railway.app/api';

interface FeatureFlag {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  rolloutPercentage: number;
  variantName?: string;
  variantPayload?: string;
  createdAt: string;
  updatedAt: string;
  toggling?: boolean;
}

interface FlagCategory {
  name: string;
  prefix: string;
  icon: string;
  flags: FeatureFlag[];
  expanded: boolean;
  platform: 'frontend' | 'mobile' | 'shared';
}

interface AuditLogEntry {
  id: number;
  flagName: string;
  action: 'enabled' | 'disabled' | 'created' | 'updated' | 'deleted';
  previousValue?: boolean;
  newValue?: boolean;
  timestamp: Date;
  user: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  apiLatency: number;
  lastCheck: Date;
  uptime: string;
}

type PlatformTab = 'all' | 'frontend' | 'mobile' | 'shared';
type ViewMode = 'grid' | 'list' | 'compact';
type SortBy = 'name' | 'updated' | 'status' | 'environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="admin-container" [class.dark-mode]="darkMode">
      <!-- Top Navigation Bar -->
      <nav class="top-nav">
        <div class="nav-brand">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">Dispatcher Admin</span>
            <span class="brand-version">Enterprise v2.0</span>
          </div>
        </div>

        <div class="nav-center">
          <div class="search-global">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="filterFlags()"
              placeholder="Search flags, categories, or descriptions..."
              class="search-input-global">
            <kbd class="search-shortcut">/</kbd>
          </div>
        </div>

        <div class="nav-actions">
          <div class="health-indicator" [class]="systemHealth.status" [title]="'API: ' + systemHealth.apiLatency + 'ms'">
            <span class="health-dot"></span>
            <span class="health-text">{{ systemHealth.status | titlecase }}</span>
          </div>

          <button class="nav-btn" (click)="toggleDarkMode()" [title]="darkMode ? 'Light Mode' : 'Dark Mode'">
            <svg *ngIf="!darkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <svg *ngIf="darkMode" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>

          <button class="nav-btn" (click)="showAuditLog = !showAuditLog" [class.active]="showAuditLog" title="Audit Log">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span class="badge" *ngIf="auditLog.length > 0">{{ auditLog.length }}</span>
          </button>

          <button class="nav-btn" (click)="refresh()" [disabled]="loading" title="Refresh">
            <svg [class.spinning]="loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          <div class="user-menu">
            <div class="user-avatar">A</div>
            <span class="user-name">Admin</span>
          </div>
        </div>
      </nav>

      <!-- Main Layout -->
      <div class="main-layout">
        <!-- Sidebar -->
        <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
          <div class="sidebar-header">
            <h3 *ngIf="!sidebarCollapsed">Navigation</h3>
            <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline [attr.points]="sidebarCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/>
              </svg>
            </button>
          </div>

          <div class="sidebar-section">
            <div class="section-title" *ngIf="!sidebarCollapsed">Platforms</div>
            <div class="nav-items">
              <button
                *ngFor="let tab of platformTabs"
                class="nav-item"
                [class.active]="activeTab === tab.id"
                (click)="setActiveTab(tab.id)"
                [title]="tab.label">
                <span class="nav-icon" [innerHTML]="tab.icon"></span>
                <span class="nav-label" *ngIf="!sidebarCollapsed">{{ tab.label }}</span>
                <span class="nav-count" *ngIf="!sidebarCollapsed">{{ tab.count }}</span>
              </button>
            </div>
          </div>

          <div class="sidebar-section" *ngIf="!sidebarCollapsed">
            <div class="section-title">Quick Filters</div>
            <div class="filter-chips">
              <button
                class="chip"
                [class.active]="quickFilter === 'enabled'"
                (click)="setQuickFilter('enabled')">
                <span class="chip-dot enabled"></span> Enabled
              </button>
              <button
                class="chip"
                [class.active]="quickFilter === 'disabled'"
                (click)="setQuickFilter('disabled')">
                <span class="chip-dot disabled"></span> Disabled
              </button>
              <button
                class="chip"
                [class.active]="quickFilter === 'production'"
                (click)="setQuickFilter('production')">
                Production
              </button>
              <button
                class="chip"
                [class.active]="quickFilter === 'development'"
                (click)="setQuickFilter('development')">
                Development
              </button>
            </div>
          </div>

          <div class="sidebar-section sidebar-stats" *ngIf="!sidebarCollapsed">
            <div class="section-title">Statistics</div>
            <div class="stat-item">
              <span class="stat-label">Total Flags</span>
              <span class="stat-value">{{ totalFlags }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Enabled</span>
              <span class="stat-value enabled">{{ enabledCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Disabled</span>
              <span class="stat-value disabled">{{ disabledCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Last Sync</span>
              <span class="stat-value">{{ getRelativeTime(lastSyncTime) }}</span>
            </div>
          </div>

          <div class="sidebar-footer" *ngIf="!sidebarCollapsed">
            <a href="https://cmx-notification-fe-production.up.railway.app" target="_blank" class="external-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open Frontend App
            </a>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <!-- Toolbar -->
          <div class="toolbar">
            <div class="toolbar-left">
              <h1 class="page-title">
                {{ getActiveTabLabel() }}
                <span class="title-count">({{ getVisibleFlagsCount() }} flags)</span>
              </h1>
            </div>

            <div class="toolbar-center">
              <div class="view-toggle">
                <button
                  *ngFor="let mode of viewModes"
                  class="view-btn"
                  [class.active]="viewMode === mode.id"
                  (click)="viewMode = mode.id"
                  [title]="mode.label">
                  <span [innerHTML]="mode.icon"></span>
                </button>
              </div>

              <div class="sort-dropdown">
                <select [(ngModel)]="sortBy" (ngModelChange)="sortFlags()">
                  <option value="name">Sort by Name</option>
                  <option value="updated">Sort by Updated</option>
                  <option value="status">Sort by Status</option>
                  <option value="environment">Sort by Environment</option>
                </select>
              </div>
            </div>

            <div class="toolbar-right">
              <div class="bulk-actions" *ngIf="selectedFlags.length > 0">
                <span class="selected-count">{{ selectedFlags.length }} selected</span>
                <button class="bulk-btn enable" (click)="bulkEnable()">Enable All</button>
                <button class="bulk-btn disable" (click)="bulkDisable()">Disable All</button>
                <button class="bulk-btn clear" (click)="clearSelection()">Clear</button>
              </div>

              <button class="action-btn primary" (click)="showCreateModal = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Flag
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div class="loading-overlay" *ngIf="loading && flags.length === 0">
            <div class="loader">
              <div class="loader-ring"></div>
              <div class="loader-ring"></div>
              <div class="loader-ring"></div>
            </div>
            <p>Loading feature flags...</p>
          </div>

          <!-- Error State -->
          <div class="error-state" *ngIf="error && !loading">
            <div class="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Connection Error</h3>
            <p>{{ error }}</p>
            <button class="action-btn primary" (click)="loadFlags()">Retry Connection</button>
          </div>

          <!-- Content -->
          <div class="content-area" *ngIf="!loading || flags.length > 0">
            <!-- Grid View -->
            <div class="flags-grid" *ngIf="viewMode === 'grid'" [class.loading]="loading">
              <div
                *ngFor="let category of filteredCategories"
                class="category-card"
                [class.expanded]="category.expanded">
                <div class="category-header" (click)="category.expanded = !category.expanded">
                  <div class="category-info">
                    <span class="category-icon">{{ category.icon }}</span>
                    <div class="category-text">
                      <h3>{{ category.name }}</h3>
                      <span class="category-meta">
                        <span class="platform-badge" [class]="category.platform">{{ category.platform }}</span>
                        <span class="flag-count">{{ getEnabledCount(category) }}/{{ category.flags.length }} enabled</span>
                      </span>
                    </div>
                  </div>
                  <div class="category-actions">
                    <div class="mini-progress">
                      <div class="progress-bar" [style.width.%]="(getEnabledCount(category) / category.flags.length) * 100"></div>
                    </div>
                    <svg class="expand-icon" [class.rotated]="category.expanded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                <div class="category-content" *ngIf="category.expanded">
                  <div
                    *ngFor="let flag of category.flags"
                    class="flag-card"
                    [class.enabled]="flag.enabled"
                    [class.disabled]="!flag.enabled"
                    [class.selected]="isSelected(flag)"
                    [class.toggling]="flag.toggling">
                    <div class="flag-select" (click)="toggleSelection(flag); $event.stopPropagation()">
                      <input type="checkbox" [checked]="isSelected(flag)">
                    </div>
                    <div class="flag-content" (click)="openFlagDetail(flag)">
                      <div class="flag-header">
                        <span class="flag-name">{{ getFlagDisplayName(flag.name) }}</span>
                        <div class="flag-badges">
                          <span class="env-badge" [class]="flag.environment">{{ flag.environment }}</span>
                          <span class="rollout-badge" *ngIf="flag.rolloutPercentage < 100">{{ flag.rolloutPercentage }}%</span>
                        </div>
                      </div>
                      <p class="flag-description">{{ flag.description }}</p>
                      <div class="flag-footer">
                        <span class="flag-updated" title="{{ flag.updatedAt }}">
                          Updated {{ getRelativeTime(flag.updatedAt) }}
                        </span>
                      </div>
                    </div>
                    <div class="flag-toggle">
                      <label class="toggle-switch" (click)="$event.stopPropagation()">
                        <input
                          type="checkbox"
                          [checked]="flag.enabled"
                          (change)="toggleFlag(flag)"
                          [disabled]="flag.toggling">
                        <span class="toggle-slider">
                          <span class="toggle-icon on">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </span>
                          <span class="toggle-icon off">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- List View -->
            <div class="flags-list" *ngIf="viewMode === 'list'" [class.loading]="loading">
              <table class="flags-table">
                <thead>
                  <tr>
                    <th class="col-select">
                      <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allSelected">
                    </th>
                    <th class="col-status">Status</th>
                    <th class="col-name">Name</th>
                    <th class="col-description">Description</th>
                    <th class="col-env">Environment</th>
                    <th class="col-platform">Platform</th>
                    <th class="col-updated">Updated</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let category of filteredCategories">
                    <tr *ngFor="let flag of category.flags" [class.selected]="isSelected(flag)">
                      <td class="col-select">
                        <input type="checkbox" [checked]="isSelected(flag)" (change)="toggleSelection(flag)">
                      </td>
                      <td class="col-status">
                        <span class="status-indicator" [class.enabled]="flag.enabled" [class.disabled]="!flag.enabled">
                          {{ flag.enabled ? 'ON' : 'OFF' }}
                        </span>
                      </td>
                      <td class="col-name">
                        <div class="name-cell">
                          <span class="flag-icon">{{ category.icon }}</span>
                          <span class="flag-name">{{ getFlagDisplayName(flag.name) }}</span>
                        </div>
                      </td>
                      <td class="col-description">{{ flag.description }}</td>
                      <td class="col-env">
                        <span class="env-badge" [class]="flag.environment">{{ flag.environment }}</span>
                      </td>
                      <td class="col-platform">
                        <span class="platform-badge" [class]="category.platform">{{ category.platform }}</span>
                      </td>
                      <td class="col-updated">{{ getRelativeTime(flag.updatedAt) }}</td>
                      <td class="col-actions">
                        <label class="toggle-switch small">
                          <input type="checkbox" [checked]="flag.enabled" (change)="toggleFlag(flag)" [disabled]="flag.toggling">
                          <span class="toggle-slider"></span>
                        </label>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>

            <!-- Compact View -->
            <div class="flags-compact" *ngIf="viewMode === 'compact'" [class.loading]="loading">
              <div class="compact-grid">
                <div
                  *ngFor="let flag of getAllFlags()"
                  class="compact-card"
                  [class.enabled]="flag.enabled"
                  (click)="toggleFlag(flag)">
                  <span class="compact-name">{{ getFlagDisplayName(flag.name) }}</span>
                  <span class="compact-status">{{ flag.enabled ? 'ON' : 'OFF' }}</span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div class="empty-state" *ngIf="filteredCategories.length === 0 && !loading">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3>No flags found</h3>
              <p *ngIf="searchQuery">No results for "{{ searchQuery }}"</p>
              <p *ngIf="!searchQuery">No feature flags match your current filters</p>
              <button class="action-btn secondary" (click)="clearFilters()">Clear Filters</button>
            </div>
          </div>
        </main>

        <!-- Audit Log Panel -->
        <aside class="audit-panel" *ngIf="showAuditLog">
          <div class="panel-header">
            <h3>Activity Log</h3>
            <button class="close-btn" (click)="showAuditLog = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="panel-content">
            <div class="audit-list" *ngIf="auditLog.length > 0">
              <div *ngFor="let entry of auditLog" class="audit-entry" [class]="entry.action">
                <div class="audit-icon">
                  <svg *ngIf="entry.action === 'enabled'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <svg *ngIf="entry.action === 'disabled'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <div class="audit-content">
                  <div class="audit-title">
                    <strong>{{ entry.flagName }}</strong>
                    <span class="audit-action">{{ entry.action }}</span>
                  </div>
                  <div class="audit-meta">
                    <span class="audit-user">{{ entry.user }}</span>
                    <span class="audit-time">{{ getRelativeTime(entry.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="audit-empty" *ngIf="auditLog.length === 0">
              <p>No recent activity</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- Flag Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedFlag" (click)="closeFlagDetail()">
        <div class="modal flag-detail-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">
              <h2>{{ getFlagDisplayName(selectedFlag.name) }}</h2>
              <span class="modal-subtitle">{{ selectedFlag.name }}</span>
            </div>
            <button class="close-btn" (click)="closeFlagDetail()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-section">
              <label>Status</label>
              <div class="status-toggle-large">
                <label class="toggle-switch large">
                  <input type="checkbox" [checked]="selectedFlag.enabled" (change)="toggleFlag(selectedFlag)">
                  <span class="toggle-slider"></span>
                </label>
                <span class="status-text" [class.enabled]="selectedFlag.enabled">
                  {{ selectedFlag.enabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>
            <div class="detail-section">
              <label>Description</label>
              <p>{{ selectedFlag.description }}</p>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <label>Environment</label>
                <span class="env-badge large" [class]="selectedFlag.environment">{{ selectedFlag.environment }}</span>
              </div>
              <div class="detail-item">
                <label>Rollout</label>
                <div class="rollout-display">
                  <div class="rollout-bar">
                    <div class="rollout-fill" [style.width.%]="selectedFlag.rolloutPercentage"></div>
                  </div>
                  <span>{{ selectedFlag.rolloutPercentage }}%</span>
                </div>
              </div>
              <div class="detail-item">
                <label>Created</label>
                <span>{{ selectedFlag.createdAt | date:'medium' }}</span>
              </div>
              <div class="detail-item">
                <label>Last Updated</label>
                <span>{{ selectedFlag.updatedAt | date:'medium' }}</span>
              </div>
            </div>
            <div class="detail-section" *ngIf="selectedFlag.variantPayload">
              <label>Variant Payload</label>
              <pre class="code-block">{{ selectedFlag.variantPayload | json }}</pre>
            </div>
          </div>
          <div class="modal-footer">
            <button class="action-btn secondary" (click)="closeFlagDetail()">Close</button>
            <button class="action-btn" [class.danger]="selectedFlag.enabled" [class.primary]="!selectedFlag.enabled" (click)="toggleFlag(selectedFlag)">
              {{ selectedFlag.enabled ? 'Disable Flag' : 'Enable Flag' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create Flag Modal -->
      <div class="modal-overlay" *ngIf="showCreateModal" (click)="showCreateModal = false">
        <div class="modal create-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Create New Flag</h2>
            <button class="close-btn" (click)="showCreateModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Flag Name</label>
              <input type="text" [(ngModel)]="newFlag.name" placeholder="e.g., feature.new-dashboard">
              <span class="form-hint">Use dot notation for categorization</span>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="newFlag.description" placeholder="Describe what this flag controls..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Environment</label>
                <select [(ngModel)]="newFlag.environment">
                  <option value="all">All</option>
                  <option value="production">Production</option>
                  <option value="development">Development</option>
                </select>
              </div>
              <div class="form-group">
                <label>Rollout %</label>
                <input type="number" [(ngModel)]="newFlag.rolloutPercentage" min="0" max="100">
              </div>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="newFlag.enabled">
                Enable immediately after creation
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="action-btn secondary" (click)="showCreateModal = false">Cancel</button>
            <button class="action-btn primary" (click)="createFlag()" [disabled]="!newFlag.name">Create Flag</button>
          </div>
        </div>
      </div>

      <!-- Toast Container -->
      <div class="toast-container">
        <div *ngFor="let toast of toasts" class="toast" [class]="toast.type" (click)="removeToast(toast.id)">
          <div class="toast-icon">
            <svg *ngIf="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg *ngIf="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg *ngIf="toast.type === 'info'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="toast-content">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* CSS Variables */
    :host {
      --primary: #6366f1;
      --primary-dark: #4f46e5;
      --primary-light: #818cf8;
      --success: #10b981;
      --success-light: #d1fae5;
      --danger: #ef4444;
      --danger-light: #fee2e2;
      --warning: #f59e0b;
      --warning-light: #fef3c7;

      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-tertiary: #f1f5f9;
      --bg-hover: #e2e8f0;

      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-tertiary: #94a3b8;
      --text-inverse: #ffffff;

      --border-color: #e2e8f0;
      --border-radius: 12px;
      --border-radius-sm: 8px;
      --border-radius-lg: 16px;

      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);

      --transition: all 0.2s ease;
    }

    .dark-mode {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-tertiary: #334155;
      --bg-hover: #475569;

      --text-primary: #f8fafc;
      --text-secondary: #cbd5e1;
      --text-tertiary: #64748b;

      --border-color: #334155;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .admin-container {
      min-height: 100vh;
      background: var(--bg-secondary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text-primary);
    }

    /* Top Navigation */
    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      border-radius: var(--border-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-icon svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-weight: 700;
      font-size: 16px;
      color: var(--text-primary);
    }

    .brand-version {
      font-size: 11px;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .nav-center {
      flex: 1;
      max-width: 600px;
      margin: 0 48px;
    }

    .search-global {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      width: 18px;
      height: 18px;
      color: var(--text-tertiary);
    }

    .search-input-global {
      width: 100%;
      padding: 10px 48px 10px 44px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--bg-secondary);
      font-size: 14px;
      color: var(--text-primary);
      transition: var(--transition);
    }

    .search-input-global:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .search-input-global::placeholder {
      color: var(--text-tertiary);
    }

    .search-shortcut {
      position: absolute;
      right: 12px;
      padding: 2px 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      font-size: 12px;
      color: var(--text-tertiary);
      font-family: monospace;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .health-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
      font-size: 12px;
      font-weight: 500;
    }

    .health-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
    }

    .health-indicator.degraded .health-dot { background: var(--warning); }
    .health-indicator.down .health-dot { background: var(--danger); }

    .nav-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      transition: var(--transition);
      position: relative;
    }

    .nav-btn:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .nav-btn.active {
      background: var(--primary);
      color: white;
    }

    .nav-btn svg {
      width: 20px;
      height: 20px;
    }

    .nav-btn .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 18px;
      height: 18px;
      background: var(--danger);
      color: white;
      font-size: 10px;
      font-weight: 600;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 6px;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
      margin-left: 8px;
    }

    .user-avatar {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
    }

    .user-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    /* Main Layout */
    .main-layout {
      display: flex;
      min-height: calc(100vh - 64px);
    }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background: var(--bg-primary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
    }

    .sidebar.collapsed {
      width: 72px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-header h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-tertiary);
      font-weight: 600;
    }

    .collapse-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }

    .collapse-btn svg {
      width: 16px;
      height: 16px;
    }

    .sidebar-section {
      padding: 16px;
    }

    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-tertiary);
      font-weight: 600;
      margin-bottom: 12px;
    }

    .nav-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: none;
      background: transparent;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      text-align: left;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      transition: var(--transition);
      width: 100%;
    }

    .nav-item:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
    }

    .nav-icon {
      font-size: 18px;
      width: 24px;
      text-align: center;
    }

    .nav-count {
      margin-left: auto;
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      color: var(--text-tertiary);
    }

    .nav-item.active .nav-count {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      border-radius: 20px;
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition);
    }

    .chip:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .chip.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .chip-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .chip-dot.enabled { background: var(--success); }
    .chip-dot.disabled { background: var(--danger); }

    .sidebar-stats {
      margin-top: auto;
      border-top: 1px solid var(--border-color);
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
    }

    .stat-label {
      color: var(--text-tertiary);
    }

    .stat-value {
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-value.enabled { color: var(--success); }
    .stat-value.disabled { color: var(--danger); }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--border-color);
    }

    .external-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 13px;
      transition: var(--transition);
    }

    .external-link:hover {
      background: var(--primary);
      color: white;
    }

    .external-link svg {
      width: 16px;
      height: 16px;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
    }

    .page-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .title-count {
      font-size: 16px;
      font-weight: 400;
      color: var(--text-tertiary);
      margin-left: 8px;
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .view-toggle {
      display: flex;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
      padding: 4px;
    }

    .view-btn {
      width: 36px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-tertiary);
      transition: var(--transition);
    }

    .view-btn:hover {
      color: var(--text-primary);
    }

    .view-btn.active {
      background: var(--bg-primary);
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }

    .view-btn svg {
      width: 18px;
      height: 18px;
    }

    .sort-dropdown select {
      padding: 8px 32px 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      background: var(--bg-primary);
      font-size: 13px;
      color: var(--text-primary);
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
    }

    .selected-count {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .bulk-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
    }

    .bulk-btn.enable {
      background: var(--success-light);
      color: var(--success);
    }

    .bulk-btn.disable {
      background: var(--danger-light);
      color: var(--danger);
    }

    .bulk-btn.clear {
      background: transparent;
      color: var(--text-tertiary);
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: var(--border-radius-sm);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
    }

    .action-btn.primary {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
    }

    .action-btn.primary:hover {
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }

    .action-btn.secondary {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
    }

    .action-btn.danger {
      background: linear-gradient(135deg, var(--danger) 0%, #dc2626 100%);
      color: white;
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Loading State */
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      gap: 24px;
    }

    .loader {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .loader-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loader-ring:nth-child(2) {
      width: 80%;
      height: 80%;
      top: 10%;
      left: 10%;
      animation-delay: 0.15s;
      border-top-color: var(--primary-light);
    }

    .loader-ring:nth-child(3) {
      width: 60%;
      height: 60%;
      top: 20%;
      left: 20%;
      animation-delay: 0.3s;
      border-top-color: var(--primary-dark);
    }

    /* Content Area */
    .content-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .content-area.loading {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Grid View */
    .flags-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .category-card {
      background: var(--bg-primary);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    .category-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      cursor: pointer;
      transition: var(--transition);
    }

    .category-header:hover {
      background: var(--bg-secondary);
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .category-icon {
      font-size: 28px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      border-radius: var(--border-radius-sm);
    }

    .category-text h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .category-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .platform-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .platform-badge.frontend {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .platform-badge.mobile {
      background: #f3e8ff;
      color: #7c3aed;
    }

    .platform-badge.shared {
      background: #dcfce7;
      color: #15803d;
    }

    .dark-mode .platform-badge.frontend { background: #1e3a5f; }
    .dark-mode .platform-badge.mobile { background: #3b1f5c; }
    .dark-mode .platform-badge.shared { background: #14532d; }

    .flag-count {
      font-size: 13px;
      color: var(--text-tertiary);
    }

    .category-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .mini-progress {
      width: 100px;
      height: 6px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--success) 0%, #34d399 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .expand-icon {
      width: 20px;
      height: 20px;
      color: var(--text-tertiary);
      transition: transform 0.3s ease;
    }

    .expand-icon.rotated {
      transform: rotate(180deg);
    }

    .category-content {
      border-top: 1px solid var(--border-color);
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      padding: 20px;
    }

    .flag-card {
      display: flex;
      align-items: stretch;
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      overflow: hidden;
      transition: var(--transition);
    }

    .flag-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--primary);
    }

    .flag-card.selected {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.05);
    }

    .flag-card.toggling {
      opacity: 0.7;
    }

    .flag-select {
      display: flex;
      align-items: center;
      padding: 0 12px;
      background: var(--bg-tertiary);
      cursor: pointer;
    }

    .flag-select input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary);
    }

    .flag-content {
      flex: 1;
      padding: 16px;
      cursor: pointer;
    }

    .flag-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .flag-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }

    .flag-badges {
      display: flex;
      gap: 6px;
    }

    .env-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .env-badge.all {
      background: var(--bg-tertiary);
      color: var(--text-tertiary);
    }

    .env-badge.production {
      background: #fef3c7;
      color: #92400e;
    }

    .env-badge.development {
      background: #d1fae5;
      color: #065f46;
    }

    .dark-mode .env-badge.production { background: #451a03; color: #fcd34d; }
    .dark-mode .env-badge.development { background: #064e3b; color: #6ee7b7; }

    .rollout-badge {
      background: #dbeafe;
      color: #1e40af;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }

    .flag-description {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .flag-footer {
      display: flex;
      align-items: center;
    }

    .flag-updated {
      font-size: 11px;
      color: var(--text-tertiary);
    }

    .flag-toggle {
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-left: 1px solid var(--border-color);
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 52px;
      height: 28px;
    }

    .toggle-switch.small {
      width: 40px;
      height: 22px;
    }

    .toggle-switch.large {
      width: 64px;
      height: 34px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--bg-tertiary);
      transition: 0.3s;
      border-radius: 28px;
      border: 2px solid var(--border-color);
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: calc(100% - 4px);
      aspect-ratio: 1;
      left: 2px;
      top: 2px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: var(--shadow-md);
    }

    input:checked + .toggle-slider {
      background: linear-gradient(135deg, var(--success) 0%, #34d399 100%);
      border-color: var(--success);
    }

    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }

    .toggle-switch.small input:checked + .toggle-slider:before {
      transform: translateX(18px);
    }

    .toggle-switch.large input:checked + .toggle-slider:before {
      transform: translateX(30px);
    }

    input:disabled + .toggle-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle-icon {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      transition: opacity 0.2s;
    }

    .toggle-icon.on {
      right: 8px;
      color: white;
      opacity: 0;
    }

    .toggle-icon.off {
      left: 8px;
      color: var(--text-tertiary);
      opacity: 1;
    }

    input:checked + .toggle-slider .toggle-icon.on { opacity: 1; }
    input:checked + .toggle-slider .toggle-icon.off { opacity: 0; }

    /* List View */
    .flags-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--bg-primary);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .flags-table th {
      padding: 16px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-tertiary);
      font-weight: 600;
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-color);
    }

    .flags-table td {
      padding: 16px;
      font-size: 13px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
    }

    .flags-table tr:hover {
      background: var(--bg-secondary);
    }

    .flags-table tr.selected {
      background: rgba(99, 102, 241, 0.05);
    }

    .col-select { width: 48px; }
    .col-status { width: 80px; }
    .col-name { width: 200px; }
    .col-env { width: 100px; }
    .col-platform { width: 100px; }
    .col-updated { width: 120px; }
    .col-actions { width: 80px; }

    .status-indicator {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-indicator.enabled {
      background: var(--success-light);
      color: var(--success);
    }

    .status-indicator.disabled {
      background: var(--danger-light);
      color: var(--danger);
    }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .flag-icon {
      font-size: 16px;
    }

    /* Compact View */
    .compact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }

    .compact-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--bg-primary);
      border-radius: var(--border-radius-sm);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: var(--transition);
    }

    .compact-card:hover {
      border-color: var(--primary);
    }

    .compact-card.enabled {
      border-left: 3px solid var(--success);
    }

    .compact-card:not(.enabled) {
      border-left: 3px solid var(--danger);
    }

    .compact-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .compact-status {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .compact-card.enabled .compact-status {
      background: var(--success-light);
      color: var(--success);
    }

    .compact-card:not(.enabled) .compact-status {
      background: var(--danger-light);
      color: var(--danger);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 40px;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      color: var(--text-tertiary);
    }

    .empty-state h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 80px 40px;
    }

    .error-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      color: var(--danger);
    }

    .error-state h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .error-state p {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    /* Audit Panel */
    .audit-panel {
      width: 360px;
      background: var(--bg-primary);
      border-left: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .panel-header h3 {
      font-size: 16px;
      font-weight: 600;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--bg-tertiary);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
    }

    .close-btn svg {
      width: 16px;
      height: 16px;
    }

    .panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    .audit-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .audit-entry {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
      border-left: 3px solid var(--border-color);
    }

    .audit-entry.enabled {
      border-left-color: var(--success);
    }

    .audit-entry.disabled {
      border-left-color: var(--danger);
    }

    .audit-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .audit-entry.enabled .audit-icon {
      background: var(--success-light);
      color: var(--success);
    }

    .audit-entry.disabled .audit-icon {
      background: var(--danger-light);
      color: var(--danger);
    }

    .audit-icon svg {
      width: 16px;
      height: 16px;
    }

    .audit-content {
      flex: 1;
      min-width: 0;
    }

    .audit-title {
      font-size: 13px;
      margin-bottom: 4px;
    }

    .audit-title strong {
      color: var(--text-primary);
    }

    .audit-action {
      color: var(--text-tertiary);
      margin-left: 4px;
    }

    .audit-meta {
      display: flex;
      gap: 8px;
      font-size: 11px;
      color: var(--text-tertiary);
    }

    .audit-empty {
      text-align: center;
      padding: 40px;
      color: var(--text-tertiary);
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal {
      background: var(--bg-primary);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .flag-detail-modal {
      max-width: 600px;
    }

    .create-modal {
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-title h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .modal-subtitle {
      font-size: 13px;
      color: var(--text-tertiary);
      font-family: monospace;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
    }

    .detail-section {
      margin-bottom: 24px;
    }

    .detail-section label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-tertiary);
      font-weight: 600;
      margin-bottom: 8px;
    }

    .detail-section p {
      color: var(--text-primary);
      line-height: 1.6;
    }

    .status-toggle-large {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .status-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--danger);
    }

    .status-text.enabled {
      color: var(--success);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .detail-item label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-tertiary);
      font-weight: 600;
      margin-bottom: 8px;
    }

    .detail-item span {
      color: var(--text-primary);
      font-size: 14px;
    }

    .env-badge.large {
      padding: 6px 16px;
      font-size: 12px;
    }

    .rollout-display {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rollout-bar {
      flex: 1;
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
    }

    .rollout-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%);
      border-radius: 4px;
    }

    .code-block {
      background: var(--bg-tertiary);
      padding: 16px;
      border-radius: var(--border-radius-sm);
      font-family: monospace;
      font-size: 13px;
      overflow-x: auto;
      color: var(--text-primary);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      background: var(--bg-secondary);
      font-size: 14px;
      color: var(--text-primary);
      transition: var(--transition);
    }

    .form-group textarea {
      min-height: 100px;
      resize: vertical;
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .form-hint {
      display: block;
      font-size: 12px;
      color: var(--text-tertiary);
      margin-top: 6px;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .checkbox-label {
      display: flex !important;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
    }

    /* Toast Notifications */
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 2000;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--bg-primary);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      border-left: 4px solid var(--primary);
      min-width: 320px;
      max-width: 420px;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast.success { border-left-color: var(--success); }
    .toast.error { border-left-color: var(--danger); }
    .toast.info { border-left-color: var(--primary); }

    .toast-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .toast.success .toast-icon { color: var(--success); }
    .toast.error .toast-icon { color: var(--danger); }
    .toast.info .toast-icon { color: var(--primary); }

    .toast-content {
      flex: 1;
    }

    .toast-title {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .toast-message {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .toast-close {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--text-tertiary);
      padding: 0;
    }

    .toast-close svg {
      width: 16px;
      height: 16px;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .sidebar { width: 240px; }
      .audit-panel { width: 300px; }
    }

    @media (max-width: 992px) {
      .sidebar { display: none; }
      .audit-panel { display: none; }
      .nav-center { display: none; }
      .category-content {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .toolbar {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      .toolbar-left, .toolbar-center, .toolbar-right {
        justify-content: center;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  // Data
  flags: FeatureFlag[] = [];
  categories: FlagCategory[] = [];
  filteredCategories: FlagCategory[] = [];

  // UI State
  loading = false;
  error: string | null = null;
  searchQuery = '';
  activeTab: PlatformTab = 'all';
  viewMode: ViewMode = 'grid';
  sortBy: SortBy = 'name';
  quickFilter: string | null = null;
  darkMode = false;
  sidebarCollapsed = false;
  showAuditLog = false;
  showCreateModal = false;
  selectedFlag: FeatureFlag | null = null;
  selectedFlags: FeatureFlag[] = [];
  lastSyncTime = new Date();

  // System
  systemHealth: SystemHealth = {
    status: 'healthy',
    apiLatency: 0,
    lastCheck: new Date(),
    uptime: '99.9%'
  };

  // Audit Log
  auditLog: AuditLogEntry[] = [];
  private auditLogId = 0;

  // Toast Notifications
  toasts: { id: number; type: string; title: string; message: string }[] = [];
  private toastId = 0;

  // New Flag Form
  newFlag = {
    name: '',
    description: '',
    environment: 'all',
    rolloutPercentage: 100,
    enabled: true
  };

  // Subscriptions
  private subscription: Subscription | null = null;
  private healthCheckInterval: Subscription | null = null;

  // Platform tabs configuration
  platformTabs = [
    { id: 'all' as PlatformTab, label: 'All Platforms', icon: '&#127760;', count: 0 },
    { id: 'frontend' as PlatformTab, label: 'Frontend', icon: '&#128421;', count: 0 },
    { id: 'mobile' as PlatformTab, label: 'Mobile', icon: '&#128241;', count: 0 },
    { id: 'shared' as PlatformTab, label: 'Shared', icon: '&#128279;', count: 0 }
  ];

  // View modes configuration
  viewModes = [
    { id: 'grid' as ViewMode, label: 'Grid', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { id: 'list' as ViewMode, label: 'List', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
    { id: 'compact' as ViewMode, label: 'Compact', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="4"/><rect x="3" y="10" width="18" height="4"/><rect x="3" y="17" width="18" height="4"/></svg>' }
  ];

  // Category definitions
  private categoryDefs: Array<{prefix: string; name: string; icon: string; platform: 'frontend' | 'mobile' | 'shared'}> = [
    { prefix: 'ui', name: 'UI/UX', icon: '\u{1F3A8}', platform: 'frontend' },
    { prefix: 'reports', name: 'Reports', icon: '\u{1F4CA}', platform: 'frontend' },
    { prefix: 'mobile', name: 'Mobile Features', icon: '\u{1F4F1}', platform: 'mobile' },
    { prefix: 'location', name: 'Location/GPS', icon: '\u{1F4CD}', platform: 'mobile' },
    { prefix: 'media', name: 'Photos/Media', icon: '\u{1F4F7}', platform: 'mobile' },
    { prefix: 'signature', name: 'Signatures', icon: '\u{270D}', platform: 'mobile' },
    { prefix: 'appointments', name: 'Appointments', icon: '\u{1F4C5}', platform: 'shared' },
    { prefix: 'surveyor', name: 'Surveyor Features', icon: '\u{1F477}', platform: 'shared' },
    { prefix: 'notifications', name: 'Notifications', icon: '\u{1F514}', platform: 'shared' },
    { prefix: 'chat', name: 'Chat', icon: '\u{1F4AC}', platform: 'shared' },
    { prefix: 'perf', name: 'Performance', icon: '\u{26A1}', platform: 'shared' },
    { prefix: 'security', name: 'Security', icon: '\u{1F512}', platform: 'shared' },
    { prefix: 'api', name: 'API/Backend', icon: '\u{1F5A5}', platform: 'shared' },
    { prefix: 'integration', name: 'Integrations', icon: '\u{1F517}', platform: 'shared' },
    { prefix: 'experimental', name: 'Experimental', icon: '\u{1F9EA}', platform: 'shared' },
    { prefix: 'debug', name: 'Debug', icon: '\u{1F41E}', platform: 'shared' },
    { prefix: 'maintenance', name: 'Maintenance', icon: '\u{1F527}', platform: 'shared' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDarkModePreference();
    this.loadFlags();
    this.startHealthCheck();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.healthCheckInterval?.unsubscribe();
  }

  // ==================== Data Loading ====================

  loadFlags(): void {
    this.loading = true;
    this.error = null;
    const startTime = Date.now();

    this.subscription = this.http.get<FeatureFlag[]>(`${API_BASE}/feature-flags`).subscribe({
      next: (flags) => {
        this.flags = flags;
        this.organizeByCategory();
        this.updatePlatformCounts();
        this.filterFlags();
        this.loading = false;
        this.lastSyncTime = new Date();
        this.systemHealth.apiLatency = Date.now() - startTime;
        this.systemHealth.status = 'healthy';
      },
      error: (err) => {
        console.error('Failed to load feature flags:', err);
        this.error = 'Failed to connect to the backend. Please check your connection.';
        this.loading = false;
        this.systemHealth.status = 'down';
      }
    });
  }

  refresh(): void {
    this.loadFlags();
  }

  startHealthCheck(): void {
    this.healthCheckInterval = interval(30000).subscribe(() => {
      const startTime = Date.now();
      this.http.get(`${API_BASE}/feature-flags`).subscribe({
        next: () => {
          this.systemHealth.apiLatency = Date.now() - startTime;
          this.systemHealth.status = this.systemHealth.apiLatency > 1000 ? 'degraded' : 'healthy';
          this.systemHealth.lastCheck = new Date();
        },
        error: () => {
          this.systemHealth.status = 'down';
        }
      });
    });
  }

  // ==================== Category Organization ====================

  organizeByCategory(): void {
    this.categories = this.categoryDefs.map(def => ({
      ...def,
      flags: this.flags.filter(f => f.name.startsWith(def.prefix + '.')),
      expanded: true
    }));

    const categorizedPrefixes = this.categoryDefs.map(d => d.prefix);
    const otherFlags = this.flags.filter(f => {
      const prefix = f.name.split('.')[0];
      return !categorizedPrefixes.includes(prefix);
    });

    if (otherFlags.length > 0) {
      this.categories.push({
        name: 'Other',
        prefix: 'other',
        icon: '\u{1F4E6}',
        flags: otherFlags,
        expanded: true,
        platform: 'shared'
      });
    }

    this.categories = this.categories.filter(c => c.flags.length > 0);
  }

  updatePlatformCounts(): void {
    this.platformTabs[0].count = this.flags.length;
    this.platformTabs[1].count = this.categories.filter(c => c.platform === 'frontend').reduce((sum, c) => sum + c.flags.length, 0);
    this.platformTabs[2].count = this.categories.filter(c => c.platform === 'mobile').reduce((sum, c) => sum + c.flags.length, 0);
    this.platformTabs[3].count = this.categories.filter(c => c.platform === 'shared').reduce((sum, c) => sum + c.flags.length, 0);
  }

  // ==================== Filtering & Sorting ====================

  filterFlags(): void {
    let filtered = this.categories;

    // Platform filter
    if (this.activeTab !== 'all') {
      filtered = filtered.filter(c => c.platform === this.activeTab);
    }

    // Quick filter
    if (this.quickFilter) {
      filtered = filtered.map(category => ({
        ...category,
        flags: category.flags.filter(f => {
          if (this.quickFilter === 'enabled') return f.enabled;
          if (this.quickFilter === 'disabled') return !f.enabled;
          if (this.quickFilter === 'production') return f.environment === 'production';
          if (this.quickFilter === 'development') return f.environment === 'development';
          return true;
        })
      })).filter(category => category.flags.length > 0);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.map(category => ({
        ...category,
        flags: category.flags.filter(f =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
        )
      })).filter(category => category.flags.length > 0);
    }

    this.filteredCategories = filtered;
    this.sortFlags();
  }

  sortFlags(): void {
    this.filteredCategories = this.filteredCategories.map(category => ({
      ...category,
      flags: [...category.flags].sort((a, b) => {
        switch (this.sortBy) {
          case 'name': return a.name.localeCompare(b.name);
          case 'updated': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'status': return (b.enabled ? 1 : 0) - (a.enabled ? 1 : 0);
          case 'environment': return a.environment.localeCompare(b.environment);
          default: return 0;
        }
      })
    }));
  }

  setActiveTab(tab: PlatformTab): void {
    this.activeTab = tab;
    this.filterFlags();
  }

  setQuickFilter(filter: string): void {
    this.quickFilter = this.quickFilter === filter ? null : filter;
    this.filterFlags();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.quickFilter = null;
    this.activeTab = 'all';
    this.filterFlags();
  }

  // ==================== Flag Operations ====================

  toggleFlag(flag: FeatureFlag): void {
    flag.toggling = true;
    const previousValue = flag.enabled;

    this.http.post<FeatureFlag>(`${API_BASE}/feature-flags/${flag.id}/toggle`, {}).subscribe({
      next: (updated) => {
        flag.enabled = updated.enabled;
        flag.updatedAt = updated.updatedAt;
        flag.toggling = false;

        this.addAuditEntry(flag.name, updated.enabled ? 'enabled' : 'disabled', previousValue, updated.enabled);
        this.showToast('success', 'Flag Updated', `${this.getFlagDisplayName(flag.name)} is now ${updated.enabled ? 'enabled' : 'disabled'}`);
      },
      error: (err) => {
        console.error('Failed to toggle flag:', err);
        flag.toggling = false;
        this.showToast('error', 'Update Failed', 'Failed to toggle the feature flag. Please try again.');
      }
    });
  }

  createFlag(): void {
    if (!this.newFlag.name) return;

    this.http.post<FeatureFlag>(`${API_BASE}/feature-flags`, {
      name: this.newFlag.name,
      description: this.newFlag.description,
      environment: this.newFlag.environment,
      rolloutPercentage: this.newFlag.rolloutPercentage,
      enabled: this.newFlag.enabled
    }).subscribe({
      next: (created) => {
        this.flags.push(created);
        this.organizeByCategory();
        this.updatePlatformCounts();
        this.filterFlags();
        this.showCreateModal = false;
        this.resetNewFlagForm();
        this.addAuditEntry(created.name, 'created', undefined, created.enabled);
        this.showToast('success', 'Flag Created', `${this.getFlagDisplayName(created.name)} has been created`);
      },
      error: () => {
        this.showToast('error', 'Creation Failed', 'Failed to create the feature flag. Please try again.');
      }
    });
  }

  resetNewFlagForm(): void {
    this.newFlag = {
      name: '',
      description: '',
      environment: 'all',
      rolloutPercentage: 100,
      enabled: true
    };
  }

  // ==================== Selection ====================

  isSelected(flag: FeatureFlag): boolean {
    return this.selectedFlags.some(f => f.id === flag.id);
  }

  toggleSelection(flag: FeatureFlag): void {
    if (this.isSelected(flag)) {
      this.selectedFlags = this.selectedFlags.filter(f => f.id !== flag.id);
    } else {
      this.selectedFlags.push(flag);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedFlags = this.getAllFlags();
    } else {
      this.selectedFlags = [];
    }
  }

  get allSelected(): boolean {
    const allFlags = this.getAllFlags();
    return allFlags.length > 0 && this.selectedFlags.length === allFlags.length;
  }

  clearSelection(): void {
    this.selectedFlags = [];
  }

  bulkEnable(): void {
    const toEnable = this.selectedFlags.filter(f => !f.enabled);
    toEnable.forEach(flag => this.toggleFlag(flag));
    this.clearSelection();
  }

  bulkDisable(): void {
    const toDisable = this.selectedFlags.filter(f => f.enabled);
    toDisable.forEach(flag => this.toggleFlag(flag));
    this.clearSelection();
  }

  // ==================== UI Helpers ====================

  getAllFlags(): FeatureFlag[] {
    return this.filteredCategories.flatMap(c => c.flags);
  }

  get totalFlags(): number {
    return this.flags.length;
  }

  get enabledCount(): number {
    return this.flags.filter(f => f.enabled).length;
  }

  get disabledCount(): number {
    return this.flags.filter(f => !f.enabled).length;
  }

  getVisibleFlagsCount(): number {
    return this.filteredCategories.reduce((sum, c) => sum + c.flags.length, 0);
  }

  getEnabledCount(category: FlagCategory): number {
    return category.flags.filter(f => f.enabled).length;
  }

  getActiveTabLabel(): string {
    const tab = this.platformTabs.find(t => t.id === this.activeTab);
    return tab?.label || 'All Platforms';
  }

  getFlagDisplayName(name: string): string {
    const parts = name.split('.');
    if (parts.length > 1) {
      return parts.slice(1).join(' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }

  // ==================== Dark Mode ====================

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', String(this.darkMode));
  }

  loadDarkModePreference(): void {
    const saved = localStorage.getItem('darkMode');
    this.darkMode = saved === 'true';
  }

  // ==================== Detail Modal ====================

  openFlagDetail(flag: FeatureFlag): void {
    this.selectedFlag = flag;
  }

  closeFlagDetail(): void {
    this.selectedFlag = null;
  }

  // ==================== Audit Log ====================

  addAuditEntry(flagName: string, action: 'enabled' | 'disabled' | 'created' | 'updated' | 'deleted', previousValue?: boolean, newValue?: boolean): void {
    this.auditLog.unshift({
      id: ++this.auditLogId,
      flagName: this.getFlagDisplayName(flagName),
      action,
      previousValue,
      newValue,
      timestamp: new Date(),
      user: 'Admin'
    });

    // Keep only last 50 entries
    if (this.auditLog.length > 50) {
      this.auditLog = this.auditLog.slice(0, 50);
    }
  }

  // ==================== Toast Notifications ====================

  showToast(type: 'success' | 'error' | 'info', title: string, message: string): void {
    const toast = { id: ++this.toastId, type, title, message };
    this.toasts.push(toast);
    setTimeout(() => this.removeToast(toast.id), 5000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
