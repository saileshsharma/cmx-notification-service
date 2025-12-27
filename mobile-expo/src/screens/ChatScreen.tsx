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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { ChatMessage } from '../context/AppContext';
import { useFeatureFlagContext, FLAGS } from '../context/FeatureFlagContext';

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
  const insets = useSafeAreaInsets();
  const featureFlags = useFeatureFlagContext();

  // Feature flag checks
  const typingIndicatorsEnabled = featureFlags.isEnabled(FLAGS.TYPING_INDICATORS);
  const chatAttachmentsEnabled = featureFlags.isEnabled(FLAGS.CHAT_ATTACHMENTS);
  const voiceMessagesEnabled = featureFlags.isEnabled(FLAGS.VOICE_MESSAGES);
  const readReceiptsEnabled = featureFlags.isEnabled(FLAGS.READ_RECEIPTS);

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dispatchBadge}>
            <View style={styles.dispatchIcon}>
              <Ionicons name="headset" size={16} color={colors.accent} />
            </View>
            <Text style={styles.dispatchText}>Dispatch Center</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="call-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Connection Status Bar */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.gray[500] }]} />
        <Text style={styles.statusText}>
          {isConnected ? (typingUser && typingIndicatorsEnabled ? `${typingUser} is typing...` : 'Dispatch Online') : 'Connecting...'}
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

        {/* Typing Indicator (controlled by typing-indicators flag) */}
        {typingUser && typingIndicatorsEnabled && (
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

      {/* Input Bar */}
      <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.inputContainer}>
          {/* Attachments button (controlled by chat-attachments flag) */}
          {chatAttachmentsEnabled && (
            <TouchableOpacity style={styles.inputAction}>
              <Ionicons name="attach" size={22} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}

          <View style={styles.textInputWrapper}>
            <TextInput
              key="chat-input"
              style={styles.textInput}
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
          </View>

          <TouchableOpacity
            style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
            onPress={onSendMessage}
            disabled={!newMessage.trim()}
          >
            <LinearGradient
              colors={newMessage.trim() ? gradients.accent : [colors.backgroundTertiary, colors.backgroundTertiary]}
              style={styles.sendButtonGradient}
            >
              <Ionicons
                name="send"
                size={18}
                color={newMessage.trim() ? colors.black : colors.text.tertiary}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  dispatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dispatchIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
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
    alignItems: 'flex-end',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inputAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sendButtonActive: {},
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
