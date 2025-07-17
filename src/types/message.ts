export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'text';
  name: string;
  size: number;
  uri: string;
  mimeType: string;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
  uploadProgress?: number;
  serverUrl?: string;
  width?: number;
  height?: number;
  processedText?: string; // For extracted text from images/documents
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'numina';
  timestamp: string;
  mood?: string;
  isStreaming?: boolean;
  personalityContext?: PersonalityContext;
  attachments?: MessageAttachment[];
  hasFileContext?: boolean; // Indicates if AI response considers uploaded files
}

export interface PersonalityContext {
  mood: string;
  intensity: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  recentInteractions: string[];
  patterns: string[];
}

export interface FileUploadOptions {
  maxSizeBytes: number;
  allowedTypes: string[];
  compressionQuality: number;
  enableImageProcessing: boolean;
  enableTextExtraction: boolean;
}

export interface UploadProgress {
  attachmentId: string;
  progress: number;
  speed?: number;
  timeRemaining?: number;
  status: MessageAttachment['uploadStatus'];
  error?: string;
}