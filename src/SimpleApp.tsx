import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './navigation/AppNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/SimpleAuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { BorderThemeProvider } from './contexts/BorderThemeContext';
import { BorderSettingsProvider } from './contexts/BorderSettingsContext';
import { FontProvider } from './components/ui/FontProvider';
// import { DevTools } from './components/DevTools'; // TEMP DISABLED
import { NuminaColors } from './utils/colors';
import AppInitializer from './services/appInitializer';
import { log } from './utils/logger';
const SmoothLoader: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotationAnimation.start();
    
    return () => {
      // Stop rotation animation on unmount to prevent memory leaks
      rotationAnimation.stop();
    };
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
  try {
    const { isAuthenticated } = useAuth();
    
    return (
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
    );
  } catch (error) {
    console.error('AppContent error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
};

const SimpleApp: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <BorderThemeProvider>
            <BorderSettingsProvider>
              <RefreshProvider>
                <FontProvider>
                  <AuthProvider>
                    <View style={{ flex: 1 }}>
                      <AppContent />
                    </View>
                  </AuthProvider>
                </FontProvider>
              </RefreshProvider>
            </BorderSettingsProvider>
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