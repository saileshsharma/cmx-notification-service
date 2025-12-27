package com.cmx.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    // Cache names
    public static final String AVAILABILITY_CACHE = "availabilityCache";
    public static final String SURVEYORS_CACHE = "surveyorsCache";
    public static final String SURVEYOR_DETAILS_CACHE = "surveyorDetailsCache";
    public static final String APPOINTMENTS_CACHE = "appointmentsCache";
    public static final String CHAT_MESSAGES_CACHE = "chatMessagesCache";
    public static final String NOTIFICATION_STATS_CACHE = "notificationStatsCache";

    @Bean
    public Caffeine<Object, Object> caffeineConfig() {
        return Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .expireAfterAccess(10, TimeUnit.MINUTES)
                .recordStats();
    }

    @Bean
    public Caffeine<Object, Object> shortLivedCaffeineConfig() {
        return Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(1, TimeUnit.MINUTES)
                .recordStats();
    }

    @Bean
    public Caffeine<Object, Object> longLivedCaffeineConfig() {
        return Caffeine.newBuilder()
                .maximumSize(200)
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .recordStats();
    }

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(caffeineConfig());
        cacheManager.setCacheNames(java.util.List.of(
                AVAILABILITY_CACHE,
                SURVEYORS_CACHE,
                SURVEYOR_DETAILS_CACHE,
                APPOINTMENTS_CACHE,
                CHAT_MESSAGES_CACHE,
                NOTIFICATION_STATS_CACHE
        ));
        return cacheManager;
    }

    // Log cache statistics every 5 minutes for monitoring
    @Scheduled(fixedRate = 300000)
    public void logCacheStats() {
        log.debug("Cache statistics logging enabled - check metrics endpoint for details");
    }
}
