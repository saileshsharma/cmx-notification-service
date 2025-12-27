package com.cmx.service;

import com.cmx.model.FeatureFlag;
import com.cmx.model.FeatureFlagOverride;
import com.cmx.repository.FeatureFlagOverrideRepository;
import com.cmx.repository.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Service for managing feature flags.
 *
 * Features:
 * - Database-backed feature flags (100% free, no external dependencies)
 * - Per-user overrides for testing specific users
 * - Percentage-based gradual rollouts
 * - Environment-specific flags (development, staging, production)
 * - Caching for performance
 * - Variant support for A/B testing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureFlagService {

    private final FeatureFlagRepository flagRepository;
    private final FeatureFlagOverrideRepository overrideRepository;

    @Value("${app.environment:development}")
    private String currentEnvironment;

    /**
     * Check if a feature flag is enabled globally.
     */
    @Cacheable(value = "featureFlags", key = "#flagName")
    public boolean isEnabled(String flagName) {
        return isEnabled(flagName, false);
    }

    /**
     * Check if a feature flag is enabled with a default value.
     */
    public boolean isEnabled(String flagName, boolean defaultValue) {
        try {
            return flagRepository.findByName(flagName)
                    .map(flag -> evaluateFlag(flag, null))
                    .orElse(defaultValue);
        } catch (Exception e) {
            log.warn("Error checking feature flag '{}', returning default: {}", flagName, defaultValue, e);
            return defaultValue;
        }
    }

    /**
     * Check if a feature flag is enabled for a specific surveyor.
     * Checks for user-specific overrides first, then falls back to global flag.
     */
    @Cacheable(value = "featureFlagsUser", key = "#flagName + '_' + #surveyorId")
    public boolean isEnabledForUser(String flagName, Long surveyorId) {
        return isEnabledForUser(flagName, surveyorId, false);
    }

    /**
     * Check if a feature flag is enabled for a specific surveyor with default value.
     */
    public boolean isEnabledForUser(String flagName, Long surveyorId, boolean defaultValue) {
        try {
            Optional<FeatureFlag> flagOpt = flagRepository.findByName(flagName);
            if (flagOpt.isEmpty()) {
                return defaultValue;
            }

            FeatureFlag flag = flagOpt.get();

            // Check for user-specific override first
            if (surveyorId != null) {
                Optional<FeatureFlagOverride> override = overrideRepository
                        .findByFlagIdAndSurveyorId(flag.getId(), surveyorId);
                if (override.isPresent()) {
                    return override.get().isEnabled();
                }
            }

            return evaluateFlag(flag, surveyorId);
        } catch (Exception e) {
            log.warn("Error checking feature flag '{}' for surveyor '{}', returning default: {}",
                    flagName, surveyorId, defaultValue, e);
            return defaultValue;
        }
    }

    /**
     * Get multiple flags at once (for batch requests from clients).
     */
    public Map<String, Boolean> getFlags(List<String> flagNames, Long surveyorId) {
        Map<String, Boolean> result = new HashMap<>();

        List<FeatureFlag> flags = flagRepository.findByNameIn(flagNames);
        Map<String, FeatureFlag> flagMap = flags.stream()
                .collect(Collectors.toMap(FeatureFlag::getName, f -> f));

        // Get all overrides for this user if surveyorId is provided
        Map<Long, Boolean> overrides = new HashMap<>();
        if (surveyorId != null) {
            overrideRepository.findBySurveyorId(surveyorId).forEach(o ->
                    overrides.put(o.getFlagId(), o.isEnabled()));
        }

        for (String flagName : flagNames) {
            FeatureFlag flag = flagMap.get(flagName);
            if (flag == null) {
                result.put(flagName, false);
                continue;
            }

            // Check override first
            if (overrides.containsKey(flag.getId())) {
                result.put(flagName, overrides.get(flag.getId()));
            } else {
                result.put(flagName, evaluateFlag(flag, surveyorId));
            }
        }

        return result;
    }

    /**
     * Get variant information for A/B testing.
     */
    public Optional<FeatureFlagVariant> getVariant(String flagName, Long surveyorId) {
        return flagRepository.findByName(flagName)
                .filter(flag -> evaluateFlag(flag, surveyorId))
                .filter(flag -> flag.getVariantName() != null)
                .map(flag -> new FeatureFlagVariant(
                        flag.getName(),
                        true,
                        flag.getVariantName(),
                        flag.getVariantPayload()
                ));
    }

    /**
     * Get all feature flags (for admin UI).
     */
    public List<FeatureFlag> getAllFlags() {
        return StreamSupport.stream(flagRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());
    }

    /**
     * Create a new feature flag.
     */
    @Transactional
    @CacheEvict(value = {"featureFlags", "featureFlagsUser"}, allEntries = true)
    public FeatureFlag createFlag(FeatureFlag flag) {
        flag.setCreatedAt(Instant.now());
        flag.setUpdatedAt(Instant.now());
        return flagRepository.save(flag);
    }

    /**
     * Update a feature flag.
     */
    @Transactional
    @CacheEvict(value = {"featureFlags", "featureFlagsUser"}, allEntries = true)
    public FeatureFlag updateFlag(Long id, FeatureFlag updates) {
        return flagRepository.findById(id)
                .map(flag -> {
                    if (updates.getDescription() != null) {
                        flag.setDescription(updates.getDescription());
                    }
                    flag.setEnabled(updates.isEnabled());
                    flag.setRolloutPercentage(updates.getRolloutPercentage());
                    flag.setEnvironment(updates.getEnvironment());
                    flag.setVariantName(updates.getVariantName());
                    flag.setVariantPayload(updates.getVariantPayload());
                    flag.setUpdatedAt(Instant.now());
                    return flagRepository.save(flag);
                })
                .orElseThrow(() -> new IllegalArgumentException("Flag not found: " + id));
    }

    /**
     * Toggle a feature flag on/off.
     */
    @Transactional
    @CacheEvict(value = {"featureFlags", "featureFlagsUser"}, allEntries = true)
    public FeatureFlag toggleFlag(Long id) {
        return flagRepository.findById(id)
                .map(flag -> {
                    flag.setEnabled(!flag.isEnabled());
                    flag.setUpdatedAt(Instant.now());
                    return flagRepository.save(flag);
                })
                .orElseThrow(() -> new IllegalArgumentException("Flag not found: " + id));
    }

    /**
     * Set a user-specific override for a flag.
     */
    @Transactional
    @CacheEvict(value = "featureFlagsUser", allEntries = true)
    public FeatureFlagOverride setUserOverride(String flagName, Long surveyorId, boolean enabled) {
        FeatureFlag flag = flagRepository.findByName(flagName)
                .orElseThrow(() -> new IllegalArgumentException("Flag not found: " + flagName));

        Optional<FeatureFlagOverride> existing = overrideRepository
                .findByFlagIdAndSurveyorId(flag.getId(), surveyorId);

        if (existing.isPresent()) {
            FeatureFlagOverride override = existing.get();
            override.setEnabled(enabled);
            return overrideRepository.save(override);
        }

        FeatureFlagOverride override = FeatureFlagOverride.builder()
                .flagId(flag.getId())
                .surveyorId(surveyorId)
                .enabled(enabled)
                .createdAt(Instant.now())
                .build();
        return overrideRepository.save(override);
    }

    /**
     * Remove a user-specific override.
     */
    @Transactional
    @CacheEvict(value = "featureFlagsUser", allEntries = true)
    public void removeUserOverride(String flagName, Long surveyorId) {
        flagRepository.findByName(flagName).ifPresent(flag -> {
            overrideRepository.findByFlagIdAndSurveyorId(flag.getId(), surveyorId)
                    .ifPresent(overrideRepository::delete);
        });
    }

    /**
     * Evaluate a flag considering environment and rollout percentage.
     */
    private boolean evaluateFlag(FeatureFlag flag, Long surveyorId) {
        // Check if flag is globally disabled
        if (!flag.isEnabled()) {
            return false;
        }

        // Check environment
        String env = flag.getEnvironment();
        if (env != null && !env.equals("all") && !env.equals(currentEnvironment)) {
            return false;
        }

        // Check rollout percentage
        int percentage = flag.getRolloutPercentage();
        if (percentage < 100) {
            if (surveyorId == null) {
                // No user context, use random (not ideal for consistency)
                return new Random().nextInt(100) < percentage;
            }
            // Use consistent hashing based on user ID for stable rollout
            int hash = Math.abs((flag.getName() + surveyorId).hashCode() % 100);
            return hash < percentage;
        }

        return true;
    }

    /**
     * Variant response for A/B testing.
     */
    public record FeatureFlagVariant(
            String name,
            boolean enabled,
            String variantName,
            String payload
    ) {}
}
