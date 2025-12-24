import { API_BASE_URL } from '../config/api';
import { Surveyor, DeviceRegistrationRequest, DeviceRegistrationResponse } from '../types';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
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
}

export const apiService = new ApiService();
