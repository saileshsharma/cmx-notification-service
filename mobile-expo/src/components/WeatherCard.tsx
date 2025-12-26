import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';
import { Weather } from '../context/AppContext';

interface WeatherCardProps {
  weather: Weather;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const getInspectionAdvice = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return 'Perfect for outdoor inspections';
      case 'cloudy':
        return 'Good conditions for inspections';
      case 'rainy':
      case 'rain':
        return 'Consider postponing outdoor checks';
      default:
        return 'Good for outdoor inspections';
    }
  };

  const getWeatherColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return colors.accent;
      case 'cloudy':
        return colors.cyan;
      case 'rainy':
      case 'rain':
        return colors.purple;
      default:
        return colors.accent;
    }
  };

  const weatherColor = getWeatherColor(weather.condition);

  return (
    <View style={[styles.container, shadows.card]}>
      <LinearGradient
        colors={[colors.card, colors.cardDark]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Weather Icon */}
          <View style={[styles.iconContainer, { backgroundColor: weatherColor + '20' }]}>
            <Ionicons name={weather.icon as any} size={32} color={weatherColor} />
          </View>

          {/* Weather Info */}
          <View style={styles.info}>
            <Text style={styles.temp}>{weather.temp}°C</Text>
            <Text style={styles.condition}>{weather.condition}</Text>
          </View>

          {/* Advice Badge */}
          <View style={styles.adviceContainer}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.advice}>{getInspectionAdvice(weather.condition)}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gradient: {
    padding: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  temp: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  condition: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  adviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  advice: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
    maxWidth: 100,
  },
});

export default WeatherCard;
