/**
 * CachedImage - Image component with automatic disk caching
 * Uses expo-image for efficient caching and loading
 */
import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image, ImageProps, ImageContentFit } from 'expo-image';
import { colors } from '../constants/theme';

// Blurhash placeholder for loading state
const PLACEHOLDER_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallbackUri?: string;
  showLoadingIndicator?: boolean;
  blurhash?: string;
  contentFit?: ImageContentFit;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  fallbackUri,
  showLoadingIndicator = true,
  blurhash = PLACEHOLDER_BLURHASH,
  contentFit = 'cover',
  style,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const source = hasError && fallbackUri ? fallbackUri : uri;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={source}
        style={[styles.image, style]}
        contentFit={contentFit}
        placeholder={{ blurhash }}
        transition={200}
        cachePolicy="disk"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        {...props}
      />
      {showLoadingIndicator && isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}
    </View>
  );
};

/**
 * Prefetch images to cache them before they're needed
 */
export const prefetchImages = async (uris: string[]): Promise<void> => {
  try {
    await Promise.all(uris.map(uri => Image.prefetch(uri)));
  } catch (error) {
    console.warn('[CachedImage] Prefetch failed:', error);
  }
};

/**
 * Clear the image cache
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
  } catch (error) {
    console.warn('[CachedImage] Cache clear failed:', error);
  }
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
});

export default CachedImage;
