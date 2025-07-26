/**
 * End-to-End Sandbox User Journey Test
 * Tests complete user flow from sandbox input to chain of thought display
 */

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../src/services/chainOfThoughtService', () => ({
  default: {
    startChainOfThought: jest.fn(),
    stopChainOfThought: jest.fn(),
    cleanup: jest.fn()
  }
}));

jest.mock('../src/services/cloudAuth', () => ({
  default: {
    getInstance: () => ({
      isAuthenticated: () => true,
      getToken: () => 'mock-token'
    })
  }
}));

jest.mock('../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    theme: 'light'
  })
}));

// Import components after mocks
import { SandboxScreen } from '../src/screens/SandboxScreen';
import chainOfThoughtService from '../src/services/chainOfThoughtService';

describe('Sandbox E2E User Journey', () => {
  let mockStartChainOfThought: jest.MockedFunction<any>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockStartChainOfThought = chainOfThoughtService.startChainOfThought as jest.MockedFunction<any>;
    
    // Mock Alert.alert
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete User Journey', () => {
    test('user enters query and sees chain of thought progress', async () => {
      // Simulate successful chain of thought response
      mockStartChainOfThought.mockImplementation(async (query, options, onUpdate, onComplete) => {
        // Simulate real backend behavior with message transformations
        const updates = [
          {
            currentStep: '1',
            steps: [{ id: '1', title: 'Analyzing', status: 'active' }],
            streamingMessage: 'Generate 2-3 discovery nodes for: \'analy...',
            completed: false
          },
          {
            currentStep: '1', 
            steps: [{ id: '1', title: 'Analyzing', status: 'active' }],
            streamingMessage: 'Analyzing your emotional patterns and mood data...',
            completed: false
          },
          {
            currentStep: '2',
            steps: [
              { id: '1', title: 'Analyzing', status: 'completed' },
              { id: '2', title: 'Processing', status: 'active' }
            ],
            streamingMessage: 'Processing mood data and trends...',
            completed: false
          }
        ];

        // Send updates with realistic timing
        for (const update of updates) {
          await new Promise(resolve => setTimeout(resolve, 500));
          onUpdate(update);
        }

        // Complete the process
        await new Promise(resolve => setTimeout(resolve, 1000));
        onComplete({
          sessionId: 'test-session',
          narrationComplete: true,
          message: 'Observation complete - Numina will now process your request',
          nodes: []
        });

        return 'test-session';
      });

      const { getByPlaceholderText, getByText, queryByText } = render(<SandboxScreen />);

      // Step 1: User enters query
      const input = getByPlaceholderText(/What would you like to explore/i);
      fireEvent.changeText(input, 'analyze my mood patterns today');

      // Step 2: User submits query
      const submitButton = getByText('Ask Numina');
      fireEvent.press(submitButton);

      // Step 3: Verify chain of thought service is called
      await waitFor(() => {
        expect(mockStartChainOfThought).toHaveBeenCalledWith(
          'analyze my mood patterns today',
          expect.any(Object),
          expect.any(Function), // onUpdate
          expect.any(Function), // onComplete
          expect.any(Function)  // onError
        );
      });

      // Step 4: Verify user sees meaningful progress messages
      await waitFor(() => {
        // Should see transformed message, not raw backend message
        expect(queryByText('Generate 2-3 discovery nodes for: \'analy...')).toBeNull();
        expect(queryByText('Analyzing your emotional patterns and mood data...')).toBeTruthy();
      }, { timeout: 3000 });

      // Step 5: Verify progression through steps
      await waitFor(() => {
        expect(queryByText('Processing mood data and trends...')).toBeTruthy();
      }, { timeout: 5000 });

      // Step 6: Verify completion
      await waitFor(() => {
        expect(queryByText('Observation complete - Numina will now process your request')).toBeTruthy();
      }, { timeout: 7000 });
    });

    test('user sees appropriate messages for different query types', async () => {
      const testCases = [
        {
          query: 'improve my productivity at work',
          expectedMessages: [
            'Examining your productivity patterns and work habits...',
            'Analyzing work efficiency and identifying improvements...'
          ]
        },
        {
          query: 'track my fitness progress',
          expectedMessages: [
            'Processing your health and fitness data...',
            'Analyzing workout patterns and health metrics...'
          ]
        },
        {
          query: 'understand my emotional state',
          expectedMessages: [
            'Analyzing your emotional patterns and mood data...',
            'Processing emotional trends and insights...'
          ]
        }
      ];

      for (const testCase of testCases) {
        mockStartChainOfThought.mockImplementation(async (query, options, onUpdate, onComplete) => {
          // Simulate backend message transformation
          let transformedMessage = 'Generate 2-3 discovery nodes for: \'analy...';
          
          if (query.toLowerCase().includes('productivity') || query.toLowerCase().includes('work')) {
            transformedMessage = 'Examining your productivity patterns and work habits...';
          } else if (query.toLowerCase().includes('fitness') || query.toLowerCase().includes('health')) {
            transformedMessage = 'Processing your health and fitness data...';
          } else if (query.toLowerCase().includes('emotion') || query.toLowerCase().includes('mood')) {
            transformedMessage = 'Analyzing your emotional patterns and mood data...';
          }

          onUpdate({
            currentStep: '1',
            steps: [{ id: '1', title: 'Analyzing', status: 'active' }],
            streamingMessage: transformedMessage,
            completed: false
          });

          onComplete({
            sessionId: 'test-session',
            narrationComplete: true,
            message: 'Analysis complete',
            nodes: []
          });

          return 'test-session';
        });

        const { getByPlaceholderText, getByText, queryByText, unmount } = render(<SandboxScreen />);

        // Enter and submit query
        const input = getByPlaceholderText(/What would you like to explore/i);
        fireEvent.changeText(input, testCase.query);
        
        const submitButton = getByText('Ask Numina');
        fireEvent.press(submitButton);

        // Verify appropriate message appears
        await waitFor(() => {
          const messageFound = testCase.expectedMessages.some(msg => 
            queryByText(msg) !== null
          );
          expect(messageFound).toBe(true);
        }, { timeout: 3000 });

        // Cleanup for next test
        unmount();
      }
    });

    test('handles backend errors gracefully', async () => {
      mockStartChainOfThought.mockImplementation(async (query, options, onUpdate, onComplete, onError) => {
        // Simulate network error
        await new Promise(resolve => setTimeout(resolve, 1000));
        onError(new Error('Network connection failed'));
      });

      const { getByPlaceholderText, getByText, queryByText } = render(<SandboxScreen />);

      const input = getByPlaceholderText(/What would you like to explore/i);
      fireEvent.changeText(input, 'test error handling');

      const submitButton = getByText('Ask Numina');
      fireEvent.press(submitButton);

      // Should handle error gracefully - either show error message or fallback
      await waitFor(() => {
        expect(mockStartChainOfThought).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Verify no crash occurred and user gets feedback
      expect(queryByText(/error/i) || queryByText(/failed/i) || queryByText(/try again/i)).toBeTruthy();
    });

    test('prevents duplicate submissions during processing', async () => {
      let updateCallback: Function;
      let completeCallback: Function;

      mockStartChainOfThought.mockImplementation(async (query, options, onUpdate, onComplete) => {
        updateCallback = onUpdate;
        completeCallback = onComplete;
        
        // Don't complete immediately - simulate long running process
        onUpdate({
          currentStep: '1',
          steps: [{ id: '1', title: 'Processing', status: 'active' }],
          streamingMessage: 'Processing your request...',
          completed: false
        });

        return 'test-session';
      });

      const { getByPlaceholderText, getByText } = render(<SandboxScreen />);

      const input = getByPlaceholderText(/What would you like to explore/i);
      fireEvent.changeText(input, 'test duplicate prevention');

      const submitButton = getByText('Ask Numina');
      
      // First submission
      fireEvent.press(submitButton);
      
      // Try to submit again immediately
      fireEvent.press(submitButton);
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockStartChainOfThought).toHaveBeenCalledTimes(1);
      });

      // Complete the first request
      act(() => {
        completeCallback({
          sessionId: 'test-session',
          narrationComplete: true,
          message: 'Complete',
          nodes: []
        });
      });
    });
  });

  describe('Chain of Thought Display', () => {
    test('displays messages in correct sequence with animations', async () => {
      const messages = [
        'Analyzing your request...',
        'Processing data patterns...',
        'Generating insights...',
        'Finalizing results...'
      ];

      mockStartChainOfThought.mockImplementation(async (query, options, onUpdate, onComplete) => {
        for (let i = 0; i < messages.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          onUpdate({
            currentStep: (i + 1).toString(),
            steps: [],
            streamingMessage: messages[i],
            completed: false
          });
        }

        onComplete({
          sessionId: 'test-session',
          narrationComplete: true,
          message: 'Complete',
          nodes: []
        });

        return 'test-session';
      });

      const { getByPlaceholderText, getByText, queryByText } = render(<SandboxScreen />);

      const input = getByPlaceholderText(/What would you like to explore/i);
      fireEvent.changeText(input, 'test message sequence');

      const submitButton = getByText('Ask Numina');
      fireEvent.press(submitButton);

      // Verify messages appear in sequence
      for (const message of messages) {
        await waitFor(() => {
          expect(queryByText(message)).toBeTruthy();
        }, { timeout: 5000 });
      }
    });

    test('shows loading indicator during processing', async () => {
      mockStartChainOfThought.mockImplementation(async (query, options, onUpdate, onComplete) => {
        // Simulate delayed response
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        onUpdate({
          currentStep: '1',
          steps: [],
          streamingMessage: 'Processing...',
          completed: false
        });

        onComplete({
          sessionId: 'test-session',
          narrationComplete: true,
          message: 'Complete',
          nodes: []
        });

        return 'test-session';
      });

      const { getByPlaceholderText, getByText, queryByText } = render(<SandboxScreen />);

      const input = getByPlaceholderText(/What would you like to explore/i);
      fireEvent.changeText(input, 'test loading indicator');

      const submitButton = getByText('Ask Numina');
      fireEvent.press(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(queryByText('Observing Numina...') || queryByText(/loading/i) || queryByText(/processing/i)).toBeTruthy();
      }, { timeout: 1000 });
    });
  });
});