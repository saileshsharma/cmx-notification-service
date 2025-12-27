package com.cmx.controller;

import com.cmx.service.FeatureFlagService;
import io.getunleash.Variant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for exposing feature flags to frontend clients.
 * Clients can fetch their feature flag state on app initialization.
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
            @RequestParam(required = false) String userId) {

        boolean enabled;
        if (userId != null && !userId.isEmpty()) {
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
     * Check multiple feature flags at once.
     * POST /api/feature-flags/batch
     * Body: { "flags": ["flag1", "flag2"], "userId": "xxx" }
     */
    @PostMapping("/batch")
    public ResponseEntity<Map<String, Object>> checkFlags(
            @RequestBody BatchFlagRequest request) {

        Map<String, Boolean> flags = new HashMap<>();
        String userId = request.userId();

        for (String flagName : request.flags()) {
            boolean enabled;
            if (userId != null && !userId.isEmpty()) {
                enabled = featureFlagService.isEnabledForUser(flagName, userId);
            } else {
                enabled = featureFlagService.isEnabled(flagName);
            }
            flags.put(flagName, enabled);
        }

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
            @RequestParam(required = false) String userId) {

        Variant variant;
        if (userId != null && !userId.isEmpty()) {
            variant = featureFlagService.getVariant(flagName, userId);
        } else {
            variant = featureFlagService.getVariant(flagName);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("name", flagName);
        response.put("enabled", variant.isEnabled());
        response.put("variantName", variant.getName());
        variant.getPayload().ifPresent(payload -> {
            response.put("payload", payload.getValue());
            response.put("payloadType", payload.getType());
        });

        return ResponseEntity.ok(response);
    }

    public record BatchFlagRequest(List<String> flags, String userId) {}
}
