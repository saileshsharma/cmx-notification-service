import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { TabType } from '../context/AppContext';
import { useFeatureFlagContext, FLAGS } from '../context/FeatureFlagContext';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadMessages?: number;
}

interface TabConfig {
  key: TabType;
  icon: string;
  label: string;
  flagName?: string;
}

const allTabs: TabConfig[] = [
  { key: 'dashboard', icon: 'home', label: 'Home' },
  { key: 'appointments', icon: 'calendar', label: 'Schedule' },
  { key: 'inspection', icon: 'clipboard', label: 'Inspect' },
  { key: 'history', icon: 'time', label: 'History' },
  { key: 'chat', icon: 'chatbubbles', label: 'Chat', flagName: FLAGS.CHAT_V2 },
];

export const BottomNav: React.FC<BottomNavProps> = React.memo(({
  activeTab,
  onTabChange,
  unreadMessages = 0,
}) => {
  const featureFlags = useFeatureFlagContext();

  // Filter tabs based on feature flags
  const visibleTabs = useMemo(() => {
    return allTabs.filter(tab => {
      // If no flag specified, always show
      if (!tab.flagName) return true;
      // Otherwise check the flag
      return featureFlags.isEnabled(tab.flagName);
    });
  }, [featureFlags]);

  return (
    <View style={styles.bottomNav}>
      <LinearGradient
        colors={gradients.header}
        style={styles.navGradient}
      >
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                isActive && styles.iconContainerActive
              ]}>
                <Ionicons
                  name={(isActive ? tab.icon : `${tab.icon}-outline`) as any}
                  size={22}
                  color={isActive ? colors.accent : colors.text.tertiary}
                />
                {tab.key === 'chat' && unreadMessages > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    ...shadows.lg,
  },
  navGradient: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconContainerActive: {
    backgroundColor: colors.accentSoft,
  },
  navLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 4,
  },
  navLabelActive: {
    color: colors.accent,
    fontWeight: fontWeight.medium,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  chatBadge: {
    position: 'absolute',
    top: -2,
    right: 0,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.backgroundSecondary,
  },
  chatBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
});

export default BottomNav;
