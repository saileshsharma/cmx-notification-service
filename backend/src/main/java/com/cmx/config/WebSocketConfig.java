package com.cmx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker for subscriptions
        // Clients subscribe to /topic/* for broadcasts or /user/queue/* for private messages
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages sent from clients to server
        config.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific destinations (e.g., /user/{userId}/queue/messages)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint for clients to connect
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback for browsers that don't support WebSocket

        // Pure WebSocket endpoint (for mobile apps)
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns("*");
    }
}
