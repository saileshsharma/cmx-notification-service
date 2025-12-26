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

    private static final RowMapper<Surveyor> SURVEYOR_MAPPER = (rs, rowNum) -> {
        // Handle potentially null numeric values safely
        Double homeLat = rs.getObject("home_lat") != null ? rs.getDouble("home_lat") : null;
        Double homeLng = rs.getObject("home_lng") != null ? rs.getDouble("home_lng") : null;

        Surveyor s = new Surveyor(
            rs.getLong("id"),
            rs.getString("code"),
            rs.getString("display_name"),
            homeLat != null ? homeLat : 0.0,
            homeLng != null ? homeLng : 0.0,
            rs.getString("status"),
            rs.getString("surveyor_type"),
            rs.getString("email"),
            rs.getString("phone")
        );
        // Add current location tracking fields
        s.setCurrentLat(rs.getObject("current_lat") != null ? rs.getDouble("current_lat") : null);
        s.setCurrentLng(rs.getObject("current_lng") != null ? rs.getDouble("current_lng") : null);
        s.setCurrentStatus(rs.getString("current_status"));
        try {
            java.sql.Timestamp lastUpdate = rs.getTimestamp("last_location_update");
            if (lastUpdate != null) {
                s.setLastLocationUpdate(java.time.OffsetDateTime.ofInstant(lastUpdate.toInstant(), java.time.ZoneId.systemDefault()));
            }
        } catch (Exception e) {
            // Ignore timestamp parsing errors for PostgreSQL compatibility
        }
        return s;
    };

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
                    java.util.HashMap<String, Object> map = new java.util.HashMap<>();
                    map.put("id", s.getId());
                    map.put("code", s.getCode() != null ? s.getCode() : "");
                    map.put("display_name", s.getDisplayName() != null ? s.getDisplayName() : "");
                    map.put("home_lat", s.getHomeLat() != null ? s.getHomeLat() : 0.0);
                    map.put("home_lng", s.getHomeLng() != null ? s.getHomeLng() : 0.0);
                    map.put("status", s.getStatus() != null ? s.getStatus() : "");
                    map.put("surveyor_type", s.getSurveyorType() != null ? s.getSurveyorType() : "");
                    map.put("email", s.getEmail() != null ? s.getEmail() : "");
                    map.put("phone", s.getPhone() != null ? s.getPhone() : "");
                    map.put("current_status", status != null ? status : "AVAILABLE");
                    // Location tracking fields for real-time map view
                    map.put("current_lat", s.getCurrentLat());
                    map.put("current_lng", s.getCurrentLng());
                    map.put("last_location_update", s.getLastLocationUpdate() != null ? s.getLastLocationUpdate().toString() : null);
                    return (Map<String, Object>) map;
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

    /**
     * Update surveyor's current location
     */
    public boolean updateLocation(Long surveyorId, Double lat, Double lng) {
        int updated = jdbcTemplate.update(
                "UPDATE surveyor SET current_lat = ?, current_lng = ?, last_location_update = CURRENT_TIMESTAMP WHERE id = ?",
                lat, lng, surveyorId
        );
        return updated == 1;
    }

    /**
     * Update surveyor's current status (AVAILABLE, BUSY, OFFLINE)
     */
    public boolean updateStatus(Long surveyorId, String status) {
        int updated = jdbcTemplate.update(
                "UPDATE surveyor SET current_status = ? WHERE id = ?",
                status, surveyorId
        );
        return updated == 1;
    }

    /**
     * Update both location and status
     */
    public boolean updateLocationAndStatus(Long surveyorId, Double lat, Double lng, String status) {
        int updated = jdbcTemplate.update(
                "UPDATE surveyor SET current_lat = ?, current_lng = ?, current_status = ?, last_location_update = CURRENT_TIMESTAMP WHERE id = ?",
                lat, lng, status, surveyorId
        );
        return updated == 1;
    }

    /**
     * Get surveyor details including current location and status
     */
    public Map<String, Object> getSurveyorDetails(Long surveyorId) {
        Surveyor s = findById(surveyorId);
        OffsetDateTime now = OffsetDateTime.now();
        String currentAvailabilityStatus = availabilityService.getCurrentState(surveyorId, now);

        java.util.HashMap<String, Object> details = new java.util.HashMap<>();
        details.put("id", s.getId());
        details.put("code", s.getCode() != null ? s.getCode() : "");
        details.put("display_name", s.getDisplayName() != null ? s.getDisplayName() : "");
        details.put("home_lat", s.getHomeLat() != null ? s.getHomeLat() : 0.0);
        details.put("home_lng", s.getHomeLng() != null ? s.getHomeLng() : 0.0);
        details.put("status", s.getStatus() != null ? s.getStatus() : "");
        details.put("surveyor_type", s.getSurveyorType() != null ? s.getSurveyorType() : "");
        details.put("email", s.getEmail() != null ? s.getEmail() : "");
        details.put("phone", s.getPhone() != null ? s.getPhone() : "");
        details.put("current_status", s.getCurrentStatus() != null ? s.getCurrentStatus() : currentAvailabilityStatus);
        details.put("current_lat", s.getCurrentLat());
        details.put("current_lng", s.getCurrentLng());
        details.put("last_location_update", s.getLastLocationUpdate() != null ? s.getLastLocationUpdate().toString() : null);
        return details;
    }
}
