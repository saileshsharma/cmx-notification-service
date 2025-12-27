package com.cmx.controller;

import com.cmx.model.FeatureFlag;
import com.cmx.service.FeatureFlagService;
import com.cmx.service.FeatureFlagService.FeatureFlagVariant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for feature flags.
 * Provides endpoints for clients to check flags and for admins to manage them.
 */
@RestController
@RequestMapping("/api/feature-flags")
@RequiredArgsConstructor
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    /**
     * Check a single feature flag.
     * GET /api/feature-flags/{flagName}?userId=xxx
     */
    @GetMapping("/{flagName}")
    public ResponseEntity<Map<String, Object>> checkFlag(
            @PathVariable String flagName,
            @RequestParam(required = false) Long userId) {

        boolean enabled;
        if (userId != null) {
            enabled = featureFlagService.isEnabledForUser(flagName, userId);
        } else {
            enabled = featureFlagService.isEnabled(flagName);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("name", flagName);
        response.put("enabled", enabled);

        return ResponseEntity.ok(response);
    }

    /**
     * Check multiple feature flags at once (batch request).
     * POST /api/feature-flags/batch
     * Body: { "flags": ["flag1", "flag2"], "userId": 123 }
     */
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> checkFlags(
            @RequestBody BatchFlagRequest request) {

        Map<String, Boolean> flags = featureFlagService.getFlags(request.flags(), request.userId());

        Map<String, Object> response = new HashMap<>();
        response.put("flags", flags);

        return ResponseEntity.ok(response);
    }

    /**
     * Get variant for A/B testing.
     * GET /api/feature-flags/{flagName}/variant?userId=xxx
     */
    @GetMapping("/{flagName}/variant")
    public ResponseEntity<Map<String, Object>> getVariant(
            @PathVariable String flagName,
            @RequestParam(required = false) Long userId) {

        var variant = featureFlagService.getVariant(flagName, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("name", flagName);

        if (variant.isPresent()) {
            FeatureFlagVariant v = variant.get();
            response.put("enabled", v.enabled());
            response.put("variantName", v.variantName());
            if (v.payload() != null) {
                response.put("payload", v.payload());
            }
        } else {
            response.put("enabled", false);
            response.put("variantName", "disabled");
        }

        return ResponseEntity.ok(response);
    }

    // ==================== Admin Endpoints ====================

    /**
     * Get all feature flags (admin).
     * GET /api/feature-flags
     */
    @GetMapping
    public ResponseEntity<List<FeatureFlag>> getAllFlags() {
        return ResponseEntity.ok(featureFlagService.getAllFlags());
    }

    /**
     * Create a new feature flag (admin).
     * POST /api/feature-flags
     */
    @PostMapping
    public ResponseEntity<FeatureFlag> createFlag(@RequestBody FeatureFlag flag) {
        return ResponseEntity.ok(featureFlagService.createFlag(flag));
    }

    /**
     * Update a feature flag (admin).
     * PUT /api/feature-flags/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<FeatureFlag> updateFlag(
            @PathVariable Long id,
            @RequestBody FeatureFlag flag) {
        return ResponseEntity.ok(featureFlagService.updateFlag(id, flag));
    }

    /**
     * Toggle a feature flag (admin).
     * POST /api/feature-flags/{id}/toggle
     */
    @PostMapping("/{id}/toggle")
    public ResponseEntity<FeatureFlag> toggleFlag(@PathVariable Long id) {
        return ResponseEntity.ok(featureFlagService.toggleFlag(id));
    }

    /**
     * Set a user-specific override (admin).
     * POST /api/feature-flags/{flagName}/override
     */
    @PostMapping("/{flagName}/override")
    public ResponseEntity<?> setUserOverride(
            @PathVariable String flagName,
            @RequestBody OverrideRequest request) {
        var override = featureFlagService.setUserOverride(
                flagName, request.surveyorId(), request.enabled());
        return ResponseEntity.ok(override);
    }

    /**
     * Remove a user-specific override (admin).
     * DELETE /api/feature-flags/{flagName}/override/{surveyorId}
     */
    @DeleteMapping("/{flagName}/override/{surveyorId}")
    public ResponseEntity<Void> removeUserOverride(
            @PathVariable String flagName,
            @PathVariable Long surveyorId) {
        featureFlagService.removeUserOverride(flagName, surveyorId);
        return ResponseEntity.noContent().build();
    }

    public record BatchFlagRequest(List<String> flags, Long userId) {}

    public record OverrideRequest(Long surveyorId, boolean enabled) {}
}
