import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as FileSystem from 'expo-file-system';

interface CloudUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  key?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class CloudStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    // These would be set via environment variables
    this.region = process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1';
    this.bucketName = process.env.EXPO_PUBLIC_S3_BUCKET_NAME || 'numina-user-content';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Upload profile picture or banner to S3
   */
  async uploadUserImage(
    fileUri: string,
    userId: string,
    imageType: 'profile' | 'banner',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<CloudUploadResult> {
    try {
      // Read file from local URI
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return { success: false, error: 'File does not exist' };
      }

      // Validate file size and type before processing
      const validationResult = this.validateImageFile(fileInfo);
      if (!validationResult.valid) {
        console.error('❌ File validation failed:', validationResult.error);
        return { success: false, error: validationResult.error };
      }

      console.log('📤 Starting cloud upload:', { 
        fileSize: fileInfo.size, 
        imageType, 
        fileUri: fileUri.substring(0, 50) + '...' 
      });

      // For React Native, use FileSystem to read as base64 and convert manually
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary for AWS SDK (avoiding Buffer dependency)
      let bytes: Uint8Array;
      try {
        bytes = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));
      } catch (error) {
        console.error('❌ Failed to convert base64 to bytes:', error);
        return { success: false, error: 'Failed to process image data' };
      }

      // Generate unique key
      const timestamp = Date.now();
      const fileExtension = this.getFileExtension(fileUri);
      const key = `users/${userId}/${imageType}/${timestamp}.${fileExtension}`;

      // Determine content type
      const contentType = this.getContentType(fileExtension);

      // Create upload
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: bytes,
          ContentType: contentType,
          CacheControl: 'max-age=31536000', // 1 year cache
          Metadata: {
            userId,
            imageType,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Track upload progress
      if (onProgress) {
        upload.on('httpUploadProgress', (progress) => {
          const loaded = progress.loaded || 0;
          const total = progress.total || 1;
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });
        });
      }

      // Perform upload
      const result = await upload.done();
      
      // Generate public URL
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      console.log('✅ Cloud upload successful:', { key, url });

      return {
        success: true,
        url,
        key,
      };

    } catch (error) {
      console.error('❌ Cloud upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Delete user image from S3
   */
  async deleteUserImage(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      console.log('✅ Cloud delete successful:', key);
      return true;

    } catch (error) {
      console.error('❌ Cloud delete failed:', error);
      return false;
    }
  }

  /**
   * Generate optimized image URLs with transformations
   */
  getOptimizedImageUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    } = {}
  ): string {
    // For S3, we'll return the original URL
    // In production, you might use CloudFront with image optimization
    return originalUrl;
  }

  /**
   * Get file extension from URI
   */
  private getFileExtension(uri: string): string {
    const parts = uri.split('.');
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return contentTypes[extension] || 'application/octet-stream';
  }

  /**
   * Validate file size and type
   */
  validateImageFile(fileInfo: FileSystem.FileInfo, maxSizeMB: number = 5): {
    valid: boolean;
    error?: string;
  } {
    if (!fileInfo.exists) {
      return { valid: false, error: 'File does not exist' };
    }

    if (fileInfo.size && fileInfo.size > maxSizeMB * 1024 * 1024) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    return { valid: true };
  }
}

// Lazy instantiation to prevent AWS SDK loading at startup
let instance: CloudStorageService | null = null;

export const getCloudStorageService = (): CloudStorageService => {
  if (!instance) {
    instance = new CloudStorageService();
  }
  return instance;
};

export default getCloudStorageService;
export { CloudUploadResult, UploadProgress };