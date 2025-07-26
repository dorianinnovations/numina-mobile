import CloudAuth from './cloudAuth';
import ENV from '../config/environment';
import NodeContentEnhancer from './nodeContentEnhancer';

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
                      
                      // Capture tool executions from streaming messages
                      if (llamaMessage.trim()) {
                        NodeContentEnhancer.processStreamingMessage(llamaMessage.trim(), query).catch(console.error);
                      }
                      
                      if (llamaMessage.trim() && llamaMessage.trim().length > 0) {
                        // Clean up truncated messages and make them more user-friendly
                        let cleanMessage = llamaMessage.trim();
                        
                        // Fix common truncation patterns
                        if (cleanMessage.includes('Generate 2-3 discovery nodes for:')) {
                          const queryPart = query.toLowerCase();
                          if (queryPart.includes('mood') || queryPart.includes('emotion')) {
                            cleanMessage = 'Analyzing your emotional patterns and mood data...';
                          } else if (queryPart.includes('productivity') || queryPart.includes('work')) {
                            cleanMessage = 'Examining your productivity patterns and work habits...';
                          } else if (queryPart.includes('health') || queryPart.includes('fitness')) {
                            cleanMessage = 'Processing your health and fitness data...';
                          } else {
                            cleanMessage = 'Analyzing your request and gathering insights...';
                          }
                        } else if (cleanMessage.includes('Completed analysis of:')) {
                          cleanMessage = 'Analysis complete - generating personalized insights...';
                        }
                        
                        // Send update IMMEDIATELY when received
                        onUpdate({
                          currentStep: parsed.currentStep,
                          steps: parsed.steps,
                          streamingMessage: cleanMessage,
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
                    } else if (parsed.type === 'narration_complete') {
                      // Handle new simplified narration completion format
                      let finalData = parsed.data || {};
                      finalData.sessionId = sessionId;
                      finalData.originalQuery = query;
                      
                      // Since this is narration only, indicate Numina should take over
                      finalData.narrationComplete = true;
                      finalData.message = finalData.message || 'Observation complete - Numina will now process your request';
                      
                      onComplete(finalData);
                      this.activeStreams.delete(sessionId);
                    } else if (parsed.type === 'final_result') {
                      // Legacy support for old format during transition
                      let finalData = parsed.data || {};
                      finalData.sessionId = sessionId;
                      finalData.originalQuery = query;
                      
                      if (!Array.isArray(finalData.nodes)) {
                        finalData.nodes = [];
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
    // DYNAMIC: Start with base steps and add more as LLAMA continues processing
    const baseSteps: ChainOfThoughtStep[] = [
      { id: '1', title: 'Analyzing request', status: 'pending' },
      { id: '2', title: 'Evaluating context', status: 'pending' },
      { id: '3', title: 'Processing data', status: 'pending' },
    ];

    // DYNAMIC: Pool of additional steps that can be added during processing
    const additionalSteps = [
      { id: '4', title: 'Cross-referencing information', status: 'pending' },
      { id: '5', title: 'Synthesizing insights', status: 'pending' },
      { id: '6', title: 'Generating connections', status: 'pending' },
      { id: '7', title: 'Validating results', status: 'pending' },
      { id: '8', title: 'Optimizing output', status: 'pending' },
      { id: '9', title: 'Finalizing analysis', status: 'pending' },
      { id: '10', title: 'Quality checking', status: 'pending' },
      { id: '11', title: 'Preparing response', status: 'pending' },
      { id: '12', title: 'Final optimization', status: 'pending' },
    ];

    // Start with base steps - more will be added dynamically
    let steps = [...baseSteps];

    // Create contextual base messages - more will be generated dynamically
    const queryLower = query.toLowerCase();
    let baseMessages = [
      'Understanding your request...',
      'Evaluating context and parameters...',
      'Processing available data sources...',
    ];

    // Additional messages pool for dynamic addition
    let additionalMessages = [
      'Cross-referencing information...',
      'Synthesizing insights and patterns...',
      'Generating knowledge connections...',
      'Validating results and accuracy...',
      'Optimizing response quality...',
      'Finalizing comprehensive analysis...',
      'Performing quality validation...',
      'Preparing detailed response...',
      'Completing final optimization...'
    ];

    // Customize additional messages based on query content
    if (queryLower.includes('mood') || queryLower.includes('emotion')) {
      additionalMessages = [
        'Analyzing your emotional patterns...',
        'Processing mood data and trends...',
        'Examining behavioral correlations...',
        'Cross-referencing emotional states...',
        'Generating personalized insights...',
        'Creating emotional connections...',
        'Validating mood predictions...',
        'Preparing recommendations...',
        'Fine-tuning emotional analysis...'
      ];
    } else if (queryLower.includes('productivity') || queryLower.includes('work')) {
      additionalMessages = [
        'Examining your productivity patterns...',
        'Analyzing work habits and efficiency...',
        'Processing performance metrics...',
        'Cross-referencing productivity data...',
        'Identifying improvement opportunities...',
        'Generating optimization strategies...',
        'Validating effectiveness measures...',
        'Creating comprehensive action plan...',
        'Finalizing productivity insights...'
      ];
    } else if (queryLower.includes('weather') || queryLower.includes('news')) {
      additionalMessages = [
        'Searching for current information...',
        'Gathering relevant data sources...',
        'Processing real-time updates...',
        'Cross-referencing multiple sources...',
        'Synthesizing current events...',
        'Connecting related information...',
        'Validating source reliability...',
        'Formatting comprehensive results...',
        'Completing information synthesis...'
      ];
    }

    // Start with base messages, then add additional ones dynamically
    let messages = [...baseMessages];
    let currentStepIndex = 0;
    let additionalStepsAdded = 0;
    
    // DYNAMIC PROCESSING: Keep adding steps until LLAMA processing is complete
    const maxSteps = 15; // Safety limit to prevent infinite loops
    const baseProcessingTime = 4000; // 4 seconds minimum processing
    const startTime = Date.now();
    
    while (currentStepIndex < steps.length && currentStepIndex < maxSteps) {
      // Update current step to active
      steps[currentStepIndex].status = 'active';
      steps[currentStepIndex].message = messages[currentStepIndex];
      
      onUpdate({
        currentStep: steps[currentStepIndex].id,
        steps: [...steps],
        streamingMessage: messages[currentStepIndex],
        completed: false
      });

      // Simulate realistic processing time (1-3 seconds per step)
      const stepProcessingTime = 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, stepProcessingTime));

      // Complete current step
      steps[currentStepIndex].status = 'completed';
      steps[currentStepIndex].message = undefined;
      
      onUpdate({
        currentStep: steps[currentStepIndex].id,
        steps: [...steps],
        streamingMessage: '',
        completed: false
      });

      currentStepIndex++;
      
      // DYNAMIC: Add more steps if processing continues and we haven't reached safety limit
      const elapsedTime = Date.now() - startTime;
      const shouldContinueProcessing = elapsedTime < baseProcessingTime || (Math.random() > 0.3 && currentStepIndex < 6);
      
      if (shouldContinueProcessing && currentStepIndex >= steps.length && additionalStepsAdded < additionalSteps.length) {
        // Add next step dynamically
        const nextStep = additionalSteps[additionalStepsAdded];
        const nextMessage = additionalMessages[additionalStepsAdded] || `Processing step ${steps.length + 1}...`;
        
        steps.push(nextStep);
        messages.push(nextMessage);
        additionalStepsAdded++;
        
        console.log(`🔄 Dynamically added step ${steps.length}: ${nextStep.title}`);
      }

      // Brief pause between steps
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Simulate narration completion
    await new Promise(resolve => setTimeout(resolve, 1000));
    onComplete({
      sessionId: sessionId || `sim_${Date.now()}`,
      narrationComplete: true,
      message: 'Observation complete - Numina will now process your request',
      originalQuery: query,
      completed: true
    });
  }

  private generateMockNodes(query: string): any[] {
    const timestamp = Date.now();
    const baseNodes = [
      {
        id: `node_${timestamp}_1`,
        title: 'Personal Growth Pattern',
        content: 'Analysis of your development journey based on behavioral data',
        category: 'insight',
        confidence: 0.87
      },
      {
        id: `node_${timestamp}_2`, 
        title: 'Decision Making Style',
        content: 'Your unique approach to making choices in various contexts',
        category: 'behavioral',
        confidence: 0.92
      },
      {
        id: `node_${timestamp}_3`,
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