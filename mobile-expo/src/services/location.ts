import * as Location from 'expo-location';
import { qstashService } from './qstash';
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

    // Start watching location changes with higher frequency for real-time tracking
    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High, // High accuracy for better tracking
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 20, // Or when moved 20 meters
      },
      (location) => {
        const newLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };

        // Only update if position has changed significantly (> 5 meters)
        if (!this.lastLocation || this.hasMovedSignificantly(this.lastLocation, newLocation)) {
          this.lastLocation = newLocation;
          console.log('[LocationService] Location updated:', this.lastLocation);
          // Send immediate update when moving
          this.sendLocationUpdate();
        }
      }
    );

    // Send location updates to server every 15 seconds for real-time tracking
    this.updateInterval = setInterval(() => {
      this.sendLocationUpdate();
    }, 15000);

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
      // Publish to QStash instead of direct API call
      // QStash will deliver the message to the backend webhook
      const response = await qstashService.publishLocationAndStatus(
        this.surveyorId,
        this.lastLocation.lat,
        this.lastLocation.lng,
        this.currentStatus
      );
      console.log('[LocationService] Location update published to QStash:', response);
      return response.success;
    } catch (error) {
      console.error('[LocationService] Failed to publish location update:', error);
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
      // Publish status update to QStash
      const response = await qstashService.publishStatus(this.surveyorId, status);
      console.log('[LocationService] Status published to QStash:', response);
      return response.success;
    } catch (error) {
      console.error('[LocationService] Failed to publish status:', error);
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

  /**
   * Check if position has changed significantly (> threshold meters)
   */
  private hasMovedSignificantly(
    oldLoc: { lat: number; lng: number },
    newLoc: { lat: number; lng: number },
    thresholdMeters: number = 5
  ): boolean {
    const distance = this.calculateDistance(oldLoc.lat, oldLoc.lng, newLoc.lat, newLoc.lng);
    return distance > thresholdMeters;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
