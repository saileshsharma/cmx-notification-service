export interface Surveyor {
  id: number;
  display_name: string;
  email?: string;
  phone?: string;
  surveyor_type: string;
  color?: string;
  code?: string;
  status?: string;
  current_status?: string;
  home_lat?: number;
  home_lng?: number;
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
