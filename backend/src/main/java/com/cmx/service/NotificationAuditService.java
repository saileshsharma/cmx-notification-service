package com.cmx.service;

import com.cmx.dto.NotificationDto.NotificationAuditEntry;
import com.cmx.dto.NotificationDto.NotificationStats;
import com.cmx.model.NotificationLog;
import com.cmx.repository.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class NotificationAuditService {

    private static final Logger log = LoggerFactory.getLogger(NotificationAuditService.class);

    private final NotificationLogRepository notificationLogRepository;
    private final JdbcTemplate jdbc;

    public NotificationAuditService(NotificationLogRepository notificationLogRepository, JdbcTemplate jdbc) {
        this.notificationLogRepository = notificationLogRepository;
        this.jdbc = jdbc;
    }

    @Async
    public void logPushNotification(Long surveyorId, String title, String body, Map<String, String> data,
                                     String status, String errorMessage, String recipient, String externalId) {
        String eventType = data != null ? data.get("type") : null;
        log(surveyorId, NotificationLog.Channel.PUSH, eventType, title, body, data, status, errorMessage, recipient, externalId);
    }

    @Async
    public void logEmailNotification(Long surveyorId, String eventType, String subject, String recipient,
                                      String status, String errorMessage, String externalId) {
        log(surveyorId, NotificationLog.Channel.EMAIL, eventType, subject, null, null, status, errorMessage, recipient, externalId);
    }

    @Async
    public void logSmsNotification(Long surveyorId, String eventType, String message, String recipient,
                                    String status, String errorMessage, String externalId) {
        log(surveyorId, NotificationLog.Channel.SMS, eventType, "SMS", message, null, status, errorMessage, recipient, externalId);
    }

    private void log(Long surveyorId, NotificationLog.Channel channel, String eventType, String title, String body,
                     Map<String, String> data, String status, String errorMessage, String recipient, String externalId) {
        try {
            String dataJson = null;
            if (data != null && !data.isEmpty()) {
                dataJson = "{" + data.entrySet().stream()
                        .map(e -> "\"" + escapeJson(e.getKey()) + "\":\"" + escapeJson(e.getValue()) + "\"")
                        .reduce((a, b) -> a + "," + b)
                        .orElse("") + "}";
            }

            // Use JdbcTemplate directly to avoid type conversion issues
            jdbc.update(
                    "INSERT INTO notification_log (surveyor_id, channel, event_type, title, body, data, status, error_message, recipient, external_id, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
                    surveyorId,
                    channel.name(),
                    eventType,
                    title != null ? truncate(title, 256) : "Notification",
                    body != null ? body : "",
                    dataJson,
                    status,
                    errorMessage,
                    recipient != null ? truncate(recipient, 512) : null,
                    externalId
            );

            log.debug("Notification audit logged: channel={}, surveyorId={}, status={}", channel, surveyorId, status);
        } catch (Exception e) {
            log.error("Failed to log notification audit: {}", e.getMessage());
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return null;
        return value.length() > maxLength ? value.substring(0, maxLength) : value;
    }

    public List<NotificationAuditEntry> getNotificationHistory(Long surveyorId, String channel,
                                                                 int limit, int offset) {
        // Use JdbcTemplate for reliable query execution
        StringBuilder sql = new StringBuilder("SELECT * FROM notification_log WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (surveyorId != null) {
            sql.append(" AND surveyor_id = ?");
            params.add(surveyorId);
        }
        if (channel != null && !channel.isBlank()) {
            sql.append(" AND channel = ?");
            params.add(channel.toUpperCase());
        }

        sql.append(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.add(limit);
        params.add(offset);

        return jdbc.query(sql.toString(), (rs, rowNum) -> {
            java.sql.Timestamp createdTs = rs.getTimestamp("created_at");
            return new NotificationAuditEntry(
                    rs.getLong("id"),
                    rs.getLong("surveyor_id"),
                    rs.getString("channel"),
                    rs.getString("event_type"),
                    rs.getString("title"),
                    rs.getString("body"),
                    rs.getString("status"),
                    rs.getString("error_message"),
                    rs.getString("recipient"),
                    rs.getString("external_id"),
                    createdTs != null ? createdTs.toInstant().atOffset(java.time.ZoneOffset.UTC) : null
            );
        }, params.toArray());
    }

    public NotificationStats getNotificationStats(Long surveyorId, int hours) {
        // Using JdbcTemplate with PostgreSQL-compatible SQL
        int totalPush, totalEmail, totalSms;
        int successPush, successEmail, successSms;
        int failedTotal;

        // Use INTERVAL syntax which works in PostgreSQL
        String hoursStr = String.valueOf(hours);
        String baseQuery = "SELECT COUNT(*) FROM notification_log WHERE created_at > (CURRENT_TIMESTAMP - CAST('" + hoursStr + " hours' AS INTERVAL))";

        try {
            if (surveyorId != null) {
                totalPush = jdbc.queryForObject(baseQuery + " AND surveyor_id = ? AND channel = ?",
                        Integer.class, surveyorId, "PUSH");
                totalEmail = jdbc.queryForObject(baseQuery + " AND surveyor_id = ? AND channel = ?",
                        Integer.class, surveyorId, "EMAIL");
                totalSms = jdbc.queryForObject(baseQuery + " AND surveyor_id = ? AND channel = ?",
                        Integer.class, surveyorId, "SMS");

                successPush = jdbc.queryForObject(baseQuery + " AND surveyor_id = ? AND channel = ? AND status = ?",
                        Integer.class, surveyorId, "PUSH", "SENT");
                successEmail = jdbc.queryForObject(baseQuery + " AND surveyor_id = ? AND channel = ? AND status = ?",
                        Integer.class, surveyorId, "EMAIL", "SENT");
                successSms = jdbc.queryForObject(baseQuery + " AND surveyor_id = ? AND channel = ? AND status = ?",
                        Integer.class, surveyorId, "SMS", "SENT");

                failedTotal = jdbc.queryForObject(baseQuery + " AND surveyor_id = ? AND status = ?",
                        Integer.class, surveyorId, "FAILED");
            } else {
                totalPush = jdbc.queryForObject(baseQuery + " AND channel = ?",
                        Integer.class, "PUSH");
                totalEmail = jdbc.queryForObject(baseQuery + " AND channel = ?",
                        Integer.class, "EMAIL");
                totalSms = jdbc.queryForObject(baseQuery + " AND channel = ?",
                        Integer.class, "SMS");

                successPush = jdbc.queryForObject(baseQuery + " AND channel = ? AND status = ?",
                        Integer.class, "PUSH", "SENT");
                successEmail = jdbc.queryForObject(baseQuery + " AND channel = ? AND status = ?",
                        Integer.class, "EMAIL", "SENT");
                successSms = jdbc.queryForObject(baseQuery + " AND channel = ? AND status = ?",
                        Integer.class, "SMS", "SENT");

                failedTotal = jdbc.queryForObject(baseQuery + " AND status = ?",
                        Integer.class, "FAILED");
            }
        } catch (Exception e) {
            log.warn("Error getting notification stats: {}", e.getMessage());
            // Return zeros on error
            return new NotificationStats(hours, 0, 0, 0, 0, 0, 0, 0);
        }

        return new NotificationStats(
                hours,
                totalPush, successPush,
                totalEmail, successEmail,
                totalSms, successSms,
                failedTotal
        );
    }
}
