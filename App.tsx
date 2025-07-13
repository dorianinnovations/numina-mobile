import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Context Providers
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { FontProvider } from './src/components/FontProvider';

// Services
import ApiService from './src/services/api';
import OfflineQueueService from './src/services/offlineQueue';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize services on app startup
    const initializeServices = async () => {
      console.log('Initializing app services...');
      
      // Initialize offline queue service
      await OfflineQueueService.initialize();
      
      // Perform API health check
      const isConnected = await ApiService.checkConnection();
      console.log('API Health Check:', isConnected ? 'Connected' : 'Disconnected');
      
      if (!isConnected) {
        console.warn('API server is not reachable. App will work in offline mode.');
      }
    };

    initializeServices().catch(error => {
      console.error('Failed to initialize services:', error);
    });

    // Cleanup on unmount
    return () => {
      OfflineQueueService.cleanup();
    };
  }, []);

  return (
    <ThemeProvider>
      <FontProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </FontProvider>
    </ThemeProvider>
  );
};

export default App;
