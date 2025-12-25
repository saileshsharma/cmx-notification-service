package com.cmx.controller;

import com.cmx.dto.DeviceTokenDto.DeviceTokenRequest;
import com.cmx.dto.NotificationDto.NotificationAuditEntry;
import com.cmx.service.AvailabilityService;
import com.cmx.service.DeviceTokenService;
import com.cmx.service.NotificationAuditService;
import com.cmx.service.NotificationService;
import com.cmx.service.SurveyorService;
import com.cmx.service.SurveyorActivityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
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
    private final NotificationService notificationService;
    private final SurveyorActivityService activityService;
    private final com.cmx.repository.SurveyorRepository surveyorRepository;

    public MobileController(DeviceTokenService deviceTokenService,
                            NotificationAuditService auditService,
                            AvailabilityService availabilityService,
                            SurveyorService surveyorService,
                            NotificationService notificationService,
                            SurveyorActivityService activityService,
                            com.cmx.repository.SurveyorRepository surveyorRepository) {
        this.deviceTokenService = deviceTokenService;
        this.auditService = auditService;
        this.availabilityService = availabilityService;
        this.surveyorService = surveyorService;
        this.notificationService = notificationService;
        this.activityService = activityService;
        this.surveyorRepository = surveyorRepository;
    }

    // ==================== Authentication ====================

    @Operation(
        summary = "Login surveyor",
        description = "Authenticates a surveyor with email and password, and automatically registers the device"
    )
    @ApiResponse(responseCode = "200", description = "Login successful")
    @ApiResponse(responseCode = "401", description = "Invalid credentials")
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String password = (String) request.get("password");
        String pushToken = (String) request.get("pushToken");
        String platform = (String) request.get("platform"); // ANDROID or IOS

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Email and password are required"
            ));
        }

        var surveyorOpt = surveyorRepository.findByEmail(email);
        if (surveyorOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Invalid email or password"
            ));
        }

        var surveyor = surveyorOpt.get();
        if (!password.equals(surveyor.getPassword())) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Invalid email or password"
            ));
        }

        // Auto-register device if push token is provided
        if (pushToken != null && !pushToken.isEmpty()) {
            deviceTokenService.registerToken(surveyor.getId(), pushToken, platform != null ? platform : "ANDROID");
        }

        // Log login activity (async, don't block login on failure)
        Double lat = request.get("lat") != null ? ((Number) request.get("lat")).doubleValue() : null;
        Double lng = request.get("lng") != null ? ((Number) request.get("lng")).doubleValue() : null;
        try {
            activityService.logLogin(surveyor.getId(), lat, lng);
        } catch (Exception e) {
            // Don't fail login if activity logging fails
            org.slf4j.LoggerFactory.getLogger(MobileController.class)
                .warn("Failed to log login activity for surveyor {}: {}", surveyor.getId(), e.getMessage());
        }

        // Build response with surveyor details
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", "Login successful");
        response.put("surveyor", Map.of(
            "id", surveyor.getId(),
            "code", surveyor.getCode(),
            "displayName", surveyor.getDisplayName(),
            "email", surveyor.getEmail() != null ? surveyor.getEmail() : "",
            "phone", surveyor.getPhone() != null ? surveyor.getPhone() : "",
            "surveyorType", surveyor.getSurveyorType(),
            "currentStatus", surveyor.getCurrentStatus() != null ? surveyor.getCurrentStatus() : "AVAILABLE"
        ));

        return ResponseEntity.ok(response);
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
            @Parameter(description = "Surveyor ID") @PathVariable("surveyorId") Long surveyorId,
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
            @Parameter(description = "Appointment ID") @PathVariable("appointmentId") Long appointmentId,
            @RequestBody Map<String, Object> request) {
        Long surveyorId = ((Number) request.get("surveyorId")).longValue();
        String response = (String) request.get("response"); // ACCEPTED or REJECTED

        // Get appointment details before responding (for notification)
        var appointmentDetails = availabilityService.getAppointmentById(appointmentId);

        boolean success = availabilityService.respondToAppointment(appointmentId, surveyorId, response);

        if (success) {
            // Send confirmation notification to the surveyor
            if (appointmentDetails != null) {
                notificationService.sendAppointmentResponseConfirmation(
                    surveyorId,
                    appointmentId,
                    (String) appointmentDetails.get("title"),
                    java.time.OffsetDateTime.parse((String) appointmentDetails.get("start_time")),
                    java.time.OffsetDateTime.parse((String) appointmentDetails.get("end_time")),
                    response
                );
            }

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
        description = "Updates the current availability status of a surveyor (AVAILABLE, BUSY, OFFLINE) and notifies dispatcher"
    )
    @ApiResponse(responseCode = "200", description = "Status updated successfully")
    @PostMapping("/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@RequestBody Map<String, Object> request) {
        Long surveyorId = ((Number) request.get("surveyorId")).longValue();
        String newStatus = (String) request.get("status"); // AVAILABLE, BUSY, OFFLINE
        Double lat = request.get("lat") != null ? ((Number) request.get("lat")).doubleValue() : null;
        Double lng = request.get("lng") != null ? ((Number) request.get("lng")).doubleValue() : null;

        // Get previous status
        var surveyor = surveyorRepository.findById(surveyorId).orElse(null);
        String previousStatus = surveyor != null ? surveyor.getCurrentStatus() : null;

        boolean success = surveyorService.updateStatus(surveyorId, newStatus);

        if (success) {
            // Log activity and notify dispatcher (don't fail on logging errors)
            try {
                activityService.logStatusChange(surveyorId, previousStatus, newStatus, lat, lng);
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(MobileController.class)
                    .warn("Failed to log status change for surveyor {}: {}", surveyorId, e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
            "success", success,
            "message", success ? "Status updated to " + newStatus : "Failed to update status"
        ));
    }

    @Operation(
        summary = "Update job status (quick update)",
        description = "Updates the job progress status (ON_WAY, ARRIVED, INSPECTING, COMPLETED) and notifies dispatcher"
    )
    @ApiResponse(responseCode = "200", description = "Job status updated successfully")
    @PostMapping("/job-update")
    public ResponseEntity<Map<String, Object>> updateJobStatus(@RequestBody Map<String, Object> request) {
        Long surveyorId = ((Number) request.get("surveyorId")).longValue();
        String newState = (String) request.get("status"); // ON_WAY, ARRIVED, INSPECTING, COMPLETED
        Long appointmentId = request.get("appointmentId") != null ? ((Number) request.get("appointmentId")).longValue() : null;
        Double lat = request.get("lat") != null ? ((Number) request.get("lat")).doubleValue() : null;
        Double lng = request.get("lng") != null ? ((Number) request.get("lng")).doubleValue() : null;
        String notes = (String) request.get("notes");

        // Get previous job state
        String previousState = null;
        try {
            previousState = activityService.getLastJobState(surveyorId);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(MobileController.class)
                .warn("Failed to get last job state for surveyor {}: {}", surveyorId, e.getMessage());
        }

        // Log activity and notify dispatcher (don't fail on logging errors)
        try {
            activityService.logJobUpdate(surveyorId, previousState, newState, appointmentId, lat, lng, notes);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(MobileController.class)
                .warn("Failed to log job update for surveyor {}: {}", surveyorId, e.getMessage());
        }

        // Also update location if provided
        if (lat != null && lng != null) {
            surveyorService.updateLocation(surveyorId, lat, lng);
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Job status updated to " + newState
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
            @Parameter(description = "Surveyor ID") @PathVariable("surveyorId") Long surveyorId) {
        return ResponseEntity.ok(surveyorService.getSurveyorDetails(surveyorId));
    }
}
