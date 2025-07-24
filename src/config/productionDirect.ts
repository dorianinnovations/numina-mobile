/**
 * PRODUCTION-DIRECT CONFIG
 * 
 * This eliminates dev/prod complexity by using production for everything.
 * You iterate directly on production like a true startup.
 */

export const PRODUCTION_DIRECT_CONFIG = {
  // Always use production server
  API_BASE_URL: 'https://server-a7od.onrender.com/api',
  
  // Production WebSocket (Socket.io handles protocol switching)
  WS_URL: 'https://server-a7od.onrender.com',
  
  // Production mode always
  IS_PRODUCTION: true,
  
  // Direct deployment settings
  DEPLOYMENT: {
    autoUpdate: true,
    fastRefresh: true,
    hotReload: true,
    instantDeploy: true
  },
  
  // Real-time testing
  TESTING: {
    enableLiveTesting: true,
    realTimeUpdates: true,
    productionData: true,
    noMockData: true
  }
};

// Override environment detection
export const getConfig = () => {
  return PRODUCTION_DIRECT_CONFIG;
};

export default PRODUCTION_DIRECT_CONFIG;