package com.cmx.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Custom DataSource configuration that handles Railway's DATABASE_URL format.
 * Railway provides URLs like: postgresql://user:pass@host:port/database
 * JDBC requires URLs like: jdbc:postgresql://host:port/database
 */
@Configuration
public class DataSourceConfig {

    private static final Logger logger = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();

        if (databaseUrl != null && !databaseUrl.isEmpty() && databaseUrl.startsWith("postgresql://")) {
            logger.info("Detected Railway DATABASE_URL format, converting to JDBC format...");
            try {
                // Parse the Railway URL format: postgresql://user:pass@host:port/database
                URI uri = new URI(databaseUrl);

                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String database = uri.getPath().substring(1); // Remove leading slash

                // Extract username and password from userInfo
                String userInfo = uri.getUserInfo();
                String username = null;
                String password = null;
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }

                // Build JDBC URL
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, database);

                logger.info("Converted DATABASE_URL to JDBC format: jdbc:postgresql://{}:{}/{}", host, port, database);

                properties.setUrl(jdbcUrl);
                properties.setUsername(username);
                properties.setPassword(password);
                properties.setDriverClassName("org.postgresql.Driver");

            } catch (URISyntaxException e) {
                logger.error("Failed to parse DATABASE_URL: {}", e.getMessage());
                throw new RuntimeException("Invalid DATABASE_URL format", e);
            }
        } else if (databaseUrl != null && !databaseUrl.isEmpty() && databaseUrl.startsWith("jdbc:")) {
            // Already in JDBC format
            logger.info("DATABASE_URL already in JDBC format");
            properties.setUrl(databaseUrl);
        } else {
            // Fall back to H2 for local development
            logger.info("No DATABASE_URL found, using H2 for local development");
            properties.setUrl("jdbc:h2:file:./data/calendar;CASE_INSENSITIVE_IDENTIFIERS=TRUE;MODE=PostgreSQL");
            properties.setUsername("sa");
            properties.setPassword("");
            properties.setDriverClassName("org.h2.Driver");
        }

        return properties;
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        HikariDataSource dataSource = properties.initializeDataSourceBuilder()
                .type(HikariDataSource.class)
                .build();

        // Configure HikariCP pool settings
        dataSource.setMaximumPoolSize(10);
        dataSource.setMinimumIdle(2);
        dataSource.setConnectionTimeout(30000);
        dataSource.setIdleTimeout(600000);
        dataSource.setMaxLifetime(1800000);

        logger.info("DataSource configured with URL: {}",
            dataSource.getJdbcUrl() != null ? dataSource.getJdbcUrl().replaceAll("password=.*?(&|$)", "password=***$1") : "null");

        return dataSource;
    }
}
