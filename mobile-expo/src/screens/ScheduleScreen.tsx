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
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { Appointment, AppointmentResponseStatus } from '../types';
import { AppointmentCard } from '../components/AppointmentCard';

type CategoryFilter = 'all' | 'pending' | 'accepted' | 'completed' | 'rejected';

interface CategoryTab {
  key: CategoryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: [string, string];
}

const categories: CategoryTab[] = [
  { key: 'all', label: 'All', icon: 'layers', color: '#3B82F6', gradient: ['#3B82F6', '#1D4ED8'] },
  { key: 'pending', label: 'Pending', icon: 'time', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
  { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle', color: '#10B981', gradient: ['#10B981', '#059669'] },
  { key: 'completed', label: 'Done', icon: 'checkmark-done-circle', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
  { key: 'rejected', label: 'Declined', icon: 'close-circle', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] },
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
            >
              {isActive ? (
                <LinearGradient
                  colors={category.gradient}
                  style={styles.categoryTabActive}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name={category.icon} size={16} color={colors.white} />
                  <Text style={styles.categoryLabelActive}>{category.label}</Text>
                  {count > 0 && (
                    <View style={styles.categoryBadgeActive}>
                      <Text style={styles.categoryBadgeTextActive}>{count}</Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={styles.categoryTab}>
                  <Ionicons name={category.icon} size={16} color={colors.gray[500]} />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  {count > 0 && (
                    <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
                      <Text style={[styles.categoryBadgeText, { color: category.color }]}>{count}</Text>
                    </View>
                  )}
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
      <LinearGradient
        colors={currentCategory?.gradient || ['#3B82F6', '#1D4ED8']}
        style={styles.emptyIconContainer}
      >
        <Ionicons name={currentCategory?.icon || 'calendar'} size={40} color={colors.white} />
      </LinearGradient>
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
        <Ionicons name="refresh" size={18} color={colors.primary} />
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
            <View style={[styles.sectionIcon, { backgroundColor: currentCategory?.color || colors.primary }]}>
              <Ionicons name={icon} size={14} color={colors.white} />
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
      {/* Header Stats Bar */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.statsHeader}>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{categoryCounts.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{categoryCounts.accepted}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{categoryCounts.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

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
    backgroundColor: '#F8FAFC',
  },
  statsHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  categoryWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
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
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[50],
    marginRight: spacing.sm,
    gap: 6,
  },
  categoryTabActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    gap: 6,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  categoryLabelActive: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  categoryBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  categoryBadgeActive: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  categoryBadgeTextActive: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  countBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  countText: {
    color: colors.gray[600],
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
    borderRadius: 40,
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
    maxWidth: 260,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
  },
  emptyActionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ScheduleScreen;
