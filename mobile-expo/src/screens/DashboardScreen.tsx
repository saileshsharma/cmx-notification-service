import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { images } from '../constants/images';
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
    { key: 'on_way' as QuickStatus, icon: 'car', label: 'On My Way', color: colors.primary },
    { key: 'arrived' as QuickStatus, icon: 'location', label: 'Arrived', color: colors.success },
    { key: 'inspecting' as QuickStatus, icon: 'search', label: 'Inspecting', color: colors.warning },
    { key: 'completed' as QuickStatus, icon: 'checkmark-circle', label: 'Completed', color: colors.purple },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Weather Card */}
      {weather && <WeatherCard weather={weather} />}

      {/* Stats Card */}
      <StatsCard stats={todayStats} />

      {/* Next Appointment */}
      {nextAppointment && (
        <View style={[styles.nextAppointmentCard, shadows.lg]}>
          <Text style={styles.sectionTitle}>Next Inspection</Text>
          <ImageBackground
            source={{ uri: images.carInspection }}
            style={styles.nextApptBackground}
            imageStyle={styles.nextApptBackgroundImage}
          >
            <LinearGradient
              colors={['rgba(30, 64, 175, 0.95)', 'rgba(59, 130, 246, 0.9)']}
              style={styles.nextApptGradient}
            >
              <View style={styles.nextApptContent}>
                <View style={styles.nextApptHeader}>
                  <View style={styles.countdownBadge}>
                    <Ionicons name="time-outline" size={14} color={colors.white} />
                    <Text style={styles.countdownText}>in {getTimeUntil(nextAppointment.start_time)}</Text>
                  </View>
                </View>
                <Text style={styles.nextApptTitle}>{nextAppointment.title || 'Vehicle Inspection'}</Text>
                <Text style={styles.nextApptTime}>
                  {formatDate(nextAppointment.start_time)} at {formatTime(nextAppointment.start_time)}
                </Text>
                {nextAppointment.description && (
                  <Text style={styles.nextApptDescription} numberOfLines={2}>
                    {nextAppointment.description}
                  </Text>
                )}
                <View style={styles.nextApptActions}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => onNavigate(nextAppointment)}
                  >
                    <Ionicons name="navigate" size={18} color={colors.white} />
                    <Text style={styles.navButtonText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => onStartInspection(nextAppointment)}
                  >
                    <Ionicons name="play" size={18} color={colors.primaryDark} />
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      )}

      {/* Quick Status */}
      <View style={styles.quickStatusSection}>
        <Text style={styles.sectionTitle}>Quick Update</Text>
        <View style={styles.quickStatusGrid}>
          {quickStatusOptions.map(status => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.quickStatusButton,
                quickStatus === status.key && {
                  backgroundColor: status.color + '15',
                  borderColor: status.color,
                }
              ]}
              onPress={() => onQuickStatus(status.key)}
            >
              <View style={[
                styles.quickStatusIconBg,
                quickStatus === status.key && { backgroundColor: status.color + '20' }
              ]}>
                <Ionicons
                  name={status.icon as any}
                  size={24}
                  color={quickStatus === status.key ? status.color : colors.gray[500]}
                />
              </View>
              <Text style={[
                styles.quickStatusLabel,
                quickStatus === status.key && { color: status.color }
              ]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosButton} onPress={onSOS}>
        <LinearGradient colors={gradients.danger} style={styles.sosGradient}>
          <Ionicons name="warning" size={24} color={colors.white} />
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
    padding: spacing.lg,
    backgroundColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  nextAppointmentCard: {
    marginBottom: spacing.lg,
  },
  nextApptBackground: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  nextApptBackgroundImage: {
    borderRadius: borderRadius.lg,
  },
  nextApptGradient: {
    padding: spacing.xl,
  },
  nextApptContent: {},
  nextApptHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  countdownText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  nextApptTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  nextApptTime: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.8)',
  },
  nextApptDescription: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
  },
  nextApptActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  navButtonText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  startButtonText: {
    color: colors.primaryDark,
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
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  quickStatusIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickStatusLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  sosButton: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
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
