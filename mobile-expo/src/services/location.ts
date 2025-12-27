/**
 * Location Service - Enhanced with:
 * - Battery-aware tracking modes
 * - Batched location updates to reduce API calls
 * - Adaptive update intervals based on movement
 * - Error handling with retry
 * - Proper cleanup
 */
import * as Location from 'expo-location';
import { qstashService } from './qstash';
import { SurveyorStatus } from '../types';
import { logger } from '../utils/logger';
import { addSentryBreadcrumb, captureException } from '../config/sentry';

// Tracking configuration
const TRACKING_CONFIG = {
  // High accuracy mode (when actively traveling)
  high: {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,     // 10 seconds
    distanceInterval: 20,    // 20 meters
    serverUpdateInterval: 15000, // Send to server every 15 seconds
  },
  // Balanced mode (normal operation)
  balanced: {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000,     // 30 seconds
    distanceInterval: 50,    // 50 meters
    serverUpdateInterval: 60000, // Send to server every 60 seconds
  },
  // Low power mode (stationary or background)
  low: {
    accuracy: Location.Accuracy.Low,
    timeInterval: 60000,     // 1 minute
    distanceInterval: 100,   // 100 meters
    serverUpdateInterval: 120000, // Send to server every 2 minutes
  },
};

// Movement detection thresholds
const MOVEMENT_CONFIG = {
  stationaryThresholdMeters: 10,
  stationaryTimeMs: 120000, // 2 minutes stationary switches to low mode
  movingSpeedMps: 2.5, // 2.5 m/s (~9 km/h) considered moving quickly
};

type TrackingMode = 'high' | 'balanced' | 'low';

interface LocationUpdate {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
}

