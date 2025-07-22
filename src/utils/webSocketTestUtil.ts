import { getEnhancedWebSocketService } from '../services/enhancedWebSocketService';
import CloudAuth from '../services/cloudAuth';
import { log } from './logger';

/**
 * Utility to test and debug WebSocket connections
 */
export class WebSocketTestUtil {
  
  /**
   * Test WebSocket connection with detailed logging
   */
  static async testConnection(): Promise<{
    success: boolean;
    details: any;
    recommendations: string[];
  }> {
    const websocketService = getEnhancedWebSocketService();
    const recommendations: string[] = [];
    
    log.info('🧪 Starting WebSocket Connection Test', null, 'WebSocketTestUtil');
    
    // Test 1: Check authentication
    const cloudAuth = CloudAuth.getInstance();
    const authState = cloudAuth.getState();
    
    const authTest = {
      isAuthenticated: authState.isAuthenticated,
      hasToken: !!authState.token,
      hasUser: !!authState.user,
      tokenLength: authState.token?.length || 0,
      userId: authState.user?.id || 'N/A',
      userEmail: authState.user?.email || 'N/A'
    };
    
    log.info('🔐 Authentication Test', authTest, 'WebSocketTestUtil');
    
    if (!authState.isAuthenticated || !authState.token) {
      recommendations.push('User must be authenticated for WebSocket connection');
      return {
        success: false,
        details: { authTest, connectionTest: null },
        recommendations
      };
    }
    
    // Test 2: Attempt connection
    try {
      log.info('🔌 Attempting WebSocket connection...', null, 'WebSocketTestUtil');
      
      const connectionStart = Date.now();
      const connected = await websocketService.initialize();
      const connectionDuration = Date.now() - connectionStart;
      
      const connectionTest = {
        connected,
        duration: `${connectionDuration}ms`,
        status: websocketService.getConnectionStatus(),
      };
      
      log.info('📊 Connection Test Result', connectionTest, 'WebSocketTestUtil');
      
      if (connected) {
        // Test 3: Test basic functionality
        websocketService.testConnection();
        
        recommendations.push('WebSocket connection successful');
        recommendations.push('Real-time features are available');
        
        return {
          success: true,
          details: { authTest, connectionTest },
          recommendations
        };
      } else {
        const status = websocketService.getConnectionStatus();
        
        if (status.lastError?.includes('User not found')) {
          recommendations.push('Server user authentication issue - check user registration');
          recommendations.push('Try logging out and logging back in');
        } else if (status.lastError?.includes('timeout')) {
          recommendations.push('Connection timeout - server may be slow or unavailable');
          recommendations.push('Check internet connection and server status');
        } else if (status.lastError?.includes('502') || status.lastError?.includes('503')) {
          recommendations.push('Server temporarily unavailable');
          recommendations.push('WebSocket will retry automatically when server is available');
        } else {
          recommendations.push('Unknown connection error - check network and server status');
        }
        
        return {
          success: false,
          details: { authTest, connectionTest },
          recommendations
        };
      }
    } catch (error) {
      const errorDetails = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      };
      
      log.error('❌ WebSocket Test Error', errorDetails, 'WebSocketTestUtil');
      
      recommendations.push('WebSocket connection failed with error');
      recommendations.push('App will continue to function without real-time features');
      
      return {
        success: false,
        details: { authTest, connectionTest: null, error: errorDetails },
        recommendations
      };
    }
  }
  
  /**
   * Monitor WebSocket connection status
   */
  static startMonitoring(intervalMs: number = 30000): () => void {
    const websocketService = getEnhancedWebSocketService();
    
    const interval = setInterval(() => {
      const status = websocketService.getConnectionStatus();
      log.debug('📡 WebSocket Status Monitor', {
        isConnected: status.isConnected,
        lastConnected: status.lastConnected,
        reconnectAttempts: status.reconnectAttempts,
        lastError: status.lastError
      }, 'WebSocketTestUtil');
    }, intervalMs);
    
    return () => clearInterval(interval);
  }
  
  /**
   * Force WebSocket reconnection
   */
  static async forceReconnect(): Promise<boolean> {
    const websocketService = getEnhancedWebSocketService();
    
    log.info('🔄 Forcing WebSocket reconnection', null, 'WebSocketTestUtil');
    
    // Cleanup current connection
    websocketService.cleanup();
    
    // Wait a bit then reconnect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await websocketService.initialize();
  }
}