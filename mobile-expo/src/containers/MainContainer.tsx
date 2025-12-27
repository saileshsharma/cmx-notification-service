/**
 * MainContainer - Main app container with tab navigation
 * Handles all main app screens after authentication
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';

// Context hooks
import { useAuthContext } from '../context/AuthContext';
import { useNetworkContext } from '../context/NetworkContext';
import { useNotificationContext } from '../context/NotificationContext';
import { useAppointmentContext } from '../context/AppointmentContext';
import { useInspectionContext } from '../context/InspectionContext';
import { useLocationContext } from '../context/LocationContext';
import { useChatContext } from '../context/ChatContext';
import { useFeatureFlagContext, FLAGS } from '../context/FeatureFlagContext';

// Screens
import {
  DashboardScreen,
  ScheduleScreen,
  InspectionScreen,
  HistoryScreen,
  ChatScreen,
  ProfileScreen,
} from '../screens';

// Components
import {
  Header,
  BottomNav,
  MapModal,
  CompletionModal,
  SignatureModal,
  NotificationPanel,
  UploadingOverlay,
} from '../components';

// Constants
import { colors } from '../constants/theme';
import { storageService } from '../services/storage';
import { apiService } from '../services/api';

// Types
type TabType = 'dashboard' | 'appointments' | 'inspection' | 'history' | 'chat' | 'profile';

export const MainContainer: React.FC = () => {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [inspectionHistory, setInspectionHistory] = useState<any[]>([]);

  // Context hooks
  const auth = useAuthContext();
  const network = useNetworkContext();
  const notifications = useNotificationContext();
  const appointments = useAppointmentContext();
  const inspection = useInspectionContext();
  const location = useLocationContext();
  const chat = useChatContext();
  const featureFlags = useFeatureFlagContext();

  // Feature flag checks
  const chatEnabled = featureFlags.isEnabled(FLAGS.CHAT_V2);
  const signatureEnabled = featureFlags.isEnabled(FLAGS.SIGNATURE_CAPTURE);
  const locationTrackingEnabled = featureFlags.isEnabled(FLAGS.LIVE_TRACKING);
  const pushNotificationsEnabled = featureFlags.isEnabled(FLAGS.PUSH_NOTIFICATIONS);
  const biometricEnabled = featureFlags.isEnabled(FLAGS.BIOMETRIC_LOGIN);
  const mapEnabled = featureFlags.isEnabled(FLAGS.LIVE_TRACKING);

  // Load inspection history on mount
  useEffect(() => {
    loadInspectionHistory();
  }, []);

  const loadInspectionHistory = async () => {
    try {
      const history = await storageService.getInspectionHistory();
      if (history) setInspectionHistory(history);
    } catch (error) {
      console.error('Error loading inspection history:', error);
    }
  };

  // Handle quick status with chat message
  const handleQuickStatus = useCallback(async (status: any) => {
    await location.handleQuickStatus(status, (msg) => {
      // Add status message to chat
      chat.setNewMessage('');
    });
  }, [location, chat]);

  // Handle signature confirmation
  const handleSignatureConfirm = useCallback((signatureBase64: string) => {
    inspection.setSignatureData(signatureBase64);
    setShowSignatureModal(false);
    inspection.toggleInspectionStep('16'); // Owner Signature step
  }, [inspection]);

  // Handle inspection submission
  const handleSubmitInspection = useCallback(async () => {
    const success = await inspection.submitInspection();
    if (success) {
      setShowCompletionModal(true);
      loadInspectionHistory();
    }
  }, [inspection]);

  // Handle completion modal close
  const handleCloseCompletion = useCallback(() => {
    setShowCompletionModal(false);
    inspection.resetInspection();
    setActiveTab('dashboard');
  }, [inspection]);

  // Handle password change
  const handlePasswordChange = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!auth.surveyorId) return false;
    try {
      const result = await apiService.changePassword(auth.surveyorId, currentPassword, newPassword);
      return result.success;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }, [auth.surveyorId]);

  // Handle start inspection from appointment
  const handleStartInspection = useCallback((appointment: any) => {
    inspection.setSelectedAppointment(appointment);
    setActiveTab('inspection');
  }, [inspection]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <Header
        surveyorName={auth.surveyorName}
        currentStatus={auth.currentStatus}
        isOnline={network.isOnline}
        unreadCount={notifications.unreadCount}
        badgeScale={notifications.badgeScale}
        onNotificationPress={notifications.toggleNotificationPanel}
        onLogoutPress={auth.logout}
        onProfilePress={() => setActiveTab('profile')}
        onStatusChange={auth.updateStatus}
        onSOS={() => location.handleSOS()}
      />

      {/* Content */}
      <View style={styles.mainContent}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            todayStats={appointments.todayStats}
            weather={null}
            nextAppointment={appointments.getNextAppointment() || null}
            quickStatus={location.quickStatus}
            isRefreshing={appointments.isRefreshing}
            onRefresh={appointments.refreshAppointments}
            onQuickStatus={handleQuickStatus}
            onNavigate={location.navigateToLocation}
            onStartInspection={handleStartInspection}
            onSOS={() => location.handleSOS()}
            getTimeUntil={appointments.getTimeUntil}
            formatDate={appointments.formatDate}
            formatTime={appointments.formatTime}
          />
        )}
        {activeTab === 'appointments' && (
          <ScheduleScreen
            appointments={appointments.appointments}
            isRefreshing={appointments.isRefreshing}
            onRefresh={appointments.refreshAppointments}
            onNavigate={location.navigateToLocation}
            onAccept={(id) => appointments.respondToAppointment(id, 'ACCEPTED')}
            onReject={(id) => appointments.respondToAppointment(id, 'REJECTED')}
            onStartInspection={handleStartInspection}
          />
        )}
        {activeTab === 'inspection' && (
          <InspectionScreen
            activeJob={inspection.activeJob}
            selectedAppointment={inspection.selectedAppointment}
            jobState={inspection.jobState}
            inspectionSteps={inspection.inspectionSteps}
            capturedPhotos={inspection.capturedPhotos}
            inspectionNotes={inspection.inspectionNotes}
            signatureData={inspection.signatureData}
            onToggleStep={inspection.toggleInspectionStep}
            onTakePhoto={inspection.takePhoto}
            onDeletePhoto={inspection.deletePhoto}
            onNotesChange={inspection.setInspectionNotes}
            onCaptureSignature={() => setShowSignatureModal(true)}
            onSubmit={handleSubmitInspection}
            formatDate={appointments.formatDate}
            formatTime={appointments.formatTime}
          />
        )}
        {activeTab === 'history' && (
          <HistoryScreen
            inspectionHistory={inspectionHistory}
            onViewReport={(id) => console.log('View report', id)}
          />
        )}
        {activeTab === 'chat' && chatEnabled && (
          <ChatScreen
            messages={chat.chatMessages}
            newMessage={chat.newMessage}
            onMessageChange={chat.handleMessageChange}
            onSendMessage={chat.sendMessage}
            isConnected={chat.chatConnected}
            typingUser={chat.chatTypingUser}
          />
        )}
        {activeTab === 'chat' && !chatEnabled && (
          <View style={styles.disabledFeature}>
            {/* Chat feature is disabled */}
          </View>
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            surveyorName={auth.surveyorName}
            surveyorEmail={auth.surveyorEmail}
            surveyorPhone={auth.surveyorPhone}
            surveyorCode={auth.surveyorCode}
            onPasswordChange={handlePasswordChange}
            biometricSupported={auth.biometricSupported && biometricEnabled}
            biometricEnabled={auth.biometricEnabled}
            onToggleBiometric={biometricEnabled ? auth.toggleBiometricLogin : undefined}
            onLogout={auth.logout}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadMessages={chat.chatUnreadCount}
      />

      {/* Modals */}
      <NotificationPanel
        visible={notifications.showNotifications}
        notifications={notifications.notifications}
        slideAnim={notifications.slideAnim}
        onClose={notifications.toggleNotificationPanel}
        onClearAll={notifications.clearAllNotifications}
      />

      {mapEnabled && (
        <MapModal
          visible={location.showMapModal}
          activeJob={inspection.activeJob}
          destinationLocation={location.destinationLocation}
          onClose={() => location.setShowMapModal(false)}
          onOpenExternalNav={location.openExternalNavigation}
          onArrived={location.handleArrivedAtLocation}
        />
      )}

      <CompletionModal
        visible={showCompletionModal}
        completedJob={inspection.completedJob}
        onClose={handleCloseCompletion}
      />

      {signatureEnabled && (
        <SignatureModal
          visible={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onConfirm={handleSignatureConfirm}
        />
      )}

      {/* Upload Overlay */}
      <UploadingOverlay
        visible={inspection.isUploading}
        progress={inspection.uploadProgress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  mainContent: {
    flex: 1,
  },
  disabledFeature: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
  },
});
