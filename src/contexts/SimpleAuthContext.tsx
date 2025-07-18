import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import CloudAuth, { AuthState, User } from '../services/cloudAuth';
import ApiService from '../services/api';

/**
 * Simplified Authentication Context
 * Uses CloudAuth - simple, cloud-only authentication
 * No local storage, no complexity, just clean auth
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
  userData: User | null;
  isInitializing: boolean;
  user: User | null;
  authToken: string | null;

  // Subscription state
  subscriptionData: SubscriptionData | null;
  isSubscriptionLoading: boolean;
  hasActiveSubscription: boolean;

  // Authentication methods
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: { email: string; password: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
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
    user: null,
    token: null
  });
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  
  const cloudAuth = CloudAuth.getInstance();

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = cloudAuth.subscribe((newState) => {
      console.log('🔐 AUTH CONTEXT: Cloud auth state updated:', {
        isAuthenticated: newState.isAuthenticated,
        hasUser: !!newState.user,
        hasToken: !!newState.token
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

    // Simple initialization - no complex session restoration
    setIsInitializing(false);
    console.log('🔐 AUTH CONTEXT: Cloud auth ready - no session restoration');

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

  // No complex initialization needed for cloud auth

  // Login method
  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    console.log('[AuthContext] Login attempt for:', credentials.email);
    
    try {
      const result = await cloudAuth.login(credentials.email, credentials.password);
      
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
  const signUp = async (credentials: { email: string; password: string; confirmPassword: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    console.log('[AuthContext] Sign up attempt for:', credentials.email);
    
    // Validate passwords match
    if (credentials.password !== credentials.confirmPassword) {
      setLoading(false);
      return { success: false, error: 'Passwords don\'t match! Please try again 🔐' };
    }
    
    try {
      const result = await cloudAuth.signup(credentials.email, credentials.password);
      
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
  const logout = (): void => {
    console.log('[AuthContext] Logout initiated');
    cloudAuth.logout();
    console.log('🔐 AUTH CONTEXT: Cloud logout completed');
  };

  // Get current user ID
  const getCurrentUserId = (): string | null => {
    return cloudAuth.getCurrentUserId();
  };

  // Get current token
  const getCurrentToken = (): string | null => {
    return cloudAuth.getToken();
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
    isInitializing,
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