import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, gradients, shadows } from '../constants/theme';

interface ProfileScreenProps {
  surveyorName: string | null;
  surveyorEmail: string | null;
  surveyorPhone: string | null;
  surveyorCode: string | null;
  onPasswordChange: (currentPassword: string, newPassword: string) => Promise<boolean>;
  biometricSupported?: boolean;
  biometricEnabled?: boolean;
  onToggleBiometric?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  surveyorName,
  surveyorEmail,
  surveyorPhone,
  surveyorCode,
  onPasswordChange,
  biometricSupported = false,
  biometricEnabled = false,
  onToggleBiometric,
}) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const getAvatarInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const success = await onPasswordChange(currentPassword, newPassword);
      if (success) {
        Alert.alert('Success', 'Password changed successfully');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', 'Failed to change password. Please check your current password.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderInfoRow = (icon: keyof typeof Ionicons.glyphMap, label: string, value: string | null) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not set'}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <LinearGradient colors={gradients.accent} style={[styles.avatarLarge, shadows.accentGlow]}>
            <Text style={styles.avatarText}>{getAvatarInitials(surveyorName)}</Text>
          </LinearGradient>
          <Text style={styles.name}>{surveyorName || 'Surveyor'}</Text>
          {surveyorCode && (
            <View style={styles.codeBadge}>
              <Ionicons name="id-card-outline" size={14} color={colors.accent} />
              <Text style={styles.codeText}>{surveyorCode}</Text>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={[styles.card, shadows.card]}>
            <LinearGradient colors={[colors.card, colors.cardDark]} style={styles.cardGradient}>
              {renderInfoRow('person-outline', 'Full Name', surveyorName)}
              {renderInfoRow('mail-outline', 'Email', surveyorEmail)}
              {renderInfoRow('call-outline', 'Phone', surveyorPhone)}
              {renderInfoRow('id-card-outline', 'Surveyor Code', surveyorCode)}
            </LinearGradient>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={[styles.card, shadows.card]}>
            <LinearGradient colors={[colors.card, colors.cardDark]} style={styles.cardGradient}>
              {/* Biometric Authentication Toggle */}
              {biometricSupported && onToggleBiometric && (
                <TouchableOpacity
                  style={styles.securityRow}
                  onPress={onToggleBiometric}
                >
                  <View style={styles.buttonContent}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons
                        name={Platform.OS === 'ios' ? 'finger-print' : 'finger-print'}
                        size={22}
                        color={colors.accent}
                      />
                    </View>
                    <View style={styles.securityTextContainer}>
                      <Text style={styles.buttonText}>
                        {Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Biometric Login'}
                      </Text>
                      <Text style={styles.securitySubtext}>
                        {biometricEnabled ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.toggleIndicator, biometricEnabled && styles.toggleIndicatorActive]}>
                    <View style={[styles.toggleDot, biometricEnabled && styles.toggleDotActive]} />
                  </View>
                </TouchableOpacity>
              )}

              {/* Change Password */}
              {!showPasswordForm ? (
                <TouchableOpacity
                  style={styles.changePasswordButton}
                  onPress={() => setShowPasswordForm(true)}
                >
                  <View style={styles.buttonContent}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="lock-closed-outline" size={22} color={colors.accent} />
                    </View>
                    <Text style={styles.buttonText}>Change Password</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.passwordForm}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Current Password</Text>
                    <View style={styles.passwordInputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrentPassword}
                        placeholder="Enter current password"
                        placeholderTextColor={colors.text.muted}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        <Ionicons
                          name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={22}
                          color={colors.text.tertiary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <View style={styles.passwordInputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPassword}
                        placeholder="Enter new password"
                        placeholderTextColor={colors.text.muted}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                      >
                        <Ionicons
                          name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={22}
                          color={colors.text.tertiary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <View style={styles.passwordInputWrapper}>
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showNewPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor={colors.text.muted}
                      />
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveButton, isChangingPassword && styles.saveButtonDisabled]}
                      onPress={handlePasswordChange}
                      disabled={isChangingPassword}
                    >
                      <LinearGradient
                        colors={isChangingPassword ? [colors.gray[600], colors.gray[700]] : gradients.accent}
                        style={styles.saveButtonGradient}
                      >
                        <Text style={styles.saveButtonText}>
                          {isChangingPassword ? 'Saving...' : 'Save Password'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.black,
    fontSize: 36,
    fontWeight: fontWeight.bold,
  },
  name: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  codeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardGradient: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  securityTextContainer: {
    flex: 1,
  },
  securitySubtext: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  toggleIndicator: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundTertiary,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleIndicatorActive: {
    backgroundColor: colors.accentSoft,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.text.muted,
  },
  toggleDotActive: {
    backgroundColor: colors.accent,
    alignSelf: 'flex-end',
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  passwordForm: {
    paddingTop: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  eyeButton: {
    padding: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
  },
  saveButton: {
    flex: 1,
    borderRadius: borderRadius.button,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: fontSize.md,
    color: colors.black,
    fontWeight: fontWeight.semibold,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ProfileScreen;
