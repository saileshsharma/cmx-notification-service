package com.cmx.repository;

import com.cmx.model.SurveyorActivityLog;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface SurveyorActivityLogRepository extends CrudRepository<SurveyorActivityLog, Long> {

    @Query("SELECT * FROM surveyor_activity_log WHERE surveyor_id = :surveyorId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    List<SurveyorActivityLog> findBySurveyorId(@Param("surveyorId") Long surveyorId,
                                                @Param("limit") int limit,
                                                @Param("offset") int offset);

    @Query("SELECT * FROM surveyor_activity_log WHERE activity_type = :activityType ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    List<SurveyorActivityLog> findByActivityType(@Param("activityType") String activityType,
                                                   @Param("limit") int limit,
                                                   @Param("offset") int offset);

    @Query("SELECT * FROM surveyor_activity_log WHERE created_at >= :since ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    List<SurveyorActivityLog> findRecent(@Param("since") OffsetDateTime since,
                                          @Param("limit") int limit,
                                          @Param("offset") int offset);

    @Query("SELECT * FROM surveyor_activity_log ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    List<SurveyorActivityLog> findAllPaginated(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT * FROM surveyor_activity_log WHERE surveyor_id = :surveyorId AND activity_type = :activityType ORDER BY created_at DESC LIMIT 1")
    SurveyorActivityLog findLatestBySurveyorAndType(@Param("surveyorId") Long surveyorId,
                                                     @Param("activityType") String activityType);

    @Query("SELECT * FROM surveyor_activity_log WHERE appointment_id = :appointmentId ORDER BY created_at DESC")
    List<SurveyorActivityLog> findByAppointmentId(@Param("appointmentId") Long appointmentId);

    @Query("SELECT COUNT(*) FROM surveyor_activity_log WHERE surveyor_id = :surveyorId AND activity_type = :activityType AND created_at >= :since")
    int countBySurveyorAndTypeSince(@Param("surveyorId") Long surveyorId,
                                     @Param("activityType") String activityType,
                                     @Param("since") OffsetDateTime since);

    @Query("""
        SELECT sal.*, s.display_name as surveyor_name, s.code as surveyor_code, a.title as appointment_title
        FROM surveyor_activity_log sal
        LEFT JOIN surveyor s ON sal.surveyor_id = s.id
        LEFT JOIN appointment a ON sal.appointment_id = a.id
        WHERE (:surveyorId IS NULL OR sal.surveyor_id = :surveyorId)
        AND (:activityType IS NULL OR sal.activity_type = :activityType)
        AND sal.created_at >= :since
        ORDER BY sal.created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    List<SurveyorActivityLog> findWithFilters(@Param("surveyorId") Long surveyorId,
                                               @Param("activityType") String activityType,
                                               @Param("since") OffsetDateTime since,
                                               @Param("limit") int limit,
                                               @Param("offset") int offset);
}
