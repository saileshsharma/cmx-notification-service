package com.cmx.repository;

import com.cmx.model.DeviceToken;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends CrudRepository<DeviceToken, Long> {

    List<DeviceToken> findBySurveyorId(Long surveyorId);

    @Query("SELECT token FROM device_token WHERE surveyor_id = :surveyorId")
    List<String> findTokensBySurveyorId(@Param("surveyorId") Long surveyorId);

    Optional<DeviceToken> findBySurveyorIdAndToken(Long surveyorId, String token);

    @Modifying
    @Query("DELETE FROM device_token WHERE token = :token")
    int deleteByToken(@Param("token") String token);

    @Modifying
    @Query("DELETE FROM device_token WHERE surveyor_id = :surveyorId AND token = :token")
    int deleteBySurveyorIdAndToken(@Param("surveyorId") Long surveyorId, @Param("token") String token);

    @Query("SELECT COUNT(DISTINCT surveyor_id) FROM device_token")
    int countDistinctSurveyors();

    @Query("SELECT COUNT(*) FROM device_token")
    int countAll();
}
