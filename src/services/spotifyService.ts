import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '../utils/logger';
// Dynamic import to prevent circular dependency

// Complete the auth session for web browsers
WebBrowser.maybeCompleteAuthSession();

export interface SpotifyAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface SpotifyTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  country: string;
}

class SpotifyService {
  private config: SpotifyAuthConfig = {
    clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || 'your_spotify_client_id',
    redirectUri: AuthSession.makeRedirectUri({
      scheme: 'numina',
      path: 'spotify-auth',
      preferLocalhost: false,
      isTripleSlashed: false
    }),
    scopes: [
      'user-read-email',
      'user-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'playlist-read-private',
      'user-library-read',
      'user-top-read',
    ],
  };

  private discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
  };

  async authenticateWithSpotify(): Promise<SpotifyTokens> {
    try {
      // console.log('🎵 Starting Spotify authentication...');
      
      // Validate configuration
      if (this.config.clientId === 'your_spotify_client_id' || !this.config.clientId) {
        // console.log('🎵 No Spotify Client ID configured, using mock authentication for development');
        return this.mockAuthentication();
      }
      
      // console.log('🎵 Spotify Client ID found:', this.config.clientId.substring(0, 8) + '...');
      // console.log('🎵 Redirect URI:', this.config.redirectUri);
      
      // Generate PKCE challenge
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      // console.log('🎵 Generated code verifier length:', codeVerifier.length);
      // console.log('🎵 Generated code challenge length:', codeChallenge.length);
      
      // Store code verifier for token exchange
      await AsyncStorage.setItem('spotify_code_verifier', codeVerifier);
      
      const request = new AuthSession.AuthRequest({
        clientId: this.config.clientId,
        scopes: this.config.scopes,
        redirectUri: this.config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        state: this.generateRandomState(),
        codeChallenge: codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      const result = await request.promptAsync(this.discovery);

      if (result.type === 'success') {
        log.info('Spotify auth success, exchanging code for tokens', null, 'SpotifyService');
        
        // Exchange authorization code for access token
        const storedVerifier = await AsyncStorage.getItem('spotify_code_verifier');
        if (!storedVerifier) {
          throw new Error('Code verifier not found in storage');
        }
        const tokens = await this.exchangeCodeForTokens(result.params.code, storedVerifier);
        
        // Store tokens securely
        await this.storeTokens(tokens);
        
        // Get user profile and store it
        const userProfile = await this.getSpotifyUserProfile(tokens.accessToken);
        await this.storeUserProfile(userProfile);
        
        // Send tokens to backend
        await this.sendTokensToBackend(tokens, userProfile);
        
        // Clean up code verifier
        await AsyncStorage.removeItem('spotify_code_verifier');
        
        return tokens;
      } else {
        // Clean up code verifier on failure
        await AsyncStorage.removeItem('spotify_code_verifier');
        throw new Error(`Spotify authentication failed: ${result.type}`);
      }
    } catch (error) {
      console.error('🎵 Spotify authentication error:', error);
      // Clean up code verifier on error
      await AsyncStorage.removeItem('spotify_code_verifier');
      throw error;
    }
  }

  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<SpotifyTokens> {
    // console.log('🎵 Exchanging code for tokens...');
    // console.log('🎵 Code verifier length for exchange:', codeVerifier.length);
    // console.log('🎵 Code verifier first 20 chars:', codeVerifier.substring(0, 20));
    // console.log('🎵 Code verifier last 20 chars:', codeVerifier.substring(-20));
    
    // Validate code verifier format
    const validChars = /^[A-Za-z0-9\-._~]+$/;
    if (!validChars.test(codeVerifier)) {
      throw new Error('Code verifier contains invalid characters');
    }
    
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      throw new Error(`Code verifier length invalid: ${codeVerifier.length} (should be 43-128)`);
    }
    
    const storedVerifier = await AsyncStorage.getItem('spotify_code_verifier');
    // console.log('🎵 Code verifier matches stored?', codeVerifier === storedVerifier);
    // console.log('🎵 Stored verifier length:', storedVerifier?.length || 'null');
    
    // Double-check redirect URI matches what was used in authorization
    const currentRedirectUri = this.config.redirectUri;
    // console.log('🎵 Using redirect URI:', currentRedirectUri);
    
    const requestBody = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: currentRedirectUri,
      client_id: this.config.clientId,
      code_verifier: codeVerifier,
    };
    
    // console.log('🎵 Token exchange request body:', {
    //   grant_type: requestBody.grant_type,
    //   codeLength: requestBody.code.length,
    //   redirect_uri: requestBody.redirect_uri,
    //   client_id: requestBody.client_id.substring(0, 8) + '...',
    //   code_verifier_length: requestBody.code_verifier.length,
    //   code_verifier_start: requestBody.code_verifier.substring(0, 10) + '...',
    //   code_verifier_end: '...' + requestBody.code_verifier.substring(-10)
    // });
    
    try {
      const response = await fetch(this.discovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams(requestBody).toString(),
      });

      log.debug('Spotify token exchange response', { status: response.status }, 'SpotifyService');

      const responseText = await response.text();
      // Token response body intentionally not logged for security

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      };
    } catch (error) {
      console.error('🎵 Token exchange error details:', error);
      throw error;
    }
  }

  private async getSpotifyUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Spotify user profile: ${response.status}`);
    }

    return await response.json();
  }

  private async storeTokens(tokens: SpotifyTokens): Promise<void> {
    try {
      await AsyncStorage.setItem('spotify_tokens', JSON.stringify(tokens));
      await AsyncStorage.setItem('spotify_token_timestamp', Date.now().toString());
    } catch (error) {
      console.error('Error storing Spotify tokens:', error);
    }
  }

  private async storeUserProfile(profile: SpotifyUserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem('spotify_user_profile', JSON.stringify(profile));
    } catch (error) {
      console.error('Error storing Spotify user profile:', error);
    }
  }

  private async sendTokensToBackend(tokens: SpotifyTokens, profile: SpotifyUserProfile): Promise<void> {
    try {
      const { default: ApiService } = await import('./api');
      await ApiService.connectSpotifyAccount({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        spotifyUserId: profile.id,
        spotifyEmail: profile.email,
        spotifyDisplayName: profile.display_name,
        expiresIn: tokens.expiresIn,
      });
    } catch (error) {
      console.error('Error sending Spotify tokens to backend:', error);
      // Don't throw here - local storage of tokens is still valuable
    }
  }

  async getStoredTokens(): Promise<SpotifyTokens | null> {
    try {
      const tokensString = await AsyncStorage.getItem('spotify_tokens');
      if (tokensString) {
        const tokens = JSON.parse(tokensString);
        const timestamp = await AsyncStorage.getItem('spotify_token_timestamp');
        
        // Check if tokens are expired
        if (timestamp) {
          const tokenAge = Date.now() - parseInt(timestamp);
          const expirationTime = tokens.expiresIn * 1000; // Convert to milliseconds
          
          if (tokenAge < expirationTime) {
            return tokens;
          } else {
            log.info('Spotify tokens expired, need to re-authenticate', null, 'SpotifyService');
            await this.clearStoredTokens();
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting stored Spotify tokens:', error);
      return null;
    }
  }

  async getStoredUserProfile(): Promise<SpotifyUserProfile | null> {
    try {
      const profileString = await AsyncStorage.getItem('spotify_user_profile');
      return profileString ? JSON.parse(profileString) : null;
    } catch (error) {
      console.error('Error getting stored Spotify user profile:', error);
      return null;
    }
  }

  async clearStoredTokens(): Promise<void> {
    try {
      await AsyncStorage.removeItem('spotify_tokens');
      await AsyncStorage.removeItem('spotify_token_timestamp');
      await AsyncStorage.removeItem('spotify_user_profile');
    } catch (error) {
      console.error('Error clearing Spotify tokens:', error);
    }
  }

  async disconnectSpotify(): Promise<void> {
    try {
      // Clear local storage
      await this.clearStoredTokens();
      
      // Notify backend
      const { default: ApiService } = await import('./api');
      await ApiService.disconnectSpotifyAccount();
      
      // console.log('🎵 Spotify account disconnected');
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
      throw error;
    }
  }

  async isConnected(): Promise<boolean> {
    const tokens = await this.getStoredTokens();
    const profile = await this.getStoredUserProfile();
    return !!(tokens && profile);
  }

  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private generateCodeVerifier(): string {
    // Generate a cryptographically secure 128-character string for PKCE
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    
    // Use crypto.getRandomValues if available for better randomness
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(128);
      crypto.getRandomValues(array);
      for (let i = 0; i < 128; i++) {
        result += chars.charAt(array[i] % chars.length);
      }
    } else {
      // Fallback to Math.random
      for (let i = 0; i < 128; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return result;
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    // console.log('🎵 Generating challenge for verifier:', codeVerifier.substring(0, 10) + '...');
    // console.log('🎵 Verifier length for challenge:', codeVerifier.length);
    
    try {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      
      // console.log('🎵 SHA256 digest (BASE64):', digest.substring(0, 20) + '...');
      // console.log('🎵 SHA256 digest length:', digest.length);
      
      // RFC 7636 compliant base64url conversion (no padding, URL-safe chars)
      const base64Url = digest
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Remove all trailing padding
      
      // console.log('🎵 Final code challenge (BASE64URL):', base64Url.substring(0, 20) + '...');
      // console.log('🎵 Challenge length:', base64Url.length);
      
      // Validate the challenge meets RFC 7636 requirements
      if (base64Url.length < 43) {
        throw new Error(`Code challenge too short: ${base64Url.length} (minimum 43)`);
      }
      
      // Verify it only contains valid base64url characters
      const validBase64Url = /^[A-Za-z0-9\-_]+$/;
      if (!validBase64Url.test(base64Url)) {
        throw new Error('Code challenge contains invalid base64url characters');
      }
      
      return base64Url;
    } catch (error) {
      console.error('🎵 Error generating code challenge:', error);
      throw error;
    }
  }


  private async mockAuthentication(): Promise<SpotifyTokens> {
    // console.log('🎵 Using mock Spotify authentication for development');
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockTokens: SpotifyTokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
    
    const mockProfile: SpotifyUserProfile = {
      id: 'mock_user_123',
      display_name: 'Demo User',
      email: 'demo@spotify.com',
      images: [{
        url: 'https://via.placeholder.com/300x300/1DB954/white?text=Spotify',
        height: 300,
        width: 300,
      }],
      followers: { total: 42 },
      country: 'US',
    };
    
    // Store mock data
    await this.storeTokens(mockTokens);
    await this.storeUserProfile(mockProfile);
    
    // Try to send to backend (will likely fail in development, but that's ok)
    try {
      await this.sendTokensToBackend(mockTokens, mockProfile);
    } catch (error) {
      // console.log('🎵 Backend connection failed (expected in development):', error);
    }
    
    return mockTokens;
  }

  getRedirectUri(): string {
    return this.config.redirectUri;
  }
}

// Lazy instantiation to prevent blocking app startup
let instance: SpotifyService | null = null;

export const getSpotifyService = (): SpotifyService => {
  if (!instance) {
    instance = new SpotifyService();
  }
  return instance;
};

export default getSpotifyService;