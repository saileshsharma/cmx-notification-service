package com.cmx.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;

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

    public NotificationLog() {}

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

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSurveyorId() { return surveyorId; }
    public void setSurveyorId(Long surveyorId) { this.surveyorId = surveyorId; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getRecipient() { return recipient; }
    public void setRecipient(String recipient) { this.recipient = recipient; }

    public String getExternalId() { return externalId; }
    public void setExternalId(String externalId) { this.externalId = externalId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
