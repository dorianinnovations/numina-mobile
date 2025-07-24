import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SandboxNode } from '../types/sandbox';
import { AnimatedBackArrow } from './AnimatedBackArrow';
import { useComponentVisibility } from '../hooks/useVisibilityAwareAnimation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Robust canvas configuration
const CANVAS_CONFIG = {
  // Virtual canvas size - constrained to keep nodes discoverable
  VIRTUAL_WIDTH: screenWidth * 6,   // 6x screen width for better boundaries
  VIRTUAL_HEIGHT: screenHeight * 6, // 6x screen height for better boundaries
  
  // Node rendering
  NODE_SIZE: 40,
  MIN_NODE_DISTANCE: 120, // Minimum distance between nodes
  RENDER_BUFFER: 500, // Larger buffer to ensure nodes are always visible
  
  // Performance
  MAX_VISIBLE_NODES: 50, // Never render more than this at once
  ANIMATION_POOL_SIZE: 20, // Reuse animation values
  
  // Grid system for efficient spatial indexing
  GRID_SIZE: 300, // Size of each grid cell for spatial partitioning
  
  // Scroll boundaries - prevent nodes from going too far out of view
  SCROLL_BOUNDARY_BUFFER: screenWidth * 0.5, // Don't scroll beyond this from nodes
};

interface NodePosition {
  id: string;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  title: string;
  category: string;
  confidence: number;
  animationIndex: number; // Reused animation pool index
}

interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface InfiniteNodeCanvasProps {
  nodes: SandboxNode[];
  onNodePress: (node: SandboxNode) => void;
  onNodeLock?: (node: SandboxNode) => void;
  visible: boolean;
  onClose?: () => void;
}

