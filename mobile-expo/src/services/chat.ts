/**
 * Chat Service - Enhanced WebSocket with:
 * - Message queue for offline/disconnected scenarios
 * - Exponential backoff with jitter for reconnection
 * - Connection state machine
 * - Proper cleanup and memory management
 * - REST API fallback
 */
import { API_BASE_URL, API_TIMEOUTS } from '../config/api';
import { ChatMessage, ChatConversation, TypingIndicator } from '../types';
import { logger } from '../utils/logger';
import { addSentryBreadcrumb, captureException } from '../config/sentry';

// WebSocket URL derived from API URL
const getWebSocketUrl = () => {
  const wsUrl = API_BASE_URL
    .replace('/api', '')
    .replace('https://', 'wss://')
    .replace('http://', 'ws://');
  return `${wsUrl}/ws/chat`;
};

// Connection configuration
const CONNECTION_CONFIG = {
  maxReconnectAttempts: 10,
  baseReconnectDelay: 1000,
  maxReconnectDelay: 60000,
  heartbeatInterval: 10000,
  connectionTimeout: 15000,
  messageQueueMaxSize: 100,
  jitterFactor: 0.3,
};

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

type MessageHandler = (message: ChatMessage) => void;
type ConversationsHandler = (conversations: ChatConversation[]) => void;
type TypingHandler = (indicator: TypingIndicator) => void;
type ConnectionHandler = (connected: boolean, state: ConnectionState) => void;
type UnreadCountHandler = (count: number) => void;

interface QueuedMessage {
  recipientId: number;
  recipientType: 'DISPATCHER' | 'SURVEYOR';
  content: string;
  timestamp: number;
}

class ChatService {
  private ws: WebSocket | null = null;
  private surveyorId: number = 0;
  private surveyorName: string = '';
  private reconnectAttempts: number = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private subscriptionId: number = 0;

  // Message queue for offline messages
  private messageQueue: QueuedMessage[] = [];

  // Connection state
  private connectionState: ConnectionState = 'disconnected';
  private lastConnectedTime: number = 0;
  private lastDisconnectReason: string = '';

  // Handlers - use arrays to support multiple listeners
  private messageHandlers: Set<MessageHandler> = new Set();
  private conversationsHandlers: Set<ConversationsHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private unreadCountHandlers: Set<UnreadCountHandler> = new Set();

  // Legacy single handlers for backward compatibility
  private onMessage: MessageHandler | null = null;
  private onConversations: ConversationsHandler | null = null;
  private onTyping: TypingHandler | null = null;
  private onConnection: ConnectionHandler | null = null;
  private onUnreadCount: UnreadCountHandler | null = null;

  // Active conversation
  private activeConversationId: string | null = null;

  /**
   * Connect to WebSocket as a surveyor
   */
  connect(surveyorId: number, surveyorName: string): void {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      logger.debug('[Chat] Already connected or connecting');
      return;
    }

    this.surveyorId = surveyorId;
    this.surveyorName = surveyorName;
    this.setConnectionState('connecting');

    const wsUrl = getWebSocketUrl();
    logger.info('[Chat] Connecting to WebSocket', { url: wsUrl });

    addSentryBreadcrumb({
      category: 'chat',
      message: 'WebSocket connecting',
      level: 'info',
      data: { surveyorId },
    });

