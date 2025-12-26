import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onLogin,
  onRegister,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background with gradient overlay */}
      <LinearGradient
        colors={[colors.background, '#0a0a0a', colors.background]}
        style={styles.backgroundGradient}
      >
        {/* Hero Section with Car Visual */}
        <View style={styles.heroSection}>
          {/* Decorative elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />

          {/* Large Car Icon */}
          <View style={styles.carContainer}>
            <LinearGradient
              colors={['rgba(204, 255, 0, 0.15)', 'rgba(204, 255, 0, 0.05)']}
              style={styles.carGlow}
            >
              <View style={styles.carIconWrapper}>
                <Ionicons name="car-sport" size={120} color={colors.accent} />
              </View>
            </LinearGradient>

            {/* Floating badges */}
            <View style={[styles.floatingBadge, styles.badge1]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
            </View>
            <View style={[styles.floatingBadge, styles.badge2]}>
              <Ionicons name="camera" size={16} color={colors.cyan} />
            </View>
            <View style={[styles.floatingBadge, styles.badge3]}>
              <Ionicons name="location" size={16} color={colors.accent} />
            </View>
          </View>

          {/* App Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.appName}>FleetInspect</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proText}>PRO</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Enterprise Vehicle Inspection</Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500K+</Text>
              <Text style={styles.statLabel}>Inspections</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>99.9%</Text>
              <Text style={styles.statLabel}>Uptime</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={onLogin}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={gradients.accent}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>Login</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="arrow-forward" size={18} color={colors.black} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={onRegister}
              activeOpacity={0.8}
            >
              <Text style={styles.registerButtonText}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Trusted by leading fleet companies worldwide
            </Text>
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                <Text style={styles.trustText}>SSL Secured</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="lock-closed" size={12} color={colors.accent} />
                <Text style={styles.trustText}>GDPR Compliant</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    flex: 1,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: '15%',
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(204, 255, 0, 0.03)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: '30%',
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(204, 255, 0, 0.02)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: '10%',
    left: '20%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 212, 255, 0.02)',
  },
  carContainer: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  carGlow: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carIconWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  floatingBadge: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.md,
  },
  badge1: {
    top: 10,
    right: 0,
  },
  badge2: {
    bottom: 30,
    left: -10,
  },
  badge3: {
    bottom: 10,
    right: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  appName: {
    fontSize: 42,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  proBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.black,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  bottomSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.cardBorder,
  },
  buttonsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  loginButton: {
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...shadows.accentGlow,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg + 2,
    gap: spacing.sm,
  },
  loginButtonText: {
    color: colors.black,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.lg + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  registerButtonText: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  trustBadges: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
});

export default WelcomeScreen;
