package com.cmx.controller;

import com.cmx.service.LocationBroadcastService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/**
 * Controller for real-time location streaming via Server-Sent Events (SSE).
 * Dispatchers can subscribe to this endpoint to receive live location updates from surveyors.
 */
@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = "*")
@Tag(name = "Location Stream", description = "Real-time location updates via SSE")
public class LocationStreamController {

    private final LocationBroadcastService broadcastService;

    public LocationStreamController(LocationBroadcastService broadcastService) {
        this.broadcastService = broadcastService;
    }

    /**
     * Subscribe to real-time location updates via SSE.
     * Clients will receive events:
     * - "connected": Initial connection confirmation
     * - "location": Surveyor location update with trail data
     * - "status": Surveyor status change
     */
    @Operation(
        summary = "Subscribe to location stream",
        description = "Opens an SSE connection to receive real-time surveyor location updates. " +
                      "Events include 'location' (with lat, lng, trail) and 'status' updates."
    )
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamLocations() {
        return broadcastService.subscribe();
    }

    /**
     * Get location trails for all surveyors (for initial map load)
     */
    @Operation(
        summary = "Get all location trails",
        description = "Returns the recent location history for all surveyors for trail visualization"
    )
    @GetMapping("/trails")
    public ResponseEntity<Map<Long, List<Map<String, Object>>>> getAllTrails() {
        return ResponseEntity.ok(broadcastService.getAllTrails());
    }

    /**
     * Get location trail for a specific surveyor
     */
    @Operation(
        summary = "Get surveyor location trail",
        description = "Returns the recent location history for a specific surveyor"
    )
    @GetMapping("/trails/{surveyorId}")
    public ResponseEntity<List<Map<String, Object>>> getSurveyorTrail(@PathVariable Long surveyorId) {
        return ResponseEntity.ok(broadcastService.getLocationTrail(surveyorId));
    }

    /**
     * Get stream status
     */
    @Operation(
        summary = "Get stream status",
        description = "Returns the number of active SSE connections"
    )
    @GetMapping("/stream/status")
    public ResponseEntity<Map<String, Object>> getStreamStatus() {
        return ResponseEntity.ok(Map.of(
            "activeClients", broadcastService.getActiveClientCount(),
            "timestamp", System.currentTimeMillis()
        ));
    }
}
