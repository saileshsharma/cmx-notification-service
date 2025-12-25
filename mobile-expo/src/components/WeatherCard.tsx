import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { images } from '../constants/images';
import { Weather } from '../context/AppContext';

interface WeatherCardProps {
  weather: Weather;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const getWeatherImage = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return images.weatherSunny;
      case 'cloudy':
        return images.weatherCloudy;
      case 'rainy':
      case 'rain':
        return images.weatherRainy;
      default:
        return images.weatherSunny;
    }
  };

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

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: getWeatherImage(weather.condition) }}
        style={styles.imageBackground}
        imageStyle={styles.image}
      >
        <LinearGradient
          colors={['rgba(14, 165, 233, 0.85)', 'rgba(2, 132, 199, 0.9)']}
          style={styles.overlay}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name={weather.icon as any} size={48} color={colors.white} />
            </View>
            <View style={styles.info}>
              <Text style={styles.temp}>{weather.temp}°C</Text>
              <Text style={styles.condition}>{weather.condition}</Text>
            </View>
            <View style={styles.adviceContainer}>
              <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.advice}>{getInspectionAdvice(weather.condition)}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    height: 120,
  },
  imageBackground: {
    flex: 1,
  },
  image: {
    borderRadius: borderRadius.lg,
  },
  overlay: {
    flex: 1,
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  temp: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  condition: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  adviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  advice: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: fontWeight.medium,
  },
});

export default WeatherCard;
