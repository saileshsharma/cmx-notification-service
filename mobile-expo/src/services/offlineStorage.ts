import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Offline storage keys
const OFFLINE_KEYS = {
  APPOINTMENTS: 'offline_appointments',
  PENDING_ACTIONS: 'offline_pending_actions',
  LAST_SYNC: 'offline_last_sync',
  CACHED_SURVEYORS: 'offline_surveyors',
  OFFLINE_INSPECTIONS: 'offline_inspections',
};

export interface PendingAction {
  id: string;
  type: 'STATUS_UPDATE' | 'LOCATION_UPDATE' | 'JOB_UPDATE' | 'APPOINTMENT_RESPONSE' | 'INSPECTION_SUBMIT';
  payload: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineAppointment {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  state: string;
  surveyorId: number;
  cachedAt: number;
}

class OfflineStorageService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach(listener => listener(this.isOnline));

      // If we just came back online, trigger sync
      if (wasOffline && this.isOnline) {
        console.log('[OfflineStorage] Back online - triggering sync');
        this.syncPendingActions();
      }
    });
  }

  // Subscribe to network status changes
  onNetworkChange(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  // ==================== APPOINTMENTS CACHE ====================

  async cacheAppointments(appointments: OfflineAppointment[]): Promise<void> {
    const cachedAt = Date.now();
    const cached = appointments.map(apt => ({ ...apt, cachedAt }));
    await AsyncStorage.setItem(OFFLINE_KEYS.APPOINTMENTS, JSON.stringify(cached));
    await AsyncStorage.setItem(OFFLINE_KEYS.LAST_SYNC, cachedAt.toString());
  }

  async getCachedAppointments(): Promise<OfflineAppointment[]> {
    try {
      const json = await AsyncStorage.getItem(OFFLINE_KEYS.APPOINTMENTS);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.warn('[OfflineStorage] Failed to parse cached appointments, clearing corrupted data:', error);
      await AsyncStorage.removeItem(OFFLINE_KEYS.APPOINTMENTS);
      return [];
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    const value = await AsyncStorage.getItem(OFFLINE_KEYS.LAST_SYNC);
    return value ? parseInt(value, 10) : null;
  }

  // ==================== PENDING ACTIONS QUEUE ====================

  async queueAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const pendingActions = await this.getPendingActions();
    const newAction: PendingAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    pendingActions.push(newAction);
    await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_ACTIONS, JSON.stringify(pendingActions));
    console.log('[OfflineStorage] Queued action:', newAction.type);
  }

  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const json = await AsyncStorage.getItem(OFFLINE_KEYS.PENDING_ACTIONS);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.warn('[OfflineStorage] Failed to parse pending actions, clearing corrupted data:', error);
      await AsyncStorage.removeItem(OFFLINE_KEYS.PENDING_ACTIONS);
      return [];
    }
  }

  async removePendingAction(actionId: string): Promise<void> {
    const actions = await this.getPendingActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
  }

  async updatePendingAction(actionId: string, updates: Partial<PendingAction>): Promise<void> {
    const actions = await this.getPendingActions();
    const updated = actions.map(a => a.id === actionId ? { ...a, ...updates } : a);
    await AsyncStorage.setItem(OFFLINE_KEYS.PENDING_ACTIONS, JSON.stringify(updated));
  }

  // ==================== SYNC MANAGER ====================

  async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let success = 0;
    let failed = 0;

    try {
      const actions = await this.getPendingActions();
      console.log(`[OfflineStorage] Syncing ${actions.length} pending actions`);

      for (const action of actions) {
        try {
          await this.executeAction(action);
          await this.removePendingAction(action.id);
          success++;
        } catch (error) {
          console.error(`[OfflineStorage] Failed to sync action ${action.id}:`, error);

          // Update retry count
          if (action.retryCount < 3) {
            await this.updatePendingAction(action.id, { retryCount: action.retryCount + 1 });
          } else {
            // Max retries reached, remove the action
            console.error(`[OfflineStorage] Max retries reached for action ${action.id}, removing`);
            await this.removePendingAction(action.id);
          }
          failed++;
        }
      }
    } finally {
      this.syncInProgress = false;
    }

    console.log(`[OfflineStorage] Sync complete: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  private async executeAction(action: PendingAction): Promise<void> {
    // Import apiService dynamically to avoid circular dependency
    const { apiService } = await import('./api');

    switch (action.type) {
      case 'STATUS_UPDATE':
        await apiService.updateStatus(action.payload.surveyorId, action.payload.status);
        break;
      case 'LOCATION_UPDATE':
        await apiService.updateLocation(action.payload.surveyorId, action.payload.lat, action.payload.lng);
        break;
      case 'JOB_UPDATE':
        await apiService.updateJobStatus(
          action.payload.surveyorId,
          action.payload.status,
          action.payload.appointmentId,
          action.payload.lat,
          action.payload.lng,
          action.payload.notes
        );
        break;
      case 'APPOINTMENT_RESPONSE':
        await apiService.respondToAppointment(
          action.payload.appointmentId,
          action.payload.surveyorId,
          action.payload.response
        );
        break;
      default:
        console.warn(`[OfflineStorage] Unknown action type: ${action.type}`);
    }
  }

  // ==================== OFFLINE INSPECTIONS ====================

  async saveOfflineInspection(inspection: any): Promise<void> {
    const inspections = await this.getOfflineInspections();
    inspections.push({
      ...inspection,
      savedAt: Date.now(),
      synced: false,
    });
    await AsyncStorage.setItem(OFFLINE_KEYS.OFFLINE_INSPECTIONS, JSON.stringify(inspections));
  }

  async getOfflineInspections(): Promise<any[]> {
    try {
      const json = await AsyncStorage.getItem(OFFLINE_KEYS.OFFLINE_INSPECTIONS);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  }

  async markInspectionSynced(inspectionId: string): Promise<void> {
    const inspections = await this.getOfflineInspections();
    const updated = inspections.map(i =>
      i.id === inspectionId ? { ...i, synced: true } : i
    );
    await AsyncStorage.setItem(OFFLINE_KEYS.OFFLINE_INSPECTIONS, JSON.stringify(updated));
  }

  // ==================== CLEAR DATA ====================

  async clearOfflineData(): Promise<void> {
    await AsyncStorage.multiRemove([
      OFFLINE_KEYS.APPOINTMENTS,
      OFFLINE_KEYS.PENDING_ACTIONS,
      OFFLINE_KEYS.LAST_SYNC,
      OFFLINE_KEYS.CACHED_SURVEYORS,
      OFFLINE_KEYS.OFFLINE_INSPECTIONS,
    ]);
  }
}

export const offlineStorage = new OfflineStorageService();
