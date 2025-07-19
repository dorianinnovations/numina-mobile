import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './navigation/AppNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { FontProvider } from './components/FontProvider';
import { NuminaColors } from './utils/colors';
import AppInitializer from './services/appInitializer';
const SmoothLoader: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <View style={styles.perfectCircleSpinner} />
      </Animated.View>
    </View>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isAppReady, setIsAppReady] = useState(true); // INSTANT FIX: Start ready

  useEffect(() => {
    console.log('[SimpleApp] Initializing app services once on mount');
    
    const initializeServices = async () => {
      console.log('[SimpleApp] Authentication status:', { isAuthenticated });

      if (isAuthenticated) {
        console.log('🚀 Starting three-tier system initialization...');
        try {
          const initResult = await AppInitializer.initialize();
          console.log('✅ Tier 1 (Infrastructure) initialized:', initResult.success);
          
          if (initResult.success) {
            const wsConnected = await AppInitializer.initializeWebSocketAfterAuth();
            console.log('✅ Tier 2 (WebSocket) initialized:', wsConnected);
          }
          
          await AppInitializer.performInitialDataSync();
          console.log('✅ Tier 3 (Data Sync) initialized');
          
          console.log('🎉 Three-tier system initialization complete!');
        } catch (error) {
          console.error('❌ Three-tier system initialization failed:', error);
        }
      }

      setIsAppReady(true);
      console.log('[SimpleApp] App initialization complete');
    };

    initializeServices();
  }, []); // Run once on mount - no dependencies to prevent re-runs

  if (!isAppReady) {
    console.log('🔄 SIMPLEAPP: Still loading, showing SmoothLoader');
    return <SmoothLoader />;
  }

  console.log('[SimpleApp] Rendering main app, authenticated:', isAuthenticated);
  console.log('🏗️ SIMPLEAPP: About to render AppNavigator');

  return <AppNavigator />;
};

const SimpleApp: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <RefreshProvider>
            <FontProvider>
              <AuthProvider>
                <AppContent />
                <StatusBar style="auto" />
              </AuthProvider>
            </FontProvider>
          </RefreshProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  perfectCircleSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: NuminaColors.primary,
    borderRightColor: NuminaColors.primary,
  },
});

export default SimpleApp;