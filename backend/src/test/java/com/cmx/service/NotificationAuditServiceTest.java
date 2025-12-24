package com.cmx.service;

import com.cmx.dto.NotificationDto.NotificationAuditEntry;
import com.cmx.dto.NotificationDto.NotificationStats;
import com.cmx.model.NotificationLog;
import com.cmx.repository.NotificationLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationAuditService Tests")
class NotificationAuditServiceTest {

    @Mock
    private NotificationLogRepository notificationLogRepository;

    private NotificationAuditService notificationAuditService;

    @BeforeEach
    void setUp() {
        notificationAuditService = new NotificationAuditService(notificationLogRepository, null);
    }

    @Test
    @DisplayName("getNotificationHistory returns mapped entries")
    void getNotificationHistory_ReturnsMappedEntries() {
        OffsetDateTime now = OffsetDateTime.now();
        NotificationLog log = new NotificationLog();
        log.setId(1L);
        log.setSurveyorId(1L);
        log.setChannel("PUSH");
        log.setEventType("APPOINTMENT_CREATED");
        log.setTitle("Test Title");
        log.setBody("Test Body");
        log.setStatus("SENT");
        log.setCreatedAt(now);

        when(notificationLogRepository.findAllPaged(50, 0)).thenReturn(List.of(log));

        List<NotificationAuditEntry> result = notificationAuditService.getNotificationHistory(null, null, 50, 0);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(1L);
        assertThat(result.get(0).channel()).isEqualTo("PUSH");
        assertThat(result.get(0).status()).isEqualTo("SENT");
    }

    @Test
    @DisplayName("getNotificationHistory with surveyorId filters correctly")
    void getNotificationHistory_WithSurveyorId_FiltersCorrectly() {
        when(notificationLogRepository.findBySurveyorIdPaged(1L, 50, 0)).thenReturn(List.of());

        notificationAuditService.getNotificationHistory(1L, null, 50, 0);

        verify(notificationLogRepository).findBySurveyorIdPaged(1L, 50, 0);
    }

    @Test
    @DisplayName("getNotificationHistory with channel filters correctly")
    void getNotificationHistory_WithChannel_FiltersCorrectly() {
        when(notificationLogRepository.findByChannelPaged("PUSH", 50, 0)).thenReturn(List.of());

        notificationAuditService.getNotificationHistory(null, "PUSH", 50, 0);

        verify(notificationLogRepository).findByChannelPaged("PUSH", 50, 0);
    }

    @Test
    @DisplayName("getNotificationStats returns aggregated stats")
    void getNotificationStats_ReturnsAggregatedStats() {
        when(notificationLogRepository.countByChannelInHours("PUSH", 24)).thenReturn(10);
        when(notificationLogRepository.countByChannelInHours("EMAIL", 24)).thenReturn(5);
        when(notificationLogRepository.countByChannelInHours("SMS", 24)).thenReturn(3);
        when(notificationLogRepository.countByChannelAndStatusInHours("PUSH", "SENT", 24)).thenReturn(8);
        when(notificationLogRepository.countByChannelAndStatusInHours("EMAIL", "SENT", 24)).thenReturn(5);
        when(notificationLogRepository.countByChannelAndStatusInHours("SMS", "SENT", 24)).thenReturn(2);
        when(notificationLogRepository.countByStatusInHours("FAILED", 24)).thenReturn(3);

        NotificationStats result = notificationAuditService.getNotificationStats(null, 24);

        assertThat(result.periodHours()).isEqualTo(24);
        assertThat(result.totalPush()).isEqualTo(10);
        assertThat(result.successPush()).isEqualTo(8);
        assertThat(result.totalEmail()).isEqualTo(5);
        assertThat(result.successEmail()).isEqualTo(5);
        assertThat(result.totalSms()).isEqualTo(3);
        assertThat(result.successSms()).isEqualTo(2);
        assertThat(result.failedTotal()).isEqualTo(3);
    }

    @Test
    @DisplayName("getNotificationStats with surveyorId uses surveyor-specific queries")
    void getNotificationStats_WithSurveyorId_UsesSurveyorQueries() {
        when(notificationLogRepository.countBySurveyorAndChannelInHours(eq(1L), anyString(), eq(24))).thenReturn(5);
        when(notificationLogRepository.countBySurveyorChannelAndStatusInHours(eq(1L), anyString(), eq("SENT"), eq(24))).thenReturn(4);
        when(notificationLogRepository.countBySurveyorAndStatusInHours(1L, "FAILED", 24)).thenReturn(1);

        NotificationStats result = notificationAuditService.getNotificationStats(1L, 24);

        verify(notificationLogRepository, times(3)).countBySurveyorAndChannelInHours(eq(1L), anyString(), eq(24));
        assertThat(result).isNotNull();
    }
}
