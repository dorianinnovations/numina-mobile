import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { StatusBar, View, Text, ActivityIndicator, Platform, Animated } from "react-native";
import Svg, { Circle } from 'react-native-svg';
import { EnhancedSpinner } from '../components/EnhancedSpinner';

import { HeroLandingScreen } from "../screens/HeroLandingScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { ModernAnalyticsScreen } from "../screens/ModernAnalyticsScreen";
import { SentimentScreen } from "../screens/SentimentScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { WalletScreen } from "../screens/WalletScreen";
import { CloudScreen } from "../screens/CloudScreen";
import { TutorialScreen } from "../screens/TutorialScreen";
import { ExperienceLevelSelector } from "../components/ExperienceLevelSelector";
import { ExperienceLevelService } from "../services/experienceLevelService";
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
  ModernAnalytics: undefined;
  Sentiment: undefined;
  Profile: undefined;
  Settings: undefined;
  Wallet: undefined;
  Cloud: undefined;
  Tutorial: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const mobileTransition = TransitionPresets.SlideFromRightIOS;
const FastRingLoader: React.FC<{ size?: number; color?: string; strokeWidth?: number }> = ({ 
  size = 18, 
  color = '#6ec5ff', 
  strokeWidth = 2 
}) => {
  const rotationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ).start();
    };
    
    startRotation();
  }, [rotationValue]);

  const rotation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference * 0.8;
  const strokeDashoffset = circumference * 0.2;

  return (
    <Animated.View style={{ 
      transform: [{ rotate: rotation }],
      width: size,
      height: size,
    }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
    </Animated.View>
  );
};

export const AppNavigator: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = useRef<any>(null);
  
  // Prevent navigation resets during component re-renders
  const hasInitialized = useRef(false);
  
  log.debug('Component rendering', { isAuthenticated, loading, hasInitialized: hasInitialized.current }, 'AppNavigator');
  
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
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
          
          flipAnimation.setValue(-1);
          Animated.timing(flipAnimation, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading, loadingMessages.length]);

  const createMenuHandler = (navigation: any) => (key: string) => {
    switch (key) {
      case 'chat': navigation.navigate('Chat'); break;
      case 'analytics': navigation.navigate('Analytics'); break;
      case 'cloud': navigation.navigate('Cloud'); break;
      case 'wallet': navigation.navigate('Wallet'); break;
      case 'profile': navigation.navigate('Profile'); break;
      case 'settings': navigation.navigate('Settings'); break;
      case 'about': navigation.navigate('About'); break;
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
        
        if (isAuthenticated && currentRouteAfterDelay !== 'Chat' && currentRouteAfterDelay !== 'ExperienceLevel' && currentRouteAfterDelay !== 'SignUp') {
          // Only auto-route if NOT coming from signup (signup has explicit navigation)
          log.debug('Authenticated user detected', { currentRoute: currentRouteAfterDelay }, 'AppNavigator');
          
          // Check if user has set experience level - MANDATORY for all authenticated users
          ExperienceLevelService.hasSetExperienceLevel().then((hasSet) => {
            if (!hasSet) {
              log.info('User MUST set experience level - redirecting', null, 'AppNavigator');
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: 'ExperienceLevel' }],
              });
            } else {
              log.info('User authenticated with experience level, navigating to Chat', null, 'AppNavigator');
              navigationRef.current?.reset({
                index: 0,
                routes: [{ name: 'Chat' }],
              });
            }
          });
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

  log.debug('About to render NavigationContainer', null, 'AppNavigator');
  
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer 
        key="main-navigation" // Prevent complete re-initialization
      ref={(ref) => {
        navigationRef.current = ref;
        log.debug('Navigation container ref set', { ready: !!ref }, 'AppNavigator');
        if (ref) {
          const currentRoute = ref.getCurrentRoute()?.name;
          console.log('🏗️ NAVIGATION CONTAINER: Initial route after ref set:', currentRoute);
        }
      }}
      onReady={() => {
        console.log('🏗️ NAVIGATION CONTAINER: onReady called');
        if (navigationRef.current) {
          const currentRoute = navigationRef.current.getCurrentRoute()?.name;
          console.log('🏗️ NAVIGATION CONTAINER: Current route on ready:', currentRoute);
        }
      }}
      onStateChange={(state) => {
        if (navigationRef.current) {
          const currentRoute = navigationRef.current.getCurrentRoute()?.name;
          console.log('🏗️ NAVIGATION CONTAINER: State changed, current route:', currentRoute);
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
        {(() => { console.log('🏗️ STACK NAVIGATOR: Rendering with initialRouteName: Hero'); return null; })()}
        <Stack.Screen
          name="Hero"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => {
            console.log('🏠 HERO STACK SCREEN: Rendering HeroLandingScreen');
            return (
              <HeroLandingScreen
                onNavigateToTutorial={() => navigation.navigate("Tutorial")}
                onNavigateToSignIn={() => {
                  console.log('➡️ NAVIGATING TO SIGNIN from Hero');
                  navigation.navigate("SignIn");
                }}
                onNavigateToSignUp={() => navigation.navigate("SignUp")}
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
              onNavigateBack={() => navigation.goBack()}
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
                console.log('🔙 SIGNIN: Back button pressed - calling navigation.goBack()');
                navigation.goBack();
              }}
              onSignInSuccess={() => {
                console.log('✅ SIGNIN: Login success callback - letting auth state handle navigation');
              }}
              onNavigateToSignUp={() => {
                console.log('📝 SIGNIN: Navigate to SignUp');
                navigation.navigate("SignUp");
              }}
              onNavigateToHero={() => {
                console.log('🏠 SIGNIN: Navigate to Hero');
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
              onNavigateBack={() => navigation.goBack()}
              onSignUpSuccess={() => {
                console.log('✅ SIGNUP SUCCESS - MANDATORY experience level selection required');
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
                console.log('💾 Experience level saved, navigating to Chat');
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Chat' }],
                });
              }}
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
              onNavigateBack={() => navigation.goBack()}
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
              onNavigateBack={() => navigation.goBack()}
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
              onNavigateBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="ModernAnalytics"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <ModernAnalyticsScreen 
              onNavigateBack={() => navigation.goBack()}
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
              onNavigateBack={() => navigation.goBack()}
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
              onNavigateBack={() => navigation.goBack()}
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
              onNavigateBack={() => navigation.goBack()}
              onNavigateToSignIn={() => navigation.navigate('SignIn')}
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
              onNavigateBack={() => navigation.goBack()}
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
            <CloudScreen 
              onNavigateBack={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Tutorial"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <TutorialScreen 
              onNavigateHome={() => navigation.navigate("Hero")}
              onStartChat={() => navigation.navigate("SignUp")}
              onTitlePress={() => navigation.navigate("Hero")}
              onMenuPress={createMenuHandler(navigation)}
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
        <EnhancedSpinner 
          size={24} 
          type="holographic"
          strokeWidth={2}
        />
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