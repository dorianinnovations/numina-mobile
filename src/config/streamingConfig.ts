/**
 * Configuration for simulated streaming effects in the app
 */

export const StreamingConfig = {
  // Sandbox node streaming configuration
  sandbox: {
    // Duration to show skeleton loader before streaming starts
    skeletonDuration: 500, // 0.5 seconds for faster transition
    
    // Delay between each node appearing
    nodeStreamDelay: 100, // 100ms for snappier streaming
    
    // Whether to enable streaming effect
    enabled: true,
    
    // Maximum nodes to stream at once (rest appear instantly)
    maxStreamedNodes: 10,
  },
  
  // Individual node content streaming (in NodeExplorationScreen)
  nodeContent: {
    // Characters per interval
    charsPerInterval: 1,
    
    // Interval between characters (ms)
    streamInterval: 25,
    
    // Whether to enable content streaming
    enabled: true,
  },
};