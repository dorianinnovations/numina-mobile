import React, { useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SandboxNode } from '../../types/sandbox';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Simplified canvas for performance
const CANVAS_WIDTH = screenWidth * 0.9;
const CANVAS_HEIGHT = screenHeight * 0.7;
const CANVAS_PADDING = 20;
const NODE_SIZE = 12;
const NODE_SPACING = 60;

interface StaticNodeCanvasProps {
  nodes: SandboxNode[];
  nodeConnections: Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>;
  onNodePress: (node: SandboxNode) => void;
  onLockNode: (node: SandboxNode) => void;
}

export const StaticNodeCanvas: React.FC<StaticNodeCanvasProps> = ({
  nodes,
  nodeConnections,
  onNodePress,
  onLockNode,
}) => {
  const { isDarkMode } = useTheme();

  // Simple grid layout for nodes
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    const visibleNodes = nodes.slice(0, 40); // Increased limit for more nodes
    
    const cols = Math.ceil(Math.sqrt(visibleNodes.length));
    const rows = Math.ceil(visibleNodes.length / cols);
    
    const cellWidth = (CANVAS_WIDTH - CANVAS_PADDING * 2) / cols;
    const cellHeight = (CANVAS_HEIGHT - CANVAS_PADDING * 2) / rows;

    visibleNodes.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const x = CANVAS_PADDING + (col * cellWidth) + (cellWidth / 2);
      const y = CANVAS_PADDING + (row * cellHeight) + (cellHeight / 2);
      
      positions.set(node.id, { x, y });
    });

    return positions;
  }, [nodes.length]);

  // Get node color
  const getNodeColor = useCallback((node: SandboxNode) => {
    if (node.isInsightNode) {
      switch (node.patternType) {
        case 'hidden_pattern': return '#C4B5FD';
        case 'behavioral_insight': return '#A7F3D0';
        case 'emotional_pattern': return '#FBCFE8';
        case 'temporal_connection': return '#FDE68A';
        default: return '#C4B5FD';
      }
    }
    if (node.isLocked) return '#A7F3D0';
    if (node.personalHook) return '#FBCFE8';
    return '#BFDBFE';
  }, []);

  // Simple node press handler
  const handleNodePress = useCallback((node: SandboxNode) => {
    onNodePress(node);
  }, [onNodePress]);

  // Minimal connection lines for performance
  const renderConnections = useMemo(() => {
    if (nodeConnections.length === 0) return null;

    return nodeConnections.slice(0, 8).map((connection) => {
      const fromPos = nodePositions.get(connection.from);
      const toPos = nodePositions.get(connection.to);
      
      if (!fromPos || !toPos) return null;

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      return (
        <View
          key={`${connection.from}-${connection.to}`}
          style={[
            styles.connectionLine,
            {
              left: fromPos.x,
              top: fromPos.y,
              width: length,
              transform: [{ rotate: `${angle}deg` }],
              opacity: 0.3,
              backgroundColor: isDarkMode ? '#666' : '#ccc',
            }
          ]}
        />
      );
    });
  }, [nodeConnections, nodePositions, isDarkMode]);

  // Simplified node rendering
  const renderNode = useCallback((node: SandboxNode) => {
    const position = nodePositions.get(node.id);
    if (!position) return null;

    const nodeColor = getNodeColor(node);

    return (
      <View
        key={node.id}
        style={[
          styles.nodeContainer,
          {
            left: position.x - NODE_SIZE / 2,
            top: position.y - NODE_SIZE / 2,
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.node,
            {
              backgroundColor: nodeColor,
              borderColor: isDarkMode ? '#444' : '#ccc',
              borderWidth: 1,
            }
          ]}
          onPress={() => handleNodePress(node)}
          activeOpacity={0.6}
        >
          {node.isInsightNode && (
            <Feather 
              name="zap" 
              size={6} 
              color="#8B5CF6" 
            />
          )}
          
          {node.isLocked && !node.isInsightNode && (
            <Feather 
              name="lock" 
              size={5} 
              color="#fff" 
            />
          )}
        </TouchableOpacity>
        
        <Text style={[
          styles.nodeLabelText,
          { color: isDarkMode ? '#ccc' : '#666' }
        ]} numberOfLines={1}>
          {node.title.length > 20 
            ? node.title.substring(0, 20) + '...' 
            : node.title
          }
        </Text>
      </View>
    );
  }, [nodePositions, getNodeColor, handleNodePress, isDarkMode]);

  return (
    <View style={[
      styles.canvas,
      {
        backgroundColor: isDarkMode 
          ? 'rgba(255, 255, 255, 0.01)' 
          : 'rgba(0, 0, 0, 0.01)',
      }
    ]}>
      {/* Connection lines */}
      {renderConnections}

      {/* Nodes */}
      {nodes.slice(0, 40).map(renderNode)}

      {/* Simple counter */}
      <View style={styles.counter}>
        <Text style={[
          styles.counterText,
          { color: isDarkMode ? '#666' : '#999' }
        ]}>
          {nodes.length > 40 ? `${nodes.length} total` : `${nodes.length} nodes`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  connectionLine: {
    position: 'absolute',
    height: 1,
    transformOrigin: '0 50%',
  },
  nodeContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeLabelText: {
    fontSize: 8,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 3,
    maxWidth: 40,
  },
  counter: {
    position: 'absolute',
    bottom: 10,
    right: 20,
  },
  counterText: {
    fontSize: 10,
    fontWeight: '400',
  },
});