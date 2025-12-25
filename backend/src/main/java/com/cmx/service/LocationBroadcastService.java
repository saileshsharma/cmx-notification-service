package com.cmx.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service for broadcasting real-time location updates to connected clients via SSE.
 */
@Service
public class LocationBroadcastService {

    private static final Logger logger = LoggerFactory.getLogger(LocationBroadcastService.class);

    // Connected SSE clients
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    // Location history for trail visualization (last N positions per surveyor)
    private final ConcurrentHashMap<Long, CopyOnWriteArrayList<LocationPoint>> locationHistory = new ConcurrentHashMap<>();

    private static final int MAX_HISTORY_POINTS = 20; // Keep last 20 positions for trail

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // No timeout

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            logger.debug("SSE client disconnected. Active clients: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitter.complete();
            emitters.remove(emitter);
        });

        emitter.onError(e -> {
            emitter.complete();
            emitters.remove(emitter);
        });

        emitters.add(emitter);
        logger.info("New SSE client connected. Active clients: {}", emitters.size());

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("message", "Connected to location stream", "timestamp", System.currentTimeMillis())));
        } catch (IOException e) {
            logger.error("Failed to send initial event", e);
        }

        return emitter;
    }

    /**
     * Broadcast location update to all connected clients
     */
    public void broadcastLocationUpdate(Long surveyorId, Double lat, Double lng, String status, String displayName) {
        // Add to history
        addToHistory(surveyorId, lat, lng);

        // Create event data
        Map<String, Object> data = Map.of(
                "surveyorId", surveyorId,
                "lat", lat,
                "lng", lng,
                "status", status != null ? status : "AVAILABLE",
                "displayName", displayName != null ? displayName : "Surveyor " + surveyorId,
                "timestamp", System.currentTimeMillis(),
                "trail", getLocationTrail(surveyorId)
        );

        // Broadcast to all connected clients - collect dead emitters for removal
        java.util.List<SseEmitter> deadEmitters = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("location")
                        .data(data));
            } catch (Exception e) {
                // Don't call complete() here - just mark for removal
                deadEmitters.add(emitter);
                logger.debug("Removing dead SSE client on location broadcast");
            }
        }
        emitters.removeAll(deadEmitters);

        logger.debug("Broadcasted location for surveyor {}: ({}, {}). Clients: {}", surveyorId, lat, lng, emitters.size());
    }

    /**
     * Broadcast status-only update
     */
    public void broadcastStatusUpdate(Long surveyorId, String status, String displayName) {
        Map<String, Object> data = Map.of(
                "surveyorId", surveyorId,
                "status", status,
                "displayName", displayName != null ? displayName : "Surveyor " + surveyorId,
                "timestamp", System.currentTimeMillis()
        );

        java.util.List<SseEmitter> deadEmitters = new java.util.ArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(data));
            } catch (Exception e) {
                deadEmitters.add(emitter);
                logger.debug("Removing dead SSE client on status broadcast");
            }
        }
        emitters.removeAll(deadEmitters);
    }

    /**
     * Add location point to history for trail visualization
     */
    private void addToHistory(Long surveyorId, Double lat, Double lng) {
        CopyOnWriteArrayList<LocationPoint> history = locationHistory.computeIfAbsent(
                surveyorId, k -> new CopyOnWriteArrayList<>());

        history.add(new LocationPoint(lat, lng, System.currentTimeMillis()));

        // Keep only last N points
        while (history.size() > MAX_HISTORY_POINTS) {
            history.remove(0);
        }
    }

    /**
     * Get location trail for a surveyor
     */
    public java.util.List<Map<String, Object>> getLocationTrail(Long surveyorId) {
        CopyOnWriteArrayList<LocationPoint> history = locationHistory.get(surveyorId);
        if (history == null || history.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        return history.stream()
                .map(p -> Map.<String, Object>of("lat", p.lat, "lng", p.lng, "timestamp", p.timestamp))
                .toList();
    }

    /**
     * Get all location trails for initial load
     */
    public Map<Long, java.util.List<Map<String, Object>>> getAllTrails() {
        java.util.HashMap<Long, java.util.List<Map<String, Object>>> trails = new java.util.HashMap<>();
        for (Long surveyorId : locationHistory.keySet()) {
            trails.put(surveyorId, getLocationTrail(surveyorId));
        }
        return trails;
    }

    /**
     * Clear history for a surveyor (e.g., when they go offline)
     */
    public void clearHistory(Long surveyorId) {
        locationHistory.remove(surveyorId);
    }

    public int getActiveClientCount() {
        return emitters.size();
    }

    /**
     * Location point record
     */
    private static class LocationPoint {
        final double lat;
        final double lng;
        final long timestamp;

        LocationPoint(double lat, double lng, long timestamp) {
            this.lat = lat;
            this.lng = lng;
            this.timestamp = timestamp;
        }
    }
}
