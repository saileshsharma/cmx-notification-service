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
  Image,
  ActivityIndicator,
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
    // Scroll to bottom when new messages arrive
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
      {/* Chat Header */}
      <View style={[styles.header, shadows.sm]}>
        <View style={styles.avatarContainer}>
          <LinearGradient colors={gradients.ocean} style={styles.avatar}>
            <Ionicons name="headset" size={24} color={colors.white} />
          </LinearGradient>
          <View style={[styles.onlineIndicator, !isConnected && styles.offlineIndicator]} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Dispatch Center</Text>
          <View style={styles.statusRow}>
            <View style={[styles.onlineDot, !isConnected && styles.offlineDot]} />
            <Text style={[styles.headerSubtitle, !isConnected && styles.offlineText]}>
              {isConnected ? (typingUser ? `${typingUser} is typing...` : 'Online') : 'Connecting...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call" size={22} color={colors.primary} />
        </TouchableOpacity>
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
              <View
                style={[
                  styles.bubbleContent,
                  msg.sender === 'surveyor' ? styles.sentContent : styles.receivedContent,
                ]}
              >
                {msg.sender === 'dispatcher' && (
                  <Text style={styles.senderName}>Dispatch</Text>
                )}
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
                  {msg.sender === 'surveyor' && (
                    <Text> • <Ionicons name="checkmark-done" size={12} color="rgba(255,255,255,0.7)" /></Text>
                  )}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {/* Typing Indicator */}
        {typingUser && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, styles.typingDot1]} />
              <View style={[styles.typingDot, styles.typingDot2]} />
              <View style={[styles.typingDot, styles.typingDot3]} />
            </View>
            <Text style={styles.typingText}>{typingUser} is typing...</Text>
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
              <Ionicons name={action.icon as any} size={16} color={colors.primary} />
              <Text style={styles.quickActionText}>{action.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input */}
      <View style={[styles.inputContainer, shadows.sm]}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle" size={28} color={colors.gray[400]} />
        </TouchableOpacity>
        <TextInput
          key="chat-input"
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.gray[400]}
          value={newMessage || ''}
          onChangeText={onMessageChange}
          multiline
          maxLength={500}
          textAlignVertical="center"
          blurOnSubmit={false}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
          onPress={onSendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={newMessage.trim() ? colors.white : colors.gray[400]}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    backgroundColor: colors.success,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.success,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.success,
  },
  headerAction: {
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
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
    backgroundColor: colors.gray[300],
  },
  dateText: {
    paddingHorizontal: spacing.md,
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  messageBubble: {
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  sentBubble: {
    alignSelf: 'flex-end',
  },
  receivedBubble: {
    alignSelf: 'flex-start',
  },
  bubbleContent: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sentContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.xs,
  },
  receivedContent: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius.xs,
    ...shadows.sm,
  },
  senderName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  sentText: {
    color: colors.white,
  },
  receivedText: {
    color: colors.gray[800],
  },
  timeText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  sentTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  receivedTime: {
    color: colors.gray[400],
  },
  quickActions: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.sm,
  },
  attachButton: {
    padding: spacing.xs,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    maxHeight: 100,
    color: colors.gray[800],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  // Offline/connecting styles
  offlineIndicator: {
    backgroundColor: colors.gray[400],
  },
  offlineDot: {
    backgroundColor: colors.gray[400],
  },
  offlineText: {
    color: colors.gray[500],
  },
  // Typing indicator styles
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[400],
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
  typingText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});

export default ChatScreen;
