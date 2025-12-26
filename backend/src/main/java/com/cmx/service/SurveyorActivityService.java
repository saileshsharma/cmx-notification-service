package com.cmx.service;

import com.cmx.model.Surveyor;
import com.cmx.model.SurveyorActivityLog;
import com.cmx.model.JobAssignment;
import com.cmx.repository.SurveyorActivityLogRepository;
import com.cmx.repository.SurveyorRepository;
import com.cmx.repository.JobAssignmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class SurveyorActivityService {

    private static final Logger logger = LoggerFactory.getLogger(SurveyorActivityService.class);

    private final SurveyorActivityLogRepository activityLogRepository;
    private final SurveyorRepository surveyorRepository;
    private final JobAssignmentRepository jobAssignmentRepository;
    private final SseService sseService;

    @Value("${app.dispatcher.email:dispatcher@example.com}")
    private String dispatcherEmail;

    public SurveyorActivityService(
            SurveyorActivityLogRepository activityLogRepository,
            SurveyorRepository surveyorRepository,
            JobAssignmentRepository jobAssignmentRepository,
            SseService sseService) {
        this.activityLogRepository = activityLogRepository;
        this.surveyorRepository = surveyorRepository;
        this.jobAssignmentRepository = jobAssignmentRepository;
        this.sseService = sseService;
    }

    /**
     * Log a surveyor status change (AVAILABLE, BUSY, OFFLINE)
     */
    public SurveyorActivityLog logStatusChange(Long surveyorId, String previousStatus, String newStatus,
                                                 Double lat, Double lng) {
        SurveyorActivityLog log = SurveyorActivityLog.statusChange(surveyorId, previousStatus, newStatus, lat, lng);
        SurveyorActivityLog saved = activityLogRepository.save(log);

        // Notify dispatcher via SSE
        notifyDispatcher(surveyorId, "STATUS_CHANGE", newStatus, null);

        logger.info("Surveyor {} status changed from {} to {}", surveyorId, previousStatus, newStatus);
        return saved;
    }

    /**
     * Log a job/quick update (ON_WAY, ARRIVED, INSPECTING, COMPLETED)
     */
    public SurveyorActivityLog logJobUpdate(Long surveyorId, String previousState, String newState,
                                              Long appointmentId, Double lat, Double lng, String notes) {
        SurveyorActivityLog log = SurveyorActivityLog.jobUpdate(surveyorId, previousState, newState,
                appointmentId, lat, lng, notes);
        SurveyorActivityLog saved = activityLogRepository.save(log);

        // Notify dispatcher via SSE
        notifyDispatcher(surveyorId, "JOB_UPDATE", newState, appointmentId);

        logger.info("Surveyor {} job update: {} -> {} for appointment {}", surveyorId, previousState, newState, appointmentId);
        return saved;
    }

    /**
     * Log surveyor login
     */
    public SurveyorActivityLog logLogin(Long surveyorId, Double lat, Double lng) {
        SurveyorActivityLog log = SurveyorActivityLog.login(surveyorId, lat, lng);
        SurveyorActivityLog saved = activityLogRepository.save(log);

        notifyDispatcher(surveyorId, "LOGIN", "LOGGED_IN", null);

        logger.info("Surveyor {} logged in at ({}, {})", surveyorId, lat, lng);
        return saved;
    }

    /**
     * Log surveyor logout
     */
    public SurveyorActivityLog logLogout(Long surveyorId) {
        SurveyorActivityLog log = SurveyorActivityLog.logout(surveyorId);
        SurveyorActivityLog saved = activityLogRepository.save(log);

        notifyDispatcher(surveyorId, "LOGOUT", "LOGGED_OUT", null);

        logger.info("Surveyor {} logged out", surveyorId);
        return saved;
    }

    /**
     * Get activity log with optional filters
     */
    public List<SurveyorActivityLog> getActivityLog(Long surveyorId, String activityType,
                                                      Integer hoursBack, int limit, int offset) {
        OffsetDateTime since = hoursBack != null
                ? OffsetDateTime.now().minusHours(hoursBack)
                : OffsetDateTime.now().minusDays(30); // Default 30 days

        List<SurveyorActivityLog> logs = activityLogRepository.findWithFilters(
                surveyorId, activityType, since, limit, offset);

        // Enrich with surveyor and appointment names
        enrichActivityLogs(logs);

        return logs;
    }

    /**
     * Get recent activity (last N hours)
     */
    public List<SurveyorActivityLog> getRecentActivity(int hours, int limit) {
        try {
            OffsetDateTime since = OffsetDateTime.now().minusHours(hours);
            List<SurveyorActivityLog> logs = activityLogRepository.findRecent(since, limit, 0);
            enrichActivityLogs(logs);
            return logs;
        } catch (Exception e) {
            logger.warn("Error loading recent activity: {}", e.getMessage());
            return java.util.Collections.emptyList();
        }
    }

    /**
     * Get activity for a specific appointment
     */
    public List<SurveyorActivityLog> getAppointmentActivity(Long appointmentId) {
        List<SurveyorActivityLog> logs = activityLogRepository.findByAppointmentId(appointmentId);
        enrichActivityLogs(logs);
        return logs;
    }

    /**
     * Get the last known state for a surveyor's job
     */
    public String getLastJobState(Long surveyorId) {
        SurveyorActivityLog latest = activityLogRepository.findLatestBySurveyorAndType(
                surveyorId, SurveyorActivityLog.ActivityType.JOB_UPDATE.name());
        return latest != null ? latest.getNewValue() : null;
    }

    /**
     * Enrich activity logs with surveyor and job details
     */
    private void enrichActivityLogs(List<SurveyorActivityLog> logs) {
        for (SurveyorActivityLog log : logs) {
            // Get surveyor details
            surveyorRepository.findById(log.getSurveyorId()).ifPresent(surveyor -> {
                log.setSurveyorName(surveyor.getDisplayName());
                log.setSurveyorCode(surveyor.getCode());
            });

            // Get job/appointment details if applicable
            if (log.getAppointmentId() != null) {
                jobAssignmentRepository.findById(log.getAppointmentId()).ifPresent(job -> {
                    log.setAppointmentTitle("Job #" + job.getFnolId());
                });
            }
        }
    }

    /**
     * Notify dispatcher about surveyor activity via SSE
     */
    @Async
    public void notifyDispatcher(Long surveyorId, String activityType, String newValue, Long appointmentId) {
        try {
            Surveyor surveyor = surveyorRepository.findById(surveyorId).orElse(null);
            if (surveyor == null) {
                logger.warn("Could not find surveyor {} for dispatcher notification", surveyorId);
                return;
            }

            Map<String, Object> eventData = new HashMap<>();
            eventData.put("type", "SURVEYOR_ACTIVITY");
            eventData.put("surveyorId", surveyorId);
            eventData.put("surveyorName", surveyor.getDisplayName());
            eventData.put("surveyorCode", surveyor.getCode());
            eventData.put("activityType", activityType);
            eventData.put("newValue", newValue);
            eventData.put("timestamp", OffsetDateTime.now().toString());

            if (surveyor.getCurrentLat() != null && surveyor.getCurrentLng() != null) {
                eventData.put("latitude", surveyor.getCurrentLat());
                eventData.put("longitude", surveyor.getCurrentLng());
            }

            if (appointmentId != null) {
                eventData.put("appointmentId", appointmentId);
                jobAssignmentRepository.findById(appointmentId).ifPresent(job -> {
                    eventData.put("appointmentTitle", "Job #" + job.getFnolId());
                });
            }

            // Build message based on activity type
            String message = buildActivityMessage(surveyor.getDisplayName(), activityType, newValue);
            eventData.put("message", message);

            // Send SSE to all connected dispatchers
            sseService.sendToAll("surveyor-activity", eventData);

            logger.info("Dispatcher notified: {}", message);
        } catch (Exception e) {
            logger.error("Error notifying dispatcher about surveyor {} activity", surveyorId, e);
        }
    }

    private String buildActivityMessage(String surveyorName, String activityType, String newValue) {
        return switch (activityType) {
            case "STATUS_CHANGE" -> switch (newValue) {
                case "AVAILABLE" -> surveyorName + " is now available for assignments";
                case "BUSY" -> surveyorName + " is now busy";
                case "OFFLINE" -> surveyorName + " has gone offline";
                default -> surveyorName + " status changed to " + newValue;
            };
            case "JOB_UPDATE" -> switch (newValue) {
                case "ON_WAY" -> surveyorName + " is on the way to inspection";
                case "ARRIVED" -> surveyorName + " has arrived at inspection location";
                case "INSPECTING" -> surveyorName + " has started the inspection";
                case "COMPLETED" -> surveyorName + " has completed the inspection";
                case "ACCEPTED" -> surveyorName + " has accepted the appointment";
                case "REJECTED" -> surveyorName + " has rejected the appointment";
                default -> surveyorName + " job update: " + newValue;
            };
            case "LOGIN" -> surveyorName + " has logged in";
            case "LOGOUT" -> surveyorName + " has logged out";
            default -> surveyorName + ": " + activityType + " - " + newValue;
        };
    }
}
