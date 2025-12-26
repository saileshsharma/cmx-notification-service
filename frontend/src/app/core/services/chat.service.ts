import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { API_BASE } from './api-config';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatMessage {
  id?: number;
  conversationId: string;
  senderId: number;
  senderType: string;
  senderName: string;
  recipientId: number;
  recipientType: string;
  content: string;
  messageType: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  status: string;
}

export interface ChatConversation {
  conversationId: string;
  otherPartyId: number;
  otherPartyName: string;
  otherPartyType: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface TypingIndicator {
  conversationId: string;
  userId: number;
  userType: string;
  userName: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private readonly apiBase = API_BASE;
  private stompClient: Client | null = null;

  // Current user info (set when connecting)
  private currentUserId: number = 0;
  private currentUserType: string = 'DISPATCHER';
  private currentUserName: string = 'Dispatcher';

  // State subjects
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private conversationsSubject = new BehaviorSubject<ChatConversation[]>([]);
  private typingSubject = new Subject<TypingIndicator>();
  private unreadCountSubject = new BehaviorSubject<number>(0);

  // Observables
  connected$ = this.connectedSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  conversations$ = this.conversationsSubject.asObservable();
  typing$ = this.typingSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();

  // Active conversation
  private activeConversationId: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Connect to WebSocket as dispatcher
   */
  connectAsDispatcher(dispatcherId: number, dispatcherName: string = 'Dispatcher'): void {
    this.currentUserId = dispatcherId;
    this.currentUserType = 'DISPATCHER';
    this.currentUserName = dispatcherName;
    this.connect();
  }

  /**
   * Connect to WebSocket as surveyor
   */
  connectAsSurveyor(surveyorId: number, surveyorName: string): void {
    this.currentUserId = surveyorId;
    this.currentUserType = 'SURVEYOR';
    this.currentUserName = surveyorName;
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.stompClient?.active) {
      return;
    }

    const wsUrl = this.apiBase.replace('/api', '') + '/ws/chat';

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // console.log('STOMP: ' + str);
      }
    });

    this.stompClient.onConnect = () => {
      console.log('Chat WebSocket connected');
      this.connectedSubject.next(true);
      this.subscribeToMessages();
      this.loadConversations();
      this.loadUnreadCount();
    };

    this.stompClient.onDisconnect = () => {
      console.log('Chat WebSocket disconnected');
      this.connectedSubject.next(false);
    };

    this.stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };

    this.stompClient.activate();
  }

  /**
   * Subscribe to message topics
   */
  private subscribeToMessages(): void {
    if (!this.stompClient) return;

    const topic = this.currentUserType === 'DISPATCHER'
      ? `/topic/chat/dispatcher/${this.currentUserId}`
      : `/topic/chat/surveyor/${this.currentUserId}`;

    // Subscribe to messages
    this.stompClient.subscribe(topic, (message: IMessage) => {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      this.handleIncomingMessage(chatMessage);
    });

    // Subscribe to typing indicators
    this.stompClient.subscribe(topic + '/typing', (message: IMessage) => {
      const indicator: TypingIndicator = JSON.parse(message.body);
      this.typingSubject.next(indicator);
    });

    // Subscribe to read receipts
    this.stompClient.subscribe(topic + '/read', (message: IMessage) => {
      const receipt = JSON.parse(message.body);
      this.handleReadReceipt(receipt);
    });
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;

    // Check if message already exists (avoid duplicates)
    if (!currentMessages.find(m => m.id === message.id)) {
      // Add to the beginning (newest first)
      this.messagesSubject.next([message, ...currentMessages]);

      // Update unread count if not in active conversation
      if (message.conversationId !== this.activeConversationId &&
          message.recipientId === this.currentUserId) {
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
      }

      // Refresh conversations list
      this.loadConversations();
    }
  }

  /**
   * Handle read receipt
   */
  private handleReadReceipt(receipt: { conversationId: string; readBy: number; readAt: string }): void {
    const messages = this.messagesSubject.value.map(m => {
      if (m.conversationId === receipt.conversationId &&
          m.recipientId === receipt.readBy &&
          !m.readAt) {
        return { ...m, readAt: receipt.readAt, status: 'READ' };
      }
      return m;
    });
    this.messagesSubject.next(messages);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
    this.connectedSubject.next(false);
  }

  /**
   * Send a chat message
   */
  sendMessage(recipientId: number, recipientType: string, content: string): void {
    if (!this.stompClient?.active) {
      console.error('Not connected to chat');
      return;
    }

    const message: Partial<ChatMessage> = {
      senderId: this.currentUserId,
      senderType: this.currentUserType,
      senderName: this.currentUserName,
      recipientId,
      recipientType,
      content,
      messageType: 'TEXT',
      conversationId: this.generateConversationId(recipientId, recipientType)
    };

    this.stompClient.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message)
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (!this.stompClient?.active) return;

    const indicator: TypingIndicator = {
      conversationId,
      userId: this.currentUserId,
      userType: this.currentUserType,
      userName: this.currentUserName,
      isTyping
    };

    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(indicator)
    });
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string): void {
    if (!this.stompClient?.active) {
      // Fallback to REST
      this.http.post(`${this.apiBase}/chat/messages/read`, null, {
        params: {
          conversationId,
          recipientId: this.currentUserId.toString(),
          recipientType: this.currentUserType
        }
      }).subscribe();
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.read',
      body: JSON.stringify({
        conversationId,
        recipientId: this.currentUserId,
        recipientType: this.currentUserType
      })
    });

    // Update local unread count
    this.loadUnreadCount();
  }

  /**
   * Set active conversation
   */
  setActiveConversation(conversationId: string | null): void {
    this.activeConversationId = conversationId;
    if (conversationId) {
      this.markAsRead(conversationId);
    }
  }

  /**
   * Load message history for a conversation
   */
  loadMessages(conversationId: string, limit: number = 50, offset: number = 0): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(
      `${this.apiBase}/chat/messages/${conversationId}`,
      { params: { limit: limit.toString(), offset: offset.toString() } }
    );
  }

  /**
   * Load conversations
   */
  loadConversations(): void {
    const endpoint = this.currentUserType === 'DISPATCHER'
      ? `${this.apiBase}/chat/conversations/dispatcher/${this.currentUserId}`
      : `${this.apiBase}/chat/conversations/surveyor/${this.currentUserId}`;

    this.http.get<ChatConversation[]>(endpoint).subscribe({
      next: (conversations) => {
        this.conversationsSubject.next(conversations);
      },
      error: (e) => console.error('Failed to load conversations:', e)
    });
  }

  /**
   * Load unread count
   */
  loadUnreadCount(): void {
    this.http.get<{ unreadCount: number }>(`${this.apiBase}/chat/unread`, {
      params: {
        userId: this.currentUserId.toString(),
        userType: this.currentUserType
      }
    }).subscribe({
      next: (response) => {
        this.unreadCountSubject.next(response.unreadCount);
      },
      error: (e) => console.error('Failed to load unread count:', e)
    });
  }

  /**
   * Start a new conversation
   */
  startConversation(surveyorId: number): Observable<{ conversationId: string }> {
    const dispatcherId = this.currentUserType === 'DISPATCHER'
      ? this.currentUserId
      : 1; // Default dispatcher

    return this.http.post<{ conversationId: string }>(
      `${this.apiBase}/chat/conversations/start`,
      null,
      { params: { surveyorId: surveyorId.toString(), dispatcherId: dispatcherId.toString() } }
    );
  }

  /**
   * Generate conversation ID
   */
  private generateConversationId(otherPartyId: number, otherPartyType: string): string {
    const surveyorId = this.currentUserType === 'SURVEYOR' ? this.currentUserId : otherPartyId;
    const dispatcherId = this.currentUserType === 'DISPATCHER' ? this.currentUserId : otherPartyId;
    return `surveyor_${surveyorId}_dispatcher_${dispatcherId}`;
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}
