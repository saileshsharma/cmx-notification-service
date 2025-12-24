package com.cmx.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.annotation.PostConstruct;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("EEE, MMM d");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("h:mm a");

    @Autowired
    @Qualifier("textTemplateEngine")
    private TemplateEngine textTemplateEngine;

    @Autowired
    private NotificationAuditService auditService;

    @Value("${sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${sms.provider:twilio}")
    private String smsProvider;

    // Twilio credentials (if using Twilio)
    @Value("${twilio.account.sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    private boolean twilioInitialized = false;

    @PostConstruct
    public void initTwilio() {
        if (!smsEnabled) {
            log.info("SMS service disabled. Set sms.enabled=true to enable.");
            return;
        }

        if (twilioAccountSid == null || twilioAccountSid.isBlank() ||
            twilioAuthToken == null || twilioAuthToken.isBlank()) {
            log.warn("Twilio credentials not configured. SMS notifications disabled. " +
                    "Set twilio.account.sid and twilio.auth.token to enable.");
            return;
        }

        try {
            // Disable SSL certificate validation for development
            System.setProperty("com.twilio.sdk.TrustAllCertificates", "true");

            Twilio.init(twilioAccountSid, twilioAuthToken);
            twilioInitialized = true;
            log.info("Twilio initialized successfully with account: {}", twilioAccountSid);
        } catch (Exception e) {
            log.error("Failed to initialize Twilio: {}", e.getMessage());
        }
    }

    /**
     * Send appointment created SMS
     */
    @Async
    public void sendAppointmentCreatedSms(Long surveyorId, String toPhone, String surveyorName, String title,
                                          OffsetDateTime startTime, OffsetDateTime endTime) {
        Context context = new Context();
        context.setVariable("title", title);
        context.setVariable("date", startTime.format(DATE_FORMAT));
        context.setVariable("startTime", startTime.format(TIME_FORMAT));
        context.setVariable("endTime", endTime.format(TIME_FORMAT));

        String message = textTemplateEngine.process("sms/appointment-created", context);
        sendSmsWithAudit(surveyorId, toPhone, message, "APPOINTMENT_CREATED");
    }

    /**
     * Send appointment updated (rescheduled) SMS
     */
    @Async
    public void sendAppointmentUpdatedSms(Long surveyorId, String toPhone, String surveyorName, String title,
                                          OffsetDateTime startTime, OffsetDateTime endTime) {
        Context context = new Context();
        context.setVariable("title", title);
        context.setVariable("date", startTime.format(DATE_FORMAT));
        context.setVariable("startTime", startTime.format(TIME_FORMAT));
        context.setVariable("endTime", endTime.format(TIME_FORMAT));

        String message = textTemplateEngine.process("sms/appointment-rescheduled", context);
        sendSmsWithAudit(surveyorId, toPhone, message, "APPOINTMENT_UPDATED");
    }

    /**
     * Send appointment deleted SMS
     */
    @Async
    public void sendAppointmentDeletedSms(Long surveyorId, String toPhone, String surveyorName, String title,
                                          OffsetDateTime startTime) {
        Context context = new Context();
        context.setVariable("title", title);
        context.setVariable("date", startTime.format(DATE_FORMAT));

        String message = textTemplateEngine.process("sms/appointment-deleted", context);
        sendSmsWithAudit(surveyorId, toPhone, message, "APPOINTMENT_DELETED");
    }

    /**
     * Send SMS with audit logging
     */
    private void sendSmsWithAudit(Long surveyorId, String to, String message, String eventType) {
        if (!smsEnabled) {
            log.info("SMS service disabled. Would send SMS to: {}", to);
            log.info("Message: {}", message);
            auditService.logSmsNotification(surveyorId, eventType, message, to, "DISABLED", "SMS service disabled", null);
            return;
        }

        if (!twilioInitialized) {
            log.warn("Twilio not initialized. Cannot send SMS to: {}", to);
            log.info("Message: {}", message);
            auditService.logSmsNotification(surveyorId, eventType, message, to, "NOT_CONFIGURED", "Twilio not initialized", null);
            return;
        }

        try {
            log.info("Sending SMS to: {} via Twilio", to);
            log.info("Message: {}", message);

            // Send SMS via Twilio
            Message twilioMessage = Message.creator(
                new PhoneNumber(to),           // To number
                new PhoneNumber(twilioPhoneNumber), // From number (your Twilio number)
                message                         // Message body
            ).create();

            log.info("SMS sent successfully! SID: {}", twilioMessage.getSid());
            log.info("Status: {}", twilioMessage.getStatus());
            auditService.logSmsNotification(surveyorId, eventType, message, to, "SENT", null, twilioMessage.getSid());

        } catch (com.twilio.exception.ApiException e) {
            log.error("Twilio API error sending SMS to {}: [{}] {}", to, e.getCode(), e.getMessage());
            log.error("More info: {}", e.getMoreInfo());
            auditService.logSmsNotification(surveyorId, eventType, message, to, "FAILED", e.getMessage(), null);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", to, e.getMessage(), e);
            auditService.logSmsNotification(surveyorId, eventType, message, to, "FAILED", e.getMessage(), null);
        }
    }

    /**
     * Send generic SMS (for test notifications, etc.)
     */
    public void sendSms(Long surveyorId, String to, String message) {
        sendSmsWithAudit(surveyorId, to, message, "TEST_NOTIFICATION");
    }

    /**
     * Legacy method for backward compatibility
     */
    public void sendSms(String to, String message) {
        sendSmsWithAudit(null, to, message, "GENERIC");
    }
}
