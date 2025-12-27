import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { CompletedJob } from '../context/AppContext';

interface CompletionModalProps {
  visible: boolean;
  completedJob: CompletedJob | null;
  onClose: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  completedJob,
  onClose,
}) => {
  // Guard against null completedJob or null appointment
  if (!completedJob || !completedJob.appointment) return null;

  const summaryItems = [
    {
      icon: 'car',
      text: completedJob.appointment.title || 'Vehicle Inspection',
    },
    {
      icon: 'camera',
      text: `${completedJob.photos.length} photos uploaded`,
    },
    {
      icon: 'document-text',
      text: completedJob.notes.length > 0 ? 'Notes included' : 'No notes',
    },
    {
      icon: 'create',
      text: completedJob.signature ? 'Signature captured' : 'No signature',
    },
    {
      icon: 'time',
      text: `Completed at ${completedJob.completedAt.toLocaleTimeString()}`,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <LinearGradient colors={gradients.success} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={colors.white} />
            </View>
            <Text style={styles.title}>Job Complete!</Text>
            <Text style={styles.subtitle}>Inspection submitted successfully</Text>
          </LinearGradient>

          {/* Body */}
          <View style={styles.body}>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Summary</Text>
              {summaryItems.map((item, index) => (
                <View key={index} style={styles.summaryRow}>
                  <Ionicons name={item.icon as any} size={20} color={colors.gray[500]} />
                  <Text style={styles.summaryText}>{item.text}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <LinearGradient colors={gradients.primary} style={styles.doneGradient}>
                <Text style={styles.doneText}>Back to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl + spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.sm,
  },
  body: {
    padding: spacing.xl,
  },
  summary: {
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    gap: spacing.md,
  },
  summaryText: {
    fontSize: fontSize.md,
    color: colors.gray[600],
    flex: 1,
  },
  doneButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  doneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  doneText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default CompletionModal;
