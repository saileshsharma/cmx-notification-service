package com.cmx.repository;

import com.cmx.model.JobAssignment;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface JobAssignmentRepository extends CrudRepository<JobAssignment, Long> {

    List<JobAssignment> findBySurveyorId(Long surveyorId);

    @Query("SELECT * FROM job_assignment WHERE offer_group = :offerGroup")
    List<JobAssignment> findByOfferGroup(@Param("offerGroup") UUID offerGroup);

    @Modifying
    @Query("UPDATE job_assignment SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = :id AND status = 'ASSIGNED'")
    int completeJob(@Param("id") Long id);

    @Query("SELECT * FROM job_assignment WHERE status = 'ASSIGNED' AND surveyor_id = :surveyorId")
    List<JobAssignment> findActiveJobsBySurveyorId(@Param("surveyorId") Long surveyorId);
}
