import AutoPlaylistService from './autoPlaylistService';

// Simple EventEmitter for React Native
class SimpleEventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.listeners[event]) return;
    const index = this.listeners[event].indexOf(listener);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export interface ToolExecution {
  id: string;
  toolName: string;
  status: 'starting' | 'executing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
  details: {
    action?: string;
    query?: string;
    searchType?: string;
    location?: string;
    parameters?: any;
    results?: any;
    error?: string;
    rawResponse?: string;
  };
  progress?: number; // 0-100
}

export interface StreamingToolUpdate {
  executionId: string;
  type: 'start' | 'progress' | 'result' | 'complete' | 'error';
  data: any;
  timestamp: number;
}

class ToolExecutionService extends SimpleEventEmitter {
  private static instance: ToolExecutionService;
  private executions: Map<string, ToolExecution> = new Map();
  private currentExecutions: string[] = [];
  private autoPlaylistService = AutoPlaylistService.getInstance();

  static getInstance(): ToolExecutionService {
    if (!this.instance) {
      this.instance = new ToolExecutionService();
    }
    return this.instance;
  }

  // Start tracking a new tool execution
  startExecution(toolName: string, parameters: any = {}): string {
    const executionId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract query from various possible parameter sources
    const extractQuery = (params: any): string => {
      return params.query || params.action || params.searchType || params.mood || 
             params.playlistName || params.restaurantName || params.destination || 
             params.location || params.symbol || params.text || params.content || '';
    };

    const query = extractQuery(parameters);
    
    const execution: ToolExecution = {
      id: executionId,
      toolName,
      status: 'starting',
      startTime: Date.now(),
      details: {
        parameters,
        action: this.getActionDescription(toolName, parameters),
        query: query, // Store the extracted query for display purposes
        searchType: parameters.searchType || 'general',
      },
      progress: 0,
    };

    this.executions.set(executionId, execution);
    this.currentExecutions.push(executionId);

    console.log(`🔧 Tool execution started: ${toolName} (${executionId})`);
    this.emit('executionStarted', execution);
    this.emit('executionsUpdated', this.getAllExecutions());

    return executionId;
  }

  // Update execution progress
  updateProgress(executionId: string, progress: number, details?: any): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.progress = progress;
    execution.status = 'executing';
    
    if (details) {
      // Extract query from new details if not already set
      if (!execution.details.query && details) {
        const extractQuery = (params: any): string => {
          return params.query || params.action || params.searchType || params.mood || 
                 params.playlistName || params.restaurantName || params.destination || 
                 params.location || params.symbol || params.text || params.content || '';
        };
        const newQuery = extractQuery(details);
        if (newQuery) {
          details.query = newQuery;
        }
      }
      
      execution.details = { ...execution.details, ...details };
    }

