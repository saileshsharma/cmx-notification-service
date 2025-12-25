package com.cmx.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@Table("device_token")
public class DeviceToken {

    public enum Platform {
        ANDROID, IOS
    }

    @Id
    private Long id;

    @Column("surveyor_id")
    private Long surveyorId;

    private String token;

    private String platform;

    @Column("created_at")
    private OffsetDateTime createdAt;

    @Column("updated_at")
    private OffsetDateTime updatedAt;

    public DeviceToken(Long surveyorId, String token, String platform) {
        this.surveyorId = surveyorId;
        this.token = token;
        this.platform = platform;
    }
}
