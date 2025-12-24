package com.cmx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class DeviceTokenDto {

    public record DeviceTokenRequest(
            @NotNull Long surveyorId,
            @NotBlank String token,
            @NotBlank String platform  // ANDROID or IOS
    ) {}

    public record DeviceTokenResponse(
            boolean ok
    ) {}
}
