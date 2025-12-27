/**
 * Image Upload Service - Enhanced with:
 * - Retry logic with exponential backoff
 * - Image compression
 * - Progress tracking
 * - Environment variable configuration
 */
import * as FileSystem from 'expo-file-system/legacy';
import { EncodingType } from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { IMGBB_API_KEY, API_TIMEOUTS, RETRY_CONFIG } from '../config/api';
import { logger } from '../utils/logger';
import { addSentryBreadcrumb, captureException } from '../config/sentry';

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// Compression settings
const COMPRESSION_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'jpeg' as const,
};

// Retry settings for uploads
const UPLOAD_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
};

export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnail?: string;
  deleteUrl?: string;
  error?: string;
  retryCount?: number;
}

export interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
  currentFile?: string;
  status: 'uploading' | 'compressing' | 'retrying' | 'complete' | 'error';
}

class ImageUploadService {
  private apiKey: string;

  constructor() {
    this.apiKey = IMGBB_API_KEY;
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== '';
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    const delay = UPLOAD_RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, UPLOAD_RETRY_CONFIG.maxDelay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Compress image for faster upload and reduced storage
   */
  async compressImage(imageUri: string): Promise<string> {
    try {
      // Get image info to check if compression is needed
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSizeKB = fileInfo.exists ? (fileInfo.size ?? 0) / 1024 : 0;

      // Skip compression for small images (< 500KB)
      if (fileSizeKB < 500) {
        logger.debug('[ImageUpload] Skipping compression for small image', { sizeKB: fileSizeKB });
        return imageUri;
      }

      logger.debug('[ImageUpload] Compressing image', { originalSizeKB: fileSizeKB });

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: COMPRESSION_CONFIG.maxWidth,
              height: COMPRESSION_CONFIG.maxHeight,
            },
          },
        ],
        {
          compress: COMPRESSION_CONFIG.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Log compression results
      const newFileInfo = await FileSystem.getInfoAsync(result.uri);
      const newSizeKB = newFileInfo.exists ? (newFileInfo.size ?? 0) / 1024 : 0;
      logger.debug('[ImageUpload] Compression complete', {
        originalKB: fileSizeKB,
        compressedKB: newSizeKB,
        reduction: fileSizeKB > 0 ? `${Math.round((1 - newSizeKB / fileSizeKB) * 100)}%` : 'N/A',
      });

      return result.uri;
    } catch (error) {
      logger.warn('[ImageUpload] Compression failed, using original', error);
      return imageUri;
    }
  }

  /**
   * Upload a single image to ImgBB with retry logic
   */
  async uploadImage(imageUri: string, name?: string): Promise<UploadResult> {
    if (!this.isConfigured()) {
      logger.error('[ImageUpload] API key not configured');
      return {
        success: false,
        error: 'Image upload service not configured. Please set EXPO_PUBLIC_IMGBB_API_KEY.',
      };
    }

    let lastError = '';
    let retryCount = 0;

    for (let attempt = 0; attempt <= UPLOAD_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        // Compress image before upload (skip on retries to avoid re-compressing)
        const compressedUri = attempt === 0 ? await this.compressImage(imageUri) : imageUri;

        // Read the image file as base64
        const base64 = await FileSystem.readAsStringAsync(compressedUri, {
          encoding: EncodingType.Base64,
        });

        // Create form data
        const formData = new FormData();
        formData.append('key', this.apiKey);
        formData.append('image', base64);
        if (name) {
          formData.append('name', name);
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.upload);

        // Upload to ImgBB
        const response = await fetch(IMGBB_UPLOAD_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const result = await response.json();

        if (result.success) {
          addSentryBreadcrumb({
            category: 'upload',
            message: 'Image uploaded successfully',
            level: 'info',
            data: { name, retryCount },
          });

          return {
            success: true,
            url: result.data.url,
            thumbnail: result.data.thumb?.url || result.data.medium?.url,
            deleteUrl: result.data.delete_url,
            retryCount,
          };
        } else {
          lastError = result.error?.message || 'Upload failed';
          logger.warn('[ImageUpload] Upload failed', { attempt, error: lastError });
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = 'Upload timeout';
        } else {
          lastError = error instanceof Error ? error.message : 'Upload failed';
        }
        logger.warn('[ImageUpload] Upload error', { attempt, error: lastError });
      }

      // Retry if we haven't exhausted attempts
      if (attempt < UPLOAD_RETRY_CONFIG.maxRetries) {
        const delay = this.getRetryDelay(attempt);
        logger.info(`[ImageUpload] Retrying in ${delay}ms (attempt ${attempt + 1}/${UPLOAD_RETRY_CONFIG.maxRetries})`);
        await this.sleep(delay);
        retryCount++;
      }
    }

    // All retries exhausted
    captureException(new Error(`Image upload failed after ${retryCount} retries: ${lastError}`), {
      name,
      retryCount,
    });

    return {
      success: false,
      error: lastError,
      retryCount,
    };
  }

  /**
   * Upload multiple images with progress tracking
   */
  async uploadMultiple(
    imageUris: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const total = imageUris.length;

    for (let i = 0; i < imageUris.length; i++) {
      // Report compression status
      onProgress?.({
        uploaded: i,
        total,
        percentage: Math.round((i / total) * 100),
        currentFile: `Photo ${i + 1}`,
        status: 'compressing',
      });

      const result = await this.uploadImage(imageUris[i], `inspection_photo_${i + 1}`);
      results.push(result);

      // Report upload progress
      onProgress?.({
        uploaded: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        currentFile: `Photo ${i + 1}`,
        status: result.success ? 'uploading' : 'error',
      });
    }

    onProgress?.({
      uploaded: total,
      total,
      percentage: 100,
      status: 'complete',
    });

    return results;
  }

  /**
   * Upload inspection data including photos and signature
   */
  async uploadInspectionData(
    photos: string[],
    signatureBase64?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{
    success: boolean;
    photoUrls: string[];
    signatureUrl?: string;
    errors: string[];
    totalRetries: number;
  }> {
    const errors: string[] = [];
    const photoUrls: string[] = [];
    let signatureUrl: string | undefined;
    let totalRetries = 0;

    const totalItems = photos.length + (signatureBase64 ? 1 : 0);
    let uploadedCount = 0;

    // Handle empty upload case
    if (totalItems === 0) {
      onProgress?.({
        uploaded: 0,
        total: 0,
        percentage: 100,
        status: 'complete',
      });
      return { success: true, photoUrls: [], errors: [], totalRetries: 0 };
    }

    // Upload photos
    for (let i = 0; i < photos.length; i++) {
      onProgress?.({
        uploaded: uploadedCount,
        total: totalItems,
        percentage: Math.round((uploadedCount / totalItems) * 100),
        currentFile: `Photo ${i + 1}`,
        status: 'compressing',
      });

      const result = await this.uploadImage(photos[i], `inspection_photo_${Date.now()}_${i}`);
      totalRetries += result.retryCount || 0;

      if (result.success && result.url) {
        photoUrls.push(result.url);
      } else {
        errors.push(`Photo ${i + 1}: ${result.error || 'Upload failed'}`);
      }

      uploadedCount++;
      onProgress?.({
        uploaded: uploadedCount,
        total: totalItems,
        percentage: Math.round((uploadedCount / totalItems) * 100),
        currentFile: `Photo ${i + 1}`,
        status: result.success ? 'uploading' : 'error',
      });
    }

    // Upload signature if provided
    if (signatureBase64) {
      onProgress?.({
        uploaded: uploadedCount,
        total: totalItems,
        percentage: Math.round((uploadedCount / totalItems) * 100),
        currentFile: 'Signature',
        status: 'uploading',
      });

      // Signature is already base64, upload directly with retry
      let lastError = '';
      for (let attempt = 0; attempt <= UPLOAD_RETRY_CONFIG.maxRetries; attempt++) {
        try {
          const formData = new FormData();
          formData.append('key', this.apiKey);
          formData.append('image', signatureBase64);
          formData.append('name', `signature_${Date.now()}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.upload);

          const response = await fetch(IMGBB_UPLOAD_URL, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const result = await response.json();
          if (result.success) {
            signatureUrl = result.data.url;
            break;
          } else {
            lastError = result.error?.message || 'Upload failed';
          }
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Upload failed';
        }

        if (attempt < UPLOAD_RETRY_CONFIG.maxRetries) {
          const delay = this.getRetryDelay(attempt);
          await this.sleep(delay);
          totalRetries++;
        }
      }

      if (!signatureUrl) {
        errors.push(`Signature: ${lastError}`);
      }

      uploadedCount++;
      onProgress?.({
        uploaded: uploadedCount,
        total: totalItems,
        percentage: 100,
        currentFile: 'Signature',
        status: signatureUrl ? 'complete' : 'error',
      });
    }

    return {
      success: errors.length === 0,
      photoUrls,
      signatureUrl,
      errors,
      totalRetries,
    };
  }
}

export const imageUploadService = new ImageUploadService();
