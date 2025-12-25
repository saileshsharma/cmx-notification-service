package com.cmx.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
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

    public JobAssignment(UUID offerGroup, String fnolId, Long surveyorId,
                         OffsetDateTime startTime, OffsetDateTime endTime) {
        this.offerGroup = offerGroup.toString();
        this.fnolId = fnolId;
        this.surveyorId = surveyorId;
        this.status = Status.ASSIGNED.name();
        this.startTime = startTime;
        this.endTime = endTime;
    }
}
