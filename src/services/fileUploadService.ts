import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { MessageAttachment, FileUploadOptions, UploadProgress } from '../types/message';
import ApiService from './api';

export class FileUploadService {
  private static instance: FileUploadService;
  private uploadQueue: Map<string, UploadProgress> = new Map();
  private activeUploads: Set<string> = new Set();

  public static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  private defaultOptions: FileUploadOptions = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/pdf'],
    compressionQuality: 0.8,
    enableImageProcessing: true,
    enableTextExtraction: true,
  };

  // Request permissions for camera and media library
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus === 'granted' && mediaStatus === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Take photo with camera
  public async takePhoto(): Promise<MessageAttachment | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Camera permissions not granted');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      return this.createAttachmentFromImageAsset(result.assets[0]);
    } catch (error) {
      console.error('Camera capture failed:', error);
      throw new Error('Failed to capture photo');
    }
  }

  // Pick photo from gallery
  public async pickPhoto(): Promise<MessageAttachment | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Media library permissions not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      return this.createAttachmentFromImageAsset(result.assets[0]);
    } catch (error) {
      console.error('Photo picking failed:', error);
      throw new Error('Failed to pick photo');
    }
  }

  // Pick document file
  public async pickDocument(): Promise<MessageAttachment | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      return this.createAttachmentFromDocumentAsset(asset);
    } catch (error) {
      console.error('Document picking failed:', error);
      throw new Error('Failed to pick document');
    }
  }

  // Compress and optimize image
  private async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize to max 1024px width
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Image compression failed:', error);
      return uri; // Return original if compression fails
    }
  }

  // Create attachment from image picker result
  private async createAttachmentFromImageAsset(asset: ImagePicker.ImagePickerAsset): Promise<MessageAttachment> {
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    const fileName = asset.uri.split('/').pop() || `image_${Date.now()}.jpg`;
    
    // Compress image if it's too large
    let processedUri = asset.uri;
    if (fileInfo.exists && fileInfo.size && fileInfo.size > 1024 * 1024) { // > 1MB
      processedUri = await this.compressImage(asset.uri, this.defaultOptions.compressionQuality);
    }

    const processedInfo = await FileSystem.getInfoAsync(processedUri);

    return {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'image',
      name: fileName,
      size: processedInfo.exists ? processedInfo.size || 0 : 0,
      uri: processedUri,
      mimeType: 'image/jpeg',
      uploadStatus: 'pending',
      width: asset.width,
      height: asset.height,
    };
  }

  // Create attachment from document picker result
  private async createAttachmentFromDocumentAsset(asset: DocumentPicker.DocumentPickerAsset): Promise<MessageAttachment> {
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    
    // Validate file size
    if (fileInfo.exists && fileInfo.size && fileInfo.size > this.defaultOptions.maxSizeBytes) {
      throw new Error(`File too large. Maximum size is ${this.defaultOptions.maxSizeBytes / (1024 * 1024)}MB`);
    }

    // Determine attachment type
    let attachmentType: MessageAttachment['type'] = 'document';
    if (asset.mimeType?.startsWith('image/')) {
      attachmentType = 'image';
    } else if (asset.mimeType === 'text/plain') {
      attachmentType = 'text';
    }

    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: attachmentType,
      name: asset.name,
      size: asset.size || 0,
      uri: asset.uri,
      mimeType: asset.mimeType || 'application/octet-stream',
      uploadStatus: 'pending',
    };
  }

  // Extract text from document (for text files and simple processing)
  public async extractTextFromFile(attachment: MessageAttachment): Promise<string> {
    try {
      if (attachment.type === 'text' && attachment.mimeType === 'text/plain') {
        const content = await FileSystem.readAsStringAsync(attachment.uri);
        return content;
      }
      
      // For other file types, we'll need server-side processing
      // Placeholder for future OCR/PDF text extraction
      return '';
    } catch (error) {
      console.error('Text extraction failed:', error);
      return '';
    }
  }

  // Convert image to base64 data URL for GPT-4o vision
  public async convertImageToBase64(attachment: MessageAttachment): Promise<MessageAttachment> {
    try {
      if (attachment.type !== 'image') {
        throw new Error('Only image attachments can be converted to base64');
      }

      // console.log('🖼️ Converting image to base64 for vision:', attachment.name);

      // Read file as base64
      const base64String = await FileSystem.readAsStringAsync(attachment.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create data URL
      const dataUrl = `data:${attachment.mimeType};base64,${base64String}`;

      // Update attachment with base64 data
      return {
        ...attachment,
        uri: dataUrl, // Replace local URI with data URL
        url: dataUrl, // Server expects 'url' property for vision
        uploadStatus: 'uploaded',
        serverUrl: dataUrl, // For vision, the data URL IS the server URL
      };

    } catch (error) {
      console.error('Base64 conversion failed:', error);
      throw error;
    }
  }

  // Upload file to server (original method for non-vision files)
  public async uploadFile(
    attachment: MessageAttachment,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MessageAttachment> {
    try {
      // Prevent duplicate uploads
      if (this.activeUploads.has(attachment.id)) {
        throw new Error('Upload already in progress');
      }

      this.activeUploads.add(attachment.id);
      
      // Update status to uploading
      const updatedAttachment = { ...attachment, uploadStatus: 'uploading' as const };
      
      if (onProgress) {
        onProgress({
          attachmentId: attachment.id,
          progress: 0,
          status: 'uploading',
        });
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Validate file exists before upload
      const fileInfo = await FileSystem.getInfoAsync(attachment.uri);
      if (!fileInfo.exists) {
        throw new Error(`File not found: ${attachment.name}`);
      }
      
      // For React Native, we need to format the file object correctly
      const fileObject = {
        uri: attachment.uri,
        type: attachment.mimeType,
        name: attachment.name,
      } as any;
      
      console.log('📤 Uploading file:', {
        name: attachment.name,
        type: attachment.mimeType,
        size: attachment.size,
        uri: attachment.uri.substring(0, 50) + '...',
        exists: fileInfo.exists,
        actualSize: fileInfo.size,
      });

      try {
        formData.append('file', fileObject);
        formData.append('type', attachment.type);
        formData.append('attachmentId', attachment.id);
      } catch (error) {
        console.error('Failed to create FormData:', error);
        throw new Error('Failed to prepare file for upload');
      }

      // Upload to server using ApiService
      const result = await ApiService.uploadFile(formData);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update progress to complete
      if (onProgress) {
        onProgress({
          attachmentId: attachment.id,
          progress: 100,
          status: 'uploaded',
        });
      }

      return {
        ...updatedAttachment,
        uploadStatus: 'uploaded',
        serverUrl: result.data?.url,
        processedText: result.data?.extractedText,
      };

    } catch (error) {
      console.error('Upload failed:', error);
      
      if (onProgress) {
        onProgress({
          attachmentId: attachment.id,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }

      throw error;
    } finally {
      this.activeUploads.delete(attachment.id);
    }
  }

  // Smart upload that chooses the right method for each file type
  public async processAttachmentForSending(attachment: MessageAttachment): Promise<MessageAttachment> {
    try {
      if (attachment.type === 'image') {
        // For images, convert to base64 for GPT-4o vision
        console.log('📸 Processing image for GPT-4o vision:', attachment.name);
        return await this.convertImageToBase64(attachment);
      } else {
        // For other files, use traditional server upload
        console.log('📎 Uploading file to server:', attachment.name);
        
        // Check network connectivity before attempting upload
        const isConnected = await this.checkNetworkConnectivity();
        if (!isConnected) {
          console.warn('📵 No network connection - processing file locally');
          
          // For text files, try to extract content locally
          if (attachment.type === 'text') {
            const textContent = await this.extractTextFromFile(attachment);
            return {
              ...attachment,
              uploadStatus: 'uploaded',
              processedText: textContent,
              serverUrl: attachment.uri, // Use local URI as fallback
            };
          }
          
          // For other files, return as-is with local processing
          return {
            ...attachment,
            uploadStatus: 'uploaded',
            serverUrl: attachment.uri,
          };
        }
        
        return await this.uploadFile(attachment);
      }
    } catch (error) {
      console.error('Failed to process attachment:', error);
      throw error;
    }
  }

  // Check network connectivity
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Use a lightweight check to our own API server instead of Google
      const response = await fetch(`${ApiService.baseURL}/health`, {
        method: 'HEAD',
        timeout: 3000,
      });
      return response.ok;
    } catch (error) {
      console.warn('Network connectivity check failed:', error);
      // Assume connected if check fails - better to try and fail than not try at all
      return true;
    }
  }

  // Upload multiple files with progress tracking
  public async uploadFiles(
    attachments: MessageAttachment[],
    onProgress?: (overall: number, individual: UploadProgress[]) => void
  ): Promise<MessageAttachment[]> {
    const results: MessageAttachment[] = [];
    const progressMap: Map<string, UploadProgress> = new Map();
    
    // Initialize progress tracking
    attachments.forEach(attachment => {
      progressMap.set(attachment.id, {
        attachmentId: attachment.id,
        progress: 0,
        status: 'pending',
      });
    });

    try {
      // Process files sequentially to avoid overwhelming the server
      for (const attachment of attachments) {
        try {
          // Update progress to processing
          progressMap.set(attachment.id, {
            attachmentId: attachment.id,
            progress: 25,
            status: 'uploading',
          });
          
          if (onProgress) {
            const progressArray = Array.from(progressMap.values());
            const overallProgress = progressArray.reduce((sum, p) => sum + p.progress, 0) / progressArray.length;
            onProgress(overallProgress, progressArray);
          }

          const result = await this.processAttachmentForSending(attachment);
          
          // Update progress to complete
          progressMap.set(attachment.id, {
            attachmentId: attachment.id,
            progress: 100,
            status: 'uploaded',
          });
          
          if (onProgress) {
            const progressArray = Array.from(progressMap.values());
            const overallProgress = progressArray.reduce((sum, p) => sum + p.progress, 0) / progressArray.length;
            onProgress(overallProgress, progressArray);
          }
          
          results.push(result);
        } catch (error) {
          console.error(`Failed to process attachment ${attachment.name}:`, error);
          
          // Update progress to error
          progressMap.set(attachment.id, {
            attachmentId: attachment.id,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          });
          
          if (onProgress) {
            const progressArray = Array.from(progressMap.values());
            const overallProgress = progressArray.reduce((sum, p) => sum + p.progress, 0) / progressArray.length;
            onProgress(overallProgress, progressArray);
          }
          
          // Don't throw here, continue with other files
          results.push({
            ...attachment,
            uploadStatus: 'error',
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Batch upload failed:', error);
      throw error;
    }
  }

  // Validate file before upload
  public validateFile(attachment: MessageAttachment, options?: Partial<FileUploadOptions>): string | null {
    const opts = { ...this.defaultOptions, ...options };

    // Check file size
    if (attachment.size > opts.maxSizeBytes) {
      return `File too large. Maximum size is ${opts.maxSizeBytes / (1024 * 1024)}MB`;
    }

    // Check file type
    if (!opts.allowedTypes.includes(attachment.mimeType)) {
      return `File type not supported. Allowed types: ${opts.allowedTypes.join(', ')}`;
    }

    return null; // Valid
  }

  // Get upload progress for a file
  public getUploadProgress(attachmentId: string): UploadProgress | null {
    return this.uploadQueue.get(attachmentId) || null;
  }

  // Cancel upload (placeholder for future implementation)
  public async cancelUpload(attachmentId: string): Promise<void> {
    this.activeUploads.delete(attachmentId);
    this.uploadQueue.delete(attachmentId);
    // Implement actual upload cancellation
  }
}