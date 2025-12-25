package com.cmx.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseService {

    private static final Logger logger = LoggerFactory.getLogger(SseService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Create a new SSE emitter for a client connection
     */
    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> {
            emitters.remove(emitter);
            logger.debug("SSE connection completed. Active connections: {}", emitters.size());
        });

        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            logger.debug("SSE connection timed out. Active connections: {}", emitters.size());
        });

        emitter.onError(e -> {
            emitters.remove(emitter);
            logger.debug("SSE connection error: {}. Active connections: {}", e.getMessage(), emitters.size());
        });

        emitters.add(emitter);
        logger.info("New SSE connection. Active connections: {}", emitters.size());

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"status\":\"connected\",\"message\":\"Dispatcher SSE stream connected\"}"));
        } catch (IOException e) {
            logger.error("Error sending initial SSE event", e);
        }

        return emitter;
    }

    /**
     * Send an event to all connected clients
     */
    public void sendToAll(String eventName, Map<String, Object> data) {
        if (emitters.isEmpty()) {
            logger.debug("No SSE clients connected, skipping event: {}", eventName);
            return;
        }

        String jsonData;
        try {
            jsonData = objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            logger.error("Error serializing SSE data", e);
            return;
        }

        List<SseEmitter> deadEmitters = new java.util.ArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(jsonData));
            } catch (IOException e) {
                deadEmitters.add(emitter);
                logger.debug("Failed to send SSE event to client, removing: {}", e.getMessage());
            }
        }

        emitters.removeAll(deadEmitters);

        if (!deadEmitters.isEmpty()) {
            logger.debug("Removed {} dead SSE connections. Active: {}", deadEmitters.size(), emitters.size());
        }
    }

    /**
     * Send a simple text message to all clients
     */
    public void sendMessage(String eventName, String message) {
        sendToAll(eventName, Map.of("message", message, "timestamp", System.currentTimeMillis()));
    }

    /**
     * Get the number of active connections
     */
    public int getActiveConnectionCount() {
        return emitters.size();
    }

    /**
     * Close all connections (for shutdown)
     */
    public void closeAll() {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.complete();
            } catch (Exception e) {
                // Ignore
            }
        }
        emitters.clear();
        logger.info("All SSE connections closed");
    }
}
