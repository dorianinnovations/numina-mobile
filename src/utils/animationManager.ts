import { Animated } from 'react-native';

interface AnimationPool {
  active: Set<Animated.CompositeAnimation>;
  maxSize: number;
}

interface BoundedAnimationConfig {
  maxIterations?: number;
  autoCleanup?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Consolidated Animation Manager to prevent maximum update depth errors
 * - Limits concurrent animations
 * - Prevents infinite loops
 * - Automatic cleanup
 * - Priority-based animation queue
 */
export class AnimationManager {
  private static instance: AnimationManager;
  private pools: Map<string, AnimationPool> = new Map();
  private activeAnimations = 0;
  private readonly MAX_CONCURRENT_ANIMATIONS = 15;
  private cleanupTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializePools();
  }

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  private initializePools() {
    this.pools.set('node', { active: new Set(), maxSize: 8 });
    this.pools.set('cursor', { active: new Set(), maxSize: 1 });
    this.pools.set('insight', { active: new Set(), maxSize: 3 });
    this.pools.set('ui', { active: new Set(), maxSize: 5 });
  }

  /**
   * Create a bounded animation that prevents infinite loops
   */
  createBoundedAnimation(
    poolName: string,
    animationFactory: () => Animated.CompositeAnimation,
    config: BoundedAnimationConfig = {}
  ): Animated.CompositeAnimation | null {
    const pool = this.pools.get(poolName);
    if (!pool) return null;

    // Check pool capacity
    if (pool.active.size >= pool.maxSize || this.activeAnimations >= this.MAX_CONCURRENT_ANIMATIONS) {
      return null;
    }

    const animation = animationFactory();
    pool.active.add(animation);
    this.activeAnimations++;

    // Wrap with bounded execution
    const boundedAnimation = this.wrapWithBounds(animation, pool, config);
    
    if (config.autoCleanup !== false) {
      this.scheduleCleanup();
    }

    return boundedAnimation;
  }

  private wrapWithBounds(
    animation: Animated.CompositeAnimation,
    pool: AnimationPool,
    config: BoundedAnimationConfig
  ): Animated.CompositeAnimation {
    const originalStart = animation.start.bind(animation);
    
    animation.start = (callback) => {
      let completed = false;
      
      const wrappedCallback = (finished?: boolean) => {
        if (completed) return;
        completed = true;
        
        // Remove from pool
        pool.active.delete(animation);
        this.activeAnimations = Math.max(0, this.activeAnimations - 1);
        
        // Call original callback
        if (callback) {
          callback(finished);
        }
      };

      // Add timeout safety net
      const maxDuration = config.maxIterations ? config.maxIterations * 2000 : 10000;
      const timeoutId = setTimeout(() => {
        if (!completed) {
          animation.stop();
          wrappedCallback(false);
        }
      }, maxDuration);

      originalStart((finished) => {
        clearTimeout(timeoutId);
        wrappedCallback(finished);
      });
    };

    return animation;
  }

  /**
   * Create a safe looping animation with iteration limits
   */
  createSafeLoop(
    poolName: string,
    animationFactory: () => Animated.CompositeAnimation,
    maxIterations: number = 5
  ): Animated.CompositeAnimation | null {
    return this.createBoundedAnimation(
      poolName,
      () => Animated.loop(animationFactory(), { iterations: maxIterations }),
      { maxIterations, autoCleanup: true }
    );
  }

  /**
   * Create a cursor blink animation that doesn't recurse infinitely
   */
  createCursorBlink(
    cursorAnim: Animated.Value,
    onDuration: number = 530,
    offDuration: number = 530
  ): Animated.CompositeAnimation | null {
    return this.createSafeLoop('cursor', () => 
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: offDuration,
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: onDuration,
          useNativeDriver: true,
        }),
      ]),
      10 // Limit to 10 blinks, then restart
    );
  }

  /**
   * Create insight arrival animation with bounded pulse
   */
  createInsightArrival(
    animations: {
      opacity: Animated.Value;
      scale: Animated.Value;
      translateY: Animated.Value;
      glow?: Animated.Value;
      pulse?: Animated.Value;
    }
  ): Animated.CompositeAnimation | null {
    return this.createBoundedAnimation('insight', () => 
      Animated.sequence([
        // Materialization
        Animated.parallel([
          Animated.timing(animations.opacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          animations.glow ? Animated.timing(animations.glow, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }) : Animated.timing(new Animated.Value(0), { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.spring(animations.scale, {
            toValue: 0.7,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Pause
        Animated.delay(300),
        // Coalescing
        Animated.parallel([
          Animated.timing(animations.opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(animations.scale, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(animations.translateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // Final pulse (single, not infinite)
        animations.pulse ? Animated.spring(animations.pulse, {
          toValue: 1,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }) : Animated.timing(new Animated.Value(0), { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
  }

  /**
   * Stop all animations in a pool
   */
  stopPool(poolName: string): void {
    const pool = this.pools.get(poolName);
    if (!pool) return;

    pool.active.forEach(animation => {
      animation.stop();
    });
    
    this.activeAnimations = Math.max(0, this.activeAnimations - pool.active.size);
    pool.active.clear();
  }

  /**
   * Stop all animations
   */
  stopAll(): void {
    this.pools.forEach((pool, poolName) => {
      this.stopPool(poolName);
    });
  }

  /**
   * Get current animation statistics
   */
  getStats() {
    return {
      totalActive: this.activeAnimations,
      byPool: Object.fromEntries(
        Array.from(this.pools.entries()).map(([name, pool]) => [name, pool.active.size])
      ),
      capacity: {
        total: this.MAX_CONCURRENT_ANIMATIONS,
        remaining: this.MAX_CONCURRENT_ANIMATIONS - this.activeAnimations,
      }
    };
  }

  private scheduleCleanup(): void {
    if (this.cleanupTimeout) return;
    
    this.cleanupTimeout = setTimeout(() => {
      // Force cleanup any animations that should have finished
      this.pools.forEach((pool) => {
        if (pool.active.size > pool.maxSize) {
          const excess = Array.from(pool.active).slice(0, pool.active.size - pool.maxSize);
          excess.forEach(animation => {
            animation.stop();
            pool.active.delete(animation);
          });
        }
      });
      
      this.cleanupTimeout = null;
    }, 5000);
  }

  /**
   * Cleanup method for component unmount
   */
  cleanup(): void {
    this.stopAll();
    if (this.cleanupTimeout) {
      clearTimeout(this.cleanupTimeout);
      this.cleanupTimeout = null;
    }
  }
}

export const animationManager = AnimationManager.getInstance();