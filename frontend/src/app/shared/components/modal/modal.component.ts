import { Component, Input, Output, EventEmitter, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)" *ngIf="isOpen">
      <div class="modal" [class]="modalClass" (click)="$event.stopPropagation()">
        <div class="modal-header" *ngIf="title">
          <h3>{{title}}</h3>
          <button class="close-btn" (click)="close.emit()" *ngIf="showCloseButton">&#10005;</button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
        <div class="modal-footer" *ngIf="showFooter">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      min-width: 400px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    .modal-body {
      margin-bottom: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }

    .modal.success-modal .modal-header {
      text-align: center;
      flex-direction: column;
    }

    .modal.wide {
      min-width: 600px;
    }

    .modal.narrow {
      min-width: 320px;
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() modalClass = '';
  @Input() showCloseButton = true;
  @Input() showFooter = true;
  @Input() closeOnOverlayClick = true;

  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (this.closeOnOverlayClick) {
      this.close.emit();
    }
  }
}
