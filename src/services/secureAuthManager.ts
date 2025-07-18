

import * as SecureStore from 'expo-secure-store';
import ENV from '../config/environment';

interface SecureAuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: any | null;
  sessionToken: string | null;  // Memory-only, never persisted
  sessionExpiry: number | null;
  lastValidation: number;
}

interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

class SecureAuthManager {
  private static instance: SecureAuthManager;
  private authState: SecureAuthState = {
    isAuthenticated: false,
    isInitializing: false,
    user: null,
    sessionToken: null,
    sessionExpiry: null,
    lastValidation: 0
  };
  private listeners: ((state: SecureAuthState) => void)[] = [];
  private sessionValidationTimer: NodeJS.Timeout | null = null;

  // Direct API methods to avoid circular dependency
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${ENV.API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authState.sessionToken && { 'Authorization': `Bearer ${this.authState.sessionToken}` }),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers,
      timeout: 60000
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Singleton pattern
  static getInstance(): SecureAuthManager {
    if (!SecureAuthManager.instance) {
      SecureAuthManager.instance = new SecureAuthManager();
    }
    return SecureAuthManager.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: SecureAuthState) => void): () => void {
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
  getAuthState(): SecureAuthState {
    return { ...this.authState };
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.authState.user?.id || null;
  }

  // Get current session token (memory only)
  getCurrentToken(): string | null {
    if (this.isSessionExpired()) {
      // Clear session without awaiting SecureStore to keep this sync
      this.clearSessionSync();
      return null;
    }
    return this.authState.sessionToken;
  }

  // Check if authenticated and session valid
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && 
           !!this.authState.sessionToken && 
           !!this.authState.user &&
           !this.isSessionExpired();
  }

  // Check if session is expired
  private isSessionExpired(): boolean {
    if (!this.authState.sessionExpiry) return true;
    return Date.now() > this.authState.sessionExpiry;
  }

  // Initialize authentication - CHECK FOR EXISTING SESSION
  async initializeAuth(): Promise<AuthResult> {
    console.log('🔐 SECURE AUTH: Checking for existing session');
    
    this.authState.isInitializing = true;
    this.notifyListeners();

    try {
      // Check for existing valid session first
      const existingToken = await SecureStore.getItemAsync('numina_auth_token');
      
      if (existingToken) {
        console.log('🔐 SECURE AUTH: Found existing token, validating...');
        
        try {
          // Validate token with server
          const validationResult = await this.validateExistingToken(existingToken);
          
          if (validationResult.success && validationResult.user) {
            // Restore session in memory
            await this.setMemorySession(existingToken, validationResult.user);
            
            console.log('🔐 SECURE AUTH: Session restored successfully for user:', validationResult.user.id);
            this.authState.isInitializing = false;
            this.notifyListeners();
            
            return { success: true, user: validationResult.user };
          } else {
            console.log('🔐 SECURE AUTH: Token validation failed, clearing session');
            await this.clearSession();
          }
        } catch (error) {
          console.error('🔐 SECURE AUTH: Token validation error:', error);
          await this.clearSession();
        }
      } else {
        console.log('🔐 SECURE AUTH: No existing token found');
      }
      
      // No valid session found, user must login
      console.log('🔐 SECURE AUTH: No valid session, user must login');
      this.authState.isInitializing = false;
      this.notifyListeners();
      
      return { success: false, error: 'User must login' };
    } catch (error) {
      console.error('🔐 SECURE AUTH: Initialization error:', error);
      await this.clearSession();
      this.authState.isInitializing = false;
      this.notifyListeners();
      
      return { success: false, error: 'Authentication initialization failed' };
    }
  }

  // Login with credentials
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log('🔐 SECURE AUTH: Attempting login for:', credentials.email);
      
      // Clear any existing session first
      await this.clearSession();

      const response = await this.apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      console.log('🔐 SECURE AUTH: Login response:', response);

      if (response.success && response.token && response.data?.user) {
        // Set session data in memory only
        await this.setMemorySession(response.token, response.data.user);
        
        console.log('🔐 SECURE AUTH: Login successful, session created in memory');
        return { success: true, user: response.data.user };
      } else {
        console.error('🔐 SECURE AUTH: Login failed - response format mismatch');
        console.error('🔐 SECURE AUTH: Expected: response.token and response.data.user');
        console.error('🔐 SECURE AUTH: Actual response:', JSON.stringify(response, null, 2));
        const errorMsg = response.error || 'Invalid login response';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('🔐 SECURE AUTH: Login failed:', error);
      await this.clearSession();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // Sign up with credentials
  async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
    try {
      console.log('🔐 SECURE AUTH: Attempting signup for:', credentials.email);
      
      if (credentials.password !== credentials.confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      // Clear any existing session first
      await this.clearSession();

      const response = await this.apiRequest('/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      if (response.success && response.token && response.data?.user) {
        // Set session data in memory only
        await this.setMemorySession(response.token, response.data.user);
        
        console.log('🔐 SECURE AUTH: Signup successful, session created in memory');
        return { success: true, user: response.data.user };
      } else {
        throw new Error('Invalid signup response');
      }
    } catch (error) {
      console.error('🔐 SECURE AUTH: Signup failed:', error);
      await this.clearSession();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  // Logout and clear session
  async logout(): Promise<void> {
    try {
      console.log('🔐 SECURE AUTH: Logging out and clearing session');
      console.log('🔐 SECURE AUTH: Current user will be completely removed from memory');
      
      const currentUserId = this.authState.user?.id;
      
      // Notify server of logout if we have a valid session
      if (this.authState.sessionToken) {
        try {
          await this.apiRequest('/logout', { method: 'POST' });
          console.log('🔐 SECURE AUTH: Server logout successful');
        } catch (error) {
          console.warn('🔐 SECURE AUTH: Server logout failed (continuing with local logout):', error);
        }
      }

      // Clear memory session completely
      await this.clearSession();
      
      // Skip data manager cleanup to prevent loops
      console.log('🔐 SECURE AUTH: Skipping data manager cleanup (prevents loops)');
      
      console.log('🔐 SECURE AUTH: Logout complete, all session data cleared');
      console.log('🔐 SECURE AUTH: User', currentUserId, 'session terminated - no data persists');
    } catch (error) {
      console.error('🔐 SECURE AUTH: Logout error:', error);
      // Force clear session even if server logout failed
      await this.clearSession();
    }
  }

  // Set authenticated session in memory and SecureStore
  private async setMemorySession(token: string, user: any): Promise<void> {
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    this.authState = {
      isAuthenticated: true,
      isInitializing: false,
      user,
      sessionToken: token,
      sessionExpiry: Date.now() + sessionDuration,
      lastValidation: Date.now()
    };

    // Store token in SecureStore for other services
    try {
      await SecureStore.setItemAsync('numina_auth_token', token);
      console.log('🔐 SECURE AUTH: Token stored in SecureStore for other services');
    } catch (error) {
      console.warn('🔐 SECURE AUTH: Failed to store token in SecureStore:', error);
    }
    
    // Set up auto-validation timer
    this.setupSessionValidation();
    
    // Notify all listeners
    this.notifyListeners();
    
    console.log('🔐 SECURE AUTH: Memory session established', {
      userId: user.id,
      expiresIn: sessionDuration / 1000 / 60,
      sessionToken: token.substring(0, 10) + '...'
    });
  }

  // Clear all session data from memory and SecureStore
  private async clearSession(): Promise<void> {
    // Clear validation timer
    if (this.sessionValidationTimer) {
      clearInterval(this.sessionValidationTimer);
      this.sessionValidationTimer = null;
    }

    // Clear token from SecureStore
    try {
      await SecureStore.deleteItemAsync('numina_auth_token');
      console.log('🔐 SECURE AUTH: Token cleared from SecureStore');
    } catch (error) {
      console.warn('🔐 SECURE AUTH: Failed to clear token from SecureStore:', error);
    }
    
    // Reset auth state
    this.authState = {
      isAuthenticated: false,
      isInitializing: false,
      user: null,
      sessionToken: null,
      sessionExpiry: null,
      lastValidation: 0
    };

    // Notify listeners
    this.notifyListeners();
    
    console.log('🔐 SECURE AUTH: Session cleared from memory');
  }
  
  // Clear session synchronously (for getCurrentToken)
  private clearSessionSync(): void {
    // Clear validation timer
    if (this.sessionValidationTimer) {
      clearInterval(this.sessionValidationTimer);
      this.sessionValidationTimer = null;
    }

    // Clear token from SecureStore asynchronously (don't await)
    SecureStore.deleteItemAsync('numina_auth_token')
      .then(() => console.log('🔐 SECURE AUTH: Token cleared from SecureStore'))
      .catch(error => console.warn('🔐 SECURE AUTH: Failed to clear token from SecureStore:', error));
    
    // Reset auth state
    this.authState = {
      isAuthenticated: false,
      isInitializing: false,
      user: null,
      sessionToken: null,
      sessionExpiry: null,
      lastValidation: 0
    };

    // Notify listeners
    this.notifyListeners();
    
    console.log('🔐 SECURE AUTH: Session cleared from memory');
  }

  // Setup session validation timer
  private setupSessionValidation(): void {
    // Clear existing timer
    if (this.sessionValidationTimer) {
      clearInterval(this.sessionValidationTimer);
    }

    // Validate session every 5 minutes
    this.sessionValidationTimer = setInterval(async () => {
      if (this.isSessionExpired()) {
        console.log('🔐 SECURE AUTH: Session expired, clearing');
        await this.clearSession();
      } else {
        // Validate with server occasionally
        const timeSinceValidation = Date.now() - this.authState.lastValidation;
        if (timeSinceValidation > 15 * 60 * 1000) { // 15 minutes
          await this.validateSessionWithServer();
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Validate session with server
  private async validateSessionWithServer(): Promise<void> {
    try {
      if (!this.authState.sessionToken) return;

      await this.apiRequest('/user/profile');
      this.authState.lastValidation = Date.now();
      
      console.log('🔐 SECURE AUTH: Session validated with server');
    } catch (error) {
      console.error('🔐 SECURE AUTH: Session validation failed, clearing session');
      await this.clearSession();
    }
  }

  // Validate token with server and return user data
  private async validateExistingToken(token: string): Promise<{ success: boolean; user?: any }> {
    // Store original token state before try block
    const originalToken = this.authState.sessionToken;
    
    try {
      console.log('🔐 SECURE AUTH: Validating token with server...');
      
      // Temporarily set token for validation
      this.authState.sessionToken = token;
      
      const response = await this.apiRequest('/user/profile');
      
      if (response.success && response.data?.user) {
        console.log('🔐 SECURE AUTH: Token validation successful');
        return { success: true, user: response.data.user };
      } else {
        console.log('🔐 SECURE AUTH: Token validation failed - invalid response');
        return { success: false };
      }
    } catch (error) {
      console.error('🔐 SECURE AUTH: Token validation error:', error);
      return { success: false };
    } finally {
      // Restore original token state
      this.authState.sessionToken = originalToken;
    }
  }

  // Force session cleanup (called on app backgrounding/closing)
  forceCleanup(): void {
    console.log('🔐 SECURE AUTH: Force cleanup triggered');
    this.clearSessionSync();
  }
}

export default SecureAuthManager;
export { SecureAuthState, AuthResult, LoginCredentials, SignUpCredentials };