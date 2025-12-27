/**
 * NetworkContext - Network status state management
 * Handles online/offline detection
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useNetwork, UseNetworkReturn } from '../hooks/useNetwork';

const NetworkContext = createContext<UseNetworkReturn | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const network = useNetwork();

  return (
    <NetworkContext.Provider value={network}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkContext = (): UseNetworkReturn => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }
  return context;
};

// Re-export types
export type { NetworkState } from '../hooks/useNetwork';
