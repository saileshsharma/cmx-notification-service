/**
 * ChatContext - Chat and messaging state management
 * Handles WebSocket connection, messages, and typing indicators
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useChat, UseChatReturn } from '../hooks/useChat';
import { useAuthContext } from './AuthContext';

const ChatContext = createContext<UseChatReturn | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { surveyorId, surveyorName } = useAuthContext();
  const chat = useChat(surveyorId, surveyorName);

  return (
    <ChatContext.Provider value={chat}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): UseChatReturn => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

// Re-export types
export type { LocalChatMessage } from '../hooks/useChat';
