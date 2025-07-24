import { useRef, useEffect, useCallback } from 'react';

interface ResourceCleanup {
  type: 'timeout' | 'interval' | 'listener' | 'animation' | 'request' | 'subscription';
  cleanup: () => void;
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Extreme Resource Manager for Memory Leak Prevention
 * - Tracks ALL resources (timers, listeners, animations, requests)
 * - Automatic cleanup with priority ordering
 * - Memory usage monitoring and limits
 * - Emergency cleanup for memory pressure
 */
export class ResourceManager {
  private static instance: ResourceManager;
  private resources = new Map<string, ResourceCleanup>();
  private componentResources = new Map<string, Set<string>>();
  private memoryThreshold = 100; // Max 100 tracked resources
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPeriodicCleanup();
    this.setupMemoryPressureHandling();
  }

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Track a timeout with automatic cleanup
   */
  createTimeout(
    callback: () => void,
    delay: number,
    componentId: string,
    priority: ResourceCleanup['priority'] = 'medium'
  ): NodeJS.Timeout {
    const timeoutId = setTimeout(() => {
      this.unregister(`timeout-${timeoutId}`);
      callback();
    }, delay);

    this.register({
      type: 'timeout',
      cleanup: () => clearTimeout(timeoutId),
      id: `timeout-${timeoutId}`,
      priority,
    }, componentId);

    return timeoutId;
  }

  /**
   * Track an interval with automatic cleanup
   */
  createInterval(
    callback: () => void,
    delay: number,
    componentId: string,
    priority: ResourceCleanup['priority'] = 'medium'
  ): NodeJS.Timeout {
    const intervalId = setInterval(callback, delay);

    this.register({
      type: 'interval',
      cleanup: () => clearInterval(intervalId),
      id: `interval-${intervalId}`,
      priority,
    }, componentId);

    return intervalId;
  }

  /**
   * Track an event listener with automatic cleanup
   */
  createEventListener<T extends EventTarget>(
    target: T,
    event: string,
    handler: EventListener,
    options: AddEventListenerOptions | boolean | undefined,
    componentId: string,
    priority: ResourceCleanup['priority'] = 'high'
  ): () => void {
    target.addEventListener(event, handler, options);

    const cleanup = () => target.removeEventListener(event, handler, options);
    
    this.register({
      type: 'listener',
      cleanup,
      id: `listener-${event}-${Date.now()}`,
      priority,
    }, componentId);

    return cleanup;
  }

  /**
   * Track an AbortController with automatic cleanup
   */
  createAbortController(
    componentId: string,
    priority: ResourceCleanup['priority'] = 'critical'
  ): AbortController {
    const controller = new AbortController();

    this.register({
      type: 'request',
      cleanup: () => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      },
      id: `abort-${Date.now()}`,
      priority,
    }, componentId);

