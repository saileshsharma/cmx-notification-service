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
} from 'react-native';
import { Surveyor, NotificationItem } from './src/types';
import { apiService } from './src/services/api';
import { storageService } from './src/services/storage';
import { notificationService, debugLogger } from './src/services/notifications';
import { SurveyorPicker } from './src/components/SurveyorPicker';
import { NotificationList } from './src/components/NotificationList';

export default function App() {
  const [surveyors, setSurveyors] = useState<Surveyor[]>([]);
  const [selectedSurveyorId, setSelectedSurveyorId] = useState<number | null>(null);
  const [surveyorName, setSurveyorName] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    // Subscribe to debug logs
    const unsubscribe = debugLogger.subscribe((logs) => {
      setDebugLogs(logs);
    });

    initializeApp();

    return () => {
      unsubscribe();
      notificationService.stopListening();
    };
  }, []);

  const initializeApp = async () => {
    debugLogger.log('App initializing...');

    // Load saved state
    await loadSavedState();

    // Load surveyors from API
    await loadSurveyors();

    // Setup push notifications
    await setupPushNotifications();

    // Start listening for notifications
    notificationService.setOnNotificationReceived((notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });
    notificationService.startListening();

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

  const loadSurveyors = async () => {
    debugLogger.log('Loading surveyors from API...');
    try {
      const data = await apiService.getSurveyors();
      debugLogger.log(`Loaded ${data.length} surveyors`);
      setSurveyors(data);
    } catch (error) {
      debugLogger.error('Error loading surveyors', error);
      Alert.alert(
        'Error',
        'Could not connect to server. Make sure the backend is running and you are on the same network.'
      );
    } finally {
      setIsLoading(false);
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

  const handleSurveyorSelect = (id: number | null) => {
    setSelectedSurveyorId(id);
    debugLogger.log(`Surveyor selected: ${id}`);
    if (!isRegistered) {
      const surveyor = surveyors.find((s) => s.id === id);
      if (surveyor) {
        setSurveyorName(surveyor.display_name);
      }
    }
  };

  const registerDevice = async () => {
    debugLogger.log('Register device button pressed');
    debugLogger.log(`Selected surveyor: ${selectedSurveyorId}`);
    debugLogger.log(`Current token: ${expoPushToken ? expoPushToken.substring(0, 30) + '...' : 'NONE'}`);

    if (!selectedSurveyorId) {
      Alert.alert('Error', 'Please select a surveyor first');
      return;
    }

    if (!expoPushToken) {
      debugLogger.log('ERROR: Token is empty or null');
      Alert.alert('Error', 'Push token not available. Please check debug logs below.');
      return;
    }

    setIsLoading(true);
    debugLogger.log('Calling API to register device...');
    try {
      const response = await apiService.registerDevice({
        surveyorId: selectedSurveyorId,
        token: expoPushToken,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });

      debugLogger.log(`API response: ${JSON.stringify(response)}`);

      if (response.ok || response.success) {
        await storageService.setSurveyorId(selectedSurveyorId);
        await storageService.setSurveyorName(surveyorName || '');
        await storageService.setDeviceRegistered(true);
        await storageService.setPushToken(expoPushToken);

        setIsRegistered(true);
        debugLogger.log('Device registered successfully');
        Alert.alert('Success', 'Device registered successfully! You will now receive appointment notifications.');
      } else {
        debugLogger.log(`Registration failed: ${response.message}`);
        Alert.alert('Error', response.message || 'Failed to register device');
      }
    } catch (error) {
      debugLogger.error('Error registering device', error);
      Alert.alert('Error', 'Could not register device. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const unregisterDevice = async () => {
    Alert.alert(
      'Unregister Device',
      'Are you sure you want to unregister? You will no longer receive notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unregister',
          style: 'destructive',
          onPress: async () => {
            setIsRegistered(false);
            setSelectedSurveyorId(null);
            setSurveyorName(null);
            await storageService.setDeviceRegistered(false);
            debugLogger.log('Device unregistered');
            Alert.alert('Success', 'Device unregistered');
          },
        },
      ]
    );
  };

  const selectedSurveyor = surveyors.find((s) => s.id === selectedSurveyorId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Surveyor Calendar</Text>
        <Text style={styles.headerSubtitle}>Push Notifications</Text>
        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => setShowDebug(!showDebug)}
        >
          <Text style={styles.debugToggleText}>
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Panel */}
      {showDebug && (
        <View style={styles.debugCard}>
          <Text style={styles.debugTitle}>Debug Logs</Text>
          <Text style={styles.tokenDisplay}>
            Token: {expoPushToken ? `${expoPushToken.substring(0, 40)}...` : 'NOT SET'}
          </Text>
          <ScrollView style={styles.debugScroll}>
            {debugLogs.map((log, index) => (
              <Text key={index} style={styles.debugText}>{log}</Text>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Surveyor Selection Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Surveyor</Text>

        {isLoading && surveyors.length === 0 ? (
          <ActivityIndicator size="large" color="#1976D2" />
        ) : (
          <>
            <SurveyorPicker
              surveyors={surveyors}
              selectedId={selectedSurveyorId}
              onSelect={handleSurveyorSelect}
              disabled={isRegistered}
            />

            {isRegistered ? (
              <View style={styles.registeredContainer}>
                <View style={styles.statusCard}>
                  <Text style={styles.registeredText}>
                    Registered as: {surveyorName || selectedSurveyor?.display_name}
                  </Text>
                  <Text style={styles.waitingText}>
                    Waiting for appointment notifications...
                  </Text>
                </View>
                <TouchableOpacity style={styles.unregisterButton} onPress={unregisterDevice}>
                  <Text style={styles.unregisterButtonText}>Unregister</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.registerButton, !selectedSurveyorId && styles.registerButtonDisabled]}
                onPress={registerDevice}
                disabled={!selectedSurveyorId || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Register Device</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Notifications Card - only show if debug is hidden */}
      {!showDebug && (
        <View style={styles.notificationsCard}>
          <Text style={styles.cardTitle}>Notification History</Text>
          <NotificationList notifications={notifications} />
        </View>
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
  debugToggle: {
    position: 'absolute',
    right: 20,
    top: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  debugToggleText: {
    color: '#fff',
    fontSize: 12,
  },
  debugCard: {
    backgroundColor: '#263238',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    maxHeight: 200,
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
  debugScroll: {
    maxHeight: 140,
  },
  debugText: {
    color: '#B0BEC5',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
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
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registeredContainer: {
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
  },
  registeredText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  unregisterButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  unregisterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationsCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
