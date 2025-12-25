package com.cmx.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Custom business metrics for Prometheus monitoring.
 * Provides counters, gauges, and timers for key business operations.
 */
@Service
public class MetricsService {

    private final MeterRegistry meterRegistry;

    // Counters
    private final Counter appointmentsCreated;
    private final Counter appointmentsCompleted;
    private final Counter notificationsSent;
    private final Counter notificationsFailed;
    private final Counter locationUpdates;

    // Gauges - track current values
    private final AtomicInteger activeSurveyors = new AtomicInteger(0);
    private final AtomicInteger pendingAppointments = new AtomicInteger(0);
    private final AtomicInteger activeSSEConnections = new AtomicInteger(0);

    // Timers
    private final Timer appointmentProcessingTimer;
    private final Timer notificationDeliveryTimer;

    public MetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // Initialize counters
        this.appointmentsCreated = Counter.builder("surveyor.appointments.created")
                .description("Total number of appointments created")
                .register(meterRegistry);

        this.appointmentsCompleted = Counter.builder("surveyor.appointments.completed")
                .description("Total number of appointments completed")
                .register(meterRegistry);

        this.notificationsSent = Counter.builder("surveyor.notifications.sent")
                .description("Total number of notifications sent successfully")
                .register(meterRegistry);

        this.notificationsFailed = Counter.builder("surveyor.notifications.failed")
                .description("Total number of notifications that failed")
                .register(meterRegistry);

        this.locationUpdates = Counter.builder("surveyor.location.updates")
                .description("Total number of location updates received")
                .register(meterRegistry);

        // Initialize gauges
        Gauge.builder("surveyor.active.count", activeSurveyors, AtomicInteger::get)
                .description("Number of currently active surveyors")
                .register(meterRegistry);

        Gauge.builder("surveyor.appointments.pending", pendingAppointments, AtomicInteger::get)
                .description("Number of pending appointments")
                .register(meterRegistry);

        Gauge.builder("surveyor.sse.connections", activeSSEConnections, AtomicInteger::get)
                .description("Number of active SSE connections")
                .register(meterRegistry);

        // Initialize timers
        this.appointmentProcessingTimer = Timer.builder("surveyor.appointment.processing.time")
                .description("Time taken to process appointments")
                .register(meterRegistry);

        this.notificationDeliveryTimer = Timer.builder("surveyor.notification.delivery.time")
                .description("Time taken to deliver notifications")
                .register(meterRegistry);
    }

    // Counter methods
    public void incrementAppointmentsCreated() {
        appointmentsCreated.increment();
    }

    public void incrementAppointmentsCompleted() {
        appointmentsCompleted.increment();
    }

    public void incrementNotificationsSent() {
        notificationsSent.increment();
    }

    public void incrementNotificationsFailed() {
        notificationsFailed.increment();
    }

    public void incrementLocationUpdates() {
        locationUpdates.increment();
    }

    // Gauge methods
    public void setActiveSurveyors(int count) {
        activeSurveyors.set(count);
    }

    public void setPendingAppointments(int count) {
        pendingAppointments.set(count);
    }

    public void incrementSSEConnections() {
        activeSSEConnections.incrementAndGet();
    }

    public void decrementSSEConnections() {
        activeSSEConnections.decrementAndGet();
    }

    // Timer methods
    public Timer.Sample startAppointmentTimer() {
        return Timer.start(meterRegistry);
    }

    public void stopAppointmentTimer(Timer.Sample sample) {
        sample.stop(appointmentProcessingTimer);
    }

    public Timer.Sample startNotificationTimer() {
        return Timer.start(meterRegistry);
    }

    public void stopNotificationTimer(Timer.Sample sample) {
        sample.stop(notificationDeliveryTimer);
    }

    // Counter with tags for specific notification types
    public void recordNotification(String type, String channel, boolean success) {
        Counter.builder("surveyor.notification.by.type")
                .tag("type", type)
                .tag("channel", channel)
                .tag("status", success ? "success" : "failure")
                .description("Notifications by type and channel")
                .register(meterRegistry)
                .increment();
    }
}
