import { EventEmitter } from 'events';
import AutoPlaylistService from './autoPlaylistService';

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

class ToolExecutionService extends EventEmitter {
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
    
    const execution: ToolExecution = {
      id: executionId,
      toolName,
      status: 'starting',
      startTime: Date.now(),
      details: {
        parameters,
        action: this.getActionDescription(toolName, parameters),
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
    switch (toolName) {
      case 'web_search':
        return `Searching for: "${parameters.query || 'information'}"`;
      case 'music_recommendations':
        return `Finding ${parameters.mood || 'music'} recommendations`;
      case 'spotify_playlist':
        return `Creating Spotify playlist: "${parameters.playlistName || 'New Playlist'}"`;
      case 'reservation_booking':
        return `Booking restaurant: ${parameters.restaurantName || 'searching options'}`;
      case 'itinerary_generator':
        return `Planning trip to: ${parameters.destination || 'destination'}`;
      case 'credit_management':
        return `Managing credits: ${parameters.action || 'processing'}`;
      default:
        return `Executing ${toolName.replace('_', ' ')}`;
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
        // Check if we already have an active execution for this tool
        const existingExecution = this.findExecutionByTool(pattern.tool);
        if (!existingExecution) {
          this.startExecution(pattern.tool, { detectedFromMessage: true });
        }
      }
    }
  }
}

export default ToolExecutionService;