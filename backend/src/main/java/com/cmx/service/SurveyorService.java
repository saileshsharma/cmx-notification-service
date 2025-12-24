package com.cmx.service;

import com.cmx.dto.SurveyorDto.SurveyorContact;
import com.cmx.exception.ResourceNotFoundException;
import com.cmx.model.Surveyor;
import com.cmx.repository.DeviceTokenRepository;
import com.cmx.repository.SurveyorRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
public class SurveyorService {

    private static final String ALL_FILTER = "ALL";

    private final SurveyorRepository surveyorRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final AvailabilityService availabilityService;
    private final JdbcTemplate jdbcTemplate;

    private static final RowMapper<Surveyor> SURVEYOR_MAPPER = (rs, rowNum) -> new Surveyor(
            rs.getLong("id"),
            rs.getString("code"),
            rs.getString("display_name"),
            rs.getDouble("home_lat"),
            rs.getDouble("home_lng"),
            rs.getString("status"),
            rs.getString("surveyor_type"),
            rs.getString("email"),
            rs.getString("phone")
    );

    public SurveyorService(SurveyorRepository surveyorRepository,
                           DeviceTokenRepository deviceTokenRepository,
                           AvailabilityService availabilityService,
                           JdbcTemplate jdbcTemplate) {
        this.surveyorRepository = surveyorRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.availabilityService = availabilityService;
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> listSurveyors(String type, String currentStatus) {
        List<Surveyor> surveyors;

        if (hasFilter(type)) {
            surveyors = jdbcTemplate.query(
                    "SELECT * FROM surveyor WHERE surveyor_type = ? ORDER BY display_name",
                    SURVEYOR_MAPPER,
                    type.toUpperCase()
            );
        } else {
            surveyors = jdbcTemplate.query(
                    "SELECT * FROM surveyor ORDER BY display_name",
                    SURVEYOR_MAPPER
            );
        }

        OffsetDateTime now = OffsetDateTime.now();

        return surveyors.stream()
                .map(s -> {
                    String status = availabilityService.getCurrentState(s.getId(), now);
                    return Map.<String, Object>of(
                            "id", s.getId(),
                            "code", s.getCode() != null ? s.getCode() : "",
                            "display_name", s.getDisplayName() != null ? s.getDisplayName() : "",
                            "home_lat", s.getHomeLat() != null ? s.getHomeLat() : 0.0,
                            "home_lng", s.getHomeLng() != null ? s.getHomeLng() : 0.0,
                            "status", s.getStatus() != null ? s.getStatus() : "",
                            "surveyor_type", s.getSurveyorType() != null ? s.getSurveyorType() : "",
                            "email", s.getEmail() != null ? s.getEmail() : "",
                            "phone", s.getPhone() != null ? s.getPhone() : "",
                            "current_status", status != null ? status : "AVAILABLE"
                    );
                })
                .filter(s -> !hasFilter(currentStatus) || currentStatus.equalsIgnoreCase((String) s.get("current_status")))
                .toList();
    }

    public Surveyor findById(Long id) {
        return surveyorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Surveyor", id));
    }

    public SurveyorContact getContact(Long surveyorId) {
        return surveyorRepository.findById(surveyorId)
                .map(s -> new SurveyorContact(s.getId(), s.getDisplayName(), s.getEmail(), s.getPhone()))
                .orElse(new SurveyorContact(surveyorId, "Surveyor " + surveyorId, null, null));
    }

    public List<Long> getAllSurveyorIds() {
        return surveyorRepository.findAllIds();
    }

    public int countSurveyors() {
        return surveyorRepository.countAll();
    }

    public int countSurveyorsWithTokens() {
        return deviceTokenRepository.countDistinctSurveyors();
    }

    public int countDeviceTokens() {
        return deviceTokenRepository.countAll();
    }

    public List<String> getDeviceTokens(Long surveyorId) {
        return deviceTokenRepository.findTokensBySurveyorId(surveyorId);
    }

    public void deleteDeviceToken(String token) {
        deviceTokenRepository.deleteByToken(token);
    }

    private static boolean hasFilter(String value) {
        return value != null && !value.isEmpty() && !ALL_FILTER.equalsIgnoreCase(value);
    }
}
