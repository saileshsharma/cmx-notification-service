import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
}

interface UploadingOverlayProps {
  visible: boolean;
  progress?: UploadProgress | null;
  message?: string;
}

export const UploadingOverlay: React.FC<UploadingOverlayProps> = ({
  visible,
  progress,
  message = 'Uploading inspection data...',
}) => {
  if (!visible) return null;

  const percentage = progress?.percentage || 0;
  const progressText = progress
    ? `${progress.uploaded} of ${progress.total} files`
    : 'Preparing...';

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        {/* Header Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.iconGradient}
          >
            <Ionicons name="cloud-upload" size={36} color={colors.white} />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>{message}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={gradients.success}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${percentage}%` }]}
            />
          </View>
          <Text style={styles.progressPercentage}>{percentage}%</Text>
        </View>

        {/* Status Text */}
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.statusText}>{progressText}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={styles.infoText}>
            Please keep the app open until upload completes
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: width - spacing.xxxl * 2,
    maxWidth: 340,
    ...shadows.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.accentGlow,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[800],
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressPercentage: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.success,
    width: 45,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: fontSize.md,
    color: colors.gray[600],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary,
    lineHeight: 18,
  },
});

export default UploadingOverlay;
