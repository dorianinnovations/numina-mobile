import AutoPlaylistService from './autoPlaylistService';

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

  startExecution(toolName: string, parameters: any = {}): string {
    const executionId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
        query: query,
        searchType: parameters.searchType || 'general',
      },
      progress: 0,
    };

    this.executions.set(executionId, execution);
    this.currentExecutions.push(executionId);

    this.emit('executionStarted', execution);
    this.emit('executionsUpdated', this.getAllExecutions());

    return executionId;
  }

  updateProgress(executionId: string, progress: number, details?: any): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.progress = progress;
    execution.status = 'executing';
    
    if (details) {
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

    this.emit('executionProgress', execution);
    this.emit('executionsUpdated', this.getAllExecutions());
  }

  completeExecution(executionId: string, results: any): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'completed';
    execution.endTime = Date.now();
    execution.progress = 100;
    execution.details.results = results;

    this.currentExecutions = this.currentExecutions.filter(id => id !== executionId);

    
    this.processForAutoPlaylist(execution);
    
    this.emit('executionCompleted', execution);
    this.emit('executionsUpdated', this.getAllExecutions());
  }

  private async processForAutoPlaylist(execution: ToolExecution): Promise<void> {
    try {
      if (execution.status === 'completed' && execution.details.results) {
        await this.autoPlaylistService.processToolExecutionForMusic(
          execution.toolName, 
          execution.details.results
        );
      }
    } catch (error) {
    }
  }

  failExecution(executionId: string, error: string): void {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    execution.status = 'error';
    execution.endTime = Date.now();
    execution.details.error = error;

    this.currentExecutions = this.currentExecutions.filter(id => id !== executionId);

    this.emit('executionFailed', execution);
    this.emit('executionsUpdated', this.getAllExecutions());
  }

  processStreamingToolResponse(rawResponse: string): void {
    const toolCallMatch = rawResponse.match(/🔧 \*\*([^:]+)\*\*: ({.*})/);
    if (!toolCallMatch) return;

    const toolName = toolCallMatch[1].toLowerCase().replace(/\s+/g, '_');
    const responseData = toolCallMatch[2];

    try {
      const parsedData = JSON.parse(responseData);
      
      let executionId = this.findExecutionByTool(toolName);
      
      if (!executionId) {
        executionId = this.startExecution(toolName, parsedData);
      }

      if (parsedData.success !== undefined) {
        if (parsedData.success) {
          this.completeExecution(executionId, parsedData);
        } else {
          this.failExecution(executionId, parsedData.error || 'Tool execution failed');
        }
              } else {
          this.updateProgress(executionId, 50, { rawResponse: responseData });
        }
    } catch (error) {
    }
  }

  private findExecutionByTool(toolName: string): string | null {
    for (const execution of this.executions.values()) {
      if (execution.toolName === toolName && execution.status !== 'completed' && execution.status !== 'error') {
        return execution.id;
      }
    }
    return null;
  }

  getAllExecutions(): ToolExecution[] {
    return Array.from(this.executions.values()).sort((a, b) => a.startTime - b.startTime);
  }

  getRecentExecutions(limit: number = 20): ToolExecution[] {
    return this.getAllExecutions().slice(-limit);
  }

  getCurrentExecutions(): ToolExecution[] {
    return this.currentExecutions
      .map(id => this.executions.get(id))
      .filter(Boolean) as ToolExecution[];
  }

  getActiveExecutions(): ToolExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.status !== 'completed' && execution.status !== 'error'
    );
  }

  clearExecutions(): void {
    this.executions.clear();
    this.currentExecutions = [];
    this.emit('executionsCleared');
    this.emit('executionsUpdated', []);
  }

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

  private getActionDescription(toolName: string, parameters: any): string {
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

  detectToolExecutionsInMessage(message: string): void {
    const toolPatterns = [
      { regex: /🔍.*?searching/i, tool: 'web_search', action: 'Starting web search' },
      { regex: /🌐.*?found.*?results/i, tool: 'web_search', action: 'Processing search results' },
      
      { regex: /🎵.*?(music|song|playlist)/i, tool: 'music_recommendations', action: 'Generating music recommendations' },
      { regex: /🎧.*?(spotify|playlist)/i, tool: 'spotify_playlist', action: 'Creating Spotify playlist' },
      
      { regex: /🍽️.*?(restaurant|booking|reservation)/i, tool: 'reservation_booking', action: 'Processing restaurant booking' },
      
      { regex: /✈️.*?(travel|trip|itinerary)/i, tool: 'itinerary_generator', action: 'Planning travel itinerary' },
    ];

    for (const pattern of toolPatterns) {
      if (pattern.regex.test(message)) {
        const existingExecution = this.findExecutionByTool(pattern.tool);
        if (!existingExecution) {
          this.startExecution(pattern.tool, { detectedFromMessage: true });
        }
      }
    }
  }
}

export default ToolExecutionService;