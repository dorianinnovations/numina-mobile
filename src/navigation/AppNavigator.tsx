import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import { StatusBar, View, Text, ActivityIndicator, Platform } from "react-native";

// Screens
import { HeroLandingScreen } from "../screens/HeroLandingScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { SignInScreen } from "../screens/SignInScreen";
import { SignUpScreen } from "../screens/SignUpScreen";
import { AboutScreen } from "../screens/AboutScreen";
import { ChatScreen } from "../screens/ChatScreen";
import { AnalyticsScreen } from "../screens/AnalyticsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { WalletScreen } from "../screens/WalletScreen";
import { CloudScreen } from "../screens/CloudScreen";
import { SentimentScreen } from "../screens/SentimentScreen";
import { TutorialScreen } from "../screens/TutorialScreen";

// Contexts
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/SimpleAuthContext";

export type RootStackParamList = {
  Hero: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  About: undefined;
  Chat: undefined;
  Analytics: undefined;
  Profile: undefined;
  Settings: undefined;
  Wallet: undefined;
  Cloud: undefined;
  Sentiment: undefined;
  Tutorial: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Native mobile transitions only
const mobileTransition = TransitionPresets.SlideFromRightIOS;

export const AppNavigator: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = useRef<any>(null);

  // Complete menu handler with all navigation options
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
        // CloudAuth handles logout and isAuthenticated state change
        break;
      }
      default: break;
    }
  };

  useEffect(() => {
    if (navigationRef.current && !loading) {
      const currentRoute = navigationRef.current.getCurrentRoute()?.name;
      console.log('🔄 AUTH ROUTING: Current route:', currentRoute, 'isAuthenticated:', isAuthenticated);
      
      if (isAuthenticated) {
        // User is authenticated - go to main app (Chat screen)
        console.log('🔄 AUTH ROUTING: User authenticated, navigating to Chat');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Chat' }],
        });
      } else {
        // User signed out - reset to Hero
        console.log('🔄 AUTH ROUTING: User logged out, returning to Hero');
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'Hero' }],
        });
      }
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc',
        paddingHorizontal: 20,
      }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#6ec5ff' : '#add5fa'} />
        <Text style={{ 
          color: isDarkMode ? '#ffffff' : '#1a202c', 
          marginTop: 16,
          fontSize: 16,
          fontWeight: '500',
          textAlign: 'center',
        }}>
          Connecting...
        </Text>
        <Text style={{ 
          color: isDarkMode ? '#a0aec0' : '#718096', 
          marginTop: 8,
          fontSize: 14,
          textAlign: 'center',
        }}>
          Setting up your secure session
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
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
        }}
      >
        <Stack.Screen
          name="Hero"
          options={{
            ...mobileTransition,
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
                console.log('🔙 BACK BUTTON PRESSED - calling navigation.goBack()');
                navigation.goBack();
              }}
              onSignInSuccess={() => navigation.navigate("Hero")}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
              onNavigateToHero={() => navigation.navigate("Hero")}
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
              onSignUpSuccess={() => navigation.navigate("Hero")}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
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
              onTitlePress={() => navigation.navigate("Hero")}
              onMenuPress={createMenuHandler(navigation)}
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
          name="Tutorial"
          options={{
            ...mobileTransition,
          }}
        >
          {({ navigation }) => (
            <TutorialScreen 
              onNavigateHome={() => navigation.navigate("Hero")}
              onStartChat={() => navigation.navigate("SignUp")}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};