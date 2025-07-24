import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import { SandboxNode } from '../types/sandbox';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NodeCanvasProps {
  nodes: SandboxNode[];
  onNodePress: (node: SandboxNode) => void;
  onLockNode: (node: SandboxNode) => void;
  onUnlockNode: (nodeId: string) => void;
  lockedNodes: SandboxNode[];
  nodeConnections: Array<{
    from: string;
    to: string;
    relevance: number;
    connectionType: string;
  }>;
}

// Define a larger canvas size for scrolling
const CANVAS_WIDTH = screenWidth * 2; // Double the screen width
const CANVAS_HEIGHT = screenHeight * 2; // Double the screen height

// Rainbow pastel color palette
const getRainbowPastelColor = (index: number): string => {
  const colors = [
    '#FFB3BA', // Pastel pink
    '#FFDFBA', // Pastel peach
    '#FFFFBA', // Pastel yellow
    '#BAFFBA', // Pastel green
    '#BAE1FF', // Pastel blue
    '#E6BAFF', // Pastel purple
    '#FFBAE6', // Pastel magenta
    '#BAF0FF', // Pastel cyan
    '#F0BAFF', // Pastel lavender
    '#BAFFF0', // Pastel mint
  ];
  return colors[index % colors.length];
};

const NodeCanvas: React.FC<NodeCanvasProps> = ({ nodes, onNodePress, onLockNode, onUnlockNode, lockedNodes, nodeConnections }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        maximumZoomScale={3} // Increased max zoom
        minimumZoomScale={0.1} // Allow much more zoom out
        centerContent={true}
        bouncesZoom={true} // Enable bouncy zoom
        pinchGestureEnabled={true} // Explicitly enable pinch
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <Svg height={CANVAS_HEIGHT} width={CANVAS_WIDTH} style={StyleSheet.absoluteFill}>
          {nodeConnections.map((connection, index) => {
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);

            const isFromLocked = lockedNodes.some(lockedNode => lockedNode.id === fromNode?.id);
            const isToLocked = lockedNodes.some(lockedNode => lockedNode.id === toNode?.id);

            if (fromNode && toNode && isFromLocked && isToLocked) {
              // Calculate center points of nodes
              const x1 = (fromNode.position?.x || 0) + styles.node.width / 2;
              const y1 = (fromNode.position?.y || 0) + styles.node.height / 2;
              const x2 = (toNode.position?.x || 0) + styles.node.width / 2;
              const y2 = (toNode.position?.y || 0) + styles.node.height / 2;

              return (
                <Line
                  key={connection.from + '-' + connection.to + index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#BB86FC" // A distinct color for the connection line
                  strokeWidth="2"
                />
              );
            }
            return null;
          })}
        </Svg>
        {nodes.map((node, index) => {
          const isLocked = lockedNodes.some(lockedNode => lockedNode.id === node.id);
          const nodeColor = getRainbowPastelColor(index);
          const lockedColor = '#FFD700'; // Gold for locked nodes
          
          return (
            <TouchableOpacity
              key={node.id}
              style={[
                styles.node,
                {
                  left: node.position?.x || 0,
                  top: node.position?.y || 0,
                  backgroundColor: isLocked ? lockedColor : nodeColor,
                  borderColor: isLocked ? '#FFA500' : nodeColor.replace('FF', 'DD'), // Darker border
                  shadowColor: isLocked ? lockedColor : nodeColor,
                },
              ]}
              onPress={() => onNodePress(node)}
            >
              <Text style={styles.nodeText} numberOfLines={1}>{node.title}</Text>
              <TouchableOpacity
                style={styles.lockButton}
                onPress={() => (isLocked ? onUnlockNode(node.id) : onLockNode(node))}
              >
                <Feather
                  name={isLocked ? 'lock' : 'unlock'}
                  size={12}
                  color={isLocked ? '#8B4513' : '#1F2937'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a', // Darker background for better pastel contrast
  },
  scrollViewContent: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#1a1a1a', // Dark canvas background to make pastels pop
    position: 'relative',
  },
  node: {
    position: 'absolute', // Absolute positioning for nodes
    width: 40, // Smaller width
    height: 40, // Smaller height
    padding: 4, // Reduced padding
    borderRadius: 20, // Circular
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A7F3D0', // Pastel and bright green
    borderWidth: 1,
    borderColor: '#6EE7B7', // Slightly darker green border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  nodeText: {
    color: '#1F2937', // Dark gray text for contrast
    fontSize: 10, // Smaller font size
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lockButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    padding: 2,
  },
});

export default NodeCanvas;
