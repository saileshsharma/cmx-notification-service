package com.cmx.repository;

import com.cmx.model.DispatchOffer;
import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DispatchOfferRepository extends CrudRepository<DispatchOffer, Long> {

    @Query("SELECT * FROM dispatch_offer WHERE offer_group = :offerGroup")
    List<DispatchOffer> findByOfferGroup(@Param("offerGroup") UUID offerGroup);

    @Query("""
        SELECT * FROM dispatch_offer
        WHERE offer_group = :offerGroup AND surveyor_id = :surveyorId
        """)
    Optional<DispatchOffer> findByOfferGroupAndSurveyorId(
            @Param("offerGroup") UUID offerGroup,
            @Param("surveyorId") Long surveyorId
    );

    @Modifying
    @Query("""
        UPDATE dispatch_offer
        SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP
        WHERE offer_group = :offerGroup
        AND surveyor_id = :surveyorId
        AND status = 'PENDING'
        AND expires_at > :now
        AND NOT EXISTS (
            SELECT 1 FROM dispatch_offer o2
            WHERE o2.offer_group = :offerGroup AND o2.status = 'ACCEPTED'
        )
        """)
    int acceptOffer(
            @Param("offerGroup") UUID offerGroup,
            @Param("surveyorId") Long surveyorId,
            @Param("now") OffsetDateTime now
    );

    @Modifying
    @Query("UPDATE dispatch_offer SET status = 'CLOSED' WHERE offer_group = :offerGroup AND status = 'PENDING'")
    int closeRemainingOffers(@Param("offerGroup") UUID offerGroup);

    @Query("SELECT fnol_id FROM dispatch_offer WHERE offer_group = :offerGroup LIMIT 1")
    String findFnolIdByOfferGroup(@Param("offerGroup") UUID offerGroup);
}
