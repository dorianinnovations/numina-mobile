export interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'text';
  name: string;
  size: number;
  uri: string;
  url?: string; // For server-side processing (GPT-4o vision expects this)
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
  attachments?: MessageAttachment[];
  hasFileContext?: boolean; // Indicates if AI response considers uploaded files
  isSystem?: boolean; // For system messages like upgrade prompts
  onNavigateToWallet?: () => void; // Callback for navigation to wallet
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