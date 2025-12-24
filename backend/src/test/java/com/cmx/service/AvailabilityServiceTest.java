package com.cmx.service;

import com.cmx.model.SurveyorAvailability;
import com.cmx.repository.AvailabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AvailabilityService Tests")
class AvailabilityServiceTest {

    @Mock
    private AvailabilityRepository availabilityRepository;

    private AvailabilityService availabilityService;

    @BeforeEach
    void setUp() {
        availabilityService = new AvailabilityService(availabilityRepository, null);
    }

    @Test
    @DisplayName("getAvailability returns mapped results")
    void getAvailability_ReturnsMappedResults() {
        OffsetDateTime now = OffsetDateTime.now();
        SurveyorAvailability availability = new SurveyorAvailability();
        availability.setId(1L);
        availability.setSurveyorId(1L);
        availability.setStartTime(now);
        availability.setEndTime(now.plusHours(8));
        availability.setState("AVAILABLE");
        availability.setSource("MOBILE");
        availability.setUpdatedAt(now);

        when(availabilityRepository.findByTimeRange(any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of(availability));

        List<Map<String, Object>> result = availabilityService.getAvailability(
                now.toString(), now.plusDays(1).toString(), null, null, 500, 0
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("id")).isEqualTo(1L);
        assertThat(result.get(0).get("state")).isEqualTo("AVAILABLE");
    }

    @Test
    @DisplayName("getAvailability with surveyorId filters correctly")
    void getAvailability_WithSurveyorId_FiltersCorrectly() {
        OffsetDateTime now = OffsetDateTime.now();

        when(availabilityRepository.findByTimeRangeAndSurveyorId(any(), any(), eq(1L), anyInt(), anyInt()))
                .thenReturn(List.of());

        List<Map<String, Object>> result = availabilityService.getAvailability(
                now.toString(), now.plusDays(1).toString(), 1L, null, 500, 0
        );

        verify(availabilityRepository).findByTimeRangeAndSurveyorId(any(), any(), eq(1L), anyInt(), anyInt());
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("updateAvailability updates and returns true on success")
    void updateAvailability_UpdatesAndReturnsTrue() {
        when(availabilityRepository.updateAvailability(eq(1L), any(), any(), any(), any(), any()))
                .thenReturn(1);

        boolean result = availabilityService.updateAvailability(
                1L, "2024-01-15T09:00:00Z", "2024-01-15T17:00:00Z", "BUSY", "Meeting", "Description"
        );

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("updateAvailability returns false when no rows updated")
    void updateAvailability_ReturnsFalseWhenNoUpdate() {
        when(availabilityRepository.updateAvailability(eq(1L), any(), any(), any(), any(), any()))
                .thenReturn(0);

        boolean result = availabilityService.updateAvailability(
                1L, "2024-01-15T09:00:00Z", "2024-01-15T17:00:00Z", "BUSY", "Meeting", "Description"
        );

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("deleteAvailability returns deleted entity")
    void deleteAvailability_ReturnsDeletedEntity() {
        SurveyorAvailability availability = new SurveyorAvailability();
        availability.setId(1L);
        availability.setSurveyorId(1L);

        when(availabilityRepository.findById(1L)).thenReturn(Optional.of(availability));
        doNothing().when(availabilityRepository).deleteById(1L);

        SurveyorAvailability result = availabilityService.deleteAvailability(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        verify(availabilityRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteAvailability returns null when not found")
    void deleteAvailability_ReturnsNullWhenNotFound() {
        when(availabilityRepository.findById(1L)).thenReturn(Optional.empty());

        SurveyorAvailability result = availabilityService.deleteAvailability(1L);

        assertThat(result).isNull();
        verify(availabilityRepository, never()).deleteById(anyLong());
    }

    @Test
    @DisplayName("getCurrentState returns state from repository")
    void getCurrentState_ReturnsStateFromRepository() {
        OffsetDateTime now = OffsetDateTime.now();
        when(availabilityRepository.findCurrentState(1L, now)).thenReturn("BUSY");

        String result = availabilityService.getCurrentState(1L, now);

        assertThat(result).isEqualTo("BUSY");
    }

    @Test
    @DisplayName("getCurrentState returns AVAILABLE when no state found")
    void getCurrentState_ReturnsAvailableWhenNull() {
        OffsetDateTime now = OffsetDateTime.now();
        when(availabilityRepository.findCurrentState(1L, now)).thenReturn(null);

        String result = availabilityService.getCurrentState(1L, now);

        assertThat(result).isEqualTo("AVAILABLE");
    }

    @Test
    @DisplayName("createBusyBlock saves availability")
    void createBusyBlock_SavesAvailability() {
        OffsetDateTime start = OffsetDateTime.now();
        OffsetDateTime end = start.plusHours(2);

        availabilityService.createBusyBlock(1L, start, end);

        verify(availabilityRepository).save(argThat(availability ->
                availability.getSurveyorId().equals(1L) &&
                availability.getState().equals("BUSY") &&
                availability.getSource().equals("CMX")
        ));
    }
}
