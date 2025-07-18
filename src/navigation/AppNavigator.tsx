import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { StatusBar, View, Text, ActivityIndicator, Platform } from "react-native";

// Screens
import { HeroLandingScreen } from "../screens/HeroLandingScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { TutorialScreen } from "../screens/TutorialScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { WalletScreen } from "../screens/WalletScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { CloudScreen } from "../screens/CloudScreen";
import { SentimentScreen } from "../screens/SentimentScreen";

// Contexts
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/SimpleAuthContext";


export type RootStackParamList = {
  Hero: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Tutorial: undefined;
  Chat: undefined;
  Analytics: undefined;
  Cloud: undefined;
  Wallet: undefined;
  Sentiment: undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Desktop-optimized transitions: instant/fade for web, iOS slide for mobile
const desktopTransition = {
  cardStyleInterpolator: ({ current, layouts }: any) => {
    return {
      cardStyle: {
        opacity: current.progress,
        transform: [],
        backgroundColor: 'transparent', // Let the theme handle background
      },
    };
  },
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 150,
      },
    },
    close: {
      animation: 'timing', 
      config: {
        duration: 100,
      },
    },
  },
  gestureEnabled: false,
};

const mobileTransition = {
  ...TransitionPresets.SlideFromRightIOS,
  gestureEnabled: true,
};

const platformTransition = Platform.OS === 'web' ? desktopTransition : mobileTransition;

