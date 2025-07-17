

import ApiService from './api';

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
      this.clearSession();
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

  // Initialize authentication - NO STORAGE CHECK, ALWAYS FRESH
  async initializeAuth(): Promise<AuthResult> {
    console.log('🔐 SECURE AUTH: Starting fresh session (no local storage)');
    console.log('🔐 SECURE AUTH: Previous session data completely cleared on app restart');
    
    this.authState.isInitializing = true;
    this.notifyListeners();

    try {
      // Always start with clean state - no storage persistence
      this.clearSession();
      
      console.log('🔐 SECURE AUTH: Fresh session initialized, user must login');
      this.authState.isInitializing = false;
      this.notifyListeners();
      
      return { success: false, error: 'User must login' };
    } catch (error) {
      console.error('🔐 SECURE AUTH: Initialization error:', error);
      this.clearSession();
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
      this.clearSession();

      const response = await ApiService.login({
        email: credentials.email,
        password: credentials.password
      });

      if (response.success && response.data?.token && response.data?.data?.user) {
        // Set session data in memory only
        this.setMemorySession(response.data.token, response.data.data.user);
        
        console.log('🔐 SECURE AUTH: Login successful, session created in memory');
        return { success: true, user: response.data.data.user };
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('🔐 SECURE AUTH: Login failed:', error);
      this.clearSession();
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
      this.clearSession();

      const response = await ApiService.signup({
        email: credentials.email,
        password: credentials.password
      });

      if (response.success && response.data?.token && response.data?.data?.user) {
        // Set session data in memory only
        this.setMemorySession(response.data.token, response.data.data.user);
        
        console.log('🔐 SECURE AUTH: Signup successful, session created in memory');
        return { success: true, user: response.data.data.user };
      } else {
        throw new Error('Invalid signup response');
      }
    } catch (error) {
      console.error('🔐 SECURE AUTH: Signup failed:', error);
      this.clearSession();
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
          await ApiService.logout();
          console.log('🔐 SECURE AUTH: Server logout successful');
        } catch (error) {
          console.warn('🔐 SECURE AUTH: Server logout failed (continuing with local logout):', error);
        }
      }

      // Clear memory session completely
      this.clearSession();
      
      console.log('🔐 SECURE AUTH: Logout complete, all session data cleared');
      console.log('🔐 SECURE AUTH: User', currentUserId, 'session terminated - no data persists');
    } catch (error) {
      console.error('🔐 SECURE AUTH: Logout error:', error);
      // Force clear session even if server logout failed
      this.clearSession();
    }
  }

  // Set authenticated session in memory only
  private setMemorySession(token: string, user: any): void {
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    this.authState = {
      isAuthenticated: true,
      isInitializing: false,
      user,
      sessionToken: token,
      sessionExpiry: Date.now() + sessionDuration,
      lastValidation: Date.now()
    };

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

  // Clear all session data from memory
  private clearSession(): void {
    // Clear validation timer
    if (this.sessionValidationTimer) {
      clearInterval(this.sessionValidationTimer);
      this.sessionValidationTimer = null;
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
        this.clearSession();
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

      await ApiService.validateToken();
      this.authState.lastValidation = Date.now();
      
      console.log('🔐 SECURE AUTH: Session validated with server');
    } catch (error) {
      console.error('🔐 SECURE AUTH: Session validation failed, clearing session');
      this.clearSession();
    }
  }

  // Force session cleanup (called on app backgrounding/closing)
  forceCleanup(): void {
    console.log('🔐 SECURE AUTH: Force cleanup triggered');
    this.clearSession();
  }
}

export default SecureAuthManager;
export { SecureAuthState, AuthResult, LoginCredentials, SignUpCredentials };