import * as Location from 'expo-location';
import { apiService } from './api';
import { SurveyorStatus } from '../types';

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private surveyorId: number | null = null;
  private currentStatus: SurveyorStatus = 'AVAILABLE';
  private updateInterval: NodeJS.Timeout | null = null;
  private lastLocation: { lat: number; lng: number } | null = null;

  async requestPermissions(): Promise<boolean> {
    console.log('[LocationService] Requesting permissions...');

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('[LocationService] Foreground permission denied');
      return false;
    }

    console.log('[LocationService] Foreground permission granted');
    return true;
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('[LocationService] Failed to get current location:', error);
      return null;
    }
  }

  async startTracking(surveyorId: number): Promise<boolean> {
    console.log('[LocationService] Starting tracking for surveyor:', surveyorId);
    this.surveyorId = surveyorId;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return false;
    }

    // Get initial location
    const initialLocation = await this.getCurrentLocation();
    if (initialLocation) {
      this.lastLocation = initialLocation;
      await this.sendLocationUpdate();
    }

    // Start watching location changes
    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Or when moved 50 meters
      },
      (location) => {
        this.lastLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        console.log('[LocationService] Location updated:', this.lastLocation);
      }
    );

    // Send location updates to server every 2 minutes
    this.updateInterval = setInterval(() => {
      this.sendLocationUpdate();
    }, 120000);

    console.log('[LocationService] Tracking started');
    return true;
  }

  stopTracking(): void {
    console.log('[LocationService] Stopping tracking');

    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.surveyorId = null;
    this.lastLocation = null;
  }

  async sendLocationUpdate(): Promise<boolean> {
    if (!this.surveyorId || !this.lastLocation) {
      console.log('[LocationService] Cannot send update - no surveyor or location');
      return false;
    }

    try {
      const response = await apiService.updateLocationAndStatus(
        this.surveyorId,
        this.lastLocation.lat,
        this.lastLocation.lng,
        this.currentStatus
      );
      console.log('[LocationService] Location update sent:', response);
      return response.success;
    } catch (error) {
      console.error('[LocationService] Failed to send location update:', error);
      return false;
    }
  }

  async updateStatus(status: SurveyorStatus): Promise<boolean> {
    this.currentStatus = status;

    if (!this.surveyorId) {
      console.log('[LocationService] Cannot update status - no surveyor');
      return false;
    }

    try {
      const response = await apiService.updateStatus(this.surveyorId, status);
      console.log('[LocationService] Status updated:', response);
      return response.success;
    } catch (error) {
      console.error('[LocationService] Failed to update status:', error);
      return false;
    }
  }

  getCurrentStatus(): SurveyorStatus {
    return this.currentStatus;
  }

  getLastLocation(): { lat: number; lng: number } | null {
    return this.lastLocation;
  }

  isTracking(): boolean {
    return this.watchSubscription !== null;
  }
}

export const locationService = new LocationService();
