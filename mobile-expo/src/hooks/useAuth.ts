/**
 * useAuth Hook - Authentication logic extracted from App.tsx
 * Handles login, logout, biometric authentication, and session management
 */
import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { notificationService } from '../services/notifications';
import { locationService } from '../services/location';
import { chatService } from '../services/chat';
import { SurveyorStatus } from '../types';
import { logger } from '../utils/logger';
import { setSentryUser, clearSentryUser, setSentryTag, addSentryBreadcrumb } from '../config/sentry';

export type AuthScreen = 'welcome' | 'login' | 'register';

export interface AuthState {
  isRegistered: boolean;
  isLoading: boolean;
  authScreen: AuthScreen;
  surveyorId: number | null;
  surveyorName: string | null;
  surveyorEmail: string | null;
  surveyorPhone: string | null;
  surveyorCode: string | null;
  currentStatus: SurveyorStatus;
  expoPushToken: string;
  hasPreviousLogin: boolean;
  biometricSupported: boolean;
  biometricEnabled: boolean;
  biometricAuthenticated: boolean;
}

export interface UseAuthReturn extends AuthState {
  // Navigation
  setAuthScreen: (screen: AuthScreen) => void;

  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;

  // Biometric
  authenticateWithBiometrics: () => Promise<boolean>;
  handleBiometricLogin: () => Promise<boolean>;
  toggleBiometricLogin: () => Promise<void>;

  // Status
  updateStatus: (status: SurveyorStatus) => Promise<void>;

  // Token
  setExpoPushToken: (token: string) => void;
}

