package com.cmx.repository;

import com.cmx.model.FeatureFlagOverride;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureFlagOverrideRepository extends CrudRepository<FeatureFlagOverride, Long> {

    @Query("SELECT * FROM feature_flag_overrides WHERE flag_id = :flagId AND surveyor_id = :surveyorId")
    Optional<FeatureFlagOverride> findByFlagIdAndSurveyorId(
            @Param("flagId") Long flagId,
            @Param("surveyorId") Long surveyorId);

    @Query("SELECT * FROM feature_flag_overrides WHERE surveyor_id = :surveyorId")
    List<FeatureFlagOverride> findBySurveyorId(@Param("surveyorId") Long surveyorId);

    @Query("SELECT * FROM feature_flag_overrides WHERE flag_id = :flagId")
    List<FeatureFlagOverride> findByFlagId(@Param("flagId") Long flagId);
}
