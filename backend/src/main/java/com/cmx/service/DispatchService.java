package com.cmx.service;

import com.cmx.dto.DispatchDto.AcceptOfferResponse;
import com.cmx.dto.DispatchDto.OfferResponse;
import com.cmx.exception.OfferExpiredException;
import com.cmx.model.DispatchOffer;
import com.cmx.model.JobAssignment;
import com.cmx.repository.DispatchOfferRepository;
import com.cmx.repository.JobAssignmentRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DispatchService {

    private final DispatchOfferRepository dispatchOfferRepository;
    private final JobAssignmentRepository jobAssignmentRepository;
    private final AvailabilityService availabilityService;
    private final JdbcTemplate jdbc;

    public DispatchService(DispatchOfferRepository dispatchOfferRepository,
                           JobAssignmentRepository jobAssignmentRepository,
                           AvailabilityService availabilityService,
                           JdbcTemplate jdbc) {
        this.dispatchOfferRepository = dispatchOfferRepository;
        this.jobAssignmentRepository = jobAssignmentRepository;
        this.availabilityService = availabilityService;
        this.jdbc = jdbc;
    }

    public OfferResponse createOffers(String fnolId, List<Long> candidateSurveyorIds, long ttlSeconds) {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime expiresAt = now.plusSeconds(ttlSeconds);
        UUID offerGroup = UUID.randomUUID();

        for (Long surveyorId : candidateSurveyorIds) {
            jdbc.update(
                    "INSERT INTO dispatch_offer (offer_group, fnol_id, surveyor_id, status, expires_at, created_at) VALUES (?, ?, ?, 'PENDING', ?, CURRENT_TIMESTAMP)",
                    offerGroup.toString(),
                    fnolId,
                    surveyorId,
                    Timestamp.from(expiresAt.toInstant())
            );
        }

        return new OfferResponse(offerGroup.toString(), expiresAt.toString());
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "availabilityCache", allEntries = true),
            @CacheEvict(value = "surveyorsCache", allEntries = true)
    })
    public AcceptOfferResponse acceptOffer(String offerGroupStr, Long surveyorId) {
        OffsetDateTime now = OffsetDateTime.now();

        // Check if already accepted using JdbcTemplate
        Integer acceptedCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM dispatch_offer WHERE offer_group = ? AND status = 'ACCEPTED'",
                Integer.class,
                offerGroupStr
        );

        if (acceptedCount != null && acceptedCount > 0) {
            throw new OfferExpiredException(offerGroupStr);
        }

        // Try to accept the offer
        int updated = jdbc.update(
                "UPDATE dispatch_offer SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP " +
                "WHERE offer_group = ? AND surveyor_id = ? AND status = 'PENDING' AND expires_at > ?",
                offerGroupStr,
                surveyorId,
                Timestamp.from(now.toInstant())
        );

        if (updated != 1) {
            throw new OfferExpiredException(offerGroupStr);
        }

        // Get fnolId from the accepted offer
        String fnolId = jdbc.queryForObject(
                "SELECT fnol_id FROM dispatch_offer WHERE offer_group = ? LIMIT 1",
                String.class,
                offerGroupStr
        );

        // Create job assignment using JdbcTemplate to avoid type conversion issues
        OffsetDateTime start = now;
        OffsetDateTime end = now.plusHours(2);

        jdbc.update(
                "INSERT INTO job_assignment (offer_group, fnol_id, surveyor_id, status, start_time, end_time, created_at) " +
                "VALUES (?, ?, ?, 'ASSIGNED', ?, ?, CURRENT_TIMESTAMP)",
                offerGroupStr,
                fnolId,
                surveyorId,
                Timestamp.from(start.toInstant()),
                Timestamp.from(end.toInstant())
        );

        // Get the generated job ID
        Long jobId = jdbc.queryForObject("SELECT MAX(id) FROM job_assignment WHERE offer_group = ?", Long.class, offerGroupStr);

        // Create busy block for the surveyor
        availabilityService.createBusyBlock(surveyorId, start, end);

        // Close remaining pending offers
        jdbc.update(
                "UPDATE dispatch_offer SET status = 'CLOSED' WHERE offer_group = ? AND status = 'PENDING'",
                offerGroupStr
        );

        return new AcceptOfferResponse(true, jobId, null);
    }

    public Map<String, Object> completeJob(Long jobId) {
        int updated = jdbc.update(
                "UPDATE job_assignment SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'ASSIGNED'",
                jobId
        );
        return Map.of("ok", updated == 1);
    }
}
