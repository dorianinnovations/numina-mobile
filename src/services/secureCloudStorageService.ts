import ApiService from './api';

// Secure Cloud Storage Response Interfaces
interface SecureUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  key?: string;
  size?: number;
  originalSize?: number;
}

interface ProfileUploadResult {
  success: boolean;
  images?: Array<{
    size: 'thumbnail' | 'medium' | 'large';
    url: string;
    key: string;
  }>;
  userId?: string;
  error?: string;
}

interface SecureUrlResult {
  success: boolean;
  url?: string;
  expiresAt?: string;
  error?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Legacy interface for backward compatibility
interface CloudUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  key?: string;
}

/**
 * Secure Cloud Storage Service that proxies uploads through the backend
 * This eliminates the need for AWS credentials in the mobile app
 * 
 * @example
 * ```typescript
 * import { getSecureCloudStorageService } from './secureCloudStorageService';
 * 
 * const cloudStorage = getSecureCloudStorageService();
 * 
 * // Upload a profile image
 * const result = await cloudStorage.uploadUserImage(
 *   'file://path/to/image.jpg',
 *   'user-id',
 *   'profile',
 *   (progress) => console.log(`${progress.percentage}% uploaded`)
 * );
 * 
 * if (result.success) {
 *   console.log('Image uploaded:', result.url);
 * } else {
 *   console.error('Upload failed:', result.error);
 * }
 * ```
 */
class SecureCloudStorageService {
  
  /**
   * Upload user image via backend proxy
   * This is more secure as AWS credentials stay on the server
   */
  async uploadUserImage(
    fileUri: string,
    userId: string,
    imageType: 'profile' | 'banner',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<SecureUploadResult> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'image/jpeg', // or detect from file
        name: `${imageType}_${Date.now()}.jpg`,
      } as any);
      // userId and imageType are handled automatically by the API service

      // Use secure cloud upload via API service
      const response = await ApiService.uploadSecureImage(formData, imageType);
      
      if (response.success && response.data) {
        return {
          success: true,
          url: response.data.url,
          key: response.data.key,
        };
      } else {
        // Handle specific error cases for better user feedback
        const errorMessage = this.getUserFriendlyError(response.error);
        console.error('❌ Secure cloud upload failed:', response.error);
        return {
          success: false,
          error: errorMessage,
        };
      }

    } catch (error) {
      console.error('❌ Secure cloud upload failed:', error);
      const errorMessage = this.getUserFriendlyError(error instanceof Error ? error.message : 'Upload failed');
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private getUserFriendlyError(error?: string): string {
    if (!error) return 'Upload failed. Please try again.';
    
    const lowerError = error.toLowerCase();
    
    // Network errors
    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Authentication errors
    if (lowerError.includes('unauthorized') || lowerError.includes('token') || lowerError.includes('login')) {
      return 'Session expired. Please sign in again.';
    }
    
    // File size errors
    if (lowerError.includes('size') || lowerError.includes('large') || lowerError.includes('limit')) {
      return 'File is too large. Please choose a smaller image.';
    }
    
    // File type errors
    if (lowerError.includes('type') || lowerError.includes('format') || lowerError.includes('image')) {
      return 'Invalid file type. Please choose an image file.';
    }
    
    // Server errors
    if (lowerError.includes('server') || lowerError.includes('500') || lowerError.includes('internal')) {
      return 'Server error. Please try again in a moment.';
    }
    
    // Deployment/availability errors
    if (lowerError.includes('cannot post') || lowerError.includes('404') || lowerError.includes('not found')) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    
    // AWS/S3 specific errors
    if (lowerError.includes('s3') || lowerError.includes('aws') || lowerError.includes('bucket')) {
      return 'Cloud storage error. Please try again.';
    }
    
    // Default fallback
    return 'Upload failed. Please try again.';
  }

  /**
   * Delete user image via backend proxy
   */
  async deleteUserImage(key: string): Promise<boolean> {
    try {
      // Call secure delete endpoint via API service
      const response = await ApiService.deleteSecureImage(key);

      return response.success;

    } catch (error) {
      console.error('❌ Secure cloud delete failed:', error);
      return false;
    }
  }

  /**
   * Generate optimized image URLs (via secure backend)
   */
  async getOptimizedImageUrl(
    key: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): Promise<string | null> {
    try {
      const response = await ApiService.getSecureImageUrl(key, options);
      if (response.success && response.data) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to generate optimized image URL:', error);
      return null;
    }
  }
}

// Singleton instance
let instance: SecureCloudStorageService | null = null;

export const getSecureCloudStorageService = (): SecureCloudStorageService => {
  if (!instance) {
    instance = new SecureCloudStorageService();
  }
  return instance;
};

export default getSecureCloudStorageService;
export { 
  // New secure interfaces
  SecureUploadResult, 
  ProfileUploadResult, 
  SecureUrlResult,
  UploadProgress,
  // Legacy interface for backward compatibility
  CloudUploadResult 
};