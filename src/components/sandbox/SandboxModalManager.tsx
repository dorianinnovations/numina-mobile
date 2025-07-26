import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ChainOfThoughtProgress } from '../ai/ChainOfThoughtProgress';
import { InfiniteNodeCanvas } from '../nodes/InfiniteNodeCanvas';
import ChainOfThoughtService from '../../services/chainOfThoughtService';
import NodeContentEnhancer from '../../services/nodeContentEnhancer';
import { SandboxNode } from '../../types/sandbox';
import { StreamingConfig } from '../../config/streamingConfig';

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
  onStreamingMessage?: (message: string) => void;
  onProcessComplete?: () => void;
  onNavigateToNodePortal?: (node: SandboxNode) => void;
}

export interface SandboxModalManagerRef {
  startSandboxProcess: (query: string, options: any) => Promise<void>;
  stopProcess: () => void;
}

export const SandboxModalManager = forwardRef<SandboxModalManagerRef, SandboxModalManagerProps>(({
  onNodesGenerated,
  onError,
  onStreamingMessage,
  onProcessComplete,
  onNavigateToNodePortal,
}, ref) => {
  // Progress Modal State
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  
  // Node Canvas State
  const [showNodeCanvas, setShowNodeCanvas] = useState(false);
  const [nodes, setNodes] = useState<SandboxNode[]>([]);
  const [streamingComplete, setStreamingComplete] = useState(false);
  const [allNodesForCallback, setAllNodesForCallback] = useState<SandboxNode[]>([]);
  const [isStreamingActive, setIsStreamingActive] = useState(false);
  
  // Active session tracking
  const activeSessionRef = useRef<string | null>(null);
  const latestSessionRef = useRef<string | null>(null);

  // Handle onNodesGenerated callback when streaming is complete
  useEffect(() => {
    if (streamingComplete && allNodesForCallback.length > 0 && onNodesGenerated) {
      console.log('🎯 Calling onNodesGenerated with', allNodesForCallback.length, 'nodes');
      onNodesGenerated(allNodesForCallback);
      setStreamingComplete(false); // Reset for next time
    }
  }, [streamingComplete, allNodesForCallback, onNodesGenerated]);

  const startSandboxProcess = useCallback(async (query: string, options: any) => {
    // Schedule state updates for next tick to avoid render cycle conflicts
    setTimeout(() => {
      try {
        // Initialize progress state - Expanded for more detailed process visibility
        const initialSteps: ChainStep[] = [
          { id: '1', title: 'Analyzing request', status: 'pending' },
          { id: '2', title: 'Evaluating context', status: 'pending' },
          { id: '3', title: 'Processing data', status: 'pending' },
          { id: '4', title: 'Cross-referencing', status: 'pending' },
          { id: '5', title: 'Synthesizing insights', status: 'pending' },
          { id: '6', title: 'Generating connections', status: 'pending' },
          { id: '7', title: 'Validating results', status: 'pending' },
          { id: '8', title: 'Finalizing output', status: 'pending' },
        ];
        
        setSteps(initialSteps);
        setCurrentStep('1');
        setStreamingMessage('');
        setShowProgress(true);

        // Start chain of thought process
        ChainOfThoughtService.startChainOfThought(
          query,
          options,
          handleChainUpdate,
          handleChainComplete,
          handleChainError
        ).then(sessionId => {
          activeSessionRef.current = sessionId;
          latestSessionRef.current = sessionId;
        }).catch(error => {
          console.error('Failed to start sandbox process:', error);
          handleChainError(error);
        });

      } catch (error) {
        console.error('Failed to start sandbox process:', error);
        handleChainError(error);
      }
    }, 0);
  }, []);

  const handleChainUpdate = useCallback((response: any) => {
    console.log('🔄 SandboxModalManager: Chain update received:', {
      currentStep: response.currentStep,
      stepsCount: response.steps?.length,
      streamingMessage: response.streamingMessage,
      messageLength: response.streamingMessage?.length
    });
    
    setCurrentStep(response.currentStep);
    setSteps(response.steps);
    
    // Only update streaming message if it's non-empty or explicitly empty for step completion
    const messageToSet = response.streamingMessage || '';
    setStreamingMessage(messageToSet);
    
    // Pass streaming message to parent only if it has content or is explicit step completion
    console.log('📡 SandboxModalManager: Calling onStreamingMessage with:', messageToSet);
    if (onStreamingMessage) {
      onStreamingMessage(messageToSet);
      console.log('✅ SandboxModalManager: onStreamingMessage called');
    } else {
      console.log('❌ SandboxModalManager: onStreamingMessage is null/undefined');
    }
  }, [onStreamingMessage]);

  // Simulate node streaming effect
  const simulateNodeStreaming = useCallback((allNodes: SandboxNode[]) => {
    if (isStreamingActive) {
      console.log('⚠️ Streaming already active, skipping duplicate call');
      return;
    }
    
    console.log('🌊 Starting node streaming simulation with', allNodes.length, 'nodes');
    setIsStreamingActive(true);
    
    // Check if streaming is enabled
    if (!StreamingConfig.sandbox.enabled) {
      // Show all nodes immediately if streaming is disabled
      setShowProgress(false);
      setNodes(allNodes);
      // Small delay to ensure progress modal is fully hidden before showing canvas
      setTimeout(() => {
        setShowNodeCanvas(true);
        setAllNodesForCallback(allNodes);
        setStreamingComplete(true);
        setIsStreamingActive(false);
      }, 100);
      return;
    }
    
    // Use configuration values
    const SKELETON_DURATION = StreamingConfig.sandbox.skeletonDuration;
    const NODE_STREAM_DELAY = StreamingConfig.sandbox.nodeStreamDelay;
    const MAX_STREAMED_NODES = StreamingConfig.sandbox.maxStreamedNodes;
    
    // Start with empty canvas
    setNodes([]);
    
    // Wait for skeleton loader to complete, then stream nodes
    setTimeout(() => {
      // Hide progress modal after skeleton completes
      setShowProgress(false);
      
      // Show the node canvas immediately after progress is hidden
      console.log('🎨 Setting showNodeCanvas to true - progress should be hidden now');
      setShowNodeCanvas(true);
      
      // Determine how many nodes to stream
      const nodesToStream = allNodes.slice(0, MAX_STREAMED_NODES);
      const instantNodes = allNodes.slice(MAX_STREAMED_NODES);
      
      // Stream nodes one by one
      nodesToStream.forEach((node, index) => {
        setTimeout(() => {
          setNodes(prevNodes => {
            // Check if node already exists to prevent duplicates
            const nodeExists = prevNodes.some(existingNode => existingNode.id === node.id);
            if (nodeExists) {
              console.log(`⚠️ Node ${node.id} already exists, skipping duplicate`);
              return prevNodes;
            }
            
            const newNodes = [...prevNodes, node];
            console.log(`🎯 Streaming node ${index + 1}/${nodesToStream.length}: ${node.title}`);
            
            // Check if this is the last streamed node
            if (index === nodesToStream.length - 1) {
              // Add any remaining nodes instantly, filtering for duplicates
              if (instantNodes.length > 0) {
                console.log(`⚡ Adding ${instantNodes.length} remaining nodes instantly`);
                const filteredInstantNodes = instantNodes.filter(instantNode => 
                  !newNodes.some(existingNode => existingNode.id === instantNode.id)
                );
                const finalNodes = [...newNodes, ...filteredInstantNodes];
                
                // Complete streaming after state update
                setTimeout(() => {
                  setAllNodesForCallback(allNodes);
                  setStreamingComplete(true);
                  setIsStreamingActive(false);
                }, 0);
                
                return finalNodes;
              } else {
                // Complete streaming after state update
                setTimeout(() => {
                  setAllNodesForCallback(allNodes);
                  setStreamingComplete(true);
                  setIsStreamingActive(false);
                }, 0);
              }
            }
            
            return newNodes;
          });
        }, index * NODE_STREAM_DELAY);
      });
      
      // Handle edge case where no nodes need streaming
      if (nodesToStream.length === 0) {
        setTimeout(() => {
          setAllNodesForCallback(allNodes);
          setStreamingComplete(true);
          setIsStreamingActive(false);
        }, 0);
      }
    }, SKELETON_DURATION);
  }, []);

  const handleChainComplete = useCallback(async (finalData: any) => {
    const completingSessionId = finalData?.sessionId;
    const latestSessionId = latestSessionRef.current;
    
    console.log('🎯 SandboxModalManager: Chain completed with data:', {
      completingSessionId,
      latestSessionId,
      isLatest: completingSessionId === latestSessionId,
      hasFinalData: !!finalData,
      hasNodes: !!finalData?.nodes,
      nodesLength: finalData?.nodes?.length,
      isStreamingCurrentlyActive: isStreamingActive
    });
    
    // Only process completion if it's from the latest session or no session is currently active
    if (completingSessionId !== latestSessionId && latestSessionId !== null) {
      console.log('🚫 Ignoring completion from old session:', completingSessionId, 'latest is:', latestSessionId);
      return;
    }
    
    // Prevent duplicate processing if already streaming
    if (isStreamingActive) {
      console.log('🚫 Streaming already active, ignoring duplicate completion');
      return;
    }
    
    // Process the generated nodes
    if (finalData.nodes && finalData.nodes.length > 0) {
      // First, process basic node structure - ensure unique IDs
      const basicNodes = finalData.nodes.map((node: any, index: number) => ({
        ...node,
        id: node.id || `node_${completingSessionId || Date.now()}_${index}`, // Ensure unique ID
        // Add position for canvas display if not present
        position: node.position || {
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 200
        },
        connections: node.connections || [],
        isLocked: node.isLocked || false,
        patternType: node.patternType || 'behavioral_insight'
      }));

      console.log('✅ SandboxModalManager: Processing nodes:', basicNodes.length, 'nodes');

      // Auto-enhance nodes with captured tool data
      try {
        const enhancedNodes = await Promise.all(
          basicNodes.map(async (node: SandboxNode) => {
            return await NodeContentEnhancer.enhanceNodeWithToolData(node, finalData.originalQuery || '');
          })
        );

        console.log('🌟 SandboxModalManager: Enhanced nodes with tool data');

        // Simulate streaming with enhanced nodes
        simulateNodeStreaming(enhancedNodes);
      } catch (enhancementError) {
        console.warn('⚠️ Node enhancement failed, using basic nodes:', enhancementError);
        simulateNodeStreaming(basicNodes);
      }
      
    } else {
      console.error('❌ SandboxModalManager: No nodes found in final data!');
      
      // Create fallback node to prevent blank screen
      const fallbackNode = {
        id: `fallback_${completingSessionId || Date.now()}`,
        title: 'Processing Complete',
        content: 'Your request has been processed, but no specific insights were generated. Please try rephrasing your query or adding more context.',
        category: 'system',
        confidence: 0.7,
        personalHook: 'System generated fallback response',
        position: { x: 150, y: 150 },
        connections: [],
        isLocked: false,
        deepInsights: {
          summary: 'No specific insights were generated from your query.',
          keyPatterns: ['Processing completed', 'No specific patterns identified'],
          personalizedContext: 'Consider providing more specific details in your query.',
          dataConnections: [],
          relevanceScore: 0.5
        }
      };
      
      console.log('🔧 SandboxModalManager: Using fallback node to prevent blank screen');
      
      // Stream the fallback node too
      simulateNodeStreaming([fallbackNode]);
    }

    activeSessionRef.current = null;
    latestSessionRef.current = null; // Clear latest session after successful completion
  }, [simulateNodeStreaming, isStreamingActive]);

  const handleChainError = useCallback((error: any) => {
    console.error('Chain of thought error:', error);
    setShowProgress(false);
    setIsStreamingActive(false); // Reset streaming state on error
    activeSessionRef.current = null;
    latestSessionRef.current = null; // Clear latest session on error
    
    if (onError) {
      onError(error);
    }
  }, [onError]);

  const handleProgressComplete = useCallback(() => {
    // This is called when progress animation completes
    // The actual completion is handled by handleChainComplete
  }, []);


  // Handle node press from canvas
  const handleNodePress = useCallback((node: SandboxNode) => {
    if (onNavigateToNodePortal) {
      onNavigateToNodePortal(node);
    }
  }, [onNavigateToNodePortal]);
  
  // Handle node lock
  const handleNodeLock = useCallback((node: SandboxNode) => {
    console.log('🔒 Locking node:', node.title);
    
    // Update the node's lock status
    setNodes(prevNodes => 
      prevNodes.map(n => 
        n.id === node.id 
          ? { ...n, isLocked: true, lockTimestamp: new Date().toISOString() }
          : n
      )
    );
    
    // You can add additional lock handling here (e.g., API call, analytics)
  }, []);


  const handleCloseNodeCanvas = useCallback(() => {
    console.log('🎨 Closing node canvas');
    setShowNodeCanvas(false);
    setNodes([]);
    
    // Reset parent processing states to allow navigation
    if (onProcessComplete) {
      onProcessComplete();
    }
  }, [onProcessComplete]);

  const stopProcess = useCallback(() => {
    if (activeSessionRef.current) {
      ChainOfThoughtService.stopChainOfThought(activeSessionRef.current);
      activeSessionRef.current = null;
    }
    setShowProgress(false);
    setIsStreamingActive(false); // Reset streaming state when stopping
    latestSessionRef.current = null; // Clear latest session reference
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    startSandboxProcess,
    stopProcess,
  }), [startSandboxProcess, stopProcess]);

  return (
    <View style={styles.container} pointerEvents={showNodeCanvas ? 'auto' : 'box-none'}>
      {/* Chain of Thought Progress Modal */}
      <ChainOfThoughtProgress
        visible={showProgress}
        currentStep={currentStep}
        steps={steps}
        streamingMessage={streamingMessage}
        onComplete={handleProgressComplete}
      />

      {/* Infinite Node Canvas - Scrollable Exploration */}
      <InfiniteNodeCanvas
        nodes={nodes}
        onNodePress={handleNodePress}
        onNodeLock={handleNodeLock}
        visible={showNodeCanvas}
        onClose={handleCloseNodeCanvas}
      />

    </View>
  );
});

// Export the hook for using the modal manager
export const useSandboxModalManager = () => {
  const managerRef = useRef<SandboxModalManagerRef | null>(null);
  const operationsRef = useRef<{
    startProcess: (query: string, options: any) => void;
    stopProcess: () => void;
  } | null>(null);

  const SandboxModalManagerComponent = useCallback((props: SandboxModalManagerProps) => {
    const handleRef = useCallback((ref: SandboxModalManagerRef | null) => {
      managerRef.current = ref;
      
      if (ref) {
        const startProcess = (query: string, options: any) => {
          ref.startSandboxProcess(query, options);
        };

        const stopProcess = () => {
          // Add stopProcess method if it exists on the ref
          if ('stopProcess' in ref && typeof (ref as any).stopProcess === 'function') {
            (ref as any).stopProcess();
          }
        };

        operationsRef.current = { startProcess, stopProcess };
      } else {
        operationsRef.current = null;
      }
    }, []);

    return (
      <SandboxModalManager
        ref={handleRef}
        {...props}
      />
    );
  }, []);

  return {
    SandboxModalManagerComponent,
    startProcess: (query: string, options: any) => {
      operationsRef.current?.startProcess(query, options);
    },
    stopProcess: () => {
      operationsRef.current?.stopProcess();
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