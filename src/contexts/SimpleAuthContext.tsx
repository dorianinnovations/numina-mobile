import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthManager, { AuthState, AuthResult } from '../services/authManager';
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
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isInitializing: true,
    user: null,
    token: null,
    lastValidation: 0
  });
  const [loading, setLoading] = useState(false);
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  
  const authManager = AuthManager.getInstance();

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authManager.subscribe((newState) => {
      console.log('[AuthContext] Auth state updated:', {
        isAuthenticated: newState.isAuthenticated,
        hasUser: !!newState.user,
        hasToken: !!newState.token,
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

    // Initialize authentication on mount
    initializeAuth();

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

  const initializeAuth = async () => {
    console.log('[AuthContext] Initializing authentication...');
    
    try {
      const result = await authManager.initializeAuth();
      
      if (result.success) {
        console.log('[AuthContext] Authentication initialized successfully');
      } else {
        console.log('[AuthContext] No valid authentication found:', result.error);
      }
    } catch (error) {
      console.error('[AuthContext] Authentication initialization failed:', error);
    }
  };

  // Login method
  const login = async (credentials: { email: string; password: string }): Promise<AuthResult> => {
    setLoading(true);
    console.log('[AuthContext] Login attempt for:', credentials.email);
    
    try {
      const result = await authManager.login(credentials);
      
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
      const result = await authManager.signUp(credentials);
      
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
      await authManager.logout();
      console.log('[AuthContext] Logout completed');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current user ID
  const getCurrentUserId = (): string | null => {
    return authManager.getCurrentUserId();
  };

  // Get current token
  const getCurrentToken = (): string | null => {
    return authManager.getCurrentToken();
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
    authToken: authState.token,
    
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