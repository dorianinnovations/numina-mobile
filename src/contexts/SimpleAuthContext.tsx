import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { log } from '../utils/logger';
import CloudAuth, { AuthState, User } from '../services/cloudAuth';
import ApiService from '../services/api';
import { ExperienceLevelService } from '../services/experienceLevelService';
import { UserOnboardingService } from '../services/userOnboardingService';
import { FEATURE_FLAGS } from '../config/environment';

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
  refreshUserTier: () => Promise<void>;

  // Dev features
  toggleDevAuthBypass?: () => void;
  isDevMode: boolean;
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
  
  // Use ref to track previous auth state and prevent race conditions
  const prevAuthStateRef = useRef<AuthState>(authState);
  const isMountedRef = useRef(true);
  
  const cloudAuth = CloudAuth.getInstance();

  useEffect(() => {
    // log.debug('Initializing auth subscription', null, 'AuthContext');
    
    const unsubscribe = cloudAuth.subscribe((newState) => {
      const wasAuthenticated = prevAuthStateRef.current.isAuthenticated;
      const nowAuthenticated = newState.isAuthenticated;
      
      // log.debug('Cloud auth state updated', {
      //   wasAuthenticated,
      //   nowAuthenticated,
      //   hasUser: !!newState.user,
      //   hasToken: !!newState.token,
      //   stateChanged: wasAuthenticated !== nowAuthenticated
      // }, 'AuthContext');
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setAuthState(newState);
        
        // Use previous state from ref to avoid race conditions
        if (nowAuthenticated && !wasAuthenticated) {
          // log.info('User logged in, loading subscription and tier data', null, 'AuthContext');
          loadSubscriptionData();
          loadUserTierInfo();
        }
        
        if (!nowAuthenticated && wasAuthenticated) {
          // log.info('User logged out, clearing subscription data', null, 'AuthContext');
          setSubscriptionData(null);
        }
        
        // Update the ref with current state
        prevAuthStateRef.current = newState;
      }
    });

    // log.debug('Cloud auth ready - simple initialization, no race conditions', null, 'AuthContext');
    
    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsSubscriptionLoading(true);
      const response = await ApiService.getSubscriptionStatus();
      if (response.success && response.data) {
        setSubscriptionData(response.data);
      } else {
        // console.error('[AuthContext] Failed to load subscription:', response.error);
      }
    } catch (error) {
      // console.error('[AuthContext] Error loading subscription:', error);
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const loadUserTierInfo = async () => {
    try {
      const response = await ApiService.getUserTierInfo();
      if (response.success && response.data) {
        // Update the user state with tier info
        const currentState = cloudAuth.getState();
        if (currentState.user) {
          const updatedUser = {
            ...currentState.user,
            tierInfo: {
              tier: response.data.tier,
              dailyUsage: response.data.dailyUsage,
              dailyLimit: response.data.dailyLimit,
              features: response.data.features || {}
            }
          };
          // Update the auth state directly since cloudAuth owns the user state
          cloudAuth.updateUser(updatedUser);
        }
      } else {
        // console.error('[AuthContext] Failed to load tier info:', response.error);
      }
    } catch (error) {
      // console.error('[AuthContext] Error loading tier info:', error);
    }
  };

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const result = await cloudAuth.login(credentials.email, credentials.password);
      
      if (result.success) {
        // For existing users logging in, mark onboarding as completed if they have experience level
        const currentUser = cloudAuth.getCurrentUser();
        if (currentUser?.id) {
          const hasExperienceLevel = await ExperienceLevelService.hasSetExperienceLevel();
          if (hasExperienceLevel) {
            await UserOnboardingService.markOnboardingCompleted(currentUser.id);
          }
        }
      } else {
        // console.error('[AuthContext] Login failed:', result.error);
      }
      
      return result;
    } catch (error) {
      // console.error('[AuthContext] Login error:', error);
      return { success: false, error: `Login failed: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: { email: string; password: string; confirmPassword: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    if (credentials.password !== credentials.confirmPassword) {
      setLoading(false);
      return { success: false, error: 'Passwords don\'t match! Please try again 🔐' };
    }
    
    try {
      const result = await cloudAuth.signup(credentials.email, credentials.password);
      
      if (result.success) {
        const currentUser = cloudAuth.getCurrentUser();
        if (currentUser?.id) {
          // Mark user as new signup for onboarding flow
          await UserOnboardingService.markSignupCompleted(currentUser.id);
          
          // MANDATORY: Clear any existing experience level for new users
          await ExperienceLevelService.clearExperienceLevel();
          // console.log('🔄 AUTH CONTEXT: Experience level cleared for new user - three-tier system now mandatory');
        }
      } else {
        // console.error('[AuthContext] Sign up failed:', result.error);
      }
      
      return result;
    } catch (error) {
      // console.error('[AuthContext] Sign up error:', error);
      return { success: false, error: `Sign up failed: ${error}` };
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    cloudAuth.logout();
    // console.log('🔐 AUTH CONTEXT: Cloud logout completed');
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

  const refreshUserTier = async (): Promise<void> => {
    await loadUserTierInfo();
  };

  const toggleDevAuthBypass = (): void => {
    if (FEATURE_FLAGS.DEV_AUTH_BYPASS) {
      cloudAuth.toggleDevAuthBypass();
    } else {
      // console.warn('🔧 DEV AUTH BYPASS: Not enabled in environment config');
    }
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
    refreshUserTier,

    // Dev features
    toggleDevAuthBypass: FEATURE_FLAGS.DEV_AUTH_BYPASS ? toggleDevAuthBypass : undefined,
    isDevMode: FEATURE_FLAGS.DEV_AUTH_BYPASS,
  };

  return (
    <AuthContext.Provider value={value}>
      {React.Children.toArray(children)}
    </AuthContext.Provider>
  );
};

export default AuthContext;