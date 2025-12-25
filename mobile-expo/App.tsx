import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { NotificationItem, Appointment, SurveyorStatus, AppointmentResponseStatus, LoginResponse } from './src/types';
import { apiService } from './src/services/api';
import { storageService } from './src/services/storage';
import { notificationService, debugLogger } from './src/services/notifications';
import { locationService } from './src/services/location';
import { NotificationList } from './src/components/NotificationList';

type TabType = 'appointments' | 'notifications' | 'debug';

export default function App() {
  // Login state
  const [username, setUsername] = useState('');
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

  // New state for appointments and status
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentStatus, setCurrentStatus] = useState<SurveyorStatus>('AVAILABLE');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);

  useEffect(() => {
    // Subscribe to debug logs
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

  // Load appointments when registered
  useEffect(() => {
    if (isRegistered && selectedSurveyorId) {
      loadAppointments();
      startLocationTracking();
    }
  }, [isRegistered, selectedSurveyorId]);

  const initializeApp = async () => {
    debugLogger.log('App initializing...');

    // Load saved state
    await loadSavedState();

    // Setup push notifications
    await setupPushNotifications();

    // Start listening for notifications
    notificationService.setOnNotificationReceived((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
      // Refresh appointments when we receive a notification
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

      debugLogger.log(`Saved surveyor ID: ${savedSurveyorId}`);
      debugLogger.log(`Saved registered: ${savedIsRegistered}`);

      if (savedSurveyorId) setSelectedSurveyorId(savedSurveyorId);
      if (savedSurveyorName) setSurveyorName(savedSurveyorName);
      if (savedIsRegistered) setIsRegistered(true);
      if (savedNotifications) setNotifications(savedNotifications);
    } catch (error) {
      debugLogger.error('Error loading saved state', error);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setIsLoggingIn(true);
    debugLogger.log(`Attempting login for: ${username}`);

    try {
      const response = await apiService.login({
        username: username.trim(),
        password: password.trim(),
        pushToken: expoPushToken || undefined,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      if (response.success && response.surveyor) {
        debugLogger.log('Login successful');

        // Save to storage
        await storageService.setSurveyorId(response.surveyor.id);
        await storageService.setSurveyorName(response.surveyor.displayName);
        await storageService.setDeviceRegistered(true);
        if (expoPushToken) {
          await storageService.setPushToken(expoPushToken);
        }

        // Update state
        setSelectedSurveyorId(response.surveyor.id);
        setSurveyorName(response.surveyor.displayName);
        setIsRegistered(true);
        setCurrentStatus(response.surveyor.currentStatus as SurveyorStatus || 'AVAILABLE');

        Alert.alert('Success', `Welcome, ${response.surveyor.displayName}!`);
      } else {
        debugLogger.log(`Login failed: ${response.message}`);
        Alert.alert('Login Failed', response.message || 'Invalid username or password');
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

    debugLogger.log('Starting location tracking...');
    const success = await locationService.startTracking(selectedSurveyorId);
    setIsLocationTracking(success);
    if (success) {
      debugLogger.log('Location tracking started');
    } else {
      debugLogger.log('Failed to start location tracking');
    }
  };

  const setupPushNotifications = async () => {
    debugLogger.log('Setting up push notifications...');

    const granted = await notificationService.requestPermissions();
    if (!granted) {
      debugLogger.log('Push notification permission denied');
      Alert.alert('Warning', 'Push notification permission denied. You may not receive appointment notifications.');
      return;
    }

    const token = await notificationService.getExpoPushToken();
    if (token) {
      setExpoPushToken(token);
      debugLogger.log(`Token set in state: ${token.substring(0, 30)}...`);

      // Check if token changed and we need to re-register
      const savedToken = await storageService.getPushToken();
      const wasRegistered = await storageService.isDeviceRegistered();
      if (wasRegistered && savedToken !== token) {
        debugLogger.log('Token changed, need to re-register');
        setIsRegistered(false);
        await storageService.setDeviceRegistered(false);
        Alert.alert(
          'Re-registration Required',
          'Your push token has changed. Please register your device again.'
        );
      }
    } else {
      debugLogger.log('FAILED: No token obtained');
    }

    await notificationService.setupAndroidChannel();
  };

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will no longer receive notifications.',
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
            setUsername('');
            setPassword('');
            await storageService.setDeviceRegistered(false);
            debugLogger.log('Logged out');
            Alert.alert('Success', 'Logged out successfully');
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus: SurveyorStatus) => {
    debugLogger.log(`Changing status to: ${newStatus}`);
    setCurrentStatus(newStatus);

    const success = await locationService.updateStatus(newStatus);
    if (success) {
      debugLogger.log('Status updated successfully');
    } else {
      debugLogger.log('Failed to update status');
    }
  };

  const handleAppointmentResponse = async (appointmentId: number, response: AppointmentResponseStatus) => {
    if (!selectedSurveyorId) return;

    debugLogger.log(`Responding to appointment ${appointmentId}: ${response}`);
    try {
      const result = await apiService.respondToAppointment(appointmentId, selectedSurveyorId, response);
      if (result.success) {
        debugLogger.log('Response sent successfully');
        Alert.alert('Success', `Appointment ${response.toLowerCase()}`);
        loadAppointments(); // Refresh the list
      } else {
        Alert.alert('Error', result.message || 'Failed to respond');
      }
    } catch (error) {
      debugLogger.error('Error responding to appointment', error);
      Alert.alert('Error', 'Could not respond to appointment');
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: AppointmentResponseStatus) => {
    switch (status) {
      case 'ACCEPTED':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => (
    <View key={appointment.id} style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentTitle}>{appointment.title || 'Appointment'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.response_status) }]}>
          <Text style={styles.statusBadgeText}>{appointment.response_status}</Text>
        </View>
      </View>
      <Text style={styles.appointmentTime}>
        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
      </Text>
      {appointment.description && (
        <Text style={styles.appointmentDescription}>{appointment.description}</Text>
      )}

      {appointment.response_status === 'PENDING' && (
        <View style={styles.appointmentActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAppointmentResponse(appointment.id, 'ACCEPTED')}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleAppointmentResponse(appointment.id, 'REJECTED')}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStatusToggle = () => (
    <View style={styles.statusToggleContainer}>
      <Text style={styles.statusLabel}>My Status:</Text>
      <View style={styles.statusButtons}>
        {(['AVAILABLE', 'BUSY', 'OFFLINE'] as SurveyorStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              currentStatus === status && styles.statusButtonActive,
              currentStatus === status && {
                backgroundColor:
                  status === 'AVAILABLE' ? '#4CAF50' : status === 'BUSY' ? '#FF9800' : '#9E9E9E',
              },
            ]}
            onPress={() => handleStatusChange(status)}
          >
            <Text
              style={[
                styles.statusButtonText,
                currentStatus === status && styles.statusButtonTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLocationTracking && (
        <Text style={styles.trackingText}>Location tracking active</Text>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
        onPress={() => setActiveTab('appointments')}
      >
        <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
          Appointments
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
        onPress={() => setActiveTab('notifications')}
      >
        <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
          Notifications
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'debug' && styles.activeTab]}
        onPress={() => setActiveTab('debug')}
      >
        <Text style={[styles.tabText, activeTab === 'debug' && styles.activeTabText]}>Debug</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Surveyor Calendar</Text>
        <Text style={styles.headerSubtitle}>
          {isRegistered ? `Logged in as ${surveyorName}` : 'Push Notifications'}
        </Text>
      </View>

      {!isRegistered ? (
        // Login View
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginContainer}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Surveyor Login</Text>

            {isLoading ? (
              <ActivityIndicator size="large" color="#1976D2" />
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoggingIn}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoggingIn}
                />

                <TouchableOpacity
                  style={[styles.registerButton, (!username || !password) && styles.registerButtonDisabled]}
                  onPress={handleLogin}
                  disabled={!username || !password || isLoggingIn}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.registerButtonText}>Login</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.loginHint}>
                  Use your surveyor username and password to login
                </Text>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      ) : (
        // Main App View
        <>
          {/* Status Toggle */}
          {renderStatusToggle()}

          {/* Tabs */}
          {renderTabs()}

          {/* Tab Content */}
          <ScrollView
            style={styles.tabContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
          >
            {activeTab === 'appointments' && (
              <>
                {appointments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No upcoming appointments</Text>
                    <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
                  </View>
                ) : (
                  appointments.map(renderAppointmentCard)
                )}
              </>
            )}

            {activeTab === 'notifications' && (
              <View style={styles.notificationsContainer}>
                <NotificationList notifications={notifications} />
              </View>
            )}

            {activeTab === 'debug' && (
              <View style={styles.debugCard}>
                <Text style={styles.debugTitle}>Debug Logs</Text>
                <Text style={styles.tokenDisplay}>
                  Token: {expoPushToken ? `${expoPushToken.substring(0, 40)}...` : 'NOT SET'}
                </Text>
                {debugLogs.map((log, index) => (
                  <Text key={index} style={styles.debugText}>
                    {log}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Logout Button */}
          <TouchableOpacity style={styles.unregisterButton} onPress={logout}>
            <Text style={styles.unregisterButtonText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Login styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  loginHint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    marginTop: 16,
  },
  // Status Toggle
  statusToggleContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderColor: 'transparent',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  trackingText: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 6,
    textAlign: 'center',
  },
  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1976D2',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  // Appointments
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appointmentDescription: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  appointmentActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  // Notifications
  notificationsContainer: {
    flex: 1,
  },
  // Debug
  debugCard: {
    backgroundColor: '#263238',
    padding: 12,
    borderRadius: 8,
  },
  debugTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tokenDisplay: {
    color: '#FFC107',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 8,
  },
  debugText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
  // Unregister
  unregisterButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  unregisterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
