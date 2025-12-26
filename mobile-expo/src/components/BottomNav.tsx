import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, fontSize, fontWeight } from '../constants/theme';
import { TabType } from '../context/AppContext';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  unreadMessages?: number;
  onSOS?: () => void;
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
  onSOS,
}) => {
  return (
    <View style={styles.bottomNav}>
      {tabs.slice(0, 2).map(tab => (
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
          </View>
          <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}

      {/* SOS Button in center */}
      <TouchableOpacity
        style={styles.sosButtonContainer}
        onPress={onSOS}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF6B6B', '#EE5A5A', '#DC3545']}
          style={styles.sosButton}
        >
          <Ionicons name="warning" size={24} color={colors.white} />
          <Text style={styles.sosText}>SOS</Text>
        </LinearGradient>
      </TouchableOpacity>

      {tabs.slice(2).map(tab => (
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
    alignItems: 'flex-end',
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
  sosButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    zIndex: 10,
  },
  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sosText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    marginTop: 2,
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
