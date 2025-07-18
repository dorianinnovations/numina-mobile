// Numina Web Deployment Configuration

const deployConfig = {
  // Production build settings
  production: {
    apiUrl: 'https://server-a7od.onrender.com',
    websocketUrl: 'wss://server-a7od.onrender.com',
    cdnUrl: 'https://cdn.numina.ai',
    analytics: {
      enabled: true,
      trackingId: 'G-NUMINA-WEB',
    },
    optimization: {
      minify: true,
      compress: true,
      treeshake: true,
      bundleAnalyzer: false,
    },
    features: {
      serviceWorker: true,
      webManifest: true,
      pushNotifications: true,
    }
  },

  // Staging build settings
  staging: {
    apiUrl: 'https://staging-server.numina.ai',
    websocketUrl: 'wss://staging-server.numina.ai',
    cdnUrl: 'https://staging-cdn.numina.ai',
    analytics: {
      enabled: true,
      trackingId: 'G-NUMINA-WEB-STAGING',
    },
    optimization: {
      minify: true,
      compress: false,
      treeshake: true,
      bundleAnalyzer: true,
    },
    features: {
      serviceWorker: false,
      webManifest: true,
      pushNotifications: false,
    }
  },

  // Development settings
  development: {
    apiUrl: 'http://localhost:5001',
    websocketUrl: 'ws://localhost:5001',
    cdnUrl: 'http://localhost:8081',
    analytics: {
      enabled: false,
      trackingId: '',
    },
    optimization: {
      minify: false,
      compress: false,
      treeshake: false,
      bundleAnalyzer: false,
    },
    features: {
      serviceWorker: false,
      webManifest: false,
      pushNotifications: false,
    }
  },

  // Deployment targets
  targets: {
    netlify: {
      buildCommand: 'npm run build:production',
      publishDirectory: 'dist',
      redirects: [
        { from: '/*', to: '/index.html', status: 200 }
      ],
      headers: [
        {
          for: '/*.js',
          values: {
            'Cache-Control': 'public, max-age=31536000'
          }
        },
        {
          for: '/*.css',
          values: {
            'Cache-Control': 'public, max-age=31536000'
          }
        }
      ]
    },

    vercel: {
      buildCommand: 'npm run build:production',
      outputDirectory: 'dist',
      framework: 'expo',
      rewrites: [
        { source: '/(.*)', destination: '/index.html' }
      ]
    },

    github_pages: {
      buildCommand: 'npm run build:production',
      publishDirectory: 'dist',
      basePath: '/numina-web',
    },

    aws_s3: {
      bucket: 'numina-web-app',
      region: 'us-east-1',
      cloudfront: {
        distributionId: 'NUMINA-WEB-DIST',
        paths: ['/*']
      }
    }
  }
};

module.exports = deployConfig;