package com.cmx.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@Table("inspection_report")
public class InspectionReport {

    public enum Status {
        SUBMITTED,      // Initial submission from mobile
        UNDER_REVIEW,   // Being reviewed by admin
        APPROVED,       // Approved by admin
        REJECTED,       // Rejected, needs re-inspection
        ARCHIVED        // Old/archived reports
    }

    @Id
    private Long id;

    @Column("surveyor_id")
    private Long surveyorId;

    @Column("appointment_id")
    private Long appointmentId;

    @Column("vehicle_title")
    private String vehicleTitle;

    private String notes;

    @Column("photo_urls")
    private String photoUrls; // JSON array stored as string

    @Column("signature_url")
    private String signatureUrl;

    @Column("completed_steps")
    private String completedSteps; // JSON array stored as string

    @Column("total_steps")
    private Integer totalSteps;

    private Double latitude;

    private Double longitude;

    private String status;

    @Column("submitted_at")
    private Instant submittedAt;

    @Column("updated_at")
    private Instant updatedAt;

    // Transient fields for joined data (not persisted to DB)
    @Transient
    private String surveyorName;
    @Transient
    private String surveyorCode;

    public InspectionReport(Long surveyorId, Long appointmentId, String vehicleTitle,
                            String notes, String photoUrls, String signatureUrl,
                            String completedSteps, Integer totalSteps,
                            Double latitude, Double longitude) {
        this.surveyorId = surveyorId;
        this.appointmentId = appointmentId;
        this.vehicleTitle = vehicleTitle;
        this.notes = notes;
        this.photoUrls = photoUrls;
        this.signatureUrl = signatureUrl;
        this.completedSteps = completedSteps;
        this.totalSteps = totalSteps;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = Status.SUBMITTED.name();
        this.submittedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    // Helper to get photo count
    public int getPhotoCount() {
        if (photoUrls == null || photoUrls.isEmpty() || photoUrls.equals("[]")) {
            return 0;
        }
        // Count commas + 1 for simple estimation, or parse JSON properly
        return photoUrls.split(",").length;
    }

    // Helper to check if has signature
    public boolean hasSignature() {
        return signatureUrl != null && !signatureUrl.isEmpty();
    }
}
