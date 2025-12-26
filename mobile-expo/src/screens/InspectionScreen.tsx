import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
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
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const getStepIcon = (step: InspectionStep, index: number) => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      '1': 'car-sport',       // Vehicle Identification
      '2': 'document-text',   // Document Verification
      '3': 'color-palette',   // Body & Paint
      '4': 'bulb',            // Glass & Lights
      '5': 'ellipse',         // Tires & Wheels
      '6': 'shirt',           // Interior Condition
      '7': 'speedometer',     // Dashboard & Controls
      '8': 'analytics',       // Odometer & Service
      '9': 'settings',        // Engine Bay
      '10': 'cog',            // Transmission
      '11': 'disc',           // Brakes & Suspension
      '12': 'construct',      // Undercarriage
      '13': 'shield-checkmark', // Safety Equipment
      '14': 'navigate',       // Road Test
      '15': 'camera',         // Photo Documentation
      '16': 'create',         // Owner Signature
    };
    return icons[step.id] || 'checkmark-circle';
  };

  return (
    <View style={styles.container}>
      {/* Professional Header with Progress */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        {currentJob ? (
          <>
            <View style={styles.headerTop}>
              <View style={styles.jobBadge}>
                <Ionicons name="briefcase" size={14} color={colors.white} />
                <Text style={styles.jobBadgeText}>ACTIVE INSPECTION</Text>
              </View>
              <View style={[styles.statusIndicator, jobState === 'inspecting' && styles.statusActive]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{jobState === 'inspecting' ? 'In Progress' : jobState}</Text>
              </View>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentJob.title || 'Vehicle Inspection'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {formatDate(currentJob.start_time)} at {formatTime(currentJob.start_time)}
            </Text>

            {/* Progress Ring */}
            <View style={styles.progressContainer}>
              <View style={styles.progressRing}>
                <View style={styles.progressCircle}>
                  <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                  <Text style={styles.progressLabel}>Complete</Text>
                </View>
              </View>
              <View style={styles.progressStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{completedSteps}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{inspectionSteps.length - completedSteps}</Text>
                  <Text style={styles.statLabel}>Remaining</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{capturedPhotos.length}</Text>
                  <Text style={styles.statLabel}>Photos</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noJobContainer}>
            <View style={styles.noJobIcon}>
              <Ionicons name="clipboard-outline" size={32} color={colors.gray[400]} />
            </View>
            <Text style={styles.noJobTitle}>No Active Inspection</Text>
            <Text style={styles.noJobSubtitle}>Select a job from your schedule to begin</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Inspection Steps - Professional Stepper */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Inspection Checklist</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{completedSteps}/{inspectionSteps.length}</Text>
            </View>
          </View>

          <View style={styles.stepperContainer}>
            {inspectionSteps.map((step, index) => {
              const isExpanded = expandedStep === step.id;
              const isLast = index === inspectionSteps.length - 1;

              return (
                <View key={step.id} style={styles.stepWrapper}>
                  {/* Step Timeline */}
                  <View style={styles.stepTimeline}>
                    <TouchableOpacity
                      style={[
                        styles.stepCircle,
                        step.completed && styles.stepCircleCompleted,
                        !step.completed && step.required && styles.stepCircleRequired,
                      ]}
                      onPress={() => onToggleStep(step.id)}
                    >
                      {step.completed ? (
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      ) : (
                        <Ionicons name={getStepIcon(step, index)} size={16} color={step.required ? colors.warning : colors.gray[400]} />
                      )}
                    </TouchableOpacity>
                    {!isLast && (
                      <View style={[styles.stepLine, step.completed && styles.stepLineCompleted]} />
                    )}
                  </View>

                  {/* Step Content */}
                  <TouchableOpacity
                    style={[styles.stepCard, step.completed && styles.stepCardCompleted]}
                    onPress={() => setExpandedStep(isExpanded ? null : step.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.stepCardHeader}>
                      <View style={styles.stepCardLeft}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.stepInfo}>
                          <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted]}>
                            {step.title}
                          </Text>
                          {step.required && !step.completed && (
                            <View style={styles.requiredTag}>
                              <Text style={styles.requiredTagText}>Required</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.stepCheckbox, step.completed && styles.stepCheckboxChecked]}
                        onPress={() => onToggleStep(step.id)}
                      >
                        {step.completed && <Ionicons name="checkmark" size={14} color={colors.white} />}
                      </TouchableOpacity>
                    </View>

                    {isExpanded && (
                      <View style={styles.stepCardExpanded}>
                        <Text style={styles.stepDescription}>{step.description}</Text>
                        <TouchableOpacity
                          style={[styles.stepAction, step.completed && styles.stepActionCompleted]}
                          onPress={() => onToggleStep(step.id)}
                        >
                          <Ionicons
                            name={step.completed ? "close-circle" : "checkmark-circle"}
                            size={18}
                            color={step.completed ? colors.gray[500] : colors.success}
                          />
                          <Text style={[styles.stepActionText, step.completed && styles.stepActionTextCompleted]}>
                            {step.completed ? 'Mark Incomplete' : 'Mark Complete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Photo Documentation - Grid Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <View style={styles.sectionIcon}>
                <Ionicons name="images" size={18} color={colors.white} />
              </View>
              <Text style={styles.sectionTitle}>Photo Evidence</Text>
            </View>
            {capturedPhotos.length > 0 && (
              <View style={styles.photoBadge}>
                <Text style={styles.photoBadgeText}>{capturedPhotos.length} captured</Text>
              </View>
            )}
          </View>

          <View style={styles.photoSection}>
            <View style={styles.photoGrid}>
              {capturedPhotos.map((uri, index) => (
                <View key={index} style={styles.photoCard}>
                  <Image source={{ uri }} style={styles.photoImage} />
                  <View style={styles.photoOverlay}>
                    <TouchableOpacity
                      style={styles.photoDeleteBtn}
                      onPress={() => onDeletePhoto(index)}
                    >
                      <Ionicons name="trash" size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.photoIndex}>
                    <Text style={styles.photoIndexText}>{index + 1}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addPhotoCard} onPress={onTakePhoto}>
                <LinearGradient
                  colors={['rgba(0,102,255,0.1)', 'rgba(0,102,255,0.05)']}
                  style={styles.addPhotoGradient}
                >
                  <View style={styles.addPhotoIconWrapper}>
                    <Ionicons name="camera" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                  <Text style={styles.addPhotoHint}>Tap to capture</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notes Section - Professional Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithIcon}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.purple }]}>
                <Ionicons name="document-text" size={18} color={colors.white} />
              </View>
              <Text style={styles.sectionTitle}>Inspector Notes</Text>
            </View>
          </View>

          <View style={styles.notesCard}>
            <TextInput
              style={styles.notesInput}
              placeholder="Document observations, damage details, special conditions, and other relevant findings..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={5}
              value={inspectionNotes}
              onChangeText={onNotesChange}
              textAlignVertical="top"
            />
            <View style={styles.notesFooter}>
              <Ionicons name="information-circle" size={14} color={colors.gray[400]} />
              <Text style={styles.notesHint}>Notes will be included in the final report</Text>
            </View>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signatureCard} onPress={onCaptureSignature}>
            <View style={styles.signatureLeft}>
              <View style={[styles.signatureIconBg, signatureData && styles.signatureIconBgSuccess]}>
                <Ionicons
                  name={signatureData ? "checkmark-circle" : "create"}
                  size={24}
                  color={signatureData ? colors.success : colors.primary}
                />
              </View>
              <View style={styles.signatureInfo}>
                <Text style={styles.signatureTitle}>
                  {signatureData ? 'Signature Captured' : 'Owner Signature'}
                </Text>
                <Text style={styles.signatureSubtitle}>
                  {signatureData ? 'Tap to recapture if needed' : 'Required for report submission'}
                </Text>
              </View>
            </View>
            <View style={styles.signatureArrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Submit Button - Professional CTA */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, completedSteps < inspectionSteps.filter(s => s.required).length && styles.submitButtonDisabled]}
            onPress={onSubmit}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={completedSteps >= inspectionSteps.filter(s => s.required).length ? ['#059669', '#047857'] : ['#9CA3AF', '#6B7280']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="cloud-upload" size={22} color={colors.white} />
              <Text style={styles.submitText}>Submit Inspection Report</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.submitHint}>
            {completedSteps >= inspectionSteps.filter(s => s.required).length
              ? 'All required steps completed. Ready to submit.'
              : `Complete ${inspectionSteps.filter(s => s.required).length - completedSteps} more required step(s) to submit`
            }
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  jobBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  jobBadgeText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusActive: {},
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: colors.gray[400],
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginBottom: spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  progressCircle: {
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  progressLabel: {
    fontSize: 9,
    color: colors.gray[400],
    textTransform: 'uppercase',
  },
  progressStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  noJobContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noJobIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  noJobTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginBottom: 4,
  },
  noJobSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  sectionBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  stepperContainer: {
    paddingLeft: spacing.xs,
  },
  stepWrapper: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  stepTimeline: {
    alignItems: 'center',
    width: 40,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepCircleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepCircleRequired: {
    borderColor: colors.warning,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.gray[200],
    marginTop: 4,
    marginBottom: -4,
  },
  stepLineCompleted: {
    backgroundColor: colors.success,
  },
  stepCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginLeft: spacing.sm,
    ...shadows.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  stepCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderLeftColor: colors.success,
  },
  stepCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray[500],
  },
  stepInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.gray[800],
  },
  stepTitleCompleted: {
    color: colors.success,
  },
  requiredTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredTagText: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: '#92400E',
    textTransform: 'uppercase',
  },
  stepCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheckboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepCardExpanded: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  stepDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  stepAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepActionCompleted: {},
  stepActionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.success,
  },
  stepActionTextCompleted: {
    color: colors.gray[500],
  },
  photoSection: {},
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoCard: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 6,
  },
  photoDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndex: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndexText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  addPhotoCard: {
    width: (width - spacing.lg * 2 - spacing.md * 2) / 3,
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  addPhotoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  addPhotoIconWrapper: {
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  addPhotoHint: {
    fontSize: 9,
    color: colors.gray[400],
    marginTop: 2,
  },
  photoBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  photoBadgeText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  notesInput: {
    padding: spacing.lg,
    fontSize: fontSize.md,
    color: colors.gray[800],
    minHeight: 120,
    lineHeight: 22,
  },
  notesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[50],
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  notesHint: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  signatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  signatureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  signatureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureIconBgSuccess: {
    backgroundColor: colors.success + '15',
  },
  signatureInfo: {},
  signatureTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  signatureSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  signatureArrow: {},
  submitSection: {
    marginBottom: spacing.lg,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
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
    fontWeight: fontWeight.bold,
    flex: 1,
    textAlign: 'center',
  },
  submitHint: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default InspectionScreen;
