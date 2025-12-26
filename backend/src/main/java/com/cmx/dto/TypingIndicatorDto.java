package com.cmx.dto;

/**
 * DTO for typing indicator events
 */
public record TypingIndicatorDto(
    String conversationId,
    Long userId,
    String userType,
    String userName,
    boolean isTyping
) {}
