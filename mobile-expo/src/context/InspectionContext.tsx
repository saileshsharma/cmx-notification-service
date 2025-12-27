/**
 * InspectionContext - Inspection workflow state management
 * Handles inspection steps, photos, notes, and submission
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useInspection, UseInspectionReturn } from '../hooks/useInspection';

const InspectionContext = createContext<UseInspectionReturn | undefined>(undefined);

export const InspectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const inspection = useInspection();

  return (
    <InspectionContext.Provider value={inspection}>
      {children}
    </InspectionContext.Provider>
  );
};

export const useInspectionContext = (): UseInspectionReturn => {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspectionContext must be used within an InspectionProvider');
  }
  return context;
};

// Re-export types
export type { JobState, InspectionStep, CompletedJob } from '../hooks/useInspection';
