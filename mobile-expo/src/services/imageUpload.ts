import * as FileSystem from 'expo-file-system';

// ImgBB API - Free tier with unlimited storage
// Get your free API key at: https://api.imgbb.com/
const IMGBB_API_KEY = 'YOUR_IMGBB_API_KEY'; // Replace with actual key or use env variable
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnail?: string;
  deleteUrl?: string;
  error?: string;
}

export interface UploadProgress {
  uploaded: number;
  total: number;
  percentage: number;
}

class ImageUploadService {
  private apiKey: string;

  constructor() {
    this.apiKey = IMGBB_API_KEY;
  }

  /**
   * Upload a single image to ImgBB
   * @param imageUri Local file URI from image picker
   * @param name Optional name for the image
   */
  async uploadImage(imageUri: string, name?: string): Promise<UploadResult> {
    try {
      // Read the image file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Create form data
      const formData = new FormData();
      formData.append('key', this.apiKey);
      formData.append('image', base64);
      if (name) {
        formData.append('name', name);
      }

      // Upload to ImgBB
      const response = await fetch(IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          url: result.data.url,
          thumbnail: result.data.thumb?.url || result.data.medium?.url,
          deleteUrl: result.data.delete_url,
        };
      } else {
        return {
          success: false,
          error: result.error?.message || 'Upload failed',
        };
      }
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload multiple images
   * @param imageUris Array of local file URIs
   * @param onProgress Progress callback
   */
  async uploadMultiple(
    imageUris: string[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const total = imageUris.length;

    for (let i = 0; i < imageUris.length; i++) {
      const result = await this.uploadImage(imageUris[i], `inspection_photo_${i + 1}`);
      results.push(result);

      if (onProgress) {
        onProgress({
          uploaded: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
        });
      }
    }

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
  }> {
    const errors: string[] = [];
    const photoUrls: string[] = [];
    let signatureUrl: string | undefined;

    // Upload photos
    const totalItems = photos.length + (signatureBase64 ? 1 : 0);
    let uploadedCount = 0;

    for (let i = 0; i < photos.length; i++) {
      const result = await this.uploadImage(photos[i], `inspection_photo_${Date.now()}_${i}`);
      if (result.success && result.url) {
        photoUrls.push(result.url);
      } else {
        errors.push(`Photo ${i + 1}: ${result.error || 'Upload failed'}`);
      }
      uploadedCount++;
      if (onProgress) {
        onProgress({
          uploaded: uploadedCount,
          total: totalItems,
          percentage: Math.round((uploadedCount / totalItems) * 100),
        });
      }
    }

    // Upload signature if provided
    if (signatureBase64) {
      try {
        const formData = new FormData();
        formData.append('key', this.apiKey);
        formData.append('image', signatureBase64);
        formData.append('name', `signature_${Date.now()}`);

        const response = await fetch(IMGBB_UPLOAD_URL, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          signatureUrl = result.data.url;
        } else {
          errors.push(`Signature: ${result.error?.message || 'Upload failed'}`);
        }
      } catch (error) {
        errors.push(`Signature: ${error instanceof Error ? error.message : 'Upload failed'}`);
      }
      uploadedCount++;
      if (onProgress) {
        onProgress({
          uploaded: uploadedCount,
          total: totalItems,
          percentage: 100,
        });
      }
    }

    return {
      success: errors.length === 0,
      photoUrls,
      signatureUrl,
      errors,
    };
  }
}

export const imageUploadService = new ImageUploadService();
