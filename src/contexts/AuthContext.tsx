import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import ApiService, { UserData, LoginCredentials, SignUpCredentials } from '../services/api';
import SecureStorageService from '../services/secureStorage';
import EmotionalAnalyticsAPI from '../services/emotionalAnalyticsAPI';
import NetInfo from '@react-native-community/netinfo';

/**
 * Authentication Context for React Native
 * Maintains same interface as web app AuthContext
 * Handles login, signup, session persistence, and user state
 */

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingChanges: number;
  syncInProgress: boolean;
}

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  loading: boolean;
  userData: UserData | null;
  syncStatus: SyncStatus;
  isInitializing: boolean;

  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Session management
  checkAuthStatus: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  // Sync methods (for future offline functionality)
  syncUserData: () => Promise<void>;
}

const defaultSyncStatus: SyncStatus = {
  isOnline: true,
  lastSyncTime: null,
  pendingChanges: 0,
  syncInProgress: false,
};

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
  // State management - same as web app
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(defaultSyncStatus);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication state on app startup
  useEffect(() => {
    initializeAuth();
  }, []);
  
  // Set up network monitoring and sync
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setSyncStatus(prev => ({ ...prev, isOnline: state.isConnected || false }));
      
      // Auto-sync when coming back online
      if (state.isConnected && isAuthenticated && userData?.id) {
        syncUserData();
      }
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, userData?.id]);

  const initializeAuth = async () => {
    setIsInitializing(true);

    try {
      // Check if a valid session exists
      const hasSession = await SecureStorageService.hasValidSession();
      
      if (hasSession) {
        
        // Validate token with server
        const validation = await ApiService.validateToken();
        
        if (validation.success && validation.data) {
          setIsAuthenticated(true);
          setUserData(validation.data);
          
          // Update stored user data
          await SecureStorageService.setUserData(validation.data);
        } else {
          await clearAuthData();
        }
      } else {
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearAuthData();
    } finally {
      setIsInitializing(false);
    }
  };

  const clearAuthData = async () => {
    // Clear emotional analytics data for user isolation
    if (userData?.id) {
      await EmotionalAnalyticsAPI.clearUserData(userData.id);
    }
    
    await SecureStorageService.clearUserData(userData?.id);
    setIsAuthenticated(false);
    setUserData(null);
    setSyncStatus(defaultSyncStatus);
  };

  // Login method - same logic as web app
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    
    try {
      
      const response = await ApiService.login(credentials);
      
      
      if (response.success && response.data) {
        // Handle the actual server response structure
        const token = response.data.token;
        const user = response.data.data?.user;
        
        
        // Validate that both token and user data are present
        if (!token) {
          throw new Error('No authentication token received');
        }
        
        if (!user || !user.email) {
          throw new Error('Invalid user data received');
        }
        
        // Store token and user data securely
        await SecureStorageService.setToken(token);
        await SecureStorageService.setUserData(user);
        
        // Update state
        setIsAuthenticated(true);
        setUserData(user);
        
        // Initialize sync status with user isolation
        setSyncStatus({
          ...defaultSyncStatus,
          lastSyncTime: new Date().toISOString(),
        });
        
        // Start background sync for emotional data
        setTimeout(() => {
          syncUserData();
        }, 2000); // Delay to allow UI to settle
        
        return { success: true };
      } else {
        console.error('Login failed:', response.error);
        return { 
          success: false, 
          error: response.error || 'Login failed' 
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error occurred' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign up method - same logic as web app
  const signUp = async (credentials: SignUpCredentials) => {
    setLoading(true);
    
    try {
      
      const response = await ApiService.signUp(credentials);
      
      if (response.success && response.data) {
        // Handle the actual server response structure
        const token = response.data.token;
        const user = response.data.data?.user;
        
        
        // Validate that both token and user data are present
        if (!token) {
          throw new Error('No authentication token received');
        }
        
        if (!user || !user.email) {
          throw new Error('Invalid user data received');
        }
        
        // Store token and user data securely
        await SecureStorageService.setToken(token);
        await SecureStorageService.setUserData(user);
        
        // Update state
        setIsAuthenticated(true);
        setUserData(user);
        
        // Initialize sync status with user isolation
        setSyncStatus({
          ...defaultSyncStatus,
          lastSyncTime: new Date().toISOString(),
        });
        
        // Start background sync for emotional data
        setTimeout(() => {
          syncUserData();
        }, 2000); // Delay to allow UI to settle
        
        return { success: true };
      } else {
        console.error('Signup failed:', response.error);
        return { 
          success: false, 
          error: response.error || 'Signup failed' 
        };
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error occurred' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout method - same logic as web app
  const logout = async () => {
    setLoading(true);
    
    try {
      
      // Sync any pending data before logout - exactly like web app
      if (userData?.id) {
        try {
          await syncUserData();
        } catch (syncError) {
        }
      }
      
      // Clear all stored data
      await clearAuthData();
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear data even if sync fails
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      const validation = await ApiService.validateToken();
      
      if (!validation.success) {
        await logout();
      }
    } catch (error) {
      console.error('Auth status check error:', error);
    }
  };

  // Refresh user data from server
  const refreshUserData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await ApiService.getUserProfile();
      
      if (response.success && response.data) {
        setUserData(response.data);
        await SecureStorageService.setUserData(response.data);
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
    }
  };

  // Sync user data - exactly like web app with offline-first approach
  const syncUserData = async () => {
    if (!isAuthenticated || !userData?.id) return;
    
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
    
    try {
      // Sync emotional data in background
      const syncResult = await EmotionalAnalyticsAPI.syncPendingEmotions(userData.id);
      
      
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSyncTime: new Date().toISOString(),
        pendingChanges: syncResult.failed, // Track failed syncs
        isOnline: true,
      }));
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        syncInProgress: false,
        isOnline: false,
      }));
    }
  };

  const value: AuthContextType = {
    // State
    isAuthenticated,
    loading,
    userData,
    syncStatus,
    isInitializing,
    
    // Methods
    login,
    signUp,
    logout,
    checkAuthStatus,
    refreshUserData,
    syncUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;