package com.cmx.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("EEEE, MMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a");

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Autowired
    private NotificationAuditService auditService;

    @Value("${email.enabled:false}")
    private boolean emailEnabled;

    @Value("${email.from:noreply@appointmentcalendar.com}")
    private String fromEmail;

    private Long currentSurveyorId;

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
     * Send email with audit logging
     */
    private void sendEmailWithAudit(Long surveyorId, String to, String subject, String body, String eventType) {
        if (!emailEnabled) {
            log.info("Email service disabled. Would send email to: {}", to);
            log.info("Subject: {}", subject);
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "DISABLED", "Email service disabled", null);
            return;
        }

        if (mailSender == null) {
            log.warn("JavaMailSender not configured. Email not sent to: {}", to);
            log.info("Subject: {}", subject);
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "NOT_CONFIGURED", "JavaMailSender not configured", null);
            return;
        }

        try {
            log.info("Sending email to: {}", to);
            log.info("Subject: {}", subject);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML

            mailSender.send(message);

            log.info("Email sent successfully to: {}", to);
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "SENT", null, null);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "FAILED", e.getMessage(), null);
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage());
            auditService.logEmailNotification(surveyorId, eventType, subject, to, "FAILED", e.getMessage(), null);
        }
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
