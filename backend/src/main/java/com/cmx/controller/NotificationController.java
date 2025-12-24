package com.cmx.controller;

import com.cmx.dto.NotificationDto.NotificationAuditEntry;
import com.cmx.dto.NotificationDto.NotificationStats;
import com.cmx.dto.NotificationDto.NotificationStatus;
import com.cmx.dto.NotificationDto.TestNotificationRequest;
import com.cmx.dto.NotificationDto.TestNotificationResult;
import com.cmx.service.NotificationAuditService;
import com.cmx.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@Tag(name = "Notifications", description = "Notification management and history APIs")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationAuditService auditService;

    public NotificationController(NotificationService notificationService,
                                   NotificationAuditService auditService) {
        this.notificationService = notificationService;
        this.auditService = auditService;
    }

    @Operation(
        summary = "Get notification history",
        description = "Retrieves notification history with optional filters"
    )
    @ApiResponse(responseCode = "200", description = "Notification history retrieved successfully")
    @GetMapping("/notifications/history")
    public List<NotificationAuditEntry> getNotificationHistory(
            @Parameter(description = "Filter by surveyor ID") @RequestParam(value = "surveyorId", required = false) Long surveyorId,
            @Parameter(description = "Filter by channel (PUSH/EMAIL/SMS)") @RequestParam(value = "channel", required = false) String channel,
            @Parameter(description = "Maximum results") @RequestParam(value = "limit", defaultValue = "50") int limit,
            @Parameter(description = "Offset for pagination") @RequestParam(value = "offset", defaultValue = "0") int offset) {
        return auditService.getNotificationHistory(surveyorId, channel, limit, offset);
    }

    @Operation(
        summary = "Get notification statistics",
        description = "Retrieves notification statistics for a given time period"
    )
    @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
    @GetMapping("/notifications/stats")
    public NotificationStats getNotificationStats(
            @Parameter(description = "Filter by surveyor ID") @RequestParam(value = "surveyorId", required = false) Long surveyorId,
            @Parameter(description = "Time period in hours") @RequestParam(value = "hours", defaultValue = "24") int hours) {
        return auditService.getNotificationStats(surveyorId, hours);
    }

    // ============ DEV/TEST ENDPOINTS ============

    @Operation(
        summary = "Get notification service status",
        description = "Returns the current status of notification services (Firebase, Email, SMS)"
    )
    @Tag(name = "Development")
    @GetMapping("/dev/notification-status")
    public NotificationStatus getNotificationStatus() {
        return notificationService.getNotificationStatus();
    }

    @Operation(
        summary = "Send test notification",
        description = "Sends a test notification to a specific surveyor"
    )
    @Tag(name = "Development")
    @PostMapping("/dev/test-notification/{surveyorId}")
    public TestNotificationResult sendTestNotification(
            @Parameter(description = "Surveyor ID") @PathVariable("surveyorId") Long surveyorId,
            @RequestBody TestNotificationRequest req) {
        return notificationService.sendTestNotification(
                surveyorId,
                req.title() != null ? req.title() : "Test Notification",
                req.message() != null ? req.message() : "This is a test notification from CMX Dispatcher"
        );
    }

    @Operation(
        summary = "Send test notification to all",
        description = "Sends a test notification to all registered surveyors"
    )
    @Tag(name = "Development")
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