    console.log(`⚡ Tool execution progress: ${execution.toolName} - ${progress}% (${executionId})`);
    this.emit('executionProgress', execution);
    this.emit('executionsUpdated', this.getAllExecutions());
  }

  // Complete execution with results
  completeExecution(executionId: string, results: any): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'completed';
    execution.endTime = Date.now();
    execution.progress = 100;
    execution.details.results = results;

    // Remove from current executions
    this.currentExecutions = this.currentExecutions.filter(id => id !== executionId);

    console.log(`✅ Tool execution completed: ${execution.toolName} in ${execution.endTime - execution.startTime}ms (${executionId})`);
    
    // Process music recommendations for auto-playlist
    this.processForAutoPlaylist(execution);
    
    this.emit('executionCompleted', execution);
    this.emit('executionsUpdated', this.getAllExecutions());
  }

  // Process completed tool executions for auto-playlist management
  private async processForAutoPlaylist(execution: ToolExecution): Promise<void> {
    try {
      if (execution.status === 'completed' && execution.details.results) {
        await this.autoPlaylistService.processToolExecutionForMusic(
          execution.toolName, 
          execution.details.results
        );
      }
    } catch (error) {
      console.error('Error processing tool execution for auto-playlist:', error);
    }
  }

  // Mark execution as failed
  failExecution(executionId: string, error: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'error';
    execution.endTime = Date.now();
    execution.details.error = error;

    // Remove from current executions
    this.currentExecutions = this.currentExecutions.filter(id => id !== executionId);

    console.error(`❌ Tool execution failed: ${execution.toolName} - ${error} (${executionId})`);
    this.emit('executionFailed', execution);
    this.emit('executionsUpdated', this.getAllExecutions());
  }

  // Process streaming tool response from chat
  processStreamingToolResponse(rawResponse: string): void {
    // Parse tool execution from streaming response
    const toolCallMatch = rawResponse.match(/🔧 \*\*([^:]+)\*\*: ({.*})/);
    if (!toolCallMatch) return;

    const toolName = toolCallMatch[1].toLowerCase().replace(/\s+/g, '_');
    const responseData = toolCallMatch[2];

    try {
      const parsedData = JSON.parse(responseData);
      
      // Check if this is a new tool execution or update to existing
      let executionId = this.findExecutionByTool(toolName);
      
      if (!executionId) {
        // Start new execution
        executionId = this.startExecution(toolName, parsedData);
      }

      // Update with results
      if (parsedData.success !== undefined) {
        if (parsedData.success) {
          this.completeExecution(executionId, parsedData);
        } else {
          this.failExecution(executionId, parsedData.error || 'Tool execution failed');
        }
      } else {
        // Update progress
        this.updateProgress(executionId, 50, { rawResponse: responseData });
      }
    } catch (error) {
      console.error('Error parsing tool response:', error);
    }
  }

  // Find execution by tool name (for matching streaming responses)
  private findExecutionByTool(toolName: string): string | null {
    for (const execution of this.executions.values()) {
      if (execution.toolName === toolName && execution.status !== 'completed' && execution.status !== 'error') {
        return execution.id;
      }
    }
    return null;
  }

  // Get all executions (for UI display)
  getAllExecutions(): ToolExecution[] {
    return Array.from(this.executions.values()).sort((a, b) => a.startTime - b.startTime);
  }

  // Get recent executions (last 20)
  getRecentExecutions(limit: number = 20): ToolExecution[] {
    return this.getAllExecutions().slice(-limit);
  }

  // Get currently running executions
  getCurrentExecutions(): ToolExecution[] {
    return this.currentExecutions
      .map(id => this.executions.get(id))
      .filter(Boolean) as ToolExecution[];
  }

  // Get active executions (not completed or errored)
  getActiveExecutions(): ToolExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.status !== 'completed' && execution.status !== 'error'
    );
  }

  // Clear all executions (for new conversation)
  clearExecutions(): void {
    this.executions.clear();
    this.currentExecutions = [];
    this.emit('executionsCleared');
    this.emit('executionsUpdated', []);
  }

  // Clear old executions (keep last 50)
  cleanupOldExecutions(): void {
    const allExecutions = this.getAllExecutions();
    if (allExecutions.length > 50) {
      const toKeep = allExecutions.slice(-50);
      this.executions.clear();
      
      toKeep.forEach(execution => {
        this.executions.set(execution.id, execution);
      });

      this.emit('executionsUpdated', this.getAllExecutions());
    }
  }

  // Generate action description based on tool and parameters
  private getActionDescription(toolName: string, parameters: any): string {
    // Extract query from various possible parameter sources
    const extractQuery = (params: any): string => {
      return params.query || params.action || params.searchType || params.mood || 
             params.playlistName || params.restaurantName || params.destination || 
             params.location || params.symbol || params.text || params.content || '';
    };

    const query = extractQuery(parameters);
    
    switch (toolName) {
      case 'web_search':
        return query ? `Searching for: "${query}"` : 'Searching web';
      case 'news_search':
        return query ? `Searching news for: "${query}"` : 'Searching news';
      case 'social_search':
        return query ? `Searching social media for: "${query}"` : 'Searching social media';
      case 'academic_search':
        return query ? `Searching academic sources for: "${query}"` : 'Searching academic sources';
      case 'image_search':
        return query ? `Searching images for: "${query}"` : 'Searching images';
      case 'music_recommendations':
        return query ? `Finding music for: "${query}"` : 'Finding music recommendations';
      case 'spotify_playlist':
        return query ? `Creating playlist: "${query}"` : 'Creating playlist';
      case 'weather_check':
        return query ? `Checking weather for: ${query}` : 'Checking weather';
      case 'timezone_converter':
        return query ? `Converting time: ${query}` : 'Converting time zones';
      case 'calculator':
        return query ? `Calculating: ${query}` : 'Performing calculation';
      case 'translation':
        return query ? `Translating: "${query}"` : 'Translating text';
      case 'stock_lookup':
        return query ? `Getting stock data for: ${query}` : 'Getting stock data';
      case 'crypto_lookup':
        return query ? `Getting crypto data for: ${query}` : 'Getting crypto prices';
      case 'currency_converter':
        return query ? `Converting currency: ${query}` : 'Converting currency';
      case 'text_generator':
        return query ? `Generating text: "${query}"` : 'Generating content';
      case 'code_generator':
        return query ? `Writing code: ${query}` : 'Writing code';
      case 'linkedin_helper':
        return query ? `Creating LinkedIn post: "${query}"` : 'Creating LinkedIn post';
      case 'email_assistant':
        return query ? `Drafting email: "${query}"` : 'Drafting email';
      case 'fitness_tracker':
        return query ? `Tracking fitness: ${query}` : 'Tracking workout';
      case 'nutrition_lookup':
        return query ? `Analyzing nutrition: ${query}` : 'Analyzing nutrition';
      case 'reservation_booking':
        return query ? `Booking table at: ${query}` : 'Booking restaurant';
      case 'itinerary_generator':
        return query ? `Planning trip to: ${query}` : 'Planning trip';
      case 'credit_management':
        return query ? `Managing credits: ${query}` : 'Managing credits';
      case 'qr_generator':
        return query ? `Creating QR code: "${query}"` : 'Creating QR code';
      case 'password_generator':
        return query ? `Generating password: ${query}` : 'Generating password';
      default:
        const displayName = toolName.replace(/_/g, ' ');
        return query ? `${displayName}: "${query}"` : `Executing ${displayName}`;
    }
  }

  // Auto-detect tool executions from chat message content
  detectToolExecutionsInMessage(message: string): void {
    // Look for tool execution patterns in the message
    const toolPatterns = [
      // Web search pattern
      { regex: /🔍.*?searching/i, tool: 'web_search', action: 'Starting web search' },
      { regex: /🌐.*?found.*?results/i, tool: 'web_search', action: 'Processing search results' },
      
      // Music patterns
      { regex: /🎵.*?(music|song|playlist)/i, tool: 'music_recommendations', action: 'Generating music recommendations' },
      { regex: /🎧.*?(spotify|playlist)/i, tool: 'spotify_playlist', action: 'Creating Spotify playlist' },
      
      // Restaurant patterns
      { regex: /🍽️.*?(restaurant|booking|reservation)/i, tool: 'reservation_booking', action: 'Processing restaurant booking' },
      
      // Travel patterns
      { regex: /✈️.*?(travel|trip|itinerary)/i, tool: 'itinerary_generator', action: 'Planning travel itinerary' },
    ];

    for (const pattern of toolPatterns) {
      if (pattern.regex.test(message)) {
        // Check for existing active execution for this tool
        const existingExecution = this.findExecutionByTool(pattern.tool);
        if (!existingExecution) {
          this.startExecution(pattern.tool, { detectedFromMessage: true });
        }
      }
    }
  }
}

export default ToolExecutionService;