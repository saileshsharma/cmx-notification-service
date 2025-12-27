package com.cmx.config;

import io.getunleash.DefaultUnleash;
import io.getunleash.Unleash;
import io.getunleash.util.UnleashConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UnleashConfig {

    @Value("${unleash.api-url:http://localhost:4242/api}")
    private String apiUrl;

    @Value("${unleash.api-token:}")
    private String apiToken;

    @Value("${unleash.app-name:fleetinspect-backend}")
    private String appName;

    @Value("${unleash.environment:development}")
    private String environment;

    @Value("${unleash.enabled:true}")
    private boolean enabled;

    @Bean
    public Unleash unleash() {
        if (!enabled || apiToken.isEmpty()) {
            // Return a no-op Unleash that always returns false
            return new NoOpUnleash();
        }

        UnleashConfig config = UnleashConfig.builder()
                .appName(appName)
                .instanceId(appName + "-" + System.currentTimeMillis())
                .unleashAPI(apiUrl)
                .apiKey(apiToken)
                .environment(environment)
                .synchronousFetchOnInitialisation(true)
                .build();

        return new DefaultUnleash(config);
    }

    /**
     * No-op Unleash implementation for when Unleash is disabled or not configured.
     * All feature flags default to false.
     */
    private static class NoOpUnleash implements Unleash {
        @Override
        public boolean isEnabled(String toggleName) {
            return false;
        }

        @Override
        public boolean isEnabled(String toggleName, boolean defaultSetting) {
            return defaultSetting;
        }

        @Override
        public boolean isEnabled(String toggleName, io.getunleash.UnleashContext context) {
            return false;
        }

        @Override
        public boolean isEnabled(String toggleName, io.getunleash.UnleashContext context, boolean defaultSetting) {
            return defaultSetting;
        }

        @Override
        public io.getunleash.Variant getVariant(String toggleName) {
            return io.getunleash.Variant.DISABLED_VARIANT;
        }

        @Override
        public io.getunleash.Variant getVariant(String toggleName, io.getunleash.UnleashContext context) {
            return io.getunleash.Variant.DISABLED_VARIANT;
        }

        @Override
        public io.getunleash.Variant getVariant(String toggleName, io.getunleash.Variant defaultValue) {
            return defaultValue;
        }

        @Override
        public io.getunleash.Variant getVariant(String toggleName, io.getunleash.UnleashContext context, io.getunleash.Variant defaultValue) {
            return defaultValue;
        }

        @Override
        public java.util.List<String> getFeatureToggleNames() {
            return java.util.Collections.emptyList();
        }

        @Override
        public void shutdown() {
            // No-op
        }

        @Override
        public io.getunleash.event.MoreOperations more() {
            return null;
        }
    }
}
