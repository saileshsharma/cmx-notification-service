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
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { CachedImage } from '../components/CachedImage';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// Premium car image from Unsplash - Yellow Porsche
const CAR_IMAGE_URL = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80';

type LoginMode = 'password' | 'biometric';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onBack?: () => void;
  onRegister?: () => void;
  onBiometricLogin?: () => Promise<boolean>;
  biometricEnabled?: boolean;
  hasPreviousLogin?: boolean; // True if user has logged in before
  isLoading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onBack,
  onRegister,
  onBiometricLogin,
  biometricEnabled = false,
  hasPreviousLogin = false,
  isLoading,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Auto-select biometric mode if enabled and available
  useEffect(() => {
    if (biometricEnabled && biometricAvailable && hasPreviousLogin) {
      setLoginMode('biometric');
    }
  }, [biometricEnabled, biometricAvailable, hasPreviousLogin]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);

      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        }
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
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
  const canUseBiometric = biometricEnabled && biometricAvailable && hasPreviousLogin;
  const biometricLabel = biometricType === 'face' ? 'Face ID' : 'Touch ID';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Car Image Background */}
      <View style={styles.imageContainer}>
        <CachedImage
          uri={CAR_IMAGE_URL}
          style={styles.carImage}
          contentFit="cover"
          showLoadingIndicator={false}
          onLoad={() => setImageLoaded(true)}
        />
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.7)', colors.background]}
          style={styles.imageOverlay}
        />

        {/* Back Button */}
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}

        {/* Brand Badge */}
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>FleetInspect</Text>
          <View style={styles.proBadge}>
            <Text style={styles.proText}>PRO</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to continue your inspections
            </Text>
          </View>

          {/* Login Mode Toggle - Only show if biometric is available and enabled */}
          {canUseBiometric && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, loginMode === 'password' && styles.toggleButtonActive]}
                onPress={() => setLoginMode('password')}
              >
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={loginMode === 'password' ? colors.black : colors.text.tertiary}
                />
                <Text style={[styles.toggleText, loginMode === 'password' && styles.toggleTextActive]}>
                  Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, loginMode === 'biometric' && styles.toggleButtonActive]}
                onPress={() => setLoginMode('biometric')}
              >
                <Ionicons
                  name={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
                  size={18}
                  color={loginMode === 'biometric' ? colors.black : colors.text.tertiary}
                />
                <Text style={[styles.toggleText, loginMode === 'biometric' && styles.toggleTextActive]}>
                  {biometricLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Login Form */}
          <View style={styles.formContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : loginMode === 'password' ? (
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

                {/* First time user hint about biometric */}
                {!hasPreviousLogin && biometricAvailable && (
                  <View style={styles.biometricHint}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.text.muted} />
                    <Text style={styles.biometricHintText}>
                      After logging in, you can enable {biometricLabel} for faster access
                    </Text>
                  </View>
                )}
              </>
            ) : (
              // Biometric Login Mode
              <View style={styles.biometricLoginContainer}>
                <View style={styles.biometricIconLarge}>
                  <LinearGradient
                    colors={['rgba(204, 255, 0, 0.2)', 'rgba(204, 255, 0, 0.05)']}
                    style={styles.biometricIconGlow}
                  >
                    <Ionicons
                      name={biometricType === 'face' ? 'scan' : 'finger-print'}
                      size={64}
                      color={colors.accent}
                    />
                  </LinearGradient>
                </View>

                <Text style={styles.biometricTitle}>Use {biometricLabel}</Text>
                <Text style={styles.biometricSubtitle}>
                  Authenticate quickly and securely with {biometricLabel}
                </Text>

                <TouchableOpacity
                  style={styles.biometricLoginButton}
                  onPress={handleBiometricLogin}
                  disabled={isLoggingIn}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradients.accent}
                    style={styles.biometricLoginGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoggingIn ? (
                      <ActivityIndicator color={colors.black} />
                    ) : (
                      <>
                        <Ionicons
                          name={biometricType === 'face' ? 'scan' : 'finger-print'}
                          size={24}
                          color={colors.black}
                        />
                        <Text style={styles.biometricLoginText}>
                          Login with {biometricLabel}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.usePasswordLink}
                  onPress={() => setLoginMode('password')}
                >
                  <Text style={styles.usePasswordText}>Use password instead</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Register Link */}
          {onRegister && loginMode === 'password' && (
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onRegister}>
                <Text style={styles.registerLink}>Register Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    height: height * 0.35,
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  proBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
  },
  proText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.black,
    letterSpacing: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  toggleButtonActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.tertiary,
  },
  toggleTextActive: {
    color: colors.black,
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
  biometricHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  biometricHintText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    flex: 1,
  },
  biometricLoginContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  biometricIconLarge: {
    marginBottom: spacing.xl,
  },
  biometricIconGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  biometricTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  biometricSubtitle: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  biometricLoginButton: {
    width: '100%',
    borderRadius: borderRadius.button,
    overflow: 'hidden',
    ...shadows.accentGlow,
  },
  biometricLoginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg + 2,
    gap: spacing.md,
  },
  biometricLoginText: {
    color: colors.black,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  usePasswordLink: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  usePasswordText: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: fontWeight.medium,
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
