import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { Appointment, AppointmentResponseStatus } from '../types';
import { AppointmentCard } from '../components/AppointmentCard';

type CategoryFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'rejected';

interface CategoryTab {
  key: CategoryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const categories: CategoryTab[] = [
  { key: 'all', label: 'All', icon: 'list', color: colors.primary },
  { key: 'pending', label: 'Pending', icon: 'time-outline', color: colors.warning },
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline', color: colors.success },
  { key: 'completed', label: 'Completed', icon: 'checkmark-done-outline', color: colors.info || '#2196F3' },
  { key: 'rejected', label: 'Rejected', icon: 'close-circle-outline', color: colors.danger },
];

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
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter appointments by category
  const filteredAppointments = useMemo(() => {
    if (selectedCategory === 'all') return appointments;

    return appointments.filter(a => {
      const status = a.response_status?.toUpperCase();
      switch (selectedCategory) {
        case 'pending':
          return status === 'PENDING' || !status;
        case 'accepted':
          return status === 'ACCEPTED';
        case 'completed':
          return status === 'COMPLETED';
        case 'rejected':
          return status === 'REJECTED';
        default:
          return true;
      }
    });
  }, [appointments, selectedCategory]);

  // Get counts for each category
  const categoryCounts = useMemo(() => {
    return {
      all: appointments.length,
      pending: appointments.filter(a => a.response_status?.toUpperCase() === 'PENDING' || !a.response_status).length,
      accepted: appointments.filter(a => a.response_status?.toUpperCase() === 'ACCEPTED').length,
      completed: appointments.filter(a => a.response_status?.toUpperCase() === 'COMPLETED').length,
      rejected: appointments.filter(a => a.response_status?.toUpperCase() === 'REJECTED').length,
    };
  }, [appointments]);

  const todayAppointments = filteredAppointments.filter(a => {
    const apptDate = new Date(a.start_time);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate.getTime() === today.getTime();
  });

  const upcomingAppointments = filteredAppointments.filter(a => {
    const apptDate = new Date(a.start_time);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate.getTime() > today.getTime();
  });

  const pastAppointments = filteredAppointments.filter(a => {
    const apptDate = new Date(a.start_time);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate.getTime() < today.getTime();
  });

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      {categories.map(category => {
        const isActive = selectedCategory === category.key;
        const count = categoryCounts[category.key];
        return (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryTab,
              isActive && { backgroundColor: category.color + '20', borderColor: category.color },
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Ionicons
              name={category.icon}
              size={16}
              color={isActive ? category.color : colors.gray[500]}
            />
            <Text style={[
              styles.categoryLabel,
              isActive && { color: category.color, fontWeight: fontWeight.semibold },
            ]}>
              {category.label}
            </Text>
            {count > 0 && (
              <View style={[
                styles.categoryBadge,
                { backgroundColor: isActive ? category.color : colors.gray[300] },
              ]}>
                <Text style={styles.categoryBadgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="calendar-outline" size={64} color={colors.gray[300]} />
      </View>
      <Text style={styles.emptyTitle}>
        {selectedCategory === 'all' ? 'No Appointments' : `No ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Appointments`}
      </Text>
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
        {items.length === 0 ? (
          <Text style={styles.noItemsText}>No appointments</Text>
        ) : (
          items.map(appointment => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onNavigate={() => onNavigate(appointment)}
              onAccept={() => onAccept(appointment.id)}
              onReject={() => onReject(appointment.id)}
              onStartInspection={() => onStartInspection(appointment)}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderCategoryTabs()}
      <ScrollView
        style={styles.scrollContainer}
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
        {filteredAppointments.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderSection("Today's Schedule", todayAppointments, true)}
            {renderSection('Upcoming', upcomingAppointments)}
            {pastAppointments.length > 0 && renderSection('Past', pastAppointments)}
          </>
        )}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  categoryContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  categoryBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: fontWeight.bold,
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
  noItemsText: {
    fontSize: fontSize.md,
    color: colors.gray[400],
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
    textAlign: 'center',
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
