package com.cmx.repository;

import com.cmx.model.FeatureFlag;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeatureFlagRepository extends CrudRepository<FeatureFlag, Long> {

    Optional<FeatureFlag> findByName(String name);

    List<FeatureFlag> findByEnvironmentIn(List<String> environments);

    @Query("SELECT * FROM feature_flags WHERE environment IN (:environments) AND enabled = true")
    List<FeatureFlag> findEnabledByEnvironments(@Param("environments") List<String> environments);

    @Query("SELECT * FROM feature_flags WHERE name IN (:names)")
    List<FeatureFlag> findByNameIn(@Param("names") List<String> names);

    List<FeatureFlag> findAll();
}
