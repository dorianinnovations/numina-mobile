import { useEffect, useRef } from 'react';
import ApiService from '../services/api';
import WebSocketService from '../services/websocketService';

/**
 * Hook to manage Numina's personality updates for active chat sessions
 */
export const useNuminaPersonality = (isActive: boolean = true) => {
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRapidModeRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isActive) {
      stopPersonalityUpdates();
      return;
    }

    // Start rapid updates when chat becomes active
    startRapidPersonalityUpdates();

    // Cleanup on unmount
    return () => {
      stopPersonalityUpdates();
    };
  }, [isActive]);

  const startRapidPersonalityUpdates = async () => {
    try {
      // Call backend to start rapid updates
      const response = await ApiService.post('/numina-personality/start-rapid-updates', {});
      
      if (response.success) {
        isRapidModeRef.current = true;
        
        // Set local timeout to fall back to normal updates after 5 minutes
        setTimeout(() => {
          if (isRapidModeRef.current) {
            startNormalPersonalityUpdates();
          }
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      // Fallback to normal updates
      startNormalPersonalityUpdates();
    }
  };

  const startNormalPersonalityUpdates = async () => {
    try {
      const response = await ApiService.post('/numina-personality/continuous-updates', {
        interval: 8000 // 8 seconds
      });
      
      if (response.success) {
        isRapidModeRef.current = false;
      }
    } catch (error) {
      // Handle error silently in production
    }
  };

  const stopPersonalityUpdates = () => {
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    isRapidModeRef.current = false;
  };

  const triggerImmediateUpdate = async () => {
    try {
      const response = await ApiService.get('/numina-personality/current-state');
      if (response.success && response.data) {
        // Manually trigger WebSocket event for immediate update
        (WebSocketService as any).emit && (WebSocketService as any).emit('numina_senses_updated', response.data);
      }
    } catch (error) {
      console.error('❌ Failed to trigger immediate update:', error);
    }
  };

  return {
    startRapidUpdates: startRapidPersonalityUpdates,
    startNormalUpdates: startNormalPersonalityUpdates,
    stopUpdates: stopPersonalityUpdates,
    triggerUpdate: triggerImmediateUpdate,
    isRapidMode: isRapidModeRef.current
  };
};

export default useNuminaPersonality;