package com.cmx.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AvailabilityDto {

    // Valid state values for availability blocks
    private static final String STATE_PATTERN = "^(AVAILABLE|BUSY|OFFLINE|AWAY|VACATION|PENDING|CONFIRMED|CANCELLED)$";
    private static final String STATE_MESSAGE = "State must be one of: AVAILABLE, BUSY, OFFLINE, AWAY, VACATION, PENDING, CONFIRMED, CANCELLED";

    public record AvailabilityUpdateRequest(
            @NotBlank(message = "Start time is required") String startTime,
            @NotBlank(message = "End time is required") String endTime,
            @NotBlank(message = "State is required")
            @Pattern(regexp = STATE_PATTERN, message = STATE_MESSAGE) String state,
            @Size(max = 100, message = "Title must be 100 characters or less") String title,
            @Size(max = 255, message = "Description must be 255 characters or less") String description
    ) {}

    public record AvailabilityUpsertRequest(
            @NotNull(message = "Surveyor ID is required")
            @Positive(message = "Surveyor ID must be a positive number") Long surveyorId,
            @NotNull(message = "Blocks list is required")
            @Valid List<AvailabilityBlock> blocks
    ) {}

    public record AvailabilityBlock(
            @NotBlank(message = "Start time is required") String startTime,
            @NotBlank(message = "End time is required") String endTime,
            @NotBlank(message = "State is required")
            @Size(max = 16, message = "State must be 16 characters or less")
            @Pattern(regexp = STATE_PATTERN, message = STATE_MESSAGE) String state,
            @Size(max = 100, message = "Title must be 100 characters or less") String title,
            @Size(max = 255, message = "Description must be 255 characters or less") String description
    ) {}

    public record AvailabilityResponse(
            Long id,
            Long surveyorId,
            String startTime,
            String endTime,
            String state,
            String source,
            String title,
            String description,
            String updatedAt
    ) {}
}
