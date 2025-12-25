import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { Appointment, AppointmentResponseStatus } from '../types';
import { AppointmentCard } from '../components/AppointmentCard';

interface ScheduleScreenProps {
  appointments: Appointment[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onNavigate: (appointment: Appointment) => void;
  onAccept: (appointmentId: number) => void;
  onReject: (appointmentId: number) => void;
  onStartInspection: (appointment: Appointment) => void;
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  appointments,
  isRefreshing,
  onRefresh,
  onNavigate,
  onAccept,
  onReject,
  onStartInspection,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAppointments = appointments.filter(a => {
    const apptDate = new Date(a.start_time);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate.getTime() === today.getTime();
  });

  const upcomingAppointments = appointments.filter(a => {
    const apptDate = new Date(a.start_time);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate.getTime() > today.getTime();
  });

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
      </View>
      <Text style={styles.emptyTitle}>No Appointments</Text>
      <Text style={styles.emptySubtitle}>Pull down to refresh your schedule</Text>
    </View>
  );

  const renderSection = (title: string, items: Appointment[], showEmpty = false) => {
    if (items.length === 0 && !showEmpty) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>
        {items.map(appointment => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onNavigate={() => onNavigate(appointment)}
            onAccept={() => onAccept(appointment.id)}
            onReject={() => onReject(appointment.id)}
            onStartInspection={() => onStartInspection(appointment)}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {appointments.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          {renderSection("Today's Schedule", todayAppointments, true)}
          {renderSection('Upcoming', upcomingAppointments)}
        </>
      )}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  countText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ScheduleScreen;
