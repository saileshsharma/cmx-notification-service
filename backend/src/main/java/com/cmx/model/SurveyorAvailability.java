package com.cmx.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
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
}