type LocationUpdateHandler = (location: LocationUpdate) => void;
type TrackingModeHandler = (mode: TrackingMode) => void;

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private surveyorId: number | null = null;
  private currentStatus: SurveyorStatus = 'AVAILABLE';
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private lastLocation: LocationUpdate | null = null;
  private lastSentLocation: LocationUpdate | null = null;
  private lastMovementTime: number = Date.now();
  private trackingMode: TrackingMode = 'balanced';
  private modeCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Location batch for offline/failed updates
  private locationBatch: LocationUpdate[] = [];
  private maxBatchSize: number = 50;

  // Handlers
  private locationHandlers: Set<LocationUpdateHandler> = new Set();
  private modeHandlers: Set<TrackingModeHandler> = new Set();

  // Statistics
  private stats = {
    updatesReceived: 0,
    updatesSent: 0,
    updatesFailed: 0,
    lastError: null as string | null,
  };

  async requestPermissions(): Promise<boolean> {
    logger.info('[Location] Requesting permissions');

    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        logger.warn('[Location] Foreground permission denied');
        return false;
      }

      logger.info('[Location] Foreground permission granted');

      // Try to get background permission (optional)
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
          logger.info('[Location] Background permission granted');
        }
      } catch (error) {
        logger.debug('[Location] Background permission not available');
      }

      return true;
    } catch (error) {
      logger.error('[Location] Permission request failed', error);
      captureException(error instanceof Error ? error : new Error('Permission request failed'));
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationUpdate | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
        speed: location.coords.speed || undefined,
      };
    } catch (error) {
      logger.error('[Location] Failed to get current location', error);
      return null;
    }
  }

  async startTracking(surveyorId: number, mode: TrackingMode = 'balanced'): Promise<boolean> {
    logger.info('[Location] Starting tracking', { surveyorId, mode });
    this.surveyorId = surveyorId;
    this.trackingMode = mode;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return false;
    }

    // Get initial location with timeout to prevent startup hang
    const GPS_TIMEOUT = 10000; // 10 second timeout
    try {
      const initialLocation = await Promise.race([
        this.getCurrentLocation(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), GPS_TIMEOUT)),
      ]);
      if (initialLocation) {
        this.lastLocation = initialLocation;
        this.lastMovementTime = Date.now();
        await this.sendLocationUpdate();
      } else {
        logger.warn('[Location] Initial location fetch timed out, continuing with tracking');
      }
    } catch (error) {
      logger.warn('[Location] Failed to get initial location, continuing with tracking', error);
    }

    // Start watching location with current mode settings
    await this.startWatching();

    // Start mode check interval (check every 30 seconds)
    this.modeCheckInterval = setInterval(() => {
      this.checkAndUpdateMode();
    }, 30000);

    addSentryBreadcrumb({
      category: 'location',
      message: 'Location tracking started',
      level: 'info',
      data: { surveyorId, mode },
    });

    logger.info('[Location] Tracking started successfully');
    return true;
  }

  private async startWatching(): Promise<void> {
    // Stop existing subscription
    if (this.watchSubscription) {
      this.watchSubscription.remove();
    }

    const config = TRACKING_CONFIG[this.trackingMode];

    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: config.accuracy,
        timeInterval: config.timeInterval,
        distanceInterval: config.distanceInterval,
      },
      (location) => {
        this.handleLocationUpdate({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: location.timestamp,
          speed: location.coords.speed || undefined,
        });
      }
    );

    // Set up server update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.sendLocationUpdate();
    }, config.serverUpdateInterval);
  }

  private handleLocationUpdate(location: LocationUpdate): void {
    this.stats.updatesReceived++;

    // Check if position has changed significantly
    if (this.lastLocation && !this.hasMovedSignificantly(this.lastLocation, location)) {
      return;
    }

    // Update movement time if moving
    if (location.speed && location.speed > MOVEMENT_CONFIG.movingSpeedMps) {
      this.lastMovementTime = Date.now();
    } else if (this.lastLocation && this.hasMovedSignificantly(this.lastLocation, location, MOVEMENT_CONFIG.stationaryThresholdMeters)) {
      this.lastMovementTime = Date.now();
    }

    this.lastLocation = location;

    // Notify handlers
    this.locationHandlers.forEach(handler => handler(location));

    logger.debug('[Location] Location updated', {
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      accuracy: location.accuracy?.toFixed(0),
      mode: this.trackingMode,
    });
  }

  private checkAndUpdateMode(): void {
    if (!this.lastLocation) return;

    const timeSinceMovement = Date.now() - this.lastMovementTime;
    const currentSpeed = this.lastLocation.speed || 0;

    let newMode: TrackingMode = this.trackingMode;

    if (currentSpeed > MOVEMENT_CONFIG.movingSpeedMps) {
      // Moving quickly - use high accuracy
      newMode = 'high';
    } else if (timeSinceMovement > MOVEMENT_CONFIG.stationaryTimeMs) {
      // Stationary for a while - use low power
      newMode = 'low';
    } else {
      // Normal movement - balanced mode
      newMode = 'balanced';
    }

    if (newMode !== this.trackingMode) {
      this.setTrackingMode(newMode);
    }
  }

  async setTrackingMode(mode: TrackingMode): Promise<void> {
    if (mode === this.trackingMode) return;

    logger.info('[Location] Switching tracking mode', { from: this.trackingMode, to: mode });
    this.trackingMode = mode;

    // Notify handlers
    this.modeHandlers.forEach(handler => handler(mode));

    // Restart watching with new settings
    if (this.watchSubscription) {
      await this.startWatching();
    }
  }

  stopTracking(): void {
    logger.info('[Location] Stopping tracking');

    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.modeCheckInterval) {
      clearInterval(this.modeCheckInterval);
      this.modeCheckInterval = null;
    }

    // Flush any remaining batched locations
    this.flushBatch();

    this.surveyorId = null;
    this.lastLocation = null;
    this.lastSentLocation = null;

    addSentryBreadcrumb({
      category: 'location',
      message: 'Location tracking stopped',
      level: 'info',
    });
  }

  /**
   * Clean up all resources (call on unmount)
   */
  cleanup(): void {
    this.stopTracking();
    this.locationHandlers.clear();
    this.modeHandlers.clear();
    this.locationBatch = [];
  }

  async sendLocationUpdate(): Promise<boolean> {
    if (!this.surveyorId || !this.lastLocation) {
      return false;
    }

    // Skip if location hasn't changed since last send
    if (this.lastSentLocation &&
        !this.hasMovedSignificantly(this.lastSentLocation, this.lastLocation, 5)) {
      logger.debug('[Location] Skipping update - no significant movement');
      return true;
    }

    try {
      const response = await qstashService.publishLocationAndStatus(
        this.surveyorId,
        this.lastLocation.lat,
        this.lastLocation.lng,
        this.currentStatus
      );

      if (response.success) {
        this.stats.updatesSent++;
        this.lastSentLocation = { ...this.lastLocation };

        // Flush any batched locations on successful send
        if (this.locationBatch.length > 0) {
          this.flushBatch();
        }

        return true;
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      this.stats.updatesFailed++;
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';

      logger.warn('[Location] Failed to send update, batching', {
        error: this.stats.lastError,
        batchSize: this.locationBatch.length,
      });

      // Batch failed location for retry
      if (this.locationBatch.length < this.maxBatchSize) {
        this.locationBatch.push({ ...this.lastLocation });
      }

      return false;
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.locationBatch.length === 0 || !this.surveyorId) return;

    logger.info('[Location] Flushing location batch', { count: this.locationBatch.length });

    // Just send the latest location from the batch
    const latest = this.locationBatch[this.locationBatch.length - 1];
    this.locationBatch = [];

    try {
      await qstashService.publishLocationAndStatus(
        this.surveyorId,
        latest.lat,
        latest.lng,
        this.currentStatus
      );
    } catch (error) {
      logger.error('[Location] Failed to flush batch', error);
    }
  }

  async updateStatus(status: SurveyorStatus): Promise<boolean> {
    this.currentStatus = status;

    if (!this.surveyorId) {
      return false;
    }

    try {
      const response = await qstashService.publishStatus(this.surveyorId, status);
      return response.success;
    } catch (error) {
      logger.error('[Location] Failed to update status', error);
      return false;
    }
  }

  // ==================== Subscriptions ====================

  /**
   * Subscribe to location updates (returns unsubscribe function)
   */
  subscribeToLocation(handler: LocationUpdateHandler): () => void {
    this.locationHandlers.add(handler);
    return () => this.locationHandlers.delete(handler);
  }

  /**
   * Subscribe to mode changes (returns unsubscribe function)
   */
  subscribeToModeChanges(handler: TrackingModeHandler): () => void {
    this.modeHandlers.add(handler);
    return () => this.modeHandlers.delete(handler);
  }

  // ==================== Getters ====================

  getCurrentStatus(): SurveyorStatus {
    return this.currentStatus;
  }

  getLastLocation(): LocationUpdate | null {
    return this.lastLocation;
  }

  getTrackingMode(): TrackingMode {
    return this.trackingMode;
  }

  isTracking(): boolean {
    return this.watchSubscription !== null;
  }

  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  // ==================== Utility Methods ====================

  /**
   * Check if position has changed significantly
   */
  private hasMovedSignificantly(
    oldLoc: LocationUpdate,
    newLoc: LocationUpdate,
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

  /**
   * Calculate distance from current location to a point
   */
  getDistanceTo(lat: number, lng: number): number | null {
    if (!this.lastLocation) return null;
    return this.calculateDistance(this.lastLocation.lat, this.lastLocation.lng, lat, lng);
  }

  /**
   * Get estimated time to a location based on current speed
   */
  getEstimatedTimeToLocation(lat: number, lng: number): number | null {
    if (!this.lastLocation || !this.lastLocation.speed) return null;

    const distance = this.getDistanceTo(lat, lng);
    if (!distance || this.lastLocation.speed === 0) return null;

    return distance / this.lastLocation.speed; // Time in seconds
  }
}

export const locationService = new LocationService();
export type { LocationUpdate, TrackingMode };
