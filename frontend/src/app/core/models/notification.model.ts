export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface PushNotificationStatus {
  firebaseEnabled: boolean;
  totalSurveyors: number;
  surveyorsWithDeviceTokens: number;
  totalDeviceTokens: number;
  notificationsLast24h: number;
}

export interface TestNotificationRequest {
  title: string;
  message: string;
}

export interface TestNotificationResult {
  surveyorId: number;
  surveyorName: string;
  pushNotificationsSent: number;
  emailSent: boolean;
  smsSent: boolean;
  errors?: string[];
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  details: string;
  timestamp: Date;
  surveyorName?: string;
}
