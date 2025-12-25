package com.cmx.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("surveyor")
public class Surveyor {

    @Id
    private Long id;

    private String code;

    @Column("display_name")
    private String displayName;

    @Column("home_lat")
    private Double homeLat;

    @Column("home_lng")
    private Double homeLng;

    private String status;

    @Column("surveyor_type")
    private String surveyorType;

    private String email;

    private String phone;

    @Column("current_lat")
    private Double currentLat;

    @Column("current_lng")
    private Double currentLng;

    @Column("current_status")
    private String currentStatus; // AVAILABLE, BUSY, OFFLINE

    @Column("last_location_update")
    private java.time.OffsetDateTime lastLocationUpdate;

    private String password;

    public Surveyor() {}

    public Surveyor(Long id, String code, String displayName, Double homeLat, Double homeLng,
                    String status, String surveyorType, String email, String phone) {
        this.id = id;
        this.code = code;
        this.displayName = displayName;
        this.homeLat = homeLat;
        this.homeLng = homeLng;
        this.status = status;
        this.surveyorType = surveyorType;
        this.email = email;
        this.phone = phone;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public Double getHomeLat() { return homeLat; }
    public void setHomeLat(Double homeLat) { this.homeLat = homeLat; }

    public Double getHomeLng() { return homeLng; }
    public void setHomeLng(Double homeLng) { this.homeLng = homeLng; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSurveyorType() { return surveyorType; }
    public void setSurveyorType(String surveyorType) { this.surveyorType = surveyorType; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean hasEmail() {
        return email != null && !email.isBlank();
    }

    public boolean hasPhone() {
        return phone != null && !phone.isBlank();
    }

    public Double getCurrentLat() { return currentLat; }
    public void setCurrentLat(Double currentLat) { this.currentLat = currentLat; }

    public Double getCurrentLng() { return currentLng; }
    public void setCurrentLng(Double currentLng) { this.currentLng = currentLng; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public java.time.OffsetDateTime getLastLocationUpdate() { return lastLocationUpdate; }
    public void setLastLocationUpdate(java.time.OffsetDateTime lastLocationUpdate) { this.lastLocationUpdate = lastLocationUpdate; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
