package com.cmx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AvailabilityDto {

    public record AvailabilityUpdateRequest(
            @NotBlank String startTime,
            @NotBlank String endTime,
            @NotBlank String state,
            @Size(max = 100) String title,
            @Size(max = 255) String description
    ) {}

    public record AvailabilityUpsertRequest(
            @NotNull Long surveyorId,
            @NotNull List<AvailabilityBlock> blocks
    ) {}

    public record AvailabilityBlock(
            @NotBlank String startTime,
            @NotBlank String endTime,
            @NotBlank @Size(max = 16) String state,
            @Size(max = 100) String title,
            @Size(max = 255) String description
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
