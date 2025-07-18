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

// Contexts
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/SimpleAuthContext";

export type RootStackParamList = {
  Hero: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
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
      },
    };
  },
  transitionSpec: {
    open: {
      animation: "timing",
      config: {
        duration: 200,
      },
    },
    close: {
      animation: "timing",
      config: {
        duration: 200,
      },
    },
  },
};

// Use desktop transition for web, iOS slide for mobile
const platformTransition = Platform.OS === 'web' ? desktopTransition : TransitionPresets.SlideFromRightIOS;

export const AppNavigator: React.FC = () => {
  const { theme, isDarkMode } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = useRef<any>(null);

  // Simple menu handler
  const createMenuHandler = (navigation: any) => (key: string) => {
    switch (key) {
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
      
      if (!isAuthenticated) {
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDarkMode ? '#000000' : '#ffffff' }}>
        <ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#000000'} />
        <Text style={{ color: isDarkMode ? '#ffffff' : '#000000', marginTop: 10 }}>Loading...</Text>
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
          ...platformTransition,
        }}
      >
        <Stack.Screen
          name="Hero"
          options={{
            ...platformTransition,
          }}
        >
          {({ navigation }) => (
            <HeroLandingScreen
              onNavigateToTutorial={() => navigation.navigate("Welcome")}
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
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
              onNavigateToSignUp={() => navigation.navigate("SignUp")}
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
              onSignInSuccess={() => navigation.navigate("Hero")}
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
              onSignUpSuccess={() => navigation.navigate("Hero")}
              onNavigateToSignIn={() => navigation.navigate("SignIn")}
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
              onTitlePress={() => navigation.navigate("Hero")}
              onMenuPress={createMenuHandler(navigation)}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};