import ApiService from './api';
import { optimizedChatService } from './optimizedChatService';

/**
 * Chat Service for React Native
 * Handles real-time chat with backend using streaming responses
 * Matches web app implementation exactly
 * 
 * PERFORMANCE MODE: Uses optimized service for better performance
 */

export interface StreamingChatResponse {
  content: string;
  isComplete: boolean;
}

export class ChatService {
  /**
   * Send a chat message with optional streaming updates
   * UNIFIED SYSTEM: Always uses optimized UBPM-aware endpoint
   */
  static async sendMessage(
    message: string,
    onStreamingUpdate?: (partial: string) => void,
    attachments?: any[]
  ): Promise<string> {
    try {
      console.log('User Message:', message);
      if (attachments && attachments.length > 0) {
        console.log('Attachments:', attachments.length, 'files');
      }
      
      // Always use optimized service with UBPM detection
      const result = await optimizedChatService.sendUBPMQuery(message, onStreamingUpdate, attachments);
      console.log('Bot Message:', result);
      return result;
      
    } catch (error: any) {
      console.error('❌ ChatService: Unified chat failed:', error);
      throw new Error(error.message || 'Failed to send message');
    }
  }

  /**
   * Handle streaming response processing
   */
  private static async handleStreamingResponse(
    response: Response,
    onUpdate: (partial: string) => void
  ): Promise<string> {
    
    if (!response.body) {
      throw new Error('No response body available for streaming');
    }
    
    const reader = response.body.getReader();
    if (!reader) {
      throw new Error('Failed to get response body reader');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim()) {
            try {
              // Parse JSON chunks from response
              const parsed = JSON.parse(line);
              if (parsed.content) {
                fullContent += parsed.content;
                onUpdate(fullContent);
              }
            } catch {
              // Handle non-JSON response data
              if (line.startsWith('data: ')) {
                const content = line.substring(6);
                if (content !== '[DONE]') {
                  try {
                    const parsed = JSON.parse(content);
                    if (parsed.content) {
                      fullContent += parsed.content;
                      onUpdate(fullContent);
                    }
                  } catch {
                    fullContent += content;
                    onUpdate(fullContent);
                  }
                }
              } else {
                fullContent += line;
                onUpdate(fullContent);
              }
            }
          }
        }
      }
    } catch (streamError) {
      throw streamError;
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  }

  /**
   * Parse event stream text for React Native compatibility
   */
  private static parseEventStreamText(textData: string, onUpdate: (partial: string) => void): string {
    
    let fullContent = '';
    const lines = textData.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        if (line.startsWith('data: ')) {
          const content = line.substring(6).trim();
          if (content !== '[DONE]') {
            try {
              const parsed = JSON.parse(content);
              if (parsed.content) {
                fullContent += parsed.content;
                // Progressive update to simulate streaming
                onUpdate(fullContent);
              }
            } catch (parseError) {
              // Treat non-JSON content as raw text
              if (content) {
                fullContent += content;
                onUpdate(fullContent);
              }
            }
          }
        }
      }
    }
    
    return fullContent;
  }

  /**
   * Fallback method for non-streaming responses
   */
  static async sendMessageSimple(message: string): Promise<string> {
    try {
      
      const response = await ApiService.sendChatMessage({
        prompt: message.trim(),
        stream: false,
        temperature: 0.8,
        n_predict: 1024,
      });

      if (!response.ok) {
        const clonedResponse = response.clone();
        const errorText = await clonedResponse.text().catch(() => 'Unknown error');
        throw new Error(`API error ${response.status}: ${errorText}`);
      }

      try {
        const data = await response.json();
        return data.content || data.message || 'No response received';
      } catch (parseError) {
        const textData = await response.text();
        return textData || 'No response received';
      }
    } catch (error: any) {
      // Check for rate limit errors first
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Thank you for using Numina, please upgrade')) {
        throw error; // Re-throw rate limit errors so they can be handled properly by ChatScreen
      }
      // Return user-friendly error message for other errors
      return `I apologize, but I'm having trouble connecting right now. Please check your internet connection and try again. If the problem persists, it might be a temporary server issue.`;
    }
  }

  /**
   * Generate conversation title from first message
   */
  static generateConversationTitle(message: string): string {
    if (message.length <= 40) return message;
    
    // Find optimal breaking point at word boundary
    const breakPoint = message.substring(0, 40).lastIndexOf(' ');
    const truncated = breakPoint > 20 ? message.substring(0, breakPoint) : message.substring(0, 40);
    
    return truncated + '...';
  }

  /**
   * Send UBPM-specific queries with optimization
   */
  static async sendUBPMMessage(
    message: string,
    onStreamingUpdate?: (partial: string) => void
  ): Promise<string> {
    try {
      return await optimizedChatService.sendUBPMQuery(message, onStreamingUpdate);
    } catch (error: any) {
      console.error('❌ ChatService: UBPM query failed, using regular message');
      return await this.sendMessage(message, onStreamingUpdate);
    }
  }

  /**
   * Check if chat service is available
   */
  static async checkChatAvailability(): Promise<boolean> {
    try {
      // Use optimized service for health check
      return await optimizedChatService.testConnection();
    } catch (error) {
      // Fallback to original check
      try {
        const response = await ApiService.sendChatMessage({
          prompt: 'ping',
          stream: false,
          n_predict: 1,
        });
        return response.ok;
      } catch (fallbackError) {
        return false;
      }
    }
  }
}

export default ChatService;