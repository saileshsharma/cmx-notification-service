package com.cmx.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@Table("notification_log")
public class NotificationLog {

    public enum Channel {
        PUSH, EMAIL, SMS
    }

    public enum EventType {
        APPOINTMENT_CREATED,
        APPOINTMENT_UPDATED,
        APPOINTMENT_DELETED,
        TEST_NOTIFICATION,
        DISPATCH_OFFER
    }

    @Id
    private Long id;

    @Column("surveyor_id")
    private Long surveyorId;

    private String channel;

    @Column("event_type")
    private String eventType;

    private String title;

    private String body;

    private String data;

    private String status;

    @Column("error_message")
    private String errorMessage;

    private String recipient;

    @Column("external_id")
    private String externalId;

    @Column("created_at")
    private OffsetDateTime createdAt;

    public NotificationLog(Long surveyorId, Channel channel, String eventType,
                           String title, String body, String data, String status,
                           String errorMessage, String recipient, String externalId) {
        this.surveyorId = surveyorId;
        this.channel = channel.name();
        this.eventType = eventType;
        this.title = title;
        this.body = body;
        this.data = data;
        this.status = status;
        this.errorMessage = errorMessage;
        this.recipient = recipient;
        this.externalId = externalId;
    }
}
