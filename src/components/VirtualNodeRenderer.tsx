import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  ViewabilityConfig,
  ViewToken,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { SandboxNode } from '../types/sandbox';
import { nodePositioning } from '../utils/nodePositioning';
import { useResourceManager } from '../utils/resourceManager';
import { useExtremeAnimations } from '../utils/extremeAnimationSystem';

interface VirtualNodeProps {
  node: SandboxNode;
  position: { x: number; y: number };
  onPress: (node: SandboxNode) => void;
  isVisible: boolean;
}

interface VirtualNodeRendererProps {
  nodes: SandboxNode[];
  nodeConnections: Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>;
  onNodePress: (node: SandboxNode) => void;
  onLockNode: (node: SandboxNode) => void;
  maxVisibleNodes?: number;
  renderDistance?: number;
}

// Memoized single node component
const VirtualNode = React.memo<VirtualNodeProps>(({ 
  node, 
  position, 
  onPress, 
  isVisible 
}) => {
  const componentId = `virtual-node-${node.id}`;
  const { createBoundedAnimation, startAnimation } = useExtremeAnimations(componentId);
  const { createTimeout } = useResourceManager(componentId);
  
  // Only render if visible (performance optimization)
  if (!isVisible) {
    return null;
  }

  const handlePress = useCallback(() => {
    // Create quick tap animation
    const tapAnimationId = createBoundedAnimation(
      'ui',
      () => {
        // Simple scale animation for tap feedback
        const scaleValue = new Animated.Value(1);
        return Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]);
      },
      {
        priority: 'high',
        maxDuration: 250,
      }
    );

    if (tapAnimationId) {
      startAnimation(tapAnimationId);
    }

    // Delayed callback to allow animation
    createTimeout(() => {
      onPress(node);
    }, 50, 'high');
  }, [node, onPress, createBoundedAnimation, startAnimation, createTimeout]);

  const nodeColor = useMemo(() => {
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
  }, [node.isInsightNode, node.patternType, node.isLocked, node.personalHook]);

  return (
    <View
      style={[
        styles.virtualNode,
        {
          left: position.x - 12,
          top: position.y - 12,
          backgroundColor: nodeColor,
          borderColor: node.isInsightNode ? '#8B5CF6' : '#ccc',
          borderWidth: node.isInsightNode ? 2 : 1,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.nodeTouchable}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {node.isLocked && (
          <View style={styles.lockIndicator} />
        )}
        {node.isInsightNode && (
          <View style={styles.insightIndicator} />
        )}
      </TouchableOpacity>
    </View>
  );
});

VirtualNode.displayName = 'VirtualNode';

/**
 * Virtual Node Renderer with extreme performance optimization
 * - Only renders visible nodes in viewport
 * - Virtualized scrolling for large datasets
 * - Automatic memory management
 * - Performance-based LOD (Level of Detail)
 */
