import { Animated } from 'react-native';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { resourceManager } from './resourceManager';

interface AnimationNode {
  id: string;
  animation: Animated.CompositeAnimation;
  type: 'bounded' | 'loop' | 'sequence' | 'parallel';
  priority: 'high' | 'medium' | 'low';
  startTime: number;
  maxDuration: number;
  onComplete?: () => void;
  dependencies: string[];
  isActive: boolean;
}

interface AnimationPool {
  nodes: Map<string, AnimationNode>;
  maxConcurrent: number;
  totalDuration: number;
  cleanupThreshold: number;
}

interface PerformanceMetrics {
  activeAnimations: number;
  totalAnimationsCreated: number;
  totalAnimationsCompleted: number;
  averageDuration: number;
  memoryPressure: number;
  lastOptimization: number;
}

/**
 * Extreme Animation System with Zero Memory Leaks
 * - Automatic lifecycle management
 * - Performance-based throttling
 * - Memory pressure detection
 * - Priority-based scheduling
 * - Automatic cleanup and optimization
 */
export class ExtremeAnimationSystem {
  private static instance: ExtremeAnimationSystem;
  
  // Animation pools by type
  private pools = new Map<string, AnimationPool>();
  private activeNodes = new Set<string>();
  
  // Performance monitoring
  private metrics: PerformanceMetrics = {
    activeAnimations: 0,
    totalAnimationsCreated: 0,
    totalAnimationsCompleted: 0,
    averageDuration: 0,
    memoryPressure: 0,
    lastOptimization: Date.now(),
  };
  
  // Resource management
  private optimizationTimer: NodeJS.Timeout | null = null;
  private performanceTimer: NodeJS.Timeout | null = null;
  private maxTotalAnimations = 20;
  private frameTargetMs = 16.67; // 60fps
  
  // Memory management
  private lastGC = Date.now();
  private gcThreshold = 100;
  private forceGCThreshold = 200;

  private constructor() {
    this.initializePools();
    this.startPerformanceMonitoring();
    this.startOptimizationLoop();
  }

  static getInstance(): ExtremeAnimationSystem {
    if (!ExtremeAnimationSystem.instance) {
      ExtremeAnimationSystem.instance = new ExtremeAnimationSystem();
    }
    return ExtremeAnimationSystem.instance;
  }

  /**
   * Initialize animation pools with performance limits
   */
  private initializePools(): void {
    const poolConfigs = [
      { name: 'cursor', maxConcurrent: 1, cleanupThreshold: 60000 },
      { name: 'node', maxConcurrent: 8, cleanupThreshold: 30000 },
      { name: 'insight', maxConcurrent: 3, cleanupThreshold: 45000 },
      { name: 'ui', maxConcurrent: 6, cleanupThreshold: 20000 },
      { name: 'modal', maxConcurrent: 2, cleanupThreshold: 10000 },
    ];

    for (const config of poolConfigs) {
      this.pools.set(config.name, {
        nodes: new Map(),
        maxConcurrent: config.maxConcurrent,
        totalDuration: 0,
        cleanupThreshold: config.cleanupThreshold,
      });
    }
  }

