export interface Surveyor {
  id: number;
  code: string;
  display_name: string;
  surveyor_type: 'INTERNAL' | 'EXTERNAL';
  current_status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  status?: string;
  home_lat?: number;
  home_lng?: number;
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  email?: string;
  phone?: string;
}

export interface SurveyorNote {
  surveyorId: number;
  note: string;
  updatedAt: Date;
}

export interface SurveyorWorkload {
  surveyorId: number;
  surveyorName: string;
  hoursToday: number;
  hoursWeek: number;
  appointmentsToday: number;
  appointmentsWeek: number;
}

export interface SurveyorCapacity {
  surveyorId: number;
  capacity: number;
  maxDailyCapacity: number;
}
