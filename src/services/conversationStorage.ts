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
        
        // Create contextual emoji based on question type
        let emoji = '❓';
        if (questionType.includes('how')) emoji = '🔧';
        if (questionType.includes('what')) emoji = '💡';
        if (questionType.includes('why')) emoji = '🤔';
        if (questionType.includes('when')) emoji = '⏰';
        if (questionType.includes('where')) emoji = '📍';
        if (questionType.includes('can') || questionType.includes('will')) emoji = '🚀';
        if (questionType.includes('should')) emoji = '🤝';
        
        return `${emoji} ${this.truncateSmartly(subject, 30)}`;
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
        
        // Contextual emojis for actions
        let emoji = '✨';
        if (action.includes('help')) emoji = '🆘';
        if (action.includes('show')) emoji = '👁️';
        if (action.includes('tell') || action.includes('explain')) emoji = '📖';
        if (action.includes('create') || action.includes('make')) emoji = '🔨';
        if (action.includes('write')) emoji = '✍️';
        if (action.includes('find') || action.includes('search')) emoji = '🔍';
        if (action.includes('analyze') || action.includes('review')) emoji = '📊';
        if (action.includes('fix') || action.includes('debug')) emoji = '🔧';
        if (action.includes('plan') || action.includes('organize')) emoji = '📋';
        
        return `${emoji} ${this.truncateSmartly(subject, 30)}`;
      }
    }
    
    // Topic detection based on keywords
    const topicPatterns = [
      { keywords: ['code', 'programming', 'function', 'variable', 'syntax', 'bug', 'error'], emoji: '💻', prefix: 'Code' },
      { keywords: ['design', 'ui', 'interface', 'layout', 'color', 'style'], emoji: '🎨', prefix: 'Design' },
      { keywords: ['emotion', 'feeling', 'mood', 'sad', 'happy', 'anxious', 'stress'], emoji: '🎭', prefix: 'Mood' },
      { keywords: ['data', 'analysis', 'chart', 'graph', 'statistics', 'metrics'], emoji: '📊', prefix: 'Data' },
      { keywords: ['project', 'task', 'deadline', 'meeting', 'schedule', 'plan'], emoji: '📅', prefix: 'Planning' },
      { keywords: ['learn', 'study', 'understand', 'concept', 'theory', 'practice'], emoji: '📚', prefix: 'Learning' },
      { keywords: ['creative', 'story', 'write', 'poem', 'art', 'inspire'], emoji: '✨', prefix: 'Creative' },
      { keywords: ['health', 'fitness', 'exercise', 'diet', 'wellness', 'sleep'], emoji: '🏃', prefix: 'Health' },
      { keywords: ['travel', 'trip', 'vacation', 'explore', 'adventure', 'journey'], emoji: '✈️', prefix: 'Travel' },
      { keywords: ['finance', 'money', 'budget', 'investment', 'savings', 'cost'], emoji: '💰', prefix: 'Finance' },
    ];

    for (const topic of topicPatterns) {
      if (topic.keywords.some(keyword => lowerText.includes(keyword))) {
        const essence = this.extractEssence(text);
        return `${topic.emoji} ${essence}`;
      }
    }
    
    // Sentiment-based titles
    if (lowerText.includes('excited') || lowerText.includes('amazing') || lowerText.includes('awesome')) {
      return `🎉 ${this.extractEssence(text)}`;
    }
    if (lowerText.includes('worried') || lowerText.includes('concerned') || lowerText.includes('problem')) {
      return `😰 ${this.extractEssence(text)}`;
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
    // Add contextual emoji based on text analysis
    let emoji = '💬';
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('!')) emoji = '❗';
    if (lowerText.includes('?')) emoji = '❓';
    if (lowerText.includes('thank') || lowerText.includes('please')) emoji = '🙏';
    if (lowerText.includes('love') || lowerText.includes('great')) emoji = '❤️';
    if (lowerText.includes('sorry') || lowerText.includes('apologize')) emoji = '😔';
    
    const truncated = this.truncateSmartly(text, 35);
    return `${emoji} ${truncated}`;
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
}

export default ConversationStorageService;