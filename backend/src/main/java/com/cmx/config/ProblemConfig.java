package com.cmx.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.zalando.problem.jackson.ProblemModule;
import org.zalando.problem.violations.ConstraintViolationProblemModule;

/**
 * Configuration for Problem Spring Web (RFC 7807).
 * Registers Problem and ConstraintViolationProblem modules with Jackson.
 */
@Configuration
public class ProblemConfig {

    @Bean
    public ObjectMapper objectMapper() {
        return Jackson2ObjectMapperBuilder.json()
                .modules(
                        new ProblemModule(),
                        new ConstraintViolationProblemModule()
                )
                .build();
    }
}
