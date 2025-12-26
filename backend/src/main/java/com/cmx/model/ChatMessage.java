package com.cmx.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Table("chat_message")
public class ChatMessage {

    @Id
    private Long id;

    @Column("conversation_id")
    private String conversationId;

    @Column("sender_id")
    private Long senderId;

    @Column("sender_type")
    private String senderType; // SURVEYOR or DISPATCHER

    @Column("sender_name")
    private String senderName;

    @Column("recipient_id")
    private Long recipientId;

    @Column("recipient_type")
    private String recipientType; // SURVEYOR or DISPATCHER

    @Column("content")
    private String content;

    @Column("message_type")
    private String messageType; // TEXT, IMAGE, FILE

    @Column("sent_at")
    private Instant sentAt;

    @Column("delivered_at")
    private Instant deliveredAt;

    @Column("read_at")
    private Instant readAt;

    @Column("status")
    private String status; // SENT, DELIVERED, READ

    public ChatMessage(String conversationId, Long senderId, String senderType, String senderName,
                       Long recipientId, String recipientType, String content, String messageType) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.senderType = senderType;
        this.senderName = senderName;
        this.recipientId = recipientId;
        this.recipientType = recipientType;
        this.content = content;
        this.messageType = messageType;
        this.sentAt = Instant.now();
        this.status = "SENT";
    }

    /**
     * Generate a consistent conversation ID between two parties
     */
    public static String generateConversationId(Long surveyorId, Long dispatcherId) {
        // Always put surveyor first for consistency
        return "surveyor_" + surveyorId + "_dispatcher_" + dispatcherId;
    }
}
