package com.cmx.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.zalando.problem.jackson.ProblemModule;
import org.zalando.problem.violations.ConstraintViolationProblemModule;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Register JavaTimeModule for Java 8 date/time types (Instant, OffsetDateTime, etc.)
        mapper.registerModule(new JavaTimeModule());
        // Register Problem modules for RFC 7807 error responses
        mapper.registerModule(new ProblemModule());
        mapper.registerModule(new ConstraintViolationProblemModule());
        // Write dates as ISO-8601 strings instead of timestamps
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
