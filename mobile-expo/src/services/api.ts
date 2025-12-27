/**
 * API Service - High-level API wrapper
 * Uses apiClient for all requests with retry, circuit breaker, and deduplication
 */
import { apiClient, ApiResponse } from './apiClient';
import { API_TIMEOUTS } from '../config/api';
import { logger } from '../utils/logger';
import {
  Surveyor,
  DeviceRegistrationRequest,
  DeviceRegistrationResponse,
  Appointment,
  AppointmentResponse,
  AppointmentResponseStatus,
  SurveyorStatus,
  UpdateResponse,
  LoginRequest,
  LoginResponse
} from '../types';

class ApiService {
  // ==================== Authentication ====================

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/mobile/login', request, {
      timeout: API_TIMEOUTS.login,
      skipRetry: true, // Don't retry login to avoid duplicate sessions
    });

    if (!response.ok) {
      logger.warn('[API] Login failed', { error: response.error });
      return {
        success: false,
        message: response.error || 'Login failed',
      };
    }

    return response.data || { success: false, message: 'No response data' };
  }

  async register(request: {
    name: string;
    email: string;
    phone: string;
    password: string;
    pushToken?: string;
    platform?: 'IOS' | 'ANDROID';
  }): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/mobile/register', request, {
      timeout: API_TIMEOUTS.login,
      skipRetry: true, // Don't retry registration
    });

    if (!response.ok) {
      logger.warn('[API] Registration failed', { error: response.error });
      return {
        success: false,
        message: response.error || 'Registration failed',
      };
    }

    return response.data || { success: false, message: 'No response data' };
  }

  async getSurveyors(): Promise<Surveyor[]> {
    const response = await apiClient.get<Surveyor[]>('/surveyors');

    if (!response.ok) {
      logger.error('[API] Failed to load surveyors', { error: response.error });
      throw new Error(response.error || 'Failed to load surveyors');
    }

    return response.data || [];
  }

  async registerDevice(request: DeviceRegistrationRequest): Promise<DeviceRegistrationResponse> {
    const response = await apiClient.post<DeviceRegistrationResponse>('/mobile/device-token', request, {
      idempotencyKey: `device-${request.surveyorId}-${request.token}`,
    });

    if (!response.ok) {
      logger.error('[API] Device registration failed', { error: response.error });
      throw new Error(response.error || 'Registration failed');
    }

    return response.data!;
  }

  // ==================== Appointment APIs ====================

  async getAppointments(surveyorId: number, upcomingOnly: boolean = true): Promise<Appointment[]> {
    const response = await apiClient.get<Appointment[]>(
      `/mobile/appointments/${surveyorId}?upcoming=${upcomingOnly}`
    );

    if (!response.ok) {
      logger.error('[API] Failed to load appointments', { error: response.error });
      throw new Error(response.error || 'Failed to load appointments');
    }

    return response.data || [];
  }

  async respondToAppointment(
    appointmentId: number,
    surveyorId: number,
    response: AppointmentResponseStatus
  ): Promise<AppointmentResponse> {
    const apiResponse = await apiClient.post<AppointmentResponse>(
      `/mobile/appointments/${appointmentId}/respond`,
      { surveyorId, response },
      {
        idempotencyKey: `appt-respond-${appointmentId}-${response}-${Date.now()}`,
      }
    );

    if (!apiResponse.ok) {
      logger.error('[API] Failed to respond to appointment', { error: apiResponse.error });
      throw new Error(apiResponse.error || 'Failed to respond');
    }

    return apiResponse.data!;
  }

  // ==================== Location & Status APIs ====================

  async updateLocation(surveyorId: number, lat: number, lng: number): Promise<UpdateResponse> {
    const response = await apiClient.post<UpdateResponse>(
      '/mobile/location',
      { surveyorId, lat, lng },
      {
        timeout: API_TIMEOUTS.location,
        skipRetry: true, // Location updates are time-sensitive, don't retry stale data
      }
    );

    if (!response.ok) {
      logger.warn('[API] Failed to update location', { error: response.error });
      return { success: false, message: response.error || 'Failed to update location' };
    }

    return response.data || { success: true };
  }

  async updateStatus(surveyorId: number, status: SurveyorStatus): Promise<UpdateResponse> {
    const response = await apiClient.post<UpdateResponse>(
      '/mobile/status',
      { surveyorId, status },
      {
        idempotencyKey: `status-${surveyorId}-${status}-${Math.floor(Date.now() / 10000)}`, // 10 second window
      }
    );

    if (!response.ok) {
      logger.warn('[API] Failed to update status', { error: response.error });
      return { success: false, message: response.error || 'Failed to update status' };
    }

    return response.data || { success: true };
  }

  async updateLocationAndStatus(
    surveyorId: number,
    lat: number,
    lng: number,
    status: SurveyorStatus
  ): Promise<UpdateResponse> {
    const response = await apiClient.post<UpdateResponse>(
      '/mobile/location-status',
      { surveyorId, lat, lng, status },
      {
        timeout: API_TIMEOUTS.location,
      }
    );

    if (!response.ok) {
      logger.warn('[API] Failed to update location and status', { error: response.error });
      return { success: false, message: response.error || 'Failed to update' };
    }

    return response.data || { success: true };
  }

  async getSurveyorDetails(surveyorId: number): Promise<Surveyor> {
    const response = await apiClient.get<Surveyor>(`/mobile/surveyor/${surveyorId}`);

    if (!response.ok) {
      logger.error('[API] Failed to load surveyor details', { error: response.error });
      throw new Error(response.error || 'Failed to load surveyor details');
    }

    return response.data!;
  }

  // ==================== Job Update API ====================

  async updateJobStatus(
    surveyorId: number,
    status: 'ON_WAY' | 'ARRIVED' | 'INSPECTING' | 'COMPLETED',
    appointmentId?: number,
    lat?: number,
    lng?: number,
    notes?: string
  ): Promise<UpdateResponse> {
    const response = await apiClient.post<UpdateResponse>(
      '/mobile/job-update',
      { surveyorId, status, appointmentId, lat, lng, notes },
      {
        idempotencyKey: `job-${appointmentId || 'none'}-${status}-${Date.now()}`,
      }
    );

    if (!response.ok) {
      logger.error('[API] Failed to update job status', { error: response.error });
      throw new Error(response.error || 'Failed to update job status');
    }

    return response.data || { success: true };
  }

  // ==================== Profile APIs ====================

  async changePassword(
    surveyorId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<UpdateResponse> {
    const response = await apiClient.post<UpdateResponse>(
      '/mobile/change-password',
      { surveyorId, currentPassword, newPassword },
      {
        skipRetry: true, // Don't retry password changes
      }
    );

    if (!response.ok) {
      return { success: false, message: response.error || 'Failed to change password' };
    }

    return response.data || { success: true };
  }

  // ==================== Utility Methods ====================

  /**
   * Check if the API is available (circuit breaker status)
   */
  isAvailable(endpoint: string = '/mobile'): boolean {
    return apiClient.getCircuitState(endpoint) !== 'open';
  }

  /**
   * Reset circuit breaker (e.g., after network reconnection)
   */
  resetCircuitBreaker(): void {
    apiClient.resetCircuitBreaker();
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string | null): void {
    apiClient.setAuthToken(token);
  }
}

export const apiService = new ApiService();
