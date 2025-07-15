// Utility to parse search and tool execution data from adaptive chat responses

export interface SearchResult {
  toolName: string;
  query?: string;
  searchType?: string;
  location?: string;
  results?: any[];
  message?: string;
  status: 'searching' | 'found' | 'error';
  timestamp: number;
  data?: any; // Raw tool response data
}

export interface ParsedToolExecution {
  toolName: string;
  arguments?: any;
  result?: any;
  success?: boolean;
  error?: string;
}

/**
 * Parse tool execution data from adaptive chat response content
 * Expected format: "🔧 **tool_name**: {json_data}"
 */
export function parseToolExecutions(responseContent: string): ParsedToolExecution[] {
  const toolExecutions: ParsedToolExecution[] = [];
  
  // Match tool execution pattern: 🔧 **tool_name**: {json_data}
  const toolRegex = /🔧\s*\*\*([^*]+)\*\*:\s*(\{[\s\S]*?\})(?=\n|$)/g;
  
  let match;
  while ((match = toolRegex.exec(responseContent)) !== null) {
    const toolName = match[1].trim();
    const jsonString = match[2];
    
    try {
      const toolData = JSON.parse(jsonString);
      toolExecutions.push({
        toolName,
        result: toolData,
        success: toolData.success,
        error: toolData.error,
      });
    } catch (error) {
      console.warn(`Failed to parse tool execution for ${toolName}:`, error);
      toolExecutions.push({
        toolName,
        success: false,
        error: 'Failed to parse tool response',
      });
    }
  }
  
  return toolExecutions;
}

/**
 * Convert tool executions to search results for the UI
 */
export function convertToSearchResults(toolExecutions: ParsedToolExecution[]): SearchResult[] {
  const searchResults: SearchResult[] = [];
  
  for (const execution of toolExecutions) {
    const result = execution.result;
    
    switch (execution.toolName) {
      case 'web_search':
        searchResults.push({
          toolName: 'web_search',
          query: result?.query,
          searchType: result?.searchType,
          location: result?.location,
          results: result?.results,
          message: result?.message,
          status: execution.success ? 'found' : 'error',
          timestamp: Date.now(),
          data: result,
        });
        break;
        
      case 'music_recommendations':
        searchResults.push({
          toolName: 'music_recommendations',
          query: `${result?.mood || 'music'} recommendations`,
          message: result?.message || `Created ${result?.playlistName || 'playlist'}`,
          results: result?.recommendations,
          status: execution.success ? 'found' : 'error',
          timestamp: Date.now(),
          data: result,
        });
        break;
        
      case 'reservation_booking':
        searchResults.push({
          toolName: 'reservation_booking',
          query: `${result?.details?.restaurant || 'restaurant'} reservation`,
          message: result?.message,
          status: execution.success ? 'found' : 'error',
          timestamp: Date.now(),
          data: result,
        });
        break;
        
      case 'spotify_playlist':
        searchResults.push({
          toolName: 'spotify_playlist',
          query: `Spotify playlist: ${result?.playlistName || 'music'}`,
          message: result?.message,
          status: execution.success ? 'found' : 'error',
          timestamp: Date.now(),
          data: result,
        });
        break;
        
      default:
        // Generic tool execution
        searchResults.push({
          toolName: execution.toolName,
          query: execution.toolName.replace('_', ' '),
          message: result?.message || `${execution.toolName} executed`,
          status: execution.success ? 'found' : 'error',
          timestamp: Date.now(),
          data: result,
        });
    }
  }
  
  return searchResults;
}

/**
 * Extract real-time search progress from streaming content
 * This helps show searches as they happen during streaming
 */
export function extractSearchProgress(streamingContent: string): {
  isSearching: boolean;
  currentTool?: string;
  searchQuery?: string;
} {
  // Look for tool execution markers in streaming content
  const toolStartRegex = /🔧\s*\*\*([^*]+)\*\*/;
  const match = streamingContent.match(toolStartRegex);
  
  if (match) {
    const toolName = match[1].trim();
    return {
      isSearching: true,
      currentTool: toolName,
      searchQuery: getSearchQueryFromTool(toolName, streamingContent),
    };
  }
  
  return {
    isSearching: false,
  };
}

function getSearchQueryFromTool(toolName: string, content: string): string {
  switch (toolName) {
    case 'web_search':
      const queryMatch = content.match(/"query":\s*"([^"]+)"/);
      return queryMatch ? queryMatch[1] : 'searching web...';
      
    case 'music_recommendations':
      const moodMatch = content.match(/"mood":\s*"([^"]+)"/);
      return moodMatch ? `${moodMatch[1]} music` : 'finding music...';
      
    case 'reservation_booking':
      const restaurantMatch = content.match(/"restaurant":\s*"([^"]+)"/);
      return restaurantMatch ? `${restaurantMatch[1]} reservation` : 'booking restaurant...';
      
    default:
      return `executing ${toolName}...`;
  }
}

/**
 * Hook to manage search state in chat components
 */
export class SearchStateManager {
  private searchResults: SearchResult[] = [];
  private isSearching = false;
  private listeners: Array<(state: { searchResults: SearchResult[]; isSearching: boolean }) => void> = [];
  
  addListener(callback: (state: { searchResults: SearchResult[]; isSearching: boolean }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  private notifyListeners() {
    const state = {
      searchResults: [...this.searchResults],
      isSearching: this.isSearching,
    };
    this.listeners.forEach(listener => listener(state));
  }
  
  updateFromStreamingContent(content: string) {
    const progress = extractSearchProgress(content);
    
    if (progress.isSearching !== this.isSearching) {
      this.isSearching = progress.isSearching;
      this.notifyListeners();
    }
  }
  
  updateFromFinalResponse(responseContent: string) {
    const toolExecutions = parseToolExecutions(responseContent);
    const newSearchResults = convertToSearchResults(toolExecutions);
    
    this.searchResults = newSearchResults;
    this.isSearching = false;
    this.notifyListeners();
  }
  
  reset() {
    this.searchResults = [];
    this.isSearching = false;
    this.notifyListeners();
  }
  
  getState() {
    return {
      searchResults: [...this.searchResults],
      isSearching: this.isSearching,
    };
  }
}