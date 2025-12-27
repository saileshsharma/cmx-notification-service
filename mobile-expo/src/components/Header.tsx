import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, shadows, borderRadius } from '../constants/theme';
import { SurveyorStatus } from '../types';

interface HeaderProps {
  surveyorName: string | null;
  currentStatus: SurveyorStatus;
  isOnline: boolean;
  unreadCount: number;
  badgeScale: Animated.Value;
  onNotificationPress: () => void;
  onLogoutPress: () => void;
  onProfilePress: () => void;
  onStatusChange: (status: SurveyorStatus) => void;
  onSOS?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  surveyorName,
  currentStatus,
  isOnline,
  unreadCount,
  badgeScale,
  onNotificationPress,
  onLogoutPress,
  onProfilePress,
  onStatusChange,
  onSOS,
}) => {
  const getAvatarInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={styles.headerContainer}>
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerContent}>
          {/* Left: Profile Section */}
          <TouchableOpacity style={styles.profileSection} onPress={onProfilePress}>
            <View style={styles.avatarContainer}>
              <LinearGradient colors={gradients.accent} style={styles.avatar}>
                <Text style={styles.avatarText}>{getAvatarInitials(surveyorName)}</Text>
              </LinearGradient>
              <View style={[
                styles.statusDot,
                { backgroundColor: currentStatus === 'AVAILABLE' ? colors.success :
                                   currentStatus === 'BUSY' ? colors.warning : colors.gray[500] }
              ]} />
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userName}>{surveyorName || 'Surveyor'}</Text>
            </View>
          </TouchableOpacity>

          {/* Right: Actions */}
          <View style={styles.headerRight}>
            {!isOnline && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline" size={16} color={colors.danger} />
              </View>
            )}

            {/* Notification Bell */}
            <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
              <Ionicons name="notifications-outline" size={22} color={colors.text.primary} />
              {unreadCount > 0 && (
                <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Toggle Bar */}
        <View style={styles.statusRow}>
          {(['AVAILABLE', 'BUSY', 'OFFLINE'] as SurveyorStatus[]).map((status) => {
            const isActive = currentStatus === status;
            const statusColors: { [key: string]: string } = {
              AVAILABLE: colors.success,
              BUSY: colors.warning,
              OFFLINE: colors.gray[600],
            };
            const statusIcons: { [key: string]: string } = {
              AVAILABLE: 'checkmark-circle',
              BUSY: 'time',
              OFFLINE: 'moon',
            };
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusPill,
                  isActive && {
                    backgroundColor: statusColors[status],
                    ...shadows.sm,
                  }
                ]}
                onPress={() => onStatusChange(status)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={statusIcons[status] as any}
                  size={14}
                  color={isActive ? colors.black : colors.text.tertiary}
                />
                <Text style={[
                  styles.statusPillText,
                  isActive && { color: colors.black, fontWeight: fontWeight.semibold }
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* SOS Button */}
          {onSOS && (
            <TouchableOpacity style={styles.sosButton} onPress={onSOS}>
              <LinearGradient
                colors={gradients.danger}
                style={styles.sosGradient}
              >
                <Ionicons name="warning" size={14} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.black,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.background,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.black,
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  offlineBadge: {
    backgroundColor: colors.dangerSoft,
    padding: 8,
    borderRadius: 10,
    marginRight: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  statusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.xs,
  },
  statusPillText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'capitalize',
  },
  sosButton: {
    marginLeft: spacing.xs,
  },
  sosGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.dangerGlow,
  },
});

export default Header;
