import { useState, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { SandboxNode } from '../types/sandbox';
import SandboxDataService from '../services/sandboxDataService';
import CloudAuth from '../services/cloudAuth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UseSandboxDataReturn {
  nodes: SandboxNode[];
  lockedNodes: SandboxNode[];
  nodeConnections: Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>;
  showNodes: boolean;
  setNodes: (nodes: SandboxNode[]) => void;
  setLockedNodes: (nodes: SandboxNode[]) => void;
  setNodeConnections: (connections: Array<{ from: string; to: string; relevance: number; connectionType: string }>) => void;
  setShowNodes: (show: boolean) => void;
  handleNodesGenerated: (generatedNodes: any[]) => void;
  handleLockNode: (node: SandboxNode) => Promise<void>;
  handleUnlockNode: (nodeId: string) => Promise<void>;
  saveSandboxSession: () => Promise<void>;
  buildContextFromLockedNodes: () => string;
}

export const useSandboxData = (): UseSandboxDataReturn => {
  const [nodes, setNodes] = useState<SandboxNode[]>([]);
  const [lockedNodes, setLockedNodes] = useState<SandboxNode[]>([]);
  const [nodeConnections, setNodeConnections] = useState<Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>>([]);
  const [showNodes, setShowNodes] = useState(false);

  const handleNodesGenerated = useCallback((generatedNodes: any[]) => {
    const processedNodes: SandboxNode[] = generatedNodes.map(node => ({
      id: node.id,
      title: node.title,
      content: node.content,
      position: node.position || { 
        x: Math.random() * (screenWidth - 120) + 60, 
        y: Math.random() * (screenHeight - 400) + 200 
      },
      connections: node.connections || [],
      confidence: node.confidence || 0.8,
      category: node.category || 'Discovery',
      personalHook: node.personalHook,
      isLocked: node.isLocked || false,
      lockTimestamp: node.lockTimestamp,
      isInsightNode: node.isInsightNode,
      patternType: node.patternType,
      deepInsights: node.deepInsights,
      userDataContext: node.userDataContext,
      mediaAssets: node.mediaAssets,
    }));
    
    setNodes(processedNodes);
    setShowNodes(true);
  }, []);

  const handleLockNode = useCallback(async (node: SandboxNode) => {
    const lockedNode = {
      ...node,
      isLocked: true,
      lockTimestamp: new Date().toISOString()
    };

    setNodes(prevNodes => 
      prevNodes.map(n => n.id === node.id ? lockedNode : n)
    );
    
    setLockedNodes(prevLocked => [...prevLocked, lockedNode]);

    await SandboxDataService.saveLockState(node.id, {
      node: lockedNode,
      context: buildContextFromLockedNodes(),
      timestamp: lockedNode.lockTimestamp
    });
    
    setTimeout(async () => {
      const updatedConnections = await SandboxDataService.detectNodeConnections(
        [...nodes.filter(n => n.id !== node.id), lockedNode]
      );
      setNodeConnections(updatedConnections);
      await saveSandboxSession();
    }, 500);
  }, [nodes]);

  const handleUnlockNode = useCallback(async (nodeId: string) => {
    setLockedNodes(prevLocked => prevLocked.filter(n => n.id !== nodeId));
    setNodes(prevNodes => 
      prevNodes.map(n => n.id === nodeId ? { ...n, isLocked: false, lockTimestamp: undefined } : n)
    );
    await SandboxDataService.removeLockState(nodeId);
    await saveSandboxSession();
  }, [nodes]);

  const saveSandboxSession = useCallback(async () => {
    try {
      await SandboxDataService.saveSandboxSession({
        nodes,
        lockedNodes,
        connections: nodeConnections,
        userQuery: '', // This should be passed from parent
        timestamp: new Date().toISOString()
      });
    } catch (error) {
    }
  }, [nodes, lockedNodes, nodeConnections]);

  const buildContextFromLockedNodes = useCallback((): string => {
    if (lockedNodes.length === 0) {
      return '';
    }

    const contextParts = lockedNodes.map(node => {
      const insights = node.deepInsights ? 
        ` Insights: ${node.deepInsights.personalizedContext}` : '';
      const connections = node.deepInsights?.dataConnections && node.deepInsights.dataConnections.length > 0 ? 
        ` Connected to: ${node.deepInsights.dataConnections.map(c => c.type).join(', ')}` : '';
      
      return `[${node.title}] ${node.content}${insights}${connections}`;
    });

    return `Previously explored and locked context: ${contextParts.join(' | ')} `;
  }, [lockedNodes]);

  return {
    nodes,
    lockedNodes,
    nodeConnections,
    showNodes,
    setNodes,
    setLockedNodes,
    setNodeConnections,
    setShowNodes,
    handleNodesGenerated,
    handleLockNode,
    handleUnlockNode,
    saveSandboxSession,
    buildContextFromLockedNodes,
  };
}; 