import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  Image,
  Linking,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationItem, Appointment, SurveyorStatus, AppointmentResponseStatus } from './src/types';
import { apiService } from './src/services/api';
import { storageService } from './src/services/storage';
import { notificationService, debugLogger } from './src/services/notifications';
import { locationService } from './src/services/location';

const { width, height } = Dimensions.get('window');

// Tab types for bottom navigation
type TabType = 'dashboard' | 'appointments' | 'inspection' | 'history' | 'chat';

// Inspection step type
type InspectionStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
};

// Chat message type
type ChatMessage = {
  id: string;
  text: string;
  sender: 'surveyor' | 'dispatcher';
  timestamp: Date;
};

// Quick status type
type QuickStatus = 'on_way' | 'arrived' | 'inspecting' | 'completed';

export default function App() {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Surveyor state
  const [selectedSurveyorId, setSelectedSurveyorId] = useState<number | null>(null);
  const [surveyorName, setSurveyorName] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Notification panel state
  const [showNotifications, setShowNotifications] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Appointments and status
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentStatus, setCurrentStatus] = useState<SurveyorStatus>('AVAILABLE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  // Dashboard stats
  const [todayStats, setTodayStats] = useState({
    completed: 0,
    pending: 0,
    totalDistance: 0,
    avgTime: 0,
  });

  // Weather state
  const [weather, setWeather] = useState<{ temp: number; condition: string; icon: string } | null>(null);

  // Quick status
  const [quickStatus, setQuickStatus] = useState<QuickStatus | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

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

  // Offline state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  // Animation
  const badgeScale = useRef(new Animated.Value(1)).current;
  const sosScale = useRef(new Animated.Value(1)).current;

  const unreadCount = notifications.filter(n =>
    Date.now() - n.timestamp < 24 * 60 * 60 * 1000
  ).length;

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

  useEffect(() => {
    initializeApp();
    return () => {
      notificationService.stopListening();
      locationService.stopTracking();
    };
  }, []);

  useEffect(() => {
    if (isRegistered && selectedSurveyorId) {
      loadAppointments();
      startLocationTracking();
      loadInspectionHistory();
      fetchWeather();
    }
  }, [isRegistered, selectedSurveyorId]);

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
      totalDistance: Math.round(Math.random() * 50 + 10), // Mock distance
      avgTime: Math.round(Math.random() * 20 + 25), // Mock avg time
    });
  }, [appointments]);

  const fetchWeather = async () => {
    // Mock weather data - in production, use a real weather API
    setWeather({
      temp: 28,
      condition: 'Sunny',
      icon: 'sunny',
    });
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await apiService.login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
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
    } finally {
      setIsLoggingIn(false);
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
    // Mock history data
    setInspectionHistory([
      { id: 1, date: new Date(Date.now() - 86400000), vehicle: 'Toyota Camry 2022', status: 'completed', photos: 12 },
      { id: 2, date: new Date(Date.now() - 172800000), vehicle: 'Honda Civic 2021', status: 'completed', photos: 8 },
      { id: 3, date: new Date(Date.now() - 259200000), vehicle: 'BMW X5 2023', status: 'completed', photos: 15 },
    ]);
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
    if (token) {
      setExpoPushToken(token);
    }

    await notificationService.setupAndroidChannel();
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
          setEmail('');
          setPassword('');
          await storageService.setDeviceRegistered(false);
        },
      },
    ]);
  };

  const handleStatusChange = async (newStatus: SurveyorStatus) => {
    setCurrentStatus(newStatus);
    await locationService.updateStatus(newStatus);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleQuickStatus = async (status: QuickStatus) => {
    setQuickStatus(status);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Send status to dispatcher via chat
    const statusMessages: { [key in QuickStatus]: string } = {
      on_way: "I'm on my way to the inspection site",
      arrived: "I've arrived at the inspection site",
      inspecting: "Starting vehicle inspection now",
      completed: "Inspection completed successfully",
    };

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      text: statusMessages[status],
      sender: 'surveyor',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, newMsg]);
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

  const navigateToLocation = (appointment: Appointment) => {
    // Mock coordinates - in production, get from appointment
    const lat = 12.9716 + Math.random() * 0.1;
    const lng = 77.5946 + Math.random() * 0.1;

    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      });
    }
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

    Alert.alert(
      'Submit Inspection',
      'Are you sure you want to submit this inspection report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            // Reset inspection state
            setInspectionSteps(prev => prev.map(s => ({ ...s, completed: false })));
            setCapturedPhotos([]);
            setInspectionNotes('');
            setSignatureData(null);
            setActiveTab('dashboard');

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Inspection report submitted successfully!');
          }
        },
      ]
    );
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

    // Simulate dispatcher response
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

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getStatusGradient = (status: AppointmentResponseStatus): [string, string] => {
    switch (status) {
      case 'ACCEPTED': return ['#10B981', '#059669'];
      case 'REJECTED': return ['#EF4444', '#DC2626'];
      default: return ['#F59E0B', '#D97706'];
    }
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

  // ==================== RENDER FUNCTIONS ====================

  const renderDashboard = () => {
    const nextAppt = getNextAppointment();
    const completedPercentage = todayStats.completed / (todayStats.completed + todayStats.pending) * 100 || 0;

    return (
      <ScrollView
        style={styles.dashboardContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        {/* Weather Card */}
        {weather && (
          <View style={styles.weatherCard}>
            <LinearGradient colors={['#0EA5E9', '#0284C7']} style={styles.weatherGradient}>
              <View style={styles.weatherContent}>
                <Ionicons name={weather.icon as any} size={40} color="#fff" />
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
                  <Text style={styles.weatherCondition}>{weather.condition}</Text>
                </View>
                <Text style={styles.weatherNote}>Good for outdoor inspections</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Today's Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.statGradient}>
                <Text style={styles.statNumber}>{todayStats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statGradient}>
                <Text style={styles.statNumber}>{todayStats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </LinearGradient>
            </View>
            <View style={styles.statCard}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.statGradient}>
                <Text style={styles.statNumber}>{todayStats.totalDistance}</Text>
                <Text style={styles.statLabel}>km traveled</Text>
              </LinearGradient>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Daily Progress</Text>
              <Text style={styles.progressPercentage}>{Math.round(completedPercentage)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={[styles.progressFill, { width: `${completedPercentage}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </View>

        {/* Next Appointment */}
        {nextAppt && (
          <View style={styles.nextAppointmentCard}>
            <Text style={styles.sectionTitle}>Next Inspection</Text>
            <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.nextApptGradient}>
              <View style={styles.nextApptContent}>
                <View style={styles.nextApptHeader}>
                  <View style={styles.countdownBadge}>
                    <Ionicons name="time-outline" size={14} color="#fff" />
                    <Text style={styles.countdownText}>in {getTimeUntil(nextAppt.start_time)}</Text>
                  </View>
                </View>
                <Text style={styles.nextApptTitle}>{nextAppt.title || 'Vehicle Inspection'}</Text>
                <Text style={styles.nextApptTime}>
                  {formatDate(nextAppt.start_time)} at {formatTime(nextAppt.start_time)}
                </Text>
                <View style={styles.nextApptActions}>
                  <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigateToLocation(nextAppt)}
                  >
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={styles.navButtonText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => {
                      setSelectedAppointment(nextAppt);
                      setActiveTab('inspection');
                    }}
                  >
                    <Ionicons name="play" size={18} color="#1E40AF" />
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Quick Status Buttons */}
        <View style={styles.quickStatusSection}>
          <Text style={styles.sectionTitle}>Quick Update</Text>
          <View style={styles.quickStatusGrid}>
            {[
              { key: 'on_way', icon: 'car', label: 'On My Way', color: '#3B82F6' },
              { key: 'arrived', icon: 'location', label: 'Arrived', color: '#10B981' },
              { key: 'inspecting', icon: 'search', label: 'Inspecting', color: '#F59E0B' },
              { key: 'completed', icon: 'checkmark-circle', label: 'Completed', color: '#8B5CF6' },
            ].map(status => (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.quickStatusButton,
                  quickStatus === status.key && { backgroundColor: status.color + '20', borderColor: status.color }
                ]}
                onPress={() => handleQuickStatus(status.key as QuickStatus)}
              >
                <Ionicons name={status.icon as any} size={24} color={quickStatus === status.key ? status.color : '#64748B'} />
                <Text style={[styles.quickStatusLabel, quickStatus === status.key && { color: status.color }]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SOS Button */}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.sosGradient}>
            <Ionicons name="warning" size={24} color="#fff" />
            <Text style={styles.sosText}>Emergency SOS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderAppointments = () => (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
    >
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Appointments</Text>
          <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
        </View>
      ) : (
        appointments.map(appointment => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.cardGradient}>
              <LinearGradient
                colors={getStatusGradient(appointment.response_status)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statusStrip}
              />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {appointment.title || 'Vehicle Inspection'}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: getStatusGradient(appointment.response_status)[0] + '20' }]}>
                    <Text style={[styles.statusChipText, { color: getStatusGradient(appointment.response_status)[0] }]}>
                      {appointment.response_status}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="calendar-outline" size={16} color="#64748B" />
                    <Text style={styles.dateTimeText}>{formatDate(appointment.start_time)}</Text>
                  </View>
                  <View style={styles.dateTimeItem}>
                    <Ionicons name="time-outline" size={16} color="#64748B" />
                    <Text style={styles.dateTimeText}>
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </Text>
                  </View>
                </View>

                {appointment.description && (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {appointment.description}
                  </Text>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigateToLocation(appointment)}
                  >
                    <Ionicons name="navigate-outline" size={18} color="#3B82F6" />
                  </TouchableOpacity>

                  {appointment.response_status === 'PENDING' && (
                    <>
                      <TouchableOpacity
                        style={[styles.responseButton, styles.acceptButton]}
                        onPress={() => handleAppointmentResponse(appointment.id, 'ACCEPTED')}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.responseButton, styles.rejectButton]}
                        onPress={() => handleAppointmentResponse(appointment.id, 'REJECTED')}
                      >
                        <Ionicons name="close" size={18} color="#fff" />
                        <Text style={styles.buttonText}>Decline</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {appointment.response_status === 'ACCEPTED' && (
                    <TouchableOpacity
                      style={[styles.responseButton, styles.startInspectionButton]}
                      onPress={() => {
                        setSelectedAppointment(appointment);
                        setActiveTab('inspection');
                      }}
                    >
                      <Ionicons name="play" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Start Inspection</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </LinearGradient>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderInspection = () => {
    const completedSteps = inspectionSteps.filter(s => s.completed).length;
    const progress = (completedSteps / inspectionSteps.length) * 100;

    return (
      <ScrollView style={styles.inspectionContainer}>
        {/* Progress Header */}
        <View style={styles.inspectionHeader}>
          <Text style={styles.inspectionTitle}>Inspection Checklist</Text>
          <View style={styles.inspectionProgress}>
            <Text style={styles.inspectionProgressText}>{completedSteps}/{inspectionSteps.length}</Text>
            <View style={styles.progressBarSmall}>
              <View style={[styles.progressFillSmall, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>

        {/* Checklist */}
        {inspectionSteps.map(step => (
          <TouchableOpacity
            key={step.id}
            style={[styles.checklistItem, step.completed && styles.checklistItemCompleted]}
            onPress={() => toggleInspectionStep(step.id)}
          >
            <View style={[styles.checkbox, step.completed && styles.checkboxChecked]}>
              {step.completed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.checklistContent}>
              <View style={styles.checklistHeader}>
                <Text style={[styles.checklistTitle, step.completed && styles.checklistTitleCompleted]}>
                  {step.title}
                </Text>
                {step.required && <Text style={styles.requiredBadge}>Required</Text>}
              </View>
              <Text style={styles.checklistDescription}>{step.description}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Photo Documentation</Text>
          <View style={styles.photoGrid}>
            {capturedPhotos.map((uri, index) => (
              <View key={index} style={styles.photoThumbnail}>
                <Image source={{ uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.photoDelete}
                  onPress={() => setCapturedPhotos(prev => prev.filter((_, i) => i !== index))}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={32} color="#3B82F6" />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Inspection Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about the inspection..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={inspectionNotes}
            onChangeText={setInspectionNotes}
          />
        </View>

        {/* Signature Section */}
        <TouchableOpacity
          style={styles.signatureButton}
          onPress={() => setShowSignatureModal(true)}
        >
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
          <Text style={styles.signatureButtonText}>
            {signatureData ? 'Signature Captured ✓' : 'Capture Owner Signature'}
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={submitInspection}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.submitGradient}>
            <Ionicons name="cloud-upload" size={24} color="#fff" />
            <Text style={styles.submitText}>Submit Inspection Report</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderHistory = () => (
    <ScrollView style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Recent Inspections</Text>
      {inspectionHistory.map(item => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.historyIcon}>
            <Ionicons name="document-text" size={24} color="#3B82F6" />
          </View>
          <View style={styles.historyContent}>
            <Text style={styles.historyVehicle}>{item.vehicle}</Text>
            <Text style={styles.historyDate}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </Text>
            <View style={styles.historyMeta}>
              <View style={styles.historyBadge}>
                <Ionicons name="camera" size={12} color="#64748B" />
                <Text style={styles.historyBadgeText}>{item.photos} photos</Text>
              </View>
              <View style={[styles.historyBadge, styles.completedBadge]}>
                <Ionicons name="checkmark" size={12} color="#10B981" />
                <Text style={[styles.historyBadgeText, { color: '#10B981' }]}>Completed</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.viewReportButton}>
            <Ionicons name="eye-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderChat = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={120}
    >
      <View style={styles.chatHeader}>
        <View style={styles.chatAvatar}>
          <Ionicons name="headset" size={24} color="#fff" />
        </View>
        <View>
          <Text style={styles.chatHeaderTitle}>Dispatch Center</Text>
          <Text style={styles.chatHeaderSubtitle}>Online • Responds quickly</Text>
        </View>
      </View>

      <ScrollView style={styles.chatMessages}>
        {chatMessages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.chatBubble,
              msg.sender === 'surveyor' ? styles.chatBubbleSent : styles.chatBubbleReceived
            ]}
          >
            <Text style={[
              styles.chatBubbleText,
              msg.sender === 'surveyor' ? styles.chatBubbleTextSent : styles.chatBubbleTextReceived
            ]}>
              {msg.text}
            </Text>
            <Text style={styles.chatTime}>
              {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.chatInputContainer}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          placeholderTextColor="#94A3B8"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendChatMessage}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderNotificationPanel = () => (
    <Modal visible={showNotifications} transparent animationType="none" onRequestClose={toggleNotificationPanel}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={toggleNotificationPanel} />
        <Animated.View style={[styles.notificationPanel, { transform: [{ translateX: slideAnim }] }]}>
          <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.notificationPanelContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationHeaderText}>Notifications</Text>
              <TouchableOpacity onPress={toggleNotificationPanel}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notificationList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off-outline" size={48} color="#475569" />
                  <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map((notification, index) => (
                  <View key={notification.id || index} style={styles.notificationItem}>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationBody}>{notification.body}</Text>
                      <Text style={styles.notificationTime}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      {[
        { key: 'dashboard', icon: 'home', label: 'Home' },
        { key: 'appointments', icon: 'calendar', label: 'Schedule' },
        { key: 'inspection', icon: 'clipboard', label: 'Inspect' },
        { key: 'history', icon: 'time', label: 'History' },
        { key: 'chat', icon: 'chatbubbles', label: 'Chat' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={styles.navItem}
          onPress={() => {
            setActiveTab(tab.key as TabType);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name={(activeTab === tab.key ? tab.icon : `${tab.icon}-outline`) as any}
            size={24}
            color={activeTab === tab.key ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.navLabel, activeTab === tab.key && styles.navLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Login Screen
  if (!isRegistered) {
    return (
      <View style={styles.loginWrapper}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.loginBackground}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginContainer}>
            <View style={styles.brandingContainer}>
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.logoContainer}>
                <Ionicons name="car-sport" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.brandTitle}>SurveyorPro</Text>
              <Text style={styles.brandSubtitle}>Vehicle Inspection App</Text>
            </View>

            <View style={styles.loginCard}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#3B82F6" />
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.loginInput}
                      placeholder="Email address"
                      placeholderTextColor="#64748B"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!isLoggingIn}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.loginInput}
                      placeholder="Password"
                      placeholderTextColor="#64748B"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      editable={!isLoggingIn}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={!email || !password || isLoggingIn}
                  >
                    <LinearGradient
                      colors={email && password ? ['#3B82F6', '#2563EB'] : ['#475569', '#475569']}
                      style={styles.loginButtonGradient}
                    >
                      {isLoggingIn ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.loginButtonText}>Sign In</Text>
                          <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    );
  }

  // Main App
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{surveyorName}</Text>
          </View>
          <View style={styles.headerRight}>
            {!isOnline && (
              <View style={styles.offlineBadge}>
                <Ionicons name="cloud-offline" size={16} color="#EF4444" />
              </View>
            )}
            <TouchableOpacity style={styles.bellContainer} onPress={toggleNotificationPanel}>
              <Ionicons name="notifications" size={26} color="#fff" />
              {unreadCount > 0 && (
                <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Toggle */}
        <View style={styles.statusRow}>
          {(['AVAILABLE', 'BUSY', 'OFFLINE'] as SurveyorStatus[]).map((status) => {
            const isActive = currentStatus === status;
            const colors: { [key: string]: string } = {
              AVAILABLE: '#10B981', BUSY: '#F59E0B', OFFLINE: '#6B7280',
            };
            return (
              <TouchableOpacity
                key={status}
                style={[styles.statusPill, isActive && { backgroundColor: colors[status] }]}
                onPress={() => handleStatusChange(status)}
              >
                <Text style={[styles.statusPillText, isActive && { color: '#fff' }]}>{status}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'inspection' && renderInspection()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'chat' && renderChat()}
      </View>

      {/* Bottom Navigation */}
      {renderBottomNav()}

      {/* Notification Panel */}
      {renderNotificationPanel()}

      {/* Signature Modal */}
      <Modal visible={showSignatureModal} transparent animationType="slide">
        <View style={styles.signatureModal}>
          <View style={styles.signatureModalContent}>
            <Text style={styles.signatureModalTitle}>Owner Signature</Text>
            <View style={styles.signatureArea}>
              <Text style={styles.signatureAreaText}>Tap here to sign</Text>
            </View>
            <View style={styles.signatureModalButtons}>
              <TouchableOpacity
                style={styles.signatureCancelButton}
                onPress={() => setShowSignatureModal(false)}
              >
                <Text style={styles.signatureCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.signatureConfirmButton}
                onPress={() => {
                  setSignatureData('captured');
                  setShowSignatureModal(false);
                  toggleInspectionStep('7');
                }}
              >
                <Text style={styles.signatureConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Login styles
  loginWrapper: { flex: 1 },
  loginBackground: { flex: 1 },
  loginContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  brandingContainer: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  brandTitle: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  brandSubtitle: { fontSize: 16, color: '#94A3B8', marginTop: 4 },
  loginCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  loginInput: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1E293B' },
  loginButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  loginButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Main container
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellContainer: { position: 'relative', padding: 8 },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logoutIcon: { padding: 8 },
  offlineBadge: { backgroundColor: '#FEE2E2', padding: 6, borderRadius: 8 },
  statusRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  statusPill: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  statusPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  mainContent: { flex: 1 },

  // Dashboard
  dashboardContainer: { flex: 1, padding: 16 },
  weatherCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  weatherGradient: { padding: 16 },
  weatherContent: { flexDirection: 'row', alignItems: 'center' },
  weatherInfo: { marginLeft: 12, flex: 1 },
  weatherTemp: { fontSize: 28, fontWeight: '700', color: '#fff' },
  weatherCondition: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  weatherNote: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  statsContainer: { marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  statGradient: { padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  progressContainer: { marginTop: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: '#64748B' },
  progressPercentage: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  progressBar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  nextAppointmentCard: { marginBottom: 16 },
  nextApptGradient: { borderRadius: 16, padding: 20 },
  nextApptContent: {},
  nextApptHeader: { flexDirection: 'row', marginBottom: 12 },
  countdownBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  countdownText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  nextApptTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  nextApptTime: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  nextApptActions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, borderRadius: 10, gap: 6 },
  navButtonText: { color: '#fff', fontWeight: '600' },
  startButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 10, gap: 6 },
  startButtonText: { color: '#1E40AF', fontWeight: '600' },

  quickStatusSection: { marginBottom: 16 },
  quickStatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickStatusButton: { width: (width - 56) / 2, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  quickStatusLabel: { fontSize: 12, color: '#64748B', marginTop: 8, fontWeight: '500' },

  sosButton: { marginBottom: 20, borderRadius: 12, overflow: 'hidden' },
  sosGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  sosText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Appointments
  content: { flex: 1 },
  contentContainer: { padding: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },

  appointmentCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden', elevation: 3 },
  cardGradient: { borderRadius: 16 },
  statusStrip: { height: 4 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusChipText: { fontSize: 11, fontWeight: '600' },
  dateTimeContainer: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  dateTimeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateTimeText: { fontSize: 13, color: '#64748B' },
  cardDescription: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  cardActions: { flexDirection: 'row', marginTop: 16, gap: 8 },
  actionButton: { padding: 12, backgroundColor: '#EFF6FF', borderRadius: 10 },
  responseButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  acceptButton: { backgroundColor: '#10B981' },
  rejectButton: { backgroundColor: '#EF4444' },
  startInspectionButton: { backgroundColor: '#3B82F6' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Inspection
  inspectionContainer: { flex: 1, padding: 16 },
  inspectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  inspectionTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  inspectionProgress: { alignItems: 'flex-end' },
  inspectionProgressText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  progressBarSmall: { width: 80, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 4 },
  progressFillSmall: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },

  checklistItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  checklistItemCompleted: { backgroundColor: '#F0FDF4' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checklistContent: { flex: 1 },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checklistTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  checklistTitleCompleted: { color: '#10B981' },
  requiredBadge: { fontSize: 10, color: '#EF4444', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  checklistDescription: { fontSize: 12, color: '#64748B', marginTop: 4 },

  photoSection: { marginTop: 24 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoThumbnail: { width: (width - 64) / 3, height: (width - 64) / 3, borderRadius: 12, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoDelete: { position: 'absolute', top: 4, right: 4 },
  addPhotoButton: { width: (width - 64) / 3, height: (width - 64) / 3, backgroundColor: '#EFF6FF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#3B82F6', borderStyle: 'dashed' },
  addPhotoText: { fontSize: 12, color: '#3B82F6', marginTop: 4 },

  notesSection: { marginTop: 24 },
  notesInput: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 14, color: '#1E293B', textAlignVertical: 'top', minHeight: 100 },

  signatureButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginTop: 24, gap: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  signatureButtonText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },

  submitButton: { marginTop: 24, marginBottom: 100, borderRadius: 12, overflow: 'hidden' },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // History
  historyContainer: { flex: 1, padding: 16 },
  historyTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  historyIcon: { width: 48, height: 48, backgroundColor: '#EFF6FF', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyContent: { flex: 1 },
  historyVehicle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  historyDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  historyMeta: { flexDirection: 'row', marginTop: 8, gap: 8 },
  historyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  historyBadgeText: { fontSize: 11, color: '#64748B' },
  completedBadge: { backgroundColor: '#F0FDF4' },
  viewReportButton: { padding: 8 },

  // Chat
  chatContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  chatAvatar: { width: 48, height: 48, backgroundColor: '#3B82F6', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chatHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  chatHeaderSubtitle: { fontSize: 12, color: '#10B981' },
  chatMessages: { flex: 1, padding: 16 },
  chatBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  chatBubbleSent: { backgroundColor: '#3B82F6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  chatBubbleReceived: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  chatBubbleText: { fontSize: 14, lineHeight: 20 },
  chatBubbleTextSent: { color: '#fff' },
  chatBubbleTextReceived: { color: '#1E293B' },
  chatTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4, alignSelf: 'flex-end' },
  chatInputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 },
  chatInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, maxHeight: 100 },
  sendButton: { width: 48, height: 48, backgroundColor: '#3B82F6', borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  // Bottom Nav
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navLabel: { fontSize: 10, color: '#64748B', marginTop: 4 },
  navLabelActive: { color: '#3B82F6', fontWeight: '600' },

  // Notification Panel
  modalOverlay: { flex: 1, flexDirection: 'row' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  notificationPanel: { width: width * 0.85, maxWidth: 360, position: 'absolute', right: 0, top: 0, bottom: 0 },
  notificationPanelContent: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  notificationHeaderText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  notificationList: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  emptyNotifications: { alignItems: 'center', paddingTop: 60 },
  emptyNotificationsText: { color: '#64748B', marginTop: 12 },
  notificationItem: { padding: 12, backgroundColor: '#334155', borderRadius: 12, marginBottom: 12 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  notificationBody: { fontSize: 13, color: '#94A3B8', lineHeight: 18 },
  notificationTime: { fontSize: 11, color: '#64748B', marginTop: 6 },

  // Signature Modal
  signatureModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  signatureModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  signatureModalTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', textAlign: 'center', marginBottom: 16 },
  signatureArea: { height: 200, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  signatureAreaText: { color: '#94A3B8', fontSize: 14 },
  signatureModalButtons: { flexDirection: 'row', marginTop: 24, gap: 12 },
  signatureCancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  signatureCancelText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  signatureConfirmButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center' },
  signatureConfirmText: { fontSize: 16, color: '#fff', fontWeight: '600' },
});
