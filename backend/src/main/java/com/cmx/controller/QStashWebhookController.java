package com.cmx.controller;

import com.cmx.service.LocationBroadcastService;
import com.cmx.service.SurveyorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * QStash Webhook Controller v1.0.3
 * Receives location and status updates from mobile devices via Upstash QStash.
 * Now broadcasts updates to connected SSE clients for real-time tracking.
 *
 * Flow: Mobile App -> QStash -> This Webhook -> Database -> SSE Broadcast
 *
 * Enhanced logging for message visibility and debugging.
 */
@RestController
@RequestMapping("/api/webhook/qstash")
@CrossOrigin(origins = "*")
@Tag(name = "QStash Webhook", description = "Webhook endpoints for QStash message delivery")
public class QStashWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(QStashWebhookController.class);

    // Track message statistics
    private long totalMessagesReceived = 0;
    private long locationUpdates = 0;
    private long statusUpdates = 0;
    private long appointmentResponses = 0;
    private long failedMessages = 0;

    private final SurveyorService surveyorService;
    private final LocationBroadcastService broadcastService;

    @Value("${qstash.current-signing-key:}")
    private String currentSigningKey;

    @Value("${qstash.next-signing-key:}")
    private String nextSigningKey;

    public QStashWebhookController(SurveyorService surveyorService, LocationBroadcastService broadcastService) {
        this.surveyorService = surveyorService;
        this.broadcastService = broadcastService;
    }

    @Operation(
        summary = "Receive location update from QStash",
        description = "Webhook endpoint that receives surveyor location updates delivered by QStash"
    )
    @PostMapping("/location")
    public ResponseEntity<Map<String, Object>> receiveLocationUpdate(
            @RequestHeader(value = "Upstash-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        totalMessagesReceived++;
        logger.info("========== QSTASH MESSAGE #{} ==========", totalMessagesReceived);
        logger.info("Received QStash location webhook: {}", payload);
        logger.info("Headers - Upstash-Signature: {}", signature != null ? "present" : "missing");

        // Verify signature in production (skip if keys not configured)
        // In production, you should always verify the signature
        if (signature != null && !signature.isEmpty() && currentSigningKey != null && !currentSigningKey.isEmpty()) {
            // Signature verification would go here
            // For now, we'll trust the request if it has the right structure
            logger.debug("QStash signature present: {}", signature.substring(0, 20) + "...");
        }

        try {
            // Extract payload data
            String type = (String) payload.get("type");
            logger.info("Message type: {}", type);

            if ("location".equals(type) || "location_status".equals(type)) {
                locationUpdates++;
                Long surveyorId = ((Number) payload.get("surveyorId")).longValue();
                Double lat = payload.get("lat") != null ? ((Number) payload.get("lat")).doubleValue() : null;
                Double lng = payload.get("lng") != null ? ((Number) payload.get("lng")).doubleValue() : null;
                String status = (String) payload.get("status");

                logger.info("LOCATION UPDATE - Surveyor: {}, Lat: {}, Lng: {}, Status: {}",
                    surveyorId, lat, lng, status);

                // Get surveyor name for broadcast
                String displayName = null;
                try {
                    var details = surveyorService.getSurveyorDetails(surveyorId);
                    displayName = (String) details.get("display_name");
                    logger.info("Surveyor name resolved: {}", displayName);
                } catch (Exception e) {
                    logger.warn("Could not get surveyor name for broadcast: {}", e.getMessage());
                }

                boolean success;
                if (lat != null && lng != null && status != null) {
                    success = surveyorService.updateLocationAndStatus(surveyorId, lat, lng, status);
                    logger.info("SUCCESS: Updated location and status for surveyor {} ({}): ({}, {}) - {}",
                        surveyorId, displayName, lat, lng, status);
                    // Broadcast to connected SSE clients
                    broadcastService.broadcastLocationUpdate(surveyorId, lat, lng, status, displayName);
                    logger.info("SSE broadcast sent to {} active clients", broadcastService.getActiveClientCount());
                } else if (lat != null && lng != null) {
                    success = surveyorService.updateLocation(surveyorId, lat, lng);
                    logger.info("SUCCESS: Updated location for surveyor {} ({}): ({}, {})",
                        surveyorId, displayName, lat, lng);
                    // Broadcast to connected SSE clients
                    broadcastService.broadcastLocationUpdate(surveyorId, lat, lng, status, displayName);
                    logger.info("SSE broadcast sent to {} active clients", broadcastService.getActiveClientCount());
                } else if (status != null) {
                    success = surveyorService.updateStatus(surveyorId, status);
                    logger.info("SUCCESS: Updated status for surveyor {} ({}): {}", surveyorId, displayName, status);
                    // Broadcast status-only update
                    broadcastService.broadcastStatusUpdate(surveyorId, status, displayName);
                    logger.info("SSE status broadcast sent to {} active clients", broadcastService.getActiveClientCount());
                } else {
                    failedMessages++;
                    logger.error("FAILED: No location or status provided in payload");
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "No location or status provided"
                    ));
                }

                logger.info("========== END QSTASH MESSAGE #{} (SUCCESS) ==========", totalMessagesReceived);
                return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Update processed" : "Failed to update"
                ));

            } else if ("status".equals(type)) {
                statusUpdates++;
                Long surveyorId = ((Number) payload.get("surveyorId")).longValue();
                String status = (String) payload.get("status");

                logger.info("STATUS UPDATE - Surveyor: {}, New Status: {}", surveyorId, status);

                // Get surveyor name for broadcast
                String displayName = null;
                try {
                    var details = surveyorService.getSurveyorDetails(surveyorId);
                    displayName = (String) details.get("display_name");
                    logger.info("Surveyor name resolved: {}", displayName);
                } catch (Exception e) {
                    logger.warn("Could not get surveyor name for broadcast: {}", e.getMessage());
                }

                boolean success = surveyorService.updateStatus(surveyorId, status);
                logger.info("SUCCESS: Updated status for surveyor {} ({}): {}", surveyorId, displayName, status);

                // Broadcast status update
                broadcastService.broadcastStatusUpdate(surveyorId, status, displayName);
                logger.info("SSE status broadcast sent to {} active clients", broadcastService.getActiveClientCount());

                logger.info("========== END QSTASH MESSAGE #{} (SUCCESS) ==========", totalMessagesReceived);
                return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Status updated" : "Failed to update status"
                ));

            } else if ("appointment_response".equals(type)) {
                appointmentResponses++;
                // Handle appointment accept/reject via QStash
                Long appointmentId = ((Number) payload.get("appointmentId")).longValue();
                Long surveyorId = ((Number) payload.get("surveyorId")).longValue();
                String response = (String) payload.get("response"); // ACCEPTED or REJECTED

                logger.info("APPOINTMENT RESPONSE - AppointmentId: {}, SurveyorId: {}, Response: {}",
                    appointmentId, surveyorId, response);

                // This would need AvailabilityService - for now just log it
                logger.info("========== END QSTASH MESSAGE #{} (SUCCESS) ==========", totalMessagesReceived);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Appointment response received (processing not implemented yet)"
                ));

            } else {
                failedMessages++;
                logger.warn("UNKNOWN TYPE: {}", type);
                logger.info("========== END QSTASH MESSAGE #{} (FAILED - Unknown type) ==========", totalMessagesReceived);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Unknown payload type: " + type
                ));
            }

        } catch (Exception e) {
            failedMessages++;
            logger.error("ERROR processing QStash webhook: {}", e.getMessage(), e);
            logger.info("========== END QSTASH MESSAGE #{} (ERROR) ==========", totalMessagesReceived);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Get QStash message statistics for monitoring
     */
    @Operation(
        summary = "Get QStash message statistics",
        description = "Returns statistics about QStash messages received since server start"
    )
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "status", "running",
            "totalMessagesReceived", totalMessagesReceived,
            "locationUpdates", locationUpdates,
            "statusUpdates", statusUpdates,
            "appointmentResponses", appointmentResponses,
            "failedMessages", failedMessages,
            "activeSSEClients", broadcastService.getActiveClientCount(),
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Health check endpoint for QStash to verify webhook is reachable
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "service", "qstash-webhook",
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Verify QStash signature (optional but recommended for production)
     */
    private boolean verifySignature(String signature, String body, String signingKey) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(signingKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = Base64.getEncoder().encodeToString(hash);
            return signature.equals(expectedSignature);
        } catch (Exception e) {
            logger.error("Error verifying signature", e);
            return false;
        }
    }
}
