package com.cmx.controller;

import com.cmx.dto.AvailabilityDto.AvailabilityUpdateRequest;
import com.cmx.dto.AvailabilityDto.AvailabilityUpsertRequest;
import com.cmx.model.SurveyorAvailability;
import com.cmx.service.AvailabilityService;
import com.cmx.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@Tag(name = "Availability", description = "Surveyor availability and scheduling APIs")
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final NotificationService notificationService;

    public AvailabilityController(AvailabilityService availabilityService,
                                   NotificationService notificationService) {
        this.availabilityService = availabilityService;
        this.notificationService = notificationService;
    }

    @Operation(
        summary = "Get availability",
        description = "Retrieves surveyor availability for a given time range"
    )
    @ApiResponse(responseCode = "200", description = "Availability retrieved successfully")
    @GetMapping("/availability")
    public List<Map<String, Object>> getAvailability(
            @Parameter(description = "Start date/time (ISO format)") @RequestParam("from") String from,
            @Parameter(description = "End date/time (ISO format)") @RequestParam("to") String to,
            @Parameter(description = "Filter by single surveyor ID") @RequestParam(value = "surveyorId", required = false) Long surveyorId,
            @Parameter(description = "Filter by comma-separated surveyor IDs") @RequestParam(value = "surveyorIds", required = false) String surveyorIds,
            @Parameter(description = "Maximum results") @RequestParam(value = "limit", defaultValue = "500") Integer limit,
            @Parameter(description = "Offset for pagination") @RequestParam(value = "offset", defaultValue = "0") Integer offset) {
        return availabilityService.getAvailability(from, to, surveyorId, surveyorIds, limit, offset);
    }

    @Operation(
        summary = "Create or update availability",
        description = "Creates or updates availability blocks for a surveyor"
    )
    @ApiResponse(responseCode = "200", description = "Availability updated successfully")
    @PostMapping("/mobile/availability")
    public ResponseEntity<Map<String, Object>> upsertAvailability(
            @Valid @RequestBody AvailabilityUpsertRequest req) {

        availabilityService.upsertAvailability(req.surveyorId(), req.blocks());

        // Send notifications for each block
        for (var block : req.blocks()) {
            OffsetDateTime start = OffsetDateTime.parse(block.startTime());
            OffsetDateTime end = OffsetDateTime.parse(block.endTime());
            notificationService.sendAppointmentNotification(
                    req.surveyorId(), block.state(), block.title(), block.description(), start, end
            );
        }

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @Operation(
        summary = "Update availability",
        description = "Updates an existing availability block"
    )
    @ApiResponse(responseCode = "200", description = "Availability updated successfully")
    @PutMapping("/availability/{id}")
    public ResponseEntity<Map<String, Object>> updateAvailability(
            @Parameter(description = "Availability block ID") @PathVariable("id") Long id,
            @Valid @RequestBody AvailabilityUpdateRequest req) {

        Long surveyorId = availabilityService.getSurveyorIdForAvailability(id);
        boolean updated = availabilityService.updateAvailability(
                id, req.startTime(), req.endTime(), req.state(), req.title(), req.description()
        );

        if (updated && surveyorId != null) {
            OffsetDateTime start = OffsetDateTime.parse(req.startTime());
            OffsetDateTime end = OffsetDateTime.parse(req.endTime());
            notificationService.sendAppointmentUpdateNotification(
                    surveyorId, id, req.title(), req.description(), start, end, req.state()
            );
        }

        return ResponseEntity.ok(Map.of("ok", updated));
    }

    @Operation(
        summary = "Delete availability",
        description = "Deletes an availability block"
    )
    @ApiResponse(responseCode = "200", description = "Availability deleted successfully")
    @DeleteMapping("/availability/{id}")
    public ResponseEntity<Map<String, Object>> deleteAvailability(
            @Parameter(description = "Availability block ID") @PathVariable("id") Long id) {
        SurveyorAvailability deleted = availabilityService.deleteAvailability(id);

        if (deleted != null) {
            notificationService.sendAppointmentDeleteNotification(
                    deleted.getSurveyorId(), id,
                    deleted.getTitle(), deleted.getDescription(),
                    deleted.getStartTime(), deleted.getEndTime()
            );
            return ResponseEntity.ok(Map.of("ok", true));
        }

        return ResponseEntity.ok(Map.of("ok", false));
    }
}
