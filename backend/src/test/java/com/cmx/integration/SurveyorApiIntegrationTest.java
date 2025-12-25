package com.cmx.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for Surveyor API endpoints.
 * Uses Testcontainers infrastructure for isolated testing.
 */
class SurveyorApiIntegrationTest extends AbstractIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String getBaseUrl() {
        return "http://localhost:" + port;
    }

    @Test
    void healthEndpointShouldReturnUp() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                getBaseUrl() + "/actuator/health",
                String.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("UP"));
    }

    @Test
    void getSurveyorsShouldReturnList() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                getBaseUrl() + "/surveyors",
                String.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void getSurveyorsWithTypeFilterShouldWork() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                getBaseUrl() + "/surveyors?type=INTERNAL",
                String.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void getAvailabilityForNonExistentSurveyorShouldReturnEmptyList() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                getBaseUrl() + "/availability?surveyorId=99999",
                String.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("[]"));
    }

    @Test
    void prometheusMetricsShouldBeExposed() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                getBaseUrl() + "/actuator/prometheus",
                String.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        // Verify some expected metrics are present
        assertTrue(response.getBody().contains("jvm_memory"));
        assertTrue(response.getBody().contains("http_server"));
    }

    @Test
    void invalidEndpointShouldReturn404() {
        ResponseEntity<String> response = restTemplate.getForEntity(
                getBaseUrl() + "/api/nonexistent",
                String.class
        );

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
