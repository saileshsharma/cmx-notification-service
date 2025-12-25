import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { TodayStats } from '../context/AppContext';

const { width } = Dimensions.get('window');

interface StatsCardProps {
  stats: TodayStats;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  const completedPercentage = stats.completed / (stats.completed + stats.pending) * 100 || 0;

  const statItems = [
    { value: stats.completed, label: 'Completed', gradient: gradients.success, icon: 'checkmark-circle' },
    { value: stats.pending, label: 'Pending', gradient: gradients.warning, icon: 'time' },
    { value: stats.totalDistance, label: 'km traveled', gradient: gradients.purple, icon: 'car' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Overview</Text>

      <View style={styles.statsRow}>
        {statItems.map((item, index) => (
          <View key={index} style={styles.statCard}>
            <LinearGradient colors={item.gradient} style={styles.statGradient}>
              <View style={styles.statIconContainer}>
                <Ionicons name={item.icon as any} size={20} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.statNumber}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelContainer}>
            <Ionicons name="trending-up" size={16} color={colors.success} />
            <Text style={styles.progressLabel}>Daily Progress</Text>
          </View>
          <Text style={styles.progressPercentage}>{Math.round(completedPercentage)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={gradients.success}
            style={[styles.progressFill, { width: `${completedPercentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.progressSubtext}>
          {stats.completed} of {stats.completed + stats.pending} inspections completed
        </Text>
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
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  statGradient: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    fontSize: fontSize.md,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  progressPercentage: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.gray[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressSubtext: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default StatsCard;
