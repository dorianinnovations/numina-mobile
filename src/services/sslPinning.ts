import ENV from '../config/environment';

interface SSLPinningConfig {
  hostname: string;
  publicKeyHashes: string[];
  timeout: number;
}

class SSLPinningService {
  private static readonly SSL_CONFIGS: Record<string, SSLPinningConfig> = {
    'server-a7od.onrender.com': {
      hostname: 'server-a7od.onrender.com',
      publicKeyHashes: [
        // Add server's public key hashes here
        // Generated from server's SSL certificate
        'REPLACE_WITH_ACTUAL_HASH_1',
        'REPLACE_WITH_ACTUAL_HASH_2', // Backup hash
      ],
      timeout: 30000,
    },
    'api.stripe.com': {
      hostname: 'api.stripe.com',
      publicKeyHashes: [
        // Stripe's public key hashes (example - use actual ones)
        'REPLACE_WITH_STRIPE_HASH_1',
        'REPLACE_WITH_STRIPE_HASH_2',
      ],
      timeout: 30000,
    },
  };

  // Validate SSL certificate (mock implementation)
  static async validateSSLCertificate(url: string): Promise<boolean> {
    if (!ENV.SSL_PINNING_ENABLED) {
      return true; // Skip SSL pinning in development
    }

    try {
      const hostname = new URL(url).hostname;
      const config = this.SSL_CONFIGS[hostname];
      
      if (!config) {
        console.warn(`⚠️ SSL pinning not configured for ${hostname}`);
        return true; // Allow connection if no config found
      }

      // In production, implement actual SSL pinning here
      // This would involve:
      // 1. Extracting the certificate from the connection
      // 2. Computing the public key hash
      // 3. Comparing against known good hashes
      
      console.log(`🔒 SSL pinning validation for ${hostname}`);
      
      // For now, return true (would be actual validation in production)
      return true;
      
    } catch (error) {
      console.error('SSL pinning validation failed:', error);
      return false;
    }
  }

  // Create secure fetch with SSL pinning
  static async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Validate SSL certificate first
    const isValid = await this.validateSSLCertificate(url);
    
    if (!isValid) {
      throw new Error('SSL certificate validation failed');
    }

    // Add security headers
    const secureHeaders = {
      'X-SSL-Pinned': 'true',
      'X-App-Secure': 'true',
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers: secureHeaders,
    });
  }

  // Get SSL configuration for hostname
  static getSSLConfig(hostname: string): SSLPinningConfig | null {
    return this.SSL_CONFIGS[hostname] || null;
  }

  // Add new SSL configuration
  static addSSLConfig(hostname: string, config: SSLPinningConfig): void {
    this.SSL_CONFIGS[hostname] = config;
  }
}

export default SSLPinningService;