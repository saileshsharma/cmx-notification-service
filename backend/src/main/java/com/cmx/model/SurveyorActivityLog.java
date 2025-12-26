package com.cmx.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Data
@NoArgsConstructor
@Table("surveyor_activity_log")
public class SurveyorActivityLog {

    public enum ActivityType {
        STATUS_CHANGE,      // AVAILABLE, BUSY, OFFLINE
        JOB_UPDATE,         // ON_WAY, ARRIVED, INSPECTING, COMPLETED
        LOCATION_UPDATE,    // GPS location change
        LOGIN,              // Surveyor logged in
        LOGOUT              // Surveyor logged out
    }

    @Id
    private Long id;

    @Column("surveyor_id")
    private Long surveyorId;

    @Column("activity_type")
    private String activityType;

    @Column("previous_value")
    private String previousValue;

    @Column("new_value")
    private String newValue;

    @Column("appointment_id")
    private Long appointmentId;

    private Double latitude;

    private Double longitude;

    private String notes;

    @Column("created_at")
    private Instant createdAt;

    // Transient fields for joined data (not persisted to DB)
    @Transient
    private String surveyorName;
    @Transient
    private String surveyorCode;
    @Transient
    private String appointmentTitle;

    public SurveyorActivityLog(Long surveyorId, ActivityType activityType, String previousValue,
                                String newValue, Long appointmentId, Double latitude,
                                Double longitude, String notes) {
        this.surveyorId = surveyorId;
        this.activityType = activityType.name();
        this.previousValue = previousValue;
        this.newValue = newValue;
        this.appointmentId = appointmentId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.notes = notes;
        this.createdAt = Instant.now();
    }

    // Static factory methods
    public static SurveyorActivityLog statusChange(Long surveyorId, String previousStatus, String newStatus,
                                                     Double lat, Double lng) {
        return new SurveyorActivityLog(surveyorId, ActivityType.STATUS_CHANGE, previousStatus, newStatus,
                null, lat, lng, null);
    }

    public static SurveyorActivityLog jobUpdate(Long surveyorId, String previousState, String newState,
                                                  Long appointmentId, Double lat, Double lng, String notes) {
        return new SurveyorActivityLog(surveyorId, ActivityType.JOB_UPDATE, previousState, newState,
                appointmentId, lat, lng, notes);
    }

    public static SurveyorActivityLog login(Long surveyorId, Double lat, Double lng) {
        return new SurveyorActivityLog(surveyorId, ActivityType.LOGIN, null, "LOGGED_IN",
                null, lat, lng, null);
    }

    public static SurveyorActivityLog logout(Long surveyorId) {
        return new SurveyorActivityLog(surveyorId, ActivityType.LOGOUT, "LOGGED_IN", "LOGGED_OUT",
                null, null, null, null);
    }
}
