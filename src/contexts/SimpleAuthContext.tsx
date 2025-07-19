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
  isAuthenticated: boolean;
  loading: boolean;
  userData: User | null;
  isInitializing: boolean;
  user: User | null;
  authToken: string | null;

  subscriptionData: SubscriptionData | null;
  isSubscriptionLoading: boolean;
  hasActiveSubscription: boolean;

  // Authentication methods
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: { email: string; password: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  getCurrentUserId: () => string | null;
  getCurrentToken: () => string | null;
  
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
  const [isInitializing, setIsInitializing] = useState(false); // Start as false to prevent race condition
  
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  
  const cloudAuth = CloudAuth.getInstance();

  useEffect(() => {
    console.log('🔐 AUTH CONTEXT: Initializing auth subscription');
    
    const unsubscribe = cloudAuth.subscribe((newState) => {
      console.log('🔐 AUTH CONTEXT: Cloud auth state updated:', {
        wasAuthenticated: authState.isAuthenticated,
        nowAuthenticated: newState.isAuthenticated,
        hasUser: !!newState.user,
        hasToken: !!newState.token,
        stateChanged: authState.isAuthenticated !== newState.isAuthenticated
      });
      setAuthState(newState);

      if (newState.isAuthenticated && !authState.isAuthenticated) {
        console.log('🔐 AUTH CONTEXT: User logged in, loading subscription data');
        loadSubscriptionData();
      }
      
      if (!newState.isAuthenticated && authState.isAuthenticated) {
        console.log('🔐 AUTH CONTEXT: User logged out, clearing subscription data');
        setSubscriptionData(null);
      }
    });

    console.log('🔐 AUTH CONTEXT: Cloud auth ready - simple initialization, no race conditions');
    return unsubscribe;
  }, []);

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

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    console.log('[AuthContext] Login attempt for:', credentials.email, 'setting loading=true');
    
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
      console.log('[AuthContext] Login complete, setting loading=false');
      setLoading(false);
    }
  };

  const signUp = async (credentials: { email: string; password: string; confirmPassword: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    console.log('[AuthContext] Sign up attempt for:', credentials.email);
    
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

  const logout = (): void => {
    console.log('[AuthContext] Logout initiated');
    cloudAuth.logout();
    console.log('🔐 AUTH CONTEXT: Cloud logout completed');
  };

  const getCurrentUserId = (): string | null => {
    return cloudAuth.getCurrentUserId();
  };

  const getCurrentToken = (): string | null => {
    return cloudAuth.getToken();
  };

  const refreshSubscription = async (): Promise<void> => {
    await loadSubscriptionData();
  };

  const hasActiveSubscription = subscriptionData?.numinaTrace?.hasActiveSubscription || false;

  const value: AuthContextType = {
    isAuthenticated: authState.isAuthenticated,
    loading,
    userData: authState.user,
    isInitializing,
    user: authState.user,
    authToken: authState.token,
    
    subscriptionData,
    isSubscriptionLoading,
    hasActiveSubscription,
    
    login,
    signUp,
    logout,
    getCurrentUserId,
    getCurrentToken,
    
    refreshSubscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;