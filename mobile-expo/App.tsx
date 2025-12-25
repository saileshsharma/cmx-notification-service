import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem, Appointment, SurveyorStatus, AppointmentResponseStatus } from './src/types';
import { apiService } from './src/services/api';
import { storageService } from './src/services/storage';
import { notificationService, debugLogger } from './src/services/notifications';
import { locationService } from './src/services/location';

const { width } = Dimensions.get('window');

type TabType = 'appointments' | 'debug';

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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('appointments');

  // Notification panel state
  const [showNotifications, setShowNotifications] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;

  // Appointments and status
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentStatus, setCurrentStatus] = useState<SurveyorStatus>('AVAILABLE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  // Animation for notification badge
  const badgeScale = useRef(new Animated.Value(1)).current;

  const unreadCount = notifications.filter(n =>
    Date.now() - n.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
  ).length;

  useEffect(() => {
    const unsubscribe = debugLogger.subscribe((logs) => {
      setDebugLogs(logs);
    });

    initializeApp();

    return () => {
      unsubscribe();
      notificationService.stopListening();
      locationService.stopTracking();
    };
  }, []);

  useEffect(() => {
    if (isRegistered && selectedSurveyorId) {
      loadAppointments();
      startLocationTracking();
    }
  }, [isRegistered, selectedSurveyorId]);

  // Animate badge when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(badgeScale, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [notifications.length]);

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
    debugLogger.log('App initializing...');
    await loadSavedState();
    await setupPushNotifications();

    notificationService.setOnNotificationReceived((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      if (selectedSurveyorId) {
        loadAppointments();
      }
    });
    notificationService.startListening();

    setIsLoading(false);
    debugLogger.log('App initialization complete');
  };

  const loadSavedState = async () => {
    debugLogger.log('Loading saved state...');
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
      debugLogger.error('Error loading saved state', error);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoggingIn(true);
    debugLogger.log(`Attempting login for: ${email}`);

    try {
      const response = await apiService.login({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        pushToken: expoPushToken || undefined,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      if (response.success && response.surveyor) {
        debugLogger.log('Login successful');

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

        Alert.alert('Welcome', `Hello, ${response.surveyor.displayName}!`);
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid email or password');
      }
    } catch (error) {
      debugLogger.error('Login error', error);
      Alert.alert('Error', 'Could not connect to server. Please check your connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadAppointments = async () => {
    if (!selectedSurveyorId) return;

    debugLogger.log('Loading appointments...');
    try {
      const data = await apiService.getAppointments(selectedSurveyorId, true);
      debugLogger.log(`Loaded ${data.length} appointments`);
      setAppointments(data);
    } catch (error) {
      debugLogger.error('Error loading appointments', error);
    }
  };

  const startLocationTracking = async () => {
    if (!selectedSurveyorId) return;
    const success = await locationService.startTracking(selectedSurveyorId);
    setIsLocationTracking(success);
  };

  const setupPushNotifications = async () => {
    debugLogger.log('Setting up push notifications...');

    const granted = await notificationService.requestPermissions();
    if (!granted) {
      debugLogger.log('Push notification permission denied');
      return;
    }

    const token = await notificationService.getExpoPushToken();
    if (token) {
      setExpoPushToken(token);

      const savedToken = await storageService.getPushToken();
      const wasRegistered = await storageService.isDeviceRegistered();
      if (wasRegistered && savedToken !== token) {
        setIsRegistered(false);
        await storageService.setDeviceRegistered(false);
        Alert.alert('Re-registration Required', 'Your push token has changed. Please login again.');
      }
    }

    await notificationService.setupAndroidChannel();
  };

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
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
      ]
    );
  };

  const handleStatusChange = async (newStatus: SurveyorStatus) => {
    setCurrentStatus(newStatus);
    await locationService.updateStatus(newStatus);
  };

  const handleAppointmentResponse = async (appointmentId: number, response: AppointmentResponseStatus) => {
    if (!selectedSurveyorId) return;

    try {
      const result = await apiService.respondToAppointment(appointmentId, selectedSurveyorId, response);
      if (result.success) {
        loadAppointments();
      } else {
        Alert.alert('Error', result.message || 'Failed to respond');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not respond to appointment');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: AppointmentResponseStatus) => {
    switch (status) {
      case 'ACCEPTED': return 'checkmark-circle';
      case 'REJECTED': return 'close-circle';
      default: return 'time';
    }
  };

  const getStatusGradient = (status: AppointmentResponseStatus): [string, string] => {
    switch (status) {
      case 'ACCEPTED': return ['#10B981', '#059669'];
      case 'REJECTED': return ['#EF4444', '#DC2626'];
      default: return ['#F59E0B', '#D97706'];
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CREATED': return 'add-circle';
      case 'RESCHEDULED': return 'calendar';
      case 'DELETED': return 'trash';
      case 'RESPONSE': return 'checkmark-done';
      default: return 'notifications';
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const isPending = appointment.response_status === 'PENDING';

    return (
      <View key={appointment.id} style={styles.appointmentCard}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.cardGradient}
        >
          {/* Status indicator strip */}
          <LinearGradient
            colors={getStatusGradient(appointment.response_status)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusStrip}
          />

          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons
                  name={getStatusIcon(appointment.response_status)}
                  size={20}
                  color={getStatusGradient(appointment.response_status)[0]}
                />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {appointment.title || 'Vehicle Inspection'}
                </Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: getStatusGradient(appointment.response_status)[0] + '20' }]}>
                <Text style={[styles.statusChipText, { color: getStatusGradient(appointment.response_status)[0] }]}>
                  {appointment.response_status}
                </Text>
              </View>
            </View>

            {/* Date and Time */}
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

            {/* Description */}
            {appointment.description && (
              <Text style={styles.cardDescription} numberOfLines={2}>
                {appointment.description}
              </Text>
            )}

            {/* Action Buttons */}
            {isPending && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleAppointmentResponse(appointment.id, 'ACCEPTED')}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Accept</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleAppointmentResponse(appointment.id, 'REJECTED')}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Decline</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderNotificationPanel = () => (
    <Modal
      visible={showNotifications}
      transparent
      animationType="none"
      onRequestClose={toggleNotificationPanel}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={toggleNotificationPanel}
        />
        <Animated.View
          style={[
            styles.notificationPanel,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.notificationPanelContent}
          >
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
                    <View style={[
                      styles.notificationIcon,
                      { backgroundColor: notificationService.getNotificationColor(notification.type) + '20' }
                    ]}>
                      <Ionicons
                        name={getNotificationIcon(notification.type)}
                        size={20}
                        color={notificationService.getNotificationColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationBody} numberOfLines={2}>
                        {notification.body}
                      </Text>
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

  const renderStatusToggle = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusTitle}>Your Status</Text>
      <View style={styles.statusButtonsRow}>
        {(['AVAILABLE', 'BUSY', 'OFFLINE'] as SurveyorStatus[]).map((status) => {
          const isActive = currentStatus === status;
          const colors: { [key: string]: [string, string] } = {
            AVAILABLE: ['#10B981', '#059669'],
            BUSY: ['#F59E0B', '#D97706'],
            OFFLINE: ['#6B7280', '#4B5563'],
          };
          const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
            AVAILABLE: 'checkmark-circle',
            BUSY: 'time',
            OFFLINE: 'moon',
          };

          return (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, isActive && styles.statusButtonActive]}
              onPress={() => handleStatusChange(status)}
            >
              {isActive ? (
                <LinearGradient
                  colors={colors[status]}
                  style={styles.statusButtonGradient}
                >
                  <Ionicons name={icons[status]} size={18} color="#fff" />
                  <Text style={styles.statusButtonTextActive}>{status}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.statusButtonInner}>
                  <Ionicons name={icons[status]} size={18} color="#64748B" />
                  <Text style={styles.statusButtonText}>{status}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {isLocationTracking && (
        <View style={styles.trackingIndicator}>
          <View style={styles.trackingDot} />
          <Text style={styles.trackingText}>GPS Active</Text>
        </View>
      )}
    </View>
  );

  // Login Screen
  if (!isRegistered) {
    return (
      <View style={styles.loginWrapper}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#0F172A', '#1E293B', '#334155']}
          style={styles.loginBackground}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.loginContainer}
          >
            {/* Logo/Branding */}
            <View style={styles.brandingContainer}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.logoContainer}
              >
                <Ionicons name="car-sport" size={40} color="#fff" />
              </LinearGradient>
              <Text style={styles.brandTitle}>SurveyorPro</Text>
              <Text style={styles.brandSubtitle}>Vehicle Inspection App</Text>
            </View>

            {/* Login Card */}
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
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      autoComplete="email"
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
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoggingIn}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.loginButton, (!email || !password) && styles.loginButtonDisabled]}
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

            <Text style={styles.footerText}>
              Use your surveyor credentials to access the app
            </Text>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    );
  }

  // Main App Screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{surveyorName}</Text>
          </View>
          <TouchableOpacity style={styles.bellContainer} onPress={toggleNotificationPanel}>
            <Ionicons name="notifications" size={26} color="#fff" />
            {unreadCount > 0 && (
              <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Status Toggle */}
      {renderStatusToggle()}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
          onPress={() => setActiveTab('appointments')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={activeTab === 'appointments' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
            Appointments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'debug' && styles.activeTab]}
          onPress={() => setActiveTab('debug')}
        >
          <Ionicons
            name="code-slash"
            size={20}
            color={activeTab === 'debug' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'debug' && styles.activeTabText]}>
            Debug
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {activeTab === 'appointments' && (
          <>
            {appointments.length === 0 ? (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={['#E0F2FE', '#DBEAFE']}
                  style={styles.emptyIconContainer}
                >
                  <Ionicons name="calendar-outline" size={48} color="#3B82F6" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No Appointments</Text>
                <Text style={styles.emptySubtitle}>Pull down to refresh</Text>
              </View>
            ) : (
              appointments.map(renderAppointmentCard)
            )}
          </>
        )}

        {activeTab === 'debug' && (
          <View style={styles.debugContainer}>
            <View style={styles.debugHeader}>
              <Text style={styles.debugTitle}>System Logs</Text>
              <View style={styles.tokenBadge}>
                <Ionicons name="key" size={14} color="#F59E0B" />
                <Text style={styles.tokenText}>
                  {expoPushToken ? 'Token Set' : 'No Token'}
                </Text>
              </View>
            </View>
            <ScrollView style={styles.debugLogs}>
              {debugLogs.map((log, index) => (
                <Text key={index} style={styles.debugLogText}>{log}</Text>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Notification Panel */}
      {renderNotificationPanel()}
    </View>
  );
}

const styles = StyleSheet.create({
  // Login Styles
  loginWrapper: {
    flex: 1,
  },
  loginBackground: {
    flex: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  loginInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    marginTop: 24,
  },

  // Main App Styles
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Status Styles
  statusContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusButtonActive: {},
  statusButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  statusButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statusButtonTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  trackingText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },

  // Tab Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Appointment Card Styles
  appointmentCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: 16,
  },
  statusStrip: {
    height: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#64748B',
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  rejectButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
  },

  // Notification Panel
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  notificationPanel: {
    width: width * 0.85,
    maxWidth: 360,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  notificationPanelContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  notificationHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  notificationList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyNotifications: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyNotificationsText: {
    color: '#64748B',
    marginTop: 12,
    fontSize: 14,
  },
  notificationItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#334155',
    borderRadius: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },

  // Debug Styles
  debugContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    overflow: 'hidden',
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tokenText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  debugLogs: {
    padding: 16,
    maxHeight: 400,
  },
  debugLogText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#94A3B8',
    marginBottom: 4,
    lineHeight: 16,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
