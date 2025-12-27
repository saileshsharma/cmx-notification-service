package com.cmx.service;

import io.getunleash.Unleash;
import io.getunleash.UnleashContext;
import io.getunleash.Variant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service for checking feature flags via Unleash.
 *
 * Usage examples:
 *
 * 1. Simple boolean flag:
 *    if (featureFlagService.isEnabled("new-chat-feature")) { ... }
 *
 * 2. User-specific flag (gradual rollout):
 *    if (featureFlagService.isEnabledForUser("premium-dashboard", userId)) { ... }
 *
 * 3. Variant (A/B testing):
 *    Variant variant = featureFlagService.getVariant("checkout-button-color", userId);
 *    String buttonColor = variant.getPayload().map(p -> p.getValue()).orElse("blue");
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final Unleash unleash;

    /**
     * Check if a feature flag is enabled globally.
     */
    public boolean isEnabled(String featureName) {
        return isEnabled(featureName, false);
    }

    /**
     * Check if a feature flag is enabled with a default value.
     */
    public boolean isEnabled(String featureName, boolean defaultValue) {
        try {
            return unleash.isEnabled(featureName, defaultValue);
        } catch (Exception e) {
            log.warn("Error checking feature flag '{}', returning default: {}", featureName, defaultValue, e);
            return defaultValue;
        }
    }

    /**
     * Check if a feature flag is enabled for a specific user.
     * Used for gradual rollouts and user targeting.
     */
    public boolean isEnabledForUser(String featureName, String userId) {
        return isEnabledForUser(featureName, userId, false);
    }

    /**
     * Check if a feature flag is enabled for a specific user with default value.
     */
    public boolean isEnabledForUser(String featureName, String userId, boolean defaultValue) {
        try {
            UnleashContext context = UnleashContext.builder()
                    .userId(userId)
                    .build();
            return unleash.isEnabled(featureName, context, defaultValue);
        } catch (Exception e) {
            log.warn("Error checking feature flag '{}' for user '{}', returning default: {}",
                    featureName, userId, defaultValue, e);
            return defaultValue;
        }
    }

    /**
     * Check if a feature flag is enabled for a specific surveyor.
     * Includes surveyor-specific context properties.
     */
    public boolean isEnabledForSurveyor(String featureName, Long surveyorId, String surveyorEmail) {
        try {
            UnleashContext context = UnleashContext.builder()
                    .userId(String.valueOf(surveyorId))
                    .addProperty("surveyorId", String.valueOf(surveyorId))
                    .addProperty("email", surveyorEmail)
                    .build();
            return unleash.isEnabled(featureName, context);
        } catch (Exception e) {
            log.warn("Error checking feature flag '{}' for surveyor '{}', returning false",
                    featureName, surveyorId, e);
            return false;
        }
    }

    /**
     * Get a variant for A/B testing.
     * Returns the variant name and optional payload.
     */
    public Variant getVariant(String featureName) {
        try {
            return unleash.getVariant(featureName);
        } catch (Exception e) {
            log.warn("Error getting variant for '{}', returning disabled", featureName, e);
            return Variant.DISABLED_VARIANT;
        }
    }

    /**
     * Get a variant for a specific user (A/B testing with user targeting).
     */
    public Variant getVariant(String featureName, String userId) {
        try {
            UnleashContext context = UnleashContext.builder()
                    .userId(userId)
                    .build();
            return unleash.getVariant(featureName, context);
        } catch (Exception e) {
            log.warn("Error getting variant for '{}' for user '{}', returning disabled",
                    featureName, userId, e);
            return Variant.DISABLED_VARIANT;
        }
    }

    /**
     * Get the variant name as a string (for simpler usage).
     * Returns empty string if variant is disabled.
     */
    public String getVariantName(String featureName, String userId) {
        Variant variant = getVariant(featureName, userId);
        if (variant.isEnabled()) {
            return variant.getName();
        }
        return "";
    }
}
