package com.cmx.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public class DispatchDto {

    public record CreateOfferRequest(
            @NotNull List<Long> candidateSurveyorIds,
            long ttlSeconds
    ) {}

    public record AcceptOfferRequest(
            @NotNull Long surveyorId
    ) {}

    public record OfferResponse(
            String offerGroup,
            String expiresAt
    ) {}

    public record AcceptOfferResponse(
            boolean ok,
            Long jobId,
            String reason
    ) {}

    public record CompleteJobResponse(
            boolean ok
    ) {}
}
