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
@Table("dispatch_offer")
public class DispatchOffer {

    public enum Status {
        PENDING, ACCEPTED, CLOSED, EXPIRED
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

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("expires_at")
    private OffsetDateTime expiresAt;

    @Column("accepted_at")
    private OffsetDateTime acceptedAt;

    public DispatchOffer(UUID offerGroup, String fnolId, Long surveyorId, OffsetDateTime expiresAt) {
        this.offerGroup = offerGroup.toString();
        this.fnolId = fnolId;
        this.surveyorId = surveyorId;
        this.status = Status.PENDING.name();
        this.expiresAt = expiresAt;
    }
}
