import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { StatusBar, View, Text, ActivityIndicator, Platform, Animated } from "react-native";
import Svg, { Circle } from 'react-native-svg';
import LottieView from 'lottie-react-native';

import { HeroLandingScreen } from "../screens/HeroLandingScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { SandboxScreen } from "../screens/SandboxScreen";
import { SentimentScreen } from "../screens/SentimentScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { BorderThemeSettingsScreen } from "../screens/BorderThemeSettingsScreen";
import { WalletScreen } from "../screens/WalletScreen";
import { CloudFind } from "../screens/CloudFind";
import { DataManagementScreen } from "../screens/DataManagementScreen";
import { ExperienceLevelSelector } from "../components/selectors/ExperienceLevelSelector";
import { ExperienceLevelService } from "../services/experienceLevelService";
import { UserOnboardingService } from "../services/userOnboardingService";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/SimpleAuthContext";
import { log } from "../utils/logger";

export type RootStackParamList = {
  Hero: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ExperienceLevel: undefined;
  About: undefined;
  Chat: undefined;
  Analytics: undefined;
  Sandbox: undefined;
  Sentiment: undefined;
  Profile: undefined;
  Settings: undefined;
  BorderThemeSettings: undefined;
  Wallet: undefined;
  Cloud: undefined;
  DataManagement: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const mobileTransition = TransitionPresets.SlideFromRightIOS;
const LottieLoader: React.FC<{ size?: number; isDarkMode?: boolean }> = ({ 
  size = 40,
  isDarkMode = false
}) => {
  return (
    <View style={{ width: size, height: size }}>
      <LottieView
        source={require('../../assets/Loading.json')}
        autoPlay
        loop
        style={{
          width: size,
          height: size,
        }}
      />
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { isAuthenticated, loading, user } = useAuth();
  const navigationRef = useRef<any>(null);
  
  // Prevent navigation resets during component re-renders
  const hasInitialized = useRef(false);
  
  
  const [loadingMessageIndex, setLoadingMessageIndex] = React.useState(0);
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const loadingMessages = [
    "Tip: Swipe down to refresh a view",
    "Initializing neural network topology",
    "Compiling human consciousness drivers",
    "Calibrating dopamine receptors", 
    "Bootstrapping empathy algorithms",
    "Optimizing cognitive load balancers",
    "Syncing with the collective unconscious",
    "Deploying wisdom microservices",
    "Training existential crisis handlers",
    "Refactoring your inner monologue",
    "Scaling emotional intelligence clusters",
    "Debugging recursive thought loops",
    "Migrating memories to the cloud",
    "Implementing psychological design patterns",
    "Hot-reloading personality modules",
    "Orchestrating behavioral containers",
    "Patching reality perception bugs"
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        Animated.timing(flipAnimation, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }).start(() => {
          setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
          
          flipAnimation.setValue(-1);
          Animated.timing(flipAnimation, {
            toValue: 0,
            duration: 90,
            useNativeDriver: true,
          }).start();
        });
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [loading, loadingMessages.length]);

  const safeGoBack = (navigation: any) => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If can't go back, navigate to a safe default screen
      navigation.navigate('Hero');
    }
  };

  const createMenuHandler = (navigation: any) => (key: string) => {
    switch (key) {
      case 'chat': 
        if (isAuthenticated) navigation.navigate('Chat'); 
        break;
      case 'analytics': 
        if (isAuthenticated) navigation.navigate('Analytics'); 
        break;
      case 'sandbox':
        if (isAuthenticated) navigation.navigate('Sandbox');
        break;
      case 'cloud': 
        if (isAuthenticated) navigation.navigate('Cloud'); 
        break;
      case 'wallet': 
        if (isAuthenticated) navigation.navigate('Wallet'); 
        break;
      case 'profile': 
        if (isAuthenticated) navigation.navigate('Profile'); 
        break;
      case 'settings': 
        navigation.navigate('Settings'); // Always allow settings
        break;
      case 'about': 
        navigation.navigate('About'); // Always allow about
        break;
      case 'signout': {
        log.info('User signed out - routing will handle navigation to Hero', null, 'AppNavigator');
        break;
      }
      default: break;
    }
  };

  const prevAuthState = useRef(isAuthenticated);
  const hasNavigated = useRef(false);
  
  useEffect(() => {
    // CRITICAL FIX: Only run auth routing logic when auth state actually changes
    const authStateChanged = prevAuthState.current !== isAuthenticated;
    
    if (!authStateChanged || !hasInitialized.current) {
      // No auth change or not yet initialized - don't run routing logic to prevent loops
      if (!hasInitialized.current) {
        log.debug('Initial render, skipping routing logic', null, 'AppNavigator');
        hasInitialized.current = true;
        prevAuthState.current = isAuthenticated;
      } else {
        log.debug('No auth state change, skipping routing logic', null, 'AppNavigator');
      }
      return;
    }
    
    log.info('Auth state changed', { from: prevAuthState.current, to: isAuthenticated }, 'AppNavigator');
    
    // Only run when navigationRef is ready and not during initial load
    if (navigationRef.current && !loading) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      
      prevAuthState.current = isAuthenticated;
      
      // Small delay to allow explicit navigation to take precedence
      setTimeout(() => {
        const currentRouteAfterDelay = navigationRef.current?.getCurrentRoute()?.name;
        
        if (isAuthenticated && currentRouteAfterDelay !== 'Chat' && currentRouteAfterDelay !== 'ExperienceLevel' && currentRouteAfterDelay !== 'SignUp' && currentRouteAfterDelay !== 'SignIn') {
          // Only auto-route if NOT coming from signup (signup has explicit navigation)
          log.debug('Authenticated user detected', { currentRoute: currentRouteAfterDelay }, 'AppNavigator');
          
          // Check if user needs experience level selection (new users only)
          if (user?.id) {
            UserOnboardingService.shouldShowExperienceLevel(user.id).then((shouldShow) => {
              if (shouldShow) {
                log.info('New user needs experience level selection - redirecting', null, 'AppNavigator');
                navigationRef.current?.reset({
                  index: 0,
                  routes: [{ name: 'ExperienceLevel' }],
                });
              } else {
                log.info('Existing user authenticated, navigating to Sandbox', null, 'AppNavigator');
                navigationRef.current?.reset({
                  index: 0,
                  routes: [{ name: 'Sandbox' }],
                });
              }
            });
          }
        } else if (!isAuthenticated && hasNavigated.current && currentRouteAfterDelay !== 'Hero' && currentRouteAfterDelay !== 'SignUp' && currentRouteAfterDelay !== 'ExperienceLevel') {
          log.info('User logged out, returning to Hero', null, 'AppNavigator');
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: 'Hero' }],
          });
        }
        
        hasNavigated.current = true;
      }, 50);
    } else {
      log.warn('Navigation not ready, deferring routing', null, 'AppNavigator');
      prevAuthState.current = isAuthenticated;
    }
  }, [isAuthenticated, loading]);

  const rotateX = flipAnimation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const opacity = flipAnimation.interpolate({
    inputRange: [-1, -0.5, 0, 0.5, 1],
    outputRange: [0, 1, 1, 1, 0],
  });

  // CRITICAL FIX: Don't unmount NavigationContainer during loading to prevent navigation reset

  // log.debug('About to render NavigationContainer', null, 'AppNavigator');
  
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer 
        key="main-navigation" // Prevent complete re-initialization
      ref={(ref) => {
        navigationRef.current = ref;
        // log.debug('Navigation container ref set', { ready: !!ref }, 'AppNavigator');
        // if (ref) {
        //   const currentRoute = ref.getCurrentRoute()?.name;
        //   console.log('🏗️ NAVIGATION CONTAINER: Initial route after ref set:', currentRoute);
        // }
      }}
      onReady={() => {
        if (navigationRef.current) {
          const currentRoute = navigationRef.current.getCurrentRoute()?.name;
        }
      }}
      onStateChange={(state) => {
        if (navigationRef.current) {
          const currentRoute = navigationRef.current.getCurrentRoute()?.name;
        }
      }}

    >
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator
        initialRouteName="Hero"
        screenOptions={{
          headerShown: false,
          ...mobileTransition,
          cardStyle: { 
            backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff' 
          },
        }}
      >
        <Stack.Screen
          name="Hero"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => {
            return (
              <HeroLandingScreen
                onNavigateToExperience={() => navigation.navigate("ExperienceLevel")}
                onNavigateToSignIn={() => {
                  navigation.navigate("SignIn");
                }}
              />
            );
          }}
        </Stack.Screen>

        <Stack.Screen
          name="Welcome"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <WelcomeScreen
              onNavigateBack={() => safeGoBack(navigation)}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="SignIn"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <SignInScreen
              onNavigateBack={() => {
                safeGoBack(navigation);
              }}
              onSignInSuccess={() => {
                // Navigate directly to Sandbox after successful login
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Sandbox' }],
                });
              }}
              onNavigateToSignUp={() => {
                navigation.navigate("SignUp");
              }}
              onNavigateToHero={() => {
                navigation.navigate("Hero");
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="SignUp"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <SignUpScreen
              onNavigateBack={() => safeGoBack(navigation)}
              onSignUpSuccess={() => {
                // Immediate navigation to prevent auth routing from interfering
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ExperienceLevel' }],
                });
              }}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="ExperienceLevel"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <ExperienceLevelSelector
              onSelectionComplete={async (level) => {
                console.log('✅ EXPERIENCE LEVEL SELECTED:', level);
                await ExperienceLevelService.setExperienceLevel(level);
                
                // Mark onboarding as completed for this user
                if (user?.id) {
                  await UserOnboardingService.markOnboardingCompleted(user.id);
                }
                
                console.log('💾 Experience level saved, navigating to Sandbox');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Sandbox' }],
                });
              }}
              onSignUp={() => navigation.navigate('SignUp')}
              onSignIn={() => navigation.navigate('SignIn')}
              // onSkip removed - experience level selection is now MANDATORY for all users
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="About"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <AboutScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Chat"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <ChatScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Analytics"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <AnalyticsScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="DataManagement"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <DataManagementScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Sandbox"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <SandboxScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Sentiment"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <SentimentScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Profile"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <ProfileScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Settings"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <SettingsScreen 
              onNavigateBack={() => safeGoBack(navigation)}
              onNavigateToSignIn={() => navigation.navigate('SignIn')}
              onNavigateToBorderThemes={() => navigation.navigate('BorderThemeSettings')}
              onNavigateToDataManagement={() => navigation.navigate('DataManagement')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="BorderThemeSettings"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <BorderThemeSettingsScreen 
              navigation={navigation}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Wallet"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <WalletScreen 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Cloud"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <CloudFind 
              onNavigateBack={() => safeGoBack(navigation)}
            />
          )}
        </Stack.Screen>


      </Stack.Navigator>
    </NavigationContainer>
    
    {/* Loading overlay - only for app initialization, not form validation */}
    {loading && (
      <View style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDarkMode ? '#0a0a0a' : '#ffffff',
        zIndex: 1000,
        pointerEvents: 'box-none', // Allow touches to pass through when appropriate
      }}>
        <LottieLoader size={70} isDarkMode={isDarkMode} />
        <Animated.Text style={{
          marginTop: 16,
          fontSize: 11,
          color: isDarkMode ? '#888888' : '#666666',
          fontWeight: '400',
          textAlign: 'center',
          paddingHorizontal: 40,
          transform: [{ rotateX }],
          opacity,
        }}>
          {loadingMessages[loadingMessageIndex]}
        </Animated.Text>
      </View>
    )}
  </View>
  );
};