import { useRef, useCallback, useEffect } from 'react';
import { requestAnimationFrame, cancelAnimationFrame } from 'react-native';

interface StreamingOptions {
  minUpdateInterval?: number; // Minimum time between UI updates (ms)
  bufferSize?: number; // Characters to buffer before updating
  scrollThrottle?: number; // Throttle scroll updates (ms)
  enableSmartBatching?: boolean; // Smart batching based on content
}

const DEFAULT_OPTIONS: StreamingOptions = {
  minUpdateInterval: 50, // Update UI max 20 times per second
  bufferSize: 20, // Buffer at least 20 chars
  scrollThrottle: 100, // Scroll max 10 times per second
  enableSmartBatching: true,
};

export const useOptimizedStreaming = (options: StreamingOptions = {}) => {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Refs for managing state without re-renders
  const contentBufferRef = useRef<string>('');
  const lastUpdateTimeRef = useRef<number>(0);
  const updateRAFRef = useRef<number | null>(null);
  const scrollRAFRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<boolean>(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateRAFRef.current) {
        cancelAnimationFrame(updateRAFRef.current);
      }
      if (scrollRAFRef.current) {
        cancelAnimationFrame(scrollRAFRef.current);
      }
    };
  }, []);
  
  /**
   * Process incoming streaming content with intelligent batching
   */
  const processStreamingContent = useCallback((
    newContent: string,
    onUpdate: (content: string) => void
  ) => {
    const now = Date.now();
    
    // Add to buffer
    contentBufferRef.current += newContent;
    
    // Smart batching logic
    const shouldUpdate = () => {
      // Always update if buffer is getting large
      if (contentBufferRef.current.length > config.bufferSize! * 5) {
        return true;
      }
      
      // Check time since last update
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      if (timeSinceLastUpdate < config.minUpdateInterval!) {
        return false;
      }
      
      // Update if we have enough content
      if (contentBufferRef.current.length >= config.bufferSize!) {
        return true;
      }
      
      // Update on natural breaks (smart batching)
      if (config.enableSmartBatching) {
        const hasNaturalBreak = 
          contentBufferRef.current.includes('\n') ||
          contentBufferRef.current.includes('. ') ||
          contentBufferRef.current.includes('! ') ||
          contentBufferRef.current.includes('? ');
        
        if (hasNaturalBreak) {
          return true;
        }
      }
      
      // Update if it's been too long (prevent stale content)
      if (timeSinceLastUpdate > config.minUpdateInterval! * 3) {
        return true;
      }
      
      return false;
    };
    
    // Schedule update if needed
    if (shouldUpdate() && !pendingUpdateRef.current) {
      pendingUpdateRef.current = true;
      
      // Use RAF for smooth updates
      updateRAFRef.current = requestAnimationFrame(() => {
        const content = contentBufferRef.current;
        contentBufferRef.current = '';
        lastUpdateTimeRef.current = Date.now();
        pendingUpdateRef.current = false;
        
        // Call the update callback with buffered content
        onUpdate(content);
      });
    }
  }, [config]);
  
  /**
   * Force flush any buffered content
   */
  const flushBuffer = useCallback((onUpdate: (content: string) => void) => {
    if (contentBufferRef.current) {
      const content = contentBufferRef.current;
      contentBufferRef.current = '';
      onUpdate(content);
    }
    
    // Cancel any pending updates
    if (updateRAFRef.current) {
      cancelAnimationFrame(updateRAFRef.current);
      updateRAFRef.current = null;
    }
    pendingUpdateRef.current = false;
  }, []);
  
  /**
   * Throttled scroll to end for streaming
   */
  const scrollToEnd = useCallback((
    scrollFn: () => void,
    animated: boolean = false
  ) => {
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTimeRef.current;
    
    // Throttle scroll updates
    if (timeSinceLastScroll < config.scrollThrottle!) {
      return;
    }
    
    lastScrollTimeRef.current = now;
    
    // Use RAF for smooth scrolling
    if (scrollRAFRef.current) {
      cancelAnimationFrame(scrollRAFRef.current);
    }
    
    scrollRAFRef.current = requestAnimationFrame(() => {
      scrollFn();
    });
  }, [config.scrollThrottle]);
  
  /**
   * Get optimized streaming handler for chat
   */
  const getStreamingHandler = useCallback((
    setMessage: (updater: (prev: string) => string) => void,
    scrollFn?: () => void
  ) => {
    return (partialContent: string) => {
      processStreamingContent(partialContent, (content) => {
        // Update message state
        setMessage(prev => prev + content);
        
        // Throttled scroll
        if (scrollFn) {
          scrollToEnd(scrollFn, false);
        }
      });
    };
  }, [processStreamingContent, scrollToEnd]);
  
  return {
    processStreamingContent,
    flushBuffer,
    scrollToEnd,
    getStreamingHandler,
  };
};