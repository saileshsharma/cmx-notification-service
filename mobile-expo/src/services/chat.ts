import { API_BASE_URL } from '../config/api';
import { ChatMessage, ChatConversation, TypingIndicator } from '../types';

// WebSocket URL derived from API URL
const getWebSocketUrl = () => {
  // Convert http(s)://host/api to ws(s)://host/ws/chat
  const wsUrl = API_BASE_URL
    .replace('/api', '')
    .replace('https://', 'wss://')
    .replace('http://', 'ws://');
  return `${wsUrl}/ws/chat/websocket`;
};

type MessageHandler = (message: ChatMessage) => void;
type ConversationsHandler = (conversations: ChatConversation[]) => void;
type TypingHandler = (indicator: TypingIndicator) => void;
type ConnectionHandler = (connected: boolean) => void;
type UnreadCountHandler = (count: number) => void;

class ChatService {
  private ws: WebSocket | null = null;
  private surveyorId: number = 0;
  private surveyorName: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptionId: number = 0;

  // Handlers
  private onMessage: MessageHandler | null = null;
  private onConversations: ConversationsHandler | null = null;
  private onTyping: TypingHandler | null = null;
  private onConnection: ConnectionHandler | null = null;
  private onUnreadCount: UnreadCountHandler | null = null;

  // State
  private connected: boolean = false;
  private activeConversationId: string | null = null;

  /**
   * Connect to WebSocket as a surveyor
   */
  connect(surveyorId: number, surveyorName: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Chat already connected');
      return;
    }

    this.surveyorId = surveyorId;
    this.surveyorName = surveyorName;

    const wsUrl = getWebSocketUrl();
    console.log('Connecting to chat WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Chat WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onConnection?.(true);

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
        console.error('Chat WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('Chat WebSocket disconnected');
        this.connected = false;
        this.onConnection?.(false);
        this.stopHeartbeat();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Send STOMP DISCONNECT frame
      if (this.ws.readyState === WebSocket.OPEN) {
        this.sendFrame('DISCONNECT', {});
      }
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.onConnection?.(false);
  }

  /**
   * Send a chat message
   */
  sendMessage(recipientId: number, recipientType: 'DISPATCHER' | 'SURVEYOR', content: string): void {
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

    this.sendFrame('SEND', {
      destination: '/app/chat.send',
      'content-type': 'application/json',
    }, JSON.stringify(message));
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
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

  /**
   * Load message history for a conversation
   */
  async loadMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const response = await fetch(
      `${API_BASE_URL}/chat/messages/${conversationId}?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) {
      throw new Error('Failed to load messages');
    }
    return response.json();
  }

  /**
   * Load conversations for surveyor
   */
  async loadConversations(): Promise<ChatConversation[]> {
    const response = await fetch(
      `${API_BASE_URL}/chat/conversations/surveyor/${this.surveyorId}`
    );
    if (!response.ok) {
      throw new Error('Failed to load conversations');
    }
    const conversations = await response.json();
    this.onConversations?.(conversations);
    return conversations;
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    const response = await fetch(
      `${API_BASE_URL}/chat/unread?userId=${this.surveyorId}&userType=SURVEYOR`
    );
    if (!response.ok) {
      throw new Error('Failed to get unread count');
    }
    const data = await response.json();
    this.onUnreadCount?.(data.unreadCount);
    return data.unreadCount;
  }

  /**
   * Start a new conversation with dispatcher
   */
  async startConversation(dispatcherId: number = 1): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/chat/conversations/start?surveyorId=${this.surveyorId}&dispatcherId=${dispatcherId}`,
      { method: 'POST' }
    );
    if (!response.ok) {
      throw new Error('Failed to start conversation');
    }
    const data = await response.json();
    return data.conversationId;
  }

  /**
   * Send message via REST (fallback when WebSocket is disconnected)
   */
  async sendMessageRest(recipientId: number, recipientType: 'DISPATCHER' | 'SURVEYOR', content: string): Promise<ChatMessage> {
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

    const response = await fetch(`${API_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  }

  // ==================== Event Handlers ====================

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

  isConnected(): boolean {
    return this.connected;
  }

  // ==================== Private Methods ====================

  private handleMessage(data: string): void {
    // Parse STOMP frame
    const lines = data.split('\n');
    const command = lines[0];

    if (command === 'CONNECTED') {
      console.log('STOMP connected');
      this.subscribeToTopics();
      this.startHeartbeat();
      this.loadConversations();
      this.getUnreadCount();
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
      console.error('STOMP error:', data);
    } else if (command === '\n' || command === '') {
      // Heartbeat, ignore
    }
  }

  private handleStompMessage(headers: Record<string, string>, body: string): void {
    const destination = headers['destination'] || '';

    try {
      const payload = JSON.parse(body);

      if (destination.includes('/typing')) {
        this.onTyping?.(payload as TypingIndicator);
      } else if (destination.includes('/read')) {
        // Read receipt - could update message status
      } else {
        // Regular message
        const message = payload as ChatMessage;
        this.onMessage?.(message);

        // Update unread count if not in active conversation
        if (message.conversationId !== this.activeConversationId) {
          this.getUnreadCount();
        }

        // Refresh conversations
        this.loadConversations();
      }
    } catch (error) {
      console.error('Failed to parse STOMP message:', error);
    }
  }

  private subscribeToTopics(): void {
    // Subscribe to surveyor's message topic
    const topic = `/topic/chat/surveyor/${this.surveyorId}`;
    this.subscribe(topic);
    this.subscribe(`${topic}/typing`);
    this.subscribe(`${topic}/read`);
  }

  private subscribe(destination: string): void {
    const id = `sub-${this.subscriptionId++}`;
    this.sendFrame('SUBSCRIBE', {
      id,
      destination,
    });
  }

  private sendFrame(command: string, headers: Record<string, string>, body: string = ''): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send frame');
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
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('\n');
      }
    }, 10000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.surveyorId) {
        this.connect(this.surveyorId, this.surveyorName);
      }
    }, delay);
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
