import { Dimensions } from 'react-native';
import { SandboxNode } from '../types/sandbox';
import { LAYOUT } from '../constants/sandbox';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NodePosition {
  x: number;
  y: number;
}

interface PositionGrid {
  occupied: Set<string>;
  cellSize: number;
  cols: number;
  rows: number;
}

export class OptimizedNodePositioning {
  private static instance: OptimizedNodePositioning;
  private grid: PositionGrid;
  private canvasWidth: number;
  private canvasHeight: number;
  private canvasStartX: number;
  private canvasStartY: number;

  private constructor() {
    this.canvasWidth = Math.min(screenWidth * 0.8, LAYOUT.CANVAS_MAX_WIDTH);
    this.canvasHeight = Math.min(screenHeight * 0.6, LAYOUT.CANVAS_MAX_HEIGHT);
    this.canvasStartX = (screenWidth - this.canvasWidth) / 2;
    this.canvasStartY = (screenHeight - this.canvasHeight) / 2;

    const cellSize = 60; // Minimum distance between nodes
    this.grid = {
      occupied: new Set<string>(),
      cellSize,
      cols: Math.floor((this.canvasWidth - LAYOUT.CANVAS_PADDING * 2) / cellSize),
      rows: Math.floor((this.canvasHeight - LAYOUT.CANVAS_PADDING * 2) / cellSize),
    };
  }

  static getInstance(): OptimizedNodePositioning {
    if (!OptimizedNodePositioning.instance) {
      OptimizedNodePositioning.instance = new OptimizedNodePositioning();
    }
    return OptimizedNodePositioning.instance;
  }

  // Generate stable positions based on node ID (no auto-movement)
  generateStablePosition(node: SandboxNode, existingNodes: SandboxNode[] = []): NodePosition {
    // Use node ID to generate consistent position
    const hash = this.hashString(node.id);
    const maxAttempts = this.grid.cols * this.grid.rows;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const gridIndex = (hash + attempt) % (this.grid.cols * this.grid.rows);
      const col = gridIndex % this.grid.cols;
      const row = Math.floor(gridIndex / this.grid.cols);
      
      const gridKey = `${col},${row}`;
      
      if (!this.grid.occupied.has(gridKey)) {
        this.grid.occupied.add(gridKey);
        
        // Convert grid position to screen coordinates
        const x = this.canvasStartX + LAYOUT.CANVAS_PADDING + 
                  (col * this.grid.cellSize) + (this.grid.cellSize / 2);
        const y = this.canvasStartY + LAYOUT.CANVAS_PADDING + 
                  (row * this.grid.cellSize) + (this.grid.cellSize / 2);
        
        return { x, y };
      }
    }

    // Fallback to center if all positions occupied
    return {
      x: this.canvasStartX + this.canvasWidth / 2,
      y: this.canvasStartY + this.canvasHeight / 2,
    };
  }

  // Batch generate positions for multiple nodes efficiently
  generateBatchPositions(nodes: SandboxNode[]): Map<string, NodePosition> {
    this.clearGrid();
    const positions = new Map<string, NodePosition>();

    // Sort nodes by importance (insight nodes first, then by confidence)
    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.isInsightNode && !b.isInsightNode) return -1;
      if (!a.isInsightNode && b.isInsightNode) return 1;
      if (a.isLocked && !b.isLocked) return -1;
      if (!a.isLocked && b.isLocked) return 1;
      return b.confidence - a.confidence;
    });

    sortedNodes.forEach(node => {
      const position = this.generateStablePosition(node);
      positions.set(node.id, position);
    });

    return positions;
  }

  // Check if position is within canvas bounds
  isValidPosition(position: NodePosition): boolean {
    return (
      position.x >= this.canvasStartX + LAYOUT.CANVAS_PADDING &&
      position.x <= this.canvasStartX + this.canvasWidth - LAYOUT.CANVAS_PADDING &&
      position.y >= this.canvasStartY + LAYOUT.CANVAS_PADDING &&
      position.y <= this.canvasStartY + this.canvasHeight - LAYOUT.CANVAS_PADDING
    );
  }

  // Clear the position grid
  clearGrid(): void {
    this.grid.occupied.clear();
  }

  // Get canvas bounds for UI rendering
  getCanvasBounds() {
    return {
      x: this.canvasStartX,
      y: this.canvasStartY,
      width: this.canvasWidth,
      height: this.canvasHeight,
    };
  }

  // Simple hash function for consistent positioning
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get optimal node limit based on canvas size
  getMaxVisibleNodes(): number {
    const totalCells = this.grid.cols * this.grid.rows;
    return Math.min(totalCells * 0.7, LAYOUT.MAX_VISIBLE_NODES); // 70% fill ratio for clean appearance
  }
}

export const nodePositioning = OptimizedNodePositioning.getInstance();