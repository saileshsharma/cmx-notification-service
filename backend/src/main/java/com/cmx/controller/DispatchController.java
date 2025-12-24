package com.cmx.controller;

import com.cmx.dto.DispatchDto.AcceptOfferRequest;
import com.cmx.dto.DispatchDto.AcceptOfferResponse;
import com.cmx.dto.DispatchDto.CreateOfferRequest;
import com.cmx.dto.DispatchDto.OfferResponse;
import com.cmx.service.DispatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@Tag(name = "Dispatch", description = "Job dispatch and offer management APIs")
public class DispatchController {

    private final DispatchService dispatchService;

    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @Operation(
        summary = "Create job offers",
        description = "Creates job offers for candidate surveyors for a given FNOL"
    )
    @ApiResponse(responseCode = "200", description = "Offers created successfully")
    @PostMapping("/fnol/{fnolId}/offers")
    public ResponseEntity<OfferResponse> createOffers(
            @Parameter(description = "FNOL ID") @PathVariable("fnolId") String fnolId,
            @Valid @RequestBody CreateOfferRequest req) {
        OfferResponse response = dispatchService.createOffers(fnolId, req.candidateSurveyorIds(), req.ttlSeconds());
        return ResponseEntity.ok(response);
    }

    @Operation(
        summary = "Accept an offer",
        description = "Accepts a job offer for a specific surveyor"
    )
    @ApiResponse(responseCode = "200", description = "Offer accepted successfully")
    @PostMapping("/offers/{offerGroup}/accept")
    public ResponseEntity<AcceptOfferResponse> acceptOffer(
            @Parameter(description = "Offer group ID") @PathVariable("offerGroup") String offerGroup,
            @Valid @RequestBody AcceptOfferRequest req) {
        AcceptOfferResponse response = dispatchService.acceptOffer(offerGroup, req.surveyorId());
        return ResponseEntity.ok(response);
    }

    @Operation(
        summary = "Complete a job",
        description = "Marks a job as completed"
    )
    @ApiResponse(responseCode = "200", description = "Job completed successfully")
    @PostMapping("/jobs/{jobId}/complete")
    public ResponseEntity<Map<String, Object>> completeJob(
            @Parameter(description = "Job ID") @PathVariable("jobId") Long jobId) {
        return ResponseEntity.ok(dispatchService.completeJob(jobId));
    }
}
