import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Network from 'expo-network';
import { Appointment, NotificationItem } from '../types';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { notificationService } from '../services/notifications';
import { locationService } from '../services/location';
import * as Haptics from 'expo-haptics';

// Types - Re-export from types
export { Appointment, NotificationItem } from '../types';

// Local types
export type TabType = 'dashboard' | 'appointments' | 'inspection' | 'history' | 'chat';
export type JobState = 'idle' | 'navigating' | 'arrived' | 'inspecting' | 'completed';
export type QuickStatus = 'on_way' | 'arrived' | 'inspecting' | 'completed';

export interface CompletedJob {
  appointment: Appointment;
  photos: string[];
  notes: string;
  signature: boolean;
  completedAt: Date;
}

export interface InspectionStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'surveyor' | 'dispatcher';
  timestamp: Date;
}

export interface TodayStats {
  completed: number;
  pending: number;
  totalDistance: number;
  avgTime: number;
}

export interface Weather {
  temp: number;
  condition: string;
  icon: string;
}

interface AppState {
  // Network
  isOnline: boolean;

  // Navigation
  activeTab: TabType;

  // Appointments
  appointments: Appointment[];
  isRefreshing: boolean;

  // Notifications
  notifications: NotificationItem[];

  // Job workflow
  jobState: JobState;
  activeJob: Appointment | null;
  selectedAppointment: Appointment | null;
  quickStatus: QuickStatus | null;

  // Location
  isLocationTracking: boolean;
  currentLocation: { lat: number; lng: number } | null;
  destinationLocation: { lat: number; lng: number } | null;

  // Dashboard
  todayStats: TodayStats;
  weather: Weather | null;

  // Inspection
  inspectionSteps: InspectionStep[];
  capturedPhotos: string[];
  inspectionNotes: string;
  signatureData: string | null;

  // Chat
  chatMessages: ChatMessage[];

  // History
  inspectionHistory: any[];

  // Modals
  showMapModal: boolean;
  showCompletionModal: boolean;
  showSignatureModal: boolean;
  showNotifications: boolean;
  isUploading: boolean;
}

