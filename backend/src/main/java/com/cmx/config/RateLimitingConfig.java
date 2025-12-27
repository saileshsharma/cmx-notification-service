package com.cmx.config;

import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitingConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingConfig.class);

    private final RateLimiterRegistry rateLimiterRegistry;

    // Per-IP rate limiters for more granular control
    private final Map<String, RateLimiter> ipRateLimiters = new ConcurrentHashMap<>();

    public RateLimitingConfig(RateLimiterRegistry rateLimiterRegistry) {
        this.rateLimiterRegistry = rateLimiterRegistry;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Login endpoint - strictest rate limiting
        registry.addInterceptor(new RateLimitInterceptor("loginApi"))
                .addPathPatterns("/api/mobile/login");

        // Mobile API endpoints
        registry.addInterceptor(new RateLimitInterceptor("mobileApi"))
                .addPathPatterns("/api/mobile/**")
                .excludePathPatterns("/api/mobile/login");

        // Chat API endpoints
        registry.addInterceptor(new RateLimitInterceptor("chatApi"))
                .addPathPatterns("/api/chat/**");

        // Availability API endpoints
        registry.addInterceptor(new RateLimitInterceptor("availabilityApi"))
                .addPathPatterns("/api/availability/**", "/api/mobile/availability");

        // General read endpoints
        registry.addInterceptor(new RateLimitInterceptor("readApi"))
                .addPathPatterns("/api/surveyors/**", "/api/notifications/**");
    }

    private class RateLimitInterceptor implements HandlerInterceptor {

        private final String rateLimiterName;

        public RateLimitInterceptor(String rateLimiterName) {
            this.rateLimiterName = rateLimiterName;
        }

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
            String clientIp = getClientIP(request);
            String rateLimiterKey = rateLimiterName + "-" + clientIp;

            // Get or create per-IP rate limiter
            RateLimiter rateLimiter = ipRateLimiters.computeIfAbsent(rateLimiterKey, key -> {
                RateLimiter baseRateLimiter = rateLimiterRegistry.rateLimiter(rateLimiterName);
                return RateLimiter.of(key, baseRateLimiter.getRateLimiterConfig());
            });

            try {
                boolean permitted = rateLimiter.acquirePermission();
                if (!permitted) {
                    log.warn("Rate limit exceeded for {} from IP {}", rateLimiterName, clientIp);
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Too many requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"retryAfter\":1}");
                    return false;
                }
                return true;
            } catch (RequestNotPermitted e) {
                log.warn("Rate limit exceeded for {} from IP {}", rateLimiterName, clientIp);
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too many requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"retryAfter\":1}");
                return false;
            }
        }

        private String getClientIP(HttpServletRequest request) {
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isEmpty()) {
                return xfHeader.split(",")[0].trim();
            }
            String realIp = request.getHeader("X-Real-IP");
            if (realIp != null && !realIp.isEmpty()) {
                return realIp;
            }
            return request.getRemoteAddr();
        }
    }

    // Cleanup old rate limiters periodically (called by scheduled task)
    public void cleanupOldRateLimiters() {
        // In production, implement cleanup of stale IP-based rate limiters
        log.debug("Rate limiter cleanup - current count: {}", ipRateLimiters.size());
    }
}
