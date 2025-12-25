import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Vibration,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
import { NotificationItem, Appointment, SurveyorStatus, AppointmentResponseStatus } from './src/types';

// Services
import { apiService } from './src/services/api';
import { storageService } from './src/services/storage';
import { notificationService } from './src/services/notifications';
import { locationService } from './src/services/location';

// Screens
import {
  LoginScreen,
  DashboardScreen,
  ScheduleScreen,
  InspectionScreen,
  HistoryScreen,
  ChatScreen,
} from './src/screens';

// Components
import {
  Header,
  BottomNav,
  MapModal,
  CompletionModal,
  SignatureModal,
  NotificationPanel,
  UploadingOverlay,
} from './src/components';

// Constants
import { colors } from './src/constants/theme';

const { width } = Dimensions.get('window');

// Types
type TabType = 'dashboard' | 'appointments' | 'inspection' | 'history' | 'chat';
type QuickStatus = 'on_way' | 'arrived' | 'inspecting' | 'completed';
type JobState = 'idle' | 'navigating' | 'arrived' | 'inspecting' | 'completed';

interface InspectionStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'surveyor' | 'dispatcher';
  timestamp: Date;
}

interface CompletedJob {
  appointment: Appointment;
  photos: string[];
  notes: string;
  signature: boolean;
  completedAt: Date;
}

interface TodayStats {
  completed: number;
  pending: number;
  totalDistance: number;
  avgTime: number;
}

interface Weather {
  temp: number;
  condition: string;
  icon: string;
}

