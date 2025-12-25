package com.cmx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class DeviceTokenDto {

    public record DeviceTokenRequest(
            @NotNull(message = "Surveyor ID is required")
            @Positive(message = "Surveyor ID must be a positive number") Long surveyorId,
            @NotBlank(message = "Token is required")
            @Size(max = 500, message = "Token must be 500 characters or less") String token,
            @NotBlank(message = "Platform is required")
            @Pattern(regexp = "^(ANDROID|IOS)$", message = "Platform must be ANDROID or IOS") String platform
    ) {}

    public record DeviceTokenResponse(
            boolean ok
    ) {}
}
