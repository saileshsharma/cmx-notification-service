import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { Appointment, AppointmentResponseStatus } from '../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onNavigate: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onStartInspection?: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = React.memo(({
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

  const getStatusColor = (status: AppointmentResponseStatus): string => {
    switch (status) {
      case 'ACCEPTED': return colors.success;
      case 'REJECTED': return colors.danger;
      case 'COMPLETED': return colors.purple;
      default: return colors.warning;
    }
  };

  const getStatusLabel = (status: AppointmentResponseStatus): string => {
    switch (status) {
      case 'ACCEPTED': return 'Confirmed';
      case 'REJECTED': return 'Declined';
      case 'COMPLETED': return 'Completed';
      default: return 'Pending';
    }
  };

  const statusColor = getStatusColor(appointment.response_status);

  return (
    <View style={[styles.container, shadows.card]}>
      <LinearGradient colors={[colors.card, colors.cardDark]} style={styles.cardGradient}>
        {/* Vehicle Preview / Status Header */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={[statusColor + '20', 'transparent']}
            style={styles.vehiclePreview}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="car-sport" size={32} color={statusColor} />
          </LinearGradient>

          <View style={styles.arrowButton}>
            <Ionicons name="arrow-forward" size={16} color={colors.black} />
          </View>
        </View>

        <View style={styles.cardContent}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons
              name={
                appointment.response_status === 'ACCEPTED' ? 'checkmark-circle' :
                appointment.response_status === 'REJECTED' ? 'close-circle' :
                appointment.response_status === 'COMPLETED' ? 'checkmark-done-circle' : 'time'
              }
              size={12}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(appointment.response_status)}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {appointment.title || 'Vehicle Inspection'}
          </Text>

          {/* Date/Time Row */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.dateTimeText}>{formatDate(appointment.start_time)}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
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

          {/* Actions */}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onNavigate}>
              <Ionicons name="navigate-outline" size={16} color={colors.text.primary} />
            </TouchableOpacity>

            {appointment.response_status === 'PENDING' && (
              <>
                <TouchableOpacity
                  style={[styles.responseButton, styles.acceptButton]}
                  onPress={onAccept}
                >
                  <Ionicons name="checkmark" size={16} color={colors.black} />
                  <Text style={[styles.buttonText, { color: colors.black }]}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.responseButton, styles.rejectButton]}
                  onPress={onReject}
                >
                  <Ionicons name="close" size={16} color={colors.white} />
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </>
            )}

            {appointment.response_status === 'ACCEPTED' && (
              <TouchableOpacity
                style={[styles.responseButton, styles.startInspectionButton]}
                onPress={onStartInspection}
              >
                <LinearGradient
                  colors={gradients.accent}
                  style={styles.startButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="play" size={16} color={colors.black} />
                  <Text style={[styles.buttonText, { color: colors.black }]}>Start</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardGradient: {
    borderRadius: borderRadius.card,
  },
  headerSection: {
    height: 80,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclePreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    padding: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    lineHeight: 18,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: borderRadius.button,
    gap: 4,
    overflow: 'hidden',
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.danger,
  },
  startInspectionButton: {
    backgroundColor: 'transparent',
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});

export default AppointmentCard;
