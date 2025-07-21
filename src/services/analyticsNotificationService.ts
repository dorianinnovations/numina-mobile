/**
 * Analytics Notification Service
 * Lightweight service to trigger analytics insights notifications
 */

interface AnalyticsInsight {
  id: string;
  type: 'analytics' | 'ubpm' | 'emotional' | 'behavioral';
  message: string;
  timestamp: number;
  duration?: number;
  data?: any;
}

type NotificationCallback = (insights: AnalyticsInsight[]) => void;

class AnalyticsNotificationService {
  private insights: AnalyticsInsight[] = [];
  private callbacks: NotificationCallback[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up old insights every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldInsights();
    }, 30000);
  }

  /**
   * Subscribe to analytics insights
   */
  subscribe(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Trigger a new analytics insight notification
   */
  triggerInsight(
    type: AnalyticsInsight['type'],
    message: string,
    duration: number = 3000,
    data?: any
  ): void {
    const insight: AnalyticsInsight = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      duration,
      data
    };

    this.insights.push(insight);
    this.notifyCallbacks();

    // Auto-remove after duration + 1 second buffer
    setTimeout(() => {
      this.removeInsight(insight.id);
    }, duration + 1000);
  }

  /**
   * Trigger behavioral pattern detection
   */
  triggerBehavioralInsight(pattern: string, confidence: number): void {
    const message = `🧠 ${pattern} (${Math.round(confidence * 100)}% confidence)`;
    this.triggerInsight('behavioral', message, 4000);
  }

  /**
   * Trigger emotional analysis update
   */
  triggerEmotionalInsight(emotion: string, context?: string): void {
    const message = context 
      ? `💭 ${emotion} detected - ${context}`
      : `💭 Emotional state: ${emotion}`;
    this.triggerInsight('emotional', message, 3000);
  }

  /**
   * Trigger UBPM analysis completion
   */
  triggerUBPMInsight(summary: string): void {
    const message = `🧠 UBPM Analysis: ${summary}`;
    this.triggerInsight('ubmp', message, 5000);
  }

  /**
   * Trigger general analytics update
   */
  triggerAnalyticsUpdate(metric: string, value?: string): void {
    const message = value 
      ? `📊 ${metric}: ${value}`
      : `📊 ${metric} updated`;
    this.triggerInsight('analytics', message, 2500);
  }

  /**
   * Get current insights
   */
  getCurrentInsights(): AnalyticsInsight[] {
    return [...this.insights];
  }

  /**
   * Remove a specific insight
   */
  private removeInsight(id: string): void {
    const index = this.insights.findIndex(insight => insight.id === id);
    if (index > -1) {
      this.insights.splice(index, 1);
      this.notifyCallbacks();
    }
  }

  /**
   * Clean up old insights (older than 10 seconds)
   */
  private cleanupOldInsights(): void {
    const cutoff = Date.now() - 10000; // 10 seconds ago
    const oldCount = this.insights.length;
    
    this.insights = this.insights.filter(insight => insight.timestamp > cutoff);
    
    if (this.insights.length !== oldCount) {
      this.notifyCallbacks();
    }
  }

  /**
   * Notify all subscribers
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback([...this.insights]);
      } catch (error) {
        console.error('Error in analytics notification callback:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.insights = [];
    this.callbacks = [];
  }
}

// Export singleton instance
export default new AnalyticsNotificationService();

// Export types for use in components
export type { AnalyticsInsight };