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
  AppState,
  AppStateStatus,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Network from 'expo-network';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Types
import { NotificationItem, Appointment, SurveyorStatus, AppointmentResponseStatus, ChatMessage as APIChatMessage, ChatConversation, TypingIndicator } from './src/types';

// Services
import { apiService } from './src/services/api';
import { storageService } from './src/services/storage';
import { notificationService } from './src/services/notifications';
import { locationService } from './src/services/location';
import { imageUploadService, UploadProgress } from './src/services/imageUpload';
import { chatService } from './src/services/chat';

// Screens
import {
  LoginScreen,
  DashboardScreen,
  ScheduleScreen,
  InspectionScreen,
  HistoryScreen,
  ChatScreen,
  ProfileScreen,
} from './src/screens';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

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
type TabType = 'dashboard' | 'appointments' | 'inspection' | 'history' | 'chat' | 'profile';
type QuickStatus = 'on_way' | 'arrived' | 'inspecting' | 'completed';
type JobState = 'idle' | 'navigating' | 'arrived' | 'inspecting' | 'completed';
type AuthScreen = 'welcome' | 'login' | 'register';

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
  const [authScreen, setAuthScreen] = useState<AuthScreen>('welcome');
  const [selectedSurveyorId, setSelectedSurveyorId] = useState<number | null>(null);
  const [surveyorName, setSurveyorName] = useState<string | null>(null);
  const [surveyorEmail, setSurveyorEmail] = useState<string | null>(null);
  const [surveyorPhone, setSurveyorPhone] = useState<string | null>(null);
  const [surveyorCode, setSurveyorCode] = useState<string | null>(null);
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

  // Inspection state - Enterprise-level checklist
  const [inspectionSteps, setInspectionSteps] = useState<InspectionStep[]>([
    // Vehicle Identification
    { id: '1', title: 'Vehicle Identification', description: 'Verify VIN matches documents, check registration validity, confirm owner identity with ID', completed: false, required: true },
    { id: '2', title: 'Document Verification', description: 'Insurance certificate, service history, MOT/roadworthiness certificate, ownership papers', completed: false, required: true },

    // Exterior Inspection
    { id: '3', title: 'Body & Paint Condition', description: 'Check for dents, scratches, rust, misaligned panels, repaint evidence, hail damage', completed: false, required: true },
    { id: '4', title: 'Glass & Lights', description: 'Windshield chips/cracks, all windows, headlights, tail lights, indicators, fog lights', completed: false, required: true },
    { id: '5', title: 'Tires & Wheels', description: 'Tread depth (min 1.6mm), tire condition, wheel alignment, spare tire, alloy damage', completed: false, required: true },

    // Interior Inspection
    { id: '6', title: 'Interior Condition', description: 'Seats (wear, tears, stains), carpets, headliner, door panels, trim condition', completed: false, required: true },
    { id: '7', title: 'Dashboard & Controls', description: 'All gauges, warning lights, infotainment, A/C, heater, windows, locks, mirrors', completed: false, required: true },
    { id: '8', title: 'Odometer & Service', description: 'Record mileage, check for tampering signs, verify against service records', completed: false, required: true },

    // Mechanical Inspection
    { id: '9', title: 'Engine Bay', description: 'Fluid levels (oil, coolant, brake, power steering), leaks, belts, hoses, battery condition', completed: false, required: true },
    { id: '10', title: 'Transmission & Drivetrain', description: 'Gear shifting, clutch (manual), CV joints, differential, driveshaft', completed: false, required: true },
    { id: '11', title: 'Brakes & Suspension', description: 'Brake pad wear, disc condition, suspension components, shock absorbers, steering play', completed: false, required: true },

    // Undercarriage & Safety
    { id: '12', title: 'Undercarriage Inspection', description: 'Frame/chassis condition, exhaust system, fuel lines, rust, previous accident damage', completed: false, required: false },
    { id: '13', title: 'Safety Equipment', description: 'Seatbelts, airbag indicators, horn, hazard lights, first aid kit, warning triangle', completed: false, required: true },

    // Road Test (if applicable)
    { id: '14', title: 'Road Test', description: 'Engine performance, acceleration, braking, steering, noise/vibration, transmission', completed: false, required: false },

    // Documentation
    { id: '15', title: 'Photo Documentation', description: 'All angles exterior, interior, engine bay, damage close-ups, VIN plate, odometer', completed: false, required: true },
    { id: '16', title: 'Owner Signature', description: 'Get vehicle owner to review findings and sign inspection report', completed: false, required: true },
  ]);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatConnected, setChatConnected] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [chatTypingUser, setChatTypingUser] = useState<string | null>(null);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // History state
  const [inspectionHistory, setInspectionHistory] = useState<any[]>([]);

  // Network state
  const [isOnline, setIsOnline] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  // Biometric authentication state
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAuthenticated, setBiometricAuthenticated] = useState(false);

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
      chatService.disconnect();
    };
  }, []);

  // Load data when registered
  useEffect(() => {
    if (isRegistered && selectedSurveyorId) {
      loadAppointments();
      startLocationTracking();
      loadInspectionHistory();
      fetchWeather();
      initializeChat();
    }
  }, [isRegistered, selectedSurveyorId]);

  // Prompt for biometric authentication when app starts if enabled
  useEffect(() => {
    const promptBiometric = async () => {
      if (isRegistered && biometricEnabled && !biometricAuthenticated && !isLoading) {
        await authenticateWithBiometrics();
      }
    };
    promptBiometric();
  }, [isRegistered, biometricEnabled, isLoading]);

  // Handle app state changes (foreground/background) for iOS
  useEffect(() => {
    const appStateRef = { current: AppState.currentState };

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App came to foreground from background
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground, refreshing chat...');

        // Reconnect WebSocket if needed
        if (selectedSurveyorId && surveyorName && !chatService.isConnected()) {
          chatService.connect(selectedSurveyorId, surveyorName);
        }

        // Refresh messages from server
        if (activeConversationId) {
          try {
            const messages = await chatService.loadMessages(activeConversationId);
            const localMessages: ChatMessage[] = messages.map(m => ({
              id: m.id?.toString() || Date.now().toString(),
              text: m.content,
              sender: m.senderType === 'SURVEYOR' ? 'surveyor' : 'dispatcher',
              timestamp: new Date(m.sentAt),
            }));
            setChatMessages(localMessages.reverse());
          } catch (error) {
            console.error('Failed to refresh messages on foreground:', error);
          }
        }

        // Refresh unread count
        chatService.getUnreadCount();
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [selectedSurveyorId, surveyorName, activeConversationId]);

  // Refresh messages when switching to chat tab and poll periodically when on chat screen
  useEffect(() => {
    if (activeTab === 'chat' && activeConversationId) {
      console.log('Entered chat tab, refreshing messages...');

      const refreshMessages = async () => {
        try {
          const messages = await chatService.loadMessages(activeConversationId);
          const localMessages: ChatMessage[] = messages.map(m => ({
            id: m.id?.toString() || Date.now().toString(),
            text: m.content,
            sender: m.senderType === 'SURVEYOR' ? 'surveyor' : 'dispatcher',
            timestamp: new Date(m.sentAt),
          }));
          setChatMessages(localMessages.reverse());
        } catch (error) {
          console.error('Failed to refresh chat messages:', error);
        }
      };

      // Initial refresh
      refreshMessages();

      // Poll every 3 seconds when on chat screen (in case WebSocket isn't working)
      const pollInterval = setInterval(refreshMessages, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [activeTab, activeConversationId]);

  // Initialize chat service
  const initializeChat = () => {
    if (!selectedSurveyorId || !surveyorName) return;

    // Set up chat event handlers
    chatService.setOnConnection((connected) => {
      setChatConnected(connected);
      console.log('Chat connected:', connected);
    });

    chatService.setOnMessage((message: APIChatMessage) => {
      // Convert API message to local format with unique ID
      const msgId = message.id?.toString() || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const localMessage: ChatMessage = {
        id: msgId,
        text: message.content,
        sender: message.senderType === 'SURVEYOR' ? 'surveyor' : 'dispatcher',
        timestamp: new Date(message.sentAt),
      };

      // Add message only if it doesn't already exist (prevent duplicates)
      setChatMessages(prev => {
        if (prev.some(m => m.id === msgId || (m.text === localMessage.text && m.sender === localMessage.sender && Math.abs(m.timestamp.getTime() - localMessage.timestamp.getTime()) < 5000))) {
          return prev;
        }
        return [...prev, localMessage];
      });

      // Haptic feedback for new message
      if (message.senderType === 'DISPATCHER') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    chatService.setOnConversations((conversations) => {
      setChatConversations(conversations);
    });

    chatService.setOnUnreadCount((count) => {
      setChatUnreadCount(count);
    });

    chatService.setOnTyping((indicator: TypingIndicator) => {
      if (indicator.isTyping && indicator.userType === 'DISPATCHER') {
        setChatTypingUser(indicator.userName);
        // Clear after 3 seconds
        setTimeout(() => setChatTypingUser(null), 3000);
      } else {
        setChatTypingUser(null);
      }
    });

    // Connect to chat
    chatService.connect(selectedSurveyorId, surveyorName);

    // Start/load conversation with dispatcher
    startDispatcherConversation();
  };

  // Start conversation with dispatcher and load messages
  const startDispatcherConversation = async () => {
    try {
      const conversationId = await chatService.startConversation(1); // Dispatcher ID 1
      setActiveConversationId(conversationId);
      chatService.setActiveConversation(conversationId);

      // Load existing messages
      const messages = await chatService.loadMessages(conversationId);
      const localMessages: ChatMessage[] = messages.map(m => ({
        id: m.id?.toString() || Date.now().toString(),
        text: m.content,
        sender: m.senderType === 'SURVEYOR' ? 'surveyor' : 'dispatcher',
        timestamp: new Date(m.sentAt),
      }));
      setChatMessages(localMessages.reverse()); // API returns newest first
    } catch (error) {
      console.error('Failed to start dispatcher conversation:', error);
    }
  };

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
    await checkBiometricSupport();

    notificationService.setOnNotificationReceived((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (selectedSurveyorId) {
        loadAppointments();
      }
    });
    notificationService.startListening();

    setIsLoading(false);

    // Hide splash screen after initialization
    await SplashScreen.hideAsync();
  };

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setBiometricSupported(compatible);

      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (enrolled) {
          // Check if user has enabled biometric login
          const biometricPref = await AsyncStorage.getItem('biometric_enabled');
          setBiometricEnabled(biometricPref === 'true');
        }
      }
    } catch (error) {
      console.error('Error checking biometric support:', error);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Fleet Inspection',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setBiometricAuthenticated(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      } else {
        if (result.error !== 'user_cancel') {
          Alert.alert('Authentication Failed', 'Please try again or use your password.');
        }
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const toggleBiometricLogin = async () => {
    if (!biometricSupported) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }

    if (!biometricEnabled) {
      // Enable biometric - verify first
      const success = await authenticateWithBiometrics();
      if (success) {
        await AsyncStorage.setItem('biometric_enabled', 'true');
        setBiometricEnabled(true);
        Alert.alert('Enabled', 'Biometric login has been enabled.');
      }
    } else {
      // Disable biometric
      await AsyncStorage.setItem('biometric_enabled', 'false');
      setBiometricEnabled(false);
      Alert.alert('Disabled', 'Biometric login has been disabled.');
    }
  };

  const loadSavedState = async () => {
    try {
      // Load notifications only - don't auto-login
      // User must login fresh each time (or use biometric)
      const savedNotifications = await storageService.getNotifications();
      if (savedNotifications) setNotifications(savedNotifications);

      // Check if biometric is enabled (for showing biometric option on login screen)
      const biometricPref = await AsyncStorage.getItem('biometric_enabled');
      setBiometricEnabled(biometricPref === 'true');
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
        // Save all surveyor data to storage
        await storageService.setSurveyorId(response.surveyor.id);
        await storageService.setSurveyorName(response.surveyor.displayName);
        await storageService.setSurveyorEmail(response.surveyor.email || email);
        if (response.surveyor.phone) {
          await storageService.setSurveyorPhone(response.surveyor.phone);
        }
        if (response.surveyor.code) {
          await storageService.setSurveyorCode(response.surveyor.code);
        }
        await storageService.setDeviceRegistered(true);
        if (expoPushToken) {
          await storageService.setPushToken(expoPushToken);
        }

        // Update state with surveyor data
        setSelectedSurveyorId(response.surveyor.id);
        setSurveyorName(response.surveyor.displayName);
        setSurveyorEmail(response.surveyor.email || email);
        setSurveyorPhone(response.surveyor.phone || null);
        setSurveyorCode(response.surveyor.code || null);
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

  const handleBiometricLogin = async (): Promise<boolean> => {
    // Check if we have saved credentials
    const savedSurveyorId = await storageService.getSurveyorId();
    if (!savedSurveyorId) {
      Alert.alert('Not Available', 'Please login with email and password first to enable biometric login.');
      return false;
    }

    // Authenticate with biometrics
    const success = await authenticateWithBiometrics();
    if (success) {
      // Restore saved session
      const savedSurveyorName = await storageService.getSurveyorName();
      const savedSurveyorEmail = await storageService.getSurveyorEmail();
      const savedSurveyorPhone = await storageService.getSurveyorPhone();
      const savedSurveyorCode = await storageService.getSurveyorCode();

      setSelectedSurveyorId(savedSurveyorId);
      setSurveyorName(savedSurveyorName);
      setSurveyorEmail(savedSurveyorEmail);
      setSurveyorPhone(savedSurveyorPhone);
      setSurveyorCode(savedSurveyorCode);
      setIsRegistered(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    }
    return false;
  };

  const handleRegister = async (data: { name: string; email: string; phone: string; password: string }) => {
    try {
      // Call registration API
      const response = await apiService.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        pushToken: expoPushToken || undefined,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      if (response.success && response.surveyor) {
        // Save surveyor data
        await storageService.setSurveyorId(response.surveyor.id);
        await storageService.setSurveyorName(response.surveyor.displayName);
        await storageService.setSurveyorEmail(data.email);
        await storageService.setSurveyorPhone(data.phone);
        if (response.surveyor.code) {
          await storageService.setSurveyorCode(response.surveyor.code);
        }
        await storageService.setDeviceRegistered(true);

        setSelectedSurveyorId(response.surveyor.id);
        setSurveyorName(response.surveyor.displayName);
        setSurveyorEmail(data.email);
        setSurveyorPhone(data.phone);
        setSurveyorCode(response.surveyor.code || null);
        setIsRegistered(true);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Your account has been created successfully!');
      } else {
        Alert.alert('Registration Failed', response.message || 'Could not create account');
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

    // Add chat message for local display with unique ID
    const newMsg: ChatMessage = {
      id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
              id: `sos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  const handleProfilePress = () => {
    setActiveTab('profile');
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!selectedSurveyorId) return false;
    try {
      const result = await apiService.changePassword(selectedSurveyorId, currentPassword, newPassword);
      return result.success;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
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
      `You have ${capturedPhotos.length} photos${signatureData ? ' and signature' : ''}${inspectionNotes.length > 0 ? ' and notes' : ''}. Upload and submit now?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setIsUploading(true);
            setUploadProgress({ uploaded: 0, total: capturedPhotos.length + (signatureData ? 1 : 0), percentage: 0 });

            try {
              // Upload photos and signature to ImgBB
              const uploadResult = await imageUploadService.uploadInspectionData(
                capturedPhotos,
                signatureData || undefined,
                (progress) => setUploadProgress(progress)
              );

              if (uploadResult.errors.length > 0) {
                console.warn('Some uploads failed:', uploadResult.errors);
              }

              const job: CompletedJob = {
                appointment: activeJob || selectedAppointment!,
                photos: uploadResult.photoUrls.length > 0 ? uploadResult.photoUrls : [...capturedPhotos],
                notes: inspectionNotes,
                signature: !!uploadResult.signatureUrl || !!signatureData,
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
                photoUrls: uploadResult.photoUrls,
                signatureUrl: uploadResult.signatureUrl,
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
              console.error('Upload error:', error);
              Alert.alert('Upload Failed', 'Could not upload photos. Please check your connection and try again.');
            } finally {
              setIsUploading(false);
              setUploadProgress(null);
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

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistically add message to UI with unique ID
    const optimisticMsg: ChatMessage = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: messageText,
      sender: 'surveyor',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Send via WebSocket if connected, otherwise use REST
      if (chatService.isConnected()) {
        chatService.sendMessage(1, 'DISPATCHER', messageText); // Dispatcher ID 1
      } else {
        await chatService.sendMessageRest(1, 'DISPATCHER', messageText);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // Handle typing indicator
  const handleChatMessageChange = (text: string) => {
    setNewMessage(text);
    // Send typing indicator when user is typing
    if (activeConversationId && text.length > 0) {
      chatService.sendTypingIndicator(activeConversationId, true);
    }
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

  const handleSignatureConfirm = (signatureBase64: string) => {
    setSignatureData(signatureBase64);
    setShowSignatureModal(false);
    toggleInspectionStep('7');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // Auth Screens (Welcome → Login/Register)
  if (!isRegistered) {
    // Welcome Screen
    if (authScreen === 'welcome') {
      return (
        <WelcomeScreen
          onLogin={() => setAuthScreen('login')}
          onRegister={() => setAuthScreen('register')}
        />
      );
    }

    // Login Screen
    if (authScreen === 'login') {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setAuthScreen('welcome')}
          onRegister={() => setAuthScreen('register')}
          onBiometricLogin={handleBiometricLogin}
          biometricEnabled={biometricEnabled}
          isLoading={isLoading}
        />
      );
    }

    // Register Screen
    if (authScreen === 'register') {
      return (
        <RegisterScreen
          onRegister={handleRegister}
          onBack={() => setAuthScreen('welcome')}
          onLogin={() => setAuthScreen('login')}
          isLoading={isLoading}
        />
      );
    }
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
        onProfilePress={handleProfilePress}
        onStatusChange={handleStatusChange}
        onSOS={handleSOS}
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
            onMessageChange={handleChatMessageChange}
            onSendMessage={sendChatMessage}
            isConnected={chatConnected}
            typingUser={chatTypingUser}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            surveyorName={surveyorName}
            surveyorEmail={surveyorEmail}
            surveyorPhone={surveyorPhone}
            surveyorCode={surveyorCode}
            onPasswordChange={handlePasswordChange}
            biometricSupported={biometricSupported}
            biometricEnabled={biometricEnabled}
            onToggleBiometric={toggleBiometricLogin}
            onLogout={logout}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadMessages={chatUnreadCount}
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
      <UploadingOverlay visible={isUploading} progress={uploadProgress} />
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
