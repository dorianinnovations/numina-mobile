import Constants from 'expo-constants';

interface EnvironmentConfig {
  API_BASE_URL: string;
  STRIPE_PUBLISHABLE_KEY: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  ENABLE_LOGGING: boolean;
  SSL_PINNING_ENABLED: boolean;
  BIOMETRIC_AUTH_ENABLED: boolean;
  WALLET_FEATURES_ENABLED: boolean;
}

const isDev = __DEV__;
const releaseChannel = Constants.expoConfig?.updates?.requestHeaders?.['expo-channel-name'] || 'development';

const getEnvironmentConfig = (): EnvironmentConfig => {
  console.log('🔧 Environment detection:', { isDev, releaseChannel, __DEV__ });
  
  // Always use production server - mobile app connects via tunnel
  console.log('📱 Using PRODUCTION server (mobile app via tunnel)');
  console.log('📡 API_BASE_URL: https://server-a7od.onrender.com');
  return {
    API_BASE_URL: 'https://server-a7od.onrender.com',
    STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    ENVIRONMENT: 'development',
    ENABLE_LOGGING: true,
    SSL_PINNING_ENABLED: false,
    BIOMETRIC_AUTH_ENABLED: false,
    WALLET_FEATURES_ENABLED: true,
  };
};

export const ENV = getEnvironmentConfig();

// Security headers for production
export const SECURITY_HEADERS = {
  'X-API-Key': process.env.EXPO_PUBLIC_API_KEY || '',
  'X-App-Version': Constants.expoConfig?.version || '1.0.0',
  'X-Platform': 'mobile',
};

// Validate required environment variables
export const validateEnvironment = (): boolean => {
  const requiredVars = [
    ENV.API_BASE_URL,
    ENV.STRIPE_PUBLISHABLE_KEY,
  ];

  const missing = requiredVars.filter(variable => !variable || variable === '');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return false;
  }

  return true;
};

// Feature flags
export const FEATURE_FLAGS = {
  WALLET_ENABLED: ENV.WALLET_FEATURES_ENABLED,
  BIOMETRIC_AUTH: ENV.BIOMETRIC_AUTH_ENABLED,
  SSL_PINNING: ENV.SSL_PINNING_ENABLED,
  CRASH_REPORTING: ENV.ENVIRONMENT === 'production',
  ANALYTICS: ENV.ENVIRONMENT !== 'development',
};

export default ENV;