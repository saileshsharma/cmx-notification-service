package com.cmx.repository;

import com.cmx.model.InspectionReport;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface InspectionReportRepository extends CrudRepository<InspectionReport, Long> {

    @Query("SELECT * FROM inspection_report WHERE surveyor_id = :surveyorId ORDER BY submitted_at DESC LIMIT :limit OFFSET :offset")
    List<InspectionReport> findBySurveyorId(@Param("surveyorId") Long surveyorId,
                                             @Param("limit") int limit,
                                             @Param("offset") int offset);

    @Query("SELECT * FROM inspection_report WHERE appointment_id = :appointmentId ORDER BY submitted_at DESC LIMIT 1")
    Optional<InspectionReport> findByAppointmentId(@Param("appointmentId") Long appointmentId);

    @Query("SELECT * FROM inspection_report WHERE status = :status ORDER BY submitted_at DESC LIMIT :limit OFFSET :offset")
    List<InspectionReport> findByStatus(@Param("status") String status,
                                         @Param("limit") int limit,
                                         @Param("offset") int offset);

    @Query("SELECT * FROM inspection_report WHERE submitted_at >= :since ORDER BY submitted_at DESC LIMIT :limit OFFSET :offset")
    List<InspectionReport> findRecent(@Param("since") Instant since,
                                       @Param("limit") int limit,
                                       @Param("offset") int offset);

    @Query("SELECT * FROM inspection_report ORDER BY submitted_at DESC LIMIT :limit OFFSET :offset")
    List<InspectionReport> findAllPaginated(@Param("limit") int limit, @Param("offset") int offset);

    @Query("SELECT COUNT(*) FROM inspection_report WHERE surveyor_id = :surveyorId")
    int countBySurveyorId(@Param("surveyorId") Long surveyorId);

    @Query("SELECT COUNT(*) FROM inspection_report WHERE status = :status")
    int countByStatus(@Param("status") String status);

    @Query("SELECT COUNT(*) FROM inspection_report WHERE submitted_at >= :since")
    int countSince(@Param("since") Instant since);

    @Query("""
        SELECT ir.*
        FROM inspection_report ir
        WHERE (:surveyorId IS NULL OR ir.surveyor_id = :surveyorId)
        AND (:status IS NULL OR ir.status = :status)
        AND ir.submitted_at >= :since
        ORDER BY ir.submitted_at DESC
        LIMIT :limit OFFSET :offset
    """)
    List<InspectionReport> findWithFilters(@Param("surveyorId") Long surveyorId,
                                            @Param("status") String status,
                                            @Param("since") Instant since,
                                            @Param("limit") int limit,
                                            @Param("offset") int offset);
}
