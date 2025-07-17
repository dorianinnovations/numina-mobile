import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SecureAuthManager, { SecureAuthState, AuthResult } from '../services/secureAuthManager';
import ApiService from '../services/api';

/**
 * Simplified Authentication Context
 * Uses AuthManager as single source of truth
 * Eliminates race conditions and token clearing issues
 */

interface SubscriptionData {
  numinaTrace: {
    isActive: boolean;
    plan: string | null;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    nextBillingDate: string;
    hasActiveSubscription: boolean;
  };
}

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  loading: boolean;
  userData: any | null;
  isInitializing: boolean;
  user: any | null;
  authToken: string | null;

  // Subscription state
  subscriptionData: SubscriptionData | null;
  isSubscriptionLoading: boolean;
  hasActiveSubscription: boolean;

  // Authentication methods
  login: (credentials: { email: string; password: string }) => Promise<AuthResult>;
  signUp: (credentials: { email: string; password: string; confirmPassword: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  
  // Utility methods
  getCurrentUserId: () => string | null;
  getCurrentToken: () => string | null;
  
  // Subscription methods
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<SecureAuthState>({
    isAuthenticated: false,
    isInitializing: true,
    user: null,
    sessionToken: null,
    sessionExpiry: null,
    lastValidation: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  
  const secureAuthManager = SecureAuthManager.getInstance();

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = secureAuthManager.subscribe((newState) => {
      console.log('🔐 AUTH CONTEXT: Secure auth state updated:', {
        isAuthenticated: newState.isAuthenticated,
        hasUser: !!newState.user,
        hasSessionToken: !!newState.sessionToken,
        isInitializing: newState.isInitializing
      });
      setAuthState(newState);

      // Load subscription data when user becomes authenticated
      if (newState.isAuthenticated && !authState.isAuthenticated) {
        loadSubscriptionData();
      }
      
      // Clear subscription data when user logs out
      if (!newState.isAuthenticated && authState.isAuthenticated) {
        setSubscriptionData(null);
      }
    });

    // Initialize secure authentication on mount
    initializeSecureAuth();

    return unsubscribe;
  }, []);

  // Load subscription data
  const loadSubscriptionData = async () => {
    try {
      setIsSubscriptionLoading(true);
      const response = await ApiService.getSubscriptionStatus();
      if (response.success && response.data) {
        setSubscriptionData(response.data);
      } else {
        console.error('[AuthContext] Failed to load subscription:', response.error);
      }
    } catch (error) {
      console.error('[AuthContext] Error loading subscription:', error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const initializeSecureAuth = async () => {
    console.log('🔐 AUTH CONTEXT: Initializing secure authentication...');
    
    try {
      const result = await secureAuthManager.initializeAuth();
      
      if (result.success) {
        console.log('🔐 AUTH CONTEXT: Secure authentication initialized successfully');
      } else {
        console.log('🔐 AUTH CONTEXT: Fresh session - user must login');
      }
    } catch (error) {
      console.error('🔐 AUTH CONTEXT: Secure authentication initialization failed:', error);
    }
  };

  // Login method
  const login = async (credentials: { email: string; password: string }): Promise<AuthResult> => {
    setLoading(true);
    console.log('[AuthContext] Login attempt for:', credentials.email);
    
    try {
      const result = await secureAuthManager.login(credentials);
      
      if (result.success) {
        console.log('[AuthContext] Login successful');
      } else {
        console.error('[AuthContext] Login failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return { success: false, error: `Login failed: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  // Sign up method
  const signUp = async (credentials: { email: string; password: string; confirmPassword: string }): Promise<AuthResult> => {
    setLoading(true);
    console.log('[AuthContext] Sign up attempt for:', credentials.email);
    
    try {
      const result = await secureAuthManager.signUp(credentials);
      
      if (result.success) {
        console.log('[AuthContext] Sign up successful');
      } else {
        console.error('[AuthContext] Sign up failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('[AuthContext] Sign up error:', error);
      return { success: false, error: `Sign up failed: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  // Logout method
  const logout = async (): Promise<void> => {
    setLoading(true);
    console.log('[AuthContext] Logout initiated');
    
    try {
      await secureAuthManager.logout();
      console.log('🔐 AUTH CONTEXT: Secure logout completed');
    } catch (error) {
      console.error('🔐 AUTH CONTEXT: Secure logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current user ID (secure)
  const getCurrentUserId = (): string | null => {
    return secureAuthManager.getCurrentUserId();
  };

  // Get current session token (secure)
  const getCurrentToken = (): string | null => {
    return secureAuthManager.getCurrentToken();
  };

  // Refresh subscription data
  const refreshSubscription = async (): Promise<void> => {
    await loadSubscriptionData();
  };

  // Computed subscription status
  const hasActiveSubscription = subscriptionData?.numinaTrace?.hasActiveSubscription || false;

  const value: AuthContextType = {
    // Authentication state
    isAuthenticated: authState.isAuthenticated,
    loading,
    userData: authState.user,
    isInitializing: authState.isInitializing,
    user: authState.user,
    authToken: authState.sessionToken,
    
    // Subscription state
    subscriptionData,
    isSubscriptionLoading,
    hasActiveSubscription,
    
    // Authentication methods
    login,
    signUp,
    logout,
    getCurrentUserId,
    getCurrentToken,
    
    // Subscription methods
    refreshSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;