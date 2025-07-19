/**
 * Shared error handling utilities
 * Consolidates the 60+ duplicate error handling patterns across the app
 */

export interface ErrorContext {
  service: string;
  operation: string;
  details?: Record<string, any>;
}

export class ErrorHandler {
  /**
   * Log error with consistent format
   */
  static logError(context: ErrorContext, error: any): void {
    const errorInfo = {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
    console.error(`❌ [${context.service}]: ${context.operation} failed:`, errorInfo);
  }

  /**
   * Log warning with consistent format
   */
  static logWarning(context: ErrorContext, message: string): void {
    console.warn(`⚠️ [${context.service}]: ${message}`, context);
  }

  /**
   * Log success with consistent format
   */
  static logSuccess(context: ErrorContext, message: string): void {
    console.log(`✅ [${context.service}]: ${message}`, context);
  }

  /**
   * Handle API errors with standard format
   */
  static handleApiError(service: string, operation: string, error: any, endpoint?: string): void {
    this.logError({
      service,
      operation,
      details: { endpoint }
    }, error);
  }

  /**
   * Wrap async operations with standard error handling
   */
  static async wrapAsync<T>(
    context: ErrorContext,
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      const result = await operation();
      this.logSuccess(context, `${context.operation} completed`);
      return result;
    } catch (error) {
      this.logError(context, error);
      return fallback;
    }
  }

  /**
   * Wrap sync operations with standard error handling
   */
  static wrapSync<T>(
    context: ErrorContext,
    operation: () => T,
    fallback?: T
  ): T | undefined {
    try {
      const result = operation();
      this.logSuccess(context, `${context.operation} completed`);
      return result;
    } catch (error) {
      this.logError(context, error);
      return fallback;
    }
  }
}