    try {
      this.ws = new WebSocket(wsUrl);

      // Connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          logger.warn('[Chat] Connection timeout');
          this.ws?.close();
          this.handleDisconnect('Connection timeout');
        }
      }, CONNECTION_CONFIG.connectionTimeout);

      this.ws.onopen = () => {
        logger.debug('[Chat] WebSocket transport connected, sending STOMP CONNECT');
        this.clearConnectionTimeout();

        // Send STOMP CONNECT frame
        this.sendFrame('CONNECT', {
          'accept-version': '1.2',
          'heart-beat': '10000,10000',
        });
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        logger.error('[Chat] WebSocket error', error);
        captureException(new Error('WebSocket error'), { surveyorId });
      };

      this.ws.onclose = (event) => {
        const reason = event.reason || `Code: ${event.code}`;
        logger.info('[Chat] WebSocket closed', { code: event.code, reason });
        this.handleDisconnect(reason);
      };
    } catch (error) {
      logger.error('[Chat] Failed to create WebSocket', error);
      captureException(error instanceof Error ? error : new Error('WebSocket creation failed'));
      this.handleDisconnect('Connection failed');
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    logger.info('[Chat] Disconnecting');

    this.clearTimers();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.sendFrame('DISCONNECT', {});
      }
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Clean up all handlers and timers (call on unmount)
   */
  cleanup(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.conversationsHandlers.clear();
    this.typingHandlers.clear();
    this.connectionHandlers.clear();
    this.unreadCountHandlers.clear();
    this.onMessage = null;
    this.onConversations = null;
    this.onTyping = null;
    this.onConnection = null;
    this.onUnreadCount = null;
    this.messageQueue = [];
  }

  /**
   * Send a chat message (with queue for offline)
   */
  async sendMessage(recipientId: number, recipientType: 'DISPATCHER' | 'SURVEYOR', content: string): Promise<void> {
    const conversationId = this.generateConversationId(recipientId);

    const message: Partial<ChatMessage> = {
      senderId: this.surveyorId,
      senderType: 'SURVEYOR',
      senderName: this.surveyorName,
      recipientId,
      recipientType,
      content,
      messageType: 'TEXT',
      conversationId,
    };

    // Try WebSocket first
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.connectionState === 'connected') {
      this.sendFrame('SEND', {
        destination: '/app/chat.send',
        'content-type': 'application/json',
      }, JSON.stringify(message));
    } else {
      // Queue message for retry or send via REST
      logger.info('[Chat] WebSocket not connected, using REST API');

      try {
        const sentMessage = await this.sendMessageRest(recipientId, recipientType, content);
        this.notifyMessageHandlers(sentMessage);
      } catch (error) {
        // Queue for later
        if (this.messageQueue.length < CONNECTION_CONFIG.messageQueueMaxSize) {
          this.messageQueue.push({
            recipientId,
            recipientType,
            content,
            timestamp: Date.now(),
          });
          logger.info('[Chat] Message queued for later', { queueSize: this.messageQueue.length });
        } else {
          logger.warn('[Chat] Message queue full, dropping message');
        }
        throw error;
      }
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.connectionState !== 'connected') return;

    const indicator: TypingIndicator = {
      conversationId,
      userId: this.surveyorId,
      userType: 'SURVEYOR',
      userName: this.surveyorName,
      isTyping,
    };

    this.sendFrame('SEND', {
      destination: '/app/chat.typing',
      'content-type': 'application/json',
    }, JSON.stringify(indicator));
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: string): void {
    if (this.connectionState !== 'connected') return;

    this.sendFrame('SEND', {
      destination: '/app/chat.read',
      'content-type': 'application/json',
    }, JSON.stringify({
      conversationId,
      recipientId: this.surveyorId,
      recipientType: 'SURVEYOR',
    }));
  }

  /**
   * Set active conversation (for read receipts)
   */
  setActiveConversation(conversationId: string | null): void {
    this.activeConversationId = conversationId;
    if (conversationId) {
      this.markAsRead(conversationId);
    }
  }

  // ==================== REST API Methods ====================

  async loadMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.chat);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/messages/${conversationId}?limit=${limit}&offset=${offset}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async loadConversations(): Promise<ChatConversation[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.chat);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/surveyor/${this.surveyorId}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }
      const conversations = await response.json();
      this.notifyConversationsHandlers(conversations);
      return conversations;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.chat);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/unread?userId=${this.surveyorId}&userType=SURVEYOR`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get unread count');
      }
      const data = await response.json();
      this.notifyUnreadCountHandlers(data.unreadCount);
      return data.unreadCount;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async startConversation(dispatcherId: number = 1): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.chat);

    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/start?surveyorId=${this.surveyorId}&dispatcherId=${dispatcherId}`,
        { method: 'POST', signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }
      const data = await response.json();
      return data.conversationId;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async sendMessageRest(recipientId: number, recipientType: 'DISPATCHER' | 'SURVEYOR', content: string): Promise<ChatMessage> {
    const conversationId = this.generateConversationId(recipientId);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.chat);

    const message: Partial<ChatMessage> = {
      senderId: this.surveyorId,
      senderType: 'SURVEYOR',
      senderName: this.surveyorName,
      recipientId,
      recipientType,
      content,
      messageType: 'TEXT',
      conversationId,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // ==================== Event Handler Registration ====================

  /**
   * Subscribe to message events (returns unsubscribe function)
   */
  subscribeToMessages(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Subscribe to conversations updates (returns unsubscribe function)
   */
  subscribeToConversations(handler: ConversationsHandler): () => void {
    this.conversationsHandlers.add(handler);
    return () => this.conversationsHandlers.delete(handler);
  }

  /**
   * Subscribe to typing indicators (returns unsubscribe function)
   */
  subscribeToTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  /**
   * Subscribe to connection state changes (returns unsubscribe function)
   */
  subscribeToConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Subscribe to unread count updates (returns unsubscribe function)
   */
  subscribeToUnreadCount(handler: UnreadCountHandler): () => void {
    this.unreadCountHandlers.add(handler);
    return () => this.unreadCountHandlers.delete(handler);
  }

  // Legacy setters for backward compatibility
  setOnMessage(handler: MessageHandler): void {
    this.onMessage = handler;
  }

  setOnConversations(handler: ConversationsHandler): void {
    this.onConversations = handler;
  }

  setOnTyping(handler: TypingHandler): void {
    this.onTyping = handler;
  }

  setOnConnection(handler: ConnectionHandler): void {
    this.onConnection = handler;
  }

  setOnUnreadCount(handler: UnreadCountHandler): void {
    this.onUnreadCount = handler;
  }

  // ==================== State Accessors ====================

  isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  // ==================== Private Methods ====================

  private setConnectionState(state: ConnectionState): void {
    const previousState = this.connectionState;
    this.connectionState = state;

    if (state === 'connected') {
      this.lastConnectedTime = Date.now();
    }

    logger.debug('[Chat] Connection state changed', { from: previousState, to: state });

    // Notify handlers
    const connected = state === 'connected';
    this.connectionHandlers.forEach(handler => handler(connected, state));
    this.onConnection?.(connected, state);
  }

  private notifyMessageHandlers(message: ChatMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
    this.onMessage?.(message);
  }

  private notifyConversationsHandlers(conversations: ChatConversation[]): void {
    this.conversationsHandlers.forEach(handler => handler(conversations));
    this.onConversations?.(conversations);
  }

  private notifyTypingHandlers(indicator: TypingIndicator): void {
    this.typingHandlers.forEach(handler => handler(indicator));
    this.onTyping?.(indicator);
  }

  private notifyUnreadCountHandlers(count: number): void {
    this.unreadCountHandlers.forEach(handler => handler(count));
    this.onUnreadCount?.(count);
  }

  private handleMessage(data: string): void {
    const lines = data.split('\n');
    const command = lines[0];

    if (command === 'CONNECTED') {
      logger.info('[Chat] STOMP CONNECTED - fully connected');
      this.setConnectionState('connected');
      this.reconnectAttempts = 0;
      this.subscribeToTopics();
      this.startHeartbeat();
      this.loadConversations();
      this.getUnreadCount();
      this.flushMessageQueue();

      addSentryBreadcrumb({
        category: 'chat',
        message: 'WebSocket connected',
        level: 'info',
      });
    } else if (command === 'MESSAGE') {
      // Parse headers and body
      let i = 1;
      const headers: Record<string, string> = {};
      while (i < lines.length && lines[i] !== '') {
        const colonIndex = lines[i].indexOf(':');
        if (colonIndex > 0) {
          const key = lines[i].substring(0, colonIndex);
          const value = lines[i].substring(colonIndex + 1);
          headers[key] = value;
        }
        i++;
      }
      i++; // Skip empty line
      const body = lines.slice(i).join('\n').replace(/\0$/, '');

      this.handleStompMessage(headers, body);
    } else if (command === 'ERROR') {
      logger.error('[Chat] STOMP error', { data });
    } else if (command === '\n' || command === '') {
      // Heartbeat, ignore
    }
  }

  private handleStompMessage(headers: Record<string, string>, body: string): void {
    const destination = headers['destination'] || '';
    logger.debug('[Chat] STOMP MESSAGE', { destination });

    try {
      const payload = JSON.parse(body);

      if (destination.includes('/typing')) {
        this.notifyTypingHandlers(payload as TypingIndicator);
      } else if (destination.includes('/read')) {
        // Read receipt - could update message status
        logger.debug('[Chat] Read receipt received');
      } else {
        // Regular message
        const message = payload as ChatMessage;
        this.notifyMessageHandlers(message);

        // Update unread count if not in active conversation
        if (message.conversationId !== this.activeConversationId) {
          this.getUnreadCount();
        }

        // Refresh conversations
        this.loadConversations();
      }
    } catch (error) {
      logger.error('[Chat] Failed to parse STOMP message', error);
    }
  }

  private handleDisconnect(reason: string): void {
    this.lastDisconnectReason = reason;
    this.clearTimers();
    this.ws = null;

    if (this.connectionState !== 'disconnected') {
      this.setConnectionState('reconnecting');
      this.attemptReconnect();
    }
  }

  private subscribeToTopics(): void {
    const topic = `/topic/chat/surveyor/${this.surveyorId}`;
    this.subscribe(topic);
    this.subscribe(`${topic}/typing`);
    this.subscribe(`${topic}/read`);
  }

  private subscribe(destination: string): void {
    const id = `sub-${this.subscriptionId++}`;
    this.sendFrame('SUBSCRIBE', { id, destination });
  }

  private sendFrame(command: string, headers: Record<string, string>, body: string = ''): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('[Chat] Cannot send frame - WebSocket not open');
      return;
    }

    let frame = command + '\n';
    for (const [key, value] of Object.entries(headers)) {
      frame += `${key}:${value}\n`;
    }
    frame += '\n';
    frame += body;
    frame += '\0';

    this.ws.send(frame);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('\n');
      }
    }, CONNECTION_CONFIG.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    this.clearConnectionTimeout();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= CONNECTION_CONFIG.maxReconnectAttempts) {
      logger.warn('[Chat] Max reconnect attempts reached');
      this.setConnectionState('disconnected');

      addSentryBreadcrumb({
        category: 'chat',
        message: 'Max reconnect attempts reached',
        level: 'warning',
        data: { attempts: this.reconnectAttempts },
      });
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const baseDelay = CONNECTION_CONFIG.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    const cappedDelay = Math.min(baseDelay, CONNECTION_CONFIG.maxReconnectDelay);
    const jitter = cappedDelay * CONNECTION_CONFIG.jitterFactor * Math.random();
    const delay = Math.floor(cappedDelay + jitter);

    logger.info(`[Chat] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${CONNECTION_CONFIG.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.surveyorId) {
        this.connect(this.surveyorId, this.surveyorName);
      }
    }, delay);
  }

  private async flushMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    logger.info('[Chat] Flushing message queue', { count: this.messageQueue.length });

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const msg of queue) {
      try {
        await this.sendMessage(msg.recipientId, msg.recipientType, msg.content);
      } catch (error) {
        logger.error('[Chat] Failed to send queued message', error);
        // Re-queue if still within time window (5 minutes)
        if (Date.now() - msg.timestamp < 300000) {
          this.messageQueue.push(msg);
        }
      }
    }
  }

  private generateConversationId(dispatcherId: number): string {
    return `surveyor_${this.surveyorId}_dispatcher_${dispatcherId}`;
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
      minute: '2-digit',
    });
  }
}

export const chatService = new ChatService();
