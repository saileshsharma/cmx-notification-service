/**
 * useInspection Hook - Inspection workflow logic
 * Handles inspection steps, photos, notes, signature, and submission
 */
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { imageUploadService, UploadProgress } from '../services/imageUpload';
import { storageService } from '../services/storage';
import { Appointment } from '../types';
import { logger } from '../utils/logger';

export type JobState = 'idle' | 'navigating' | 'arrived' | 'inspecting' | 'completed';

export interface InspectionStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface CompletedJob {
  appointment: Appointment;
  photos: string[];
  notes: string;
  signature: boolean;
  completedAt: Date;
}

// Default inspection steps - Enterprise-level checklist
const DEFAULT_INSPECTION_STEPS: InspectionStep[] = [
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
];

export interface UseInspectionReturn {
  // State
  jobState: JobState;
  activeJob: Appointment | null;
  selectedAppointment: Appointment | null;
  inspectionSteps: InspectionStep[];
  capturedPhotos: string[];
  inspectionNotes: string;
  signatureData: string | null;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  completedJob: CompletedJob | null;

  // Actions
  setJobState: (state: JobState) => void;
  setActiveJob: (job: Appointment | null) => void;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  toggleInspectionStep: (stepId: string) => void;
  takePhoto: () => Promise<void>;
  deletePhoto: (index: number) => void;
  setInspectionNotes: (notes: string) => void;
  setSignatureData: (data: string | null) => void;
  submitInspection: () => Promise<boolean>;
  resetInspection: () => void;
  setCompletedJob: (job: CompletedJob | null) => void;

  // Helpers
  getRequiredIncomplete: () => InspectionStep[];
  getCompletionPercentage: () => number;
}

export function useInspection(): UseInspectionReturn {
  const [jobState, setJobState] = useState<JobState>('idle');
  const [activeJob, setActiveJob] = useState<Appointment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [inspectionSteps, setInspectionSteps] = useState<InspectionStep[]>(DEFAULT_INSPECTION_STEPS);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [completedJob, setCompletedJob] = useState<CompletedJob | null>(null);

  const toggleInspectionStep = useCallback((stepId: string) => {
    setInspectionSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const takePhoto = useCallback(async () => {
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
  }, []);

  const deletePhoto = useCallback((index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getRequiredIncomplete = useCallback((): InspectionStep[] => {
    return inspectionSteps.filter(s => s.required && !s.completed);
  }, [inspectionSteps]);

  const getCompletionPercentage = useCallback((): number => {
    const required = inspectionSteps.filter(s => s.required);
    if (required.length === 0) return 0;
    const completed = required.filter(s => s.completed);
    return Math.round((completed.length / required.length) * 100);
  }, [inspectionSteps]);

  const submitInspection = useCallback(async (): Promise<boolean> => {
    const requiredIncomplete = getRequiredIncomplete();
    if (requiredIncomplete.length > 0) {
      Alert.alert('Incomplete', `Please complete: ${requiredIncomplete.map(s => s.title).join(', ')}`);
      return false;
    }

    if (capturedPhotos.length === 0) {
      Alert.alert('Photos Required', 'Please take at least one photo for documentation.');
      return false;
    }

    return new Promise((resolve) => {
      Alert.alert(
        'Submit Inspection',
        `You have ${capturedPhotos.length} photos${signatureData ? ' and signature' : ''}${inspectionNotes.length > 0 ? ' and notes' : ''}. Upload and submit now?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Submit',
            onPress: async () => {
              setIsUploading(true);
              setUploadProgress({ uploaded: 0, total: capturedPhotos.length + (signatureData ? 1 : 0), percentage: 0, status: 'uploading' });

              try {
                const uploadResult = await imageUploadService.uploadInspectionData(
                  capturedPhotos,
                  signatureData || undefined,
                  (progress) => setUploadProgress(progress)
                );

                if (uploadResult.errors.length > 0) {
                  logger.warn('Some uploads failed:', uploadResult.errors);
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

                // Add to history
                const historyEntry = {
                  id: Date.now(),
                  date: new Date().toISOString(),
                  vehicle: job.appointment.title || 'Vehicle Inspection',
                  status: 'completed',
                  photos: capturedPhotos.length,
                  photoUrls: uploadResult.photoUrls,
                  signatureUrl: uploadResult.signatureUrl,
                };
                storageService.addInspectionHistory(historyEntry);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                resolve(true);
              } catch (error) {
                logger.error('Upload error:', error);
                Alert.alert('Upload Failed', 'Could not upload photos. Please check your connection and try again.');
                resolve(false);
              } finally {
                setIsUploading(false);
                setUploadProgress(null);
              }
            }
          },
        ]
      );
    });
  }, [capturedPhotos, signatureData, inspectionNotes, activeJob, selectedAppointment, getRequiredIncomplete]);

  const resetInspection = useCallback(() => {
    setInspectionSteps(DEFAULT_INSPECTION_STEPS);
    setCapturedPhotos([]);
    setInspectionNotes('');
    setSignatureData(null);
    setActiveJob(null);
    setSelectedAppointment(null);
    setJobState('idle');
    setCompletedJob(null);
  }, []);

  return {
    jobState,
    activeJob,
    selectedAppointment,
    inspectionSteps,
    capturedPhotos,
    inspectionNotes,
    signatureData,
    isUploading,
    uploadProgress,
    completedJob,
    setJobState,
    setActiveJob,
    setSelectedAppointment,
    toggleInspectionStep,
    takePhoto,
    deletePhoto,
    setInspectionNotes,
    setSignatureData,
    submitInspection,
    resetInspection,
    setCompletedJob,
    getRequiredIncomplete,
    getCompletionPercentage,
  };
}
