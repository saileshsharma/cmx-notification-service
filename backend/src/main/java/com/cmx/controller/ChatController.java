package com.cmx.controller;

import com.cmx.dto.ChatConversationDto;
import com.cmx.dto.ChatMessageDto;
import com.cmx.dto.TypingIndicatorDto;
import com.cmx.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Chat", description = "Chat messaging endpoints")
public class ChatController {

    private final ChatService chatService;

    // ============ WebSocket Message Handlers ============

    /**
     * Handle incoming chat messages via WebSocket
     * Client sends to: /app/chat.send
     */
    @MessageMapping("/chat.send")
    public void handleChatMessage(@Payload ChatMessageDto message) {
        log.info("WebSocket message received: {} -> {}", message.senderId(), message.recipientId());
        chatService.sendMessage(message);
    }

    /**
     * Handle typing indicator via WebSocket
     * Client sends to: /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTypingIndicator(@Payload TypingIndicatorDto indicator) {
        chatService.sendTypingIndicator(indicator);
    }

    /**
     * Handle read receipt via WebSocket
     * Client sends to: /app/chat.read
     */
    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload Map<String, Object> payload) {
        String conversationId = (String) payload.get("conversationId");
        Long recipientId = Long.valueOf(payload.get("recipientId").toString());
        String recipientType = (String) payload.get("recipientType");
        chatService.markAsRead(conversationId, recipientId, recipientType);
    }

    // ============ REST Endpoints ============

    /**
     * Get message history for a conversation
     */
    @GetMapping("/messages/{conversationId}")
    @Operation(summary = "Get chat message history")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset) {

        List<ChatMessageDto> messages = chatService.getMessageHistory(conversationId, limit, offset);
        return ResponseEntity.ok(messages);
    }

    /**
     * Send a message via REST (alternative to WebSocket)
     */
    @PostMapping("/messages")
    @Operation(summary = "Send a chat message")
    public ResponseEntity<ChatMessageDto> sendMessage(@RequestBody ChatMessageDto message) {
        ChatMessageDto sent = chatService.sendMessage(message);
        return ResponseEntity.ok(sent);
    }

    /**
     * Get conversations for a surveyor
     */
    @GetMapping("/conversations/surveyor/{surveyorId}")
    @Operation(summary = "Get conversations for a surveyor")
    public ResponseEntity<List<ChatConversationDto>> getSurveyorConversations(
            @PathVariable Long surveyorId) {

        List<ChatConversationDto> conversations = chatService.getConversationsForSurveyor(surveyorId);
        return ResponseEntity.ok(conversations);
    }

    /**
     * Get conversations for a dispatcher
     */
    @GetMapping("/conversations/dispatcher/{dispatcherId}")
    @Operation(summary = "Get conversations for a dispatcher")
    public ResponseEntity<List<ChatConversationDto>> getDispatcherConversations(
            @PathVariable Long dispatcherId) {

        List<ChatConversationDto> conversations = chatService.getConversationsForDispatcher(dispatcherId);
        return ResponseEntity.ok(conversations);
    }

    /**
     * Start a new conversation
     */
    @PostMapping("/conversations/start")
    @Operation(summary = "Start a new conversation between surveyor and dispatcher")
    public ResponseEntity<Map<String, String>> startConversation(
            @RequestParam Long surveyorId,
            @RequestParam Long dispatcherId) {

        String conversationId = chatService.startConversation(surveyorId, dispatcherId);
        return ResponseEntity.ok(Map.of("conversationId", conversationId));
    }

    /**
     * Mark messages as read
     */
    @PostMapping("/messages/read")
    @Operation(summary = "Mark messages as read")
    public ResponseEntity<Void> markAsRead(
            @RequestParam String conversationId,
            @RequestParam Long recipientId,
            @RequestParam String recipientType) {

        chatService.markAsRead(conversationId, recipientId, recipientType);
        return ResponseEntity.ok().build();
    }

    /**
     * Get unread message count
     */
    @GetMapping("/unread")
    @Operation(summary = "Get unread message count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount(
            @RequestParam Long userId,
            @RequestParam String userType) {

        int count = chatService.getUnreadCount(userId, userType);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
