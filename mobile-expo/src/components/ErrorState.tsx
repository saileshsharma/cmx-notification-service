/**
 * ErrorState - Reusable error display component
 * Supports different error types with appropriate icons and actions
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

type ErrorType = 'network' | 'server' | 'notFound' | 'permission' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  showIcon?: boolean;
}

const ERROR_CONFIGS: Record<ErrorType, { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }> = {
  network: {
    icon: 'wifi-outline',
    title: 'No Connection',
    message: 'Please check your internet connection and try again.',
  },
  server: {
    icon: 'server-outline',
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
  },
  notFound: {
    icon: 'search-outline',
    title: 'Not Found',
    message: 'The requested content could not be found.',
  },
  permission: {
    icon: 'lock-closed-outline',
    title: 'Access Denied',
    message: 'You do not have permission to access this content.',
  },
  generic: {
    icon: 'alert-circle-outline',
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
  compact = false,
  showIcon = true,
}: ErrorStateProps) {
  const config = ERROR_CONFIGS[type];

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {showIcon && (
          <Ionicons name={config.icon} size={24} color={colors.danger} />
        )}
        <Text style={styles.compactMessage}>
          {message || config.message}
        </Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.compactRetry}>
            <Ionicons name="refresh" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showIcon && (
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={64} color={colors.text.tertiary} />
        </View>
      )}

      <Text style={styles.title}>{title || config.title}</Text>
      <Text style={styles.message}>{message || config.message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color={colors.text.inverse} />
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Empty state for when there's no data
 */
export function EmptyState({
  icon = 'file-tray-outline',
  title = 'No Data',
  message = 'There is nothing to display here.',
  action,
  actionLabel,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={colors.text.tertiary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {action && actionLabel && (
        <TouchableOpacity style={styles.actionButton} onPress={action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Offline banner for network connectivity issues
 */
export function OfflineBanner({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <View style={styles.offlineBanner}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.text.inverse} />
      <Text style={styles.offlineText}>You are offline</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.offlineRetry}>
          <Text style={styles.offlineRetryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Inline error message for form fields and small areas
 */
export function InlineError({
  message,
}: {
  message: string;
}) {
  return (
    <View style={styles.inlineError}>
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Text style={styles.inlineErrorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
    opacity: 0.7,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.button,
    gap: spacing.sm,
  },
  retryText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  compactMessage: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  compactRetry: {
    padding: spacing.sm,
  },
  // Offline banner styles
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  offlineText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.inverse,
  },
  offlineRetry: {
    marginLeft: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.sm,
  },
  offlineRetryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
  },
  // Inline error styles
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  inlineErrorText: {
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});
