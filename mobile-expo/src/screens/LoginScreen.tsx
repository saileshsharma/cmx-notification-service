import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onBack?: () => void;
  onRegister?: () => void;
  onBiometricLogin?: () => Promise<boolean>;
  biometricEnabled?: boolean;
  isLoading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onBack,
  onRegister,
  onBiometricLogin,
  biometricEnabled = false,
  isLoading,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | null>(null);

  useEffect(() => {
    checkBiometricType();
  }, []);

  const checkBiometricType = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('face');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('fingerprint');
      }
    } catch (error) {
      console.error('Error checking biometric type:', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setIsLoggingIn(true);
    try {
      await onLogin(email.trim().toLowerCase(), password.trim());
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (onBiometricLogin) {
      setIsLoggingIn(true);
      try {
        await onBiometricLogin();
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const isValid = email.trim() && password.trim();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient
        colors={[colors.background, '#0a0a0a', colors.background]}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              {onBack && (
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                  <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgba(204, 255, 0, 0.15)', 'rgba(204, 255, 0, 0.05)']}
                  style={styles.iconGlow}
                >
                  <Ionicons name="person" size={40} color={colors.accent} />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to continue your inspections
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : (
                <>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.text.muted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!isLoggingIn}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.text.tertiary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
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

                  {/* Forgot Password */}
                  <TouchableOpacity style={styles.forgotPassword}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* Login Button */}
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
                            Login
                          </Text>
                          <View style={styles.arrowContainer}>
                            <Ionicons name="arrow-forward" size={18} color={isValid ? colors.black : colors.gray[400]} />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Biometric Login */}
                  {biometricEnabled && biometricType && (
                    <View style={styles.biometricSection}>
                      <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>Or login with</Text>
                        <View style={styles.divider} />
                      </View>

                      <TouchableOpacity
                        style={styles.biometricButton}
                        onPress={handleBiometricLogin}
                        activeOpacity={0.8}
                      >
                        <View style={styles.biometricIconContainer}>
                          <Ionicons
                            name={biometricType === 'face' ? 'scan' : 'finger-print'}
                            size={28}
                            color={colors.accent}
                          />
                        </View>
                        <Text style={styles.biometricButtonText}>
                          {biometricType === 'face' ? 'Face ID' : 'Touch ID'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                </>
              )}
            </View>

            {/* Register Link */}
            {onRegister && (
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={onRegister}>
                  <Text style={styles.registerLink}>Register Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconGlow: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: spacing.xl,
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
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: fontWeight.medium,
  },
  loginButton: {
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...shadows.accentGlow,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
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
  biometricSection: {
    marginTop: spacing.xl,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  biometricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
  },
  registerLink: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
  },
});

export default LoginScreen;
