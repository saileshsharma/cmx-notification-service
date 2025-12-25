package com.cmx.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI (Swagger) configuration for the Surveyor Calendar API.
 * Access Swagger UI at: /swagger-ui.html
 * Access OpenAPI JSON at: /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Surveyor Calendar API")
                        .version("1.0.1")
                        .description("""
                                REST API for managing surveyor appointments, scheduling, and notifications.

                                ## Features
                                - **Surveyor Management**: Create, update, and query surveyors
                                - **Availability Calendar**: Manage surveyor availability blocks
                                - **Job Dispatch**: Create offers and assign jobs to surveyors
                                - **Notifications**: Push notifications via Firebase, Email, and SMS
                                - **Real-time Updates**: Server-Sent Events for live dispatcher updates

                                ## Authentication
                                When security is enabled, use Basic Authentication with admin credentials.
                                """)
                        .contact(new Contact()
                                .name("CMX Support")
                                .email("support@cmx.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("https://cmx-notification-be-production.up.railway.app")
                                .description("Production Server"),
                        new Server()
                                .url("http://localhost:8080")
                                .description("Local Development Server")
                ))
                .tags(List.of(
                        new Tag().name("Surveyors").description("Surveyor management endpoints"),
                        new Tag().name("Availability").description("Surveyor availability and calendar management"),
                        new Tag().name("Dispatch").description("Job dispatch and offer management"),
                        new Tag().name("Notifications").description("Push notifications and device token management"),
                        new Tag().name("Mobile").description("Mobile app specific endpoints"),
                        new Tag().name("Monitoring").description("Health checks and metrics")
                ))
                .components(new Components()
                        .addSecuritySchemes("basicAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("basic")
                                .description("Basic authentication for API access")
                        )
                )
                .addSecurityItem(new SecurityRequirement().addList("basicAuth"));
    }
}
