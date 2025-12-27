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

export type NotificationType = 'CREATED' | 'RESCHEDULED' | 'DELETED' | 'RESPONSE';

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

// Appointment types
export type AppointmentResponseStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface Appointment {
  id: number;
  surveyor_id: number;
  start_time: string;
  end_time: string;
  state: string;
  source: string;
  title: string;
  description: string;
  updated_at: string;
  response_status: AppointmentResponseStatus;
  responded_at: string | null;
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
}

// Location and status types
export type SurveyorStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface LocationUpdate {
  surveyorId: number;
  lat: number;
  lng: number;
}

export interface StatusUpdate {
  surveyorId: number;
  status: SurveyorStatus;
}

export interface LocationStatusUpdate {
  surveyorId: number;
  lat: number;
  lng: number;
  status: SurveyorStatus;
}

export interface UpdateResponse {
  success: boolean;
  message?: string;
}

// Login types
export interface LoginRequest {
  email: string;
  password: string;
  pushToken?: string;
  platform?: 'ANDROID' | 'IOS';
}

export interface LoginResponse {
  success: boolean;
  message: string;
  surveyor?: {
    id: number;
    code: string;
    displayName: string;
    email: string;
    phone: string;
    surveyorType: string;
    currentStatus: string;
  };
}

// Chat types
export interface ChatMessage {
  id?: number;
  conversationId: string;
  senderId: number;
  senderType: 'SURVEYOR' | 'DISPATCHER';
  senderName: string;
  recipientId: number;
  recipientType: 'SURVEYOR' | 'DISPATCHER';
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LOCATION';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  status: 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}

export interface ChatConversation {
  conversationId: string;
  otherPartyId: number;
  otherPartyName: string;
  otherPartyType: 'SURVEYOR' | 'DISPATCHER';
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface TypingIndicator {
  conversationId: string;
  userId: number;
  userType: 'SURVEYOR' | 'DISPATCHER';
  userName: string;
  isTyping: boolean;
}

// Inspection Report types
export type InspectionStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

export interface InspectionReport {
  id: number;
  surveyorId: number;
  appointmentId: number;
  vehicleTitle?: string;
  notes?: string;
  photoUrls: string[];
  signatureUrl?: string;
  completedSteps: string[];
  totalSteps: number;
  latitude?: number;
  longitude?: number;
  status: InspectionStatus;
  submittedAt: string;
  updatedAt: string;
  surveyorName?: string;
  surveyorCode?: string;
}

export interface InspectionReportSummary {
  id: number;
  surveyorId: number;
  appointmentId: number;
  vehicleTitle?: string;
  photoCount: number;
  hasSignature: boolean;
  status: InspectionStatus;
  submittedAt: string;
}

export interface InspectionStats {
  totalInspections?: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  today: number;
  thisWeek: number;
}
