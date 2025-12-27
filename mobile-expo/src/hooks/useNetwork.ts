/**
 * useNetwork Hook - Network status monitoring
 * Handles online/offline detection and network state
 */
import { useState, useCallback, useEffect } from 'react';
import * as Network from 'expo-network';
import { logger } from '../utils/logger';

const NETWORK_CHECK_INTERVAL = 30000; // 30 seconds

export interface NetworkState {
  isOnline: boolean;
  isConnected: boolean;
  type: Network.NetworkStateType | null;
  isInternetReachable: boolean | null;
}

export interface UseNetworkReturn extends NetworkState {
  checkNetwork: () => Promise<void>;
  refreshNetworkStatus: () => Promise<void>;
}

export function useNetwork(): UseNetworkReturn {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    isConnected: true,
    type: null,
    isInternetReachable: null,
  });

  const checkNetwork = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();

      setState({
        isOnline: networkState.isConnected ?? false,
        isConnected: networkState.isConnected ?? false,
        type: networkState.type ?? null,
        isInternetReachable: networkState.isInternetReachable ?? null,
      });

      logger.debug('Network status:', {
        connected: networkState.isConnected,
        type: networkState.type,
        reachable: networkState.isInternetReachable,
      });
    } catch (error) {
      logger.error('Error checking network status:', error);
      setState(prev => ({ ...prev, isOnline: false, isConnected: false }));
    }
  }, []);

  const refreshNetworkStatus = useCallback(async () => {
    await checkNetwork();
  }, [checkNetwork]);

  // Check network on mount and periodically
  useEffect(() => {
    checkNetwork();
    const interval = setInterval(checkNetwork, NETWORK_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkNetwork]);

  return {
    ...state,
    checkNetwork,
    refreshNetworkStatus,
  };
}