    return controller;
  }

  /**
   * Track animation with automatic cleanup
   */
  createAnimation(
    animation: { stop: () => void },
    componentId: string,
    priority: ResourceCleanup['priority'] = 'high'
  ): { stop: () => void } {
    const animationId = `animation-${Date.now()}`;

    this.register({
      type: 'animation',
      cleanup: () => animation.stop(),
      id: animationId,
      priority,
    }, componentId);

    // Wrap stop method to auto-unregister
    return {
      stop: () => {
        animation.stop();
        this.unregister(animationId);
      }
    };
  }

  /**
   * Register a custom resource
   */
  register(resource: ResourceCleanup, componentId: string): void {
    this.resources.set(resource.id, resource);
    
    if (!this.componentResources.has(componentId)) {
      this.componentResources.set(componentId, new Set());
    }
    this.componentResources.get(componentId)!.add(resource.id);

    // Check memory pressure
    if (this.resources.size > this.memoryThreshold) {
      this.emergencyCleanup();
    }
  }

  /**
   * Unregister a resource
   */
  unregister(resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    if (!resource) return false;

    this.resources.delete(resourceId);
    
    // Remove from component tracking
    for (const [componentId, resourceIds] of this.componentResources.entries()) {
      if (resourceIds.has(resourceId)) {
        resourceIds.delete(resourceId);
        if (resourceIds.size === 0) {
          this.componentResources.delete(componentId);
        }
        break;
      }
    }

    return true;
  }

  /**
   * Cleanup all resources for a component
   */
  cleanupComponent(componentId: string): void {
    const resourceIds = this.componentResources.get(componentId);
    if (!resourceIds) return;

    for (const resourceId of resourceIds) {
      const resource = this.resources.get(resourceId);
      if (resource) {
        try {
          resource.cleanup();
        } catch (error) {
        }
        this.resources.delete(resourceId);
      }
    }

    this.componentResources.delete(componentId);
  }

  /**
   * Emergency cleanup based on priority
   */
  private emergencyCleanup(): void {
    
    const resourcesByPriority: Record<ResourceCleanup['priority'], ResourceCleanup[]> = {
      low: [],
      medium: [],
      high: [],
      critical: []
    };

    // Group by priority
    for (const resource of this.resources.values()) {
      resourcesByPriority[resource.priority].push(resource);
    }

    // Cleanup low and medium priority first
    const toCleanup = [...resourcesByPriority.low, ...resourcesByPriority.medium];
    
    for (const resource of toCleanup) {
      try {
        resource.cleanup();
        this.unregister(resource.id);
      } catch (error) {
      }
    }
  }

  /**
   * Periodic cleanup of stale resources
   */
  private startPeriodicCleanup(): void {
    // Dynamic import to avoid circular dependency
    import('../services/appStateManager').then(({ default: AppStateManager }) => {
      const appStateManager = AppStateManager.getInstance();
      
      // Register as pausable interval - increase to 2 minutes
      this.cleanupTimer = appStateManager.registerPausableInterval(
        'resource-manager-cleanup',
        () => {
          // Cleanup resources older than 5 minutes (stale)
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          
          for (const [resourceId, resource] of this.resources.entries()) {
            const timestamp = parseInt(resourceId.split('-').pop() || '0', 10);
            if (timestamp && timestamp < fiveMinutesAgo) {
              try {
                resource.cleanup();
                this.unregister(resourceId);
              } catch (error) {
              }
            }
          }
        },
        120000 // Every 2 minutes instead of 30 seconds
      );
    }).catch(() => {
      // Fallback to regular interval if import fails
      this.cleanupTimer = setInterval(() => {
        // Same cleanup logic
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        
        for (const [resourceId, resource] of this.resources.entries()) {
          const timestamp = parseInt(resourceId.split('-').pop() || '0', 10);
          if (timestamp && timestamp < fiveMinutesAgo) {
            try {
              resource.cleanup();
              this.unregister(resourceId);
            } catch (error) {
            }
          }
        }
      }, 120000); // Every 2 minutes
    });
  }

  /**
   * Setup memory pressure handling
   */
  private setupMemoryPressureHandling(): void {
    // Monitor memory usage if available
    if (typeof (global as any).gc === 'function') {
      // Dynamic import to avoid circular dependency
      import('../services/appStateManager').then(({ default: AppStateManager }) => {
        const appStateManager = AppStateManager.getInstance();
        
        // Register as pausable interval - increase to 3 minutes
        appStateManager.registerPausableInterval(
          'resource-manager-memory',
          () => {
            if (this.resources.size > this.memoryThreshold * 0.8) {
              try {
                (global as any).gc();
              } catch (e) {
                // GC not available, that's okay
              }
            }
          },
          180000 // Every 3 minutes instead of 1 minute
        );
      }).catch(() => {
        // Fallback to regular interval if import fails
        const memoryCheckInterval = setInterval(() => {
          if (this.resources.size > this.memoryThreshold * 0.8) {
            try {
              (global as any).gc();
            } catch (e) {
              // GC not available, that's okay
            }
          }
        }, 180000); // Every 3 minutes

        // Cleanup the interval when needed
        this.register({
          type: 'interval',
          cleanup: () => clearInterval(memoryCheckInterval),
          id: `memory-check-${Date.now()}`,
          priority: 'critical'
        }, 'resource-manager');
      });
    }
  }

  /**
   * Get resource statistics
   */
  getStats() {
    const stats = {
      total: this.resources.size,
      byType: {} as Record<ResourceCleanup['type'], number>,
      byPriority: {} as Record<ResourceCleanup['priority'], number>,
      components: this.componentResources.size,
      memoryPressure: this.resources.size > this.memoryThreshold * 0.8
    };

    for (const resource of this.resources.values()) {
      stats.byType[resource.type] = (stats.byType[resource.type] || 0) + 1;
      stats.byPriority[resource.priority] = (stats.byPriority[resource.priority] || 0) + 1;
    }

    return stats;
  }

  /**
   * Force cleanup all resources (nuclear option)
   */
  cleanup(): void {
    for (const resource of this.resources.values()) {
      try {
        resource.cleanup();
      } catch (error) {
      }
    }

    this.resources.clear();
    this.componentResources.clear();

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Reset singleton instance for complete cleanup
    ResourceManager.instance = null as any;
  }
}

/**
 * React hook for automatic resource management
 */
export const useResourceManager = (componentId: string) => {
  const resourceManager = ResourceManager.getInstance();
  const componentRef = useRef(componentId);

  useEffect(() => {
    return () => {
      resourceManager.cleanupComponent(componentRef.current);
    };
  }, [resourceManager]);

  const createTimeout = useCallback((
    callback: () => void,
    delay: number,
    priority: ResourceCleanup['priority'] = 'medium'
  ) => {
    return resourceManager.createTimeout(callback, delay, componentRef.current, priority);
  }, [resourceManager]);

  const createInterval = useCallback((
    callback: () => void,
    delay: number,
    priority: ResourceCleanup['priority'] = 'medium'
  ) => {
    return resourceManager.createInterval(callback, delay, componentRef.current, priority);
  }, [resourceManager]);

  const createEventListener = useCallback(<T extends EventTarget>(
    target: T,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions | boolean,
    priority: ResourceCleanup['priority'] = 'high'
  ) => {
    return resourceManager.createEventListener(target, event, handler, options, componentRef.current, priority);
  }, [resourceManager]);

  const createAbortController = useCallback((
    priority: ResourceCleanup['priority'] = 'critical'
  ) => {
    return resourceManager.createAbortController(componentRef.current, priority);
  }, [resourceManager]);

  const createAnimation = useCallback((
    animation: { stop: () => void },
    priority: ResourceCleanup['priority'] = 'high'
  ) => {
    return resourceManager.createAnimation(animation, componentRef.current, priority);
  }, [resourceManager]);

  return {
    createTimeout,
    createInterval,
    createEventListener,
    createAbortController,
    createAnimation,
    getStats: () => resourceManager.getStats(),
  };
};

export const resourceManager = ResourceManager.getInstance();