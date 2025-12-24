import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Toast,
  ToastType,
  PushNotificationStatus,
  TestNotificationRequest,
  TestNotificationResult,
  ActivityLogEntry
} from '../models';
import { API_BASE } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiBase = API_BASE;

  // Toast management
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  private toastId = 0;
  toasts$ = this.toastsSubject.asObservable();

  // Activity log
  private activityLogSubject = new BehaviorSubject<ActivityLogEntry[]>([]);
  private activityLogId = 0;
  activityLog$ = this.activityLogSubject.asObservable();

  // Web Push state
  private webPushEnabledSubject = new BehaviorSubject<boolean>(false);
  private webPushTokenSubject = new BehaviorSubject<string | null>(null);
  private webPushPermissionSubject = new BehaviorSubject<NotificationPermission>('default');

  webPushEnabled$ = this.webPushEnabledSubject.asObservable();
  webPushToken$ = this.webPushTokenSubject.asObservable();
  webPushPermission$ = this.webPushPermissionSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initWebPushState();
  }

  // Toast methods
  showToast(type: ToastType, message: string, title?: string, duration: number = 4000): void {
    const toast: Toast = { id: ++this.toastId, type, message, title, duration };
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    setTimeout(() => this.removeToast(toast.id), duration);
  }

  success(message: string, title?: string): void {
    this.showToast('success', message, title);
  }

  error(message: string, title?: string): void {
    this.showToast('error', message, title);
  }

  warning(message: string, title?: string): void {
    this.showToast('warning', message, title);
  }

  info(message: string, title?: string): void {
    this.showToast('info', message, title);
  }

  removeToast(id: number): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
  }

  clearAllToasts(): void {
    this.toastsSubject.next([]);
  }

  // Activity log methods
  logActivity(action: string, details: string, surveyorName?: string): void {
    const entry: ActivityLogEntry = {
      id: ++this.activityLogId,
      action,
      details,
      timestamp: new Date(),
      surveyorName
    };
    const currentLog = this.activityLogSubject.value;
    this.activityLogSubject.next([entry, ...currentLog.slice(0, 99)]); // Keep last 100 entries
  }

  clearActivityLog(): void {
    this.activityLogSubject.next([]);
    this.activityLogId = 0;
  }

  // Push notification API methods
  getPushNotificationStatus(): Observable<PushNotificationStatus> {
    return this.http.get<PushNotificationStatus>(`${this.apiBase}/notifications/push/status`);
  }

  sendTestNotification(request: TestNotificationRequest): Observable<TestNotificationResult[]> {
    return this.http.post<TestNotificationResult[]>(`${this.apiBase}/notifications/test`, request);
  }

  registerDeviceToken(surveyorId: number, token: string): Observable<any> {
    return this.http.post(`${this.apiBase}/notifications/device-token`, { surveyorId, token });
  }

  unregisterDeviceToken(surveyorId: number, token: string): Observable<any> {
    return this.http.delete(`${this.apiBase}/notifications/device-token`, {
      body: { surveyorId, token }
    });
  }

  // Web Push initialization
  private initWebPushState(): void {
    if ('Notification' in window) {
      this.webPushPermissionSubject.next(Notification.permission);

      const savedToken = localStorage.getItem('webPushToken');
      if (savedToken) {
        this.webPushTokenSubject.next(savedToken);
        this.webPushEnabledSubject.next(true);
      }
    }
  }

  async requestWebPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.webPushPermissionSubject.next(permission);
    return permission;
  }

  async enableWebPush(surveyorId: number): Promise<boolean> {
    try {
      const permission = await this.requestWebPushPermission();
      if (permission !== 'granted') {
        this.error('Notification permission denied');
        return false;
      }

      // For web push, we'd typically get a token from a service worker
      // This is a simplified version
      const token = `web-push-${surveyorId}-${Date.now()}`;

      await this.registerDeviceToken(surveyorId, token).toPromise();

      localStorage.setItem('webPushToken', token);
      localStorage.setItem('webPushSurveyorId', String(surveyorId));

      this.webPushTokenSubject.next(token);
      this.webPushEnabledSubject.next(true);

      this.success('Push notifications enabled');
      return true;
    } catch (e) {
      console.error('Failed to enable web push:', e);
      this.error('Failed to enable push notifications');
      return false;
    }
  }

  async disableWebPush(): Promise<void> {
    const token = this.webPushTokenSubject.value;
    const surveyorId = localStorage.getItem('webPushSurveyorId');

    if (token && surveyorId) {
      try {
        await this.unregisterDeviceToken(parseInt(surveyorId), token).toPromise();
      } catch (e) {
        console.warn('Failed to unregister device token:', e);
      }
    }

    localStorage.removeItem('webPushToken');
    localStorage.removeItem('webPushSurveyorId');

    this.webPushTokenSubject.next(null);
    this.webPushEnabledSubject.next(false);

    this.info('Push notifications disabled');
  }

  getRegisteredSurveyorId(): number | null {
    const id = localStorage.getItem('webPushSurveyorId');
    return id ? parseInt(id) : null;
  }
}
