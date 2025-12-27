/**
 * useChat Hook - Chat and messaging logic
 * Handles WebSocket connection, messages, typing indicators
 * Enhanced with proper cleanup to prevent memory leaks
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { chatService } from '../services/chat';
import { ChatMessage as APIChatMessage, ChatConversation, TypingIndicator } from '../types';
import { logger } from '../utils/logger';

export interface LocalChatMessage {
  id: string;
  text: string;
  sender: 'surveyor' | 'dispatcher';
  timestamp: Date;
}

export interface UseChatReturn {
  // State
  chatMessages: LocalChatMessage[];
  newMessage: string;
  chatConnected: boolean;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  chatUnreadCount: number;
  chatTypingUser: string | null;
  chatConversations: ChatConversation[];
  activeConversationId: string | null;
  queuedMessageCount: number;

  // Actions
  setNewMessage: (text: string) => void;
  sendMessage: () => Promise<void>;
  handleMessageChange: (text: string) => void;
  initializeChat: () => void;
  disconnectChat: () => void;
  refreshMessages: () => Promise<void>;
}

export function useChat(surveyorId: number | null, surveyorName: string | null): UseChatReturn {
  const [chatMessages, setChatMessages] = useState<LocalChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatConnected, setChatConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatTypingUser, setChatTypingUser] = useState<string | null>(null);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [queuedMessageCount, setQueuedMessageCount] = useState(0);

  const appStateRef = useRef(AppState.currentState);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingIndicatorSent = useRef(0);  // Throttle typing indicators
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const isInitializedRef = useRef(false);

  // Cleanup function to clear all subscriptions
  const cleanupSubscriptions = useCallback(() => {
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribersRef.current = [];

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        logger.debug('[useChat] App came to foreground, refreshing chat...');

        // Reconnect WebSocket if needed
        if (surveyorId && surveyorName && !chatService.isConnected()) {
          chatService.connect(surveyorId, surveyorName);
        }

        // Refresh messages
        if (activeConversationId) {
          await refreshMessages();
        }

        // Update queued message count
        setQueuedMessageCount(chatService.getQueuedMessageCount());
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [surveyorId, surveyorName, activeConversationId]);

  // Initialize chat when surveyor ID is available
  useEffect(() => {
    if (surveyorId && surveyorName && !isInitializedRef.current) {
      initializeChat();
      isInitializedRef.current = true;
    }

    return () => {
      cleanupSubscriptions();
      chatService.disconnect();
      isInitializedRef.current = false;
    };
  }, [surveyorId, surveyorName]);

  const initializeChat = useCallback(() => {
    if (!surveyorId || !surveyorName) return;

    logger.info('[useChat] Initializing chat for surveyor:', surveyorId);

    // Clean up any existing subscriptions
    cleanupSubscriptions();

    // Subscribe to connection state changes
    const unsubConnection = chatService.subscribeToConnection((connected, state) => {
      setChatConnected(connected);
      setConnectionState(state);
      logger.debug('[useChat] Connection state:', state);
    });
    unsubscribersRef.current.push(unsubConnection);

    // Subscribe to messages
    const unsubMessages = chatService.subscribeToMessages((message: APIChatMessage) => {
      try {
        const msgId = message.id?.toString() || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = message.sentAt ? new Date(message.sentAt) : new Date();
        const localMessage: LocalChatMessage = {
          id: msgId,
          text: message.content || '',
          sender: message.senderType === 'SURVEYOR' ? 'surveyor' : 'dispatcher',
          timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
        };

        // Add message only if it doesn't already exist
        setChatMessages(prev => {
          if (prev.some(m => m.id === msgId || (m.text === localMessage.text && m.sender === localMessage.sender && Math.abs(m.timestamp.getTime() - localMessage.timestamp.getTime()) < 5000))) {
            return prev;
          }
          return [...prev, localMessage];
        });

        // Haptic feedback for new dispatcher message
        if (message.senderType === 'DISPATCHER') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        logger.error('[useChat] Error processing message:', error);
      }
    });
    unsubscribersRef.current.push(unsubMessages);

    // Subscribe to conversations
    const unsubConversations = chatService.subscribeToConversations((conversations) => {
      setChatConversations(conversations);
    });
    unsubscribersRef.current.push(unsubConversations);

    // Subscribe to unread count
    const unsubUnread = chatService.subscribeToUnreadCount((count) => {
      setChatUnreadCount(count);
    });
    unsubscribersRef.current.push(unsubUnread);

    // Subscribe to typing indicators
    const unsubTyping = chatService.subscribeToTyping((indicator: TypingIndicator) => {
      if (indicator.isTyping && indicator.userType === 'DISPATCHER') {
        setChatTypingUser(indicator.userName);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Auto-clear typing indicator after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setChatTypingUser(null);
          typingTimeoutRef.current = null;
        }, 3000);
      } else {
        setChatTypingUser(null);
      }
    });
    unsubscribersRef.current.push(unsubTyping);

    // Connect to chat
    chatService.connect(surveyorId, surveyorName);

    // Start conversation with dispatcher
    startDispatcherConversation();
  }, [surveyorId, surveyorName, cleanupSubscriptions]);

  // Helper to safely parse timestamps
  const safeParseDate = (dateStr: string | undefined): Date => {
    if (!dateStr) return new Date();
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const startDispatcherConversation = useCallback(async () => {
    try {
      const conversationId = await chatService.startConversation(1); // Dispatcher ID 1
      setActiveConversationId(conversationId);
      chatService.setActiveConversation(conversationId);

      // Load existing messages
      const messages = await chatService.loadMessages(conversationId);
      const localMessages: LocalChatMessage[] = messages.map(m => ({
        id: m.id?.toString() || Date.now().toString(),
        text: m.content || '',
        sender: m.senderType === 'SURVEYOR' ? 'surveyor' : 'dispatcher',
        timestamp: safeParseDate(m.sentAt),
      }));
      setChatMessages(localMessages.reverse());
    } catch (error) {
      logger.error('[useChat] Failed to start dispatcher conversation:', error);
      // Don't crash - just show empty chat
      setChatMessages([]);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!activeConversationId) return;

    try {
      const messages = await chatService.loadMessages(activeConversationId);
      const localMessages: LocalChatMessage[] = messages.map(m => ({
        id: m.id?.toString() || Date.now().toString(),
        text: m.content || '',
        sender: m.senderType === 'SURVEYOR' ? 'surveyor' : 'dispatcher',
        timestamp: safeParseDate(m.sentAt),
      }));
      setChatMessages(localMessages.reverse());
    } catch (error) {
      logger.error('[useChat] Failed to refresh chat messages:', error);
      // Don't crash - keep existing messages
    }
  }, [activeConversationId]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistically add message to UI
    const optimisticMsg: LocalChatMessage = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: messageText,
      sender: 'surveyor',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await chatService.sendMessage(1, 'DISPATCHER', messageText);
      // Update queued count after sending
      setQueuedMessageCount(chatService.getQueuedMessageCount());
    } catch (error) {
      logger.error('[useChat] Failed to send message:', error);
      Alert.alert('Message Queued', 'Your message will be sent when connection is restored.');
      setQueuedMessageCount(chatService.getQueuedMessageCount());
    }
  }, [newMessage]);

  const handleMessageChange = useCallback((text: string) => {
    setNewMessage(text);
    // Send typing indicator with throttling (max once per 2 seconds)
    if (activeConversationId && text.length > 0) {
      const now = Date.now();
      if (now - lastTypingIndicatorSent.current > 2000) {
        lastTypingIndicatorSent.current = now;
        chatService.sendTypingIndicator(activeConversationId, true);
      }
    }
  }, [activeConversationId]);

  const disconnectChat = useCallback(() => {
    cleanupSubscriptions();
    chatService.disconnect();
    setChatConnected(false);
    setConnectionState('disconnected');
    isInitializedRef.current = false;
  }, [cleanupSubscriptions]);

  return {
    chatMessages,
    newMessage,
    chatConnected,
    connectionState,
    chatUnreadCount,
    chatTypingUser,
    chatConversations,
    activeConversationId,
    queuedMessageCount,
    setNewMessage,
    sendMessage,
    handleMessageChange,
    initializeChat,
    disconnectChat,
    refreshMessages,
  };
}
