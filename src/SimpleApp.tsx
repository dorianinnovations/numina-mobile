import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';

// Navigation
import { AppNavigator } from './navigation/AppNavigator';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext';
import { FontProvider } from './components/FontProvider';

// Services
import AuthManager from './services/authManager';
import { NuminaColors } from './utils/colors';

/**
 * Main App Component with Simplified Authentication Flow
 * 
 * Authentication-First Architecture:
 * 1. Initialize AuthManager first
 * 2. Wait for authentication state to be determined
 * 3. Only then initialize other services
 * 4. No race conditions, no token clearing issues
 */

const AppContent: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Initialize other services only after auth is ready
    const initializeServices = async () => {
      if (isInitializing) {
        // Still initializing auth, wait
        return;
      }

      console.log('[SimpleApp] Auth initialization complete, starting services...');
      console.log('[SimpleApp] Authentication status:', { isAuthenticated });

      // Here we would initialize other services that depend on auth
      // For now, just mark app as ready
      setIsAppReady(true);
      console.log('[SimpleApp] App initialization complete');
    };

    initializeServices();
  }, [isInitializing, isAuthenticated]);

  // Show loading screen during initialization
  if (isInitializing || !isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={NuminaColors.primary} />
        <Text style={styles.loadingText}>
          {isInitializing ? 'Checking Authentication...' : 'Initializing Services...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          Setting up secure user session
        </Text>
      </View>
    );
  }

  console.log('[SimpleApp] Rendering main app, authenticated:', isAuthenticated);

  // Render main app
  return <AppNavigator />;
};

const SimpleApp: React.FC = () => {
  return (
    <ThemeProvider>
      <FontProvider>
        <AuthProvider>
          <AppContent />
          <StatusBar style="auto" />
        </AuthProvider>
      </FontProvider>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: NuminaColors.text,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: NuminaColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SimpleApp;