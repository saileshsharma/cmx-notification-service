package com.cmx.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

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
    private OffsetDateTime createdAt;

    // Transient fields for joined data
    private transient String surveyorName;
    private transient String surveyorCode;
    private transient String appointmentTitle;

    public SurveyorActivityLog() {}

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

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSurveyorId() { return surveyorId; }
    public void setSurveyorId(Long surveyorId) { this.surveyorId = surveyorId; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getPreviousValue() { return previousValue; }
    public void setPreviousValue(String previousValue) { this.previousValue = previousValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public String getSurveyorName() { return surveyorName; }
    public void setSurveyorName(String surveyorName) { this.surveyorName = surveyorName; }

    public String getSurveyorCode() { return surveyorCode; }
    public void setSurveyorCode(String surveyorCode) { this.surveyorCode = surveyorCode; }

    public String getAppointmentTitle() { return appointmentTitle; }
    public void setAppointmentTitle(String appointmentTitle) { this.appointmentTitle = appointmentTitle; }
}
