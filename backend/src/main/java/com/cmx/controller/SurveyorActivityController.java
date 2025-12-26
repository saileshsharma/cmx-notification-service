package com.cmx.controller;

import com.cmx.model.SurveyorActivityLog;
import com.cmx.service.SurveyorActivityService;
import com.cmx.service.SseService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SurveyorActivityController {

    private final SurveyorActivityService activityService;
    private final SseService sseService;
    private final JdbcTemplate jdbcTemplate;

    public SurveyorActivityController(SurveyorActivityService activityService, SseService sseService, JdbcTemplate jdbcTemplate) {
        this.activityService = activityService;
        this.sseService = sseService;
        this.jdbcTemplate = jdbcTemplate;
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

    /**
     * Diagnostic endpoint to check activity log table status
     */
    @GetMapping("/activity/debug")
    public ResponseEntity<Map<String, Object>> getActivityLogDebug() {
        Map<String, Object> result = new HashMap<>();

        // Check if table exists
        try {
            Boolean tableExists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'surveyor_activity_log')",
                Boolean.class
            );
            result.put("tableExists", tableExists);
        } catch (Exception e) {
            result.put("tableExists", false);
            result.put("tableExistsError", e.getMessage());
        }

        // Try to get row count
        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM surveyor_activity_log",
                Integer.class
            );
            result.put("rowCount", count);
        } catch (Exception e) {
            result.put("rowCount", -1);
            result.put("rowCountError", e.getMessage());
        }

        // Get table structure
        try {
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'surveyor_activity_log'"
            );
            result.put("columns", columns);
        } catch (Exception e) {
            result.put("columnsError", e.getMessage());
        }

        // Try a direct insert and read as a test (with surveyorId=0, will fail FK constraint - expected)
        try {
            // Insert a test record
            int inserted = jdbcTemplate.update(
                "INSERT INTO surveyor_activity_log (surveyor_id, activity_type, new_value, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                0L, "TEST", "DEBUG_TEST"
            );
            result.put("testInsert", inserted == 1 ? "SUCCESS" : "FAILED");

            // Clean up test record
            jdbcTemplate.update("DELETE FROM surveyor_activity_log WHERE surveyor_id = 0 AND activity_type = 'TEST'");
        } catch (Exception e) {
            result.put("testInsert", "FAILED");
            result.put("testInsertError", e.getMessage());
        }

        // Try insert using the actual service with a real surveyor (id=71)
        try {
            SurveyorActivityLog saved = activityService.logStatusChange(71L, "DEBUG_PREV", "DEBUG_TEST", null, null);
            result.put("serviceInsert", saved != null && saved.getId() != null ? "SUCCESS" : "FAILED");
            result.put("serviceInsertId", saved != null ? saved.getId() : null);
            // Clean up
            if (saved != null && saved.getId() != null) {
                jdbcTemplate.update("DELETE FROM surveyor_activity_log WHERE id = ?", saved.getId());
            }
        } catch (Exception e) {
            result.put("serviceInsert", "FAILED");
            result.put("serviceInsertError", e.getMessage());
        }

        result.put("status", "debug_complete");
        return ResponseEntity.ok(result);
    }
}
