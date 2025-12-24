package com.cmx.controller;

import com.cmx.dto.DispatchDto.AcceptOfferRequest;
import com.cmx.dto.DispatchDto.AcceptOfferResponse;
import com.cmx.dto.DispatchDto.CreateOfferRequest;
import com.cmx.dto.DispatchDto.OfferResponse;
import com.cmx.service.DispatchService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DispatchController {

    private final DispatchService dispatchService;

    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @PostMapping("/fnol/{fnolId}/offers")
    public ResponseEntity<OfferResponse> createOffers(
            @PathVariable("fnolId") String fnolId,
            @Valid @RequestBody CreateOfferRequest req) {
        OfferResponse response = dispatchService.createOffers(fnolId, req.candidateSurveyorIds(), req.ttlSeconds());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/offers/{offerGroup}/accept")
    public ResponseEntity<AcceptOfferResponse> acceptOffer(
            @PathVariable("offerGroup") String offerGroup,
            @Valid @RequestBody AcceptOfferRequest req) {
        AcceptOfferResponse response = dispatchService.acceptOffer(offerGroup, req.surveyorId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/{jobId}/complete")
    public ResponseEntity<Map<String, Object>> completeJob(@PathVariable("jobId") Long jobId) {
        return ResponseEntity.ok(dispatchService.completeJob(jobId));
    }
}
