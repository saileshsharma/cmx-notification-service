import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
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
  { key: 'all', label: 'All', icon: 'layers', color: colors.accent },
  { key: 'pending', label: 'Pending', icon: 'time', color: colors.warning },
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle', color: colors.success },
  { key: 'completed', label: 'Done', icon: 'checkmark-done-circle', color: colors.purple },
  { key: 'rejected', label: 'Declined', icon: 'close-circle', color: colors.danger },
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('pending');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort appointments by created date (most recent first), then by start_time
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      // Sort by id descending (higher id = more recently created)
      // This is a common pattern when created_at is not available
      return b.id - a.id;
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (selectedCategory === 'all') return sortedAppointments;

    return sortedAppointments.filter(a => {
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
  }, [sortedAppointments, selectedCategory]);

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

  const currentCategory = categories.find(c => c.key === selectedCategory);

  const renderCategoryTabs = () => (
    <View style={styles.categoryWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(category => {
          const isActive = selectedCategory === category.key;
          const count = categoryCounts[category.key];
          return (
            <TouchableOpacity
              key={category.key}
              onPress={() => setSelectedCategory(category.key)}
              activeOpacity={0.7}
              style={[
                styles.categoryTab,
                isActive && { backgroundColor: category.color, borderColor: category.color }
              ]}
            >
              <Ionicons
                name={category.icon}
                size={14}
                color={isActive ? colors.black : colors.text.tertiary}
              />
              <Text style={[
                styles.categoryLabel,
                isActive && { color: colors.black, fontWeight: fontWeight.semibold }
              ]}>
                {category.label}
              </Text>
              {count > 0 && (
                <View style={[
                  styles.categoryBadge,
                  isActive && { backgroundColor: 'rgba(0,0,0,0.2)' }
                ]}>
                  <Text style={[
                    styles.categoryBadgeText,
                    isActive && { color: colors.black }
                  ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: currentCategory?.color + '20' }]}>
        <Ionicons name={currentCategory?.icon || 'calendar'} size={40} color={currentCategory?.color || colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>
        {selectedCategory === 'all' ? 'No Appointments Yet' : `No ${currentCategory?.label} Jobs`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory === 'all'
          ? 'New inspection jobs will appear here'
          : `Jobs with ${currentCategory?.label.toLowerCase()} status will be shown here`
        }
      </Text>
      <TouchableOpacity style={styles.emptyAction} onPress={onRefresh}>
        <Ionicons name="refresh" size={18} color={colors.accent} />
        <Text style={styles.emptyActionText}>Refresh Schedule</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSection = (title: string, items: Appointment[], icon: keyof typeof Ionicons.glyphMap) => {
    if (items.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name={icon} size={14} color={colors.accent} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length} {items.length === 1 ? 'job' : 'jobs'}</Text>
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
    <View style={styles.container}>
      {/* Stats Bar */}
      <View style={styles.statsHeader}>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>{categoryCounts.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{categoryCounts.accepted}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statNumber, { color: colors.purple }]}>{categoryCounts.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {renderCategoryTabs()}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredAppointments.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderSection("Today's Jobs", todayAppointments, 'today')}
            {renderSection('Upcoming', upcomingAppointments, 'calendar')}
            {pastAppointments.length > 0 && renderSection('Past', pastAppointments, 'time')}
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
    backgroundColor: colors.background,
  },
  statsHeader: {
    backgroundColor: colors.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.cardBorder,
  },
  categoryWrapper: {
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    fontWeight: fontWeight.medium,
  },
  categoryBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: colors.backgroundTertiary,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
  },
  scrollContainer: {
    flex: 1,
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
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  countBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  countText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: borderRadius.button,
  },
  emptyActionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.accent,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ScheduleScreen;
