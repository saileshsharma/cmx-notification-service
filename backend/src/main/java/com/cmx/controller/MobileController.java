package com.cmx.controller;

import com.cmx.dto.DeviceTokenDto.DeviceTokenRequest;
import com.cmx.dto.NotificationDto.NotificationAuditEntry;
import com.cmx.service.DeviceTokenService;
import com.cmx.service.NotificationAuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mobile")
@CrossOrigin(origins = "*")
@Tag(name = "Mobile", description = "Mobile app APIs for device registration and notifications")
public class MobileController {

    private final DeviceTokenService deviceTokenService;
    private final NotificationAuditService auditService;

    public MobileController(DeviceTokenService deviceTokenService,
                            NotificationAuditService auditService) {
        this.deviceTokenService = deviceTokenService;
        this.auditService = auditService;
    }

    @Operation(
        summary = "Register device token",
        description = "Registers a mobile device push notification token for a surveyor"
    )
    @ApiResponse(responseCode = "200", description = "Device token registered successfully")
    @PostMapping("/device-token")
    public ResponseEntity<Map<String, Object>> registerDeviceToken(
            @Valid @RequestBody DeviceTokenRequest req) {
        return ResponseEntity.ok(deviceTokenService.registerToken(req.surveyorId(), req.token(), req.platform()));
    }

    @Operation(
        summary = "Unregister device token",
        description = "Removes a mobile device push notification token"
    )
    @ApiResponse(responseCode = "200", description = "Device token unregistered successfully")
    @DeleteMapping("/device-token")
    public ResponseEntity<Map<String, Object>> unregisterDeviceToken(
            @Valid @RequestBody DeviceTokenRequest req) {
        return ResponseEntity.ok(deviceTokenService.unregisterToken(req.surveyorId(), req.token()));
    }

    @Operation(
        summary = "Get notification history",
        description = "Retrieves notification history for a surveyor"
    )
    @ApiResponse(responseCode = "200", description = "Notifications retrieved successfully")
    @GetMapping("/notifications")
    public List<NotificationAuditEntry> getNotifications(
            @Parameter(description = "Surveyor ID") @RequestParam("surveyorId") Long surveyorId,
            @Parameter(description = "Maximum number of notifications to return") @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return auditService.getNotificationHistory(surveyorId, null, limit, 0);
    }
}
