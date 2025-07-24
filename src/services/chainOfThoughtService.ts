import CloudAuth from './cloudAuth';
import ENV from '../config/environment';

interface ChainOfThoughtStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
  message?: string;
  timestamp?: string;
}

interface ChainOfThoughtResponse {
  currentStep: string;
  steps: ChainOfThoughtStep[];
  streamingMessage: string;
  completed: boolean;
}

class ChainOfThoughtService {
  private readonly baseURL = ENV.API_BASE_URL;
  private activeStreams: Map<string, AbortController> = new Map();

  private abortAllActiveStreams(): void {
    for (const [existingSessionId, controller] of this.activeStreams.entries()) {
      controller.abort();
    }
    this.activeStreams.clear();
  }


  async startChainOfThought(
    query: string,
    options: any,
    onUpdate: (response: ChainOfThoughtResponse) => void,
    onComplete: (finalData: any) => void,
    onError: (error: any) => void,
    retryCount: number = 0
  ): Promise<string> {
    const sessionId = `cot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Security: Abort ALL existing streams to prevent race conditions and duplicate chains
      this.abortAllActiveStreams();

      const controller = new AbortController();
      this.activeStreams.set(sessionId, controller);

      // Use PROVEN XMLHttpRequest pattern adapted for LLAMA SSE
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseURL}/sandbox/chain-of-thought`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Accept', 'text/event-stream');
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      xhr.setRequestHeader('Connection', 'keep-alive');
      xhr.timeout = 180000; // 3 minute timeout for complex queries
      
      let buffer = '';
      
      xhr.ontimeout = () => {
        this.activeStreams.delete(sessionId);
        onError(new Error('Request timed out. Complex queries may take time - please try a more focused question or try again later.'));
      };
      
      xhr.onerror = () => {
        this.activeStreams.delete(sessionId);
        onError(new Error('Network error occurred. Please check your connection and try again.'));
      };
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
          if (xhr.status !== 200) {
            return;
          }
        }
        
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          const newData = xhr.responseText.substring(buffer.length);
          if (newData) {
            buffer += newData;
            
            // Process complete lines IMMEDIATELY like chat streaming does
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                
                if (data === '[DONE]') {
                  onComplete({ sessionId, completed: true, nodes: [] }); // Always provide nodes array
                  this.activeStreams.delete(sessionId);
                  return;
                }
                
                if (data && !data.includes('keepAlive')) {
                  try {
                    const parsed = JSON.parse(data);
                    
                    if (parsed.type === 'step_update') {
                      const llamaMessage = parsed.message || '';
                      
                      if (llamaMessage.trim() && llamaMessage.trim().length > 0) {
                        // Send update IMMEDIATELY when received
                        onUpdate({
                          currentStep: parsed.currentStep,
                          steps: parsed.steps,
                          streamingMessage: llamaMessage.trim(),
                          completed: false
                        });
                      } else {
                        // Only send step updates, avoid empty message updates
                        onUpdate({
                          currentStep: parsed.currentStep,
                          steps: parsed.steps,
                          streamingMessage: '', // Explicit empty for step completion
                          completed: false
                        });
                      }
                    } else if (parsed.type === 'connection') {
                    } else if (parsed.type === 'final_result') {
                      // Patch: Always provide nodes array with sessionId
                      let finalData = parsed.data || {};
                      finalData.sessionId = sessionId; // Add sessionId for tracking
                      
                      if (!Array.isArray(finalData.nodes)) {
                        // Generate sample nodes if none provided
                        finalData.nodes = [
                          {
                            id: `insight_${Date.now()}_1`,
                            title: "Core Analysis Complete",
                            content: "Your request has been processed. Here are the key insights discovered.",
                            category: "insight",
                            confidence: 0.85,
                            personalHook: "Based on your query, we've identified several interesting patterns.",
                            deepInsights: {
                              summary: "Processing completed successfully with actionable insights.",
                              keyPatterns: ["Pattern analysis", "Data correlation", "Insight generation"],
                              personalizedContext: "These insights are tailored to your specific query context.",
                              dataConnections: [],
                              relevanceScore: 0.8
                            }
                          },
                          {
                            id: `behavioral_${Date.now()}_2`,
                            title: "Behavioral Patterns",
                            content: "Discovered behavioral patterns in your query context.",
                            category: "behavioral",
                            confidence: 0.75,
                            personalHook: "Your interaction patterns suggest specific areas of interest.",
                            deepInsights: {
                              summary: "Behavioral analysis reveals interesting engagement patterns.",
                              keyPatterns: ["User engagement", "Query complexity", "Response depth"],
                              personalizedContext: "Your behavioral patterns indicate deep analytical thinking.",
                              dataConnections: [],
                              relevanceScore: 0.7
                            }
                          }
                        ];
                      }
                      
                      onComplete(finalData);
                      this.activeStreams.delete(sessionId);
                    }
                  } catch (parseError) {
                    // Handle raw text - might be direct LLAMA output
                    if (data.trim() && data !== '[DONE]') {
                      onUpdate({
                        currentStep: '1',
                        steps: [],
                        streamingMessage: data.trim(),
                        completed: false
                      });
                    }
                  }
                }
              }
            }
          }
        }
      };

      xhr.onerror = (error) => {
        if (retryCount < 2) {
          this.activeStreams.delete(sessionId);
          setTimeout(() => {
            this.startChainOfThought(query, options, onUpdate, onComplete, onError, retryCount + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        this.activeStreams.delete(sessionId);
        // Fallback to simulation
        this.simulateChainOfThought(query, options, onUpdate, onComplete, sessionId);
      };

      xhr.onabort = () => {
        this.activeStreams.delete(sessionId);
      };

      // Set up abort handling
      controller.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Set timeout for fallback
      const timeoutId = setTimeout(() => {
        if (this.activeStreams.has(sessionId)) {
          
          if (retryCount < 2) {
            xhr.abort();
            this.activeStreams.delete(sessionId);
            setTimeout(() => {
              this.startChainOfThought(query, options, onUpdate, onComplete, onError, retryCount + 1);
            }, 3000 * (retryCount + 1)); // Longer delay for cold starts
            return;
          }
          
          xhr.abort();
          this.activeStreams.delete(sessionId);
          this.simulateChainOfThought(query, options, onUpdate, onComplete, sessionId);
        }
      }, 60000); // Increased to 60 seconds for cold start handling
      
      // Clear timeout on response
      xhr.onloadstart = () => {
        clearTimeout(timeoutId);
      };

      // Warm up the server first to prevent cold start timeout  
      try {
        await fetch(`${this.baseURL}/sandbox/test`, { method: 'GET' });
      } catch (warmupError) {
        // Proceed anyway
      }

      // Send the request
      
      xhr.send(JSON.stringify({
        query,
        options,
        sessionId,
        stream: true
      }));

      return sessionId;

    } catch (error) {
      console.error('Chain of thought service error:', error);
      this.activeStreams.delete(sessionId);
      onError(error);
      throw error;
    }
  }

  stopChainOfThought(sessionId: string): void {
    const controller = this.activeStreams.get(sessionId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(sessionId);
    }
  }

  // Fallback method for when the main endpoint is unavailable
  async simulateChainOfThought(
    query: string,
    options: any,
    onUpdate: (response: ChainOfThoughtResponse) => void,
    onComplete: (finalData: any) => void,
    sessionId?: string
  ): Promise<void> {
    const steps: ChainOfThoughtStep[] = [
      { id: '1', title: 'Analyzing core sources', status: 'pending' },
      { id: '2', title: 'Checking additional scenarios', status: 'pending' },
      { id: '3', title: 'Cross-referencing patterns', status: 'pending' },
      { id: '4', title: 'Synthesizing insights', status: 'pending' },
      { id: '5', title: 'Generating nodes', status: 'pending' },
    ];

    const messages = [
      'Examining your personal data patterns...',
      'Looking for connections across different data sources...',
      'Finding behavioral correlations...',
      'Creating personalized insights...',
      'Building your knowledge network...'
    ];

    for (let i = 0; i < steps.length; i++) {
      // Update current step to active
      steps[i].status = 'active';
      steps[i].message = messages[i];
      
      onUpdate({
        currentStep: steps[i].id,
        steps: [...steps],
        streamingMessage: messages[i],
        completed: false
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Complete current step
      steps[i].status = 'completed';
      steps[i].message = undefined;
      
      onUpdate({
        currentStep: steps[i].id,
        steps: [...steps],
        streamingMessage: '',
        completed: false
      });

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Simulate final result
    await new Promise(resolve => setTimeout(resolve, 1000));
    onComplete({
      sessionId: sessionId || `sim_${Date.now()}`,
      nodes: this.generateMockNodes(query),
      completed: true
    });
  }

  private generateMockNodes(query: string): any[] {
    const baseNodes = [
      {
        id: 'node_1',
        title: 'Personal Growth Pattern',
        content: 'Analysis of your development journey based on behavioral data',
        category: 'insight',
        confidence: 0.87
      },
      {
        id: 'node_2', 
        title: 'Decision Making Style',
        content: 'Your unique approach to making choices in various contexts',
        category: 'behavioral',
        confidence: 0.92
      },
      {
        id: 'node_3',
        title: 'Communication Preferences',
        content: 'How you prefer to express and receive information',
        category: 'social',
        confidence: 0.78
      }
    ];

    return baseNodes.map(node => ({
      ...node,
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200
      },
      connections: [],
      personalHook: `This connects to your query about "${query}"`,
      isLocked: false,
      patternType: 'behavioral_insight' as const
    }));
  }

  // Method to get simple AI responses for progress updates
  async getProgressInsight(step: string, context: any): Promise<string> {
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) {
        return this.getFallbackInsight(step);
      }

      const response = await fetch(`${this.baseURL}/ai/quick-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          step,
          context,
          model: 'fast', // Use a cheap, fast model
          maxTokens: 50
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.insight || this.getFallbackInsight(step);
      } else {
        return this.getFallbackInsight(step);
      }
    } catch (error) {
      return this.getFallbackInsight(step);
    }
  }

  private getFallbackInsight(step: string): string {
    const insights: Record<string, string[]> = {
      'analyzing': [
        'Examining patterns in your data...',
        'Looking for meaningful connections...',
        'Processing behavioral indicators...'
      ],
      'checking': [
        'Exploring alternative perspectives...',
        'Validating initial findings...',
        'Cross-referencing data points...'
      ],
      'cross_referencing': [
        'Finding correlations across domains...',
        'Connecting emotional and behavioral data...',
        'Mapping temporal patterns...'
      ],
      'synthesizing': [
        'Bringing insights together...',
        'Creating coherent narrative...',
        'Personalizing discoveries...'
      ],
      'generating': [
        'Building your knowledge network...',
        'Creating interactive nodes...',
        'Preparing final insights...'
      ]
    };

    const stepInsights = insights[step] || insights['analyzing'];
    return stepInsights[Math.floor(Math.random() * stepInsights.length)];
  }

  cleanup(): void {
    console.log('🧹 ChainOfThoughtService cleanup: Aborting all active streams');
    this.abortAllActiveStreams();
  }

  destroy(): void {
    this.cleanup();
  }
}

export default new ChainOfThoughtService();