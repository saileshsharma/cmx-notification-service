export interface Appointment {
  id: number;
  surveyor_id: number;
  start_time: string;
  end_time: string;
  state: AppointmentState;
  title?: string;
  description?: string;
  source?: string;
  updated_at?: string;
}

export type AppointmentState = 'BUSY' | 'AVAILABLE' | 'OFFLINE';

export interface AppointmentCreateRequest {
  surveyorId: number;
  blocks: AppointmentBlock[];
}

export interface AppointmentBlock {
  startTime: string;
  endTime: string;
  state: AppointmentState;
  title?: string;
  description?: string;
}

export interface AppointmentUpdateRequest {
  startTime: string;
  endTime: string;
  state: AppointmentState;
  title?: string;
  description?: string;
}

export interface AppointmentTemplate {
  id: number;
  name: string;
  duration: number;
  state: AppointmentState;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color?: string;
  extendedProps?: {
    surveyorId: number;
    state: string;
    description?: string;
  };
}

export interface UpcomingAlert {
  surveyorName: string;
  state: string;
  startTime: string;
}

export interface WorkloadDay {
  date: string;
  dayName: string;
  count: number;
}

export interface ConflictWarning {
  surveyorId: number;
  surveyorName: string;
  conflictCount: number;
  conflicts: Appointment[];
}

export interface TravelTimeEstimate {
  fromEvent: CalendarEvent;
  toEvent: CalendarEvent;
  travelMinutes: number;
}
