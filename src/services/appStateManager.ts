import { AppState, AppStateStatus } from 'react-native';

type AppStateListener = (state: AppStateStatus) => void;

/**
 * Centralized app state manager to control background/foreground behavior
 * and pause/resume resource-intensive operations
 */
class AppStateManager {
  private static instance: AppStateManager;
  private currentState: AppStateStatus = 'active';
  private listeners: Set<AppStateListener> = new Set();
  private appStateSubscription: any;
  
  // Track pausable intervals and animations
  private pausableIntervals: Map<string, { 
    interval: NodeJS.Timeout; 
    paused: boolean;
    callback: () => void;
    duration: number;
  }> = new Map();
  
  private pausableAnimations: Map<string, {
    animation: any;
    paused: boolean;
  }> = new Map();

  private constructor() {
    this.initializeAppStateListener();
  }

  static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }

  private initializeAppStateListener() {
    // Listen for app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
    
    // Set initial state
    this.currentState = AppState.currentState || 'active';
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(`🔄 App state changing from ${this.currentState} to ${nextAppState}`);
    
    const wasBackground = this.currentState === 'background';
    const isBackground = nextAppState === 'background';
    
    this.currentState = nextAppState;
    
    // Notify all listeners
    this.listeners.forEach(listener => listener(nextAppState));
    
    // Handle background/foreground transitions
    if (isBackground && !wasBackground) {
      this.onEnterBackground();
    } else if (!isBackground && wasBackground) {
      this.onEnterForeground();
    }
  };

  private onEnterBackground() {
    console.log('📱 App entering background - pausing resource-intensive operations');
    
    // Pause all registered intervals
    this.pausableIntervals.forEach((intervalData, id) => {
      if (!intervalData.paused) {
        clearInterval(intervalData.interval);
        intervalData.paused = true;
        console.log(`⏸️ Paused interval: ${id}`);
      }
    });
    
    // Pause all registered animations
    this.pausableAnimations.forEach((animData, id) => {
      if (animData.animation && animData.animation.stop) {
        animData.animation.stop();
        animData.paused = true;
        console.log(`⏸️ Paused animation: ${id}`);
      }
    });
  }

  private onEnterForeground() {
    console.log('📱 App entering foreground - resuming operations');
    
    // Resume all paused intervals
    this.pausableIntervals.forEach((intervalData, id) => {
      if (intervalData.paused) {
        intervalData.interval = setInterval(
          intervalData.callback,
          intervalData.duration
        );
        intervalData.paused = false;
        console.log(`▶️ Resumed interval: ${id}`);
      }
    });
    
    // Resume all paused animations
    this.pausableAnimations.forEach((animData, id) => {
      if (animData.paused && animData.animation && animData.animation.start) {
        animData.animation.start();
        animData.paused = false;
        console.log(`▶️ Resumed animation: ${id}`);
      }
    });
  }

  /**
   * Register an interval that should be paused in background
   */
  registerPausableInterval(
    id: string,
    callback: () => void,
    duration: number
  ): NodeJS.Timeout {
    // Clear any existing interval with same ID
    if (this.pausableIntervals.has(id)) {
      const existing = this.pausableIntervals.get(id)!;
      clearInterval(existing.interval);
    }
    
    const interval = setInterval(callback, duration);
    
    this.pausableIntervals.set(id, {
      interval,
      paused: false,
      callback,
      duration
    });
    
    return interval;
  }

  /**
   * Register an animation that should be paused in background
   */
  registerPausableAnimation(id: string, animation: any) {
    this.pausableAnimations.set(id, {
      animation,
      paused: false
    });
  }

  /**
   * Unregister and clear an interval
   */
  unregisterInterval(id: string) {
    const intervalData = this.pausableIntervals.get(id);
    if (intervalData) {
      clearInterval(intervalData.interval);
      this.pausableIntervals.delete(id);
    }
  }

  /**
   * Unregister an animation
   */
  unregisterAnimation(id: string) {
    const animData = this.pausableAnimations.get(id);
    if (animData && animData.animation && animData.animation.stop) {
      animData.animation.stop();
    }
    this.pausableAnimations.delete(id);
  }

  /**
   * Add a listener for app state changes
   */
  addListener(listener: AppStateListener): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current app state
   */
  getCurrentState(): AppStateStatus {
    return this.currentState;
  }

  /**
   * Check if app is in background
   */
  isInBackground(): boolean {
    return this.currentState === 'background';
  }

  /**
   * Check if app is active
   */
  isActive(): boolean {
    return this.currentState === 'active';
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    // Clear all intervals
    this.pausableIntervals.forEach((intervalData) => {
      clearInterval(intervalData.interval);
    });
    this.pausableIntervals.clear();
    
    // Stop all animations
    this.pausableAnimations.forEach((animData) => {
      if (animData.animation && animData.animation.stop) {
        animData.animation.stop();
      }
    });
    this.pausableAnimations.clear();
    
    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    // Clear listeners
    this.listeners.clear();
  }
}

export default AppStateManager;