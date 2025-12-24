export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'list';
  value?: number | string;
  data?: DashboardWidgetData[];
}

export interface DashboardWidgetData {
  label: string;
  value: number | string;
  color?: string;
}

export interface DashboardStats {
  totalSurveyors: number;
  availableCount: number;
  busyCount: number;
  offlineCount: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
}

export interface TimelineEvent {
  id: string;
  surveyorId: number;
  title: string;
  start: Date;
  end: Date;
  state: string;
  left: string;
  width: string;
  color: string;
}

export interface MiniCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
}
