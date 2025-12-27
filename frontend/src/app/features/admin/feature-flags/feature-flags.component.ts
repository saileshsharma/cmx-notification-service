import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FeatureFlagService, FeatureFlag } from '../../../core/services/feature-flag.service';

interface FlagCategory {
  name: string;
  prefix: string;
  icon: string;
  flags: FeatureFlag[];
  expanded: boolean;
}

@Component({
  selector: 'app-feature-flags',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="feature-flags-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Feature Flags</h1>
          <p class="subtitle">Manage feature toggles across the application</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="refresh()" [disabled]="loading">
            <span class="icon">&#8635;</span>
            Refresh
          </button>
          <button class="btn btn-primary" (click)="enableAll()" [disabled]="loading">
            Enable All
          </button>
        </div>
      </header>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-value">{{ totalFlags }}</span>
          <span class="stat-label">Total Flags</span>
        </div>
        <div class="stat enabled">
          <span class="stat-value">{{ enabledCount }}</span>
          <span class="stat-label">Enabled</span>
        </div>
        <div class="stat disabled">
          <span class="stat-value">{{ disabledCount }}</span>
          <span class="stat-label">Disabled</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ categories.length }}</span>
          <span class="stat-label">Categories</span>
        </div>
      </div>

      <!-- Search -->
      <div class="search-container">
        <input
          type="text"
          class="search-input"
          placeholder="Search feature flags..."
          [(ngModel)]="searchQuery"
          (ngModelChange)="filterFlags()">
        <span class="search-icon">&#128269;</span>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading feature flags...</p>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error">
        <p class="error-message">{{ error }}</p>
        <button class="btn btn-primary" (click)="loadFlags()">Retry</button>
      </div>

      <!-- Categories -->
      <div class="categories" *ngIf="!loading && !error">
        <div class="category" *ngFor="let category of filteredCategories">
          <div class="category-header" (click)="category.expanded = !category.expanded">
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">
              {{ getEnabledCount(category) }}/{{ category.flags.length }}
            </span>
            <span class="expand-icon">{{ category.expanded ? '&#9660;' : '&#9654;' }}</span>
          </div>

          <div class="category-content" *ngIf="category.expanded">
            <div class="flag-item" *ngFor="let flag of category.flags">
              <div class="flag-info">
                <span class="flag-name">{{ getFlagDisplayName(flag.name) }}</span>
                <span class="flag-description">{{ flag.description }}</span>
                <div class="flag-meta">
                  <span class="meta-item env" [class]="flag.environment">
                    {{ flag.environment }}
                  </span>
                  <span class="meta-item rollout" *ngIf="flag.rolloutPercentage < 100">
                    {{ flag.rolloutPercentage }}% rollout
                  </span>
                </div>
              </div>
              <div class="flag-actions">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    [checked]="flag.enabled"
                    (change)="toggleFlag(flag)"
                    [disabled]="flag.toggling">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && !error && filteredCategories.length === 0">
        <p>No feature flags found matching "{{ searchQuery }}"</p>
      </div>
    </div>
  `,
  styles: [`
    .feature-flags-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .header-content h1 {
      margin: 0 0 4px 0;
      font-size: 28px;
      font-weight: 600;
      color: #1a1a2e;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e8e8e8;
    }

    .icon {
      font-size: 16px;
    }

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .stat-value {
      display: block;
      font-size: 32px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat.enabled .stat-value {
      color: #28a745;
    }

    .stat.disabled .stat-value {
      color: #dc3545;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .search-container {
      position: relative;
      margin-bottom: 24px;
    }

    .search-input {
      width: 100%;
      padding: 14px 20px 14px 48px;
      border: 2px solid #e8e8e8;
      border-radius: 12px;
      font-size: 15px;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      color: #999;
    }

    .loading-container,
    .error-container,
    .empty-state {
      text-align: center;
      padding: 48px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e8e8e8;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      color: #dc3545;
      margin-bottom: 16px;
    }

    .categories {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .category {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .category-header:hover {
      background: #f8f9fa;
    }

    .category-icon {
      font-size: 20px;
    }

    .category-name {
      font-weight: 600;
      font-size: 16px;
      color: #1a1a2e;
    }

    .category-count {
      margin-left: auto;
      background: #e8e8e8;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      color: #666;
    }

    .expand-icon {
      font-size: 10px;
      color: #999;
    }

    .category-content {
      border-top: 1px solid #e8e8e8;
    }

    .flag-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
    }

    .flag-item:last-child {
      border-bottom: none;
    }

    .flag-info {
      flex: 1;
    }

    .flag-name {
      display: block;
      font-weight: 500;
      color: #1a1a2e;
      margin-bottom: 4px;
    }

    .flag-description {
      display: block;
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }

    .flag-meta {
      display: flex;
      gap: 8px;
    }

    .meta-item {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    .meta-item.env {
      background: #e8e8e8;
      color: #666;
    }

    .meta-item.env.production {
      background: #fff3cd;
      color: #856404;
    }

    .meta-item.env.development {
      background: #d4edda;
      color: #155724;
    }

    .meta-item.rollout {
      background: #cce5ff;
      color: #004085;
    }

    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 52px;
      height: 28px;
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
      background-color: #ccc;
      transition: 0.3s;
      border-radius: 28px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    input:checked + .toggle-slider {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }

    input:disabled + .toggle-slider {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
      }

      .flag-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .flag-actions {
        align-self: flex-end;
      }
    }
  `]
})
export class FeatureFlagsComponent implements OnInit, OnDestroy {
  flags: FeatureFlag[] = [];
  categories: FlagCategory[] = [];
  filteredCategories: FlagCategory[] = [];
  searchQuery = '';
  loading = false;
  error: string | null = null;

  private subscription: Subscription | null = null;

  // Category definitions
  private categoryDefs = [
    { prefix: 'appointments', name: 'Appointments', icon: '📅' },
    { prefix: 'surveyor', name: 'Surveyor Features', icon: '👷' },
    { prefix: 'notifications', name: 'Notifications', icon: '🔔' },
    { prefix: 'chat', name: 'Chat', icon: '💬' },
    { prefix: 'reports', name: 'Reports', icon: '📊' },
    { prefix: 'location', name: 'Location', icon: '📍' },
    { prefix: 'media', name: 'Photos/Media', icon: '📷' },
    { prefix: 'signature', name: 'Signatures', icon: '✍️' },
    { prefix: 'ui', name: 'UI/UX', icon: '🎨' },
    { prefix: 'mobile', name: 'Mobile', icon: '📱' },
    { prefix: 'perf', name: 'Performance', icon: '⚡' },
    { prefix: 'security', name: 'Security', icon: '🔒' },
    { prefix: 'api', name: 'API/Backend', icon: '🔧' },
    { prefix: 'integration', name: 'Integrations', icon: '🔗' },
    { prefix: 'experimental', name: 'Experimental', icon: '🧪' },
    { prefix: 'debug', name: 'Debug', icon: '🐛' },
    { prefix: 'maintenance', name: 'Maintenance', icon: '🚧' },
  ];

  constructor(private featureFlagService: FeatureFlagService) {}

  ngOnInit(): void {
    this.loadFlags();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
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

  loadFlags(): void {
    this.loading = true;
    this.error = null;

    this.subscription = this.featureFlagService.getAllFlags().subscribe({
      next: (flags) => {
        this.flags = flags;
        this.organizeByCategory();
        this.filterFlags();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load feature flags:', err);
        this.error = 'Failed to load feature flags. Please try again.';
        this.loading = false;
      }
    });
  }

  refresh(): void {
    this.loadFlags();
  }

  organizeByCategory(): void {
    this.categories = this.categoryDefs.map(def => ({
      ...def,
      flags: this.flags.filter(f => f.name.startsWith(def.prefix + '.')),
      expanded: true
    }));

    // Add "Other" category for uncategorized flags
    const categorizedPrefixes = this.categoryDefs.map(d => d.prefix);
    const otherFlags = this.flags.filter(f => {
      const prefix = f.name.split('.')[0];
      return !categorizedPrefixes.includes(prefix);
    });

    if (otherFlags.length > 0) {
      this.categories.push({
        name: 'Other',
        prefix: 'other',
        icon: '📦',
        flags: otherFlags,
        expanded: true
      });
    }

    // Remove empty categories
    this.categories = this.categories.filter(c => c.flags.length > 0);
  }

  filterFlags(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCategories = this.categories;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredCategories = this.categories
      .map(category => ({
        ...category,
        flags: category.flags.filter(f =>
          f.name.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.flags.length > 0);
  }

  getEnabledCount(category: FlagCategory): number {
    return category.flags.filter(f => f.enabled).length;
  }

  getFlagDisplayName(name: string): string {
    // Remove prefix and format nicely
    const parts = name.split('.');
    if (parts.length > 1) {
      return parts.slice(1).join(' ').replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
    return name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  toggleFlag(flag: FeatureFlag): void {
    (flag as any).toggling = true;

    this.featureFlagService.toggleFlag(flag.id).subscribe({
      next: (updated) => {
        flag.enabled = updated.enabled;
        (flag as any).toggling = false;
      },
      error: (err) => {
        console.error('Failed to toggle flag:', err);
        (flag as any).toggling = false;
        // Revert the checkbox
        flag.enabled = !flag.enabled;
      }
    });
  }

  enableAll(): void {
    this.loading = true;

    // Enable all disabled flags
    const disabledFlags = this.flags.filter(f => !f.enabled);
    let completed = 0;

    if (disabledFlags.length === 0) {
      this.loading = false;
      return;
    }

    disabledFlags.forEach(flag => {
      this.featureFlagService.toggleFlag(flag.id).subscribe({
        next: (updated) => {
          flag.enabled = updated.enabled;
          completed++;
          if (completed === disabledFlags.length) {
            this.loading = false;
          }
        },
        error: () => {
          completed++;
          if (completed === disabledFlags.length) {
            this.loading = false;
          }
        }
      });
    });
  }
}
