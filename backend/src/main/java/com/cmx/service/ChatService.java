package com.cmx.service;

import com.cmx.dto.ChatConversationDto;
import com.cmx.dto.ChatMessageDto;
import com.cmx.dto.TypingIndicatorDto;
import com.cmx.model.ChatMessage;
import com.cmx.model.Surveyor;
import com.cmx.repository.ChatMessageRepository;
import com.cmx.repository.SurveyorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final SurveyorRepository surveyorRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PushNotificationService pushNotificationService;

    /**
     * Send a new chat message
     */
    @Transactional
    public ChatMessageDto sendMessage(ChatMessageDto messageDto) {
        // Create and save the message
        ChatMessage message = new ChatMessage(
            messageDto.conversationId(),
            messageDto.senderId(),
            messageDto.senderType(),
            messageDto.senderName(),
            messageDto.recipientId(),
            messageDto.recipientType(),
            messageDto.content(),
            messageDto.messageType() != null ? messageDto.messageType() : "TEXT"
        );

        ChatMessage saved = chatMessageRepository.save(message);
        log.info("Chat message saved: {} -> {} in conversation {}",
                saved.getSenderName(), saved.getRecipientId(), saved.getConversationId());

        // Create response DTO
        ChatMessageDto responseDto = toDto(saved);

        // Send to recipient via WebSocket
        String recipientDestination = getDestinationForUser(
            saved.getRecipientId(), saved.getRecipientType()
        );
        messagingTemplate.convertAndSend(recipientDestination, responseDto);

        // Also send back to sender for confirmation
        String senderDestination = getDestinationForUser(
            saved.getSenderId(), saved.getSenderType()
        );
        messagingTemplate.convertAndSend(senderDestination, responseDto);

        // Send push notification if recipient is surveyor (mobile)
        if ("SURVEYOR".equals(saved.getRecipientType())) {
            sendPushNotification(saved);
        }

        return responseDto;
    }

    /**
     * Send typing indicator
     */
    public void sendTypingIndicator(TypingIndicatorDto indicator) {
        // Determine the other party in the conversation
        String[] parts = indicator.conversationId().split("_");
        Long surveyorId = Long.parseLong(parts[1]);
        Long dispatcherId = Long.parseLong(parts[3]);

        String destination;
        if ("SURVEYOR".equals(indicator.userType())) {
            // Surveyor is typing, notify dispatcher
            destination = "/topic/chat/dispatcher/" + dispatcherId;
        } else {
            // Dispatcher is typing, notify surveyor
            destination = "/topic/chat/surveyor/" + surveyorId;
        }

        messagingTemplate.convertAndSend(destination + "/typing", indicator);
    }

    /**
     * Mark messages as read
     */
    @Transactional
    public void markAsRead(String conversationId, Long recipientId, String recipientType) {
        chatMessageRepository.markAsRead(conversationId, recipientId, recipientType, Instant.now());

        // Notify the sender that messages were read
        String[] parts = conversationId.split("_");
        Long surveyorId = Long.parseLong(parts[1]);
        Long dispatcherId = Long.parseLong(parts[3]);

        Long senderId = "SURVEYOR".equals(recipientType) ? dispatcherId : surveyorId;
        String senderType = "SURVEYOR".equals(recipientType) ? "DISPATCHER" : "SURVEYOR";

        String destination = getDestinationForUser(senderId, senderType);
        messagingTemplate.convertAndSend(destination + "/read", new ReadReceiptDto(conversationId, recipientId, Instant.now()));
    }

    /**
     * Get message history for a conversation
     */
    public List<ChatMessageDto> getMessageHistory(String conversationId, int limit, int offset) {
        List<ChatMessage> messages = chatMessageRepository.findByConversationId(conversationId, limit, offset);
        return messages.stream().map(this::toDto).toList();
    }

    /**
     * Get conversations for a surveyor
     */
    public List<ChatConversationDto> getConversationsForSurveyor(Long surveyorId) {
        List<ChatMessage> latestMessages = chatMessageRepository.findConversationsForSurveyor(surveyorId);
        return buildConversationDtos(latestMessages, surveyorId, "SURVEYOR");
    }

    /**
     * Get conversations for a dispatcher
     */
    public List<ChatConversationDto> getConversationsForDispatcher(Long dispatcherId) {
        List<ChatMessage> latestMessages = chatMessageRepository.findConversationsForDispatcher(dispatcherId);
        return buildConversationDtos(latestMessages, dispatcherId, "DISPATCHER");
    }

    /**
     * Get unread message count
     */
    public int getUnreadCount(Long userId, String userType) {
        return chatMessageRepository.countTotalUnreadMessages(userId, userType);
    }

    /**
     * Start a new conversation with a surveyor
     */
    public String startConversation(Long surveyorId, Long dispatcherId) {
        return ChatMessage.generateConversationId(surveyorId, dispatcherId);
    }

    // ============ Private Helper Methods ============

    private String getDestinationForUser(Long userId, String userType) {
        if ("SURVEYOR".equals(userType)) {
            return "/topic/chat/surveyor/" + userId;
        } else {
            return "/topic/chat/dispatcher/" + userId;
        }
    }

    private ChatMessageDto toDto(ChatMessage message) {
        return new ChatMessageDto(
            message.getId(),
            message.getConversationId(),
            message.getSenderId(),
            message.getSenderType(),
            message.getSenderName(),
            message.getRecipientId(),
            message.getRecipientType(),
            message.getContent(),
            message.getMessageType(),
            message.getSentAt(),
            message.getDeliveredAt(),
            message.getReadAt(),
            message.getStatus()
        );
    }

    private List<ChatConversationDto> buildConversationDtos(List<ChatMessage> latestMessages,
                                                             Long userId, String userType) {
        List<ChatConversationDto> conversations = new ArrayList<>();

        for (ChatMessage message : latestMessages) {
            // Determine the other party
            Long otherPartyId;
            String otherPartyType;
            String otherPartyName;

            if (message.getSenderId().equals(userId) && message.getSenderType().equals(userType)) {
                otherPartyId = message.getRecipientId();
                otherPartyType = message.getRecipientType();
                otherPartyName = getPartyName(otherPartyId, otherPartyType);
            } else {
                otherPartyId = message.getSenderId();
                otherPartyType = message.getSenderType();
                otherPartyName = message.getSenderName();
            }

            int unreadCount = chatMessageRepository.countUnreadMessages(
                message.getConversationId(), userId, userType
            );

            conversations.add(new ChatConversationDto(
                message.getConversationId(),
                otherPartyId,
                otherPartyName,
                otherPartyType,
                message.getContent(),
                message.getSentAt(),
                unreadCount
            ));
        }

        return conversations;
    }

    private String getPartyName(Long partyId, String partyType) {
        if ("SURVEYOR".equals(partyType)) {
            return surveyorRepository.findById(partyId)
                .map(Surveyor::getDisplayName)
                .orElse("Surveyor " + partyId);
        } else {
            // For now, dispatcher names are not stored - could enhance later
            return "Dispatcher";
        }
    }

    private void sendPushNotification(ChatMessage message) {
        try {
            pushNotificationService.sendPushNotification(
                message.getRecipientId(),
                "New message from " + message.getSenderName(),
                message.getContent(),
                java.util.Map.of(
                    "type", "CHAT_MESSAGE",
                    "conversationId", message.getConversationId(),
                    "senderId", String.valueOf(message.getSenderId()),
                    "senderName", message.getSenderName()
                )
            );
        } catch (Exception e) {
            log.warn("Failed to send push notification for chat message: {}", e.getMessage());
        }
    }

    /**
     * DTO for read receipts
     */
    public record ReadReceiptDto(String conversationId, Long readBy, Instant readAt) {}
}
