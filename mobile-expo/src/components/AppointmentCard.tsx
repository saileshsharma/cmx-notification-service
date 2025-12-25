import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { Appointment, AppointmentResponseStatus } from '../types';
import { images } from '../constants/images';

interface AppointmentCardProps {
  appointment: Appointment;
  onNavigate: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onStartInspection?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onNavigate,
  onAccept,
  onReject,
  onStartInspection,
}) => {
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
      case 'ACCEPTED': return gradients.success;
      case 'REJECTED': return gradients.danger;
      default: return gradients.warning;
    }
  };

  const getStatusColor = (status: AppointmentResponseStatus): string => {
    switch (status) {
      case 'ACCEPTED': return colors.success;
      case 'REJECTED': return colors.danger;
      default: return colors.warning;
    }
  };

  return (
    <View style={[styles.container, shadows.md]}>
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={styles.cardGradient}>
        {/* Status Strip with Image */}
        <View style={styles.headerSection}>
          <ImageBackground
            source={{ uri: images.carInspection }}
            style={styles.headerImage}
            imageStyle={styles.headerImageStyle}
          >
            <LinearGradient
              colors={[...getStatusGradient(appointment.response_status), 'rgba(0,0,0,0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerOverlay}
            >
              <View style={styles.statusBadge}>
                <Ionicons
                  name={appointment.response_status === 'ACCEPTED' ? 'checkmark-circle' : appointment.response_status === 'REJECTED' ? 'close-circle' : 'time'}
                  size={14}
                  color={colors.white}
                />
                <Text style={styles.statusText}>{appointment.response_status}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {appointment.title || 'Vehicle Inspection'}
            </Text>
          </View>

          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <View style={styles.iconBg}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              </View>
              <Text style={styles.dateTimeText}>{formatDate(appointment.start_time)}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <View style={styles.iconBg}>
                <Ionicons name="time-outline" size={14} color={colors.primary} />
              </View>
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
            <TouchableOpacity style={styles.actionButton} onPress={onNavigate}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            </TouchableOpacity>

            {appointment.response_status === 'PENDING' && (
              <>
                <TouchableOpacity
                  style={[styles.responseButton, styles.acceptButton]}
                  onPress={onAccept}
                >
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.responseButton, styles.rejectButton]}
                  onPress={onReject}
                >
                  <Ionicons name="close" size={18} color={colors.white} />
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </>
            )}

            {appointment.response_status === 'ACCEPTED' && (
              <TouchableOpacity
                style={[styles.responseButton, styles.startInspectionButton]}
                onPress={onStartInspection}
              >
                <Ionicons name="play" size={18} color={colors.white} />
                <Text style={styles.buttonText}>Start Inspection</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: borderRadius.lg,
  },
  headerSection: {
    height: 80,
    overflow: 'hidden',
  },
  headerImage: {
    flex: 1,
  },
  headerImageStyle: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  headerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardContent: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    flex: 1,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
  },
  responseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  startInspectionButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});

export default AppointmentCard;
