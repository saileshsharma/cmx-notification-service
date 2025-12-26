import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const { width } = Dimensions.get('window');

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (signatureBase64: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const signatureRef = useRef<any>(null);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
  };

  const handleConfirm = () => {
    signatureRef.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    // signature is a base64 encoded PNG
    if (signature) {
      // Remove the data URL prefix if present
      const base64Data = signature.replace('data:image/png;base64,', '');
      onConfirm(base64Data);
    }
  };

  const handleEmpty = () => {
    // Show alert that signature is required
  };

  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: ${colors.gray[50]};
      border-radius: ${borderRadius.lg}px;
      width: 100%;
      height: 100%;
      position: relative;
    }
    .m-signature-pad--body {
      border: 2px dashed ${colors.gray[300]};
      border-radius: ${borderRadius.lg}px;
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
    }
    .m-signature-pad--body canvas {
      width: 100% !important;
      height: 100% !important;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      background-color: ${colors.white};
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      touch-action: none;
      -webkit-overflow-scrolling: auto;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    canvas {
      touch-action: none;
      -webkit-touch-callout: none;
    }
    * {
      -webkit-tap-highlight-color: transparent;
    }
  `;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconWrapper}>
                <Ionicons name="create" size={24} color={colors.white} />
              </View>
              <Text style={styles.title}>Owner Signature</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.instruction}>
              Please ask the vehicle owner to sign in the box below to confirm the inspection
            </Text>
          </View>

          {/* Signature Canvas */}
          <View
            style={styles.signatureContainer}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
          >
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleOK}
              onEmpty={handleEmpty}
              onBegin={() => {
                // Signature started - prevents parent scroll interference
              }}
              webStyle={webStyle}
              backgroundColor={colors.gray[50]}
              penColor={colors.gray[900]}
              dotSize={2}
              minWidth={1.5}
              maxWidth={3}
              style={styles.signatureCanvas}
              androidHardwareAccelerationDisabled={false}
              autoClear={false}
              descriptionText=""
              imageType="image/png"
              dataURL=""
              // iOS-specific WebView props for touch handling
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
              nestedScrollEnabled={false}
            />
            <View style={styles.signaturePlaceholder}>
              <Text style={styles.placeholderText}>Sign here</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Ionicons name="refresh" size={20} color={colors.gray[600]} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <LinearGradient
                colors={gradients.success}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                <Text style={styles.confirmText}>Confirm Signature</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Legal Note */}
          <Text style={styles.legalNote}>
            By signing above, the vehicle owner confirms that the inspection has been completed to their satisfaction.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[800],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  instruction: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary,
    lineHeight: 20,
  },
  signatureContainer: {
    height: 220,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  signatureCanvas: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  signaturePlaceholder: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginBottom: spacing.xs,
  },
  signatureLine: {
    width: '80%',
    height: 1,
    backgroundColor: colors.gray[300],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
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
    color: colors.gray[600],
  },
  confirmButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  confirmText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  legalNote: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SignatureModal;
