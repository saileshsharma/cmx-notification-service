package com.cmx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

@Configuration
@EnableRetry
public class RetryConfig {
    // Retry is enabled globally
    // Use @Retryable annotations on methods that need retry logic
}
