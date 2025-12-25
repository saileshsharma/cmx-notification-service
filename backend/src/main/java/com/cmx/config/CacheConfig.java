package com.cmx.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String AVAILABILITY_CACHE = "availabilityCache";
    public static final String SURVEYORS_CACHE = "surveyorsCache";
    public static final String SURVEYOR_DETAILS_CACHE = "surveyorDetailsCache";

    @Bean
    public Caffeine<Object, Object> caffeineConfig() {
        return Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .recordStats();
    }

    @Bean
    public CacheManager cacheManager(Caffeine<Object, Object> caffeine) {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                AVAILABILITY_CACHE,
                SURVEYORS_CACHE,
                SURVEYOR_DETAILS_CACHE
        );
        cacheManager.setCaffeine(caffeine);
        return cacheManager;
    }
}