export const VirtualNodeRenderer: React.FC<VirtualNodeRendererProps> = ({
  nodes,
  nodeConnections,
  onNodePress,
  onLockNode,
  maxVisibleNodes = 50,
  renderDistance = 300,
}) => {
  const componentId = 'virtual-node-renderer';
  const { createTimeout } = useResourceManager(componentId);
  
  // Viewport tracking
  const viewportRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0, y: 0, width: Dimensions.get('window').width, height: Dimensions.get('window').height
  });
  
  const visibleNodeIds = useRef<Set<string>>(new Set());
  const [forceRender, setForceRender] = React.useState(0);

  // Generate optimized positions (memoized)
  const nodePositions = useMemo(() => {
    const limitedNodes = nodes.slice(0, maxVisibleNodes);
    return nodePositioning.generateBatchPositions(limitedNodes);
  }, [nodes.length, maxVisibleNodes]);

  // Create viewport-aware node data
  const viewportNodes = useMemo(() => {
    const viewport = viewportRef.current;
    const nodesInView: Array<{
      node: SandboxNode;
      position: { x: number; y: number };
      distance: number;
      isVisible: boolean;
    }> = [];

    for (const node of nodes.slice(0, maxVisibleNodes)) {
      const position = nodePositions.get(node.id);
      if (!position) continue;

      // Calculate distance from viewport center
      const viewportCenterX = viewport.x + viewport.width / 2;
      const viewportCenterY = viewport.y + viewport.height / 2;
      const distance = Math.sqrt(
        Math.pow(position.x - viewportCenterX, 2) + 
        Math.pow(position.y - viewportCenterY, 2)
      );

      // Check if node is in visible area
      const isVisible = distance <= renderDistance &&
        position.x >= viewport.x - 50 &&
        position.x <= viewport.x + viewport.width + 50 &&
        position.y >= viewport.y - 50 &&
        position.y <= viewport.y + viewport.height + 50;

      nodesInView.push({
        node,
        position,
        distance,
        isVisible,
      });
    }

    // Sort by distance for LOD
    return nodesInView.sort((a, b) => a.distance - b.distance);
  }, [nodes, nodePositions, maxVisibleNodes, renderDistance, forceRender]);

  // Update visible node tracking
  useEffect(() => {
    const newVisibleIds = new Set<string>();
    for (const { node, isVisible } of viewportNodes) {
      if (isVisible) {
        newVisibleIds.add(node.id);
      }
    }
    visibleNodeIds.current = newVisibleIds;
  }, [viewportNodes]);

  // Viewport change handler (throttled)
  const handleViewportChange = useCallback((info: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => {
    // Throttle viewport updates
    createTimeout(() => {
      setForceRender(prev => prev + 1);
    }, 100, 'medium');
  }, [createTimeout]);

  // Viewport configuration
  const viewabilityConfig: ViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 100,
  }), []);

  // Render connection lines (only for visible nodes)
  const renderConnectionLines = useCallback(() => {
    const visibleConnections = nodeConnections
      .filter(conn => 
        visibleNodeIds.current.has(conn.from) && 
        visibleNodeIds.current.has(conn.to)
      )
      .slice(0, 8); // Limit connections for performance

    return visibleConnections.map((connection) => {
      const fromPos = nodePositions.get(connection.from);
      const toPos = nodePositions.get(connection.to);
      
      if (!fromPos || !toPos) return null;

      const lineLength = Math.sqrt(
        Math.pow(toPos.x - fromPos.x, 2) + 
        Math.pow(toPos.y - fromPos.y, 2)
      );
      const angle = Math.atan2(toPos.y - fromPos.y, toPos.x - fromPos.x) * 180 / Math.PI;

      return (
        <View
          key={`connection-${connection.from}-${connection.to}`}
          style={[
            styles.connectionLine,
            {
              left: fromPos.x,
              top: fromPos.y - 1,
              width: lineLength,
              transform: [{ rotate: `${angle}deg` }],
              opacity: connection.relevance * 0.6,
              backgroundColor: getConnectionColor(connection.connectionType),
            }
          ]}
        />
      );
    });
  }, [nodeConnections, nodePositions]);

  // Get connection color
  const getConnectionColor = useCallback((type: string) => {
    switch (type) {
      case 'personal': return '#EC4899';
      case 'categorical': return '#3B82F6';
      default: return '#10B981';
    }
  }, []);

  // Render individual node (memoized)
  const renderNode = useCallback(({ item }: { item: typeof viewportNodes[0] }) => (
    <VirtualNode
      key={item.node.id}
      node={item.node}
      position={item.position}
      onPress={onNodePress}
      isVisible={item.isVisible}
    />
  ), [onNodePress]);

  // Key extractor
  const keyExtractor = useCallback((item: typeof viewportNodes[0]) => item.node.id, []);

  // Get layout for performance optimization
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 24,
    offset: index * 24,
    index,
  }), []);

  return (
    <View style={styles.container}>
      {/* Connection lines layer */}
      <View style={styles.connectionsLayer}>
        {renderConnectionLines()}
      </View>

      {/* Virtualized nodes layer */}
      <FlatList
        data={viewportNodes}
        renderItem={renderNode}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={handleViewportChange}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={3}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.nodesList}
        contentContainerStyle={styles.nodesContainer}
      />

      {/* Performance indicator */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Visible: {visibleNodeIds.current.size}/{nodes.length}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  connectionsLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  nodesList: {
    flex: 1,
    zIndex: 2,
  },
  nodesContainer: {
    flexGrow: 1,
  },
  virtualNode: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  nodeTouchable: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  insightIndicator: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  connectionLine: {
    position: 'absolute',
    height: 1,
    transformOrigin: '0 50%',
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 999,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});