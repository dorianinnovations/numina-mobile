import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { ChainOfThoughtProgress } from './ChainOfThoughtProgress';
import { EnhancedNodeModal } from './EnhancedNodeModal';
import ChainOfThoughtService from '../services/chainOfThoughtService';

interface SandboxNode {
  id: string;
  title: string;
  content: string;
  category: string;
  confidence: number;
  personalHook?: string;
  deepInsights?: {
    summary: string;
    keyPatterns: string[];
    personalizedContext: string;
    dataConnections: Array<{
      type: string;
      value: any;
      source: string;
      relevanceScore?: number;
      metadata?: any;
    }>;
    relevanceScore: number;
  };
  mediaAssets?: Array<{
    type: 'image' | 'link' | 'video' | 'document';
    url: string;
    title?: string;
    description?: string;
    thumbnail?: string;
  }>;
}

interface ChainStep {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed';
  message?: string;
  timestamp?: string;
}

interface SandboxModalManagerProps {
  onNodesGenerated?: (nodes: SandboxNode[]) => void;
  onError?: (error: any) => void;
}

export const SandboxModalManager: React.FC<SandboxModalManagerProps> = ({
  onNodesGenerated,
  onError,
}) => {
  // Progress Modal State
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  
  // Node Modal State
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodes, setNodes] = useState<SandboxNode[]>([]);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  
  // Active session tracking
  const activeSessionRef = useRef<string | null>(null);

  const startSandboxProcess = useCallback(async (query: string, options: any) => {
    try {
      // Initialize progress state
      const initialSteps: ChainStep[] = [
        { id: '1', title: 'Analyzing core sources', status: 'pending' },
        { id: '2', title: 'Checking additional scenarios', status: 'pending' },
        { id: '3', title: 'Cross-referencing patterns', status: 'pending' },
        { id: '4', title: 'Synthesizing insights', status: 'pending' },
        { id: '5', title: 'Generating nodes', status: 'pending' },
      ];
      
      setSteps(initialSteps);
      setCurrentStep('1');
      setStreamingMessage('');
      setShowProgress(true);

      // Start chain of thought process
      const sessionId = await ChainOfThoughtService.startChainOfThought(
        query,
        options,
        handleChainUpdate,
        handleChainComplete,
        handleChainError
      );

      activeSessionRef.current = sessionId;

    } catch (error) {
      console.error('Failed to start sandbox process:', error);
      handleChainError(error);
    }
  }, []);

  const handleChainUpdate = useCallback((response: any) => {
    setCurrentStep(response.currentStep);
    setSteps(response.steps);
    setStreamingMessage(response.streamingMessage || '');
  }, []);

  const handleChainComplete = useCallback((finalData: any) => {
    // Hide progress modal
    setShowProgress(false);
    
    // Process the generated nodes
    if (finalData.nodes && finalData.nodes.length > 0) {
      const processedNodes = finalData.nodes.map((node: any, index: number) => ({
        ...node,
        // Enhance with mock data if needed
        deepInsights: node.deepInsights || {
          summary: `Detailed analysis of ${node.title} based on your personal data patterns.`,
          keyPatterns: [
            'Pattern identified in behavioral data',
            'Connection found in conversation history',
            'Correlation with emotional patterns'
          ],
          personalizedContext: node.personalHook || `This insight relates to your unique journey and growth patterns.`,
          dataConnections: [
            {
              type: 'behavioral_metric',
              value: 'High engagement score',
              source: 'UBPM Analytics',
              relevanceScore: 0.87
            },
            {
              type: 'emotional_pattern',
              value: 'Positive sentiment trend',
              source: 'Emotional Analytics',
              relevanceScore: 0.75
            },
            {
              type: 'conversation_topic',
              value: 'Growth mindset discussions',
              source: 'Chat History',
              relevanceScore: 0.92
            }
          ],
          relevanceScore: 0.85
        },
        mediaAssets: node.mediaAssets || []
      }));

      setNodes(processedNodes);
      setCurrentNodeIndex(0);
      setShowNodeModal(true);
      
      // Notify parent component
      if (onNodesGenerated) {
        onNodesGenerated(processedNodes);
      }
    }

    activeSessionRef.current = null;
  }, [onNodesGenerated]);

  const handleChainError = useCallback((error: any) => {
    console.error('Chain of thought error:', error);
    setShowProgress(false);
    activeSessionRef.current = null;
    
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const handleProgressComplete = useCallback(() => {
    // This is called when progress animation completes
    // The actual completion is handled by handleChainComplete
  }, []);

  const handleNodeModalClose = useCallback(() => {
    setShowNodeModal(false);
    setNodes([]);
    setCurrentNodeIndex(0);
  }, []);

  const handleNextNode = useCallback(() => {
    if (currentNodeIndex < nodes.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    }
  }, [currentNodeIndex, nodes.length]);

  const handlePreviousNode = useCallback(() => {
    if (currentNodeIndex > 0) {
      setCurrentNodeIndex(prev => prev - 1);
    }
  }, [currentNodeIndex]);

  const stopProcess = useCallback(() => {
    if (activeSessionRef.current) {
      ChainOfThoughtService.stopChainOfThought(activeSessionRef.current);
      activeSessionRef.current = null;
    }
    setShowProgress(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Chain of Thought Progress Modal */}
      <ChainOfThoughtProgress
        visible={showProgress}
        currentStep={currentStep}
        steps={steps}
        streamingMessage={streamingMessage}
        onComplete={handleProgressComplete}
      />

      {/* Enhanced Node Modal */}
      <EnhancedNodeModal
        visible={showNodeModal}
        nodeData={nodes[currentNodeIndex] || null}
        onClose={handleNodeModalClose}
        onNextNode={handleNextNode}
        onPreviousNode={handlePreviousNode}
        hasNextNode={currentNodeIndex < nodes.length - 1}
        hasPreviousNode={currentNodeIndex > 0}
        streamingContent={false}
      />
    </View>
  );
};

// Export the hook for using the modal manager
export const useSandboxModalManager = () => {
  const managerRef = useRef<{
    startProcess: (query: string, options: any) => void;
    stopProcess: () => void;
  } | null>(null);

  const SandboxModalManagerComponent = useCallback((props: SandboxModalManagerProps) => {
    const [manager, setManager] = useState<SandboxModalManager | null>(null);

    const startProcess = useCallback((query: string, options: any) => {
      if (manager) {
        (manager as any).startSandboxProcess(query, options);
      }
    }, [manager]);

    const stopProcess = useCallback(() => {
      if (manager) {
        (manager as any).stopProcess();
      }
    }, [manager]);

    React.useEffect(() => {
      managerRef.current = { startProcess, stopProcess };
    }, [startProcess, stopProcess]);

    return (
      <SandboxModalManager
        ref={setManager}
        {...props}
      />
    );
  }, []);

  return {
    SandboxModalManagerComponent,
    startProcess: (query: string, options: any) => {
      managerRef.current?.startProcess(query, options);
    },
    stopProcess: () => {
      managerRef.current?.stopProcess();
    }
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
});