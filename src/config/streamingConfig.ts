/**
 * Configuration for simulated streaming effects in the app
 */

export const StreamingConfig = {
  // Sandbox node streaming configuration
  sandbox: {
    // Duration to show skeleton loader before streaming starts
    skeletonDuration: 0, // No skeleton - instant display
    
    // Delay between each node appearing
    nodeStreamDelay: 25, // 25ms for near-instant streaming
    
    // Whether to enable streaming effect
    enabled: true,
    
    // Maximum nodes to stream at once (rest appear instantly)
    maxStreamedNodes: 50, // Show most nodes instantly
  },
  
  // Individual NodeBall content streaming (in NodeBallOpenedModal)
  nodeContent: {
    // Characters per interval
    charsPerInterval: 1,
    
    // Interval between characters (ms)
    streamInterval: 25,
    
    // Whether to enable content streaming
    enabled: true,
  },
};