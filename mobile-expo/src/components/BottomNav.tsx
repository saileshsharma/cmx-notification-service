import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../constants/theme';
import { TabType } from '../context/AppContext';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadMessages?: number;
}

const tabs: { key: TabType; icon: string; label: string }[] = [
  { key: 'dashboard', icon: 'home', label: 'Home' },
  { key: 'appointments', icon: 'calendar', label: 'Schedule' },
  { key: 'inspection', icon: 'clipboard', label: 'Inspect' },
  { key: 'history', icon: 'time', label: 'History' },
  { key: 'chat', icon: 'chatbubbles', label: 'Chat' },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadMessages = 0,
}) => {
  return (
    <View style={styles.bottomNav}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={styles.navItem}
          onPress={() => onTabChange(tab.key)}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={(activeTab === tab.key ? tab.icon : `${tab.icon}-outline`) as any}
              size={24}
              color={activeTab === tab.key ? colors.primary : colors.gray[500]}
            />
            {tab.key === 'chat' && unreadMessages > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    position: 'relative',
  },
  navLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 4,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
});

export default BottomNav;
