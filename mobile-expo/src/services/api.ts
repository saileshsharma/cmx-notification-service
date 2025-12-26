import { API_BASE_URL } from '../config/api';
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
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // ==================== Authentication ====================

  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/mobile/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  }

  async register(request: {
    name: string;
    email: string;
    phone: string;
    password: string;
    pushToken?: string;
    platform?: 'IOS' | 'ANDROID';
  }): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/mobile/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data;
  }

  async getSurveyors(): Promise<Surveyor[]> {
    const response = await fetch(`${this.baseUrl}/surveyors`);
    if (!response.ok) {
      throw new Error(`Failed to load surveyors: ${response.status}`);
    }
    return response.json();
  }

  async registerDevice(request: DeviceRegistrationRequest): Promise<DeviceRegistrationResponse> {
    const response = await fetch(`${this.baseUrl}/mobile/device-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Registration failed: ${errorText}`);
    }

    return response.json();
  }

  // ==================== Appointment APIs ====================

  async getAppointments(surveyorId: number, upcomingOnly: boolean = true): Promise<Appointment[]> {
    const response = await fetch(
      `${this.baseUrl}/mobile/appointments/${surveyorId}?upcoming=${upcomingOnly}`
    );
    if (!response.ok) {
      throw new Error(`Failed to load appointments: ${response.status}`);
    }
    return response.json();
  }

  async respondToAppointment(
    appointmentId: number,
    surveyorId: number,
    response: AppointmentResponseStatus
  ): Promise<AppointmentResponse> {
    const res = await fetch(`${this.baseUrl}/mobile/appointments/${appointmentId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ surveyorId, response }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to respond: ${errorText}`);
    }

    return res.json();
  }

  // ==================== Location & Status APIs ====================

  async updateLocation(surveyorId: number, lat: number, lng: number): Promise<UpdateResponse> {
    const response = await fetch(`${this.baseUrl}/mobile/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ surveyorId, lat, lng }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update location: ${response.status}`);
    }

    return response.json();
  }

  async updateStatus(surveyorId: number, status: SurveyorStatus): Promise<UpdateResponse> {
    const response = await fetch(`${this.baseUrl}/mobile/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ surveyorId, status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update status: ${response.status}`);
    }

    return response.json();
  }

  async updateLocationAndStatus(
    surveyorId: number,
    lat: number,
    lng: number,
    status: SurveyorStatus
  ): Promise<UpdateResponse> {
    const response = await fetch(`${this.baseUrl}/mobile/location-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ surveyorId, lat, lng, status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update location and status: ${response.status}`);
    }

    return response.json();
  }

  async getSurveyorDetails(surveyorId: number): Promise<Surveyor> {
    const response = await fetch(`${this.baseUrl}/mobile/surveyor/${surveyorId}`);
    if (!response.ok) {
      throw new Error(`Failed to load surveyor details: ${response.status}`);
    }
    return response.json();
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
    const response = await fetch(`${this.baseUrl}/mobile/job-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        surveyorId,
        status,
        appointmentId,
        lat,
        lng,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update job status: ${response.status}`);
    }

    return response.json();
  }

  // ==================== Profile APIs ====================

  async changePassword(
    surveyorId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<UpdateResponse> {
    const response = await fetch(`${this.baseUrl}/mobile/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        surveyorId,
        currentPassword,
        newPassword,
      }),
    });

    if (!response.ok) {
      return { success: false, message: 'Failed to change password' };
    }

    return response.json();
  }
}

export const apiService = new ApiService();
