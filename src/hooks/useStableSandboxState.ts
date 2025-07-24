import { useState, useCallback, useRef, useMemo } from 'react';
import { SandboxNode } from '../types/sandbox';

interface SandboxState {
  nodes: SandboxNode[];
  lockedNodes: SandboxNode[];
  showNodes: boolean;
  nodeConnections: Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>;
}

interface StableSandboxActions {
  setNodes: (nodes: SandboxNode[] | ((prev: SandboxNode[]) => SandboxNode[])) => void;
  addNode: (node: SandboxNode) => void;
  lockNode: (nodeId: string) => void;
  setShowNodes: (show: boolean) => void;
  setNodeConnections: (connections: any[]) => void;
  batchUpdate: (updates: Partial<SandboxState>) => void;
  reset: () => void;
}

/**
 * Stable sandbox state management that prevents cascading updates
 * - Debounced state updates
 * - Duplicate prevention
 * - Batch operations
 * - Stable callbacks
 */
export const useStableSandboxState = (): [SandboxState, StableSandboxActions] => {
  const [state, setState] = useState<SandboxState>({
    nodes: [],
    lockedNodes: [],
    showNodes: false,
    nodeConnections: [],
  });

  // Removed debounced updates to prevent infinite loops

  // Simplified node setter with duplicate prevention
  const setNodes = useCallback((nodesOrUpdater: SandboxNode[] | ((prev: SandboxNode[]) => SandboxNode[])) => {
    setState(prevState => {
      const newNodes = typeof nodesOrUpdater === 'function' 
        ? nodesOrUpdater(prevState.nodes)
        : nodesOrUpdater;
      
      // Prevent duplicate nodes
      const uniqueNodes = newNodes.filter((node, index, arr) => 
        arr.findIndex(n => n.id === node.id) === index
      );
      
      // Simple length and last node ID check instead of heavy JSON comparison
      if (uniqueNodes.length === prevState.nodes.length && 
          uniqueNodes.length > 0 && 
          prevState.nodes.length > 0 &&
          uniqueNodes[uniqueNodes.length - 1]?.id === prevState.nodes[prevState.nodes.length - 1]?.id) {
        return prevState;
      }
      
      return {
        ...prevState,
        nodes: uniqueNodes,
      };
    });
  }, []);

  // Add single node with duplicate check
  const addNode = useCallback((node: SandboxNode) => {
    setNodes(prevNodes => {
      if (prevNodes.find(n => n.id === node.id)) {
        return prevNodes; // Duplicate, don't add
      }
      return [...prevNodes, node];
    });
  }, [setNodes]);

  // Simplified lock node operation
  const lockNode = useCallback((nodeId: string) => {
    setState(prevState => {
      const nodeIndex = prevState.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex === -1) return prevState;
      
      const updatedNodes = [...prevState.nodes];
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        isLocked: true,
        lockTimestamp: new Date().toISOString(),
      };
      
      const lockedNode = updatedNodes[nodeIndex];
      const alreadyLocked = prevState.lockedNodes.find(n => n.id === nodeId);
      
      return {
        ...prevState,
        nodes: updatedNodes,
        lockedNodes: alreadyLocked 
          ? prevState.lockedNodes 
          : [...prevState.lockedNodes, lockedNode],
      };
    });
  }, []);

  // Show/hide nodes
  const setShowNodes = useCallback((show: boolean) => {
    setState(prevState => ({
      ...prevState,
      showNodes: show,
    }));
  }, []);

  // Simplified set node connections
  const setNodeConnections = useCallback((connections: any[]) => {
    setState(prevState => ({
      ...prevState,
      nodeConnections: connections,
    }));
  }, []);

  // Batch update multiple state properties
  const batchUpdate = useCallback((updates: Partial<SandboxState>) => {
    setState(prevState => ({
      ...prevState,
      ...updates,
    }));
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setState({
      nodes: [],
      lockedNodes: [],
      showNodes: false,
      nodeConnections: [],
    });
  }, []);

  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo<StableSandboxActions>(() => ({
    setNodes,
    addNode,
    lockNode,
    setShowNodes,
    setNodeConnections,
    batchUpdate,
    reset,
  }), [setNodes, addNode, lockNode, setShowNodes, setNodeConnections, batchUpdate, reset]);

  return [state, actions];
};