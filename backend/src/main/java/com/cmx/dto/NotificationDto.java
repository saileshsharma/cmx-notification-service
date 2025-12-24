package com.cmx.dto;

import java.time.OffsetDateTime;

public class NotificationDto {

    public record TestNotificationRequest(
            String title,
            String message
    ) {}

    public record TestNotificationResult(
            Long surveyorId,
            String surveyorName,
            int deviceTokenCount,
            int pushNotificationsSent,
            String pushStatus,
            String pushError,
            boolean emailSent,
            String email,
            boolean smsSent,
            String phone
    ) {}

    public record NotificationStatus(
            boolean firebaseEnabled,
            int totalSurveyors,
            int surveyorsWithDeviceTokens,
            int totalDeviceTokens,
            int notificationsLast24h
    ) {}

    public record NotificationAuditEntry(
            Long id,
            Long surveyorId,
            String channel,
            String eventType,
            String title,
            String body,
            String status,
            String errorMessage,
            String recipient,
            String externalId,
            OffsetDateTime createdAt
    ) {}

    public record NotificationStats(
            int periodHours,
            int totalPush, int successPush,
            int totalEmail, int successEmail,
            int totalSms, int successSms,
            int failedTotal
    ) {}
}
