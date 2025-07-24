import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SandboxNode } from '../types/sandbox';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constrained canvas dimensions for better performance
const CANVAS_WIDTH = Math.min(screenWidth * 0.8, 320);
const CANVAS_HEIGHT = Math.min(screenHeight * 0.6, 480);
const CANVAS_PADDING = 40;

interface NodeDot {
  id: string;
  x: number;
  y: number;
  title: string;
  category: string;
  confidence: number;
  animationDelay: number;
}

interface SandboxNodeCanvasProps {
  nodes: SandboxNode[];
  onNodePress: (node: SandboxNode) => void;
  visible: boolean;
}

export const SandboxNodeCanvas: React.FC<SandboxNodeCanvasProps> = ({
  nodes,
  onNodePress,
  visible,
}) => {
  const { isDarkMode } = useTheme();
  
  // Animation values for each node
  const nodeAnimations = useRef<Map<string, {
    scale: Animated.Value;
    opacity: Animated.Value;
    pulse: Animated.Value;
  }>>(new Map()).current;

  // Generate positions for nodes in a constrained, optimized layout
  const generateNodePositions = (): NodeDot[] => {
    const usableWidth = CANVAS_WIDTH - (CANVAS_PADDING * 2);
    const usableHeight = CANVAS_HEIGHT - (CANVAS_PADDING * 2);
    
    return nodes.map((node, index) => {
      // Create grid-based positioning with organic offset for performance
      const gridCols = Math.ceil(Math.sqrt(nodes.length));
      const gridRows = Math.ceil(nodes.length / gridCols);
      
      const col = index % gridCols;
      const row = Math.floor(index / gridCols);
      
      const baseX = (col / Math.max(1, gridCols - 1)) * usableWidth;
      const baseY = (row / Math.max(1, gridRows - 1)) * usableHeight;
      
      // Add controlled randomness (reduced for performance)
      const randomOffset = {
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 40,
      };
      
      const canvasStartX = (screenWidth - CANVAS_WIDTH) / 2;
      const canvasStartY = (screenHeight - CANVAS_HEIGHT) / 2;
      
      const x = Math.max(
        canvasStartX + CANVAS_PADDING,
        Math.min(
          canvasStartX + CANVAS_WIDTH - CANVAS_PADDING,
          canvasStartX + CANVAS_PADDING + baseX + randomOffset.x
        )
      );
      
      const y = Math.max(
        canvasStartY + CANVAS_PADDING,
        Math.min(
          canvasStartY + CANVAS_HEIGHT - CANVAS_PADDING,
          canvasStartY + CANVAS_PADDING + baseY + randomOffset.y
        )
      );

      return {
        id: node.id,
        x,
        y,
        title: node.title,
        category: node.category,
        confidence: node.confidence,
        animationDelay: index * 100, // Reduced stagger for better performance
      };
    });
  };

  const nodeDots = generateNodePositions();

  // Initialize animations for each node
  useEffect(() => {
    nodeDots.forEach(({ id }) => {
      if (!nodeAnimations.has(id)) {
        nodeAnimations.set(id, {
          scale: new Animated.Value(0),
          opacity: new Animated.Value(0),
          pulse: new Animated.Value(1),
        });
      }
    });
  }, [nodeDots, nodeAnimations]);

  // Animate nodes in when visible (optimized)
  useEffect(() => {
    if (visible && nodeDots.length > 0) {
      // Batch animate for better performance
      const entranceAnimations = nodeDots.map(({ id, animationDelay }) => {
        const animations = nodeAnimations.get(id);
        if (!animations) return null;

        return Animated.sequence([
          Animated.delay(animationDelay),
          Animated.parallel([
            Animated.spring(animations.scale, {
              toValue: 1,
              tension: 120,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(animations.opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        ]);
      }).filter(Boolean);

      if (entranceAnimations.length > 0) {
        Animated.parallel(entranceAnimations as Animated.CompositeAnimation[]).start();
      }
    } else if (!visible) {
      // Quick animate out
      const exitAnimations = nodeDots.map(({ id }) => {
        const animations = nodeAnimations.get(id);
        if (!animations) return null;

        return Animated.parallel([
          Animated.timing(animations.scale, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(animations.opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]);
      }).filter(Boolean);

      if (exitAnimations.length > 0) {
        Animated.parallel(exitAnimations as Animated.CompositeAnimation[]).start();
      }
    }
  }, [visible]);

  const handleNodePress = (nodeDot: NodeDot) => {
    const node = nodes.find(n => n.id === nodeDot.id);
    if (node) {
      // Quick press animation
      const animations = nodeAnimations.get(nodeDot.id);
      if (animations) {
        Animated.sequence([
          Animated.timing(animations.scale, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(animations.scale, {
            toValue: 1,
            tension: 200,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      onNodePress(node);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors = {
      insight: '#3B82F6',
      behavioral: '#8B5CF6',
      analytical: '#10B981',
      creative: '#F59E0B',
      system: '#6B7280',
    };
    return colors[category as keyof typeof colors] || colors.insight;
  };

  const renderNodeDot = (nodeDot: NodeDot) => {
    const animations = nodeAnimations.get(nodeDot.id);
    if (!animations) return null;

    const categoryColor = getCategoryColor(nodeDot.category);

    return (
      <Animated.View
        key={nodeDot.id}
        style={[
          styles.nodeDot,
          {
            left: nodeDot.x - 20, // Center the 40px dot
            top: nodeDot.y - 20,
            transform: [
              { scale: Animated.multiply(animations.scale, animations.pulse) }
            ],
            opacity: animations.opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dotTouchable,
            {
              backgroundColor: categoryColor,
              shadowColor: categoryColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
          onPress={() => handleNodePress(nodeDot)}
          activeOpacity={0.8}
        >
          {/* Inner glow */}
          <View style={[
            styles.dotInner,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }
          ]} />
          
          {/* Confidence indicator */}
          <View style={[
            styles.confidenceRing,
            {
              borderColor: 'rgba(255, 255, 255, 0.4)',
              borderWidth: 2,
              transform: [{ scale: nodeDot.confidence }],
            }
          ]} />
        </TouchableOpacity>

        {/* Hover label */}
        <View style={[
          styles.nodeLabel,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)',
          }
        ]}>
          <Text style={[
            styles.nodeLabelText,
            { color: isDarkMode ? '#ffffff' : '#1a1a1a' }
          ]}>
            {nodeDot.title.length > 30 
              ? nodeDot.title.substring(0, 30) + '...' 
              : nodeDot.title
            }
          </Text>
        </View>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <View style={[styles.canvas, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      left: (screenWidth - CANVAS_WIDTH) / 2,
      top: (screenHeight - CANVAS_HEIGHT) / 2,
    }]}>
      {/* Optimized background pattern - reduced elements */}
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.backgroundDot,
              {
                left: (i % 3) * (CANVAS_WIDTH / 3),
                top: Math.floor(i / 3) * (CANVAS_HEIGHT / 3),
                backgroundColor: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : 'rgba(0, 0, 0, 0.03)',
              }
            ]}
          />
        ))}
      </View>

      {/* Node dots */}
      {nodeDots.map(renderNodeDot)}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={[
          styles.instructionsText,
          { color: isDarkMode ? '#888888' : '#666666' }
        ]}>
          Tap a node to explore insights
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  backgroundDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  nodeDot: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  dotTouchable: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  nodeLabel: {
    position: 'absolute',
    top: 45,
    left: -40,
    width: 120,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    opacity: 0.9,
  },
  nodeLabelText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});