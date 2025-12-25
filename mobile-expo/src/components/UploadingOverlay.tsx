import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface UploadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
}

export const UploadingOverlay: React.FC<UploadingOverlayProps> = ({
  visible,
  message = 'Uploading photos...',
  subMessage = 'Please wait',
}) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <View style={styles.progressCircle} />
        </View>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.subMessage}>{subMessage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    minWidth: 200,
  },
  spinnerContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  progressCircle: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.gray[200],
  },
  message: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  subMessage: {
    fontSize: fontSize.md,
    color: colors.gray[500],
  },
});

export default UploadingOverlay;
