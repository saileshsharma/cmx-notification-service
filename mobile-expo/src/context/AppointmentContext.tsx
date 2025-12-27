/**
 * AppointmentContext - Appointment state management
 * Handles appointment loading, refreshing, and responses
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useAppointments, UseAppointmentsReturn } from '../hooks/useAppointments';
import { useAuthContext } from './AuthContext';

const AppointmentContext = createContext<UseAppointmentsReturn | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { surveyorId } = useAuthContext();
  const appointments = useAppointments(surveyorId);

  return (
    <AppointmentContext.Provider value={appointments}>
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointmentContext = (): UseAppointmentsReturn => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointmentContext must be used within an AppointmentProvider');
  }
  return context;
};

// Re-export types
export type { TodayStats } from '../hooks/useAppointments';
