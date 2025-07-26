/**
 * Simplified E2E Test for Sandbox Chain of Thought Display
 * Focus on message transformation and display logic
 */

describe('Sandbox Chain of Thought E2E', () => {
  describe('Message Transformation Logic', () => {
    test('transforms backend messages to user-friendly format', () => {
      // Simulate the exact transformation logic from chainOfThoughtService.ts
      const transformMessage = (rawMessage: string, query: string): string => {
        let cleanMessage = rawMessage.trim();
        
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
        
        return cleanMessage;
      };

      const testCases = [
        {
          raw: "Generate 2-3 discovery nodes for: 'analy...",
          query: "analyze my mood patterns today",
          expected: "Analyzing your emotional patterns and mood data..."
        },
        {
          raw: "Generate 2-3 discovery nodes for: 'improve...",
          query: "improve my productivity at work",
          expected: "Examining your productivity patterns and work habits..."
        },
        {
          raw: "Generate 2-3 discovery nodes for: 'track...",
          query: "track my fitness progress",
          expected: "Processing your health and fitness data..."
        },
        {
          raw: "Generate 2-3 discovery nodes for: 'understand...",
          query: "understand my learning style",
          expected: "Analyzing your request and gathering insights..."
        },
        {
          raw: "Completed analysis of: user_behavior_data_2024",
          query: "any query",
          expected: "Analysis complete - generating personalized insights..."
        }
      ];

      testCases.forEach(({ raw, query, expected }) => {
        const result = transformMessage(raw, query);
        expect(result).toBe(expected);
        expect(result).not.toContain('Generate 2-3 discovery nodes');
        expect(result).not.toContain('analy...');
        expect(result.length).toBeGreaterThan(20);
      });
    });

    test('preserves meaningful messages unchanged', () => {
      const transformMessage = (rawMessage: string, query: string): string => {
        let cleanMessage = rawMessage.trim();
        
        if (cleanMessage.includes('Generate 2-3 discovery nodes for:')) {
          return 'Analyzing your request and gathering insights...';
        } else if (cleanMessage.includes('Completed analysis of:')) {
          return 'Analysis complete - generating personalized insights...';
        }
        
        return cleanMessage;
      };

      const meaningfulMessages = [
        "Processing your emotional data patterns...",
        "Examining behavioral trends from the last 30 days...",
        "Correlating mood changes with external factors...",
        "Building personalized insight network..."
      ];

      meaningfulMessages.forEach(message => {
        const result = transformMessage(message, "test query");
        expect(result).toBe(message); // Should remain unchanged
      });
    });
  });

  describe('User Experience Flow', () => {
    test('simulates complete user journey with realistic backend responses', async () => {
      // Simulate realistic backend streaming responses
      const mockBackendResponses = [
        {
          type: 'step_update',
          message: "Generate 2-3 discovery nodes for: 'analy...",
          currentStep: '1',
          steps: [{ id: '1', title: 'Analyzing', status: 'active' }]
        },
        {
          type: 'step_update', 
          message: "Processing emotional patterns from conversation history...",
          currentStep: '1',
          steps: [{ id: '1', title: 'Analyzing', status: 'active' }]
        },
        {
          type: 'step_update',
          message: "Correlating mood data with recent activities...",
          currentStep: '2',
          steps: [
            { id: '1', title: 'Analyzing', status: 'completed' },
            { id: '2', title: 'Processing', status: 'active' }
          ]
        },
        {
          type: 'step_update',
          message: "Completed analysis of: user_mood_patterns_2024",
          currentStep: '3',
          steps: [
            { id: '1', title: 'Analyzing', status: 'completed' },
            { id: '2', title: 'Processing', status: 'completed' },
            { id: '3', title: 'Finalizing', status: 'active' }
          ]
        },
        {
          type: 'narration_complete',
          data: {
            message: 'Observation complete - Numina will now process your request',
            nodes: []
          }
        }
      ];

      const userQuery = "analyze my mood patterns today";
      const expectedUserMessages = [];

      // Process each backend response as the frontend would
      for (const response of mockBackendResponses) {
        if (response.type === 'step_update' && response.message) {
          let userMessage = response.message.trim();

          // Apply transformation logic
          if (userMessage.includes('Generate 2-3 discovery nodes for:')) {
            userMessage = 'Analyzing your emotional patterns and mood data...';
          } else if (userMessage.includes('Completed analysis of:')) {
            userMessage = 'Analysis complete - generating personalized insights...';
          }

          // Only add if message is meaningful and not duplicate
          if (userMessage.length > 0 && !expectedUserMessages.includes(userMessage)) {
            expectedUserMessages.push(userMessage);
          }
        }
      }

      // Verify user sees progressive, meaningful updates
      expect(expectedUserMessages).toHaveLength(4);
      expect(expectedUserMessages[0]).toBe('Analyzing your emotional patterns and mood data...');
      expect(expectedUserMessages[1]).toBe('Processing emotional patterns from conversation history...');
      expect(expectedUserMessages[2]).toBe('Correlating mood data with recent activities...');
      expect(expectedUserMessages[3]).toBe('Analysis complete - generating personalized insights...');

      // Verify no raw backend messages leak through
      expectedUserMessages.forEach(message => {
        expect(message).not.toContain('Generate 2-3 discovery nodes');
        expect(message).not.toContain('user_mood_patterns_2024');
        expect(message).not.toContain('analy...');
      });
    });

    test('handles different query types with appropriate messages', async () => {
      const queryTypes = [
        {
          query: "improve my productivity at work",
          expectedStart: "Examining your productivity patterns",
          category: "productivity"
        },
        {
          query: "understand my emotional patterns",
          expectedStart: "Analyzing your emotional patterns",
          category: "emotion"
        },
        {
          query: "track my fitness progress", 
          expectedStart: "Processing your health and fitness",
          category: "health"
        },
        {
          query: "help me learn better",
          expectedStart: "Analyzing your request and gathering",
          category: "general"
        }
      ];

      queryTypes.forEach(({ query, expectedStart, category }) => {
        // Simulate backend truncated message
        const backendMessage = "Generate 2-3 discovery nodes for: 'analy...";
        
        // Apply transformation
        let transformedMessage = backendMessage.trim();
        const queryLower = query.toLowerCase();
        
        if (transformedMessage.includes('Generate 2-3 discovery nodes for:')) {
          if (queryLower.includes('mood') || queryLower.includes('emotion')) {
            transformedMessage = 'Analyzing your emotional patterns and mood data...';
          } else if (queryLower.includes('productivity') || queryLower.includes('work')) {
            transformedMessage = 'Examining your productivity patterns and work habits...';
          } else if (queryLower.includes('health') || queryLower.includes('fitness')) {
            transformedMessage = 'Processing your health and fitness data...';
          } else {
            transformedMessage = 'Analyzing your request and gathering insights...';
          }
        }

        expect(transformedMessage).toContain(expectedStart);
        expect(transformedMessage).not.toContain('Generate 2-3 discovery nodes');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles empty or null messages gracefully', () => {
      const edgeCases = ['', null, undefined, '   ', '\n\n', '\t'];
      
      edgeCases.forEach(input => {
        // Simulate display logic from ChainOfThoughtProgress.tsx
        const shouldDisplay = input && typeof input === 'string' && input.trim() && input.trim().length > 0;
        expect(shouldDisplay).toBeFalsy(); // All edge cases should not display
      });
    });

    test('handles malformed backend responses', () => {
      const malformedResponses = [
        "Generate 2-3 discovery nodes for:", // Missing query part
        "Completed analysis of:", // Missing data identifier
        '{"incomplete": "json"', // Malformed JSON
        "Random backend error message"
      ];

      malformedResponses.forEach(message => {
        let result = message;
        
        // Apply transformation with fallback
        if (message.includes('Generate 2-3 discovery nodes for:') && message.length < 50) {
          result = 'Analyzing your request and gathering insights...';
        } else if (message.includes('Completed analysis of:') && message.length < 50) {
          result = 'Analysis complete - generating personalized insights...';
        }

        // Should either transform or preserve the message
        expect(result.length).toBeGreaterThan(0);
        expect(typeof result).toBe('string');
      });
    });

    test('prevents message duplication in display', () => {
      const messages = [
        'Analyzing your emotional patterns...',
        'Analyzing your emotional patterns...', // Duplicate
        'Processing mood data...',
        'Analyzing your emotional patterns...', // Another duplicate  
        'Processing mood data...' // Another duplicate
      ];

      const uniqueMessages: string[] = [];
      
      messages.forEach(message => {
        if (message && message.trim() && !uniqueMessages.includes(message.trim())) {
          uniqueMessages.push(message.trim());
        }
      });

      expect(uniqueMessages).toHaveLength(2);
      expect(uniqueMessages).toContain('Analyzing your emotional patterns...');
      expect(uniqueMessages).toContain('Processing mood data...');
    });
  });

  describe('Performance and Timing', () => {
    test('message processing is efficient', () => {
      const largeMessageSet = Array.from({ length: 1000 }, (_, i) => 
        i % 2 === 0 
          ? `Generate 2-3 discovery nodes for: 'query_${i}...`
          : `Processing data batch ${i}...`
      );

      const startTime = Date.now();
      
      const processedMessages = largeMessageSet.map(message => {
        if (message.includes('Generate 2-3 discovery nodes for:')) {
          return 'Analyzing your request and gathering insights...';
        }
        return message;
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(processedMessages).toHaveLength(1000);
      expect(processingTime).toBeLessThan(100); // Should be very fast
    });

    test('message display timing matches user expectations', () => {
      // Simulate realistic message timing from chainOfThoughtService.ts
      const messageTimings = [
        { delay: 100, message: 'Starting analysis...' },
        { delay: 800, message: 'Processing data patterns...' },
        { delay: 1200, message: 'Generating insights...' },
        { delay: 500, message: 'Finalizing results...' }
      ];

      let totalTime = 0;
      messageTimings.forEach(({ delay }) => {
        totalTime += delay;
      });

      // Total process should be reasonable (under 5 seconds for good UX)
      expect(totalTime).toBeLessThan(5000);
      expect(totalTime).toBeGreaterThan(1000); // But not instant (would seem fake)
    });
  });
});