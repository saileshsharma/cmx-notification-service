package com.cmx.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Abstract base class for Testcontainers-based integration tests.
 * Extend this class to get a fully configured Spring Boot test context
 * with containerized dependencies.
 *
 * Currently uses H2 for simplicity, but can be extended to use
 * PostgreSQL or other containerized databases.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    /**
     * Configure dynamic properties for test containers.
     * Add container-specific properties here when migrating to PostgreSQL.
     *
     * Example for PostgreSQL:
     * <pre>
     * static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");
     *
     * @DynamicPropertySource
     * static void configureProperties(DynamicPropertyRegistry registry) {
     *     registry.add("spring.datasource.url", postgres::getJdbcUrl);
     *     registry.add("spring.datasource.username", postgres::getUsername);
     *     registry.add("spring.datasource.password", postgres::getPassword);
     * }
     * </pre>
     */
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        // Using H2 in-memory for tests (no container needed)
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;MODE=PostgreSQL;CASE_INSENSITIVE_IDENTIFIERS=TRUE");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");

        // Disable external services for tests
        registry.add("email.enabled", () -> "false");
        registry.add("sms.enabled", () -> "false");
        registry.add("security.enabled", () -> "false");
    }
}
