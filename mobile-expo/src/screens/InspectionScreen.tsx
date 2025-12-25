import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { InspectionStep, JobState } from '../context/AppContext';
import { Appointment } from '../types';

const { width } = Dimensions.get('window');

interface InspectionScreenProps {
  activeJob: Appointment | null;
  selectedAppointment: Appointment | null;
  jobState: JobState;
  inspectionSteps: InspectionStep[];
  capturedPhotos: string[];
  inspectionNotes: string;
  signatureData: string | null;
  onToggleStep: (stepId: string) => void;
  onTakePhoto: () => void;
  onDeletePhoto: (index: number) => void;
  onNotesChange: (notes: string) => void;
  onCaptureSignature: () => void;
  onSubmit: () => void;
  formatDate: (isoString: string) => string;
  formatTime: (isoString: string) => string;
}

export const InspectionScreen: React.FC<InspectionScreenProps> = ({
  activeJob,
  selectedAppointment,
  jobState,
  inspectionSteps,
  capturedPhotos,
  inspectionNotes,
  signatureData,
  onToggleStep,
  onTakePhoto,
  onDeletePhoto,
  onNotesChange,
  onCaptureSignature,
  onSubmit,
  formatDate,
  formatTime,
}) => {
  const currentJob = activeJob || selectedAppointment;
  const completedSteps = inspectionSteps.filter(s => s.completed).length;
  const progress = (completedSteps / inspectionSteps.length) * 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Active Job Banner */}
      {currentJob ? (
        <View style={[styles.activeJobBanner, shadows.md]}>
          <LinearGradient colors={gradients.primaryDark} style={styles.activeJobGradient}>
            <View style={styles.activeJobContent}>
              <View style={styles.activeJobIcon}>
                <Ionicons name="car" size={24} color={colors.white} />
              </View>
              <View style={styles.activeJobInfo}>
                <Text style={styles.activeJobTitle}>{currentJob.title || 'Vehicle Inspection'}</Text>
                <Text style={styles.activeJobSubtitle}>
                  {formatDate(currentJob.start_time)} • {formatTime(currentJob.start_time)}
                </Text>
              </View>
              <View style={styles.jobStateBadge}>
                <Text style={styles.jobStateBadgeText}>
                  {jobState === 'inspecting' ? 'IN PROGRESS' : jobState.toUpperCase()}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.noJobBanner}>
          <Ionicons name="information-circle" size={24} color={colors.warning} />
          <Text style={styles.noJobText}>Select a job from Schedule to start inspection</Text>
        </View>
      )}

      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.sectionTitle}>Inspection Checklist</Text>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>{completedSteps}/{inspectionSteps.length}</Text>
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
          onPress={() => onToggleStep(step.id)}
        >
          <View style={[styles.checkbox, step.completed && styles.checkboxChecked]}>
            {step.completed && <Ionicons name="checkmark" size={16} color={colors.white} />}
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
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="camera" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Photo Documentation</Text>
          {capturedPhotos.length > 0 && (
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{capturedPhotos.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.photoGrid}>
          {capturedPhotos.map((uri, index) => (
            <View key={index} style={styles.photoThumbnail}>
              <Image source={{ uri }} style={styles.photoImage} />
              <TouchableOpacity
                style={styles.photoDelete}
                onPress={() => onDeletePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addPhotoButton} onPress={onTakePhoto}>
            <View style={styles.addPhotoIconBg}>
              <Ionicons name="camera" size={28} color={colors.primary} />
            </View>
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Inspection Notes</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          placeholder="Add notes about the inspection, damage observations, special conditions..."
          placeholderTextColor={colors.gray[400]}
          multiline
          numberOfLines={4}
          value={inspectionNotes}
          onChangeText={onNotesChange}
        />
      </View>

      {/* Signature Section */}
      <TouchableOpacity style={styles.signatureButton} onPress={onCaptureSignature}>
        <View style={styles.signatureIconBg}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.signatureContent}>
          <Text style={styles.signatureButtonText}>
            {signatureData ? 'Signature Captured' : 'Capture Owner Signature'}
          </Text>
          <Text style={styles.signatureHint}>
            {signatureData ? 'Tap to recapture' : 'Required for report submission'}
          </Text>
        </View>
        {signatureData && (
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        )}
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
        <LinearGradient colors={gradients.success} style={styles.submitGradient}>
          <Ionicons name="cloud-upload" size={24} color={colors.white} />
          <Text style={styles.submitText}>Submit Inspection Report</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.gray[100],
  },
  activeJobBanner: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  activeJobGradient: {
    padding: spacing.lg,
  },
  activeJobContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeJobIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activeJobInfo: {
    flex: 1,
  },
  activeJobTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  activeJobSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  jobStateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  jobStateBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  noJobBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  noJobText: {
    flex: 1,
    fontSize: fontSize.md,
    color: '#92400E',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  progressBarSmall: {
    width: 80,
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  checklistItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  checklistItemCompleted: {
    backgroundColor: '#F0FDF4',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checklistContent: {
    flex: 1,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checklistTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  checklistTitleCompleted: {
    color: colors.success,
  },
  requiredBadge: {
    fontSize: fontSize.xs,
    color: colors.danger,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  checklistDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginLeft: 'auto',
  },
  photoBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoThumbnail: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    height: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoDelete: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  addPhotoButton: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    height: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addPhotoIconBg: {
    marginBottom: spacing.xs,
  },
  addPhotoText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.gray[800],
    textAlignVertical: 'top',
    minHeight: 120,
    ...shadows.sm,
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    ...shadows.sm,
  },
  signatureIconBg: {
    width: 48,
    height: 48,
    backgroundColor: colors.gray[100],
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  signatureContent: {
    flex: 1,
  },
  signatureButtonText: {
    fontSize: fontSize.md,
    color: colors.gray[800],
    fontWeight: fontWeight.medium,
  },
  signatureHint: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  submitButton: {
    marginTop: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  bottomSpacing: {
    height: 120,
  },
});

export default InspectionScreen;
