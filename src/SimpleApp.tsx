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
import { BorderThemeProvider } from './contexts/BorderThemeContext';
import { FontProvider } from './components/FontProvider';
import { NuminaColors } from './utils/colors';
import AppInitializer from './services/appInitializer';
import { log } from './utils/logger';
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
    log.debug('Initializing app services once on mount', null, 'SimpleApp');
    
    const initializeServices = async () => {
      log.info('Authentication status', { isAuthenticated }, 'SimpleApp');

      if (isAuthenticated) {
        log.info('Starting three-tier system initialization', null, 'SimpleApp');
        try {
          const initResult = await AppInitializer.initialize();
          log.info('Tier 1 (Infrastructure) initialized', { success: initResult.success }, 'SimpleApp');
          
          if (initResult.success) {
            const wsConnected = await AppInitializer.initializeWebSocketAfterAuth();
            log.info('Tier 2 (WebSocket) initialized', { connected: wsConnected }, 'SimpleApp');
          }
          
          await AppInitializer.performInitialDataSync();
          log.info('Tier 3 (Data Sync) initialized', null, 'SimpleApp');
          
          log.info('Three-tier system initialization complete', null, 'SimpleApp');
        } catch (error) {
          log.error('Three-tier system initialization failed', error, 'SimpleApp');
        }
      }

      setIsAppReady(true);
      log.debug('App initialization complete', null, 'SimpleApp');
    };

    initializeServices();
  }, []); // Run once on mount - no dependencies to prevent re-runs

  if (!isAppReady) {
    log.debug('Still loading, showing SmoothLoader', null, 'SimpleApp');
    return <SmoothLoader />;
  }

  log.debug('Rendering main app', { authenticated: isAuthenticated }, 'SimpleApp');
  log.debug('About to render AppNavigator', null, 'SimpleApp');

  return <AppNavigator />;
};

const SimpleApp: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <BorderThemeProvider>
            <RefreshProvider>
              <FontProvider>
                <AuthProvider>
                <AppContent />
                <StatusBar style="auto" />
                </AuthProvider>
              </FontProvider>
            </RefreshProvider>
          </BorderThemeProvider>
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