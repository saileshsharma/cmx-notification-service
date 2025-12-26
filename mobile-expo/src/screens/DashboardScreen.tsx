import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { QuickStatus, TodayStats, Weather } from '../context/AppContext';
import { Appointment } from '../types';
import { WeatherCard } from '../components/WeatherCard';
import { StatsCard } from '../components/StatsCard';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  todayStats: TodayStats;
  weather: Weather | null;
  nextAppointment: Appointment | null;
  quickStatus: QuickStatus | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onQuickStatus: (status: QuickStatus) => void;
  onNavigate: (appointment: Appointment) => void;
  onStartInspection: (appointment: Appointment) => void;
  onSOS: () => void;
  getTimeUntil: (isoString: string) => string;
  formatDate: (isoString: string) => string;
  formatTime: (isoString: string) => string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  todayStats,
  weather,
  nextAppointment,
  quickStatus,
  isRefreshing,
  onRefresh,
  onQuickStatus,
  onNavigate,
  onStartInspection,
  onSOS,
  getTimeUntil,
  formatDate,
  formatTime,
}) => {
  const quickStatusOptions = [
    { key: 'on_way' as QuickStatus, icon: 'car-sport', label: 'On My Way', color: colors.cyan, gradient: gradients.cyan },
    { key: 'arrived' as QuickStatus, icon: 'location', label: 'Arrived', color: colors.success, gradient: gradients.success },
    { key: 'inspecting' as QuickStatus, icon: 'search', label: 'Inspecting', color: colors.purple, gradient: gradients.purple },
    { key: 'completed' as QuickStatus, icon: 'checkmark-done-circle', label: 'Completed', color: colors.accent, gradient: gradients.accent },
  ];

  return (
    <ScrollView
      style={styles.container}
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
      {/* Weather Card */}
      {weather && <WeatherCard weather={weather} />}

      {/* Stats Card */}
      <StatsCard stats={todayStats} />

      {/* Next Appointment Card - Premium Dark Style */}
      {nextAppointment && (
        <View style={styles.nextAppointmentSection}>
          <Text style={styles.sectionTitle}>Next Inspection</Text>
          <View style={[styles.nextAppointmentCard, shadows.card]}>
            <LinearGradient
              colors={[colors.card, colors.cardDark]}
              style={styles.nextApptGradient}
            >
              {/* Vehicle Image Placeholder */}
              <View style={styles.vehicleImageContainer}>
                <LinearGradient
                  colors={['rgba(204, 255, 0, 0.1)', 'rgba(204, 255, 0, 0.05)']}
                  style={styles.vehicleImagePlaceholder}
                >
                  <Ionicons name="car-sport" size={48} color={colors.accent} />
                </LinearGradient>
                <View style={styles.arrowButton}>
                  <Ionicons name="arrow-forward" size={18} color={colors.black} />
                </View>
              </View>

              {/* Appointment Info */}
              <View style={styles.nextApptContent}>
                <View style={styles.nextApptHeader}>
                  <View style={styles.countdownBadge}>
                    <Ionicons name="time-outline" size={12} color={colors.accent} />
                    <Text style={styles.countdownText}>in {getTimeUntil(nextAppointment.start_time)}</Text>
                  </View>
                </View>

                <Text style={styles.vehicleYear}>
                  {formatDate(nextAppointment.start_time)}
                </Text>
                <Text style={styles.nextApptTitle}>
                  {nextAppointment.title || 'Vehicle Inspection'}
                </Text>

                {/* Vehicle Stats Row */}
                <View style={styles.vehicleStatsRow}>
                  <View style={styles.vehicleStat}>
                    <Ionicons name="car" size={14} color={colors.text.tertiary} />
                    <Text style={styles.vehicleStatText}>ID: {nextAppointment.id}</Text>
                  </View>
                  <View style={styles.vehicleStat}>
                    <Ionicons name="time" size={14} color={colors.text.tertiary} />
                    <Text style={styles.vehicleStatText}>{formatTime(nextAppointment.start_time)}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.nextApptActions}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => onNavigate(nextAppointment)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="navigate" size={16} color={colors.text.primary} />
                    <Text style={styles.navButtonText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => onStartInspection(nextAppointment)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={gradients.accent}
                      style={styles.startButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="play" size={16} color={colors.black} />
                      <Text style={styles.startButtonText}>Start</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Quick Status - Dark Card Grid */}
      <View style={styles.quickStatusSection}>
        <Text style={styles.sectionTitle}>Quick Update</Text>
        <View style={styles.quickStatusGrid}>
          {quickStatusOptions.map(status => {
            const isActive = quickStatus === status.key;
            return (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.quickStatusButton,
                  isActive && {
                    borderColor: status.color,
                    backgroundColor: status.color + '15',
                  }
                ]}
                onPress={() => onQuickStatus(status.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.quickStatusIconBg,
                  isActive && { backgroundColor: status.color + '25' }
                ]}>
                  <Ionicons
                    name={status.icon as any}
                    size={22}
                    color={isActive ? status.color : colors.text.tertiary}
                  />
                </View>
                <Text style={[
                  styles.quickStatusLabel,
                  isActive && { color: status.color }
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosButton} onPress={onSOS} activeOpacity={0.8}>
        <LinearGradient colors={gradients.danger} style={styles.sosGradient}>
          <Ionicons name="warning" size={22} color={colors.white} />
          <Text style={styles.sosText}>Emergency SOS</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  nextAppointmentSection: {
    marginBottom: spacing.lg,
  },
  nextAppointmentCard: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  nextApptGradient: {
    padding: spacing.lg,
  },
  vehicleImageContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  vehicleImagePlaceholder: {
    height: 140,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.accentGlow,
  },
  nextApptContent: {},
  nextApptHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  countdownText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  vehicleYear: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  nextApptTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  vehicleStatsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  vehicleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  vehicleStatText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  nextApptActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  navButtonText: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  startButton: {
    flex: 1,
    borderRadius: borderRadius.button,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  startButtonText: {
    color: colors.black,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  quickStatusSection: {
    marginBottom: spacing.lg,
  },
  quickStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickStatusButton: {
    width: (width - spacing.lg * 2 - spacing.md) / 2,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickStatusIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickStatusLabel: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    fontWeight: fontWeight.medium,
  },
  sosButton: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...shadows.dangerGlow,
  },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  sosText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default DashboardScreen;
