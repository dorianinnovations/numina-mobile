import CloudAuth from './cloudAuth';

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
  private readonly baseURL = 'https://server-a7od.onrender.com';
  private activeStreams: Map<string, AbortController> = new Map();

  async startChainOfThought(
    query: string,
    options: any,
    onUpdate: (response: ChainOfThoughtResponse) => void,
    onComplete: (finalData: any) => void,
    onError: (error: any) => void
  ): Promise<string> {
    const sessionId = `cot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const token = CloudAuth.getInstance().getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Abort any existing stream for this session
      if (this.activeStreams.has(sessionId)) {
        this.activeStreams.get(sessionId)?.abort();
      }

      const controller = new AbortController();
      this.activeStreams.set(sessionId, controller);

      const response = await fetch(`${this.baseURL}/sandbox/chain-of-thought`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          query,
          options,
          sessionId,
          stream: true
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ Chain of thought stream completed');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  onComplete({ sessionId, completed: true });
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  
                  if (parsed.type === 'step_update') {
                    onUpdate({
                      currentStep: parsed.currentStep,
                      steps: parsed.steps,
                      streamingMessage: parsed.message || '',
                      completed: false
                    });
                  } else if (parsed.type === 'final_result') {
                    onComplete(parsed.data);
                  } else if (parsed.type === 'error') {
                    onError(new Error(parsed.message));
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        } catch (streamError) {
          if (streamError.name !== 'AbortError') {
            console.error('Stream processing error:', streamError);
            onError(streamError);
          }
        } finally {
          reader.releaseLock();
          this.activeStreams.delete(sessionId);
        }
      };

      processStream();
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
      console.log(`🛑 Chain of thought stream stopped: ${sessionId}`);
    }
  }

  // Fallback method for when the main endpoint is unavailable
  async simulateChainOfThought(
    query: string,
    options: any,
    onUpdate: (response: ChainOfThoughtResponse) => void,
    onComplete: (finalData: any) => void
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
      console.log('⚠️ Quick insight unavailable:', error);
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
}

export default new ChainOfThoughtService();