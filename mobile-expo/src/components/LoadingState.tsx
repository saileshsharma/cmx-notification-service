/**
 * LoadingState - Reusable loading indicator component
 * Supports different sizes, overlay mode, and messages
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  overlay?: boolean;
  transparent?: boolean;
  fullScreen?: boolean;
}

export function LoadingState({
  message,
  size = 'large',
  overlay = false,
  transparent = false,
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreen,
      transparent && styles.transparent,
    ]}>
      <View style={styles.content}>
        <ActivityIndicator
          size={size}
          color={colors.accent}
        />
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size={size} color={colors.accent} />
            {message && (
              <Text style={styles.overlayMessage}>{message}</Text>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return content;
}

/**
 * Inline loading spinner for buttons and small areas
 */
export function LoadingSpinner({
  size = 'small',
  color = colors.accent,
}: {
  size?: 'small' | 'large';
  color?: string;
}) {
  return <ActivityIndicator size={size} color={color} />;
}

/**
 * Skeleton loading placeholder
 */
export function SkeletonLoader({
  width,
  height,
  borderRadius: radius = borderRadius.md,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
}) {
  return (
    <View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius: radius },
      ]}
    />
  );
}

/**
 * Card skeleton for list items
 */
export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardSkeletonHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.cardSkeletonText}>
          <SkeletonLoader width="70%" height={16} />
          <SkeletonLoader width="50%" height={12} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={60} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 150,
    gap: spacing.md,
  },
  overlayMessage: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  skeleton: {
    backgroundColor: colors.cardBorder,
    opacity: 0.5,
  },
  cardSkeleton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardSkeletonText: {
    flex: 1,
    gap: spacing.sm,
  },
});
