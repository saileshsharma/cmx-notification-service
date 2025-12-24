export interface Surveyor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  type: string;
  color?: string;
}

export type NotificationType = 'CREATED' | 'RESCHEDULED' | 'DELETED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  appointmentId?: number;
  timestamp: number;
}

export interface DeviceRegistrationRequest {
  surveyorId: number;
  token: string;
  platform: 'ANDROID' | 'IOS';
}

export interface DeviceRegistrationResponse {
  ok?: boolean;
  success?: boolean;
  message?: string;
}
