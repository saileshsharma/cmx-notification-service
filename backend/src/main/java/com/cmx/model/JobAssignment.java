package com.cmx.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Table("job_assignment")
public class JobAssignment {

    public enum Status {
        ASSIGNED, COMPLETED, CANCELLED
    }

    @Id
    private Long id;

    @Column("offer_group")
    private String offerGroup;

    @Column("fnol_id")
    private String fnolId;

    @Column("surveyor_id")
    private Long surveyorId;

    private String status;

    @Column("start_time")
    private OffsetDateTime startTime;

    @Column("end_time")
    private OffsetDateTime endTime;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("completed_at")
    private OffsetDateTime completedAt;

    public JobAssignment() {}

    public JobAssignment(UUID offerGroup, String fnolId, Long surveyorId,
                         OffsetDateTime startTime, OffsetDateTime endTime) {
        this.offerGroup = offerGroup.toString();
        this.fnolId = fnolId;
        this.surveyorId = surveyorId;
        this.status = Status.ASSIGNED.name();
        this.startTime = startTime;
        this.endTime = endTime;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOfferGroup() { return offerGroup; }
    public void setOfferGroup(String offerGroup) { this.offerGroup = offerGroup; }

    public String getFnolId() { return fnolId; }
    public void setFnolId(String fnolId) { this.fnolId = fnolId; }

    public Long getSurveyorId() { return surveyorId; }
    public void setSurveyorId(Long surveyorId) { this.surveyorId = surveyorId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }

    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
}
