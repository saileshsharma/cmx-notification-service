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
@Table("feature_flags")
public class FeatureFlag {

    @Id
    private Long id;

    @Column("name")
    private String name;

    @Column("description")
    private String description;

    @Column("enabled")
    private boolean enabled;

    @Column("environment")
    private String environment;

    @Column("rollout_percentage")
    private int rolloutPercentage;

    @Column("variant_name")
    private String variantName;

    @Column("variant_payload")
    private String variantPayload;

    @Column("created_at")
    private Instant createdAt;

    @Column("updated_at")
    private Instant updatedAt;
}
