package com.cmx.controller;

import com.cmx.dto.AvailabilityDto.AvailabilityUpdateRequest;
import com.cmx.dto.AvailabilityDto.AvailabilityUpsertRequest;
import com.cmx.model.SurveyorAvailability;
import com.cmx.service.AvailabilityService;
import com.cmx.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final NotificationService notificationService;

    public AvailabilityController(AvailabilityService availabilityService,
                                   NotificationService notificationService) {
        this.availabilityService = availabilityService;
        this.notificationService = notificationService;
    }

    @GetMapping("/availability")
    public List<Map<String, Object>> getAvailability(
            @RequestParam("from") String from,
            @RequestParam("to") String to,
            @RequestParam(value = "surveyorId", required = false) Long surveyorId,
            @RequestParam(value = "surveyorIds", required = false) String surveyorIds,
            @RequestParam(value = "limit", defaultValue = "500") Integer limit,
            @RequestParam(value = "offset", defaultValue = "0") Integer offset) {
        return availabilityService.getAvailability(from, to, surveyorId, surveyorIds, limit, offset);
    }

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

    @PutMapping("/availability/{id}")
    public ResponseEntity<Map<String, Object>> updateAvailability(
            @PathVariable("id") Long id,
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

    @DeleteMapping("/availability/{id}")
    public ResponseEntity<Map<String, Object>> deleteAvailability(@PathVariable("id") Long id) {
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
