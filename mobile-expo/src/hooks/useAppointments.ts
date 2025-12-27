/**
 * useAppointments Hook - Appointment management logic
 * Handles loading, refreshing, responding to appointments
 * Now with offline caching support
 */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { apiService } from '../services/api';
import { offlineStorage, OfflineAppointment } from '../services/offlineStorage';
import { Appointment, AppointmentResponseStatus } from '../types';
import { logger } from '../utils/logger';

export interface TodayStats {
  completed: number;
  pending: number;
  totalDistance: number;
  avgTime: number;
}

export interface UseAppointmentsReturn {
  // State
  appointments: Appointment[];
  isRefreshing: boolean;
  todayStats: TodayStats;
  isOffline: boolean;
  lastSyncTime: number | null;

  // Actions
  loadAppointments: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  respondToAppointment: (appointmentId: number, response: AppointmentResponseStatus) => Promise<boolean>;

  // Helpers
  getNextAppointment: () => Appointment | undefined;
  getTodayAppointments: () => Appointment[];
  getUpcomingAppointments: () => Appointment[];
  formatDate: (isoString: string) => string;
  formatTime: (isoString: string) => string;
  getTimeUntil: (isoString: string) => string;
}

export function useAppointments(surveyorId: number | null): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const networkUnsubscribe = useRef<(() => void) | null>(null);

  // Subscribe to network changes
  useEffect(() => {
    networkUnsubscribe.current = offlineStorage.onNetworkChange((online) => {
      setIsOffline(!online);
      if (online && surveyorId) {
        logger.info('[Appointments] Back online, refreshing...');
        loadAppointments();
      }
    });
    setIsOffline(!offlineStorage.getIsOnline());

    return () => {
      networkUnsubscribe.current?.();
    };
  }, [surveyorId]);

  // Load cached appointments on mount, then fetch fresh data
  useEffect(() => {
    if (surveyorId) {
      loadCachedAppointments().then(() => {
        loadAppointments();
      });
    }
  }, [surveyorId]);

  // Load cached appointments from offline storage
  const loadCachedAppointments = useCallback(async () => {
    try {
      const cached = await offlineStorage.getCachedAppointments();
      const syncTime = await offlineStorage.getLastSyncTime();
      setLastSyncTime(syncTime);

      if (cached.length > 0) {
        // Convert OfflineAppointment to Appointment format
        const appointments: Appointment[] = cached.map(c => ({
          id: c.id,
          title: c.title,
          description: c.description || '',
          start_time: c.startTime,
          end_time: c.endTime,
          state: c.state,
          surveyor_id: c.surveyorId,
          source: 'cached',
          updated_at: new Date(c.cachedAt).toISOString(),
          response_status: 'PENDING' as const,
          responded_at: null,
        }));
        setAppointments(appointments);
        logger.debug('[Appointments] Loaded from cache:', cached.length);
      }
    } catch (error) {
      logger.error('[Appointments] Error loading cached:', error);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!surveyorId) return;

    // If offline, use cached data
    if (!offlineStorage.getIsOnline()) {
      logger.debug('[Appointments] Offline, using cached data');
      await loadCachedAppointments();
      return;
    }

    try {
      logger.debug('Loading appointments for surveyor:', surveyorId);
      const data = await apiService.getAppointments(surveyorId, true);
      setAppointments(data);
      logger.info('Loaded appointments:', data.length);

      // Cache appointments for offline use
      const toCache: OfflineAppointment[] = data.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        startTime: a.start_time,
        endTime: a.end_time,
        state: a.state,
        surveyorId: a.surveyor_id,
        cachedAt: Date.now(),
      }));
      await offlineStorage.cacheAppointments(toCache);
      setLastSyncTime(Date.now());
      logger.debug('[Appointments] Cached for offline use');
    } catch (error) {
      logger.error('Error loading appointments:', error);
      // Fall back to cached data on error
      await loadCachedAppointments();
    }
  }, [surveyorId, loadCachedAppointments]);

  const refreshAppointments = useCallback(async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  }, [loadAppointments]);

  const respondToAppointment = useCallback(async (
    appointmentId: number,
    response: AppointmentResponseStatus
  ): Promise<boolean> => {
    if (!surveyorId) return false;

    // If offline, queue the action for later
    if (!offlineStorage.getIsOnline()) {
      await offlineStorage.queueAction({
        type: 'APPOINTMENT_RESPONSE',
        payload: { appointmentId, surveyorId, response },
      });

      // Optimistic update - update local state immediately
      setAppointments(prev => prev.map(a =>
        a.id === appointmentId ? { ...a, response_status: response } : a
      ));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved Offline', 'Your response will be sent when you\'re back online.');
      return true;
    }

    try {
      const result = await apiService.respondToAppointment(appointmentId, surveyorId, response);
      if (result.success) {
        await loadAppointments();
        Haptics.notificationAsync(
          response === 'ACCEPTED'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error responding to appointment:', error);
      // Queue for retry
      await offlineStorage.queueAction({
        type: 'APPOINTMENT_RESPONSE',
        payload: { appointmentId, surveyorId, response },
      });
      Alert.alert('Network Error', 'Your response will be sent when connection is restored.');
      return true; // Return true since we queued it
    }
  }, [surveyorId, loadAppointments]);

  // Calculate today's stats
  const todayStats = useMemo((): TodayStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = appointments.filter(a => {
      const apptDate = new Date(a.start_time);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === today.getTime();
    });

    const completed = todayAppointments.filter(a => a.response_status === 'ACCEPTED').length;
    const pending = todayAppointments.filter(a => a.response_status === 'PENDING').length;

    return {
      completed,
      pending,
      totalDistance: completed > 0 ? completed * 15 : 0, // Estimate 15km per inspection
      avgTime: completed > 0 ? 35 : 0, // Average 35 min per inspection
    };
  }, [appointments]);

  // Helper functions
  const getNextAppointment = useCallback((): Appointment | undefined => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.start_time) > now && a.response_status !== 'REJECTED')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
  }, [appointments]);

  const getTodayAppointments = useCallback((): Appointment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter(a => {
      const apptDate = new Date(a.start_time);
      return apptDate >= today && apptDate < tomorrow;
    });
  }, [appointments]);

  const getUpcomingAppointments = useCallback((): Appointment[] => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointments]);

  const formatDate = useCallback((isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, []);

  const formatTime = useCallback((isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }, []);

  const getTimeUntil = useCallback((isoString: string): string => {
    const diff = new Date(isoString).getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  }, []);

  return {
    appointments,
    isRefreshing,
    todayStats,
    isOffline,
    lastSyncTime,
    loadAppointments,
    refreshAppointments,
    respondToAppointment,
    getNextAppointment,
    getTodayAppointments,
    getUpcomingAppointments,
    formatDate,
    formatTime,
    getTimeUntil,
  };
}
