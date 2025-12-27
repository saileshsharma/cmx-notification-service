/**
 * useLocation Hook - Location tracking logic
 * Handles GPS tracking, navigation, and location updates
 * Enhanced with proper cleanup to prevent memory leaks
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform, Linking, Alert, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { locationService, LocationUpdate, TrackingMode } from '../services/location';
import { apiService } from '../services/api';
import { Appointment } from '../types';
import { logger } from '../utils/logger';

export type QuickStatus = 'on_way' | 'arrived' | 'inspecting' | 'completed';

export interface Location {
  lat: number;
  lng: number;
}

export interface UseLocationReturn {
  // State
  isLocationTracking: boolean;
  currentLocation: Location | null;
  destinationLocation: Location | null;
  quickStatus: QuickStatus | null;
  showMapModal: boolean;
  trackingMode: TrackingMode;
  locationStats: {
    updatesReceived: number;
    updatesSent: number;
    updatesFailed: number;
    lastError: string | null;
  };

  // Actions
  startLocationTracking: (mode?: TrackingMode) => Promise<boolean>;
  stopLocationTracking: () => void;
  getCurrentLocation: () => Promise<Location | null>;
  setDestinationLocation: (location: Location | null) => void;
  setShowMapModal: (show: boolean) => void;
  setTrackingMode: (mode: TrackingMode) => Promise<void>;

  // Navigation
  navigateToLocation: (appointment: Appointment) => Promise<void>;
  openExternalNavigation: () => void;
  handleArrivedAtLocation: () => void;

  // Quick status
  setQuickStatus: (status: QuickStatus | null) => void;
  handleQuickStatus: (status: QuickStatus, onStatusMessage?: (msg: string) => void) => Promise<void>;

  // SOS
  handleSOS: (onSOSMessage?: (msg: string) => void) => void;

  // Distance utilities
  getDistanceToDestination: () => number | null;
  getEstimatedTimeToDestination: () => number | null;
}

const STATUS_MESSAGES: { [key in QuickStatus]: string } = {
  on_way: "I'm on my way to the inspection site",
  arrived: "I've arrived at the inspection site",
  inspecting: 'Starting vehicle inspection now',
  completed: 'Inspection completed successfully',
};

export function useLocation(
  surveyorId: number | null,
  onJobStateChange?: (state: 'idle' | 'navigating' | 'arrived' | 'inspecting') => void,
  onActiveJobSet?: (job: Appointment | null) => void
): UseLocationReturn {
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [quickStatus, setQuickStatus] = useState<QuickStatus | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [activeJob, setActiveJob] = useState<Appointment | null>(null);
  const [trackingMode, setTrackingModeState] = useState<TrackingMode>('balanced');
  const [locationStats, setLocationStats] = useState({
    updatesReceived: 0,
    updatesSent: 0,
    updatesFailed: 0,
    lastError: null as string | null,
  });

  // Refs for cleanup
  const unsubscribersRef = useRef<(() => void)[]>([]);
  const isInitializedRef = useRef(false);

  // Cleanup function
  const cleanupSubscriptions = useCallback(() => {
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribersRef.current = [];
  }, []);

  const startLocationTracking = useCallback(async (mode: TrackingMode = 'balanced'): Promise<boolean> => {
    if (!surveyorId) return false;

    logger.info('[useLocation] Starting location tracking', { surveyorId, mode });

    // Clean up existing subscriptions
    cleanupSubscriptions();

    // Subscribe to location updates
    const unsubLocation = locationService.subscribeToLocation((location: LocationUpdate) => {
      setCurrentLocation({ lat: location.lat, lng: location.lng });
      setLocationStats(locationService.getStats());
    });
    unsubscribersRef.current.push(unsubLocation);

    // Subscribe to mode changes
    const unsubMode = locationService.subscribeToModeChanges((newMode: TrackingMode) => {
      setTrackingModeState(newMode);
      logger.debug('[useLocation] Tracking mode changed to:', newMode);
    });
    unsubscribersRef.current.push(unsubMode);

    const success = await locationService.startTracking(surveyorId, mode);
    setIsLocationTracking(success);
    setTrackingModeState(mode);
    isInitializedRef.current = success;

    return success;
  }, [surveyorId, cleanupSubscriptions]);

  const stopLocationTracking = useCallback(() => {
    logger.info('[useLocation] Stopping location tracking');
    cleanupSubscriptions();
    locationService.stopTracking();
    setIsLocationTracking(false);
    isInitializedRef.current = false;
  }, [cleanupSubscriptions]);

  const setTrackingMode = useCallback(async (mode: TrackingMode) => {
    await locationService.setTrackingMode(mode);
    setTrackingModeState(mode);
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Location | null> => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLocation({ lat: location.lat, lng: location.lng });
    }
    return location ? { lat: location.lat, lng: location.lng } : null;
  }, []);

  const navigateToLocation = useCallback(async (appointment: Appointment) => {
    const location = await getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }

    // Use appointment location if available, otherwise use default
    const destLat = (appointment as any).latitude || 12.9716;
    const destLng = (appointment as any).longitude || 77.5946;
    setDestinationLocation({ lat: destLat, lng: destLng });

    setActiveJob(appointment);
    onActiveJobSet?.(appointment);
    onJobStateChange?.('navigating');
    setShowMapModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Switch to high accuracy mode when navigating
    await setTrackingMode('high');
  }, [getCurrentLocation, onActiveJobSet, onJobStateChange, setTrackingMode]);

  const openExternalNavigation = useCallback(() => {
    if (!destinationLocation) return;

    const url = Platform.select({
      ios: `maps://app?daddr=${destinationLocation.lat},${destinationLocation.lng}`,
      android: `google.navigation:q=${destinationLocation.lat},${destinationLocation.lng}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destinationLocation.lat},${destinationLocation.lng}`);
      });
    }
  }, [destinationLocation]);

  const handleArrivedAtLocation = useCallback(() => {
    setShowMapModal(false);
    onJobStateChange?.('arrived');
    setQuickStatus('arrived');

    // Switch to low power mode when arrived
    setTrackingMode('low');

    Alert.alert(
      'You have arrived!',
      'Start your vehicle inspection when ready.',
      [{ text: 'Start Inspection', onPress: () => onJobStateChange?.('inspecting') }]
    );
  }, [onJobStateChange, setTrackingMode]);

  const handleQuickStatus = useCallback(async (
    status: QuickStatus,
    onStatusMessage?: (msg: string) => void
  ) => {
    if (!surveyorId) return;

    setQuickStatus(status);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Notify via callback
    onStatusMessage?.(STATUS_MESSAGES[status]);

    // Map to API status
    const statusMap: { [key in QuickStatus]: 'ON_WAY' | 'ARRIVED' | 'INSPECTING' | 'COMPLETED' } = {
      on_way: 'ON_WAY',
      arrived: 'ARRIVED',
      inspecting: 'INSPECTING',
      completed: 'COMPLETED',
    };

    try {
      const location = await locationService.getCurrentLocation();
      const appointmentId = activeJob?.id;

      await apiService.updateJobStatus(
        surveyorId,
        statusMap[status],
        appointmentId,
        location?.lat,
        location?.lng,
        undefined
      );

      // Adjust tracking mode based on status
      if (status === 'on_way') {
        await setTrackingMode('high');
      } else if (status === 'arrived' || status === 'inspecting') {
        await setTrackingMode('low');
      } else if (status === 'completed') {
        await setTrackingMode('balanced');
      }
    } catch (error) {
      logger.error('[useLocation] Error updating job status:', error);
    }
  }, [surveyorId, activeJob, setTrackingMode]);

  const handleSOS = useCallback((onSOSMessage?: (msg: string) => void) => {
    Vibration.vibrate([0, 500, 200, 500]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Alert.alert(
      'Emergency SOS',
      'This will alert the dispatch center of your emergency. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            onSOSMessage?.('EMERGENCY SOS - Need immediate assistance!');
            Alert.alert('SOS Sent', 'Dispatch has been notified. Stay calm, help is on the way.');
          }
        },
      ]
    );
  }, []);

  const getDistanceToDestination = useCallback((): number | null => {
    if (!destinationLocation) return null;
    return locationService.getDistanceTo(destinationLocation.lat, destinationLocation.lng);
  }, [destinationLocation]);

  const getEstimatedTimeToDestination = useCallback((): number | null => {
    if (!destinationLocation) return null;
    return locationService.getEstimatedTimeToLocation(destinationLocation.lat, destinationLocation.lng);
  }, [destinationLocation]);

  // Start tracking when surveyor ID becomes available
  useEffect(() => {
    if (surveyorId && !isInitializedRef.current) {
      startLocationTracking();
    }
    return () => {
      cleanupSubscriptions();
      if (isInitializedRef.current) {
        locationService.stopTracking();
        isInitializedRef.current = false;
      }
    };
  }, [surveyorId]);

  return {
    isLocationTracking,
    currentLocation,
    destinationLocation,
    quickStatus,
    showMapModal,
    trackingMode,
    locationStats,
    startLocationTracking,
    stopLocationTracking,
    getCurrentLocation,
    setDestinationLocation,
    setShowMapModal,
    setTrackingMode,
    navigateToLocation,
    openExternalNavigation,
    handleArrivedAtLocation,
    setQuickStatus,
    handleQuickStatus,
    handleSOS,
    getDistanceToDestination,
    getEstimatedTimeToDestination,
  };
}
