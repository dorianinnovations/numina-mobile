import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar, View, Text, ActivityIndicator } from "react-native";

// Screens
import { HeroLandingScreen } from "../screens/HeroLandingScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { TutorialScreen } from "../screens/TutorialScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { StratosphereScreen } from "../screens/StratosphereScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { CloudScreen } from "../screens/CloudScreen";
import { CollectiveScreen } from "../screens/CollectiveScreen";

// Contexts
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";


export type RootStackParamList = {
  Hero: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Tutorial: undefined;
  Chat: undefined;
  Analytics: undefined;
  Cloud: undefined;
  Stratosphere: undefined;
  Collective: undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Custom slide transition configuration
const slideTransition = {
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
  gestureResponseDistance: {
    horizontal: 25, // Lower value for quicker response
  },
  gestureVelocityImpact: 0.3, // Smooth velocity handling
  transitionSpec: {
    open: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: 'spring',
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};

export const AppNavigator: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isAuthenticated, isInitializing } = useAuth();
  const navigationRef = useRef<any>(null);
  const routeNameRef = useRef<string>('');

  // Handle authentication state changes
  useEffect(() => {
    if (!isInitializing && navigationRef.current) {
      if (!isAuthenticated) {
        // User signed out, navigate to Hero
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Hero' }],
        });
      } else if (isAuthenticated && routeNameRef.current === 'Hero') {
        // User signed in from Hero, navigate to Chat
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Chat' }],
        });
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
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name || '';
      }}
      onStateChange={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name || '';
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
          ...slideTransition,
        }}
      >
        <Stack.Screen
          name="Hero"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <HeroLandingScreen
              onNavigateToTutorial={() => navigation.navigate("Tutorial")}
              onNavigateToLogin={() => navigation.navigate("Welcome")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Welcome"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <WelcomeScreen
              onNavigateBack={() => navigation.navigate("Hero")}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="SignIn"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <SignInScreen
              onNavigateBack={() => navigation.navigate("Welcome")}
              onSignInSuccess={() => navigation.navigate("Chat")}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
              onNavigateToHero={() => navigation.navigate("Hero")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="SignUp"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <SignUpScreen
              onNavigateBack={() => navigation.navigate("Welcome")}
              onSignUpSuccess={() => navigation.navigate("Chat")}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Tutorial"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <TutorialScreen
              onNavigateHome={() => navigation.navigate("Hero")}
              onStartChat={() => navigation.navigate("SignUp")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Chat"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <ChatScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Analytics"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <AnalyticsScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Cloud"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <CloudScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Stratosphere"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <StratosphereScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Collective"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <CollectiveScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Profile"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <ProfileScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Settings"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <SettingsScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="About"
          options={{
            ...slideTransition,
          }}
        >
          {({ navigation }) => (
            <AboutScreen onNavigateBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