export const InfiniteNodeCanvas: React.FC<InfiniteNodeCanvasProps> = ({
  nodes,
  onNodePress,
  onNodeLock,
  visible,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  
  // Viewport tracking
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation pool - reuse animation values for performance
  const animationPool = useRef<Array<{
    scale: Animated.Value;
    opacity: Animated.Value;
    pulse: Animated.Value;
    inUse: boolean;
  }>>(
    Array.from({ length: CANVAS_CONFIG.ANIMATION_POOL_SIZE }, () => ({
      scale: new Animated.Value(0.8), // Start closer to full size
      opacity: new Animated.Value(0.5), // Start partially visible
      pulse: new Animated.Value(1),
      inUse: false,
    }))
  ).current;

  // Spatial grid for fast node lookup
  const spatialGrid = useRef<Map<string, NodePosition[]>>(new Map()).current;

  // Generate optimized node positions with initial nodes near center
  const nodePositions = useMemo((): NodePosition[] => {
    if (nodes.length === 0) return [];

    spatialGrid.clear();
    const positions: NodePosition[] = [];
    const placedPositions: Array<{ x: number; y: number }> = [];

    // Calculate center position for easy discovery
    const centerX = CANVAS_CONFIG.VIRTUAL_WIDTH / 2;
    const centerY = CANVAS_CONFIG.VIRTUAL_HEIGHT / 2;

    // Generate position with preference for center area for first few nodes
    const generatePosition = (index: number, attempt: number = 0): { x: number; y: number } => {
      if (attempt > 100) {
        // Fallback to grid-based positioning near center
        const gridCols = Math.ceil(Math.sqrt(nodes.length));
        const col = index % gridCols;
        const row = Math.floor(index / gridCols);
        
        // Position grid around center instead of top-left
        const gridSpacing = 200;
        const offsetX = (gridCols - 1) * gridSpacing / 2;
        const offsetY = (gridCols - 1) * gridSpacing / 2;
        
        return {
          x: centerX - offsetX + col * gridSpacing,
          y: centerY - offsetY + row * gridSpacing,
        };
      }

      let x, y;
      
      if (index < 5) {
        // First 5 nodes: Close to center for easy discovery
        const radius = 150 + (index * 80); // Expanding circles from center
        const angle = (index / 5) * Math.PI * 2;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      } else {
        // Remaining nodes: More spread out but still discoverable
        const maxRadius = Math.min(screenWidth * 2, screenHeight * 2);
        const radius = 300 + Math.random() * maxRadius;
        const angle = Math.random() * Math.PI * 2;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
        
        // Ensure within bounds
        x = Math.max(100, Math.min(CANVAS_CONFIG.VIRTUAL_WIDTH - 100, x));
        y = Math.max(100, Math.min(CANVAS_CONFIG.VIRTUAL_HEIGHT - 100, y));
      }

      // Check minimum distance from existing nodes
      const tooClose = placedPositions.some(pos => {
        const distance = Math.sqrt(
          Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
        );
        return distance < CANVAS_CONFIG.MIN_NODE_DISTANCE;
      });

      if (tooClose) {
        return generatePosition(index, attempt + 1);
      }

      return { x, y };
    };

    nodes.forEach((node, index) => {
      const { x, y } = generatePosition(index);
      placedPositions.push({ x, y });

      // Calculate grid position for spatial indexing
      const gridX = Math.floor(x / CANVAS_CONFIG.GRID_SIZE);
      const gridY = Math.floor(y / CANVAS_CONFIG.GRID_SIZE);
      const gridKey = `${gridX}-${gridY}`;

      const position: NodePosition = {
        id: node.id,
        x,
        y,
        gridX,
        gridY,
        title: node.title,
        category: node.category,
        confidence: node.confidence,
        animationIndex: index % CANVAS_CONFIG.ANIMATION_POOL_SIZE,
      };

      positions.push(position);

      // Add to spatial grid
      if (!spatialGrid.has(gridKey)) {
        spatialGrid.set(gridKey, []);
      }
      spatialGrid.get(gridKey)!.push(position);
    });

    return positions;
  }, [nodes, spatialGrid]);

  // Get visible nodes - now with persistent rendering to prevent derenders
  const getVisibleNodes = useCallback((offset: { x: number; y: number }): NodePosition[] => {
    // Use the configured buffer directly
    const EXTENDED_BUFFER = CANVAS_CONFIG.RENDER_BUFFER;
    
    const viewport: ViewportBounds = {
      left: offset.x - EXTENDED_BUFFER,
      right: offset.x + screenWidth + EXTENDED_BUFFER,
      top: offset.y - EXTENDED_BUFFER,
      bottom: offset.y + screenHeight + EXTENDED_BUFFER,
    };

    // Calculate which grid cells are in extended viewport
    const startGridX = Math.floor(viewport.left / CANVAS_CONFIG.GRID_SIZE);
    const endGridX = Math.ceil(viewport.right / CANVAS_CONFIG.GRID_SIZE);
    const startGridY = Math.floor(viewport.top / CANVAS_CONFIG.GRID_SIZE);
    const endGridY = Math.ceil(viewport.bottom / CANVAS_CONFIG.GRID_SIZE);

    const visibleNodes: NodePosition[] = [];
    const centerX = offset.x + screenWidth / 2;
    const centerY = offset.y + screenHeight / 2;

    // Check grid cells in extended viewport
    for (let gridX = startGridX; gridX <= endGridX; gridX++) {
      for (let gridY = startGridY; gridY <= endGridY; gridY++) {
        const gridKey = `${gridX}-${gridY}`;
        const gridNodes = spatialGrid.get(gridKey) || [];

        gridNodes.forEach(node => {
          if (
            node.x >= viewport.left &&
            node.x <= viewport.right &&
            node.y >= viewport.top &&
            node.y <= viewport.bottom
          ) {
            // Calculate distance from viewport center for priority
            const distance = Math.sqrt(
              Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2)
            );
            
            visibleNodes.push({
              ...node,
              distance // Add distance for sorting
            } as NodePosition & { distance: number });
          }
        });
      }
    }

    // Always show nodes that are very close to viewport center
    const coreNodes = visibleNodes.filter((node: any) => node.distance < screenWidth);
    const otherNodes = visibleNodes.filter((node: any) => node.distance >= screenWidth);

    // Prioritize core nodes, then add others up to limit
    const sortedNodes = [
      ...coreNodes.sort((a: any, b: any) => a.distance - b.distance),
      ...otherNodes.sort((a: any, b: any) => a.distance - b.distance)
    ];

    // Remove distance property before returning
    return sortedNodes
      .slice(0, CANVAS_CONFIG.MAX_VISIBLE_NODES)
      .map(({ distance, ...node }: any) => node);
  }, [spatialGrid]);

  // Currently visible nodes
  const [visibleNodes, setVisibleNodes] = useState<NodePosition[]>([]);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);

  // Track node visibility state separately to avoid mutations
  const nodeVisibilityRef = useRef<Map<string, boolean>>(new Map());
  
  // Stop animations when canvas is not visible
  useComponentVisibility(visible, () => {
    // Stop all animations when component becomes invisible
    animationPool.forEach(animation => {
      if (animation.inUse) {
        animation.scale.stopAnimation();
        animation.opacity.stopAnimation();
        animation.pulse.stopAnimation();
      }
    });
  });

  // Update visible nodes when viewport changes
  useEffect(() => {
    // Don't update if canvas is not visible
    if (!visible) {
      return;
    }
    
    const newVisibleNodes = getVisibleNodes(viewportOffset);
    
    // Mark nodes as visible/invisible for animation management
    nodePositions.forEach(node => {
      const wasVisible = nodeVisibilityRef.current.get(node.id) || false;
      const isVisible = newVisibleNodes.some(vn => vn.id === node.id);
      
      if (wasVisible !== isVisible) {
        nodeVisibilityRef.current.set(node.id, isVisible);
        
        const animation = animationPool[node.animationIndex];
        if (isVisible && !animation.inUse) {
          // Animate in
          animation.inUse = true;
          Animated.parallel([
            Animated.spring(animation.scale, {
              toValue: 1,
              tension: 200, // Faster spring
              friction: 10, // Less bouncy
              useNativeDriver: true,
            }),
            Animated.timing(animation.opacity, {
              toValue: 1,
              duration: 150, // Faster fade in
              useNativeDriver: true,
            }),
          ]).start();
        } else if (!isVisible && animation.inUse) {
          // Animate out
          Animated.parallel([
            Animated.timing(animation.scale, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(animation.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            animation.inUse = false;
          });
        }
      }
    });

    setVisibleNodes(newVisibleNodes);
  }, [viewportOffset, getVisibleNodes, nodePositions.length, animationPool, visible]);

  // Handle scroll events - simple and smooth without boundaries
  const handleScroll = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    
    // Simply update viewport offset without any boundaries or restrictions
    setViewportOffset({
      x: contentOffset.x,
      y: contentOffset.y,
    });
  }, []);

  // Handle node press
  const handleNodePress = useCallback((nodePosition: NodePosition) => {
    const node = nodes.find(n => n.id === nodePosition.id);
    if (node) {
      // Quick press animation
      const animation = animationPool[nodePosition.animationIndex];
      if (animation.inUse) {
        Animated.sequence([
          Animated.timing(animation.scale, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(animation.scale, {
            toValue: 1,
            tension: 200,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      onNodePress(node);
    }
  }, [nodes, onNodePress, animationPool]);

  // Rich, vibrant category colors with sophisticated gradients
  const getCategoryColors = useCallback((category: string): { primary: string; secondary: string; accent: string; name: string; description: string } => {
    const colorMap = {
      insight: {
        primary: '#6366F1',     // Rich indigo
        secondary: '#8B5CF6',   // Vibrant purple
        accent: '#C4B5FD',      // Light lavender
        name: 'Deep Insight',
        description: 'Profound understanding and clarity'
      },
      behavioral: {
        primary: '#EC4899',     // Vibrant pink
        secondary: '#F97316',   // Rich orange
        accent: '#FBBF24',      // Golden yellow
        name: 'Behavioral Pattern',
        description: 'Action-oriented psychological insights'
      },
      analytical: {
        primary: '#059669',     // Deep emerald
        secondary: '#0D9488',   // Rich teal
        accent: '#10B981',      // Bright green
        name: 'Data Analysis',
        description: 'Logical reasoning and systematic evaluation'
      },
      creative: {
        primary: '#DC2626',     // Rich red
        secondary: '#EA580C',   // Vibrant orange-red
        accent: '#F59E0B',      // Amber gold
        name: 'Creative Process',
        description: 'Innovation and imaginative thinking'
      },
      system: {
        primary: '#1F2937',     // Deep charcoal
        secondary: '#4B5563',   // Medium gray
        accent: '#9CA3AF',      // Light gray
        name: 'System Logic',
        description: 'Foundational processes and structures'
      },
      social: {
        primary: '#7C3AED',     // Rich violet
        secondary: '#A855F7',   // Bright purple
        accent: '#C084FC',      // Light purple
        name: 'Social Dynamic',
        description: 'Interpersonal patterns and connections'
      },
    };
    return colorMap[category as keyof typeof colorMap] || colorMap.insight;
  }, []);

  // Render individual node with sophisticated styling and contextual information
  const renderNode = useCallback((nodePosition: NodePosition) => {
    const animation = animationPool[nodePosition.animationIndex];
    const categoryInfo = getCategoryColors(nodePosition.category);
    const confidenceLevel = Math.round(nodePosition.confidence * 100);
    
    // Find the actual node to check if it's locked
    const actualNode = nodes.find(n => n.id === nodePosition.id);
    const isLocked = actualNode?.isLocked || false;

    return (
      <Animated.View
        key={nodePosition.id}
        style={[
          styles.nodeDot,
          {
            left: nodePosition.x - CANVAS_CONFIG.NODE_SIZE / 2,
            top: nodePosition.y - CANVAS_CONFIG.NODE_SIZE / 2,
            transform: [
              { scale: animation.scale }
            ],
            opacity: animation.opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dotTouchable,
            {
              backgroundColor: categoryInfo.primary,
              shadowColor: categoryInfo.secondary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 12,
              borderWidth: 2,
              borderColor: categoryInfo.accent,
            },
          ]}
          onPress={() => handleNodePress(nodePosition)}
          activeOpacity={0.8}
        >
          {/* Rich gradient inner glow */}
          <View style={[
            styles.dotInner,
            {
              backgroundColor: categoryInfo.accent,
              opacity: 0.6,
            }
          ]} />
          
          {/* Sophisticated confidence indicator */}
          <View style={[
            styles.confidenceRing,
            {
              borderColor: categoryInfo.accent,
              borderWidth: 2,
              transform: [{ scale: nodePosition.confidence }],
              opacity: 0.8,
            }
          ]} />

          {/* Subtle inner shadow for depth */}
          <View style={[
            styles.dotInnerShadow,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            }
          ]} />
          
          {/* Lock indicator */}
          {isLocked && (
            <View style={styles.lockIndicator}>
              <MaterialCommunityIcons 
                name="lock" 
                size={12} 
                color="#FFD700" 
              />
            </View>
          )}
        </TouchableOpacity>
        
        {/* Lock button */}
        {!isLocked && onNodeLock && (
          <TouchableOpacity
            style={[
              styles.lockButton,
              {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: categoryInfo.accent,
              }
            ]}
            onPress={() => {
              const node = nodes.find(n => n.id === nodePosition.id);
              if (node && onNodeLock) {
                onNodeLock(node);
              }
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons 
              name="lock-open-outline" 
              size={14} 
              color={categoryInfo.primary} 
            />
          </TouchableOpacity>
        )}

        {/* Sophisticated always-visible label with contextual information */}
        <View 
          style={[
            styles.nodeLabel,
            {
              backgroundColor: isDarkMode 
                ? 'rgba(0, 0, 0, 0.9)' 
                : 'rgba(255, 255, 255, 0.95)',
              borderColor: categoryInfo.primary,
              borderWidth: 1.5,
              shadowColor: categoryInfo.secondary,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 6,
            }
          ]}
          pointerEvents="none"
        >
          {/* Node title */}
          <Text style={[
            styles.nodeLabelText,
            { 
              color: isDarkMode ? '#ffffff' : '#1a1a1a',
              fontWeight: '700',
            }
          ]}>
            {nodePosition.title.length > 22 
              ? nodePosition.title.substring(0, 22) + '...' 
              : nodePosition.title
            }
          </Text>
          
          {/* Sophisticated category name */}
          <Text style={[
            styles.nodeCategoryText,
            { 
              color: categoryInfo.primary,
              fontWeight: '600',
            }
          ]}>
            {categoryInfo.name}
          </Text>
          
          {/* Contextual description */}
          <Text style={[
            styles.nodeDescriptionText,
            { 
              color: isDarkMode ? '#CCCCCC' : '#666666',
              fontWeight: '400',
            }
          ]}>
            {categoryInfo.description}
          </Text>

          {/* Confidence indicator */}
          <View style={styles.confidenceIndicator}>
            <View style={[
              styles.confidenceBar,
              {
                backgroundColor: categoryInfo.accent,
                opacity: 0.3,
              }
            ]} />
            <View style={[
              styles.confidenceBarFill,
              {
                backgroundColor: categoryInfo.primary,
                width: `${confidenceLevel}%`,
                shadowColor: categoryInfo.secondary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
              }
            ]} />
            <Text style={[
              styles.confidenceText,
              {
                color: categoryInfo.primary,
                fontWeight: '600',
              }
            ]}>
              {confidenceLevel}% confidence
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }, [animationPool, getCategoryColors, handleNodePress, isDarkMode, nodes, onNodeLock]);

  // Auto-scroll to center when canvas becomes visible
  useEffect(() => {
    if (visible && !hasInitiallyScrolled && scrollViewRef.current && nodePositions.length > 0) {
      // Calculate the bounding box of all nodes
      const nodeXPositions = nodePositions.map(n => n.x);
      const nodeYPositions = nodePositions.map(n => n.y);
      
      const minX = Math.min(...nodeXPositions);
      const maxX = Math.max(...nodeXPositions);
      const minY = Math.min(...nodeYPositions);
      const maxY = Math.max(...nodeYPositions);
      
      // Center of the node cluster
      const clusterCenterX = (minX + maxX) / 2;
      const clusterCenterY = (minY + maxY) / 2;
      
      // Scroll position to center the cluster
      const scrollX = Math.max(0, Math.min(
        clusterCenterX - screenWidth / 2,
        CANVAS_CONFIG.VIRTUAL_WIDTH - screenWidth
      ));
      const scrollY = Math.max(0, Math.min(
        clusterCenterY - screenHeight / 2,
        CANVAS_CONFIG.VIRTUAL_HEIGHT - screenHeight
      ));
      
      // Immediately set viewport and scroll without animation for instant display
      setViewportOffset({ x: scrollX, y: scrollY });
      setHasInitiallyScrolled(true);
      
      // Use requestAnimationFrame for immediate scroll without delay
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          x: scrollX,
          y: scrollY,
          animated: false, // No animation for instant positioning
        });
      });
    }
  }, [visible, hasInitiallyScrolled, nodePositions]);

  // Reset scroll state when canvas closes
  useEffect(() => {
    if (!visible) {
      setHasInitiallyScrolled(false);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Back Button - Top Left */}
      {onClose && (
        <View style={styles.backButtonContainer}>
          <AnimatedBackArrow
            onPress={onClose}
            color={isDarkMode ? '#ffffff' : '#000000'}
            size={20}
          />
        </View>
      )}
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{
          width: CANVAS_CONFIG.VIRTUAL_WIDTH,
          height: CANVAS_CONFIG.VIRTUAL_HEIGHT,
        }}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16} // 60fps scroll tracking
        bounces={false}
        maximumZoomScale={3}
        minimumZoomScale={0.5}
        bouncesZoom={true}
        pinchGestureEnabled={true}
      >
        {/* Infinite background pattern */}
        <View style={[
          styles.backgroundCanvas,
          {
            backgroundColor: isDarkMode ? '#0a0a0a' : '#fafafa',
          }
        ]}>
          {/* Subtle grid pattern */}
          {Array.from({ length: Math.ceil(CANVAS_CONFIG.VIRTUAL_WIDTH / 100) }).map((_, i) =>
            Array.from({ length: Math.ceil(CANVAS_CONFIG.VIRTUAL_HEIGHT / 100) }).map((_, j) => (
              <View
                key={`${i}-${j}`}
                style={[
                  styles.gridDot,
                  {
                    left: i * 100,
                    top: j * 100,
                    backgroundColor: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.01)' 
                      : 'rgba(0, 0, 0, 0.01)',
                  }
                ]}
              />
            ))
          )}
        </View>

        {/* Render only visible nodes */}
        {visibleNodes.map(renderNode)}
      </ScrollView>

      {/* Floating instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[
          styles.instructionsText,
          { color: isDarkMode ? '#888888' : '#666666' }
        ]}>
          Scroll to explore • Pinch to zoom • Tap nodes for insights
        </Text>
      </View>

      {/* Mini-map indicator (future enhancement) */}
      <View style={styles.minimapContainer}>
        <View style={[
          styles.minimapViewport,
          {
            left: (viewportOffset.x / CANVAS_CONFIG.VIRTUAL_WIDTH) * 80,
            top: (viewportOffset.y / CANVAS_CONFIG.VIRTUAL_HEIGHT) * 80,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          }
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure it's not blocking content
  },
  backButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  backgroundCanvas: {
    position: 'absolute',
    width: CANVAS_CONFIG.VIRTUAL_WIDTH,
    height: CANVAS_CONFIG.VIRTUAL_HEIGHT,
  },
  gridDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  nodeDot: {
    position: 'absolute',
    width: CANVAS_CONFIG.NODE_SIZE,
    height: CANVAS_CONFIG.NODE_SIZE,
  },
  dotTouchable: {
    width: CANVAS_CONFIG.NODE_SIZE,
    height: CANVAS_CONFIG.NODE_SIZE,
    borderRadius: CANVAS_CONFIG.NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
  },
  confidenceRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  dotInnerShadow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 2,
    left: 2,
  },
  lockIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 2,
  },
  lockButton: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nodeLabel: {
    position: 'absolute',
    top: 48,
    left: -65,
    width: 170,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 1,
  },
  nodeLabelText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 3,
  },
  nodeCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  nodeDescriptionText: {
    fontSize: 9,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 11,
    marginBottom: 6,
    opacity: 0.9,
  },
  confidenceIndicator: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  confidenceBar: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    marginBottom: 3,
  },
  confidenceBarFill: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
    top: 0,
    left: 0,
  },
  confidenceText: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  minimapContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  minimapViewport: {
    position: 'absolute',
    width: 16,
    height: 12,
    borderRadius: 2,
  },
});