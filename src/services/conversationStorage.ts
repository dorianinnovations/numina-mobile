import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Conversation Storage Service
 * Handles persistent storage of chat conversations with async operations
 * Migrated from localStorage to AsyncStorage for React Native
 */

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'numina';
  timestamp: string;
  mood?: string;
  isStreaming?: boolean;
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
    
    return {
      ...conversation,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      title: conversation.title || this.generateTitle(message),
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
    if (!message) return `Chat ${new Date().toLocaleDateString()}`;
    
    const text = message.text;
    if (text.length <= 40) return text;
    
    // Find a good breaking point (end of sentence or word)
    const breakPoint = text.substring(0, 40).lastIndexOf(' ');
    const truncated = breakPoint > 20 ? text.substring(0, breakPoint) : text.substring(0, 40);
    
    return truncated + '...';
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
}

export default ConversationStorageService;