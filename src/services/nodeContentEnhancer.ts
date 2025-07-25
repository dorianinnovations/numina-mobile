import { SandboxNode } from '../types/sandbox';
import ApiService from './api';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore: number;
  timestamp: string;
}

interface ToolExecutionData {
  toolName: string;
  query: string;
  results: any;
  executionTime: string;
  success: boolean;
}

interface EnhancedNodeData {
  searchResults: SearchResult[];
  toolExecutions: ToolExecutionData[];
  dataConnections: Array<{
    type: string;
    value: any;
    source: string;
    relevanceScore: number;
    metadata?: any;
  }>;
  personalizedContext: string;
}

class NodeContentEnhancerService {
  private executionCache = new Map<string, ToolExecutionData[]>();
  private searchResultsCache = new Map<string, SearchResult[]>();

  async captureToolExecution(
    toolName: string,
    query: string,
    results: any,
    nodeId?: string
  ): Promise<void> {
    const executionData: ToolExecutionData = {
      toolName,
      query,
      results,
      executionTime: new Date().toISOString(),
      success: !!results
    };

    // Store in cache for immediate access
    const cacheKey = nodeId || query;
    const existingExecutions = this.executionCache.get(cacheKey) || [];
    existingExecutions.push(executionData);
    this.executionCache.set(cacheKey, existingExecutions);

    console.log(`📊 Captured tool execution: ${toolName} for query: ${query}`);
  }

  parseSearchResults(toolResponse: any, toolName: string): SearchResult[] {
    const searchResults: SearchResult[] = [];

    try {
      // Handle different tool response formats
      switch (toolName) {
        case 'web_search':
          if (toolResponse?.results) {
            toolResponse.results.forEach((result: any, index: number) => {
              searchResults.push({
                title: result.title || `Search Result ${index + 1}`,
                url: result.url || result.link || '',
                snippet: result.snippet || result.description || '',
                source: 'Web Search',
                relevanceScore: result.relevanceScore || 0.8,
                timestamp: new Date().toISOString()
              });
            });
          }
          break;

        case 'news_search':
          if (toolResponse?.articles) {
            toolResponse.articles.forEach((article: any, index: number) => {
              searchResults.push({
                title: article.title || `News Article ${index + 1}`,
                url: article.url || '',
                snippet: article.description || article.content || '',
                source: 'News Search',
                relevanceScore: article.relevanceScore || 0.7,
                timestamp: article.publishedAt || new Date().toISOString()
              });
            });
          }
          break;

        case 'academic_search':
          if (toolResponse?.papers) {
            toolResponse.papers.forEach((paper: any, index: number) => {
              searchResults.push({
                title: paper.title || `Academic Paper ${index + 1}`,
                url: paper.url || paper.doi || '',
                snippet: paper.abstract || paper.summary || '',
                source: 'Academic Search',
                relevanceScore: paper.citationCount ? Math.min(paper.citationCount / 100, 1) : 0.6,
                timestamp: paper.publishedDate || new Date().toISOString()
              });
            });
          }
          break;

        case 'social_search':
          if (toolResponse?.posts) {
            toolResponse.posts.forEach((post: any, index: number) => {
              searchResults.push({
                title: post.title || `Social Post ${index + 1}`,
                url: post.url || '',
                snippet: post.content || post.text || '',
                source: `Social Media (${post.platform || 'Unknown'})`,
                relevanceScore: post.engagement ? Math.min(post.engagement / 1000, 1) : 0.5,
                timestamp: post.createdAt || new Date().toISOString()
              });
            });
          }
          break;

        default:
          // Generic result parsing
          if (typeof toolResponse === 'object' && toolResponse !== null) {
            Object.keys(toolResponse).forEach((key, index) => {
              if (toolResponse[key] && typeof toolResponse[key] === 'object') {
                searchResults.push({
                  title: toolResponse[key].title || `${toolName} Result ${index + 1}`,
                  url: toolResponse[key].url || '',
                  snippet: JSON.stringify(toolResponse[key]).substring(0, 200),
                  source: toolName,
                  relevanceScore: 0.6,
                  timestamp: new Date().toISOString()
                });
              }
            });
          }
      }
    } catch (error) {
      console.error(`❌ Error parsing search results for ${toolName}:`, error);
    }

    return searchResults;
  }

