package com.cmx.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class CacheConfig {

    public static final String AVAILABILITY_CACHE = "availabilityCache";
    public static final String SURVEYORS_CACHE = "surveyorsCache";

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager(
            AVAILABILITY_CACHE, SURVEYORS_CACHE
        );
        // Allow dynamic cache creation as well
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }
}
