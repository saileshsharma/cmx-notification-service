package com.cmx.service;

import com.cmx.model.DeviceToken;
import com.cmx.repository.DeviceTokenRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final JdbcTemplate jdbc;

    public DeviceTokenService(DeviceTokenRepository deviceTokenRepository, JdbcTemplate jdbc) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.jdbc = jdbc;
    }

    public Map<String, Object> registerToken(Long surveyorId, String token, String platform) {
        // Use MERGE for upsert behavior (H2 compatible)
        String upsert =
                "MERGE INTO device_token (surveyor_id, token, platform, updated_at) " +
                "KEY(surveyor_id, token) " +
                "VALUES (?, ?, ?, CURRENT_TIMESTAMP)";

        jdbc.update(upsert, surveyorId, token, platform);
        return Map.of("ok", true);
    }

    public Map<String, Object> unregisterToken(Long surveyorId, String token) {
        int deleted = deviceTokenRepository.deleteBySurveyorIdAndToken(surveyorId, token);
        return Map.of("ok", deleted >= 0);
    }

    public List<String> getTokensForSurveyor(Long surveyorId) {
        return deviceTokenRepository.findTokensBySurveyorId(surveyorId);
    }

    public void deleteInvalidToken(String token) {
        deviceTokenRepository.deleteByToken(token);
    }
}