  async enhanceNodeWithToolData(
    node: SandboxNode,
    query: string
  ): Promise<SandboxNode> {
    try {
      // Get cached executions for this query
      const cachedExecutions = this.executionCache.get(query) || this.executionCache.get(node.id) || [];
      const cachedSearchResults = this.searchResultsCache.get(query) || this.searchResultsCache.get(node.id) || [];

      // Process tool executions into search results
      const allSearchResults: SearchResult[] = [...cachedSearchResults];
      const toolExecutions: ToolExecutionData[] = [];

      for (const execution of cachedExecutions) {
        toolExecutions.push(execution);
        
        // Parse search results from tool execution
        const searchResults = this.parseSearchResults(execution.results, execution.toolName);
        allSearchResults.push(...searchResults);
      }

      // Create data connections from search results
      const dataConnections = allSearchResults.map(result => ({
        type: 'search_result',
        value: {
          title: result.title,
          url: result.url,
          snippet: result.snippet,
          source: result.source
        },
        source: result.source,
        relevanceScore: result.relevanceScore,
        metadata: {
          timestamp: result.timestamp,
          toolUsed: result.source
        }
      }));

      // Add tool execution data connections
      toolExecutions.forEach(execution => {
        dataConnections.push({
          type: 'tool_execution',
          value: {
            toolName: execution.toolName,
            query: execution.query,
            results: execution.results,
            success: execution.success
          },
          source: `Tool: ${execution.toolName}`,
          relevanceScore: execution.success ? 0.9 : 0.3,
          metadata: {
            timestamp: execution.executionTime,
            toolName: execution.toolName
          }
        });
      });

      // Generate personalized context based on search results
      const personalizedContext = this.generatePersonalizedContext(
        allSearchResults,
        toolExecutions,
        node.title
      );

      // Enhanced node with tool data
      const enhancedNode: SandboxNode = {
        ...node,
        deepInsights: {
          ...node.deepInsights,
          summary: node.deepInsights?.summary || node.content,
          keyPatterns: [
            ...(node.deepInsights?.keyPatterns || []),
            ...this.extractKeyPatterns(allSearchResults)
          ],
          personalizedContext,
          dataConnections: [
            ...(node.deepInsights?.dataConnections || []),
            ...dataConnections
          ],
          relevanceScore: Math.max(
            node.deepInsights?.relevanceScore || 0.5,
            this.calculateOverallRelevance(dataConnections)
          )
        },
        // Add media assets from search results
        mediaAssets: [
          ...(node.mediaAssets || []),
          ...this.extractMediaAssets(allSearchResults)
        ]
      };

      console.log(`✨ Enhanced node "${node.title}" with ${dataConnections.length} data connections`);
      return enhancedNode;

    } catch (error) {
      console.error(`❌ Failed to enhance node "${node.title}":`, error);
      return node; // Return original node if enhancement fails
    }
  }

  private generatePersonalizedContext(
    searchResults: SearchResult[],
    toolExecutions: ToolExecutionData[],
    nodeTitle: string
  ): string {
    if (searchResults.length === 0 && toolExecutions.length === 0) {
      return `This insight about "${nodeTitle}" is based on your personal patterns and behavioral data.`;
    }

    const searchSources = [...new Set(searchResults.map(r => r.source))];
    const toolsUsed = [...new Set(toolExecutions.map(e => e.toolName))];

    let context = `This insight about "${nodeTitle}" combines your personal data with external research. `;

    if (searchResults.length > 0) {
      context += `I found ${searchResults.length} relevant external sources from ${searchSources.join(', ')}. `;
    }

    if (toolsUsed.length > 0) {
      context += `Analysis used: ${toolsUsed.join(', ')}. `;
    }

    context += `The information has been personalized based on your unique behavioral patterns and preferences.`;

    return context;
  }

  private extractKeyPatterns(searchResults: SearchResult[]): string[] {
    const patterns: string[] = [];
    
    // Extract common themes from search result titles and snippets
    const allText = searchResults.map(r => `${r.title} ${r.snippet}`).join(' ').toLowerCase();
    
    // Simple keyword extraction (could be enhanced with NLP)
    const commonWords = ['insight', 'pattern', 'behavior', 'analysis', 'research', 'study', 'data'];
    const foundPatterns = commonWords.filter(word => allText.includes(word));
    
    patterns.push(...foundPatterns.map(word => `External ${word} data`));
    
    // Add source-based patterns
    const sources = [...new Set(searchResults.map(r => r.source))];
    patterns.push(...sources.map(source => `${source} insights`));

    return patterns.slice(0, 5); // Limit to 5 patterns
  }

  private extractMediaAssets(searchResults: SearchResult[]): Array<{
    type: 'image' | 'link' | 'video' | 'document';
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
  }> {
    const mediaAssets: any[] = [];

    searchResults.forEach(result => {
      if (result.url) {
        mediaAssets.push({
          type: 'link' as const,
          url: result.url,
          title: result.title,
          description: result.snippet,
          thumbnail: undefined // Could be enhanced with URL preview service
        });
      }
    });

    return mediaAssets.slice(0, 10); // Limit to 10 media assets
  }

  private calculateOverallRelevance(dataConnections: any[]): number {
    if (dataConnections.length === 0) return 0.5;
    
    const totalRelevance = dataConnections.reduce((sum, conn) => sum + conn.relevanceScore, 0);
    return Math.min(totalRelevance / dataConnections.length, 1.0);
  }

  async processStreamingMessage(message: string, query: string): Promise<void> {
    // Detect and capture tool executions from streaming messages
    const toolPatterns = [
      { regex: /🔍\s*(Searching the web for:|Searching web for:|Web search for:)\s*(.+)/i, tool: 'web_search' },
      { regex: /📰\s*(Searching latest news:|News search for:|Finding latest news)\s*(.+)/i, tool: 'news_search' },
      { regex: /🐦\s*(Searching (twitter|reddit|social media):|Social search for:)\s*(.+)/i, tool: 'social_search' },
      { regex: /🎓\s*(Searching academic papers:|Academic search for:|Research search)\s*(.+)/i, tool: 'academic_search' },
      { regex: /🖼️\s*(Finding images:|Image search for:|Searching for images)\s*(.+)/i, tool: 'image_search' }
    ];

    for (const pattern of toolPatterns) {
      const match = message.match(pattern.regex);
      if (match) {
        console.log(`🎯 Detected ${pattern.tool} execution in streaming message`);
        // This would be enhanced to capture actual results when they come through
        await this.captureToolExecution(pattern.tool, query, { detected: true });
        break;
      }
    }
  }

  clearCache(): void {
    this.executionCache.clear();
    this.searchResultsCache.clear();
    console.log('🧹 Cleared node content enhancer cache');
  }

  getCacheStats(): { executions: number; searches: number } {
    return {
      executions: this.executionCache.size,
      searches: this.searchResultsCache.size
    };
  }
}

export default new NodeContentEnhancerService();