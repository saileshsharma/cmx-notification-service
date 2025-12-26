import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const { width, height } = Dimensions.get('window');

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
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleConfirm = () => {
    if (!hasSignature) {
      Alert.alert('Signature Required', 'Please sign in the box before confirming.');
      return;
    }
    signatureRef.current?.readSignature();
  };

  const handleOK = (signature: string) => {
    if (signature) {
      // Remove the data URL prefix if present
      const base64Data = signature.replace('data:image/png;base64,', '');
      onConfirm(base64Data);
    }
  };

  const handleEmpty = () => {
    Alert.alert('Signature Required', 'Please sign in the box before confirming.');
  };

  const handleBegin = () => {
    setHasSignature(true);
  };

  // Simplified web style for better touch handling
  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      background-color: #FFFFFF;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
    .m-signature-pad--body {
      border: none;
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
      touch-action: none !important;
      -webkit-touch-callout: none !important;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      touch-action: none !important;
      -webkit-overflow-scrolling: auto;
      background-color: #FFFFFF;
    }
    * {
      box-sizing: border-box;
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
              Please ask the vehicle owner to sign in the box below using their finger
            </Text>
          </View>

          {/* Signature Canvas Container */}
          <View style={styles.signatureContainer}>
            <View style={styles.signatureBox}>
              <SignatureCanvas
                ref={signatureRef}
                onOK={handleOK}
                onEmpty={handleEmpty}
                onBegin={handleBegin}
                webStyle={webStyle}
                backgroundColor="#FFFFFF"
                penColor="#000000"
                dotSize={3}
                minWidth={2}
                maxWidth={4}
                style={styles.signatureCanvas}
                androidHardwareAccelerationDisabled={false}
                autoClear={false}
                descriptionText=""
                imageType="image/png"
              />
            </View>
            {!hasSignature && (
              <View style={styles.signaturePlaceholder} pointerEvents="none">
                <Ionicons name="finger-print" size={32} color={colors.gray[300]} />
                <Text style={styles.placeholderText}>Sign here with your finger</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Ionicons name="refresh" size={20} color={colors.gray[600]} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, !hasSignature && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
            >
              <LinearGradient
                colors={hasSignature ? gradients.success : [colors.gray[400], colors.gray[500]]}
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
    paddingBottom: Platform.OS === 'ios' ? spacing.xxxl + 20 : spacing.xxxl,
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
    height: 250,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  signatureBox: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  signatureCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  signaturePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.gray[300],
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
  confirmButtonDisabled: {
    opacity: 0.7,
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
