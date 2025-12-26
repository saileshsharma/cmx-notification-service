package com.cmx.dto;

import java.time.Instant;

/**
 * DTO for conversation list display
 */
public record ChatConversationDto(
    String conversationId,
    Long otherPartyId,
    String otherPartyName,
    String otherPartyType,
    String lastMessage,
    Instant lastMessageAt,
    int unreadCount
) {}
