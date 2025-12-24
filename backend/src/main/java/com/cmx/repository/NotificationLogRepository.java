package com.cmx.repository;

import com.cmx.model.NotificationLog;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationLogRepository extends CrudRepository<NotificationLog, Long> {

    @Query("""
        SELECT * FROM notification_log
        WHERE surveyor_id = :surveyorId
        ORDER BY created_at DESC
        LIMIT :limit
        """)
    List<NotificationLog> findBySurveyorIdOrderByCreatedAtDesc(
            @Param("surveyorId") Long surveyorId,
            @Param("limit") int limit
    );

    @Query("""
        SELECT * FROM notification_log
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    List<NotificationLog> findAllPaged(@Param("limit") int limit, @Param("offset") int offset);

    @Query("""
        SELECT * FROM notification_log
        WHERE surveyor_id = :surveyorId
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    List<NotificationLog> findBySurveyorIdPaged(
            @Param("surveyorId") Long surveyorId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query("""
        SELECT * FROM notification_log
        WHERE channel = :channel
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    List<NotificationLog> findByChannelPaged(
            @Param("channel") String channel,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query("""
        SELECT * FROM notification_log
        WHERE surveyor_id = :surveyorId AND channel = :channel
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
        """)
    List<NotificationLog> findBySurveyorIdAndChannelPaged(
            @Param("surveyorId") Long surveyorId,
            @Param("channel") String channel,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query("SELECT COUNT(*) FROM notification_log WHERE created_at > DATEADD('HOUR', -:hours, CURRENT_TIMESTAMP)")
    int countRecentNotifications(@Param("hours") int hours);

    @Query("SELECT COUNT(*) FROM notification_log WHERE created_at > DATEADD('HOUR', -:hours, CURRENT_TIMESTAMP) AND channel = :channel")
    int countByChannelInHours(@Param("channel") String channel, @Param("hours") int hours);

    @Query("SELECT COUNT(*) FROM notification_log WHERE created_at > DATEADD('HOUR', -:hours, CURRENT_TIMESTAMP) AND channel = :channel AND status = :status")
    int countByChannelAndStatusInHours(@Param("channel") String channel, @Param("status") String status, @Param("hours") int hours);

    @Query("SELECT COUNT(*) FROM notification_log WHERE created_at > DATEADD('HOUR', -:hours, CURRENT_TIMESTAMP) AND status = :status")
    int countByStatusInHours(@Param("status") String status, @Param("hours") int hours);

    @Query("SELECT COUNT(*) FROM notification_log WHERE created_at > DATEADD('HOUR', -:hours, CURRENT_TIMESTAMP) AND surveyor_id = :surveyorId AND channel = :channel")
    int countBySurveyorAndChannelInHours(@Param("surveyorId") Long surveyorId, @Param("channel") String channel, @Param("hours") int hours);

    @Query("SELECT COUNT(*) FROM notification_log WHERE created_at > DATEADD('HOUR', -:hours, CURRENT_TIMESTAMP) AND surveyor_id = :surveyorId AND channel = :channel AND status = :status")
    int countBySurveyorChannelAndStatusInHours(@Param("surveyorId") Long surveyorId, @Param("channel") String channel, @Param("status") String status, @Param("hours") int hours);

    @Query("SELECT COUNT(*) FROM notification_log WHERE created_at > DATEADD('HOUR', -:hours, CURRENT_TIMESTAMP) AND surveyor_id = :surveyorId AND status = :status")
    int countBySurveyorAndStatusInHours(@Param("surveyorId") Long surveyorId, @Param("status") String status, @Param("hours") int hours);
}
