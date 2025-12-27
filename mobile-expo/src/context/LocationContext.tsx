/**
 * LocationContext - Location and navigation state management
 * Handles GPS tracking, navigation, and quick status
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation, UseLocationReturn } from '../hooks/useLocation';
import { useAuthContext } from './AuthContext';
import { useInspectionContext } from './InspectionContext';

const LocationContext = createContext<UseLocationReturn | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { surveyorId } = useAuthContext();
  const { setJobState, setActiveJob } = useInspectionContext();

  const location = useLocation(
    surveyorId,
    setJobState,
    setActiveJob
  );

  return (
    <LocationContext.Provider value={location}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = (): UseLocationReturn => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

// Re-export types
export type { QuickStatus, Location } from '../hooks/useLocation';
