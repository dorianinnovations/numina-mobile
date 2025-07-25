import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Conversation Storage Service
 * Handles persistent storage of chat conversations with async operations
 * Migrated from localStorage to AsyncStorage for React Native
 */

import { MessageAttachment } from '../types/message';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'numina';
  timestamp: string;
  mood?: string;
  isStreaming?: boolean;
  attachments?: MessageAttachment[];
  hasFileContext?: boolean;
  personalityContext?: any;
  isSystem?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  metadata?: {
    messageCount: number;
    lastSender: 'user' | 'numina';
    tags?: string[];
  };
}

class ConversationStorageService {
  private static STORAGE_KEY = 'numina_conversations_v2';
  private static MAX_CONVERSATIONS = 50;
  private static MAX_MESSAGES_PER_CONVERSATION = 200;

  // Load all conversations from storage
  static async loadConversations(): Promise<Conversation[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const conversations: Conversation[] = JSON.parse(stored);
      
      // Migrate old conversation format if needed
      const migrated = conversations.map(conv => this.migrateConversation(conv));
      
      // Sort by updatedAt (most recent first)
      return migrated.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  // Save all conversations to storage
  static async saveConversations(conversations: Conversation[]): Promise<void> {
    try {
      // Limit number of conversations
      const limited = conversations.slice(0, this.MAX_CONVERSATIONS);
      
      // Limit messages per conversation
      const optimized = limited.map(conv => ({
        ...conv,
        messages: conv.messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION),
        metadata: {
          messageCount: conv.messages.length,
          lastSender: conv.messages[conv.messages.length - 1]?.sender || 'user',
          ...conv.metadata,
        },
      }));

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(optimized));
      
      // Notify analytics that conversation data has changed
      this.notifyAnalyticsOfUpdate();
    } catch (error) {
      console.error('Error saving conversations:', error);
      throw new Error('Failed to save conversations');
    }
  }

  // Create a new conversation
  static createConversation(firstMessage?: Message): Conversation {
    const now = new Date().toISOString();
    const id = Date.now().toString();
    
    const conversation: Conversation = {
      id,
      title: this.generateTitle(firstMessage),
      createdAt: now,
      updatedAt: now,
      messages: firstMessage ? [firstMessage] : [],
      metadata: {
        messageCount: firstMessage ? 1 : 0,
        lastSender: firstMessage?.sender || 'user',
      },
    };

    return conversation;
  }

  // Add message to conversation
  static addMessageToConversation(
    conversation: Conversation, 
    message: Message
  ): Conversation {
    const updatedMessages = [...conversation.messages, message];
    
    // Find the first user message for title generation
    const firstUserMessage = updatedMessages.find(msg => msg.sender === 'user');
    
    // Generate title from first user message, or keep existing title if no user message yet
    const shouldUpdateTitle = message.sender === 'user' && 
      (conversation.title.includes('New Chat') || conversation.title.includes('Welcome to Numina'));
    
    return {
      ...conversation,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      title: shouldUpdateTitle ? this.generateTitle(firstUserMessage) : conversation.title,
      metadata: {
        messageCount: updatedMessages.length,
        lastSender: message.sender,
        ...conversation.metadata,
      },
    };
  }

  // Update conversation title
  static updateConversationTitle(
    conversation: Conversation, 
    title: string
  ): Conversation {
    return {
      ...conversation,
      title,
      updatedAt: new Date().toISOString(),
    };
  }

  // Delete conversation
  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      const conversations = await this.loadConversations();
      const filtered = conversations.filter(conv => conv.id !== conversationId);
      await this.saveConversations(filtered);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  // Search conversations
  static async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const conversations = await this.loadConversations();
      const lowercaseQuery = query.toLowerCase();
      
      return conversations.filter(conv => 
        conv.title.toLowerCase().includes(lowercaseQuery) ||
        conv.messages.some(msg => 
          msg.text.toLowerCase().includes(lowercaseQuery)
        )
      );
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  // Periodic sync to ensure conversations are always available for analytics
  static async performPeriodicSync(): Promise<void> {
    try {
      console.log('PeriodicSync: Ensuring conversations are synced to server');
      // Trigger the cloud sync via CloudAuth service which handles the actual server sync
      await this.triggerCloudSync();
    } catch (error) {
      console.warn('Error in periodic conversation sync:', error);
    }
  }

  // Export conversation for sharing
  static exportConversation(conversation: Conversation): string {
    const header = `Conversation: ${conversation.title}\nDate: ${new Date(conversation.createdAt).toLocaleDateString()}\n\n`;
    
    const messages = conversation.messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      const sender = msg.sender === 'user' ? 'You' : 'Numina';
      return `[${timestamp}] ${sender}: ${msg.text}`;
    }).join('\n\n');

    return header + messages;
  }

  // Get conversation statistics
  static async getStatistics(): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    oldestConversation?: string;
    newestConversation?: string;
  }> {
    try {
      const conversations = await this.loadConversations();
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
      
      return {
        totalConversations: conversations.length,
        totalMessages,
        averageMessagesPerConversation: conversations.length > 0 
          ? Math.round(totalMessages / conversations.length) 
          : 0,
        oldestConversation: conversations[conversations.length - 1]?.createdAt,
        newestConversation: conversations[0]?.updatedAt,
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
      };
    }
  }

  // Clear all conversations (for logout/reset)
  static async clearAllConversations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw new Error('Failed to clear conversations');
    }
  }

  // Private helper methods
  private static generateTitle(message?: Message): string {
    // Don't use bot/system messages for title generation
    if (!message || message.sender === 'numina') {
      return `✨ New Chat • ${new Date().toLocaleDateString()}`;
    }
    
    const text = message.text.trim();
    
    // Smart pattern matching for personalized titles
    const smartTitle = this.extractSmartTitle(text);
    if (smartTitle) return smartTitle;
    
    // Fallback to intelligent truncation
    return this.intelligentTruncate(text);
  }

  private static extractSmartTitle(text: string): string | null {
    const lowerText = text.toLowerCase();
    
    // Question patterns - extract the core question
    const questionPatterns = [
      /^(how do i|how can i|how to)\s+(.+?)(\?|$)/i,
      /^(what is|what are|what's)\s+(.+?)(\?|$)/i,
      /^(why does|why is|why do)\s+(.+?)(\?|$)/i,
      /^(when should|when do|when is)\s+(.+?)(\?|$)/i,
      /^(where can|where do|where is)\s+(.+?)(\?|$)/i,
      /^(can you|could you|will you)\s+(.+?)(\?|$)/i,
      /^(should i|do i need to|is it)\s+(.+?)(\?|$)/i,
    ];

    for (const pattern of questionPatterns) {
      const match = text.match(pattern);
      if (match) {
        const questionType = match[1].toLowerCase();
        const subject = this.cleanAndCapitalize(match[2]);
        
        // Clean title without emojis
        return this.truncateSmartly(subject, 35);
      }
    }
    
    // Command/Request patterns
    const commandPatterns = [
      /^(help me|help with|help)\s+(.+)/i,
      /^(show me|show)\s+(.+)/i,
      /^(tell me|tell)\s+(.+)/i,
      /^(explain|describe)\s+(.+)/i,
      /^(create|make|build)\s+(.+)/i,
      /^(write|draft)\s+(.+)/i,
      /^(find|search|look for)\s+(.+)/i,
      /^(analyze|review|check)\s+(.+)/i,
      /^(fix|solve|debug)\s+(.+)/i,
      /^(plan|organize|schedule)\s+(.+)/i,
    ];

    for (const pattern of commandPatterns) {
      const match = text.match(pattern);
      if (match) {
        const action = match[1].toLowerCase();
        const subject = this.cleanAndCapitalize(match[2]);
        
        // Clean title without emojis
        return this.truncateSmartly(subject, 35);
      }
    }
    
    // Topic detection based on keywords - clean titles without emojis
    const topicPatterns = [
      { keywords: ['code', 'programming', 'function', 'variable', 'syntax', 'bug', 'error'], prefix: 'Code' },
      { keywords: ['design', 'ui', 'interface', 'layout', 'color', 'style'], prefix: 'Design' },
      { keywords: ['emotion', 'feeling', 'mood', 'sad', 'happy', 'anxious', 'stress'], prefix: 'Mood' },
      { keywords: ['data', 'analysis', 'chart', 'graph', 'statistics', 'metrics'], prefix: 'Data' },
      { keywords: ['project', 'task', 'deadline', 'meeting', 'schedule', 'plan'], prefix: 'Planning' },
      { keywords: ['learn', 'study', 'understand', 'concept', 'theory', 'practice'], prefix: 'Learning' },
      { keywords: ['creative', 'story', 'write', 'poem', 'art', 'inspire'], prefix: 'Creative' },
      { keywords: ['health', 'fitness', 'exercise', 'diet', 'wellness', 'sleep'], prefix: 'Health' },
      { keywords: ['travel', 'trip', 'vacation', 'explore', 'adventure', 'journey'], prefix: 'Travel' },
      { keywords: ['finance', 'money', 'budget', 'investment', 'savings', 'cost'], prefix: 'Finance' },
    ];

    for (const topic of topicPatterns) {
      if (topic.keywords.some(keyword => lowerText.includes(keyword))) {
        const essence = this.extractEssence(text);
        return essence;
      }
    }
    
    // Simple essence extraction without emojis
    const essence = this.extractEssence(text);
    if (essence && essence.length > 0) {
      return essence;
    }
    if (lowerText.includes('confused') || lowerText.includes('stuck') || lowerText.includes("don't understand")) {
      return `🤯 ${this.extractEssence(text)}`;
    }
    
    return null;
  }

  private static extractEssence(text: string): string {
    // Remove common filler words and extract meaningful content
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'you', 'it', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    
    const words = text.toLowerCase().split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5); // Take first 5 meaningful words
    
    return this.cleanAndCapitalize(words.join(' '));
  }

  private static intelligentTruncate(text: string): string {
    // Clean truncation without emojis
    return this.truncateSmartly(text, 40);
  }

  private static truncateSmartly(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Try to break at sentence end
    const sentenceEnd = text.substring(0, maxLength).lastIndexOf('.');
    if (sentenceEnd > maxLength * 0.6) {
      return text.substring(0, sentenceEnd);
    }
    
    // Try to break at word boundary
    const wordBoundary = text.substring(0, maxLength).lastIndexOf(' ');
    if (wordBoundary > maxLength * 0.6) {
      return text.substring(0, wordBoundary) + '...';
    }
    
    // Hard truncate with ellipsis
    return text.substring(0, maxLength - 3) + '...';
  }

  private static cleanAndCapitalize(text: string): string {
    return text.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private static migrateConversation(conv: any): Conversation {
    // Handle old format migration
    if (conv.date && !conv.title) {
      const firstUserMessage = conv.messages?.find((msg: Message) => msg.sender === 'user');
      return {
        id: conv.id,
        title: firstUserMessage 
          ? this.generateTitle(firstUserMessage)
          : `Chat ${new Date(conv.date).toLocaleDateString()}`,
        createdAt: conv.date,
        updatedAt: conv.date,
        messages: conv.messages || [],
        metadata: {
          messageCount: conv.messages?.length || 0,
          lastSender: conv.messages?.[conv.messages.length - 1]?.sender || 'user',
        },
      };
    }
    
    // Ensure metadata exists
    if (!conv.metadata) {
      conv.metadata = {
        messageCount: conv.messages?.length || 0,
        lastSender: conv.messages?.[conv.messages.length - 1]?.sender || 'user',
      };
    }
    
    return conv;
  }

  // Notify analytics services that conversation data has been updated
  private static notifyAnalyticsOfUpdate(): void {
    try {
      // Invalidate AI personality cache to force fresh analysis with new conversation data
      AsyncStorage.removeItem('@ai_emotional_state_cache');
      // console.log('Analytics: Invalidated emotional state cache due to conversation update');
      
      // Trigger background sync to server for rich analytics (handled by CloudAuth service)
      this.triggerCloudSync();
    } catch (error) {
      console.warn('Failed to notify analytics of conversation update:', error);
    }
  }

  // Trigger cloud sync through CloudAuth service (avoid duplication)
  private static async triggerCloudSync(): Promise<void> {
    try {
      // Import with default export syntax to avoid circular dependency
      const CloudAuthModule = await import('./cloudAuth');
      const cloudAuth = CloudAuthModule.default;
      
      // Check if CloudAuth has getInstance method
      if (cloudAuth && typeof cloudAuth.getInstance === 'function') {
        const instance = cloudAuth.getInstance();
        if (instance.isAuthenticated()) {
          // console.log('ConversationSync: Conversation sync already handled by CloudAuth service');
          // The CloudAuth service automatically syncs conversations when they're updated
          // No need to duplicate the sync - just acknowledge that it's working
        } else {
          console.log('ConversationSync: User not authenticated, sync will happen at next login');
        }
      } else {
        console.log('ConversationSync: CloudAuth not available, skipping sync trigger');
      }
    } catch (error) {
      console.warn('Failed to access cloud conversation sync:', error);
    }
  }
}

export default ConversationStorageService;