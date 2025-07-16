import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from './api';

/**
 * Centralized Authentication Manager
 * Single source of truth for authentication state
 * Prevents race conditions and token clearing issues
 */

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: any | null;
  token: string | null;
  lastValidation: number;
}

interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

class AuthManager {
  private static instance: AuthManager;
  private authState: AuthState = {
    isAuthenticated: false,
    isInitializing: false,
    user: null,
    token: null,
    lastValidation: 0
  };
  private authPromise: Promise<AuthResult> | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  // Singleton pattern
  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of state change
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  // Get current auth state
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.authState.user?.id || null;
  }

  // Get current token
  getCurrentToken(): string | null {
    return this.authState.token;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token && !!this.authState.user;
  }

  // Initialize authentication on app startup
  async initializeAuth(): Promise<AuthResult> {
    // Return existing promise if already initializing
    if (this.authPromise) {
      return this.authPromise;
    }

    // Return cached result if already authenticated
    if (this.isAuthenticated() && (Date.now() - this.authState.lastValidation) < 60000) {
      return { success: true, user: this.authState.user };
    }

    console.log('[AuthManager] Initializing authentication...');
    this.authState.isInitializing = true;
    this.notifyListeners();

    this.authPromise = this.performAuthInitialization();
    const result = await this.authPromise;
    this.authPromise = null;

    return result;
  }

  private async performAuthInitialization(): Promise<AuthResult> {
    try {
      // Step 1: Check for stored token
      const storedToken = await AsyncStorage.getItem('numina_auth_token');
      if (!storedToken) {
        console.log('[AuthManager] No stored token found');
        this.setUnauthenticated();
        return { success: false, error: 'No stored token' };
      }

      console.log('[AuthManager] Found stored token, validating...');

      // Step 2: Validate token with server
      const response = await this.validateTokenWithServer(storedToken);
      if (!response.success) {
        console.log('[AuthManager] Token validation failed:', response.error);
        
        // Check if it's a network/timeout error - if so, work in offline mode
        const isNetworkIssue = response.error?.includes('timeout') || 
                              response.error?.includes('Network') ||
                              response.error?.includes('fetch');
        
        if (isNetworkIssue) {
          console.log('[AuthManager] Server unavailable - working in offline mode');
          // Try to get stored user data for offline mode
          const storedUser = await AsyncStorage.getItem('numina_user_data');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              await this.setAuthenticated(storedToken, userData);
              return { success: true, user: userData };
            } catch (parseError) {
              console.log('[AuthManager] Could not parse stored user data');
            }
          }
        }
        
        // For non-network errors (invalid token, etc), clear auth
        await this.clearStoredAuth();
        this.setUnauthenticated();
        return { success: false, error: response.error };
      }

      // Step 3: Set authenticated state
      console.log('[AuthManager] Token validation successful');
      await this.setAuthenticated(storedToken, response.user!);
      return { success: true, user: response.user };

    } catch (error) {
      console.error('[AuthManager] Auth initialization error:', error);
      await this.clearStoredAuth();
      this.setUnauthenticated();
      return { success: false, error: `Initialization failed: ${error}` };
    }
  }

  // Validate token with server
  private async validateTokenWithServer(token: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      // Set token temporarily for validation
      this.authState.token = token;
      
      const response = await ApiService.getUserProfile();
      if (response.success && response.data) {
        // Normalize user data (server sends _id, we need id)
        const user = {
          ...response.data,
          id: (response.data as any)._id || response.data.id,
        };
        return { success: true, user };
      } else {
        // Handle specific server errors gracefully
        const errorMsg = response.error || 'Profile fetch failed';
        console.log('[AuthManager] Profile validation failed:', errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      // Handle network timeouts gracefully - don't crash the app
      const isTimeout = error?.name === 'AbortError' || error?.message?.includes('timeout');
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('Network');
      
      if (isTimeout) {
        console.log('[AuthManager] Token validation timed out - server may be unavailable');
        return { success: false, error: 'Request timeout' };
      } else if (isNetworkError) {
        console.log('[AuthManager] Network error during token validation');
        return { success: false, error: 'Network error' };
      }
      
      console.log('[AuthManager] Unexpected validation error:', error);
      return { success: false, error: `Validation request failed: ${error?.message || error}` };
    }
  }

  // Login with credentials
  async login(credentials: { email: string; password: string }): Promise<AuthResult> {
    console.log('[AuthManager] Logging in user:', credentials.email);
    
    try {
      const response = await ApiService.login(credentials);
      
      if (response.success && response.data) {
        const token = response.data.token;
        const userData = response.data.data?.user;
        
        if (!token || !userData) {
          return { success: false, error: 'Invalid login response format' };
        }

        // Normalize user data
        const user = {
          ...userData,
          id: (userData as any)._id || userData.id,
        };

        // Store token and set authenticated state
        await AsyncStorage.setItem('numina_auth_token', token);
        await AsyncStorage.setItem('numina_current_user_id', user.id);
        await this.storeUserData(user);
        
        await this.setAuthenticated(token, user);
        
        // Clear other users' data while preserving current user
        await this.clearOtherUsersData(user.id);
        
        console.log('[AuthManager] Login successful');
        return { success: true, user };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('[AuthManager] Login error:', error);
      return { success: false, error: `Login request failed: ${error}` };
    }
  }

  // Sign up new user
  async signUp(credentials: { email: string; password: string; confirmPassword: string }): Promise<AuthResult> {
    console.log('[AuthManager] Signing up user:', credentials.email);
    
    try {
      const response = await ApiService.signUp(credentials);
      
      if (response.success && response.data) {
        const token = response.data.token;
        const userData = response.data.data?.user;
        
        if (!token || !userData) {
          return { success: false, error: 'Invalid signup response format' };
        }

        // Normalize user data
        const user = {
          ...userData,
          id: (userData as any)._id || userData.id,
        };

        // Store token and set authenticated state
        await AsyncStorage.setItem('numina_auth_token', token);
        await AsyncStorage.setItem('numina_current_user_id', user.id);
        await this.storeUserData(user);
        
        await this.setAuthenticated(token, user);
        
        // Clear other users' data (shouldn't be any for new user)
        await this.clearOtherUsersData(user.id);
        
        console.log('[AuthManager] Sign up successful');
        return { success: true, user };
      } else {
        return { success: false, error: response.error || 'Sign up failed' };
      }
    } catch (error) {
      console.error('[AuthManager] Sign up error:', error);
      return { success: false, error: `Sign up request failed: ${error}` };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    console.log('[AuthManager] Logging out user:', this.authState.user?.email);
    
    await this.clearStoredAuth();
    this.setUnauthenticated();
    
    console.log('[AuthManager] Logout completed');
  }

  // Set authenticated state
  private async setAuthenticated(token: string, user: any): Promise<void> {
    this.authState = {
      isAuthenticated: true,
      isInitializing: false,
      user,
      token,
      lastValidation: Date.now()
    };
    
    // Store user data for offline mode
    try {
      await AsyncStorage.setItem('numina_user_data', JSON.stringify(user));
    } catch (error) {
      console.log('[AuthManager] Failed to store user data:', error);
    }
    
    this.notifyListeners();
  }

  // Set unauthenticated state
  private setUnauthenticated(): void {
    this.authState = {
      isAuthenticated: false,
      isInitializing: false,
      user: null,
      token: null,
      lastValidation: 0
    };
    this.notifyListeners();
  }

  // Store user data with user-specific key
  private async storeUserData(user: any): Promise<void> {
    try {
      const userKey = `numina_user_data_v2_${user.id}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(user));
      console.log('[AuthManager] User data stored with key:', userKey);
    } catch (error) {
      console.error('[AuthManager] Error storing user data:', error);
    }
  }

  // Clear stored authentication data
  private async clearStoredAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'numina_auth_token',
        'numina_current_user_id',
        'numina_user_data_v2', // Legacy key
        'numina_sync_status_v2'
      ]);
      console.log('[AuthManager] Stored auth data cleared');
    } catch (error) {
      console.error('[AuthManager] Error clearing stored auth:', error);
    }
  }

  // Clear other users' data while preserving current user
  private async clearOtherUsersData(currentUserId: string): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find keys that belong to other users
      const otherUsersKeys = allKeys.filter(key => {
        const containsUserId = key.includes('_6') && key.length > 20; // MongoDB ObjectId pattern
        const isCurrentUser = key.includes(currentUserId);
        const isUserData = key.includes('numina_') || key.includes('emotions_') || 
                          key.includes('conversations_') || key.includes('analytics_') ||
                          key.includes('@ai_') || key.includes('@cloud_');
        
        return containsUserId && !isCurrentUser && isUserData;
      });
      
      if (otherUsersKeys.length > 0) {
        console.log('[AuthManager] Clearing other users keys:', otherUsersKeys.length);
        await AsyncStorage.multiRemove(otherUsersKeys);
      }
    } catch (error) {
      console.error('[AuthManager] Error clearing other users data:', error);
    }
  }
}

export default AuthManager;
export type { AuthState, AuthResult };