import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatService, ChatMessage, ChatConversation, TypingIndicator } from '../../core/services/chat.service';

/**
 * Chat Panel Component
 *
 * Provides real-time chat functionality with:
 * - Conversation list with unread counts
 * - Message history with auto-scroll
 * - Typing indicators
 * - New conversation creation
 */
@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-panel" *ngIf="isOpen">
      <div class="chat-header">
        <h3>Chat</h3>
        <div class="chat-header-actions">
          <button class="new-chat-btn" (click)="showNewConversation.emit()" title="New Conversation">+</button>
          <button class="close-btn" (click)="close.emit()">&#10005;</button>
        </div>
      </div>

      <!-- Conversations List -->
      <div class="conversations-list" *ngIf="!activeConversationId">
        <div class="conversation-search">
          <input
            type="text"
            placeholder="Search conversations..."
            [(ngModel)]="searchQuery"
            class="search-input">
        </div>
        <div *ngIf="filteredConversations.length === 0" class="empty-state">
          <p>No conversations yet</p>
          <button class="btn-primary" (click)="showNewConversation.emit()">Start a new chat</button>
        </div>
        <div
          *ngFor="let conv of filteredConversations"
          class="conversation-item"
          [class.unread]="conv.unreadCount > 0"
          (click)="selectConversation.emit(conv)">
          <div class="conv-avatar" [style.background-color]="getAvatarColor(conv.otherPartyName)">
            {{getInitials(conv.otherPartyName)}}
          </div>
          <div class="conv-info">
            <span class="conv-name">{{conv.otherPartyName}}</span>
            <span class="conv-preview">{{conv.lastMessage || 'No messages'}}</span>
          </div>
          <div class="conv-meta">
            <span class="conv-time" *ngIf="conv.lastMessageAt">{{formatTime(conv.lastMessageAt)}}</span>
            <span class="unread-badge" *ngIf="conv.unreadCount > 0">{{conv.unreadCount}}</span>
          </div>
        </div>
      </div>

      <!-- Active Conversation -->
      <div class="active-conversation" *ngIf="activeConversationId">
        <div class="conv-header">
          <button class="back-btn" (click)="backToList.emit()">&#8592;</button>
          <div class="conv-avatar small" [style.background-color]="getAvatarColor(activeConversationName)">
            {{getInitials(activeConversationName)}}
          </div>
          <span class="conv-name">{{activeConversationName}}</span>
          <span class="connection-status" [class.connected]="connected">
            {{connected ? 'Connected' : 'Connecting...'}}
          </span>
        </div>

        <div class="messages-container" #messagesContainer>
          <div *ngFor="let msg of messages" class="message" [class.own]="msg.senderId === currentUserId">
            <div class="message-content">{{msg.content}}</div>
            <div class="message-meta">
              <span class="message-time">{{formatMessageTime(msg.sentAt)}}</span>
              <span class="message-status" *ngIf="msg.senderId === currentUserId">
                {{msg.status === 'SENT' ? '&#10003;' : '&#10003;&#10003;'}}
              </span>
            </div>
          </div>

          <div class="typing-indicator" *ngIf="typingUser">
            <span class="typing-text">{{typingUser}} is typing...</span>
            <span class="typing-dots">
              <span></span><span></span><span></span>
            </span>
          </div>
        </div>

        <div class="message-input-container">
          <input
            type="text"
            placeholder="Type a message..."
            [(ngModel)]="messageInput"
            (keyup.enter)="sendMessage.emit(messageInput); messageInput = ''"
            (input)="onTyping.emit()"
            class="message-input">
          <button
            class="send-btn"
            [disabled]="!messageInput.trim()"
            (click)="sendMessage.emit(messageInput); messageInput = ''">
            &#10148;
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-panel {
      position: fixed;
      right: 0;
      top: 60px;
      width: 360px;
      height: calc(100vh - 60px);
      background: #fff;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.3s ease;
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }

    .chat-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .chat-header-actions {
      display: flex;
      gap: 8px;
    }

    .new-chat-btn,
    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .new-chat-btn:hover,
    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
    }

    .conversation-search {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .search-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #22c55e;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .empty-state .btn-primary {
      margin-top: 16px;
      padding: 10px 20px;
      background: #22c55e;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.2s;
    }

    .conversation-item:hover {
      background: #f8fafc;
    }

    .conversation-item.unread {
      background: #f0fdf4;
    }

    .conv-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .conv-avatar.small {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }

    .conv-info {
      flex: 1;
      min-width: 0;
    }

    .conv-name {
      display: block;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .conv-preview {
      display: block;
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .conv-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .conv-time {
      font-size: 11px;
      color: #94a3b8;
    }

    .unread-badge {
      background: #22c55e;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .active-conversation {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .conv-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .back-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #64748b;
      padding: 4px;
    }

    .back-btn:hover {
      color: #1e293b;
    }

    .connection-status {
      margin-left: auto;
      font-size: 11px;
      color: #94a3b8;
    }

    .connection-status.connected {
      color: #22c55e;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message {
      max-width: 80%;
      align-self: flex-start;
    }

    .message.own {
      align-self: flex-end;
    }

    .message-content {
      padding: 10px 14px;
      background: #f1f5f9;
      border-radius: 16px 16px 16px 4px;
      font-size: 14px;
      line-height: 1.4;
    }

    .message.own .message-content {
      background: #22c55e;
      color: white;
      border-radius: 16px 16px 4px 16px;
    }

    .message-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      padding: 0 4px;
    }

    .message-time {
      font-size: 11px;
      color: #94a3b8;
    }

    .message-status {
      font-size: 12px;
      color: #22c55e;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 16px;
      align-self: flex-start;
    }

    .typing-text {
      font-size: 12px;
      color: #64748b;
    }

    .typing-dots span {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      margin-right: 2px;
      animation: typingBounce 1.4s infinite;
    }

    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    .message-input-container {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
    }

    .message-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      font-size: 14px;
    }

    .message-input:focus {
      outline: none;
      border-color: #22c55e;
    }

    .send-btn {
      width: 40px;
      height: 40px;
      border: none;
      background: #22c55e;
      color: white;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .send-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .send-btn:not(:disabled):hover {
      background: #16a34a;
    }

    @media (max-width: 768px) {
      .chat-panel {
        width: 100%;
        left: 0;
        right: 0;
      }
    }
  `]
})
export class ChatPanelComponent implements AfterViewChecked, OnChanges {
  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  @Input() isOpen = false;
  @Input() conversations: ChatConversation[] = [];
  @Input() messages: ChatMessage[] = [];
  @Input() activeConversationId: string | null = null;
  @Input() activeConversationName = '';
  @Input() connected = false;
  @Input() typingUser: string | null = null;
  @Input() currentUserId = 1;

  @Output() close = new EventEmitter<void>();
  @Output() selectConversation = new EventEmitter<ChatConversation>();
  @Output() backToList = new EventEmitter<void>();
  @Output() sendMessage = new EventEmitter<string>();
  @Output() onTyping = new EventEmitter<void>();
  @Output() showNewConversation = new EventEmitter<void>();

  searchQuery = '';
  messageInput = '';
  private shouldScrollToBottom = false;

  private readonly AVATAR_COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  get filteredConversations(): ChatConversation[] {
    if (!this.searchQuery.trim()) {
      return this.conversations;
    }
    const query = this.searchQuery.toLowerCase();
    return this.conversations.filter(c =>
      c.otherPartyName.toLowerCase().includes(query)
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Scroll to bottom when messages change or conversation opens
    if (changes['messages'] || changes['activeConversationId']) {
      this.shouldScrollToBottom = true;
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }, 50);
    }
  }

  getAvatarColor(name: string): string {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.AVATAR_COLORS[hash % this.AVATAR_COLORS.length];
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  }

  formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