const INITIAL_STATE: AuthState = {
  isRegistered: false,
  isLoading: true,
  authScreen: 'welcome',
  surveyorId: null,
  surveyorName: null,
  surveyorEmail: null,
  surveyorPhone: null,
  surveyorCode: null,
  currentStatus: 'AVAILABLE',
  expoPushToken: '',
  hasPreviousLogin: false,
  biometricSupported: false,
  biometricEnabled: false,
  biometricAuthenticated: false,
};

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  // Check biometric support on mount
  useEffect(() => {
    checkBiometricSupport();
    loadSavedState();
  }, []);

  // Register push token when it becomes available and user is logged in
  // This handles the case where the token is obtained after auto-login
  useEffect(() => {
    const registerTokenIfNeeded = async () => {
      if (state.surveyorId && state.expoPushToken && state.isRegistered) {
        logger.info('[Auth] Registering push token for logged-in user');
        try {
          await apiService.registerDevice({
            surveyorId: state.surveyorId,
            token: state.expoPushToken,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          });
          logger.info('[Auth] Push token registered successfully');
        } catch (error) {
          logger.warn('[Auth] Failed to register push token:', error);
        }
      }
    };
    registerTokenIfNeeded();
  }, [state.surveyorId, state.expoPushToken, state.isRegistered]);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setState(prev => ({ ...prev, biometricSupported: compatible }));

      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (enrolled) {
          const biometricPref = await AsyncStorage.getItem('biometric_enabled');
          setState(prev => ({ ...prev, biometricEnabled: biometricPref === 'true' }));
        }
      }
    } catch (error) {
      logger.error('Error checking biometric support:', error);
    }
  };

  const loadSavedState = async () => {
    try {
      const savedNotifications = await storageService.getNotifications();
      const biometricPref = await AsyncStorage.getItem('biometric_enabled');
      const savedSurveyorId = await storageService.getSurveyorId();

      setState(prev => ({
        ...prev,
        biometricEnabled: biometricPref === 'true',
        hasPreviousLogin: savedSurveyorId !== null,
        isLoading: false,
      }));
    } catch (error) {
      logger.error('Error loading saved state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const setAuthScreen = useCallback((screen: AuthScreen) => {
    setState(prev => ({ ...prev, authScreen: screen }));
  }, []);

  const setExpoPushToken = useCallback((token: string) => {
    setState(prev => ({ ...prev, expoPushToken: token }));
  }, []);

  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Fleet Inspection',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setState(prev => ({ ...prev, biometricAuthenticated: true }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } else {
        if (result.error !== 'user_cancel') {
          Alert.alert('Authentication Failed', 'Please try again or use your password.');
        }
        return false;
      }
    } catch (error) {
      logger.error('Biometric authentication error:', error);
      return false;
    }
  }, []);

  const promptBiometricSetup = useCallback(async () => {
    const biometricLabel = Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Biometric';

    Alert.alert(
      'Enable Quick Login',
      `Would you like to use ${biometricLabel} to login faster next time?`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            const success = await authenticateWithBiometrics();
            if (success) {
              await AsyncStorage.setItem('biometric_enabled', 'true');
              setState(prev => ({ ...prev, biometricEnabled: true }));
              Alert.alert('Success', `${biometricLabel} login has been enabled for future logins.`);
            }
          },
        },
      ]
    );
  }, [authenticateWithBiometrics]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      logger.info('[Login] Attempting login for:', email);
      logger.debug('[Login] Push token status:', state.expoPushToken ? 'Token obtained' : 'NO TOKEN');

      const response = await apiService.login({
        email,
        password,
        pushToken: state.expoPushToken || undefined,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      logger.info('[Login] Response:', response.success ? 'Success' : 'Failed');

      if (response.success && response.surveyor) {
        const isFirstLogin = !state.hasPreviousLogin;

        // Save surveyor data
        await storageService.setSurveyorId(response.surveyor.id);
        await storageService.setSurveyorName(response.surveyor.displayName);
        await storageService.setSurveyorEmail(response.surveyor.email || email);
        if (response.surveyor.phone) {
          await storageService.setSurveyorPhone(response.surveyor.phone);
        }
        if (response.surveyor.code) {
          await storageService.setSurveyorCode(response.surveyor.code);
        }
        await storageService.setDeviceRegistered(true);
        if (state.expoPushToken) {
          await storageService.setPushToken(state.expoPushToken);
        }

        setState(prev => ({
          ...prev,
          surveyorId: response.surveyor!.id,
          surveyorName: response.surveyor!.displayName,
          surveyorEmail: response.surveyor!.email || email,
          surveyorPhone: response.surveyor!.phone || null,
          surveyorCode: response.surveyor!.code || null,
          isRegistered: true,
          hasPreviousLogin: true,
          currentStatus: (response.surveyor!.currentStatus as SurveyorStatus) || 'AVAILABLE',
        }));

        // Set Sentry user context for error tracking
        setSentryUser({
          id: response.surveyor!.id,
          email: response.surveyor!.email || email,
          name: response.surveyor!.displayName,
        });
        setSentryTag('surveyor_code', response.surveyor!.code || 'unknown');
        addSentryBreadcrumb({
          category: 'auth',
          message: 'User logged in successfully',
          level: 'info',
          data: { surveyorId: response.surveyor!.id },
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Prompt biometric setup on first login
        if (isFirstLogin && state.biometricSupported && !state.biometricEnabled) {
          setTimeout(() => promptBiometricSetup(), 1000);
        }

        return true;
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
        return false;
      }
    } catch (error) {
      logger.error('Login error:', error);
      Alert.alert('Error', 'Could not connect to server');
      return false;
    }
  }, [state.expoPushToken, state.hasPreviousLogin, state.biometricSupported, state.biometricEnabled, promptBiometricSetup]);

  const register = useCallback(async (data: { name: string; email: string; phone: string; password: string }): Promise<boolean> => {
    try {
      const response = await apiService.register({
        ...data,
        pushToken: state.expoPushToken || undefined,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      if (response.success && response.surveyor) {
        await storageService.setSurveyorId(response.surveyor.id);
        await storageService.setSurveyorName(response.surveyor.displayName);
        await storageService.setSurveyorEmail(data.email);
        await storageService.setSurveyorPhone(data.phone);
        if (response.surveyor.code) {
          await storageService.setSurveyorCode(response.surveyor.code);
        }
        await storageService.setDeviceRegistered(true);

        setState(prev => ({
          ...prev,
          surveyorId: response.surveyor!.id,
          surveyorName: response.surveyor!.displayName,
          surveyorEmail: data.email,
          surveyorPhone: data.phone,
          surveyorCode: response.surveyor!.code || null,
          isRegistered: true,
        }));

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your account has been created successfully!');
        return true;
      } else {
        Alert.alert('Registration Failed', response.message || 'Could not create account');
        return false;
      }
    } catch (error) {
      logger.error('Registration error:', error);
      Alert.alert('Error', 'Could not connect to server');
      return false;
    }
  }, [state.expoPushToken]);

  const handleBiometricLogin = useCallback(async (): Promise<boolean> => {
    const savedSurveyorId = await storageService.getSurveyorId();
    if (!savedSurveyorId) {
      Alert.alert('Not Available', 'Please login with email and password first to enable biometric login.');
      return false;
    }

    const success = await authenticateWithBiometrics();
    if (success) {
      const savedSurveyorName = await storageService.getSurveyorName();
      const savedSurveyorEmail = await storageService.getSurveyorEmail();
      const savedSurveyorPhone = await storageService.getSurveyorPhone();
      const savedSurveyorCode = await storageService.getSurveyorCode();

      setState(prev => ({
        ...prev,
        surveyorId: savedSurveyorId,
        surveyorName: savedSurveyorName,
        surveyorEmail: savedSurveyorEmail,
        surveyorPhone: savedSurveyorPhone,
        surveyorCode: savedSurveyorCode,
        isRegistered: true,
      }));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    }
    return false;
  }, [authenticateWithBiometrics]);

  const toggleBiometricLogin = useCallback(async () => {
    if (!state.biometricSupported) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }

    if (!state.biometricEnabled) {
      const success = await authenticateWithBiometrics();
      if (success) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
        setState(prev => ({ ...prev, biometricEnabled: true }));
        Alert.alert('Enabled', 'Biometric login has been enabled.');
      }
    } else {
      await AsyncStorage.setItem('biometric_enabled', 'false');
      setState(prev => ({ ...prev, biometricEnabled: false }));
      Alert.alert('Disabled', 'Biometric login has been disabled.');
    }
  }, [state.biometricSupported, state.biometricEnabled, authenticateWithBiometrics]);

  const logout = useCallback(async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // Add breadcrumb before logout
          addSentryBreadcrumb({
            category: 'auth',
            message: 'User logged out',
            level: 'info',
          });

          // Notify backend of logout (for activity tracking)
          if (state.surveyorId) {
            try {
              const pushToken = await storageService.getPushToken();
              await apiService.logout(state.surveyorId, pushToken || undefined);
              logger.info('[Logout] Backend notified successfully');
            } catch (error) {
              // Don't block logout if backend call fails
              logger.warn('[Logout] Failed to notify backend:', error);
            }
          }

          locationService.stopTracking();
          chatService.disconnect();
          await storageService.setDeviceRegistered(false);

          // Clear Sentry user context
          clearSentryUser();

          setState(prev => ({
            ...prev,
            isRegistered: false,
            surveyorId: null,
            surveyorName: null,
            surveyorEmail: null,
            surveyorPhone: null,
            surveyorCode: null,
            biometricAuthenticated: false,
          }));
        },
      },
    ]);
  }, [state.surveyorId]);

  const updateStatus = useCallback(async (newStatus: SurveyorStatus) => {
    if (!state.surveyorId) return;

    setState(prev => ({ ...prev, currentStatus: newStatus }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const location = await locationService.getCurrentLocation();
      await apiService.updateStatus(state.surveyorId, newStatus);
      if (location) {
        await apiService.updateLocation(state.surveyorId, location.lat, location.lng);
      }
    } catch (error) {
      logger.error('Error updating status:', error);
    }
  }, [state.surveyorId]);

  return {
    ...state,
    setAuthScreen,
    login,
    register,
    logout,
    authenticateWithBiometrics,
    handleBiometricLogin,
    toggleBiometricLogin,
    updateStatus,
    setExpoPushToken,
  };
}
