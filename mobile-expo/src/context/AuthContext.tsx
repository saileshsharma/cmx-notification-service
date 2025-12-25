import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { notificationService } from '../services/notifications';
import { SurveyorStatus } from '../types';

interface AuthState {
  isLoading: boolean;
  isLoggedIn: boolean;
  surveyorId: number | null;
  surveyorName: string | null;
  currentStatus: SurveyorStatus;
  expoPushToken: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateStatus: (status: SurveyorStatus) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isLoggedIn: false,
    surveyorId: null,
    surveyorName: null,
    currentStatus: 'AVAILABLE',
    expoPushToken: '',
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Load saved state
      const savedSurveyorId = await storageService.getSurveyorId();
      const savedSurveyorName = await storageService.getSurveyorName();
      const savedIsRegistered = await storageService.isDeviceRegistered();

      // Get push token
      const granted = await notificationService.requestPermissions();
      let token = '';
      if (granted) {
        token = (await notificationService.getExpoPushToken()) || '';
        await notificationService.setupAndroidChannel();
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoggedIn: savedIsRegistered,
        surveyorId: savedSurveyorId,
        surveyorName: savedSurveyorName,
        expoPushToken: token,
      }));
    } catch (error) {
      console.error('Error initializing auth:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        pushToken: state.expoPushToken || undefined,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      if (response.success && response.surveyor) {
        await storageService.setSurveyorId(response.surveyor.id);
        await storageService.setSurveyorName(response.surveyor.displayName);
        await storageService.setDeviceRegistered(true);
        if (state.expoPushToken) {
          await storageService.setPushToken(state.expoPushToken);
        }

        setState(prev => ({
          ...prev,
          isLoggedIn: true,
          surveyorId: response.surveyor!.id,
          surveyorName: response.surveyor!.displayName,
          currentStatus: (response.surveyor!.currentStatus as SurveyorStatus) || 'AVAILABLE',
        }));

        return { success: true };
      }

      return { success: false, message: response.message || 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: 'Could not connect to server' };
    }
  };

  const logout = async () => {
    await storageService.setDeviceRegistered(false);
    setState(prev => ({
      ...prev,
      isLoggedIn: false,
      surveyorId: null,
      surveyorName: null,
    }));
  };

  const updateStatus = (status: SurveyorStatus) => {
    setState(prev => ({ ...prev, currentStatus: status }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
