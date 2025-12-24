package com.cmx.service;

import com.cmx.dto.NotificationDto.NotificationStatus;
import com.cmx.dto.NotificationDto.TestNotificationResult;
import com.cmx.dto.SurveyorDto.SurveyorContact;
import com.cmx.repository.DeviceTokenRepository;
import com.cmx.repository.NotificationLogRepository;
import com.cmx.repository.SurveyorRepository;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("EEEE, MMM d");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a");
    private static final Set<String> INVALID_TOKEN_CODES = Set.of("UNREGISTERED", "INVALID_ARGUMENT");

    private final SurveyorRepository surveyorRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificationAuditService auditService;
    private boolean firebaseInitialized = false;

    @Value("${firebase.credentials.path:}")
    private String firebaseCredentialsPath;

    @Value("${firebase.credentials.json:}")
    private String firebaseCredentialsJson;

    public NotificationService(SurveyorRepository surveyorRepository,
                               DeviceTokenRepository deviceTokenRepository,
                               NotificationLogRepository notificationLogRepository,
                               EmailService emailService,
                               SmsService smsService,
                               NotificationAuditService auditService) {
        this.surveyorRepository = surveyorRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.emailService = emailService;
        this.smsService = smsService;
        this.auditService = auditService;
    }

    @PostConstruct
    public void initFirebase() {
        InputStream credentialsStream = null;

        try {
            // Option 1: Read from JSON environment variable (for cloud deployments)
            if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isBlank()) {
                log.info("Initializing Firebase from FIREBASE_CREDENTIALS_JSON environment variable");
                credentialsStream = new ByteArrayInputStream(firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8));
            }
            // Option 2: Read from file path (also check if it looks like JSON content)
            else if (firebaseCredentialsPath != null && !firebaseCredentialsPath.isBlank()) {
                // Check if the value looks like JSON (starts with {) - treat as inline JSON
                if (firebaseCredentialsPath.trim().startsWith("{")) {
                    log.info("Initializing Firebase from FIREBASE_CREDENTIALS_PATH (detected as JSON content)");
                    credentialsStream = new ByteArrayInputStream(firebaseCredentialsPath.getBytes(StandardCharsets.UTF_8));
                } else {
                    // Treat as file path
                    try {
                        if (Files.exists(Path.of(firebaseCredentialsPath))) {
                            log.info("Initializing Firebase from file: {}", firebaseCredentialsPath);
                            credentialsStream = new FileInputStream(firebaseCredentialsPath);
                        } else {
                            log.warn("Firebase credentials file not found: {}", firebaseCredentialsPath);
                        }
                    } catch (Exception e) {
                        log.warn("Invalid Firebase credentials path: {}", e.getMessage());
                    }
                }
            }

            if (credentialsStream == null) {
                log.warn("Firebase credentials not configured. Push notifications disabled. " +
                        "Set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH environment variable to enable.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(credentialsStream))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
            firebaseInitialized = true;
            log.info("Firebase initialized successfully");
        } catch (IOException e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
        } finally {
            if (credentialsStream != null) {
                try { credentialsStream.close(); } catch (IOException ignored) {}
            }
        }
    }

    @Async
    public void sendAppointmentNotification(Long surveyorId, String state, String appointmentTitle, String appointmentDescription,
                                            OffsetDateTime startTime, OffsetDateTime endTime) {
        log.info("========== NOTIFICATION: APPOINTMENT CREATED ==========");
        log.info("Surveyor ID: {}, Title: {}, State: {}", surveyorId, appointmentTitle, state);
        log.info("Time: {} to {}", startTime, endTime);

        SurveyorContact contact = getSurveyorContact(surveyorId);
        log.info("Surveyor Contact - Name: {}, Email: {}, Phone: {}", contact.name(), contact.email(), contact.phone());

        String pushTitle = "New Appointment Scheduled";
        String pushBody = String.format("%s appointment on %s from %s to %s",
                titleOrState(appointmentTitle, state),
                startTime.format(DATE_FORMAT),
                startTime.format(TIME_FORMAT),
                endTime.format(TIME_FORMAT));

        Map<String, String> data = Map.of(
                "type", "APPOINTMENT_CREATED",
                "surveyorId", String.valueOf(surveyorId),
                "state", state,
                "title", appointmentTitle != null ? appointmentTitle : "",
                "description", appointmentDescription != null ? appointmentDescription : "",
                "startTime", startTime.toString(),
                "endTime", endTime.toString()
        );

        sendNotificationToSurveyor(surveyorId, pushTitle, pushBody, data);

        if (contact.hasEmail()) {
            emailService.sendAppointmentCreatedEmail(surveyorId, contact.email(), contact.name(),
                    appointmentTitle, appointmentDescription, startTime, endTime);
        }

        if (contact.hasPhone()) {
            smsService.sendAppointmentCreatedSms(surveyorId, contact.phone(), contact.name(),
                    appointmentTitle, startTime, endTime);
        }
    }

    @Async
    public void sendAppointmentUpdateNotification(Long surveyorId, Long appointmentId, String appointmentTitle,
                                                   String appointmentDescription, OffsetDateTime startTime,
                                                   OffsetDateTime endTime, String state) {
        log.info("========== NOTIFICATION: APPOINTMENT RESCHEDULED ==========");
        log.info("Surveyor ID: {}, Appointment ID: {}, Title: {}", surveyorId, appointmentId, appointmentTitle);
        log.info("New Time: {} to {}", startTime, endTime);

        SurveyorContact contact = getSurveyorContact(surveyorId);
        log.info("Surveyor Contact - Name: {}, Email: {}, Phone: {}", contact.name(), contact.email(), contact.phone());

        String pushTitle = "Appointment Rescheduled";
        String pushBody = String.format("Your %s appointment has been rescheduled to %s, %s - %s",
                titleOrState(appointmentTitle, state),
                startTime.format(DATE_FORMAT),
                startTime.format(TIME_FORMAT),
                endTime.format(TIME_FORMAT));

        Map<String, String> data = Map.of(
                "type", "APPOINTMENT_UPDATED",
                "appointmentId", String.valueOf(appointmentId),
                "surveyorId", String.valueOf(surveyorId),
                "state", state,
                "title", appointmentTitle != null ? appointmentTitle : "",
                "description", appointmentDescription != null ? appointmentDescription : "",
                "startTime", startTime.toString(),
                "endTime", endTime.toString()
        );

        sendNotificationToSurveyor(surveyorId, pushTitle, pushBody, data);

        if (contact.hasEmail()) {
            emailService.sendAppointmentUpdatedEmail(surveyorId, contact.email(), contact.name(),
                    appointmentTitle, appointmentDescription, startTime, endTime);
        }

        if (contact.hasPhone()) {
            smsService.sendAppointmentUpdatedSms(surveyorId, contact.phone(), contact.name(),
                    appointmentTitle, startTime, endTime);
        }
    }

    @Async
    public void sendAppointmentDeleteNotification(Long surveyorId, Long appointmentId, String appointmentTitle,
                                                   String appointmentDescription, OffsetDateTime startTime,
                                                   OffsetDateTime endTime) {
        log.info("========== NOTIFICATION: APPOINTMENT DELETED ==========");
        log.info("Surveyor ID: {}, Appointment ID: {}, Title: {}", surveyorId, appointmentId, appointmentTitle);
        log.info("Original Time: {} to {}", startTime, endTime);

        SurveyorContact contact = getSurveyorContact(surveyorId);
        log.info("Surveyor Contact - Name: {}, Email: {}, Phone: {}", contact.name(), contact.email(), contact.phone());

        String pushTitle = "Appointment Cancelled";
        String pushBody = String.format("Your appointment %s on %s at %s has been cancelled",
                appointmentTitle != null ? "\"" + appointmentTitle + "\"" : "",
                startTime.format(DATE_FORMAT),
                startTime.format(TIME_FORMAT));

        Map<String, String> data = Map.of(
                "type", "APPOINTMENT_DELETED",
                "appointmentId", String.valueOf(appointmentId),
                "surveyorId", String.valueOf(surveyorId),
                "title", appointmentTitle != null ? appointmentTitle : "",
                "description", appointmentDescription != null ? appointmentDescription : ""
        );

        sendNotificationToSurveyor(surveyorId, pushTitle, pushBody, data);

        if (contact.hasEmail()) {
            emailService.sendAppointmentDeletedEmail(surveyorId, contact.email(), contact.name(),
                    appointmentTitle, appointmentDescription, startTime);
        }

        if (contact.hasPhone()) {
            smsService.sendAppointmentDeletedSms(surveyorId, contact.phone(), contact.name(),
                    appointmentTitle, startTime);
        }
    }

    public void sendNotificationToSurveyor(Long surveyorId, String title, String body, Map<String, String> data) {
        List<String> tokens = deviceTokenRepository.findTokensBySurveyorId(surveyorId);

        if (tokens.isEmpty()) {
            log.info("No device tokens found for surveyor {}", surveyorId);
            auditService.logPushNotification(surveyorId, title, body, data, "NO_TOKENS", "No device tokens registered", null, null);
            return;
        }

        if (!firebaseInitialized) {
            log.warn("Firebase not initialized. Notification not sent: {} - {}", title, body);
            auditService.logPushNotification(surveyorId, title, body, data, "FIREBASE_DISABLED", "Firebase not initialized", null, null);
            return;
        }

        for (String token : tokens) {
            try {
                Message message = buildMessage(title, body, data, token);
                String response = FirebaseMessaging.getInstance().send(message);
                log.info("Notification sent successfully to surveyor {}: {}", surveyorId, response);
                auditService.logPushNotification(surveyorId, title, body, data, "SENT", null, token, response);
            } catch (FirebaseMessagingException e) {
                log.error("Failed to send notification to surveyor {}: {}", surveyorId, e.getMessage());
                auditService.logPushNotification(surveyorId, title, body, data, "FAILED", e.getMessage(), token, null);

                if (isInvalidToken(e)) {
                    deviceTokenRepository.deleteByToken(token);
                    log.info("Removed invalid device token");
                }
            }
        }
    }

    public TestNotificationResult sendTestNotification(Long surveyorId, String title, String message) {
        SurveyorContact contact = getSurveyorContact(surveyorId);

        Map<String, String> data = Map.of(
                "type", "TEST_NOTIFICATION",
                "surveyorId", String.valueOf(surveyorId),
                "timestamp", java.time.Instant.now().toString()
        );

        List<String> tokens = deviceTokenRepository.findTokensBySurveyorId(surveyorId);
        int pushSent = 0;
        int pushFailed = 0;
        String pushStatus = "NO_TOKENS";
        String pushError = null;

        if (!tokens.isEmpty()) {
            if (!firebaseInitialized) {
                pushStatus = "FIREBASE_DISABLED";
                pushError = "Firebase not initialized - set FIREBASE_CREDENTIALS_PATH";
                auditService.logPushNotification(surveyorId, title, message, data, pushStatus, pushError, null, null);
            } else {
                for (String token : tokens) {
                    try {
                        Message msg = buildMessage(title, message, data, token);
                        String response = FirebaseMessaging.getInstance().send(msg);
                        pushSent++;
                        auditService.logPushNotification(surveyorId, title, message, data, "SENT", null, token, response);
                    } catch (FirebaseMessagingException e) {
                        pushFailed++;
                        pushError = e.getMessage();
                        auditService.logPushNotification(surveyorId, title, message, data, "FAILED", e.getMessage(), token, null);
                    }
                }
                pushStatus = pushSent > 0 ? "SENT" : "FAILED";
            }
        } else {
            auditService.logPushNotification(surveyorId, title, message, data, pushStatus, "No device tokens registered", null, null);
        }

        boolean emailSent = false;
        if (contact.hasEmail()) {
            try {
                emailService.sendEmail(surveyorId, contact.email(), title,
                        String.format("<h2>Test Notification</h2><p>%s</p><p>Sent to: %s</p>", message, contact.name()));
                emailSent = true;
            } catch (Exception e) {
                log.error("Failed to send test email: {}", e.getMessage());
            }
        }

        boolean smsSent = false;
        if (contact.hasPhone()) {
            try {
                smsService.sendSms(surveyorId, contact.phone(), String.format("[TEST] %s: %s", title, message));
                smsSent = true;
            } catch (Exception e) {
                log.error("Failed to send test SMS: {}", e.getMessage());
            }
        }

        return new TestNotificationResult(
                surveyorId,
                contact.name(),
                tokens.size(),
                pushSent,
                pushStatus,
                pushError,
                emailSent,
                contact.email(),
                smsSent,
                contact.phone()
        );
    }

    public List<TestNotificationResult> sendTestNotificationToAll(String title, String message) {
        List<Long> surveyorIds = surveyorRepository.findAllIds();
        return surveyorIds.stream()
                .map(id -> sendTestNotification(id, title, message))
                .toList();
    }

    public NotificationStatus getNotificationStatus() {
        int totalSurveyors = surveyorRepository.countAll();
        int surveyorsWithTokens = deviceTokenRepository.countDistinctSurveyors();
        int totalTokens = deviceTokenRepository.countAll();
        int recentNotifications = notificationLogRepository.countRecentNotifications(24);

        return new NotificationStatus(
                firebaseInitialized,
                totalSurveyors,
                surveyorsWithTokens,
                totalTokens,
                recentNotifications
        );
    }

    private SurveyorContact getSurveyorContact(Long surveyorId) {
        return surveyorRepository.findById(surveyorId)
                .map(s -> new SurveyorContact(s.getId(), s.getDisplayName(), s.getEmail(), s.getPhone()))
                .orElse(new SurveyorContact(surveyorId, "Surveyor " + surveyorId, null, null));
    }

    private static String titleOrState(String title, String state) {
        return title != null ? title : state;
    }

    private static Message buildMessage(String title, String body, Map<String, String> data, String token) {
        return Message.builder()
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .putAllData(data)
                .setToken(token)
                .build();
    }

    private static boolean isInvalidToken(FirebaseMessagingException e) {
        return e.getMessagingErrorCode() != null && INVALID_TOKEN_CODES.contains(e.getMessagingErrorCode().name());
    }
}
