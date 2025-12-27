/**
 * AuthContainer - Authentication flow container
 * Handles welcome, login, and register screens
 */
import React, { useCallback } from 'react';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { useAuthContext } from '../context/AuthContext';

export const AuthContainer: React.FC = () => {
  const {
    authScreen,
    setAuthScreen,
    login,
    register,
    handleBiometricLogin,
    biometricEnabled,
    hasPreviousLogin,
    isLoading,
  } = useAuthContext();

  // Wrap login to match expected type (Promise<void>)
  const handleLogin = useCallback(async (email: string, password: string): Promise<void> => {
    await login(email, password);
  }, [login]);

  // Wrap register to match expected type (Promise<void>)
  const handleRegister = useCallback(async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<void> => {
    await register(data);
  }, [register]);

  // Welcome Screen
  if (authScreen === 'welcome') {
    return (
      <WelcomeScreen
        onLogin={() => setAuthScreen('login')}
        onRegister={() => setAuthScreen('register')}
      />
    );
  }

  // Login Screen
  if (authScreen === 'login') {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onBack={() => setAuthScreen('welcome')}
        onRegister={() => setAuthScreen('register')}
        onBiometricLogin={handleBiometricLogin}
        biometricEnabled={biometricEnabled}
        hasPreviousLogin={hasPreviousLogin}
        isLoading={isLoading}
      />
    );
  }

  // Register Screen
  if (authScreen === 'register') {
    return (
      <RegisterScreen
        onRegister={handleRegister}
        onBack={() => setAuthScreen('welcome')}
        onLogin={() => setAuthScreen('login')}
        isLoading={isLoading}
      />
    );
  }

  // Fallback
  return (
    <WelcomeScreen
      onLogin={() => setAuthScreen('login')}
      onRegister={() => setAuthScreen('register')}
    />
  );
};