export const AppNavigator: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isAuthenticated, isInitializing, logout } = useAuth();
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string>('');

  // Reusable menu handler with signout support
  const createMenuHandler = (navigation: any) => (key: string) => {
    switch (key) {
      case 'chat': navigation.navigate('Chat'); break;
      case 'analytics': navigation.navigate('Analytics'); break;
      case 'sentiment': navigation.navigate('Sentiment'); break;
      case 'cloud': navigation.navigate('Cloud'); break;
      case 'wallet': navigation.navigate('Wallet'); break;
      case 'profile': navigation.navigate('Profile'); break;
      case 'settings': navigation.navigate('Settings'); break;
      case 'about': navigation.navigate('About'); break;
      case 'signout': {
        console.log('🔓 MENU: User signed out - routing will handle navigation to Hero');
        logout();
        break;
      }
      default: break;
    }
  };

  // Handle authentication state changes - MINIMAL resets to preserve navigation stack
  useEffect(() => {
    if (!isInitializing && navigationRef.current) {
      const currentRoute = routeNameRef.current;
      
      if (!isAuthenticated) {
        // User signed out - only reset if coming from authenticated screens
        if (currentRoute === 'Chat' || currentRoute === 'Analytics' || currentRoute === 'Profile' || currentRoute === 'Wallet') {
          console.log('🔄 AUTH ROUTING: User logged out, returning to Hero');
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Hero' }],
          });
        }
      } else if (isAuthenticated) {
        // User signed in successfully - use navigate to preserve stack
        if (currentRoute === 'SignIn' || currentRoute === 'SignUp') {
          console.log('🔄 AUTH ROUTING: User authenticated, navigating to Chat');
          navigationRef.current.navigate('Chat');
        }
      }
    }
  }, [isAuthenticated, isInitializing]);

  // Show loading screen while checking authentication
  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000000",
        }}
      >
        <ActivityIndicator
          size="large"
          color={isDarkMode ? "#ffffff" : "#000000"}
        />
        <Text
          style={{
            marginTop: 16,
            color: isDarkMode ? "#ffffff" : "#000000",
            fontSize: 16,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        dark: isDarkMode,
        colors: {
          primary: '#6ec5ff',
          background: isDarkMode ? '#000000' : '#ffffff',
          card: isDarkMode ? '#000000' : '#ffffff',
          text: isDarkMode ? '#ffffff' : '#000000',
          border: isDarkMode ? '#333333' : '#e5e5e5',
          notification: '#ff6b6b',
        },
      }}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name || '';
        console.log('🚀 NAVIGATION READY:', routeNameRef.current);
      }}
      onStateChange={(state) => {
        const previousRoute = routeNameRef.current;
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name || '';
        console.log('🔄 NAVIGATION STATE CHANGE:', {
          from: previousRoute,
          to: routeNameRef.current,
          stackLength: state?.routes?.length || 0,
          routes: state?.routes?.map(r => r.name) || []
        });
      }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Chat" : "Hero"}
        screenOptions={{
          headerShown: false,
          ...platformTransition,
        }}
      >
        <Stack.Screen
          name="Hero"
          options={{
            ...platformTransition,
            gestureEnabled: false, // Disable back gesture on root screen
          }}
        >
          {({ navigation }) => (
            <HeroLandingScreen
              onNavigateToTutorial={() => navigation.navigate("Tutorial")}
              onNavigateToSignIn={() => {
                console.log('➡️ NAVIGATING TO SIGNIN from Hero');
                navigation.navigate("SignIn");
              }}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Welcome"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <WelcomeScreen
              onNavigateBack={() => navigation.goBack()}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="SignIn"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <SignInScreen
              onNavigateBack={() => {
                console.log('🔙 BACK BUTTON PRESSED - calling navigation.goBack()');
                navigation.goBack();
              }}
              onSignInSuccess={() => navigation.navigate("Chat")}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
              onNavigateToHero={() => navigation.navigate("Hero")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="SignUp"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <SignUpScreen
              onNavigateBack={() => navigation.goBack()}
              onSignUpSuccess={() => navigation.navigate("Chat")}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Tutorial"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <TutorialScreen
              onNavigateHome={() => navigation.navigate("Hero")}
              onStartChat={() => navigation.navigate("SignUp")}
              onTitlePress={() => navigation.navigate("Hero")}
              onMenuPress={(key: string) => {
                switch (key) {
                  case 'settings': navigation.navigate('Settings'); break;
                  case 'about': navigation.navigate('About'); break;
                  default: break;
                }
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Chat"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <ChatScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Analytics"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <AnalyticsScreen 
              onNavigateBack={() => navigation.goBack()}
              onTitlePress={isAuthenticated ? () => navigation.navigate("Chat") : () => navigation.navigate("Hero")}
              onMenuPress={(key: string) => {
                switch (key) {
                  case 'chat': navigation.navigate('Chat'); break;
                  case 'analytics': navigation.navigate('Analytics'); break;
                  case 'sentiment': navigation.navigate('Sentiment'); break;
                  case 'cloud': navigation.navigate('Cloud'); break;
                  case 'wallet': navigation.navigate('Wallet'); break;
                  case 'profile': navigation.navigate('Profile'); break;
                  case 'settings': navigation.navigate('Settings'); break;
                  case 'about': navigation.navigate('About'); break;
                  default: break;
                }
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Cloud"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <CloudScreen 
              onNavigateBack={() => navigation.goBack()}
              onTitlePress={isAuthenticated ? () => navigation.navigate("Chat") : () => navigation.navigate("Hero")}
              onMenuPress={(key: string) => {
                switch (key) {
                  case 'chat': navigation.navigate('Chat'); break;
                  case 'analytics': navigation.navigate('Analytics'); break;
                  case 'sentiment': navigation.navigate('Sentiment'); break;
                  case 'cloud': navigation.navigate('Cloud'); break;
                  case 'wallet': navigation.navigate('Wallet'); break;
                  case 'profile': navigation.navigate('Profile'); break;
                  case 'settings': navigation.navigate('Settings'); break;
                  case 'about': navigation.navigate('About'); break;
                  default: break;
                }
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Wallet"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <WalletScreen 
              onNavigateBack={() => navigation.goBack()}
              onTitlePress={isAuthenticated ? () => navigation.navigate("Chat") : () => navigation.navigate("Hero")}
              onMenuPress={(key: string) => {
                switch (key) {
                  case 'chat': navigation.navigate('Chat'); break;
                  case 'analytics': navigation.navigate('Analytics'); break;
                  case 'sentiment': navigation.navigate('Sentiment'); break;
                  case 'cloud': navigation.navigate('Cloud'); break;
                  case 'wallet': navigation.navigate('Wallet'); break;
                  case 'profile': navigation.navigate('Profile'); break;
                  case 'settings': navigation.navigate('Settings'); break;
                  case 'about': navigation.navigate('About'); break;
                  default: break;
                }
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Sentiment"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <SentimentScreen 
              onNavigateBack={() => navigation.goBack()}
              onTitlePress={isAuthenticated ? () => navigation.navigate("Chat") : () => navigation.navigate("Hero")}
              onMenuPress={(key: string) => {
                switch (key) {
                  case 'chat': navigation.navigate('Chat'); break;
                  case 'analytics': navigation.navigate('Analytics'); break;
                  case 'sentiment': navigation.navigate('Sentiment'); break;
                  case 'cloud': navigation.navigate('Cloud'); break;
                  case 'wallet': navigation.navigate('Wallet'); break;
                  case 'profile': navigation.navigate('Profile'); break;
                  case 'settings': navigation.navigate('Settings'); break;
                  case 'about': navigation.navigate('About'); break;
                  default: break;
                }
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Profile"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <ProfileScreen 
              onNavigateBack={() => navigation.goBack()}
              onTitlePress={isAuthenticated ? () => navigation.navigate("Chat") : () => navigation.navigate("Hero")}
              onMenuPress={createMenuHandler(navigation)}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Settings"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <SettingsScreen 
              onNavigateBack={() => navigation.goBack()}
              onTitlePress={isAuthenticated ? () => navigation.navigate("Chat") : () => navigation.navigate("Hero")}
              onMenuPress={(key: string) => {
                switch (key) {
                  case 'chat': navigation.navigate('Chat'); break;
                  case 'analytics': navigation.navigate('Analytics'); break;
                  case 'sentiment': navigation.navigate('Sentiment'); break;
                  case 'cloud': navigation.navigate('Cloud'); break;
                  case 'wallet': navigation.navigate('Wallet'); break;
                  case 'profile': navigation.navigate('Profile'); break;
                  case 'settings': navigation.navigate('Settings'); break;
                  case 'about': navigation.navigate('About'); break;
                  default: break;
                }
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="About"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <AboutScreen 
              onNavigateBack={() => navigation.goBack()}
              onTitlePress={isAuthenticated ? () => navigation.navigate("Chat") : () => navigation.navigate("Hero")}
              onMenuPress={(key: string) => {
                switch (key) {
                  case 'chat': navigation.navigate('Chat'); break;
                  case 'analytics': navigation.navigate('Analytics'); break;
                  case 'sentiment': navigation.navigate('Sentiment'); break;
                  case 'cloud': navigation.navigate('Cloud'); break;
                  case 'wallet': navigation.navigate('Wallet'); break;
                  case 'profile': navigation.navigate('Profile'); break;
                  case 'settings': navigation.navigate('Settings'); break;
                  case 'about': navigation.navigate('About'); break;
                  default: break;
                }
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
