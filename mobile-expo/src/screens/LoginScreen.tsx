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
  ImageBackground,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { images } from '../constants/images';

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
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: images.loginBackground }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <LinearGradient
          colors={['rgba(0, 71, 179, 0.92)', 'rgba(31, 41, 55, 0.95)', 'rgba(17, 24, 39, 0.98)']}
          style={styles.overlay}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
            {/* Branding */}
            <View style={styles.brandingContainer}>
              <View style={styles.logoContainer}>
                <LinearGradient colors={['#0F172A', '#1E3A5F']} style={styles.logoGradient}>
                  <View style={styles.logoInner}>
                    <Ionicons name="shield-checkmark" size={36} color={colors.white} />
                  </View>
                </LinearGradient>
                <View style={styles.logoBadge}>
                  <Ionicons name="car-sport" size={16} color={colors.white} />
                </View>
              </View>
              <Text style={styles.brandTitle}>FleetInspect</Text>
              <Text style={styles.brandPro}>PRO</Text>
              <Text style={styles.brandSubtitle}>Enterprise Vehicle Inspection</Text>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.welcomeText}>Welcome Back</Text>
                  <Text style={styles.instructionText}>Sign in to continue</Text>

                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color={colors.gray[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor={colors.gray[400]}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!isLoggingIn}
                      />
                    </View>

                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.gray[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={colors.gray[400]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!isLoggingIn}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={colors.gray[400]}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.loginButton, !isValid && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={!isValid || isLoggingIn}
                  >
                    <LinearGradient
                      colors={isValid ? gradients.primary : [colors.gray[400], colors.gray[400]]}
                      style={styles.loginButtonGradient}
                    >
                      {isLoggingIn ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Sign In</Text>
                          <Ionicons name="arrow-forward" size={20} color={colors.white} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.featuresContainer}>
                    <View style={styles.featureItem}>
                      <View style={[styles.featureIcon, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="location" size={14} color="#3B82F6" />
                      </View>
                      <Text style={styles.featureText}>GPS Tracking</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={[styles.featureIcon, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="camera" size={14} color="#22C55E" />
                      </View>
                      <Text style={styles.featureText}>Photo Evidence</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="shield-checkmark" size={14} color="#F59E0B" />
                      </View>
                      <Text style={styles.featureText}>Compliance</Text>
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
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  overlay: {
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
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1E3A5F',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  brandPro: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: spacing.xs,
    letterSpacing: 2,
    overflow: 'hidden',
  },
  brandSubtitle: {
    fontSize: fontSize.md,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
  loginCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[500],
    fontSize: fontSize.md,
  },
  welcomeText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginBottom: spacing.xl,
  },
  inputContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.lg,
    fontSize: fontSize.md,
    color: colors.gray[800],
  },
  eyeIcon: {
    padding: spacing.sm,
  },
  loginButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  footerText: {
    textAlign: 'center',
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
  footerVersion: {
    textAlign: 'center',
    color: colors.gray[600],
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },
});

export default LoginScreen;
