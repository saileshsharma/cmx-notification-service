import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { ChatMessage } from '../context/AppContext';

interface ChatScreenProps {
  messages: ChatMessage[];
  newMessage: string;
  onMessageChange: (text: string) => void;
  onSendMessage: () => void;
  isConnected?: boolean;
  typingUser?: string | null;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  isConnected = false,
  typingUser = null,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    const currentDate = messages[index].timestamp;
    const prevDate = messages[index - 1].timestamp;
    return currentDate.toDateString() !== prevDate.toDateString();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      {/* AI Assistant Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="star-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* AI Assistant Badge */}
          <View style={styles.aiAssistantBadge}>
            <View style={styles.aiBadgeIcon}>
              <Ionicons name="sparkles" size={14} color={colors.black} />
            </View>
            <Text style={styles.aiBadgeText}>Assistant AI</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="settings-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.gray[500] }]} />
        <Text style={styles.statusText}>
          {isConnected ? (typingUser ? `${typingUser} is typing...` : 'Dispatch Online') : 'Connecting...'}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <View key={msg.id}>
            {shouldShowDate(index) && (
              <View style={styles.dateDivider}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{formatDate(msg.timestamp)}</Text>
                <View style={styles.dateLine} />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                msg.sender === 'surveyor' ? styles.sentBubble : styles.receivedBubble,
              ]}
            >
              {msg.sender === 'dispatcher' && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={12} color={colors.accent} />
                </View>
              )}
              <View
                style={[
                  styles.bubbleContent,
                  msg.sender === 'surveyor' ? styles.sentContent : styles.receivedContent,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'surveyor' ? styles.sentText : styles.receivedText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.timeText,
                    msg.sender === 'surveyor' ? styles.sentTime : styles.receivedTime,
                  ]}
                >
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Typing Indicator */}
        {typingUser && (
          <View style={styles.typingIndicator}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={12} color={colors.accent} />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { text: 'On my way', icon: 'car' },
            { text: 'Arrived', icon: 'location' },
            { text: 'Need help', icon: 'help-circle' },
            { text: 'Running late', icon: 'time' },
          ].map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAction}
              onPress={() => onMessageChange(action.text)}
            >
              <Ionicons name={action.icon as any} size={14} color={colors.accent} />
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar - Neon Yellow-Green Style from Design 1 */}
      <View style={styles.inputWrapper}>
        <LinearGradient
          colors={newMessage.trim() ? gradients.accent : [colors.card, colors.card]}
          style={styles.inputContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.inputAction}>
            <Ionicons name="arrow-back" size={20} color={newMessage.trim() ? colors.black : colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputAction}>
            <Ionicons name="folder-outline" size={20} color={newMessage.trim() ? colors.black : colors.text.tertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputAction}>
            <Ionicons name="bookmark-outline" size={20} color={newMessage.trim() ? colors.black : colors.text.tertiary} />
          </TouchableOpacity>

          <TextInput
            key="chat-input"
            style={[styles.textInput, newMessage.trim() && styles.textInputActive]}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.muted}
            value={newMessage || ''}
            onChangeText={onMessageChange}
            multiline
            maxLength={500}
            textAlignVertical="center"
            blurOnSubmit={false}
            returnKeyType="default"
          />

          <TouchableOpacity style={styles.inputAction}>
            <Ionicons name="mic-outline" size={20} color={newMessage.trim() ? colors.black : colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
            onPress={onSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={newMessage.trim() ? colors.black : colors.text.tertiary}
            />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  aiAssistantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  aiBadgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.black,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dateText: {
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  messageBubble: {
    marginBottom: spacing.md,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  sentBubble: {
    alignSelf: 'flex-end',
  },
  receivedBubble: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleContent: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sentContent: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: borderRadius.xs,
  },
  receivedContent: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  sentText: {
    color: colors.black,
  },
  receivedText: {
    color: colors.text.primary,
  },
  timeText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  sentTime: {
    color: 'rgba(0,0,0,0.5)',
  },
  receivedTime: {
    color: colors.text.muted,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  typingBubble: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.tertiary,
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  quickActions: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  inputWrapper: {
    padding: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  inputAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
    maxHeight: 80,
    paddingVertical: spacing.sm,
  },
  textInputActive: {
    color: colors.black,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});

export default ChatScreen;
