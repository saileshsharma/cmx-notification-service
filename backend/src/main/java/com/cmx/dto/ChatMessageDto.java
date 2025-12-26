package com.cmx.dto;

import java.time.Instant;

/**
 * DTO for sending chat messages via WebSocket
 */
public record ChatMessageDto(
    Long id,
    String conversationId,
    Long senderId,
    String senderType,
    String senderName,
    Long recipientId,
    String recipientType,
    String content,
    String messageType,
    Instant sentAt,
    Instant deliveredAt,
    Instant readAt,
    String status
) {
    /**
     * Create a simple outgoing message
     */
    public static ChatMessageDto forSending(Long senderId, String senderType, String senderName,
                                            Long recipientId, String recipientType, String content) {
        String conversationId = generateConversationId(senderId, senderType, recipientId, recipientType);
        return new ChatMessageDto(
            null, conversationId, senderId, senderType, senderName,
            recipientId, recipientType, content, "TEXT",
            Instant.now(), null, null, "SENT"
        );
    }

    private static String generateConversationId(Long senderId, String senderType,
                                                   Long recipientId, String recipientType) {
        Long surveyorId = "SURVEYOR".equals(senderType) ? senderId : recipientId;
        Long dispatcherId = "DISPATCHER".equals(senderType) ? senderId : recipientId;
        return "surveyor_" + surveyorId + "_dispatcher_" + dispatcherId;
    }
}