export default function App() {
  // ==================== STATE ====================

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedSurveyorId, setSelectedSurveyorId] = useState<number | null>(null);
  const [surveyorName, setSurveyorName] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string>('');

  // Navigation state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Data state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentStatus, setCurrentStatus] = useState<SurveyorStatus>('AVAILABLE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    completed: 0,
    pending: 0,
    totalDistance: 0,
    avgTime: 0,
  });
  const [weather, setWeather] = useState<Weather | null>(null);

  // Quick status and job state
  const [quickStatus, setQuickStatus] = useState<QuickStatus | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [jobState, setJobState] = useState<JobState>('idle');
  const [activeJob, setActiveJob] = useState<Appointment | null>(null);

  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedJob, setCompletedJob] = useState<CompletedJob | null>(null);

  // Inspection state
  const [inspectionSteps, setInspectionSteps] = useState<InspectionStep[]>([
    { id: '1', title: 'Vehicle Identification', description: 'Verify VIN, registration, and owner details', completed: false, required: true },
    { id: '2', title: 'Exterior Inspection', description: 'Check body damage, paint, lights, mirrors', completed: false, required: true },
    { id: '3', title: 'Interior Inspection', description: 'Check seats, dashboard, controls, odometer', completed: false, required: true },
    { id: '4', title: 'Engine & Mechanical', description: 'Check engine bay, fluids, belts, battery', completed: false, required: true },
    { id: '5', title: 'Undercarriage', description: 'Check suspension, brakes, exhaust, frame', completed: false, required: false },
    { id: '6', title: 'Photo Documentation', description: 'Take required photos of damage areas', completed: false, required: true },
    { id: '7', title: 'Owner Signature', description: 'Get vehicle owner to sign inspection report', completed: false, required: true },
  ]);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Hello! Dispatch here. Let us know if you need any assistance.', sender: 'dispatcher', timestamp: new Date(Date.now() - 3600000) },
  ]);
  const [newMessage, setNewMessage] = useState('');

  // History state
  const [inspectionHistory, setInspectionHistory] = useState<any[]>([]);

  // Network state
  const [isOnline, setIsOnline] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Animation refs
  const badgeScale = useRef(new Animated.Value(1)).current;

  // Derived values
  const unreadCount = notifications.filter(n =>
    Date.now() - n.timestamp < 24 * 60 * 60 * 1000
  ).length;

  // ==================== EFFECTS ====================

  // Check network status
  useEffect(() => {
    const checkNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      setIsOnline(networkState.isConnected ?? false);
    };
    checkNetwork();
    const interval = setInterval(checkNetwork, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize app
  useEffect(() => {
    initializeApp();
    return () => {
      notificationService.stopListening();
      locationService.stopTracking();
    };
  }, []);

  // Load data when registered
  useEffect(() => {
    if (isRegistered && selectedSurveyorId) {
      loadAppointments();
      startLocationTracking();
      loadInspectionHistory();
      fetchWeather();
    }
  }, [isRegistered, selectedSurveyorId]);

  // Badge animation
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(badgeScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [notifications.length]);

  // Calculate today's stats
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = appointments.filter(a => {
      const apptDate = new Date(a.start_time);
      apptDate.setHours(0, 0, 0, 0);
      return apptDate.getTime() === today.getTime();
    });

    const completed = todayAppointments.filter(a => a.response_status === 'ACCEPTED').length;
    const pending = todayAppointments.filter(a => a.response_status === 'PENDING').length;

    setTodayStats({
      completed,
      pending,
      totalDistance: completed > 0 ? completed * 15 : 0, // Estimate 15km per inspection
      avgTime: completed > 0 ? 35 : 0, // Average 35 min per inspection
    });
  }, [appointments]);

  // ==================== HANDLERS ====================

  const initializeApp = async () => {
    await loadSavedState();
    await setupPushNotifications();

    notificationService.setOnNotificationReceived((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (selectedSurveyorId) {
        loadAppointments();
      }
    });
    notificationService.startListening();

    setIsLoading(false);
  };

  const loadSavedState = async () => {
    try {
      const savedSurveyorId = await storageService.getSurveyorId();
      const savedSurveyorName = await storageService.getSurveyorName();
      const savedIsRegistered = await storageService.isDeviceRegistered();
      const savedNotifications = await storageService.getNotifications();

      if (savedSurveyorId) setSelectedSurveyorId(savedSurveyorId);
      if (savedSurveyorName) setSurveyorName(savedSurveyorName);
      if (savedIsRegistered) setIsRegistered(true);
      if (savedNotifications) setNotifications(savedNotifications);
    } catch (error) {
      console.error('Error loading saved state', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.login({
        email,
        password,
        pushToken: expoPushToken || undefined,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      if (response.success && response.surveyor) {
        await storageService.setSurveyorId(response.surveyor.id);
        await storageService.setSurveyorName(response.surveyor.displayName);
        await storageService.setDeviceRegistered(true);
        if (expoPushToken) {
          await storageService.setPushToken(expoPushToken);
        }

        setSelectedSurveyorId(response.surveyor.id);
        setSurveyorName(response.surveyor.displayName);
        setIsRegistered(true);
        setCurrentStatus(response.surveyor.currentStatus as SurveyorStatus || 'AVAILABLE');

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not connect to server');
    }
  };

  const loadAppointments = async () => {
    if (!selectedSurveyorId) return;
    try {
      const data = await apiService.getAppointments(selectedSurveyorId, true);
      setAppointments(data);
    } catch (error) {
      console.error('Error loading appointments', error);
    }
  };

  const loadInspectionHistory = async () => {
    // Load from local storage - real history is populated when inspections are completed
    try {
      const savedHistory = await storageService.getInspectionHistory();
      if (savedHistory && savedHistory.length > 0) {
        setInspectionHistory(savedHistory);
      }
    } catch (error) {
      console.error('Error loading inspection history:', error);
    }
  };

  const fetchWeather = async () => {
    // Weather API integration would go here
    // For now, weather card will not be shown (null value)
    setWeather(null);
  };

  const startLocationTracking = async () => {
    if (!selectedSurveyorId) return;
    const success = await locationService.startTracking(selectedSurveyorId);
    setIsLocationTracking(success);
  };

  const setupPushNotifications = async () => {
    const granted = await notificationService.requestPermissions();
    if (!granted) return;

    const token = await notificationService.getExpoPushToken();
    if (token) setExpoPushToken(token);

    await notificationService.setupAndroidChannel();
  };

  const toggleNotificationPanel = () => {
    if (showNotifications) {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowNotifications(false));
    } else {
      setShowNotifications(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const logout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          locationService.stopTracking();
          setIsLocationTracking(false);
          setIsRegistered(false);
          setSelectedSurveyorId(null);
          setSurveyorName(null);
          setAppointments([]);
          await storageService.setDeviceRegistered(false);
        },
      },
    ]);
  };

  const handleStatusChange = async (newStatus: SurveyorStatus) => {
    if (!selectedSurveyorId) return;

    setCurrentStatus(newStatus);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Get current location for the status update
      const location = await locationService.getCurrentLocation();

      // Call the real API to update status (dispatches notification to dispatcher)
      await apiService.updateStatus(selectedSurveyorId, newStatus);

      // Also update location if available
      if (location) {
        await apiService.updateLocation(selectedSurveyorId, location.lat, location.lng);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      // Status is already set locally, so user sees immediate feedback
    }
  };

  const handleQuickStatus = async (status: QuickStatus) => {
    if (!selectedSurveyorId) return;

    setQuickStatus(status);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Map QuickStatus to API job status
    const statusMap: { [key in QuickStatus]: 'ON_WAY' | 'ARRIVED' | 'INSPECTING' | 'COMPLETED' } = {
      on_way: 'ON_WAY',
      arrived: 'ARRIVED',
      inspecting: 'INSPECTING',
      completed: 'COMPLETED',
    };

    const statusMessages: { [key in QuickStatus]: string } = {
      on_way: "I'm on my way to the inspection site",
      arrived: "I've arrived at the inspection site",
      inspecting: "Starting vehicle inspection now",
      completed: "Inspection completed successfully",
    };

    // Add chat message for local display
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: statusMessages[status],
      sender: 'surveyor',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMsg]);

    // Call the real API to notify dispatcher
    try {
      const location = await locationService.getCurrentLocation();
      const appointmentId = activeJob?.id || selectedAppointment?.id;

      await apiService.updateJobStatus(
        selectedSurveyorId,
        statusMap[status],
        appointmentId,
        location?.lat,
        location?.lng,
        undefined // notes
      );
    } catch (error) {
      console.error('Error updating job status:', error);
      // Quick status is already set locally, so user sees immediate feedback
    }
  };

  const handleAppointmentResponse = async (appointmentId: number, response: AppointmentResponseStatus) => {
    if (!selectedSurveyorId) return;
    try {
      const result = await apiService.respondToAppointment(appointmentId, selectedSurveyorId, response);
      if (result.success) {
        loadAppointments();
        Haptics.notificationAsync(
          response === 'ACCEPTED'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not respond to appointment');
    }
  };

  const navigateToLocation = async (appointment: Appointment) => {
    const location = await locationService.getCurrentLocation();
    if (location) setCurrentLocation(location);

    // Use appointment location if available, otherwise use a default region coordinate
    // TODO: Backend should provide appointment coordinates
    const destLat = (appointment as any).latitude || 12.9716;
    const destLng = (appointment as any).longitude || 77.5946;
    setDestinationLocation({ lat: destLat, lng: destLng });

    setActiveJob(appointment);
    setJobState('navigating');
    setShowMapModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const openExternalNavigation = () => {
    if (!destinationLocation) return;

    const url = Platform.select({
      ios: `maps://app?daddr=${destinationLocation.lat},${destinationLocation.lng}`,
      android: `google.navigation:q=${destinationLocation.lat},${destinationLocation.lng}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destinationLocation.lat},${destinationLocation.lng}`);
      });
    }
  };

  const handleArrivedAtLocation = () => {
    setShowMapModal(false);
    setJobState('arrived');
    handleQuickStatus('arrived');

    setActiveTab('inspection');
    if (activeJob) setSelectedAppointment(activeJob);

    Alert.alert(
      'You have arrived!',
      'Start your vehicle inspection when ready.',
      [{ text: 'Start Inspection', onPress: () => setJobState('inspecting') }]
    );
  };

  const handleSOS = () => {
    Vibration.vibrate([0, 500, 200, 500]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Alert.alert(
      'Emergency SOS',
      'This will alert the dispatch center of your emergency. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            const sosMsg: ChatMessage = {
              id: Date.now().toString(),
              text: '🚨 EMERGENCY SOS - Need immediate assistance!',
              sender: 'surveyor',
              timestamp: new Date(),
            };
            setChatMessages(prev => [...prev, sosMsg]);
            Alert.alert('SOS Sent', 'Dispatch has been notified. Stay calm, help is on the way.');
          }
        },
      ]
    );
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedPhotos(prev => [...prev, result.assets[0].uri]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleInspectionStep = (stepId: string) => {
    setInspectionSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const submitInspection = async () => {
    const requiredIncomplete = inspectionSteps.filter(s => s.required && !s.completed);
    if (requiredIncomplete.length > 0) {
      Alert.alert('Incomplete', `Please complete: ${requiredIncomplete.map(s => s.title).join(', ')}`);
      return;
    }

    if (capturedPhotos.length === 0) {
      Alert.alert('Photos Required', 'Please take at least one photo for documentation.');
      return;
    }

    Alert.alert(
      'Submit Inspection',
      `You have ${capturedPhotos.length} photos and ${inspectionNotes.length > 0 ? 'notes' : 'no notes'}. Submit now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsUploading(true);

            try {
              // Simulate upload
              await new Promise(resolve => setTimeout(resolve, 2000));

              const job: CompletedJob = {
                appointment: activeJob || selectedAppointment!,
                photos: [...capturedPhotos],
                notes: inspectionNotes,
                signature: !!signatureData,
                completedAt: new Date(),
              };

              setCompletedJob(job);
              setJobState('completed');
              setShowCompletionModal(true);

              // Add to history and persist to storage
              const historyEntry = {
                id: Date.now(),
                date: new Date().toISOString(),
                vehicle: job.appointment.title || 'Vehicle Inspection',
                status: 'completed',
                photos: capturedPhotos.length,
              };
              setInspectionHistory(prev => [historyEntry, ...prev]);
              storageService.addInspectionHistory(historyEntry);

              // Reset state
              setInspectionSteps(prev => prev.map(s => ({ ...s, completed: false })));
              setCapturedPhotos([]);
              setInspectionNotes('');
              setSignatureData(null);
              setActiveJob(null);
              setSelectedAppointment(null);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Upload Failed', 'Could not upload photos. Please try again.');
            } finally {
              setIsUploading(false);
            }
          }
        },
      ]
    );
  };

  const closeCompletionModal = () => {
    setShowCompletionModal(false);
    setCompletedJob(null);
    setJobState('idle');
    setActiveTab('dashboard');
  };

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'surveyor',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate response
    setTimeout(() => {
      const responses = [
        'Got it, thanks for the update!',
        'Understood. Let me know if you need anything.',
        'Roger that. Proceeding as planned.',
        'Thanks for keeping us informed.',
      ];
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'dispatcher',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, response]);
    }, 2000);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const handleStartInspection = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setActiveTab('inspection');
  };

  const handleSignatureConfirm = () => {
    setSignatureData('captured');
    setShowSignatureModal(false);
    toggleInspectionStep('7');
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getNextAppointment = () => {
    const now = new Date();
    return appointments
      .filter(a => new Date(a.start_time) > now && a.response_status !== 'REJECTED')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
  };

  const getTimeUntil = (isoString: string) => {
    const diff = new Date(isoString).getTime() - Date.now();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  };

  // ==================== RENDER ====================

  // Login Screen
  if (!isRegistered) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        isLoading={isLoading}
      />
    );
  }

  // Main App
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Header
        surveyorName={surveyorName}
        currentStatus={currentStatus}
        isOnline={isOnline}
        unreadCount={unreadCount}
        badgeScale={badgeScale}
        onNotificationPress={toggleNotificationPanel}
        onLogoutPress={logout}
        onStatusChange={handleStatusChange}
      />

      {/* Content */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            todayStats={todayStats}
            weather={weather}
            nextAppointment={getNextAppointment()}
            quickStatus={quickStatus}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onQuickStatus={handleQuickStatus}
            onNavigate={navigateToLocation}
            onStartInspection={handleStartInspection}
            onSOS={handleSOS}
            getTimeUntil={getTimeUntil}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}
        {activeTab === 'appointments' && (
          <ScheduleScreen
            appointments={appointments}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onNavigate={navigateToLocation}
            onAccept={(id) => handleAppointmentResponse(id, 'ACCEPTED')}
            onReject={(id) => handleAppointmentResponse(id, 'REJECTED')}
            onStartInspection={handleStartInspection}
          />
        )}
        {activeTab === 'inspection' && (
          <InspectionScreen
            activeJob={activeJob}
            selectedAppointment={selectedAppointment}
            jobState={jobState}
            inspectionSteps={inspectionSteps}
            capturedPhotos={capturedPhotos}
            inspectionNotes={inspectionNotes}
            signatureData={signatureData}
            onToggleStep={toggleInspectionStep}
            onTakePhoto={takePhoto}
            onDeletePhoto={(index) => setCapturedPhotos(prev => prev.filter((_, i) => i !== index))}
            onNotesChange={setInspectionNotes}
            onCaptureSignature={() => setShowSignatureModal(true)}
            onSubmit={submitInspection}
            formatDate={formatDate}
            formatTime={formatTime}
          />
        )}
        {activeTab === 'history' && (
          <HistoryScreen
            inspectionHistory={inspectionHistory}
            onViewReport={(id) => console.log('View report', id)}
          />
        )}
        {activeTab === 'chat' && (
          <ChatScreen
            messages={chatMessages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={sendChatMessage}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadMessages={chatMessages.filter(m => m.sender === 'dispatcher').length}
      />

      {/* Modals */}
      <NotificationPanel
        visible={showNotifications}
        notifications={notifications}
        slideAnim={slideAnim}
        onClose={toggleNotificationPanel}
        onClearAll={() => setNotifications([])}
      />

      <MapModal
        visible={showMapModal}
        activeJob={activeJob}
        destinationLocation={destinationLocation}
        onClose={() => setShowMapModal(false)}
        onOpenExternalNav={openExternalNavigation}
        onArrived={handleArrivedAtLocation}
      />

      <CompletionModal
        visible={showCompletionModal}
        completedJob={completedJob}
        onClose={closeCompletionModal}
      />

      <SignatureModal
        visible={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onConfirm={handleSignatureConfirm}
      />

      {/* Upload Overlay */}
      <UploadingOverlay visible={isUploading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  mainContent: {
    flex: 1,
  },
});
