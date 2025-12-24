package com.cmx.repository;

import com.cmx.model.SurveyorAvailability;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface AvailabilityRepository extends CrudRepository<SurveyorAvailability, Long> {

    @Query("""
        SELECT * FROM surveyor_availability
        WHERE start_time < :to AND end_time > :from
        ORDER BY surveyor_id, start_time
        LIMIT :limit OFFSET :offset
        """)
    List<SurveyorAvailability> findByTimeRange(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query("""
        SELECT * FROM surveyor_availability
        WHERE start_time < :to AND end_time > :from
        AND surveyor_id = :surveyorId
        ORDER BY surveyor_id, start_time
        LIMIT :limit OFFSET :offset
        """)
    List<SurveyorAvailability> findByTimeRangeAndSurveyorId(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("surveyorId") Long surveyorId,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query("""
        SELECT * FROM surveyor_availability
        WHERE start_time < :to AND end_time > :from
        AND surveyor_id IN (:surveyorIds)
        ORDER BY surveyor_id, start_time
        LIMIT :limit OFFSET :offset
        """)
    List<SurveyorAvailability> findByTimeRangeAndSurveyorIds(
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("surveyorIds") List<Long> surveyorIds,
            @Param("limit") int limit,
            @Param("offset") int offset
    );

    @Query("""
        SELECT state FROM surveyor_availability
        WHERE surveyor_id = :surveyorId
        AND start_time <= :now AND end_time > :now
        ORDER BY start_time DESC
        LIMIT 1
        """)
    String findCurrentState(@Param("surveyorId") Long surveyorId, @Param("now") OffsetDateTime now);

    List<SurveyorAvailability> findBySurveyorId(Long surveyorId);

    @Modifying
    @Query("""
        UPDATE surveyor_availability
        SET start_time = :startTime, end_time = :endTime, state = :state,
            title = :title, description = :description, updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """)
    int updateAvailability(
            @Param("id") Long id,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime,
            @Param("state") String state,
            @Param("title") String title,
            @Param("description") String description
    );
}
