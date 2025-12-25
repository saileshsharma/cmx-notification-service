package com.cmx.controller;

import com.cmx.dto.DeviceTokenDto.DeviceTokenRequest;
import com.cmx.dto.NotificationDto.NotificationAuditEntry;
import com.cmx.service.AvailabilityService;
import com.cmx.service.DeviceTokenService;
import com.cmx.service.NotificationAuditService;
import com.cmx.service.SurveyorService;
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
    private final AvailabilityService availabilityService;
    private final SurveyorService surveyorService;

    public MobileController(DeviceTokenService deviceTokenService,
                            NotificationAuditService auditService,
                            AvailabilityService availabilityService,
                            SurveyorService surveyorService) {
        this.deviceTokenService = deviceTokenService;
        this.auditService = auditService;
        this.availabilityService = availabilityService;
        this.surveyorService = surveyorService;
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

    // ==================== Appointment Management ====================

    @Operation(
        summary = "Get surveyor appointments",
        description = "Retrieves appointments for a specific surveyor"
    )
    @ApiResponse(responseCode = "200", description = "Appointments retrieved successfully")
    @GetMapping("/appointments/{surveyorId}")
    public ResponseEntity<List<Map<String, Object>>> getAppointments(
            @Parameter(description = "Surveyor ID") @PathVariable Long surveyorId,
            @Parameter(description = "Only return upcoming appointments") @RequestParam(value = "upcoming", defaultValue = "true") boolean upcomingOnly) {
        return ResponseEntity.ok(availabilityService.getAppointmentsForSurveyor(surveyorId, upcomingOnly));
    }

    @Operation(
        summary = "Respond to appointment",
        description = "Accept or reject an appointment assignment"
    )
    @ApiResponse(responseCode = "200", description = "Response recorded successfully")
    @PostMapping("/appointments/{appointmentId}/respond")
    public ResponseEntity<Map<String, Object>> respondToAppointment(
            @Parameter(description = "Appointment ID") @PathVariable Long appointmentId,
            @RequestBody Map<String, Object> request) {
        Long surveyorId = ((Number) request.get("surveyorId")).longValue();
        String response = (String) request.get("response"); // ACCEPTED or REJECTED

        boolean success = availabilityService.respondToAppointment(appointmentId, surveyorId, response);

        if (success) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Appointment " + response.toLowerCase()
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to update appointment response"
            ));
        }
    }

    // ==================== Location & Status Updates ====================

    @Operation(
        summary = "Update surveyor location",
        description = "Updates the current GPS location of a surveyor"
    )
    @ApiResponse(responseCode = "200", description = "Location updated successfully")
    @PostMapping("/location")
    public ResponseEntity<Map<String, Object>> updateLocation(@RequestBody Map<String, Object> request) {
        Long surveyorId = ((Number) request.get("surveyorId")).longValue();
        Double lat = ((Number) request.get("lat")).doubleValue();
        Double lng = ((Number) request.get("lng")).doubleValue();

        boolean success = surveyorService.updateLocation(surveyorId, lat, lng);

        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", success ? "Location updated" : "Failed to update location"
        ));
    }

    @Operation(
        summary = "Update surveyor status",
        description = "Updates the current availability status of a surveyor (AVAILABLE, BUSY, OFFLINE)"
    )
    @ApiResponse(responseCode = "200", description = "Status updated successfully")
    @PostMapping("/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@RequestBody Map<String, Object> request) {
        Long surveyorId = ((Number) request.get("surveyorId")).longValue();
        String status = (String) request.get("status"); // AVAILABLE, BUSY, OFFLINE

        boolean success = surveyorService.updateStatus(surveyorId, status);

        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", success ? "Status updated to " + status : "Failed to update status"
        ));
    }

    @Operation(
        summary = "Update location and status",
        description = "Updates both location and status in a single request"
    )
    @ApiResponse(responseCode = "200", description = "Location and status updated successfully")
    @PostMapping("/location-status")
    public ResponseEntity<Map<String, Object>> updateLocationAndStatus(@RequestBody Map<String, Object> request) {
        Long surveyorId = ((Number) request.get("surveyorId")).longValue();
        Double lat = ((Number) request.get("lat")).doubleValue();
        Double lng = ((Number) request.get("lng")).doubleValue();
        String status = (String) request.get("status");

        boolean success = surveyorService.updateLocationAndStatus(surveyorId, lat, lng, status);

        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", success ? "Location and status updated" : "Failed to update"
        ));
    }

    @Operation(
        summary = "Get surveyor details",
        description = "Gets full surveyor details including current location and status"
    )
    @ApiResponse(responseCode = "200", description = "Surveyor details retrieved successfully")
    @GetMapping("/surveyor/{surveyorId}")
    public ResponseEntity<Map<String, Object>> getSurveyorDetails(
            @Parameter(description = "Surveyor ID") @PathVariable Long surveyorId) {
        return ResponseEntity.ok(surveyorService.getSurveyorDetails(surveyorId));
    }
}
