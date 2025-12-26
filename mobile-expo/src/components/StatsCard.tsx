import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { TodayStats } from '../context/AppContext';

const { width } = Dimensions.get('window');

interface StatsCardProps {
  stats: TodayStats;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  const completedPercentage = stats.completed / (stats.completed + stats.pending) * 100 || 0;

  const statItems = [
    { value: stats.completed, label: 'Completed', color: colors.success, icon: 'checkmark-circle' },
    { value: stats.pending, label: 'Pending', color: colors.warning, icon: 'time' },
    { value: stats.totalDistance, label: 'km', color: colors.cyan, icon: 'car' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Overview</Text>

      {/* Stats Row - Horizontal Pills */}
      <View style={styles.statsRow}>
        {statItems.map((item, index) => (
          <View key={index} style={[styles.statPill, shadows.sm]}>
            <View style={[styles.statIconBg, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <Text style={styles.statNumber}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Progress Card */}
      <View style={[styles.progressCard, shadows.card]}>
        <LinearGradient
          colors={[colors.card, colors.cardDark]}
          style={styles.progressGradient}
        >
          <View style={styles.progressHeader}>
            <View style={styles.progressLabelContainer}>
              <View style={styles.progressIconBg}>
                <Ionicons name="trending-up" size={14} color={colors.accent} />
              </View>
              <Text style={styles.progressLabel}>Daily Progress</Text>
            </View>
            <Text style={styles.progressPercentage}>{Math.round(completedPercentage)}%</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={gradients.accent}
                style={[styles.progressFill, { width: `${completedPercentage}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          <Text style={styles.progressSubtext}>
            {stats.completed} of {stats.completed + stats.pending} inspections completed
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  statIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  progressCard: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  progressGradient: {
    padding: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  progressPercentage: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },
});

export default StatsCard;
