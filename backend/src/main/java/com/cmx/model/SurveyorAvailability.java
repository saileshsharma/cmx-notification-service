package com.cmx.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

@Table("surveyor_availability")
public class SurveyorAvailability {

    @Id
    private Long id;

    @Column("surveyor_id")
    private Long surveyorId;

    @Column("start_time")
    private OffsetDateTime startTime;

    @Column("end_time")
    private OffsetDateTime endTime;

    private String state;

    private String source;

    private String title;

    private String description;

    @Column("updated_at")
    private OffsetDateTime updatedAt;

    @Column("response_status")
    private String responseStatus; // PENDING, ACCEPTED, REJECTED

    @Column("responded_at")
    private OffsetDateTime respondedAt;

    public SurveyorAvailability() {}

    public SurveyorAvailability(Long surveyorId, OffsetDateTime startTime, OffsetDateTime endTime,
                                 String state, String source, String title, String description) {
        this.surveyorId = surveyorId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.state = state;
        this.source = source;
        this.title = title;
        this.description = description;
    }

    public SurveyorAvailability(Long id, Long surveyorId, OffsetDateTime startTime, OffsetDateTime endTime,
                                 String state, String title, String description, String source,
                                 OffsetDateTime updatedAt) {
        this.id = id;
        this.surveyorId = surveyorId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.state = state;
        this.title = title;
        this.description = description;
        this.source = source;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSurveyorId() { return surveyorId; }
    public void setSurveyorId(Long surveyorId) { this.surveyorId = surveyorId; }

    public OffsetDateTime getStartTime() { return startTime; }
    public void setStartTime(OffsetDateTime startTime) { this.startTime = startTime; }

    public OffsetDateTime getEndTime() { return endTime; }
    public void setEndTime(OffsetDateTime endTime) { this.endTime = endTime; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getResponseStatus() { return responseStatus; }
    public void setResponseStatus(String responseStatus) { this.responseStatus = responseStatus; }

    public OffsetDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(OffsetDateTime respondedAt) { this.respondedAt = respondedAt; }
}
