import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Owner Signature</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.instruction}>
            Please ask the vehicle owner to sign below to confirm the inspection
          </Text>

          <View style={styles.signatureArea}>
            <Ionicons name="create-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.signatureText}>Tap and sign here</Text>
            <Text style={styles.signatureHint}>
              Use your finger to draw signature
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={onClose}>
              <Ionicons name="trash-outline" size={20} color={colors.gray[500]} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Ionicons name="checkmark" size={20} color={colors.white} />
              <Text style={styles.confirmText}>Confirm Signature</Text>
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
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  closeButton: {
    padding: spacing.sm,
  },
  instruction: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  signatureArea: {
    height: 200,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  signatureText: {
    fontSize: fontSize.lg,
    color: colors.gray[400],
    marginTop: spacing.md,
  },
  signatureHint: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginTop: spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    gap: spacing.sm,
  },
  clearText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  confirmText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default SignatureModal;
