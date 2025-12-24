package com.cmx.service;

import com.cmx.dto.AvailabilityDto.AvailabilityBlock;
import com.cmx.exception.ResourceNotFoundException;
import com.cmx.model.SurveyorAvailability;
import com.cmx.repository.AvailabilityRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AvailabilityService {

    private static final int MAX_AVAILABILITY_LIMIT = 1000;

    private final AvailabilityRepository availabilityRepository;
    private final JdbcTemplate jdbc;

    private static final RowMapper<SurveyorAvailability> AVAILABILITY_MAPPER = (rs, rowNum) -> {
        Timestamp startTs = rs.getTimestamp("start_time");
        Timestamp endTs = rs.getTimestamp("end_time");
        Timestamp updatedTs = rs.getTimestamp("updated_at");

        return new SurveyorAvailability(
                rs.getLong("id"),
                rs.getLong("surveyor_id"),
                startTs != null ? startTs.toInstant().atOffset(ZoneOffset.UTC) : null,
                endTs != null ? endTs.toInstant().atOffset(ZoneOffset.UTC) : null,
                rs.getString("state"),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("source"),
                updatedTs != null ? updatedTs.toInstant().atOffset(ZoneOffset.UTC) : null
        );
    };

    public AvailabilityService(AvailabilityRepository availabilityRepository, JdbcTemplate jdbc) {
        this.availabilityRepository = availabilityRepository;
        this.jdbc = jdbc;
    }

    public List<Map<String, Object>> getAvailability(String from, String to, Long surveyorId,
                                                      String surveyorIds, Integer limit, Integer offset) {
        int safeLimit = Math.min(limit, MAX_AVAILABILITY_LIMIT);
        OffsetDateTime fromTime = OffsetDateTime.parse(from);
        OffsetDateTime toTime = OffsetDateTime.parse(to);

        List<SurveyorAvailability> results;

        if (surveyorId != null) {
            results = jdbc.query(
                    "SELECT * FROM surveyor_availability WHERE start_time < ? AND end_time > ? AND surveyor_id = ? ORDER BY surveyor_id, start_time LIMIT ? OFFSET ?",
                    AVAILABILITY_MAPPER,
                    Timestamp.from(toTime.toInstant()),
                    Timestamp.from(fromTime.toInstant()),
                    surveyorId,
                    safeLimit,
                    offset
            );
        } else if (surveyorIds != null && !surveyorIds.isEmpty()) {
            List<Long> ids = parseSurveyorIds(surveyorIds);
            String inClause = ids.stream().map(Object::toString).collect(Collectors.joining(","));
            results = jdbc.query(
                    "SELECT * FROM surveyor_availability WHERE start_time < ? AND end_time > ? AND surveyor_id IN (" + inClause + ") ORDER BY surveyor_id, start_time LIMIT ? OFFSET ?",
                    AVAILABILITY_MAPPER,
                    Timestamp.from(toTime.toInstant()),
                    Timestamp.from(fromTime.toInstant()),
                    safeLimit,
                    offset
            );
        } else {
            results = jdbc.query(
                    "SELECT * FROM surveyor_availability WHERE start_time < ? AND end_time > ? ORDER BY surveyor_id, start_time LIMIT ? OFFSET ?",
                    AVAILABILITY_MAPPER,
                    Timestamp.from(toTime.toInstant()),
                    Timestamp.from(fromTime.toInstant()),
                    safeLimit,
                    offset
            );
        }

        return results.stream()
                .map(this::toMap)
                .collect(Collectors.toList());
    }

    public SurveyorAvailability findById(Long id) {
        return availabilityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Availability", id));
    }

    @Caching(evict = {
            @CacheEvict(value = "availabilityCache", allEntries = true),
            @CacheEvict(value = "surveyorsCache", allEntries = true)
    })
    public void upsertAvailability(Long surveyorId, List<AvailabilityBlock> blocks) {
        String upsert =
                "MERGE INTO surveyor_availability (surveyor_id, start_time, end_time, state, title, description, source, updated_at) " +
                "KEY(surveyor_id, start_time, end_time) " +
                "VALUES (?, CAST(? AS TIMESTAMP), CAST(? AS TIMESTAMP), ?, ?, ?, 'MOBILE', CURRENT_TIMESTAMP)";

        for (AvailabilityBlock b : blocks) {
            jdbc.update(upsert, surveyorId, b.startTime(), b.endTime(), b.state(), b.title(), b.description());
        }
    }

    @Caching(evict = {
            @CacheEvict(value = "availabilityCache", allEntries = true),
            @CacheEvict(value = "surveyorsCache", allEntries = true)
    })
    public boolean updateAvailability(Long id, String startTime, String endTime, String state, String title, String description) {
        OffsetDateTime start = OffsetDateTime.parse(startTime);
        OffsetDateTime end = OffsetDateTime.parse(endTime);
        int updated = jdbc.update(
                "UPDATE surveyor_availability SET start_time = ?, end_time = ?, state = ?, title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                Timestamp.from(start.toInstant()),
                Timestamp.from(end.toInstant()),
                state,
                title,
                description,
                id
        );
        return updated == 1;
    }

    @Caching(evict = {
            @CacheEvict(value = "availabilityCache", allEntries = true),
            @CacheEvict(value = "surveyorsCache", allEntries = true)
    })
    public SurveyorAvailability deleteAvailability(Long id) {
        List<SurveyorAvailability> results = jdbc.query(
                "SELECT * FROM surveyor_availability WHERE id = ?",
                AVAILABILITY_MAPPER,
                id
        );
        if (!results.isEmpty()) {
            jdbc.update("DELETE FROM surveyor_availability WHERE id = ?", id);
            return results.get(0);
        }
        return null;
    }

    @Caching(evict = {
            @CacheEvict(value = "availabilityCache", allEntries = true),
            @CacheEvict(value = "surveyorsCache", allEntries = true)
    })
    public void createBusyBlock(Long surveyorId, OffsetDateTime start, OffsetDateTime end) {
        jdbc.update(
                "INSERT INTO surveyor_availability (surveyor_id, start_time, end_time, state, source, updated_at) " +
                "VALUES (?, ?, ?, 'BUSY', 'CMX', CURRENT_TIMESTAMP)",
                surveyorId,
                Timestamp.from(start.toInstant()),
                Timestamp.from(end.toInstant())
        );
    }

    public String getCurrentState(Long surveyorId, OffsetDateTime now) {
        String state = availabilityRepository.findCurrentState(surveyorId, now);
        return state != null ? state : "AVAILABLE";
    }

    public Long getSurveyorIdForAvailability(Long availabilityId) {
        try {
            return jdbc.queryForObject(
                    "SELECT surveyor_id FROM surveyor_availability WHERE id = ?",
                    Long.class,
                    availabilityId
            );
        } catch (Exception e) {
            return null;
        }
    }

    private Map<String, Object> toMap(SurveyorAvailability a) {
        return Map.of(
                "id", a.getId(),
                "surveyor_id", a.getSurveyorId(),
                "start_time", a.getStartTime().toString(),
                "end_time", a.getEndTime().toString(),
                "state", a.getState() != null ? a.getState() : "",
                "source", a.getSource() != null ? a.getSource() : "",
                "title", a.getTitle() != null ? a.getTitle() : "",
                "description", a.getDescription() != null ? a.getDescription() : "",
                "updated_at", a.getUpdatedAt() != null ? a.getUpdatedAt().toString() : ""
        );
    }

    private static List<Long> parseSurveyorIds(String surveyorIds) {
        return Arrays.stream(surveyorIds.split(","))
                .map(String::trim)
                .map(Long::parseLong)
                .collect(Collectors.toList());
    }
}
