package com.cmx.service;

import com.cmx.model.InspectionReport;
import com.cmx.repository.InspectionReportRepository;
import com.cmx.repository.SurveyorRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class InspectionService {

    private static final Logger log = LoggerFactory.getLogger(InspectionService.class);

    private final InspectionReportRepository inspectionRepository;
    private final SurveyorRepository surveyorRepository;
    private final SurveyorActivityService activityService;
    private final ObjectMapper objectMapper;

    public InspectionService(InspectionReportRepository inspectionRepository,
                              SurveyorRepository surveyorRepository,
                              SurveyorActivityService activityService,
                              ObjectMapper objectMapper) {
        this.inspectionRepository = inspectionRepository;
        this.surveyorRepository = surveyorRepository;
        this.activityService = activityService;
        this.objectMapper = objectMapper;
    }

    /**
     * Submit a new inspection report from the mobile app
     */
    @Transactional
    public Map<String, Object> submitInspection(Long surveyorId, Long appointmentId,
                                                  String vehicleTitle, String notes,
                                                  List<String> photoUrls, String signatureUrl,
                                                  List<String> completedSteps, Integer totalSteps,
                                                  Double latitude, Double longitude) {
        log.info("Submitting inspection report: surveyorId={}, appointmentId={}, photos={}",
                surveyorId, appointmentId, photoUrls != null ? photoUrls.size() : 0);

        try {
            // Check if report already exists for this appointment
            Optional<InspectionReport> existing = inspectionRepository.findByAppointmentId(appointmentId);
            if (existing.isPresent()) {
                log.warn("Inspection report already exists for appointment {}", appointmentId);
                return Map.of(
                    "success", false,
                    "message", "Inspection report already submitted for this appointment",
                    "existingReportId", existing.get().getId()
                );
            }

            // Convert lists to JSON strings for storage
            String photoUrlsJson = photoUrls != null ? objectMapper.writeValueAsString(photoUrls) : "[]";
            String completedStepsJson = completedSteps != null ? objectMapper.writeValueAsString(completedSteps) : "[]";

            // Create the inspection report
            InspectionReport report = new InspectionReport(
                surveyorId,
                appointmentId,
                vehicleTitle,
                notes,
                photoUrlsJson,
                signatureUrl,
                completedStepsJson,
                totalSteps != null ? totalSteps : 0,
                latitude,
                longitude
            );

            // Save to database
            InspectionReport saved = inspectionRepository.save(report);
            log.info("Inspection report saved with ID: {}", saved.getId());

            // Log the activity
            try {
                activityService.logJobUpdate(surveyorId, "INSPECTING", "COMPLETED",
                        appointmentId, latitude, longitude,
                        "Inspection submitted with " + (photoUrls != null ? photoUrls.size() : 0) + " photos");
            } catch (Exception e) {
                log.warn("Failed to log inspection activity: {}", e.getMessage());
            }

            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Inspection report submitted successfully");
            response.put("reportId", saved.getId());
            response.put("photoCount", photoUrls != null ? photoUrls.size() : 0);
            response.put("hasSignature", signatureUrl != null && !signatureUrl.isEmpty());
            response.put("submittedAt", saved.getSubmittedAt().toString());

            return response;

        } catch (JsonProcessingException e) {
            log.error("Failed to serialize inspection data: {}", e.getMessage());
            return Map.of(
                "success", false,
                "message", "Failed to process inspection data"
            );
        } catch (Exception e) {
            log.error("Failed to submit inspection report: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "Failed to submit inspection report: " + e.getMessage()
            );
        }
    }

    /**
     * Get inspection report by ID
     */
    public Optional<Map<String, Object>> getInspectionById(Long reportId) {
        return inspectionRepository.findById(reportId)
                .map(this::toDetailedMap);
    }

    /**
     * Get inspection report by appointment ID
     */
    public Optional<Map<String, Object>> getInspectionByAppointment(Long appointmentId) {
        return inspectionRepository.findByAppointmentId(appointmentId)
                .map(this::toDetailedMap);
    }

    /**
     * Get all inspections for a surveyor
     */
    public List<Map<String, Object>> getInspectionsBySurveyor(Long surveyorId, int limit, int offset) {
        return inspectionRepository.findBySurveyorId(surveyorId, limit, offset)
                .stream()
                .map(this::toSummaryMap)
                .toList();
    }

    /**
     * Get all inspections with optional filters
     */
    public List<Map<String, Object>> getInspections(Long surveyorId, String status,
                                                      Integer days, int limit, int offset) {
        Instant since = days != null
                ? Instant.now().minus(days, ChronoUnit.DAYS)
                : Instant.EPOCH;

        return inspectionRepository.findWithFilters(surveyorId, status, since, limit, offset)
                .stream()
                .map(this::toSummaryMap)
                .toList();
    }

    /**
     * Get inspection statistics
     */
    public Map<String, Object> getStatistics(Long surveyorId) {
        Map<String, Object> stats = new HashMap<>();

        if (surveyorId != null) {
            stats.put("totalInspections", inspectionRepository.countBySurveyorId(surveyorId));
        }

        stats.put("pendingReview", inspectionRepository.countByStatus("SUBMITTED"));
        stats.put("approved", inspectionRepository.countByStatus("APPROVED"));
        stats.put("rejected", inspectionRepository.countByStatus("REJECTED"));

        // Today's count
        Instant todayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        stats.put("today", inspectionRepository.countSince(todayStart));

        // This week
        Instant weekStart = Instant.now().minus(7, ChronoUnit.DAYS);
        stats.put("thisWeek", inspectionRepository.countSince(weekStart));

        return stats;
    }

    /**
     * Update inspection status (for admin use)
     */
    @Transactional
    public Map<String, Object> updateStatus(Long reportId, String newStatus) {
        Optional<InspectionReport> reportOpt = inspectionRepository.findById(reportId);
        if (reportOpt.isEmpty()) {
            return Map.of("success", false, "message", "Report not found");
        }

        InspectionReport report = reportOpt.get();
        report.setStatus(newStatus);
        report.setUpdatedAt(Instant.now());
        inspectionRepository.save(report);

        log.info("Inspection report {} status updated to {}", reportId, newStatus);

        return Map.of(
            "success", true,
            "message", "Status updated to " + newStatus
        );
    }

    // Helper to convert report to detailed map
    private Map<String, Object> toDetailedMap(InspectionReport report) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", report.getId());
        map.put("surveyorId", report.getSurveyorId());
        map.put("appointmentId", report.getAppointmentId());
        map.put("vehicleTitle", report.getVehicleTitle());
        map.put("notes", report.getNotes());
        map.put("signatureUrl", report.getSignatureUrl());
        map.put("totalSteps", report.getTotalSteps());
        map.put("latitude", report.getLatitude());
        map.put("longitude", report.getLongitude());
        map.put("status", report.getStatus());
        map.put("submittedAt", report.getSubmittedAt().toString());
        map.put("updatedAt", report.getUpdatedAt().toString());

        // Parse JSON arrays
        try {
            if (report.getPhotoUrls() != null && !report.getPhotoUrls().isEmpty()) {
                map.put("photoUrls", objectMapper.readValue(report.getPhotoUrls(), List.class));
            } else {
                map.put("photoUrls", List.of());
            }
            if (report.getCompletedSteps() != null && !report.getCompletedSteps().isEmpty()) {
                map.put("completedSteps", objectMapper.readValue(report.getCompletedSteps(), List.class));
            } else {
                map.put("completedSteps", List.of());
            }
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse JSON in report {}: {}", report.getId(), e.getMessage());
            map.put("photoUrls", List.of());
            map.put("completedSteps", List.of());
        }

        // Add surveyor info if available
        surveyorRepository.findById(report.getSurveyorId()).ifPresent(surveyor -> {
            map.put("surveyorName", surveyor.getDisplayName());
            map.put("surveyorCode", surveyor.getCode());
        });

        return map;
    }

    // Helper to convert report to summary map (for lists)
    private Map<String, Object> toSummaryMap(InspectionReport report) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", report.getId());
        map.put("surveyorId", report.getSurveyorId());
        map.put("appointmentId", report.getAppointmentId());
        map.put("vehicleTitle", report.getVehicleTitle());
        map.put("photoCount", report.getPhotoCount());
        map.put("hasSignature", report.hasSignature());
        map.put("status", report.getStatus());
        map.put("submittedAt", report.getSubmittedAt().toString());

        return map;
    }
}
