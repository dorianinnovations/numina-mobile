import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ApiService, { UserData, LoginCredentials, SignUpCredentials } from '../services/api';
import SecureStorageService from '../services/secureStorage';

/**
 * Simplified Authentication Context for React Native
 * Focuses on core authentication without complex sync logic
 */

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  loading: boolean;
  userData: UserData | null;
  isInitializing: boolean;

  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Session management
  checkAuthStatus: () => Promise<void>;
  refreshUserData: () => Promise<void>;
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
  // Simplified state management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication state on app startup
  useEffect(() => {
    initializeAuth();
  }, []);

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
        console.log('[AuthContext] No valid session found');
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
    
    // Don't clear if we're in the middle of a login process
    if (loading) {
      console.log('[AuthContext] Skipping clearAuthData - login in progress');
      return;
    }
    
    await SecureStorageService.clearUserData(userData?.id);
    setIsAuthenticated(false);
    setUserData(null);
    console.log('[AuthContext] Auth data cleared');
  };

  // Login method - simplified
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
        
        console.log('[AuthContext] Login successful');
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

  // Sign up method - simplified
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
        
        console.log('[AuthContext] Sign up successful');
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

  // Logout method - simplified
  const logout = async () => {
    setLoading(true);
    
    try {
      console.log('[AuthContext] Logging out user:', userData?.email);
      await clearAuthData();
      console.log('[AuthContext] Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear data even if there's an error
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

  const value: AuthContextType = {
    // State
    isAuthenticated,
    loading,
    userData,
    isInitializing,
    
    // Methods
    login,
    signUp,
    logout,
    checkAuthStatus,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;