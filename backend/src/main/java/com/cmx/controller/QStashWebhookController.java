package com.cmx.controller;

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
 * QStash Webhook Controller v1.0.1
 * Receives location and status updates from mobile devices via Upstash QStash.
 *
 * Flow: Mobile App -> QStash -> This Webhook -> Database
 */
@RestController
@RequestMapping("/api/webhook/qstash")
@CrossOrigin(origins = "*")
@Tag(name = "QStash Webhook", description = "Webhook endpoints for QStash message delivery")
public class QStashWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(QStashWebhookController.class);

    private final SurveyorService surveyorService;

    @Value("${qstash.current-signing-key:}")
    private String currentSigningKey;

    @Value("${qstash.next-signing-key:}")
    private String nextSigningKey;

    public QStashWebhookController(SurveyorService surveyorService) {
        this.surveyorService = surveyorService;
    }

    @Operation(
        summary = "Receive location update from QStash",
        description = "Webhook endpoint that receives surveyor location updates delivered by QStash"
    )
    @PostMapping("/location")
    public ResponseEntity<Map<String, Object>> receiveLocationUpdate(
            @RequestHeader(value = "Upstash-Signature", required = false) String signature,
            @RequestBody Map<String, Object> payload) {

        logger.info("Received QStash location webhook: {}", payload);

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

            if ("location".equals(type) || "location_status".equals(type)) {
                Long surveyorId = ((Number) payload.get("surveyorId")).longValue();
                Double lat = payload.get("lat") != null ? ((Number) payload.get("lat")).doubleValue() : null;
                Double lng = payload.get("lng") != null ? ((Number) payload.get("lng")).doubleValue() : null;
                String status = (String) payload.get("status");

                boolean success;
                if (lat != null && lng != null && status != null) {
                    success = surveyorService.updateLocationAndStatus(surveyorId, lat, lng, status);
                    logger.info("Updated location and status for surveyor {}: ({}, {}) - {}", surveyorId, lat, lng, status);
                } else if (lat != null && lng != null) {
                    success = surveyorService.updateLocation(surveyorId, lat, lng);
                    logger.info("Updated location for surveyor {}: ({}, {})", surveyorId, lat, lng);
                } else if (status != null) {
                    success = surveyorService.updateStatus(surveyorId, status);
                    logger.info("Updated status for surveyor {}: {}", surveyorId, status);
                } else {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "No location or status provided"
                    ));
                }

                return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Update processed" : "Failed to update"
                ));

            } else if ("status".equals(type)) {
                Long surveyorId = ((Number) payload.get("surveyorId")).longValue();
                String status = (String) payload.get("status");

                boolean success = surveyorService.updateStatus(surveyorId, status);
                logger.info("Updated status for surveyor {}: {}", surveyorId, status);

                return ResponseEntity.ok(Map.of(
                    "success", success,
                    "message", success ? "Status updated" : "Failed to update status"
                ));

            } else if ("appointment_response".equals(type)) {
                // Handle appointment accept/reject via QStash
                Long appointmentId = ((Number) payload.get("appointmentId")).longValue();
                Long surveyorId = ((Number) payload.get("surveyorId")).longValue();
                String response = (String) payload.get("response"); // ACCEPTED or REJECTED

                logger.info("Appointment response via QStash: appointmentId={}, surveyorId={}, response={}",
                    appointmentId, surveyorId, response);

                // This would need AvailabilityService - for now just log it
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Appointment response received (processing not implemented yet)"
                ));

            } else {
                logger.warn("Unknown payload type: {}", type);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Unknown payload type: " + type
                ));
            }

        } catch (Exception e) {
            logger.error("Error processing QStash webhook", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
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
