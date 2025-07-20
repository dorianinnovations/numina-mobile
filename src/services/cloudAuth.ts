import ENV from '../config/environment';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class CloudAuth {
  private static instance: CloudAuth;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null
  };
  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): CloudAuth {
    if (!CloudAuth.instance) {
      CloudAuth.instance = new CloudAuth();
    }
    return CloudAuth.instance;
  }

  // Subscribe to auth changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.authState }));
  }

  // Get current state
  getState(): AuthState {
    return { ...this.authState };
  }

  // Get auth headers for API calls
  getAuthHeaders(): Record<string, string> {
    if (this.authState.token) {
      return { Authorization: `Bearer ${this.authState.token}` };
    }
    return {};
  }

  // Login with email/password
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 CLOUD AUTH: Attempting login for:', email);
      
      const response = await fetch(`${ENV.API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('🔐 CLOUD AUTH: Server response:', data);

      // Handle both success formats: "success" status or success boolean
      const isSuccess = data.status === 'success' || data.success === true;
      
      if (response.ok && isSuccess && data.token && data.data?.user) {
        this.authState = {
          isAuthenticated: true,
          user: data.data.user,
          token: data.token
        };
        
        this.notifyListeners();
        console.log('🔐 CLOUD AUTH: Login successful for user:', data.data.user.id);
        return { success: true };
      } else {
        // IMPORTANT: Do NOT update auth state on login failure
        console.log('🔐 CLOUD AUTH: Login failed, auth state remains unchanged');
        
        let error = data.error || data.message || 'Login failed';
        
        // User-friendly error messages
        if (error.toLowerCase().includes('validation failed')) {
          // Check if it's email validation specifically
          if (data.errors && data.errors.some(e => e.path === 'email')) {
            error = 'Invalid email format';
          } else {
            error = 'Invalid input';
          }
        } else if (error.toLowerCase().includes('incorrect email') || error.toLowerCase().includes('incorrect password')) {
          error = 'Incorrect email or password';
        } else if (error.toLowerCase().includes('user not found')) {
          error = 'Account not found';
        } else if (error.toLowerCase().includes('password')) {
          error = 'Incorrect password';
        } else if (error.toLowerCase().includes('email')) {
          error = 'Email not found';
        }
        
        console.error('🔐 CLOUD AUTH: Login failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('🔐 CLOUD AUTH: Login error:', error);
      return { success: false, error: 'Connection issue! Check your internet and try again 🌐' };
    }
  }

  // Sign up with email/password
  async signup(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 CLOUD AUTH: Attempting signup for:', email);
      
      const response = await fetch(`${ENV.API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('🔐 CLOUD AUTH: Signup response:', data);

      // Handle both success formats
      const isSuccess = data.status === 'success' || data.success === true;
      
      if (response.ok && isSuccess && data.token && data.data?.user) {
        this.authState = {
          isAuthenticated: true,
          user: data.data.user,
          token: data.token
        };
        
        this.notifyListeners();
        console.log('🔐 CLOUD AUTH: Signup successful for user:', data.data.user.id);
        return { success: true };
      } else {
        let error = data.error || data.message || 'Signup failed';
        
        // User-friendly signup error messages
        if (error.toLowerCase().includes('validation failed')) {
          // Check if it's email validation specifically
          if (data.errors && data.errors.some(e => e.path === 'email')) {
            error = 'Invalid email format';
          } else if (data.errors && data.errors.some(e => e.path === 'password')) {
            error = 'Password too weak';
          } else {
            error = 'Invalid input';
          }
        } else if (error.toLowerCase().includes('email already exists') || error.toLowerCase().includes('already registered')) {
          error = 'Email already registered';
        } else if (error.toLowerCase().includes('invalid email')) {
          error = 'Invalid email format';
        } else if (error.toLowerCase().includes('password')) {
          error = 'Password too weak';
        } else if (error.toLowerCase().includes('email')) {
          error = 'Email error';
        }
        
        console.error('🔐 CLOUD AUTH: Signup failed:', error);
        return { success: false, error };
      }
    } catch (error) {
      console.error('🔐 CLOUD AUTH: Signup error:', error);
      return { success: false, error: 'Connection issue! Check your internet and try again 🌐' };
    }
  }

  // Logout (cloud-only, no local cleanup)
  logout(): void {
    console.log('🔐 CLOUD AUTH: Logging out');
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null
    };
    this.notifyListeners();
    console.log('🔐 CLOUD AUTH: Logout complete');
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authState.user;
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.authState.user?.id || null;
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated && !!this.authState.token;
  }

  // Get token for API calls
  getToken(): string | null {
    return this.authState.token;
  }
}

export default CloudAuth;
export { User, AuthState };