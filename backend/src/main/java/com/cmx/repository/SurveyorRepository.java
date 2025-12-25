package com.cmx.repository;

import com.cmx.model.Surveyor;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyorRepository extends CrudRepository<Surveyor, Long> {

    @Query("SELECT * FROM surveyor WHERE surveyor_type = :type ORDER BY display_name")
    List<Surveyor> findByType(@Param("type") String type);

    @Query("SELECT * FROM surveyor ORDER BY display_name")
    List<Surveyor> findAllOrdered();

    @Query("SELECT id FROM surveyor")
    List<Long> findAllIds();

    @Query("SELECT COUNT(*) FROM surveyor")
    int countAll();

    Optional<Surveyor> findByCode(String code);

    @Query("SELECT * FROM surveyor WHERE email = :email")
    Optional<Surveyor> findByEmail(@Param("email") String email);
}
