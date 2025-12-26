package com.cmx.repository;

import com.cmx.model.ChatMessage;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ChatMessageRepository extends CrudRepository<ChatMessage, Long> {

    /**
     * Find messages in a conversation, ordered by sent time descending
     */
    @Query("SELECT * FROM chat_message WHERE conversation_id = :conversationId ORDER BY sent_at DESC LIMIT :limit OFFSET :offset")
    List<ChatMessage> findByConversationId(@Param("conversationId") String conversationId,
                                            @Param("limit") int limit,
                                            @Param("offset") int offset);

    /**
     * Find all conversations for a surveyor
     */
    @Query("""
        SELECT DISTINCT ON (conversation_id) *
        FROM chat_message
        WHERE (sender_id = :surveyorId AND sender_type = 'SURVEYOR')
           OR (recipient_id = :surveyorId AND recipient_type = 'SURVEYOR')
        ORDER BY conversation_id, sent_at DESC
        """)
    List<ChatMessage> findConversationsForSurveyor(@Param("surveyorId") Long surveyorId);

    /**
     * Find all conversations for a dispatcher
     */
    @Query("""
        SELECT DISTINCT ON (conversation_id) *
        FROM chat_message
        WHERE (sender_id = :dispatcherId AND sender_type = 'DISPATCHER')
           OR (recipient_id = :dispatcherId AND recipient_type = 'DISPATCHER')
        ORDER BY conversation_id, sent_at DESC
        """)
    List<ChatMessage> findConversationsForDispatcher(@Param("dispatcherId") Long dispatcherId);

    /**
     * Count unread messages for a user in a conversation
     */
    @Query("""
        SELECT COUNT(*) FROM chat_message
        WHERE conversation_id = :conversationId
          AND recipient_id = :recipientId
          AND recipient_type = :recipientType
          AND read_at IS NULL
        """)
    int countUnreadMessages(@Param("conversationId") String conversationId,
                            @Param("recipientId") Long recipientId,
                            @Param("recipientType") String recipientType);

    /**
     * Count total unread messages for a user
     */
    @Query("""
        SELECT COUNT(*) FROM chat_message
        WHERE recipient_id = :recipientId
          AND recipient_type = :recipientType
          AND read_at IS NULL
        """)
    int countTotalUnreadMessages(@Param("recipientId") Long recipientId,
                                  @Param("recipientType") String recipientType);

    /**
     * Mark messages as read
     */
    @Modifying
    @Query("""
        UPDATE chat_message
        SET read_at = :readAt, status = 'READ'
        WHERE conversation_id = :conversationId
          AND recipient_id = :recipientId
          AND recipient_type = :recipientType
          AND read_at IS NULL
        """)
    void markAsRead(@Param("conversationId") String conversationId,
                    @Param("recipientId") Long recipientId,
                    @Param("recipientType") String recipientType,
                    @Param("readAt") Instant readAt);

    /**
     * Mark message as delivered
     */
    @Modifying
    @Query("UPDATE chat_message SET delivered_at = :deliveredAt, status = 'DELIVERED' WHERE id = :messageId AND delivered_at IS NULL")
    void markAsDelivered(@Param("messageId") Long messageId, @Param("deliveredAt") Instant deliveredAt);

    /**
     * Get latest message in a conversation
     */
    @Query("SELECT * FROM chat_message WHERE conversation_id = :conversationId ORDER BY sent_at DESC LIMIT 1")
    ChatMessage findLatestMessage(@Param("conversationId") String conversationId);
}
