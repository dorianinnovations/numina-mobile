import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import ApiService from '../services/api';
import SecureStorageService from '../services/secureStorage';
import { emotionalAnalyticsAPI } from '../services/emotionalAnalyticsAPI';
import { offlineEmotionStorage } from '../services/offlineEmotionStorage';

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
  const [isSyncing, setIsSyncing] = useState(false); // Add sync lock
  const [lastSyncTime, setLastSyncTime] = useState<number>(0); // Add sync cooldown

  // Initialize authentication state on app startup
  useEffect(() => {
    initializeAuth();
  }, []);
  
  // Set up network monitoring and sync
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setSyncStatus(prev => ({ ...prev, isOnline: state.isConnected || false }));
      
      // Auto-sync when coming back online with cooldown
      if (state.isConnected && isAuthenticated && userData?.id && !isSyncing) {
        const now = Date.now();
        const timeSinceLastSync = now - lastSyncTime;
        const SYNC_COOLDOWN = 30000; // 30 seconds cooldown
        
        if (timeSinceLastSync > SYNC_COOLDOWN) {
          console.log('[AuthContext] Network reconnected, triggering sync after cooldown');
          syncUserData();
        } else {
          console.log('[AuthContext] Skipping sync - cooldown period active');
        }
      }
    });
    
    return () => unsubscribe();
  }, [isAuthenticated, userData?.id, isSyncing, lastSyncTime]);

  const initializeAuth = async () => {
    setIsInitializing(true);

    try {
      // Check if a valid session exists
      const hasSession = await SecureStorageService.hasValidSession();
      console.log('[AuthContext] Checking session on init, hasSession:', hasSession);
      
      if (hasSession) {
        console.log('[AuthContext] Valid session found, validating token...');
        
        // Validate token with server
        const validation = await ApiService.validateToken();
        
        if (validation.success && validation.data) {
          console.log('[AuthContext] Token validation successful');
          setIsAuthenticated(true);
          setUserData(validation.data);
          
          // Update stored user data
          await SecureStorageService.setUserData(validation.data);
        } else {
          console.log('[AuthContext] Token validation failed, clearing auth data');
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
    console.log('[AuthContext] Clearing auth data for user:', userData?.email);
    // Clear emotional analytics data for user isolation
    if (userData?.id) {
      await offlineEmotionStorage.clearUserData(userData.id);
    }
    
    await SecureStorageService.clearUserData(userData?.id);
    setIsAuthenticated(false);
    setUserData(null);
    setSyncStatus(defaultSyncStatus);
    console.log('[AuthContext] Auth data cleared');
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
        console.log('[AuthContext] Storing token for user:', user.email);
        await SecureStorageService.setToken(token);
        console.log('[AuthContext] Token stored successfully');
        await SecureStorageService.setUserData(user);
        console.log('[AuthContext] User data stored successfully');
        
        // Update state
        setIsAuthenticated(true);
        setUserData(user);
        
        // Initialize sync status with user isolation
        setSyncStatus({
          ...defaultSyncStatus,
          lastSyncTime: new Date().toISOString(),
        });
        
        // Verify token is accessible before sync
        const storedToken = await SecureStorageService.getToken();
        console.log('[AuthContext] Token verification after login:', storedToken ? 'Token accessible' : 'Token NOT accessible');
        
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
        console.log('[AuthContext] Storing token for user:', user.email);
        await SecureStorageService.setToken(token);
        console.log('[AuthContext] Token stored successfully');
        await SecureStorageService.setUserData(user);
        console.log('[AuthContext] User data stored successfully');
        
        // Update state
        setIsAuthenticated(true);
        setUserData(user);
        
        // Initialize sync status with user isolation
        setSyncStatus({
          ...defaultSyncStatus,
          lastSyncTime: new Date().toISOString(),
        });
        
        // Verify token is accessible before sync
        const storedToken = await SecureStorageService.getToken();
        console.log('[AuthContext] Token verification after login:', storedToken ? 'Token accessible' : 'Token NOT accessible');
        
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
    
    console.log('[AuthContext] checkAuthStatus called - validating token...');
    
    try {
      const validation = await ApiService.validateToken();
      console.log('[AuthContext] Token validation result:', validation);
      
      if (!validation.success) {
        console.log('[AuthContext] Token validation failed, logging out');
        await logout();
      } else {
        console.log('[AuthContext] Token validation successful');
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
    console.log('[AuthContext] syncUserData called:', { isAuthenticated, userId: userData?.id, isSyncing });
    
    // Prevent concurrent sync calls
    if (isSyncing) {
      console.log('[AuthContext] Sync already in progress, skipping');
      return;
    }
    
    if (!isAuthenticated || !userData?.id) {
      console.log('[AuthContext] Skipping sync - not authenticated or no user ID');
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
    
    try {
      // Check token before sync
      const token = await SecureStorageService.getToken();
      console.log('[AuthContext] Token available for sync:', token ? 'Yes' : 'No');
      
      // Check if there's actually data to sync
      const unsyncedEmotions = await emotionalAnalyticsAPI.syncOfflineData();
      
      // Update last sync time
      setLastSyncTime(Date.now());
      
      console.log('[AuthContext] Sync completed:', unsyncedEmotions);
      setSyncStatus(prev => ({
        ...prev,
        syncInProgress: false,
        lastSyncTime: new Date().toISOString(),
        pendingChanges: unsyncedEmotions.failed, // Track failed syncs
        isOnline: true,
      }));
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        syncInProgress: false,
        isOnline: false,
      }));
    } finally {
      setIsSyncing(false);
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