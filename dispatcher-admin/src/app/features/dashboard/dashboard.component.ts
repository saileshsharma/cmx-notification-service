import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';

import { FeatureFlagService } from '../../core/services/feature-flag.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { environment, APP_CONFIG } from '../../core/config/environment';
import {
  FeatureFlagUI,
  FlagCategory,
  Platform,
  ViewMode,
  SortBy,
  SystemHealth,
  CreateFlagRequest,
  PlatformTab
} from '../../models';
import {
  ToggleComponent,
  ToastContainerComponent,
  ModalComponent,
  FlagCardComponent,
  LoadingComponent
} from '../../shared';

/**
 * Dashboard Component
 *
 * Main feature flag management dashboard with:
 * - Grid, list, and compact views
 * - Filtering by platform, status, environment
 * - Search functionality
 * - Bulk operations
 * - Audit log
 * - System health monitoring
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToggleComponent,
    ToastContainerComponent,
    ModalComponent,
    FlagCardComponent,
    LoadingComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Services
  protected flagService = inject(FeatureFlagService);
  private notificationService = inject(NotificationService);
  protected auditLogService = inject(AuditLogService);

  // UI State
  searchQuery = signal('');
  activeTab = signal<'all' | Platform>('all');
  viewMode = signal<ViewMode>('grid');
  sortBy = signal<SortBy>('name');
  quickFilter = signal<string | null>(null);
  darkMode = signal(false);
  sidebarCollapsed = signal(false);
  showAuditLog = signal(false);
  showCreateModal = signal(false);
  selectedFlag = signal<FeatureFlagUI | null>(null);

  // New flag form
  newFlag = signal<CreateFlagRequest>({
    name: '',
    description: '',
    environment: 'all',
    rolloutPercentage: 100,
    enabled: true
  });

  // System health
  systemHealth = signal<SystemHealth>({
    status: 'healthy',
    apiLatency: 0,
    lastCheck: new Date(),
    uptime: '99.9%'
  });

  // Platform tabs configuration
  platformTabs = signal<PlatformTab[]>(
    APP_CONFIG.platformTabs.map(t => ({ ...t, count: 0 }))
  );

  // View modes configuration
  viewModes = [
    { id: 'grid' as ViewMode, label: 'Grid', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' },
    { id: 'list' as ViewMode, label: 'List', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
    { id: 'compact' as ViewMode, label: 'Compact', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="4"/><rect x="3" y="10" width="18" height="4"/><rect x="3" y="17" width="18" height="4"/></svg>' }
  ];

  // Computed values
  filteredCategories = computed(() =>
    this.flagService.filterFlags(
      this.activeTab(),
      this.searchQuery(),
      this.quickFilter(),
      this.sortBy()
    )
  );

  allFlags = computed(() =>
    this.filteredCategories().flatMap(c => c.flags)
  );

  selectedFlags = computed(() =>
    this.flagService.getSelectedFlags()
  );

  allSelected = computed(() => {
    const flags = this.allFlags();
    return flags.length > 0 && this.selectedFlags().length === flags.length;
  });

  visibleFlagsCount = computed(() =>
    this.filteredCategories().reduce((sum, c) => sum + c.flags.length, 0)
  );

  activeTabLabel = computed(() => {
    const tab = this.platformTabs().find(t => t.id === this.activeTab());
    return tab?.label ?? 'All Platforms';
  });

  // Subscriptions
  private healthCheckSub?: Subscription;

  ngOnInit(): void {
    this.loadDarkModePreference();
    this.loadFlags();
    this.startHealthCheck();
  }

  ngOnDestroy(): void {
    this.healthCheckSub?.unsubscribe();
  }

  // ==================== Data Loading ====================

  loadFlags(): void {
    this.flagService.loadFlags(true).subscribe({
      next: () => {
        this.updatePlatformCounts();
      },
      error: () => {
        this.notificationService.error(
          'Connection Error',
          'Failed to load feature flags. Please try again.'
        );
      }
    });
  }

  refresh(): void {
    this.loadFlags();
  }

  startHealthCheck(): void {
    this.healthCheckSub = interval(environment.healthCheckInterval).subscribe(() => {
      this.flagService.healthCheck().subscribe(result => {
        this.systemHealth.update(h => ({
          ...h,
          status: !result.healthy ? 'down' : result.latency > 1000 ? 'degraded' : 'healthy',
          apiLatency: result.latency,
          lastCheck: new Date()
        }));
      });
    });
  }

  updatePlatformCounts(): void {
    const counts = this.flagService.getPlatformCounts();
    this.platformTabs.update(tabs =>
      tabs.map(tab => ({ ...tab, count: counts[tab.id] ?? 0 }))
    );
  }

  // ==================== Filtering ====================

  setActiveTab(tab: 'all' | Platform): void {
    this.activeTab.set(tab);
  }

  setQuickFilter(filter: string): void {
    this.quickFilter.update(current => current === filter ? null : filter);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.quickFilter.set(null);
    this.activeTab.set('all');
  }

  // ==================== Flag Operations ====================

  toggleFlag(flag: FeatureFlagUI): void {
    const previousValue = flag.enabled;

    this.flagService.toggleFlag(flag).subscribe({
      next: (updated) => {
        this.auditLogService.logToggle(flag, previousValue, updated.enabled);
        this.notificationService.success(
          'Flag Updated',
          `${this.getFlagDisplayName(flag.name)} is now ${updated.enabled ? 'enabled' : 'disabled'}`
        );
      },
      error: () => {
        this.notificationService.error(
          'Update Failed',
          'Failed to toggle the feature flag. Please try again.'
        );
      }
    });
  }

  createFlag(): void {
    const request = this.newFlag();
    if (!request.name) return;

    this.flagService.createFlag(request).subscribe({
      next: (created) => {
        this.auditLogService.logCreate(created as FeatureFlagUI);
        this.notificationService.success(
          'Flag Created',
          `${this.getFlagDisplayName(created.name)} has been created`
        );
        this.showCreateModal.set(false);
        this.resetNewFlagForm();
        this.updatePlatformCounts();
      },
      error: () => {
        this.notificationService.error(
          'Creation Failed',
          'Failed to create the feature flag. Please try again.'
        );
      }
    });
  }

  resetNewFlagForm(): void {
    this.newFlag.set({
      name: '',
      description: '',
      environment: 'all',
      rolloutPercentage: 100,
      enabled: true
    });
  }

  // Form field update helpers (for template binding)
  updateNewFlagName(value: string): void {
    this.newFlag.update(f => ({ ...f, name: value }));
  }

  updateNewFlagDescription(value: string): void {
    this.newFlag.update(f => ({ ...f, description: value }));
  }

  updateNewFlagEnvironment(value: 'all' | 'production' | 'development'): void {
    this.newFlag.update(f => ({ ...f, environment: value }));
  }

  updateNewFlagRollout(value: number): void {
    this.newFlag.update(f => ({ ...f, rolloutPercentage: value }));
  }

  updateNewFlagEnabled(value: boolean): void {
    this.newFlag.update(f => ({ ...f, enabled: value }));
  }

  // ==================== Selection ====================

  toggleSelection(flag: FeatureFlagUI): void {
    this.flagService.toggleSelection(flag.id);
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.flagService.selectAll(this.allFlags().map(f => f.id));
    } else {
      this.flagService.clearSelection();
    }
  }

  clearSelection(): void {
    this.flagService.clearSelection();
  }

  bulkEnable(): void {
    const toEnable = this.selectedFlags().filter(f => !f.enabled);
    toEnable.forEach(flag => this.toggleFlag(flag));
    this.clearSelection();
  }

  bulkDisable(): void {
    const toDisable = this.selectedFlags().filter(f => f.enabled);
    toDisable.forEach(flag => this.toggleFlag(flag));
    this.clearSelection();
  }

  // ==================== Category Operations ====================

  toggleCategory(category: FlagCategory): void {
    category.expanded = !category.expanded;
  }

  getEnabledCount(category: FlagCategory): number {
    return category.flags.filter(f => f.enabled).length;
  }

  // ==================== UI Helpers ====================

  getFlagDisplayName(name: string): string {
    const parts = name.split('.');
    if (parts.length > 1) {
      return parts.slice(1).join(' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
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
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  loadDarkModePreference(): void {
    const saved = localStorage.getItem('darkMode');
    this.darkMode.set(saved === 'true');
  }

  // ==================== Modals ====================

  openFlagDetail(flag: FeatureFlagUI): void {
    this.selectedFlag.set(flag);
  }

  closeFlagDetail(): void {
    this.selectedFlag.set(null);
  }

  // ==================== External Links ====================

  get frontendAppUrl(): string {
    return APP_CONFIG.frontendAppUrl;
  }
}
