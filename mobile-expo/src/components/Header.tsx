import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight } from '../constants/theme';
import { SurveyorStatus } from '../types';

interface HeaderProps {
  surveyorName: string | null;
  currentStatus: SurveyorStatus;
  isOnline: boolean;
  unreadCount: number;
  badgeScale: Animated.Value;
  onNotificationPress: () => void;
  onLogoutPress: () => void;
  onStatusChange: (status: SurveyorStatus) => void;
}

export const Header: React.FC<HeaderProps> = ({
  surveyorName,
  currentStatus,
  isOnline,
  unreadCount,
  badgeScale,
  onNotificationPress,
  onLogoutPress,
  onStatusChange,
}) => {
  const getAvatarInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <LinearGradient colors={gradients.darkPremium} style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.profileSection}>
          <LinearGradient colors={gradients.primaryVibrant} style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarInitials(surveyorName)}</Text>
          </LinearGradient>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{surveyorName || 'Surveyor'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={16} color={colors.danger} />
            </View>
          )}
          <TouchableOpacity style={styles.bellContainer} onPress={onNotificationPress}>
            <Ionicons name="notifications" size={26} color={colors.white} />
            {unreadCount > 0 && (
              <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogoutPress} style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Toggle */}
      <View style={styles.statusRow}>
        {(['AVAILABLE', 'BUSY', 'OFFLINE'] as SurveyorStatus[]).map((status) => {
          const isActive = currentStatus === status;
          const statusColors: { [key: string]: string } = {
            AVAILABLE: colors.success,
            BUSY: colors.warning,
            OFFLINE: colors.gray[500],
          };
          return (
            <TouchableOpacity
              key={status}
              style={[styles.statusPill, isActive && { backgroundColor: statusColors[status] }]}
              onPress={() => onStatusChange(status)}
            >
              <Text style={[styles.statusPillText, isActive && { color: colors.white }]}>
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bellContainer: {
    position: 'relative',
    padding: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  logoutIcon: {
    padding: spacing.sm,
  },
  offlineBadge: {
    backgroundColor: '#FEE2E2',
    padding: 6,
    borderRadius: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statusPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  statusPillText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});

export default Header;
