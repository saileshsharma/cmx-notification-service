import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { Appointment } from '../types';

interface MapModalProps {
  visible: boolean;
  activeJob: Appointment | null;
  destinationLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onOpenExternalNav: () => void;
  onArrived: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({
  visible,
  activeJob,
  destinationLocation,
  onClose,
  onOpenExternalNav,
  onArrived,
}) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={gradients.primaryDark} style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Navigate to Location</Text>
            <Text style={styles.headerSubtitle}>
              {activeJob?.title || 'Vehicle Inspection'}
            </Text>
          </View>
        </LinearGradient>

        {/* Map */}
        {destinationLocation && (
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: destinationLocation.lat,
              longitude: destinationLocation.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            showsTraffic
          >
            <Marker
              coordinate={{
                latitude: destinationLocation.lat,
                longitude: destinationLocation.lng,
              }}
              title={activeJob?.title || 'Inspection Location'}
              description="Destination"
            >
              <View style={styles.markerContainer}>
                <LinearGradient colors={gradients.danger} style={styles.markerGradient}>
                  <Ionicons name="location" size={20} color={colors.white} />
                </LinearGradient>
                <View style={styles.markerPointer} />
              </View>
            </Marker>
          </MapView>
        )}

        {/* Bottom Actions */}
        <View style={[styles.actions, shadows.lg]}>
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="location" size={24} color={colors.primary} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Destination</Text>
              <Text style={styles.infoSubtitle} numberOfLines={2}>
                {activeJob?.description || 'Vehicle inspection location'}
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.externalNavButton} onPress={onOpenExternalNav}>
              <Ionicons name="navigate" size={20} color={colors.primary} />
              <Text style={styles.externalNavText}>Open in Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.arrivedButton} onPress={onArrived}>
              <LinearGradient colors={gradients.success} style={styles.arrivedGradient}>
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <Text style={styles.arrivedText}>I've Arrived</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.danger,
    marginTop: -4,
  },
  actions: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.gray[800],
  },
  infoSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  externalNavButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  externalNavText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  arrivedButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  arrivedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  arrivedText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});

export default MapModal;
