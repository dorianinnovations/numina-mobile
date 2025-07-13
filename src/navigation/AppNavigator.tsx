import React from "react";
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
  Stratosphere: undefined;
  Profile: undefined;
  Settings: undefined;
  About: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Custom slide transition configuration
const slideTransition = {
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
};

export const AppNavigator: React.FC = () => {
  const { isDarkMode } = useTheme();
  const { isAuthenticated, isInitializing } = useAuth();

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
    <NavigationContainer>
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
              onStartChat={() => navigation.navigate("SignIn")}
            />
          )}
        </Stack.Screen>

        <Stack.Screen
          name="Chat"
          options={{
            ...slideTransition,
            gestureEnabled: false, // Disable gesture for chat screen
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
