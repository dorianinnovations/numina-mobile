import Constants from 'expo-constants';

interface EnvironmentConfig {
  API_BASE_URL: string;
  STRIPE_PUBLISHABLE_KEY: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  ENABLE_LOGGING: boolean;
  SSL_PINNING_ENABLED: boolean;
  BIOMETRIC_AUTH_ENABLED: boolean;
  WALLET_FEATURES_ENABLED: boolean;
  DEV_AUTH_BYPASS: boolean;
}

const isDev = __DEV__;
const releaseChannel = Constants.expoConfig?.updates?.requestHeaders?.['expo-channel-name'] || 'development';

const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    API_BASE_URL: 'https://server-a7od.onrender.com',
    STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    ENVIRONMENT: 'development',
    ENABLE_LOGGING: true,
    SSL_PINNING_ENABLED: false,
    BIOMETRIC_AUTH_ENABLED: false,
    WALLET_FEATURES_ENABLED: true,
    DEV_AUTH_BYPASS: false, // TEMP DISABLED - isDev && process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true',
  };
};

export const ENV = getEnvironmentConfig();

export const SECURITY_HEADERS = {
  'X-API-Key': process.env.EXPO_PUBLIC_API_KEY || '',
  'X-App-Version': Constants.expoConfig?.version || '1.0.0',
  'X-Platform': 'mobile',
};

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

export const FEATURE_FLAGS = {
  WALLET_ENABLED: ENV.WALLET_FEATURES_ENABLED,
  BIOMETRIC_AUTH: ENV.BIOMETRIC_AUTH_ENABLED,
  SSL_PINNING: ENV.SSL_PINNING_ENABLED,
  CRASH_REPORTING: ENV.ENVIRONMENT === 'production',
  ANALYTICS: ENV.ENVIRONMENT !== 'development',
  DEV_AUTH_BYPASS: false, // TEMP DISABLED - ENV.DEV_AUTH_BYPASS,
};

export default ENV;