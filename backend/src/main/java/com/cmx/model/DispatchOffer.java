package com.cmx.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

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

    public DispatchOffer() {}

    public DispatchOffer(UUID offerGroup, String fnolId, Long surveyorId, OffsetDateTime expiresAt) {
        this.offerGroup = offerGroup.toString();
        this.fnolId = fnolId;
        this.surveyorId = surveyorId;
        this.status = Status.PENDING.name();
        this.expiresAt = expiresAt;
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

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }

    public OffsetDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(OffsetDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
}
