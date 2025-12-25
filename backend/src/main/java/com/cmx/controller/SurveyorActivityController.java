package com.cmx.controller;

import com.cmx.model.SurveyorActivityLog;
import com.cmx.service.SurveyorActivityService;
import com.cmx.service.SseService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SurveyorActivityController {

    private final SurveyorActivityService activityService;
    private final SseService sseService;

    public SurveyorActivityController(SurveyorActivityService activityService, SseService sseService) {
        this.activityService = activityService;
        this.sseService = sseService;
    }

    /**
     * SSE endpoint for real-time dispatcher updates
     */
    @GetMapping(value = "/dispatcher/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToDispatcherStream() {
        return sseService.createEmitter();
    }

    /**
     * Get activity log with optional filters
     */
    @GetMapping("/activity")
    public ResponseEntity<List<SurveyorActivityLog>> getActivityLog(
            @RequestParam(value = "surveyorId", required = false) Long surveyorId,
            @RequestParam(value = "activityType", required = false) String activityType,
            @RequestParam(value = "hoursBack", required = false, defaultValue = "24") Integer hoursBack,
            @RequestParam(value = "limit", required = false, defaultValue = "100") int limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") int offset) {

        List<SurveyorActivityLog> logs = activityService.getActivityLog(
                surveyorId, activityType, hoursBack, limit, offset);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get recent activity (useful for dashboard)
     */
    @GetMapping("/activity/recent")
    public ResponseEntity<List<SurveyorActivityLog>> getRecentActivity(
            @RequestParam(value = "hours", required = false, defaultValue = "4") int hours,
            @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {

        List<SurveyorActivityLog> logs = activityService.getRecentActivity(hours, limit);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get activity for a specific appointment
     */
    @GetMapping("/activity/appointment/{appointmentId}")
    public ResponseEntity<List<SurveyorActivityLog>> getAppointmentActivity(
            @PathVariable Long appointmentId) {

        List<SurveyorActivityLog> logs = activityService.getAppointmentActivity(appointmentId);
        return ResponseEntity.ok(logs);
    }

    /**
     * Get SSE connection status
     */
    @GetMapping("/dispatcher/status")
    public ResponseEntity<Map<String, Object>> getDispatcherStatus() {
        return ResponseEntity.ok(Map.of(
                "activeConnections", sseService.getActiveConnectionCount(),
                "status", "running"
        ));
    }
}
