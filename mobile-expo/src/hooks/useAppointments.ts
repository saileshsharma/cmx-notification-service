/**
 * useAppointments Hook - Appointment management logic
 * Handles loading, refreshing, responding to appointments
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { apiService } from '../services/api';
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

  // Load appointments when surveyor ID changes
  useEffect(() => {
    if (surveyorId) {
      loadAppointments();
    }
  }, [surveyorId]);

  const loadAppointments = useCallback(async () => {
    if (!surveyorId) return;

    try {
      logger.debug('Loading appointments for surveyor:', surveyorId);
      const data = await apiService.getAppointments(surveyorId, true);
      setAppointments(data);
      logger.info('Loaded appointments:', data.length);
    } catch (error) {
      logger.error('Error loading appointments:', error);
    }
  }, [surveyorId]);

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
      Alert.alert('Error', 'Could not respond to appointment');
      return false;
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