interface AppContextType extends AppState {
  setActiveTab: (tab: TabType) => void;
  loadAppointments: (surveyorId: number) => Promise<void>;
  refreshAppointments: (surveyorId: number) => Promise<void>;
  setActiveJob: (job: Appointment | null) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  setJobState: (state: JobState) => void;
  setQuickStatus: (status: QuickStatus | null) => void;
  setDestinationLocation: (loc: { lat: number; lng: number } | null) => void;
  setCurrentLocation: (loc: { lat: number; lng: number } | null) => void;
  toggleInspectionStep: (stepId: string) => void;
  addCapturedPhoto: (uri: string) => void;
  removeCapturedPhoto: (index: number) => void;
  setInspectionNotes: (notes: string) => void;
  setSignatureData: (data: string | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  resetInspection: () => void;
  setShowMapModal: (show: boolean) => void;
  setShowCompletionModal: (show: boolean) => void;
  setShowSignatureModal: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  setIsUploading: (uploading: boolean) => void;
  startLocationTracking: (surveyorId: number) => Promise<void>;
  stopLocationTracking: () => void;
  addNotification: (notification: NotificationItem) => void;
}

const defaultInspectionSteps: InspectionStep[] = [
  { id: '1', title: 'Vehicle Identification', description: 'Verify VIN, registration, and owner details', completed: false, required: true },
  { id: '2', title: 'Exterior Inspection', description: 'Check body damage, paint, lights, mirrors', completed: false, required: true },
  { id: '3', title: 'Interior Inspection', description: 'Check seats, dashboard, controls, odometer', completed: false, required: true },
  { id: '4', title: 'Engine & Mechanical', description: 'Check engine bay, fluids, belts, battery', completed: false, required: true },
  { id: '5', title: 'Undercarriage', description: 'Check suspension, brakes, exhaust, frame', completed: false, required: false },
  { id: '6', title: 'Photo Documentation', description: 'Take required photos of damage areas', completed: false, required: true },
  { id: '7', title: 'Owner Signature', description: 'Get vehicle owner to sign inspection report', completed: false, required: true },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    isOnline: true,
    activeTab: 'dashboard',
    appointments: [],
    isRefreshing: false,
    notifications: [],
    jobState: 'idle',
    activeJob: null,
    selectedAppointment: null,
    quickStatus: null,
    isLocationTracking: false,
    currentLocation: null,
    destinationLocation: null,
    todayStats: { completed: 0, pending: 0, totalDistance: 0, avgTime: 0 },
    weather: { temp: 28, condition: 'Sunny', icon: 'sunny' },
    inspectionSteps: defaultInspectionSteps,
    capturedPhotos: [],
    inspectionNotes: '',
    signatureData: null,
    chatMessages: [
      { id: '1', text: 'Hello! Dispatch here. Let us know if you need any assistance.', sender: 'dispatcher', timestamp: new Date(Date.now() - 3600000) },
    ],
    inspectionHistory: [],
    showMapModal: false,
    showCompletionModal: false,
    showSignatureModal: false,
    showNotifications: false,
    isUploading: false,
  });

  // Network monitoring
  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      setState(prev => ({ ...prev, isOnline: networkState.isConnected ?? false }));
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

  // Setup notification listener
  useEffect(() => {
    notificationService.setOnNotificationReceived((notification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 50),
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
    notificationService.startListening();

    return () => {
      notificationService.stopListening();
    };
  }, []);

  // Calculate today's stats when appointments change
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = state.appointments.filter(a => {
      const apptDate = new Date(a.start_time);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === today.getTime();
    });

    const completed = todayAppointments.filter(a => a.response_status === 'ACCEPTED').length;
    const pending = todayAppointments.filter(a => a.response_status === 'PENDING').length;

    setState(prev => ({
      ...prev,
      todayStats: {
        completed,
        pending,
        totalDistance: Math.round(Math.random() * 50 + 10),
        avgTime: Math.round(Math.random() * 20 + 25),
      },
    }));
  }, [state.appointments]);

  // Actions
  const setActiveTab = (tab: TabType) => {
    setState(prev => ({ ...prev, activeTab: tab }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const loadAppointments = async (surveyorId: number) => {
    try {
      const data = await apiService.getAppointments(surveyorId, true);
      setState(prev => ({ ...prev, appointments: data }));
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const refreshAppointments = async (surveyorId: number) => {
    setState(prev => ({ ...prev, isRefreshing: true }));
    await loadAppointments(surveyorId);
    setState(prev => ({ ...prev, isRefreshing: false }));
  };

  const setActiveJob = (job: Appointment | null) => {
    setState(prev => ({ ...prev, activeJob: job }));
  };

  const setSelectedAppointment = (appointment: Appointment | null) => {
    setState(prev => ({ ...prev, selectedAppointment: appointment }));
  };

  const setJobState = (jobState: JobState) => {
    setState(prev => ({ ...prev, jobState }));
  };

  const setQuickStatus = (quickStatus: QuickStatus | null) => {
    setState(prev => ({ ...prev, quickStatus }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const setDestinationLocation = (loc: { lat: number; lng: number } | null) => {
    setState(prev => ({ ...prev, destinationLocation: loc }));
  };

  const setCurrentLocation = (loc: { lat: number; lng: number } | null) => {
    setState(prev => ({ ...prev, currentLocation: loc }));
  };

  const toggleInspectionStep = (stepId: string) => {
    setState(prev => ({
      ...prev,
      inspectionSteps: prev.inspectionSteps.map(step =>
        step.id === stepId ? { ...step, completed: !step.completed } : step
      ),
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addCapturedPhoto = (uri: string) => {
    setState(prev => ({ ...prev, capturedPhotos: [...prev.capturedPhotos, uri] }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeCapturedPhoto = (index: number) => {
    setState(prev => ({
      ...prev,
      capturedPhotos: prev.capturedPhotos.filter((_, i) => i !== index),
    }));
  };

  const setInspectionNotes = (notes: string) => {
    setState(prev => ({ ...prev, inspectionNotes: notes }));
  };

  const setSignatureData = (data: string | null) => {
    setState(prev => ({ ...prev, signatureData: data }));
  };

  const addChatMessage = (message: ChatMessage) => {
    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, message] }));
  };

  const resetInspection = () => {
    setState(prev => ({
      ...prev,
      inspectionSteps: defaultInspectionSteps,
      capturedPhotos: [],
      inspectionNotes: '',
      signatureData: null,
      activeJob: null,
      selectedAppointment: null,
      jobState: 'idle',
    }));
  };

  const setShowMapModal = (show: boolean) => {
    setState(prev => ({ ...prev, showMapModal: show }));
  };

  const setShowCompletionModal = (show: boolean) => {
    setState(prev => ({ ...prev, showCompletionModal: show }));
  };

  const setShowSignatureModal = (show: boolean) => {
    setState(prev => ({ ...prev, showSignatureModal: show }));
  };

  const setShowNotifications = (show: boolean) => {
    setState(prev => ({ ...prev, showNotifications: show }));
  };

  const setIsUploading = (uploading: boolean) => {
    setState(prev => ({ ...prev, isUploading: uploading }));
  };

  const startLocationTracking = async (surveyorId: number) => {
    const success = await locationService.startTracking(surveyorId);
    setState(prev => ({ ...prev, isLocationTracking: success }));
  };

  const stopLocationTracking = () => {
    locationService.stopTracking();
    setState(prev => ({ ...prev, isLocationTracking: false }));
  };

  const addNotification = (notification: NotificationItem) => {
    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications].slice(0, 50),
    }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setActiveTab,
        loadAppointments,
        refreshAppointments,
        setActiveJob,
        setSelectedAppointment,
        setJobState,
        setQuickStatus,
        setDestinationLocation,
        setCurrentLocation,
        toggleInspectionStep,
        addCapturedPhoto,
        removeCapturedPhoto,
        setInspectionNotes,
        setSignatureData,
        addChatMessage,
        resetInspection,
        setShowMapModal,
        setShowCompletionModal,
        setShowSignatureModal,
        setShowNotifications,
        setIsUploading,
        startLocationTracking,
        stopLocationTracking,
        addNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