  /**
   * Create bounded animation with automatic cleanup
   */
  createBoundedAnimation(
    poolName: string,
    animationFactory: () => Animated.CompositeAnimation,
    options: {
      priority?: 'high' | 'medium' | 'low';
      maxDuration?: number;
      onComplete?: () => void;
      dependencies?: string[];
    } = {}
  ): string | null {
    const pool = this.pools.get(poolName);
    if (!pool) {
      return null;
    }

    // Check capacity and performance
    if (!this.canCreateAnimation(pool)) {
      return null;
    }

    const nodeId = `${poolName}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    try {
      const animation = animationFactory();
      const maxDuration = options.maxDuration || 10000;
      
      const animationNode: AnimationNode = {
        id: nodeId,
        animation,
        type: 'bounded',
        priority: options.priority || 'medium',
        startTime: Date.now(),
        maxDuration,
        onComplete: options.onComplete,
        dependencies: options.dependencies || [],
        isActive: false,
      };

      // Wrap animation with safety mechanisms
      const safeAnimation = this.wrapWithSafety(animationNode, poolName);
      animationNode.animation = safeAnimation;

      // Add to pool
      pool.nodes.set(nodeId, animationNode);
      this.metrics.totalAnimationsCreated++;

      return nodeId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create safe looping animation with iteration limits
   */
  createSafeLoop(
    poolName: string,
    animationFactory: () => Animated.CompositeAnimation,
    maxIterations: number = 5,
    options: {
      priority?: 'high' | 'medium' | 'low';
      onComplete?: () => void;
    } = {}
  ): string | null {
    return this.createBoundedAnimation(
      poolName,
      () => Animated.loop(animationFactory(), { iterations: maxIterations }),
      {
        ...options,
        maxDuration: maxIterations * 2000, // Estimate duration
      }
    );
  }

  /**
   * Start animation with performance monitoring
   */
  startAnimation(nodeId: string, componentId: string): boolean {
    const { pool, node } = this.findAnimation(nodeId);
    if (!pool || !node) {
      return false;
    }

    // Check if already active
    if (node.isActive) {
      return true;
    }

    // Performance check
    if (this.metrics.activeAnimations >= this.maxTotalAnimations) {
      return false;
    }

    // Mark as active
    node.isActive = true;
    this.activeNodes.add(nodeId);
    this.metrics.activeAnimations++;

    // Track with resource manager
    const trackedAnimation = resourceManager.createAnimation(
      {
        stop: () => {
          node.animation.stop();
          this.completeAnimation(nodeId);
        }
      },
      componentId,
      node.priority
    );

    // Start the animation
    node.animation.start((finished) => {
      this.completeAnimation(nodeId, finished);
    });

    return true;
  }

  /**
   * Stop animation with cleanup
   */
  stopAnimation(nodeId: string): boolean {
    const { pool, node } = this.findAnimation(nodeId);
    if (!pool || !node) {
      return false;
    }

    if (node.isActive) {
      node.animation.stop();
      this.completeAnimation(nodeId, false);
    }

    return true;
  }

  /**
   * Stop all animations in a pool
   */
  stopPool(poolName: string): void {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    for (const [nodeId, node] of pool.nodes.entries()) {
      if (node.isActive) {
        node.animation.stop();
        this.completeAnimation(nodeId, false);
      }
    }
  }

  /**
   * Wrap animation with safety mechanisms
   */
  private wrapWithSafety(
    node: AnimationNode,
    poolName: string
  ): Animated.CompositeAnimation {
    const originalAnimation = node.animation;
    
    // Create timeout for max duration
    const safetyTimeout = resourceManager.createTimeout(() => {
      originalAnimation.stop();
      this.completeAnimation(node.id, false);
    }, node.maxDuration, 'animation-system', 'high');

    // Wrap start method
    const originalStart = originalAnimation.start.bind(originalAnimation);
    originalAnimation.start = (callback) => {
      originalStart((finished) => {
        clearTimeout(safetyTimeout);
        if (callback) callback(finished);
      });
    };

    return originalAnimation;
  }

  /**
   * Check if animation can be created based on performance
   */
  private canCreateAnimation(pool: AnimationPool): boolean {
    // Check pool capacity
    if (pool.nodes.size >= pool.maxConcurrent) {
      this.optimizePool(pool);
      if (pool.nodes.size >= pool.maxConcurrent) {
        return false;
      }
    }

    // Check total system capacity
    if (this.metrics.activeAnimations >= this.maxTotalAnimations) {
      this.performEmergencyOptimization();
      return this.metrics.activeAnimations < this.maxTotalAnimations;
    }

    // Check memory pressure
    if (this.metrics.memoryPressure > 0.8) {
      this.performGarbageCollection();
      return this.metrics.memoryPressure <= 0.8;
    }

    return true;
  }

  /**
   * Complete animation with cleanup
   */
  private completeAnimation(nodeId: string, finished?: boolean): void {
    const { pool, node } = this.findAnimation(nodeId);
    if (!pool || !node) return;

    // Update metrics
    if (node.isActive) {
      this.metrics.activeAnimations = Math.max(0, this.metrics.activeAnimations - 1);
      this.metrics.totalAnimationsCompleted++;
      
      const duration = Date.now() - node.startTime;
      this.metrics.averageDuration = 
        (this.metrics.averageDuration * (this.metrics.totalAnimationsCompleted - 1) + duration) /
        this.metrics.totalAnimationsCompleted;
    }

    // Mark as inactive
    node.isActive = false;
    this.activeNodes.delete(nodeId);

    // Call completion callback
    if (node.onComplete && finished !== false) {
      try {
        node.onComplete();
      } catch (error) {
      }
    }

    // Remove from pool after delay to allow for cleanup
    resourceManager.createTimeout(() => {
      pool.nodes.delete(nodeId);
    }, 1000, 'animation-system', 'low');
  }

  /**
   * Find animation by ID
   */
  private findAnimation(nodeId: string): { pool: AnimationPool | null; node: AnimationNode | null } {
    for (const pool of this.pools.values()) {
      const node = pool.nodes.get(nodeId);
      if (node) {
        return { pool, node };
      }
    }
    return { pool: null, node: null };
  }

  /**
   * Optimize pool by removing stale animations
   */
  private optimizePool(pool: AnimationPool): void {
    const now = Date.now();
    const nodesToRemove: string[] = [];

    for (const [nodeId, node] of pool.nodes.entries()) {
      // Remove completed animations
      if (!node.isActive && (now - node.startTime) > 5000) {
        nodesToRemove.push(nodeId);
      }
      // Remove stuck animations
      else if (node.isActive && (now - node.startTime) > node.maxDuration * 1.5) {
        node.animation.stop();
        this.completeAnimation(nodeId, false);
        nodesToRemove.push(nodeId);
      }
    }

    for (const nodeId of nodesToRemove) {
      pool.nodes.delete(nodeId);
    }
  }

  /**
   * Emergency optimization when system is overloaded
   */
  private performEmergencyOptimization(): void {

    // Stop low priority animations
    for (const pool of this.pools.values()) {
      for (const [nodeId, node] of pool.nodes.entries()) {
        if (node.isActive && node.priority === 'low') {
          node.animation.stop();
          this.completeAnimation(nodeId, false);
        }
      }
    }

    // If still overloaded, stop medium priority
    if (this.metrics.activeAnimations >= this.maxTotalAnimations) {
      for (const pool of this.pools.values()) {
        for (const [nodeId, node] of pool.nodes.entries()) {
          if (node.isActive && node.priority === 'medium') {
            node.animation.stop();
            this.completeAnimation(nodeId, false);
          }
        }
      }
    }

  }

  /**
   * Perform garbage collection
   */
  private performGarbageCollection(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [poolName, pool] of this.pools.entries()) {
      const nodesToRemove: string[] = [];

      for (const [nodeId, node] of pool.nodes.entries()) {
        if (!node.isActive && (now - node.startTime) > pool.cleanupThreshold) {
          nodesToRemove.push(nodeId);
        }
      }

      for (const nodeId of nodesToRemove) {
        pool.nodes.delete(nodeId);
        cleaned++;
      }
    }

    this.updateMemoryPressure();
    this.lastGC = now;

  }

  /**
   * Update memory pressure metric
   */
  private updateMemoryPressure(): void {
    let totalNodes = 0;
    for (const pool of this.pools.values()) {
      totalNodes += pool.nodes.size;
    }

    this.metrics.memoryPressure = totalNodes / this.gcThreshold;
    
    // Force GC if pressure is too high
    if (totalNodes > this.forceGCThreshold) {
      this.performGarbageCollection();
    }
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    this.performanceTimer = resourceManager.createInterval(() => {
      this.updateMemoryPressure();
      
      // Auto-optimize if needed
      if (this.metrics.memoryPressure > 0.7) {
        this.performGarbageCollection();
      }
      
      // Performance metrics tracking (internal only)
    }, 5000, 'animation-system', 'low');
  }

  /**
   * Start optimization loop
   */
  private startOptimizationLoop(): void {
    this.optimizationTimer = resourceManager.createInterval(() => {
      // Optimize all pools
      for (const pool of this.pools.values()) {
        this.optimizePool(pool);
      }
      
      this.metrics.lastOptimization = Date.now();
    }, 30000, 'animation-system', 'low');
  }

  /**
   * Get system metrics
   */
  getMetrics(): PerformanceMetrics & { poolStats: Record<string, { active: number; total: number }> } {
    const poolStats: Record<string, { active: number; total: number }> = {};
    
    for (const [poolName, pool] of this.pools.entries()) {
      const active = Array.from(pool.nodes.values()).filter(n => n.isActive).length;
      poolStats[poolName] = {
        active,
        total: pool.nodes.size
      };
    }

    return {
      ...this.metrics,
      poolStats
    };
  }

  /**
   * Force cleanup all animations (nuclear option)
   */
  forceCleanup(): void {

    // Stop all active animations
    for (const nodeId of this.activeNodes) {
      this.stopAnimation(nodeId);
    }

    // Clear all pools
    for (const pool of this.pools.values()) {
      pool.nodes.clear();
    }

    // Reset metrics
    this.metrics.activeAnimations = 0;
    this.metrics.memoryPressure = 0;
    
    this.activeNodes.clear();
    
  }

  /**
   * Destroy the animation system
   */
  destroy(): void {
    this.forceCleanup();
    
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }

    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }

    ExtremeAnimationSystem.instance = null as any;
  }
}

/**
 * React hook for extreme animation management
 */
export const useExtremeAnimations = (componentId: string) => {
  const animationSystem = ExtremeAnimationSystem.getInstance();
  const activeAnimations = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      // Stop all component animations on unmount
      for (const animationId of activeAnimations.current) {
        animationSystem.stopAnimation(animationId);
      }
      activeAnimations.current.clear();
    };
  }, [animationSystem]);

  const createBoundedAnimation = useCallback((
    poolName: string,
    animationFactory: () => Animated.CompositeAnimation,
    options?: any
  ) => {
    const animationId = animationSystem.createBoundedAnimation(poolName, animationFactory, options);
    if (animationId) {
      activeAnimations.current.add(animationId);
    }
    return animationId;
  }, [animationSystem]);

  const createSafeLoop = useCallback((
    poolName: string,
    animationFactory: () => Animated.CompositeAnimation,
    maxIterations: number = 5,
    options?: any
  ) => {
    const animationId = animationSystem.createSafeLoop(poolName, animationFactory, maxIterations, options);
    if (animationId) {
      activeAnimations.current.add(animationId);
    }
    return animationId;
  }, [animationSystem]);

  const startAnimation = useCallback((animationId: string) => {
    return animationSystem.startAnimation(animationId, componentId);
  }, [animationSystem, componentId]);

  const stopAnimation = useCallback((animationId: string) => {
    activeAnimations.current.delete(animationId);
    return animationSystem.stopAnimation(animationId);
  }, [animationSystem]);

  const getMetrics = useCallback(() => {
    return animationSystem.getMetrics();
  }, [animationSystem]);

  return {
    createBoundedAnimation,
    createSafeLoop,
    startAnimation,
    stopAnimation,
    getMetrics,
  };
};

export const extremeAnimationSystem = ExtremeAnimationSystem.getInstance();