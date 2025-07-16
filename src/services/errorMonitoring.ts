import NetInfo from '@react-native-community/netinfo';

/**
 * Comprehensive Error Monitoring Service
 * Centralizes error handling, logging, and recovery mechanisms
 */

interface ErrorContext {
  component?: string;
  method?: string;
  userId?: string;
  timestamp: string;
  networkState?: boolean;
  appState?: string;
  additionalData?: any;
}

interface ErrorReport {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  recoveryAttempted: boolean;
}

class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;
  private maxQueueSize = 50;
  private networkState: boolean = true;
  private appState: string = 'active';

  private constructor() {
    this.initializeNetworkMonitoring();
  }

  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  /**
   * Initialize network state monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      const netInfo = await NetInfo.fetch();
      this.networkState = netInfo.isConnected || false;
      
      NetInfo.addEventListener(state => {
        this.networkState = state.isConnected || false;
        console.log('🌐 ErrorMonitoring: Network state changed:', this.networkState);
      });
    } catch (error) {
      console.error('❌ ErrorMonitoring: Failed to initialize network monitoring:', error);
    }
  }

  /**
   * Report an error with context
   */
  reportError(
    error: Error,
    context: Partial<ErrorContext> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      error,
      context: {
        timestamp: new Date().toISOString(),
        networkState: this.networkState,
        appState: this.appState,
        ...context,
      },
      severity,
      handled: false,
      recoveryAttempted: false,
    };

    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log error with enhanced context
    this.logError(errorReport);
    
    // Attempt recovery for critical errors
    if (severity === 'critical') {
      this.attemptRecovery(errorReport);
    }

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processErrorQueue();
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enhanced error logging
   */
  private logError(errorReport: ErrorReport): void {
    const { error, context, severity } = errorReport;
    
    console.group(`🚨 ${severity.toUpperCase()} ERROR`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Context:', context);
    console.error('Network State:', context.networkState);
    console.error('App State:', context.appState);
    console.groupEnd();

    // In production, send to crash reporting service
    if (!__DEV__) {
      // Example: Sentry.captureException(error, { extra: context });
    }
  }

  /**
   * Attempt recovery for critical errors
   */
  private async attemptRecovery(errorReport: ErrorReport): Promise<void> {
    console.log('🔄 ErrorMonitoring: Attempting recovery for critical error:', errorReport.id);
    
    try {
      // Check if it's a network-related error
      if (errorReport.error.message?.includes('network') || 
          errorReport.error.message?.includes('fetch') ||
          errorReport.error.message?.includes('timeout')) {
        
        // Wait for network to be available
        if (!this.networkState) {
          console.log('🌐 ErrorMonitoring: Waiting for network connection...');
          await this.waitForNetwork();
        }
        
        // Retry the operation if possible
        await this.retryOperation(errorReport);
      }
      
      // Check if it's a memory-related error
      if (errorReport.error.message?.includes('memory') ||
          errorReport.error.message?.includes('out of memory')) {
        console.log('🧠 ErrorMonitoring: Memory issue detected, attempting cleanup...');
        await this.performMemoryCleanup();
      }
      
      errorReport.recoveryAttempted = true;
      console.log('✅ ErrorMonitoring: Recovery attempt completed');
      
    } catch (recoveryError) {
      console.error('❌ ErrorMonitoring: Recovery failed:', recoveryError);
    }
  }

  /**
   * Wait for network connection
   */
  private async waitForNetwork(): Promise<void> {
    return new Promise((resolve) => {
      const checkNetwork = async () => {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          resolve();
        } else {
          setTimeout(checkNetwork, 1000);
        }
      };
      checkNetwork();
    });
  }

  /**
   * Retry operation if possible
   */
  private async retryOperation(errorReport: ErrorReport): Promise<void> {
    // This would be implemented based on the specific error context
    console.log('🔄 ErrorMonitoring: Retrying operation...');
    
    // Example: If it's an API call, retry it
    if (errorReport.context.method?.includes('api')) {
      // Retry logic would go here
      console.log('🔄 ErrorMonitoring: Retrying API call...');
    }
  }

  /**
   * Perform memory cleanup
   */
  private async performMemoryCleanup(): Promise<void> {
    // Clear caches, unused references, etc.
    console.log('🧹 ErrorMonitoring: Performing memory cleanup...');
    
    // Example cleanup operations:
    // - Clear image caches
    // - Clear unused component references
    // - Force garbage collection (if available)
  }

  /**
   * Process error queue
   */
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      while (this.errorQueue.length > 0) {
        const errorReport = this.errorQueue.shift();
        if (errorReport) {
          await this.processErrorReport(errorReport);
        }
      }
    } catch (error) {
      console.error('❌ ErrorMonitoring: Failed to process error queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual error report
   */
  private async processErrorReport(errorReport: ErrorReport): Promise<void> {
    try {
      // Mark as handled
      errorReport.handled = true;
      
      // Send to analytics/monitoring service
      await this.sendToMonitoringService(errorReport);
      
    } catch (error) {
      console.error('❌ ErrorMonitoring: Failed to process error report:', error);
    }
  }

  /**
   * Send error to monitoring service
   */
  private async sendToMonitoringService(errorReport: ErrorReport): Promise<void> {
    // In a real app, you would send this to your monitoring service
    // For now, we'll just log it
    console.log('📊 ErrorMonitoring: Sending error to monitoring service:', {
      id: errorReport.id,
      severity: errorReport.severity,
      handled: errorReport.handled,
      recoveryAttempted: errorReport.recoveryAttempted,
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    criticalErrors: number;
    handledErrors: number;
    recoveryAttempts: number;
  } {
    const totalErrors = this.errorQueue.length;
    const criticalErrors = this.errorQueue.filter(e => e.severity === 'critical').length;
    const handledErrors = this.errorQueue.filter(e => e.handled).length;
    const recoveryAttempts = this.errorQueue.filter(e => e.recoveryAttempted).length;

    return {
      totalErrors,
      criticalErrors,
      handledErrors,
      recoveryAttempts,
    };
  }

  /**
   * Clear error queue
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
    console.log('🧹 ErrorMonitoring: Error queue cleared');
  }

  /**
   * Update app state
   */
  updateAppState(state: string): void {
    this.appState = state;
    console.log('📱 ErrorMonitoring: App state updated:', state);
  }
}

export default ErrorMonitoringService; 