import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setIsLoggingIn(true);
    try {
      await onLogin(email.trim().toLowerCase(), password.trim());
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isValid = email.trim() && password.trim();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary, colors.background]}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoOuter}>
                <LinearGradient
                  colors={[colors.card, colors.cardDark]}
                  style={styles.logoGradient}
                >
                  <View style={styles.logoInner}>
                    <Ionicons name="car-sport" size={40} color={colors.accent} />
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.logoBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.black} />
              </View>
            </View>
            <Text style={styles.brandTitle}>FleetInspect</Text>
            <View style={styles.proBadge}>
              <Text style={styles.brandPro}>PRO</Text>
            </View>
            <Text style={styles.brandSubtitle}>Vehicle Inspection Platform</Text>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.welcomeText}>Welcome Back</Text>
                <Text style={styles.instructionText}>Sign in to continue your inspections</Text>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor={colors.text.muted}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoggingIn}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={colors.text.muted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!isLoggingIn}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.text.tertiary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, !isValid && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={!isValid || isLoggingIn}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isValid ? gradients.accent : [colors.gray[600], colors.gray[700]]}
                    style={styles.loginButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color={colors.black} />
                    ) : (
                      <>
                        <Text style={[styles.loginButtonText, !isValid && styles.loginButtonTextDisabled]}>
                          Sign In
                        </Text>
                        <View style={styles.arrowContainer}>
                          <Ionicons name="arrow-forward" size={18} color={isValid ? colors.black : colors.gray[400]} />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.featuresContainer}>
                  <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.accentSoft }]}>
                      <Ionicons name="location" size={16} color={colors.accent} />
                    </View>
                    <Text style={styles.featureText}>GPS Tracking</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.successSoft }]}>
                      <Ionicons name="camera" size={16} color={colors.success} />
                    </View>
                    <Text style={styles.featureText}>Photo Evidence</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={[styles.featureIcon, { backgroundColor: colors.cyanSoft }]}>
                      <Ionicons name="chatbubbles" size={16} color={colors.cyan} />
                    </View>
                    <Text style={styles.featureText}>AI Assistant</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Enterprise Fleet Inspection Platform</Text>
            <Text style={styles.footerVersion}>v1.0.0</Text>
          </View>
        </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
    position: 'relative',
  },
  logoOuter: {
    ...shadows.lg,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  logoInner: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
    ...shadows.accentGlow,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
  proBadge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  brandPro: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
  loginCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xxl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.tertiary,
    fontSize: fontSize.md,
  },
  welcomeText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  eyeIcon: {
    padding: spacing.sm,
  },
  loginButton: {
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...shadows.accentGlow,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    ...shadows.none,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loginButtonText: {
    color: colors.black,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  loginButtonTextDisabled: {
    color: colors.gray[400],
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    fontWeight: fontWeight.medium,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: {
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
  footerVersion: {
    textAlign: 'center',
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
});

export default LoginScreen;
