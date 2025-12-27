package com.cmx.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("feature_flag_overrides")
public class FeatureFlagOverride {

    @Id
    private Long id;

    @Column("flag_id")
    private Long flagId;

    @Column("surveyor_id")
    private Long surveyorId;

    @Column("enabled")
    private boolean enabled;

    @Column("created_at")
    private Instant createdAt;
}
