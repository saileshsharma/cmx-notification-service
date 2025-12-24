package com.cmx.controller;

import com.cmx.dto.NotificationDto.NotificationAuditEntry;
import com.cmx.dto.NotificationDto.NotificationStats;
import com.cmx.dto.NotificationDto.NotificationStatus;
import com.cmx.dto.NotificationDto.TestNotificationRequest;
import com.cmx.dto.NotificationDto.TestNotificationResult;
import com.cmx.service.NotificationAuditService;
import com.cmx.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationAuditService auditService;

    public NotificationController(NotificationService notificationService,
                                   NotificationAuditService auditService) {
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @GetMapping("/notifications/history")
    public List<NotificationAuditEntry> getNotificationHistory(
            @RequestParam(value = "surveyorId", required = false) Long surveyorId,
            @RequestParam(value = "channel", required = false) String channel,
            @RequestParam(value = "limit", defaultValue = "50") int limit,
            @RequestParam(value = "offset", defaultValue = "0") int offset) {
        return auditService.getNotificationHistory(surveyorId, channel, limit, offset);
    }

    @GetMapping("/notifications/stats")
    public NotificationStats getNotificationStats(
            @RequestParam(value = "surveyorId", required = false) Long surveyorId,
            @RequestParam(value = "hours", defaultValue = "24") int hours) {
        return auditService.getNotificationStats(surveyorId, hours);
    }

    // ============ DEV/TEST ENDPOINTS ============

    @GetMapping("/dev/notification-status")
    public NotificationStatus getNotificationStatus() {
        return notificationService.getNotificationStatus();
    }

    @PostMapping("/dev/test-notification/{surveyorId}")
    public TestNotificationResult sendTestNotification(
            @PathVariable("surveyorId") Long surveyorId,
            @RequestBody TestNotificationRequest req) {
        return notificationService.sendTestNotification(
                surveyorId,
                req.title() != null ? req.title() : "Test Notification",
                req.message() != null ? req.message() : "This is a test notification from CMX Dispatcher"
        );
    }

    @PostMapping("/dev/test-notification-all")
    public Map<String, Object> sendTestNotificationToAll(@RequestBody TestNotificationRequest req) {
        String title = req.title() != null ? req.title() : "Test Notification";
        String message = req.message() != null ? req.message() : "This is a test notification from CMX Dispatcher";

        var results = notificationService.sendTestNotificationToAll(title, message);

        long pushSent = results.stream().mapToInt(TestNotificationResult::pushNotificationsSent).sum();
        long emailSent = results.stream().filter(TestNotificationResult::emailSent).count();
        long smsSent = results.stream().filter(TestNotificationResult::smsSent).count();

        return Map.of(
                "surveyorCount", results.size(),
                "pushNotificationsSent", pushSent,
                "emailsSent", emailSent,
                "smsSent", smsSent,
                "results", results
        );
    }
}
