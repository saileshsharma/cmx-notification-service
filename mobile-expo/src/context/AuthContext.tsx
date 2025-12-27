/**
 * AuthContext - Authentication state management
 * Handles user authentication, session, and biometrics
 * Refactored to use useAuth hook for cleaner architecture
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, UseAuthReturn } from '../hooks/useAuth';

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Re-export types for convenience
export type { AuthScreen, AuthState } from '../hooks/useAuth';
