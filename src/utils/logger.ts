// Use proper __DEV__ detection for React Native
const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  context?: string;
}

class Logger {
  private static instance: Logger;
  private minLogLevel: LogLevel;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  private constructor() {
    // In development, log everything. In production, only warnings and errors
    this.minLogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLogLevel;
  }

  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const levelName = LogLevel[level];
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${levelName} ${prefix} ${message}`;
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      data,
      timestamp: new Date(),
      context,
    };
    
    this.addToHistory(entry);
    if (__DEV__) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context), data);
    }
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message,
      data,
      timestamp: new Date(),
      context,
    };
    
    this.addToHistory(entry);
    if (__DEV__) {
      console.info(this.formatMessage(LogLevel.INFO, message, context), data);
    }
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message,
      data,
      timestamp: new Date(),
      context,
    };
    
    this.addToHistory(entry);
    console.warn(this.formatMessage(LogLevel.WARN, message, context), data);
  }

  error(message: string, error?: Error | any, context?: string): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      data: error,
      timestamp: new Date(),
      context,
    };
    
    this.addToHistory(entry);
    console.error(this.formatMessage(LogLevel.ERROR, message, context), error);
  }

  // Get recent logs for debugging or crash reporting
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logHistory.slice(-count);
  }

  // Clear log history
  clearHistory(): void {
    this.logHistory = [];
  }

  // Set minimum log level (useful for testing)
  setMinLogLevel(level: LogLevel): void {
    this.minLogLevel = level;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions that match console API
export const log = {
  debug: (message: string, data?: any, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: any, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: any, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: Error | any, context?: string) => logger.error(message, error, context),
};