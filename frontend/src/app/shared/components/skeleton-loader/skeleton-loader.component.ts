import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type SkeletonType = 'text' | 'circle' | 'card' | 'calendar' | 'list' | 'table';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-wrapper" [ngClass]="type">
      <!-- Text skeleton -->
      <ng-container *ngIf="type === 'text'">
        <div class="skeleton-line" *ngFor="let line of lines" [style.width]="getRandomWidth()"></div>
      </ng-container>

      <!-- Circle skeleton (avatar) -->
      <ng-container *ngIf="type === 'circle'">
        <div class="skeleton-circle" [style.width.px]="size" [style.height.px]="size"></div>
      </ng-container>

      <!-- Card skeleton -->
      <ng-container *ngIf="type === 'card'">
        <div class="skeleton-card" *ngFor="let card of cards">
          <div class="skeleton-card-header">
            <div class="skeleton-circle" style="width: 40px; height: 40px;"></div>
            <div class="skeleton-card-title">
              <div class="skeleton-line" style="width: 60%;"></div>
              <div class="skeleton-line" style="width: 40%;"></div>
            </div>
          </div>
          <div class="skeleton-card-body">
            <div class="skeleton-line"></div>
            <div class="skeleton-line" style="width: 80%;"></div>
          </div>
        </div>
      </ng-container>

      <!-- Calendar skeleton -->
      <ng-container *ngIf="type === 'calendar'">
        <div class="skeleton-calendar">
          <div class="skeleton-calendar-header">
            <div class="skeleton-line" style="width: 150px;"></div>
          </div>
          <div class="skeleton-calendar-grid">
            <div class="skeleton-calendar-day" *ngFor="let day of calendarDays"></div>
          </div>
        </div>
      </ng-container>

      <!-- List skeleton -->
      <ng-container *ngIf="type === 'list'">
        <div class="skeleton-list-item" *ngFor="let item of listItems">
          <div class="skeleton-circle" style="width: 32px; height: 32px;"></div>
          <div class="skeleton-list-content">
            <div class="skeleton-line" style="width: 70%;"></div>
            <div class="skeleton-line" style="width: 50%;"></div>
          </div>
        </div>
      </ng-container>

      <!-- Table skeleton -->
      <ng-container *ngIf="type === 'table'">
        <div class="skeleton-table">
          <div class="skeleton-table-header">
            <div class="skeleton-line" *ngFor="let col of tableCols" style="width: 100%;"></div>
          </div>
          <div class="skeleton-table-row" *ngFor="let row of tableRows">
            <div class="skeleton-line" *ngFor="let col of tableCols" style="width: 100%;"></div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
    }

    .skeleton-line, .skeleton-circle, .skeleton-card,
    .skeleton-calendar-day, .skeleton-list-item {
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton-line {
      height: 16px;
      border-radius: 4px;
      margin-bottom: 8px;
      width: 100%;
    }

    .skeleton-circle {
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* Card skeleton */
    .skeleton-card {
      background: #1e293b;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .skeleton-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .skeleton-card-title {
      flex: 1;
    }

    .skeleton-card-body .skeleton-line {
      margin-bottom: 8px;
    }

    /* Calendar skeleton */
    .skeleton-calendar-header {
      margin-bottom: 16px;
    }

    .skeleton-calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .skeleton-calendar-day {
      aspect-ratio: 1;
      border-radius: 4px;
    }

    /* List skeleton */
    .skeleton-list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      background: #1e293b;
    }

    .skeleton-list-content {
      flex: 1;
    }

    /* Table skeleton */
    .skeleton-table-header,
    .skeleton-table-row {
      display: flex;
      gap: 16px;
      padding: 12px;
    }

    .skeleton-table-header {
      background: #1e293b;
      border-radius: 8px 8px 0 0;
    }

    .skeleton-table-row {
      border-bottom: 1px solid #334155;
    }

    .skeleton-table-row:last-child {
      border-bottom: none;
      border-radius: 0 0 8px 8px;
    }
  `]
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() count = 3;
  @Input() size = 40;

  get lines(): number[] {
    return Array(this.count).fill(0);
  }

  get cards(): number[] {
    return Array(this.count).fill(0);
  }

  get listItems(): number[] {
    return Array(this.count).fill(0);
  }

  get calendarDays(): number[] {
    return Array(35).fill(0); // 5 weeks
  }

  get tableRows(): number[] {
    return Array(this.count).fill(0);
  }

  get tableCols(): number[] {
    return Array(4).fill(0);
  }

  getRandomWidth(): string {
    const widths = ['100%', '90%', '80%', '70%', '60%'];
    return widths[Math.floor(Math.random() * widths.length)];
  }
}
