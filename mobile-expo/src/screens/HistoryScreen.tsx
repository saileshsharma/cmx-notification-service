import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

interface InspectionHistoryItem {
  id: number;
  date: Date;
  vehicle: string;
  status: string;
  photos: number;
}

interface HistoryScreenProps {
  inspectionHistory: InspectionHistoryItem[];
  onViewReport: (id: number) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  inspectionHistory,
  onViewReport,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <LinearGradient colors={gradients.cyan} style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{inspectionHistory.length}</Text>
              <Text style={styles.statLabel}>Total Inspections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {inspectionHistory.reduce((sum, item) => sum + item.photos, 0)}
              </Text>
              <Text style={styles.statLabel}>Photos Taken</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Title */}
      <Text style={styles.title}>Recent Inspections</Text>

      {/* History List */}
      {inspectionHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="time-outline" size={48} color={colors.text.tertiary} />
          </View>
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptySubtitle}>
            Completed inspections will appear here
          </Text>
        </View>
      ) : (
        inspectionHistory.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.historyCard, shadows.card]}
            onPress={() => onViewReport(item.id)}
          >
            <LinearGradient colors={[colors.card, colors.cardDark]} style={styles.cardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <LinearGradient colors={gradients.purple} style={styles.iconGradient}>
                    <Ionicons name="document-text" size={24} color={colors.white} />
                  </LinearGradient>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.vehicleName}>{item.vehicle}</Text>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="camera" size={12} color={colors.text.tertiary} />
                      <Text style={styles.metaText}>{item.photos} photos</Text>
                    </View>
                    <View style={[styles.metaBadge, styles.successBadge]}>
                      <Ionicons name="checkmark" size={12} color={colors.success} />
                      <Text style={[styles.metaText, styles.successText]}>Completed</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.timeAgo}>{getTimeAgo(item.date)}</Text>
                  <View style={styles.arrowButton}>
                    <Ionicons name="chevron-forward" size={18} color={colors.black} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  statsContainer: {
    marginBottom: spacing.xl,
  },
  statsCard: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.md,
  },
  statsContent: {
    flexDirection: 'row',
    padding: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  historyCard: {
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardGradient: {
    borderRadius: borderRadius.card,
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: spacing.md,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.xs,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  successBadge: {
    backgroundColor: colors.successSoft,
  },
  successText: {
    color: colors.success,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default HistoryScreen;
