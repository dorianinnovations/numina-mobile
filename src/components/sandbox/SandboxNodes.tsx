import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { NuminaAnimations } from '../../utils/animations';
import { SandboxNode } from '../../types/sandbox';
import { nodePositioning } from '../../utils/nodePositioning';

interface SandboxNodesProps {
  nodes: SandboxNode[];
  nodeConnections: Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>;
  nodeAnims: React.MutableRefObject<Map<string, any>>;
  onNodePress: (node: SandboxNode) => void;
  onLockNode: (node: SandboxNode) => Promise<void>;
}

export const SandboxNodes: React.FC<SandboxNodesProps> = ({
  nodes,
  nodeConnections,
  nodeAnims,
  onNodePress,
  onLockNode,
}) => {
  const { isDarkMode } = useTheme();
  
  // Generate optimized positions for all nodes (no auto-movement)
  const nodePositions = useMemo(() => {
    const maxNodes = nodePositioning.getMaxVisibleNodes();
    const visibleNodes = nodes.slice(0, maxNodes);
    return nodePositioning.generateBatchPositions(visibleNodes);
  }, [nodes.length]); // Only recalculate when node count changes
  
  // Get canvas bounds for rendering
  const canvasBounds = useMemo(() => nodePositioning.getCanvasBounds(), []);

  const getTidBitColor = (type: string) => {
    switch (type) {
      case 'finding': return '#3B82F6';
      case 'evidence': return '#10B981';
      case 'data_point': return '#F59E0B';
      case 'connection': return '#EC4899';
      default: return '#8B5CF6';
    }
  };

  const getInsightIcon = (patternType?: string) => {
    switch (patternType) {
      case 'hidden_pattern': return 'eye';
      case 'behavioral_insight': return 'trending-up';
      case 'emotional_pattern': return 'heart';
      case 'temporal_connection': return 'clock';
      default: return 'zap';
    }
  };

  const renderConnectionLines = () => {
    return nodeConnections.slice(0, 10).map((connection) => {
      const fromNode = nodes.find(n => n.id === connection.from);
      const toNode = nodes.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;
      if (!fromNode.isLocked && !toNode.isLocked) return null;

      const fromPosition = nodePositions.get(fromNode.id);
      const toPosition = nodePositions.get(toNode.id);
      
      if (!fromPosition || !toPosition) return null;

      const startX = fromPosition.x;
      const startY = fromPosition.y;
      const endX = toPosition.x;
      const endY = toPosition.y;

      const lineLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

      return (
        <View
          key={`connection-${connection.from}-${connection.to}`}
          style={[
            styles.connectionLine,
            {
              left: startX,
              top: startY - 1,
              width: lineLength,
              transform: [{ rotate: `${angle}deg` }],
              opacity: connection.relevance * 0.8,
              backgroundColor: connection.connectionType === 'personal' 
                ? '#EC4899' 
                : connection.connectionType === 'categorical'
                  ? '#3B82F6'
                  : '#10B981',
            }
          ]}
        />
      );
    });
  };

  const renderNode = (node: SandboxNode) => {
    const nodeAnim = nodeAnims.current.get(node.id);
    const optimizedPosition = nodePositions.get(node.id);
    
    if (!nodeAnim || !optimizedPosition) return null;

    const isLocked = node.isLocked;
    const isInsight = node.isInsightNode;
    const hasConnections = nodeConnections.some(conn => 
      conn.from === node.id || conn.to === node.id
    );

    const getNodeColor = () => {
      if (isInsight) {
        switch (node.patternType) {
          case 'hidden_pattern': return '#C4B5FD';
          case 'behavioral_insight': return '#A7F3D0';
          case 'emotional_pattern': return '#FBCFE8';
          case 'temporal_connection': return '#FDE68A';
          default: return '#C4B5FD';
        }
      }
      if (isLocked) return '#A7F3D0';
      if (node.personalHook) return '#FBCFE8';
      return '#BFDBFE';
    };

    const nodeColor = getNodeColor();

    return (
      <Animated.View
        key={node.id}
        style={[
          styles.node,
          {
            left: optimizedPosition.x - 40,
            top: optimizedPosition.y - 20,
            opacity: nodeAnim.opacity,
            transform: [
              { scale: nodeAnim.scale },
              { translateY: nodeAnim.translateY }
            ],
          }
        ]}
      >
        {isInsight && (
          <Animated.View
            style={[
              styles.insightGlow,
              {
                opacity: nodeAnim.glow ? 
                  Animated.multiply(nodeAnim.opacity, nodeAnim.glow) : 
                  nodeAnim.opacity,
                backgroundColor: nodeColor,
                shadowColor: nodeColor,
                transform: [
                  { scale: nodeAnim.pulse || 1 }
                ]
              }
            ]}
          />
        )}
        
        <TouchableOpacity
          style={[
            styles.nodeDot,
            isInsight && styles.insightNodeDot,
            {
              backgroundColor: nodeColor,
              borderColor: isInsight ? '#8B5CF6' : (hasConnections ? '#666' : '#ccc'),
              borderWidth: hasConnections ? 2 : (isInsight ? 2 : 1),
              shadowColor: isInsight ? '#8B5CF6' : nodeColor,
              shadowOpacity: isInsight ? 0.4 : 0.2,
              shadowRadius: isInsight ? 6 : 3,
              shadowOffset: { width: 0, height: 1 },
            }
          ]}
          onPress={() => {
            NuminaAnimations.haptic.light();
            onNodePress(node);
          }}
        >
          {isInsight && (
            <View style={styles.insightIcon}>
              <Feather 
                name={getInsightIcon(node.patternType)} 
                size={8} 
                color="#8B5CF6" 
              />
            </View>
          )}
          
          {isLocked && !isInsight && (
            <Feather 
              name="lock" 
              size={8} 
              color="#fff" 
              style={styles.lockIcon} 
            />
          )}
          {hasConnections && !isInsight && (
            <View style={styles.connectionIndicator} />
          )}
          
          {isInsight && (
            <Animated.View
              style={[
                styles.insightPulse,
                {
                  opacity: nodeAnim.pulse ? 
                    nodeAnim.pulse.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.3, 0.8],
                      extrapolate: 'clamp',
                    }) :
                    nodeAnim.scale.interpolate({
                      inputRange: [0.9, 1.1],
                      outputRange: [0.3, 0.8],
                      extrapolate: 'clamp',
                    }),
                  borderColor: nodeColor,
                  transform: [
                    { scale: nodeAnim.pulse || 1 }
                  ]
                }
              ]}
            />
          )}
        </TouchableOpacity>
        
        <View style={styles.nodeTextContainer}>
          <Text style={[styles.nodeTitle, isInsight && styles.insightNodeTitle, { color: isDarkMode ? '#fff' : '#333' }]} numberOfLines={2} ellipsizeMode="tail">
            {node.title}
          </Text>
          {node.personalHook && (
            <Text style={[styles.personalHook, { color: isDarkMode ? '#ccc' : '#666' }]} numberOfLines={1} ellipsizeMode="tail">
              {node.personalHook}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.nodesCanvas, {
      left: canvasBounds.x,
      top: canvasBounds.y,
      width: canvasBounds.width,
      height: canvasBounds.height,
    }]}>
      {/* Render limited connections for performance */}
      {nodeConnections.length < 8 && renderConnectionLines()}
      {/* Render optimized node positions */}
      {nodes.slice(0, nodePositioning.getMaxVisibleNodes()).map((node) => renderNode(node))}
    </View>
  );
};

const styles = StyleSheet.create({
  nodesCanvas: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.01)',
  },
  node: {
    position: 'absolute',
    alignItems: 'center',
    width: 30,
  },
  nodeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  nodeTextContainer: {
    position: 'absolute',
    top: 28,
    alignItems: 'center',
    width: 28,
    left: -2,
  },
  nodeTitle: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 10,
    marginBottom: 2,
    fontFamily: 'Nunito-SemiBold',
  },
  personalHook: {
    fontSize: 7,
    fontWeight: '400',
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'Nunito-Regular',
  },
  connectionLine: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0 50%',
  },
  lockIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  connectionIndicator: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  insightGlow: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 75,
    opacity: 0.3,
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  insightNodeDot: {
    elevation: 12,
    borderWidth: 3,
  },
  insightIcon: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 2,
  },
  insightNodeTitle: {
    fontWeight: '700',
    fontFamily: 'Nunito-Bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  insightPulse: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 68,
    borderWidth: 2,
    opacity: 0.6,
  },
}); 