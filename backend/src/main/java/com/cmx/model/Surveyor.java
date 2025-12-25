package com.cmx.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
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
    private OffsetDateTime lastLocationUpdate;

    private String password;

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

    public boolean hasEmail() {
        return email != null && !email.isBlank();
    }

    public boolean hasPhone() {
        return phone != null && !phone.isBlank();
    }
}
