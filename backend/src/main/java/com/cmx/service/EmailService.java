package com.cmx.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a");

    private final TemplateEngine templateEngine;
    private final NotificationAuditService auditService;
    private final RestTemplate restTemplate;

    @Value("${email.enabled:false}")
    private boolean emailEnabled;

    @Value("${email.from:noreply@example.com}")
    private String fromEmail;

    @Value("${mailgun.api.key:}")
    private String mailgunApiKey;

    @Value("${mailgun.domain:}")
    private String mailgunDomain;

    @Value("${mailgun.api.url:https://api.mailgun.net/v3}")
    private String mailgunApiUrl;

    public EmailService(@Qualifier("templateEngine") TemplateEngine templateEngine, NotificationAuditService auditService) {
        this.templateEngine = templateEngine;
        this.auditService = auditService;
        this.restTemplate = new RestTemplate();
    }

    /**
     * Send appointment created email
     */
    @Async
    public void sendAppointmentCreatedEmail(Long surveyorId, String toEmail, String surveyorName, String title, String description,
                                            OffsetDateTime startTime, OffsetDateTime endTime) {
        String subject = "New Appointment: " + (title != null && !title.isBlank() ? title : "Scheduled");

        Context context = new Context();
        context.setVariable("surveyorName", surveyorName);
        context.setVariable("description", description != null && !description.isBlank() ? description : "No additional details provided.");
        context.setVariable("date", startTime.format(DATE_FORMAT));
        context.setVariable("startTime", startTime.format(TIME_FORMAT));
        context.setVariable("endTime", endTime.format(TIME_FORMAT));

        String body = templateEngine.process("email/appointment-created", context);
        sendEmailWithAudit(surveyorId, toEmail, subject, body, "APPOINTMENT_CREATED");
    }

    /**
     * Send appointment updated (rescheduled) email
     */
    @Async
    public void sendAppointmentUpdatedEmail(Long surveyorId, String toEmail, String surveyorName, String title, String description,
                                            OffsetDateTime startTime, OffsetDateTime endTime) {
        String subject = "Rescheduled: " + (title != null && !title.isBlank() ? title : "Your Appointment");

        Context context = new Context();
        context.setVariable("surveyorName", surveyorName);
        context.setVariable("description", description != null && !description.isBlank() ? description : "Your appointment has been rescheduled.");
        context.setVariable("date", startTime.format(DATE_FORMAT));
        context.setVariable("startTime", startTime.format(TIME_FORMAT));
        context.setVariable("endTime", endTime.format(TIME_FORMAT));

        String body = templateEngine.process("email/appointment-rescheduled", context);
        sendEmailWithAudit(surveyorId, toEmail, subject, body, "APPOINTMENT_UPDATED");
    }

    /**
     * Send appointment deleted email
     */
    @Async
    public void sendAppointmentDeletedEmail(Long surveyorId, String toEmail, String surveyorName, String title, String description,
                                            OffsetDateTime startTime) {
        String subject = "Deleted: " + (title != null && !title.isBlank() ? title : "Your Appointment");

        Context context = new Context();
        context.setVariable("surveyorName", surveyorName);
        context.setVariable("description", description != null && !description.isBlank() ? description : "Your appointment has been deleted.");
        context.setVariable("date", startTime.format(DATE_FORMAT));

        String body = templateEngine.process("email/appointment-deleted", context);
        sendEmailWithAudit(surveyorId, toEmail, subject, body, "APPOINTMENT_DELETED");
    }

    /**
     * Send email via Mailgun HTTP API with audit logging
     */
    private void sendEmailWithAudit(Long surveyorId, String to, String subject, String htmlBody, String eventType) {
        if (!emailEnabled) {
            log.info("Email service disabled. Would send email to: {}", to);
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "DISABLED", "Email service disabled", null);
            return;
        }

        if (mailgunApiKey == null || mailgunApiKey.isBlank() || mailgunDomain == null || mailgunDomain.isBlank()) {
            log.warn("Mailgun not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.");
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "NOT_CONFIGURED", "Mailgun API key or domain not configured", null);
            return;
        }

        try {
            String response = sendEmailWithRetry(to, subject, htmlBody);
            log.info("Email sent successfully to: {} - Response: {}", to, response);
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "SENT", null, response);
        } catch (Exception e) {
            log.error("Error sending email to {} after retries: {}", to, e.getMessage());
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "FAILED", e.getMessage(), null);
        }
    }

    /**
     * Send email with retry logic (3 attempts with exponential backoff)
     */
    @Retryable(
            retryFor = {RestClientException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public String sendEmailWithRetry(String to, String subject, String htmlBody) {
        log.info("Sending email via Mailgun to: {}", to);

        String url = mailgunApiUrl + "/" + mailgunDomain + "/messages";

        // Prepare form data
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("from", fromEmail);
        formData.add("to", to);
        formData.add("subject", subject);
        formData.add("html", htmlBody);

        // Prepare headers with Basic Auth
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        String auth = "api:" + mailgunApiKey;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(formData, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RestClientException("Failed to send email: " + response.getStatusCode() + " - " + response.getBody());
        }

        return response.getBody();
    }

    @Recover
    public String recoverEmailSend(RestClientException e, String to, String subject, String htmlBody) {
        log.error("All retry attempts failed for email to {}: {}", to, e.getMessage());
        throw e;
    }

    /**
     * Send generic email (for test notifications, etc.)
     */
    public void sendEmail(Long surveyorId, String to, String subject, String body) {
        sendEmailWithAudit(surveyorId, to, subject, body, "TEST_NOTIFICATION");
    }

    /**
     * Legacy method for backward compatibility
     */
    public void sendEmail(String to, String subject, String body) {
        sendEmailWithAudit(null, to, subject, body, "GENERIC");
    }
}
